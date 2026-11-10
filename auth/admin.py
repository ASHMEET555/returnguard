"""Admin authentication and session management for ReturnGuard."""

import hmac
import os
import secrets
import time
from typing import Dict, List, Optional, Tuple
import threading
from fastapi import Cookie, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

ADMIN_TOKEN_ENV = "RG_ADMIN_TOKEN"
ADMIN_SESSION_COOKIE_NAME = "rg_admin_session"
SESSION_LIFETIME_SECONDS = 8 * 3600  # 8 hours


class AdminLoginRequest(BaseModel):
    token: str = Field(..., description="Administrator secret token")


class AdminSessionResponse(BaseModel):
    status: str = "authenticated"
    expires_in: int = SESSION_LIFETIME_SECONDS


# In-memory sliding window rate limiter for admin login (5 attempts per minute per IP)
class AdminRateLimiter:
    def __init__(self, limit: int = 5, window_seconds: float = 60.0):
        self.limit = limit
        self.window_seconds = window_seconds
        self._lock = threading.Lock()
        self._history: Dict[str, List[float]] = {}

    def check_and_record(self, ip: str) -> Tuple[bool, int]:
        now = time.time()
        cutoff = now - self.window_seconds
        with self._lock:
            timestamps = self._history.get(ip, [])
            valid_timestamps = [ts for ts in timestamps if ts > cutoff]
            if len(valid_timestamps) >= self.limit:
                oldest = valid_timestamps[0]
                retry_after = max(1, int(self.window_seconds - (now - oldest)))
                self._history[ip] = valid_timestamps
                return False, retry_after

            valid_timestamps.append(now)
            self._history[ip] = valid_timestamps
            return True, 0

    def clear(self):
        with self._lock:
            self._history.clear()


admin_rate_limiter = AdminRateLimiter(limit=5, window_seconds=60.0)

# In-memory session store: session_id -> expiration_timestamp
_sessions: Dict[str, float] = {}
_session_lock = threading.Lock()


def create_admin_session() -> str:
    session_id = secrets.token_urlsafe(32)
    expires_at = time.time() + SESSION_LIFETIME_SECONDS
    with _session_lock:
        _sessions[session_id] = expires_at
    return session_id


def is_valid_admin_session(session_id: str) -> bool:
    if not session_id:
        return False
    now = time.time()
    with _session_lock:
        exp = _sessions.get(session_id)
        if exp is None:
            return False
        if now > exp:
            del _sessions[session_id]
            return False
        return True


def clear_all_admin_sessions():
    with _session_lock:
        _sessions.clear()


def invalidate_admin_session(session_id: str):
    with _session_lock:
        _sessions.pop(session_id, None)


def get_configured_admin_token() -> str:
    """
    Retrieves and validates RG_ADMIN_TOKEN from environment.
    Must be at least 32 characters.
    If unset or invalid, raises 503 Service Unavailable.
    """
    token = os.getenv(ADMIN_TOKEN_ENV, "").strip()
    if not token or len(token) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin access is disabled or RG_ADMIN_TOKEN is not configured (must be >= 32 chars).",
        )
    return token


def verify_admin_auth(
    request: Request,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    rg_admin_session: Optional[str] = Cookie(None, alias=ADMIN_SESSION_COOKIE_NAME),
) -> bool:
    """
    Verifies admin access:
    1. Validates RG_ADMIN_TOKEN is configured in environment (else 503).
    2. Accepts session cookie if valid.
    3. Accepts X-Admin-Token header (constant time hmac comparison).
    4. Accepts Authorization: Bearer <token> (constant time hmac comparison).
    5. If all fail, raises 401 Unauthorized.
    """
    configured_token = get_configured_admin_token()

    # 1. Check session cookie
    if rg_admin_session and is_valid_admin_session(rg_admin_session):
        return True

    # 2. Check X-Admin-Token header
    if x_admin_token and hmac.compare_digest(x_admin_token.encode("utf-8"), configured_token.encode("utf-8")):
        return True

    # 3. Check Authorization header
    if authorization:
        parts = authorization.strip().split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            bearer_token = parts[1].strip()
            if hmac.compare_digest(bearer_token.encode("utf-8"), configured_token.encode("utf-8")):
                return True

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing admin credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

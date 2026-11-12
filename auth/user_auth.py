"""SaaS User Authentication and Session Management Service."""

import datetime
import hashlib
import hmac
import json
import secrets
from typing import Optional, Tuple
from fastapi import Cookie, Depends, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from db.models import Merchant, SecurityAuditLog, User, UserSession
from db.session import get_db

USER_SESSION_COOKIE_NAME = "rg_user_session"
USER_SESSION_LIFETIME_SECONDS = 7 * 24 * 3600  # 7 days
PBKDF2_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with cryptographically secure salt."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    )
    return f"pbkdf2_sha256${salt}${dk.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against pbkdf2_sha256 hash in constant time."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3 or parts[0] != "pbkdf2_sha256":
            return False
        salt = parts[1]
        expected_dk = parts[2]
        actual_dk = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            PBKDF2_ITERATIONS,
        ).hex()
        return hmac.compare_digest(actual_dk, expected_dk)
    except Exception:
        return False


def record_security_audit(
    db: Session,
    event_type: str,
    merchant_id: str,
    outcome: str,
    actor_id: Optional[str] = None,
    target_resource: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[dict] = None,
):
    """Record immutable security audit log without recording sensitive secrets."""
    safe_details = None
    if details:
        # Strip any keys that might contain secrets
        cleaned = {
            k: v for k, v in details.items()
            if not any(s in k.lower() for s in ["password", "secret", "token", "key", "auth"])
        }
        safe_details = json.dumps(cleaned)

    audit_entry = SecurityAuditLog(
        id=f"sec_{secrets.token_hex(12)}",
        event_type=event_type,
        actor_id=actor_id,
        merchant_id=merchant_id,
        target_resource=target_resource,
        ip_address=ip_address,
        outcome=outcome,
        details_json=safe_details,
        created_at=datetime.datetime.now(datetime.UTC),
    )
    db.add(audit_entry)
    db.commit()


def get_current_user_and_session(
    rg_user_session: Optional[str] = Cookie(None, alias=USER_SESSION_COOKIE_NAME),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> Tuple[User, UserSession]:
    """
    FastAPI dependency to authenticate SaaS users via HTTP-only cookie or Bearer session token.
    Enforces expiration and active user status.
    """
    session_id = rg_user_session
    if not session_id and authorization:
        parts = authorization.strip().split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            session_id = parts[1].strip()

    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = datetime.datetime.now(datetime.UTC)
    session = (
        db.query(UserSession)
        .filter(UserSession.id == session_id, UserSession.expires_at > now)
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == session.user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or deleted.",
        )

    return user, session

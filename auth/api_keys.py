"""API Key authentication dependency for ReturnGuard API."""

import hashlib
import hmac
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from auth.ratelimit import get_rate_limiter
from db.models import APIKey
from db.session import get_db

# Constant generic 401 error message to prevent enumeration or leaking key status
GENERIC_UNAUTHORIZED_DETAIL = "Invalid or missing authentication credentials"


def get_api_key_merchant(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> str:
    """
    FastAPI dependency that authenticates incoming requests using Bearer API keys.

    1. Validates the Authorization header presence and format ('Bearer <key>').
    2. Computes SHA-256 hash of the provided plaintext secret.
    3. Looks up active, unrevoked key in the database by key_hash.
    4. Performs constant-time comparison via hmac.compare_digest.
    5. Evaluates rate limiting on api_key.id (HTTP 429 with Retry-After if exceeded).
    6. Returns the associated merchant_id.

    Any authentication failure raises HTTP 401 Unauthorized with identical generic detail.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.strip().split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    computed_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    # Query active, unrevoked key
    api_key = (
        db.query(APIKey)
        .filter(
            APIKey.key_hash == computed_hash,
            APIKey.is_active.is_(True),
            APIKey.revoked_at.is_(None),
        )
        .first()
    )

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Constant-time comparison to prevent timing side-channels
    if not hmac.compare_digest(api_key.key_hash, computed_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Rate limiting runs strictly AFTER authentication
    limiter = get_rate_limiter()
    is_allowed, retry_after = limiter.check(api_key.id)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    return api_key.merchant_id

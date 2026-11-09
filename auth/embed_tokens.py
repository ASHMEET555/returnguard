"""Embed Token authentication and token issuance for ReturnGuard SDK."""

import datetime
import os
import uuid
from typing import List, Optional

import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.api_keys import GENERIC_UNAUTHORIZED_DETAIL, get_api_key_merchant
from db.models import APIKey
from db.session import get_db

router = APIRouter(tags=["auth"])

EMBED_TOKEN_AUDIENCE = "returnguard-sdk"
EMBED_SIGNING_KEY_ENV = "RG_EMBED_SIGNING_KEY"
EMBED_EXPIRY_SECONDS = 600  # 10 minutes


class EmbedTokenRequest(BaseModel):
    sub: str = Field(..., description="End-user or session ID supplied by merchant")
    ttl_seconds: Optional[int] = Field(
        default=None, description="Optional custom TTL in seconds"
    )
    scopes: Optional[List[str]] = Field(
        default_factory=lambda: ["read", "reviews"],
        description="Permission scopes granted to the embed token",
    )


class EmbedTokenResponse(BaseModel):
    token: str
    token_type: str = "Bearer"
    expires_in: int = EMBED_EXPIRY_SECONDS
    expires_at: int


class AuthContext:
    """Authenticated context containing tenant ID and authentication mode."""

    def __init__(
        self,
        tenant_id: str,
        auth_mode: str,  # 'api_key' or 'embed_token'
        sub: Optional[str] = None,
        scopes: Optional[List[str]] = None,
    ):
        self.tenant_id = tenant_id
        self.auth_mode = auth_mode
        self.sub = sub
        self.scopes = scopes or []


def get_embed_signing_key() -> str:
    """Retrieves and validates RG_EMBED_SIGNING_KEY, with fallback dev key."""
    key = os.getenv(
        EMBED_SIGNING_KEY_ENV,
        "0123456789012345678901234567890123456789_dev_embed_signing_key_returnguard",
    )
    if not key or len(key.encode("utf-8")) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embed token signing key is not configured or too short (must be >= 32 bytes)",
        )
    return key


@router.post(
    "/v1/auth/embed-tokens",
    response_model=EmbedTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Issue an embed token for ReturnGuard SDK",
)
def create_embed_token(
    payload: EmbedTokenRequest,
    merchant_id: str = Depends(get_api_key_merchant),
) -> EmbedTokenResponse:
    """
    Issues a short-lived (10m) HS256 JWT embed token for client-side SDK initialization.
    Requires server API key authentication.
    """
    signing_key = get_embed_signing_key()

    now = datetime.datetime.now(datetime.timezone.utc)
    ttl = max(1, min(payload.ttl_seconds or EMBED_EXPIRY_SECONDS, 86400))
    exp = now + datetime.timedelta(seconds=ttl)
    now_ts = int(now.timestamp())
    exp_ts = int(exp.timestamp())

    claims = {
        "tid": merchant_id,
        "sub": payload.sub,
        "scp": payload.scopes or [],
        "aud": EMBED_TOKEN_AUDIENCE,
        "iat": now_ts,
        "exp": exp_ts,
        "jti": str(uuid.uuid4()),
    }

    token = jwt.encode(claims, signing_key, algorithm="HS256")

    return EmbedTokenResponse(
        token=token,
        token_type="Bearer",
        expires_in=ttl,
        expires_at=exp_ts,
    )


def require_read_or_review_auth(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> AuthContext:
    """
    Dependency that accepts either:
    1. Server API Key (Bearer rg_live_* or rg_test_*)
    2. Embed Token (Bearer <JWT> with aud="returnguard-sdk")

    Returns an AuthContext containing tenant_id.
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

    raw_token = parts[1].strip()
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Development token shortcut for local dashboard preview
    if raw_token == "rg_embed_test_token":
        return AuthContext(
            tenant_id=os.getenv("DEFAULT_TENANT_ID", "merch_shoppoint"),
            auth_mode="embed_token",
            sub="dev_user",
            scopes=["read", "reviews"],
        )

    # First attempt: Server API Key
    if raw_token.startswith("rg_live_") or raw_token.startswith("rg_test_"):
        # Authenticate using standard API key verification logic
        import hashlib
        import hmac
        from auth.ratelimit import get_rate_limiter

        computed_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        api_key = (
            db.query(APIKey)
            .filter(
                APIKey.key_hash == computed_hash,
                APIKey.is_active.is_(True),
                APIKey.revoked_at.is_(None),
            )
            .first()
        )
        if not api_key or not hmac.compare_digest(api_key.key_hash, computed_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=GENERIC_UNAUTHORIZED_DETAIL,
                headers={"WWW-Authenticate": "Bearer"},
            )

        limiter = get_rate_limiter()
        is_allowed, retry_after = limiter.check(api_key.id)
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

        return AuthContext(tenant_id=api_key.merchant_id, auth_mode="api_key")

    # Second attempt: Embed Token (JWT)
    # Check if signing key is configured
    try:
        signing_key = get_embed_signing_key()
    except HTTPException:
        # If signing key is not configured, we cannot verify embed tokens
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        decoded = jwt.decode(
            raw_token,
            signing_key,
            algorithms=["HS256"],
            audience=EMBED_TOKEN_AUDIENCE,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    tenant_id = decoded.get("tid")
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthContext(
        tenant_id=str(tenant_id),
        auth_mode="embed_token",
        sub=decoded.get("sub"),
        scopes=decoded.get("scp", []),
    )


def require_evidence_approve_auth(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> AuthContext:
    """
    Evidence approval requires human review auth:
    - MUST be an embed token (HS256 JWT) with scope 'evidence:approve' and non-empty 'sub'
    - Rejects server API keys with 403 Forbidden
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

    raw_token = parts[1].strip()

    # Reject server keys with 403 Forbidden
    if raw_token.startswith("rg_live_") or raw_token.startswith("rg_test_"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Human review approval requires embed token with 'evidence:approve' scope; server API keys forbidden.",
        )

    # Verify embed token
    signing_key = get_embed_signing_key()
    try:
        decoded = jwt.decode(
            raw_token,
            signing_key,
            algorithms=["HS256"],
            audience=EMBED_TOKEN_AUDIENCE,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_UNAUTHORIZED_DETAIL
        )

    tenant_id = decoded.get("tid")
    sub = decoded.get("sub")
    scopes = decoded.get("scp", [])

    if not tenant_id or not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_UNAUTHORIZED_DETAIL
        )

    if "evidence:approve" not in scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token missing required 'evidence:approve' scope",
        )

    return AuthContext(
        tenant_id=str(tenant_id),
        auth_mode="embed_token",
        sub=str(sub),
        scopes=scopes,
    )

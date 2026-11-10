"""Admin routes for session authentication and API key management."""

import datetime
import hashlib
import hmac
import secrets
from typing import List, Optional
import uuid
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from auth.admin import (
    ADMIN_SESSION_COOKIE_NAME,
    SESSION_LIFETIME_SECONDS,
    AdminLoginRequest,
    AdminSessionResponse,
    admin_rate_limiter,
    create_admin_session,
    get_configured_admin_token,
    invalidate_admin_session,
    verify_admin_auth,
)
from db.models import APIKey, Merchant
from db.session import get_db

router = APIRouter(tags=["Admin"])


class MerchantItemResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class CreateAPIKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Label for the API key")


class CreateAPIKeyResponse(BaseModel):
    key_id: str
    merchant_id: str
    name: str
    key: str  # Full plaintext key, returned strictly ONCE upon creation
    key_prefix: str
    created_at: datetime.datetime
    is_active: bool


class APIKeyItemResponse(BaseModel):
    key_id: str
    merchant_id: str
    name: str
    key_prefix: str
    created_at: datetime.datetime
    last_used_at: Optional[datetime.datetime] = None
    revoked_at: Optional[datetime.datetime] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@router.post("/v1/admin/session", response_model=AdminSessionResponse)
def login_admin(
    payload: AdminLoginRequest,
    request: Request,
    response: Response,
):
    """
    Authenticate administrator token and set HTTP-only session cookie.
    Rate limited to 5 attempts per minute per IP; 6th attempt returns 429.
    """
    ip = _get_client_ip(request)
    allowed, retry_after = admin_rate_limiter.check_and_record(ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    configured_token = get_configured_admin_token()
    if not hmac.compare_digest(payload.token.encode("utf-8"), configured_token.encode("utf-8")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials",
        )

    session_id = create_admin_session()
    is_secure = request.url.scheme == "https"
    response.set_cookie(
        key=ADMIN_SESSION_COOKIE_NAME,
        value=session_id,
        max_age=SESSION_LIFETIME_SECONDS,
        httponly=True,
        samesite="strict",
        secure=is_secure,
        path="/",
    )
    return AdminSessionResponse(status="authenticated", expires_in=SESSION_LIFETIME_SECONDS)


@router.delete("/v1/admin/session")
def logout_admin(
    response: Response,
    rg_admin_session: Optional[str] = Cookie(None, alias=ADMIN_SESSION_COOKIE_NAME),
):
    """
    Invalidate active admin session and clear cookie.
    """
    if rg_admin_session:
        invalidate_admin_session(rg_admin_session)
    response.delete_cookie(
        key=ADMIN_SESSION_COOKIE_NAME,
        httponly=True,
        samesite="strict",
        path="/",
    )
    return {"status": "logged_out"}


@router.get("/v1/admin/session")
def check_admin_session(
    authorized: bool = Depends(verify_admin_auth),
):
    """
    Check if the current admin session or token is valid.
    """
    return {"status": "authenticated"}


@router.get("/v1/admin/merchants", response_model=List[MerchantItemResponse])
def list_admin_merchants(
    authorized: bool = Depends(verify_admin_auth),
    db: Session = Depends(get_db),
):
    """
    List all registered merchants for administration.
    """
    merchants = db.query(Merchant).order_by(Merchant.created_at.asc()).all()
    return merchants


@router.post("/v1/admin/merchants/{merchant_id}/api-keys", response_model=CreateAPIKeyResponse)
def create_merchant_api_key(
    merchant_id: str,
    payload: CreateAPIKeyRequest,
    authorized: bool = Depends(verify_admin_auth),
    db: Session = Depends(get_db),
):
    """
    Generate a new API key for a merchant.
    Returns the full plaintext key once with prefix rg_live_.
    Stores only the SHA-256 hash and truncated prefix.
    """
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Merchant {merchant_id} not found",
        )

    raw_secret = secrets.token_urlsafe(32)
    plain_key = f"rg_live_{raw_secret}"
    key_prefix = plain_key[:12]  # e.g. rg_live_X1Y2
    key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
    key_id = f"key_{uuid.uuid4().hex[:16]}"
    now = datetime.datetime.now(datetime.UTC)

    api_key_record = APIKey(
        id=key_id,
        merchant_id=merchant_id,
        key_prefix=key_prefix,
        key_hash=key_hash,
        name=payload.name,
        is_active=True,
        created_at=now,
        revoked_at=None,
    )
    db.add(api_key_record)
    db.commit()

    return CreateAPIKeyResponse(
        key_id=key_id,
        merchant_id=merchant_id,
        name=payload.name,
        key=plain_key,
        key_prefix=f"{key_prefix}...",
        created_at=now,
        is_active=True,
    )


@router.get("/v1/admin/merchants/{merchant_id}/api-keys", response_model=List[APIKeyItemResponse])
def list_merchant_api_keys(
    merchant_id: str,
    authorized: bool = Depends(verify_admin_auth),
    db: Session = Depends(get_db),
):
    """
    List all API keys for a merchant.
    Returns key_prefix (truncated, e.g. rg_live_ab...), label, dates, and active status.
    NEVER returns the full key or hash.
    """
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Merchant {merchant_id} not found",
        )

    keys = (
        db.query(APIKey)
        .filter(APIKey.merchant_id == merchant_id)
        .order_by(APIKey.created_at.desc())
        .all()
    )

    result = []
    for k in keys:
        display_prefix = k.key_prefix if k.key_prefix.endswith("...") else f"{k.key_prefix[:10]}..."
        result.append(
            APIKeyItemResponse(
                key_id=k.id,
                merchant_id=k.merchant_id,
                name=k.name,
                key_prefix=display_prefix,
                created_at=k.created_at,
                last_used_at=getattr(k, "last_used_at", None),
                revoked_at=k.revoked_at,
                is_active=k.is_active,
            )
        )
    return result


@router.post("/v1/admin/api-keys/{key_id}/revoke", response_model=APIKeyItemResponse)
def revoke_api_key(
    key_id: str,
    authorized: bool = Depends(verify_admin_auth),
    db: Session = Depends(get_db),
):
    """
    Revoke an API key. Idempotent. Subsequent requests with this key return 401.
    """
    api_key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key {key_id} not found",
        )

    if api_key.is_active:
        api_key.is_active = False
        api_key.revoked_at = datetime.datetime.now(datetime.UTC)
        db.commit()
        db.refresh(api_key)

    display_prefix = api_key.key_prefix if api_key.key_prefix.endswith("...") else f"{api_key.key_prefix[:10]}..."
    return APIKeyItemResponse(
        key_id=api_key.id,
        merchant_id=api_key.merchant_id,
        name=api_key.name,
        key_prefix=display_prefix,
        created_at=api_key.created_at,
        last_used_at=getattr(api_key, "last_used_at", None),
        revoked_at=api_key.revoked_at,
        is_active=api_key.is_active,
    )


@router.post("/v1/admin/api-keys/{key_id}/rotate", response_model=CreateAPIKeyResponse)
def rotate_api_key(
    key_id: str,
    authorized: bool = Depends(verify_admin_auth),
    db: Session = Depends(get_db),
):
    """
    Atomically revoke the old key and create a new key for the same merchant and name.
    Executed in a single DB transaction. Returns the new plaintext key once.
    """
    old_key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not old_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key {key_id} not found",
        )

    now = datetime.datetime.now(datetime.UTC)
    old_key.is_active = False
    old_key.revoked_at = now

    raw_secret = secrets.token_urlsafe(32)
    plain_key = f"rg_live_{raw_secret}"
    key_prefix = plain_key[:12]
    key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
    new_key_id = f"key_{uuid.uuid4().hex[:16]}"

    new_key = APIKey(
        id=new_key_id,
        merchant_id=old_key.merchant_id,
        key_prefix=key_prefix,
        key_hash=key_hash,
        name=old_key.name,
        is_active=True,
        created_at=now,
        revoked_at=None,
    )
    db.add(new_key)
    db.commit()

    return CreateAPIKeyResponse(
        key_id=new_key_id,
        merchant_id=new_key.merchant_id,
        name=new_key.name,
        key=plain_key,
        key_prefix=f"{key_prefix}...",
        created_at=now,
        is_active=True,
    )

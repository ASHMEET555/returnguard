"""Merchant-Scoped API Key Management Endpoints for Authenticated SaaS Users."""

import datetime
import hashlib
import secrets
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from auth.user_auth import get_current_user_and_session, record_security_audit
from db.models import APIKey, Merchant, User, UserSession
from db.session import get_db

router = APIRouter(tags=["Merchant API Keys"])


class CreateKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Label for the API key")
    environment: str = Field("live", pattern="^(live|test)$", description="Key environment")


class CreateKeyResponse(BaseModel):
    key_id: str
    merchant_id: str
    name: str
    environment: str
    key: str  # Full plaintext key, returned strictly ONCE upon creation
    key_prefix: str
    created_at: datetime.datetime
    is_active: bool


class KeyItemResponse(BaseModel):
    key_id: str
    merchant_id: str
    name: str
    environment: str
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


@router.get("/v1/merchant/api-keys", response_model=List[KeyItemResponse])
def list_user_merchant_api_keys(
    auth_data=Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    """
    List all API keys for the authenticated user's organization.
    Strictly isolated: returns ONLY keys for user.merchant_id.
    Never returns secret keys or raw hashes.
    """
    user, _ = auth_data
    keys = (
        db.query(APIKey)
        .filter(APIKey.merchant_id == user.merchant_id)
        .order_by(APIKey.created_at.desc())
        .all()
    )

    result = []
    for k in keys:
        display_prefix = k.key_prefix if k.key_prefix.endswith("...") else f"{k.key_prefix[:10]}..."
        env = "test" if "test" in k.key_prefix else "live"
        result.append(
            KeyItemResponse(
                key_id=k.id,
                merchant_id=k.merchant_id,
                name=k.name,
                environment=env,
                key_prefix=display_prefix,
                created_at=k.created_at,
                last_used_at=getattr(k, "last_used_at", None),
                revoked_at=k.revoked_at,
                is_active=k.is_active,
            )
        )
    return result


@router.post("/v1/merchant/api-keys", response_model=CreateKeyResponse)
def create_user_merchant_api_key(
    payload: CreateKeyRequest,
    request: Request,
    auth_data=Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    """
    Generate a new API key for the user's merchant organization.
    Returns the full plaintext key once with prefix rg_live_ or rg_test_.
    Stores only the SHA-256 hash and truncated prefix.
    """
    user, _ = auth_data
    ip = _get_client_ip(request)

    prefix_tag = "rg_live_" if payload.environment == "live" else "rg_test_"
    raw_secret = secrets.token_urlsafe(32)
    plain_key = f"{prefix_tag}{raw_secret}"
    key_prefix = plain_key[:12]
    key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
    key_id = f"key_{uuid.uuid4().hex[:16]}"
    now = datetime.datetime.now(datetime.UTC)

    api_key_record = APIKey(
        id=key_id,
        merchant_id=user.merchant_id,
        key_prefix=key_prefix,
        key_hash=key_hash,
        name=payload.name.strip(),
        is_active=True,
        created_at=now,
        revoked_at=None,
    )
    db.add(api_key_record)
    db.commit()

    record_security_audit(
        db=db,
        event_type="API_KEY_CREATED",
        actor_id=user.id,
        merchant_id=user.merchant_id,
        target_resource=key_id,
        outcome="SUCCESS",
        ip_address=ip,
        details={"name": payload.name, "environment": payload.environment, "prefix": key_prefix},
    )

    return CreateKeyResponse(
        key_id=key_id,
        merchant_id=user.merchant_id,
        name=payload.name.strip(),
        environment=payload.environment,
        key=plain_key,
        key_prefix=f"{key_prefix}...",
        created_at=now,
        is_active=True,
    )


@router.post("/v1/merchant/api-keys/{key_id}/revoke", response_model=KeyItemResponse)
def revoke_user_merchant_api_key(
    key_id: str,
    request: Request,
    auth_data=Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    """
    Revoke an API key. Strictly enforces tenant ownership:
    User can only revoke keys belonging to their own merchant_id.
    """
    user, _ = auth_data
    ip = _get_client_ip(request)

    api_key = (
        db.query(APIKey)
        .filter(APIKey.id == key_id, APIKey.merchant_id == user.merchant_id)
        .first()
    )
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found in your organization.",
        )

    if api_key.is_active:
        api_key.is_active = False
        api_key.revoked_at = datetime.datetime.now(datetime.UTC)
        db.commit()
        db.refresh(api_key)

    record_security_audit(
        db=db,
        event_type="API_KEY_REVOKED",
        actor_id=user.id,
        merchant_id=user.merchant_id,
        target_resource=key_id,
        outcome="SUCCESS",
        ip_address=ip,
    )

    display_prefix = api_key.key_prefix if api_key.key_prefix.endswith("...") else f"{api_key.key_prefix[:10]}..."
    env = "test" if "test" in api_key.key_prefix else "live"
    return KeyItemResponse(
        key_id=api_key.id,
        merchant_id=api_key.merchant_id,
        name=api_key.name,
        environment=env,
        key_prefix=display_prefix,
        created_at=api_key.created_at,
        last_used_at=getattr(api_key, "last_used_at", None),
        revoked_at=api_key.revoked_at,
        is_active=api_key.is_active,
    )


@router.post("/v1/merchant/api-keys/{key_id}/rotate", response_model=CreateKeyResponse)
def rotate_user_merchant_api_key(
    key_id: str,
    request: Request,
    auth_data=Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    """
    Atomically revoke old key and generate a new key for the same merchant.
    Strictly tenant-scoped. Returns new secret once.
    """
    user, _ = auth_data
    ip = _get_client_ip(request)

    old_key = (
        db.query(APIKey)
        .filter(APIKey.id == key_id, APIKey.merchant_id == user.merchant_id)
        .first()
    )
    if not old_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found in your organization.",
        )

    now = datetime.datetime.now(datetime.UTC)
    old_key.is_active = False
    old_key.revoked_at = now

    env = "test" if "test" in old_key.key_prefix else "live"
    prefix_tag = "rg_live_" if env == "live" else "rg_test_"
    raw_secret = secrets.token_urlsafe(32)
    plain_key = f"{prefix_tag}{raw_secret}"
    key_prefix = plain_key[:12]
    key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
    new_key_id = f"key_{uuid.uuid4().hex[:16]}"

    new_key = APIKey(
        id=new_key_id,
        merchant_id=user.merchant_id,
        key_prefix=key_prefix,
        key_hash=key_hash,
        name=old_key.name,
        is_active=True,
        created_at=now,
        revoked_at=None,
    )
    db.add(new_key)
    db.commit()

    record_security_audit(
        db=db,
        event_type="API_KEY_ROTATED",
        actor_id=user.id,
        merchant_id=user.merchant_id,
        target_resource=new_key_id,
        outcome="SUCCESS",
        ip_address=ip,
        details={"old_key_id": key_id, "name": new_key.name},
    )

    return CreateKeyResponse(
        key_id=new_key_id,
        merchant_id=user.merchant_id,
        name=new_key.name,
        environment=env,
        key=plain_key,
        key_prefix=f"{key_prefix}...",
        created_at=now,
        is_active=True,
    )

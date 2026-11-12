"""SaaS User Authentication and Session Management Endpoints."""

import datetime
import secrets
from typing import Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from auth.admin import admin_rate_limiter
from auth.user_auth import (
    PBKDF2_ITERATIONS,
    USER_SESSION_COOKIE_NAME,
    USER_SESSION_LIFETIME_SECONDS,
    get_current_user_and_session,
    hash_password,
    record_security_audit,
    verify_password,
)
from db.models import Merchant, User, UserSession
from db.session import get_db

router = APIRouter(tags=["SaaS Auth"])


class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    organization_name: str = Field(..., min_length=2, max_length=255)


class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1)


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    merchant_id: str
    merchant_name: str

    model_config = ConfigDict(from_attributes=True)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@router.post("/v1/auth/register", response_model=UserProfileResponse)
def register_user(
    payload: UserRegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Register a new SaaS user and create their isolated organization/merchant.
    Sets an HTTP-only secure session cookie upon success.
    """
    ip = _get_client_ip(request)
    allowed, retry_after = admin_rate_limiter.check_and_record(f"reg_{ip}")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    # Check for duplicate email
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        record_security_audit(
            db=db,
            event_type="USER_REGISTER_FAILED_DUPLICATE",
            merchant_id=existing_user.merchant_id,
            outcome="FAILED",
            ip_address=ip,
            details={"email": payload.email.lower()},
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create Merchant / Tenant
    merchant_id = f"merch_{secrets.token_hex(6)}"
    merchant = Merchant(
        id=merchant_id,
        name=payload.organization_name.strip(),
        email=payload.email.lower().strip(),
        created_at=datetime.datetime.now(datetime.UTC),
    )
    db.add(merchant)
    db.flush()

    # Create User with PBKDF2 hash
    user_id = f"usr_{secrets.token_hex(8)}"
    pw_hash = hash_password(payload.password)
    user = User(
        id=user_id,
        merchant_id=merchant_id,
        email=payload.email.lower().strip(),
        password_hash=pw_hash,
        full_name=payload.full_name.strip(),
        role="admin",  # initial tenant admin
        is_active=True,
        created_at=datetime.datetime.now(datetime.UTC),
    )
    db.add(user)
    db.flush()

    # Establish initial session
    session_id = f"sess_{secrets.token_urlsafe(32)}"
    expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
        seconds=USER_SESSION_LIFETIME_SECONDS
    )
    user_session = UserSession(
        id=session_id,
        user_id=user_id,
        merchant_id=merchant_id,
        expires_at=expires_at,
        created_at=datetime.datetime.now(datetime.UTC),
    )
    db.add(user_session)
    db.commit()

    record_security_audit(
        db=db,
        event_type="USER_REGISTERED",
        actor_id=user_id,
        merchant_id=merchant_id,
        target_resource=user_id,
        outcome="SUCCESS",
        ip_address=ip,
        details={"email": user.email, "org": merchant.name},
    )

    is_secure = request.url.scheme == "https"
    response.set_cookie(
        key=USER_SESSION_COOKIE_NAME,
        value=session_id,
        max_age=USER_SESSION_LIFETIME_SECONDS,
        httponly=True,
        samesite="lax",
        secure=is_secure,
        path="/",
    )

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        merchant_id=merchant.id,
        merchant_name=merchant.name,
    )


@router.post("/v1/auth/login", response_model=UserProfileResponse)
def login_user(
    payload: UserLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Authenticate user credentials, establish server session, and set HTTP-only cookie.
    Rate limited with brute-force protection.
    """
    ip = _get_client_ip(request)
    allowed, retry_after = admin_rate_limiter.check_and_record(f"login_{ip}")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash) or not user.is_active:
        merchant_id = user.merchant_id if user else "unregistered"
        record_security_audit(
            db=db,
            event_type="USER_LOGIN_FAILED",
            actor_id=user.id if user else None,
            merchant_id=merchant_id,
            outcome="FAILED",
            ip_address=ip,
            details={"email": payload.email.lower()},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Invalidate prior sessions if desired or create a new active session
    session_id = f"sess_{secrets.token_urlsafe(32)}"
    expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
        seconds=USER_SESSION_LIFETIME_SECONDS
    )
    user_session = UserSession(
        id=session_id,
        user_id=user.id,
        merchant_id=user.merchant_id,
        expires_at=expires_at,
        created_at=datetime.datetime.now(datetime.UTC),
    )
    db.add(user_session)
    db.commit()

    record_security_audit(
        db=db,
        event_type="USER_LOGIN_SUCCEEDED",
        actor_id=user.id,
        merchant_id=user.merchant_id,
        target_resource=session_id,
        outcome="SUCCESS",
        ip_address=ip,
    )

    merchant = db.query(Merchant).filter(Merchant.id == user.merchant_id).first()
    merchant_name = merchant.name if merchant else user.merchant_id

    is_secure = request.url.scheme == "https"
    response.set_cookie(
        key=USER_SESSION_COOKIE_NAME,
        value=session_id,
        max_age=USER_SESSION_LIFETIME_SECONDS,
        httponly=True,
        samesite="lax",
        secure=is_secure,
        path="/",
    )

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        merchant_id=user.merchant_id,
        merchant_name=merchant_name,
    )


@router.delete("/v1/auth/logout")
def logout_user(
    request: Request,
    response: Response,
    auth_data=Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    """
    Invalidate active user session in database and clear HTTP-only cookie.
    """
    user, session = auth_data
    ip = _get_client_ip(request)

    db.delete(session)
    db.commit()

    record_security_audit(
        db=db,
        event_type="USER_LOGOUT",
        actor_id=user.id,
        merchant_id=user.merchant_id,
        target_resource=session.id,
        outcome="SUCCESS",
        ip_address=ip,
    )

    response.delete_cookie(
        key=USER_SESSION_COOKIE_NAME,
        httponly=True,
        samesite="lax",
        path="/",
    )
    return {"status": "logged_out"}


@router.get("/v1/auth/me", response_model=UserProfileResponse)
def get_authenticated_user(
    auth_data=Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    """
    Return active authenticated user profile and merchant organization context.
    """
    user, _ = auth_data
    merchant = db.query(Merchant).filter(Merchant.id == user.merchant_id).first()
    merchant_name = merchant.name if merchant else user.merchant_id

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        merchant_id=user.merchant_id,
        merchant_name=merchant_name,
    )

"""Admin routes for session authentication and API key management."""

import hmac
from typing import Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
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

router = APIRouter(tags=["Admin"])


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

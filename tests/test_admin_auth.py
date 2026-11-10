"""Tests for admin authentication, sessions, and rate limiting."""

import os
import pytest
from fastapi.testclient import TestClient
from api.main import app
from auth.admin import (
    ADMIN_SESSION_COOKIE_NAME,
    ADMIN_TOKEN_ENV,
    admin_rate_limiter,
    clear_all_admin_sessions,
)

VALID_TEST_ADMIN_TOKEN = "rg_admin_super_secret_token_1234567890_abcdef"


@pytest.fixture(autouse=True)
def setup_teardown():
    # Setup test admin token
    old_token = os.environ.get(ADMIN_TOKEN_ENV)
    os.environ[ADMIN_TOKEN_ENV] = VALID_TEST_ADMIN_TOKEN
    admin_rate_limiter.clear()
    clear_all_admin_sessions()
    yield
    # Cleanup
    if old_token is not None:
        os.environ[ADMIN_TOKEN_ENV] = old_token
    else:
        os.environ.pop(ADMIN_TOKEN_ENV, None)
    admin_rate_limiter.clear()
    clear_all_admin_sessions()


def test_admin_login_wrong_token_returns_401():
    client = TestClient(app)
    response = client.post("/v1/admin/session", json={"token": "wrong_token_that_does_not_match"})
    assert response.status_code == 401
    assert "Invalid administrator credentials" in response.json()["detail"]


def test_admin_login_correct_token_sets_http_only_cookie():
    client = TestClient(app)
    response = client.post("/v1/admin/session", json={"token": VALID_TEST_ADMIN_TOKEN})
    assert response.status_code == 200
    assert response.json()["status"] == "authenticated"
    assert response.json()["expires_in"] == 8 * 3600

    # Verify cookie
    assert ADMIN_SESSION_COOKIE_NAME in response.cookies
    cookie_header = response.headers.get("set-cookie", "")
    assert "HttpOnly" in cookie_header
    assert "SameSite=strict" in cookie_header or "SameSite=Strict" in cookie_header

    # Verify session check passes with cookie
    session_res = client.get("/v1/admin/session")
    assert session_res.status_code == 200
    assert session_res.json() == {"status": "authenticated"}


def test_admin_logout_clears_session():
    client = TestClient(app)
    login_res = client.post("/v1/admin/session", json={"token": VALID_TEST_ADMIN_TOKEN})
    assert login_res.status_code == 200

    logout_res = client.delete("/v1/admin/session")
    assert logout_res.status_code == 200
    assert logout_res.json() == {"status": "logged_out"}

    # Next check should be 401
    check_res = client.get("/v1/admin/session")
    assert check_res.status_code == 401


def test_admin_rate_limit_5_per_minute_returns_429_on_6th():
    client = TestClient(app)
    # 5 attempts should not be rate-limited
    for _ in range(5):
        res = client.post("/v1/admin/session", json={"token": "wrong_attempt"})
        assert res.status_code == 401

    # 6th attempt should return 429
    res6 = client.post("/v1/admin/session", json={"token": "wrong_attempt"})
    assert res6.status_code == 429
    assert "Retry-After" in res6.headers


def test_unset_admin_token_returns_503():
    os.environ.pop(ADMIN_TOKEN_ENV, None)
    client = TestClient(app)
    response = client.post("/v1/admin/session", json={"token": VALID_TEST_ADMIN_TOKEN})
    assert response.status_code == 503
    assert "RG_ADMIN_TOKEN is not configured" in response.json()["detail"]


def test_ordinary_routes_work_when_admin_token_unset():
    os.environ.pop(ADMIN_TOKEN_ENV, None)
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_admin_bearer_and_x_admin_token_headers():
    client = TestClient(app)
    # Bearer header
    bearer_res = client.get(
        "/v1/admin/session",
        headers={"Authorization": f"Bearer {VALID_TEST_ADMIN_TOKEN}"},
    )
    assert bearer_res.status_code == 200

    # X-Admin-Token header
    header_res = client.get(
        "/v1/admin/session",
        headers={"X-Admin-Token": VALID_TEST_ADMIN_TOKEN},
    )
    assert header_res.status_code == 200

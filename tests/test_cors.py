"""Tests for CORS configuration and preflight handling in ReturnGuard API."""

import pytest
from fastapi.testclient import TestClient
from api.main import app


def test_cors_preflight_allowed_origin():
    """Test preflight OPTIONS returns CORS allow headers for allowed origin."""
    client = TestClient(app)
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Authorization, Content-Type",
    }
    response = client.options("/health", headers=headers)
    assert response.status_code == 200
    assert (
        response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    )
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_preflight_onrender_origin():
    """Test preflight OPTIONS returns CORS allow headers for onrender.com origins."""
    client = TestClient(app)
    headers = {
        "Origin": "https://returnguard-web-xxxx.onrender.com",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization, Content-Type",
    }
    response = client.options("/v1/analytics/summary", headers=headers)
    assert response.status_code == 200
    assert (
        response.headers.get("access-control-allow-origin") == "https://returnguard-web-xxxx.onrender.com"
    )
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_disallowed_origin():
    """Test requests from disallowed origin do not receive access-control-allow-origin."""
    client = TestClient(app)
    headers = {
        "Origin": "https://malicious-site.example.com",
        "Access-Control-Request-Method": "POST",
    }
    response = client.options("/health", headers=headers)
    # FastAPI CORSMiddleware does not return allow-origin header for untrusted origins
    assert "access-control-allow-origin" not in response.headers

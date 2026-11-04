"""Tests for Embed Token issuance, auth dependency and server endpoints (Phase F1)."""

import datetime
import hashlib
import os
import uuid
import jwt
import pytest
from fastapi.testclient import TestClient

from api.main import app
from auth.embed_tokens import EMBED_SIGNING_KEY_ENV, EMBED_TOKEN_AUDIENCE
from db.models import APIKey, AuditScoreEvent, Merchant
from db.session import SessionLocal

TEST_KEY_RAW = "rg_live_test_embed_suite_key_001"
CALC_HASH = hashlib.sha256(TEST_KEY_RAW.encode("utf-8")).hexdigest()

MERCHANT_A = "merch_f1_test_a"
MERCHANT_B = "merch_f1_test_b"
VALID_32B_KEY = "super_secure_embed_signing_key_at_least_32_bytes_long!"


@pytest.fixture(autouse=True)
def setup_db_and_keys():
    db = SessionLocal()
    ma = db.query(Merchant).filter(Merchant.id == MERCHANT_A).first()
    if not ma:
        ma = Merchant(id=MERCHANT_A, name="Merchant A", email="a@example.com")
        db.add(ma)

    mb = db.query(Merchant).filter(Merchant.id == MERCHANT_B).first()
    if not mb:
        mb = Merchant(id=MERCHANT_B, name="Merchant B", email="b@example.com")
        db.add(mb)

    k = db.query(APIKey).filter(APIKey.merchant_id == MERCHANT_A).first()
    if not k:
        k = APIKey(
            id=str(uuid.uuid4()),
            merchant_id=MERCHANT_A,
            key_prefix="rg_live_test",
            key_hash=CALC_HASH,
            name="Merchant A Key",
            is_active=True,
        )
        db.add(k)

    db.commit()
    db.close()

    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_32B_KEY
    yield
    os.environ.pop(EMBED_SIGNING_KEY_ENV, None)


def test_missing_signing_key_gives_503():
    os.environ.pop(EMBED_SIGNING_KEY_ENV, None)
    client = TestClient(app)
    resp = client.post(
        "/v1/auth/embed-tokens",
        headers={"Authorization": f"Bearer {TEST_KEY_RAW}"},
        json={"sub": "user_123"},
    )
    assert resp.status_code == 503
    assert "not configured" in resp.json()["detail"]


def test_short_signing_key_gives_503():
    os.environ[EMBED_SIGNING_KEY_ENV] = "too_short_key"
    client = TestClient(app)
    resp = client.post(
        "/v1/auth/embed-tokens",
        headers={"Authorization": f"Bearer {TEST_KEY_RAW}"},
        json={"sub": "user_123"},
    )
    assert resp.status_code == 503


def test_valid_token_issuance_and_acceptance():
    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_32B_KEY
    client = TestClient(app)
    resp = client.post(
        "/v1/auth/embed-tokens",
        headers={"Authorization": f"Bearer {TEST_KEY_RAW}"},
        json={"sub": "user_123", "scopes": ["read", "reviews"]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    token = data["token"]

    decoded = jwt.decode(token, VALID_32B_KEY, algorithms=["HS256"], audience=EMBED_TOKEN_AUDIENCE)
    assert decoded["tid"] == MERCHANT_A
    assert decoded["sub"] == "user_123"
    assert decoded["aud"] == EMBED_TOKEN_AUDIENCE

    read_resp = client.get("/v1/decisions", headers={"Authorization": f"Bearer {token}"})
    assert read_resp.status_code == 200
    assert "items" in read_resp.json()


def test_expired_token_gives_401():
    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_32B_KEY
    client = TestClient(app)
    now = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(seconds=100)
    claims = {
        "tid": MERCHANT_A,
        "sub": "user_123",
        "aud": EMBED_TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + 10),
    }
    expired_token = jwt.encode(claims, VALID_32B_KEY, algorithm="HS256")

    resp = client.get("/v1/decisions", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401
    assert "expired" in resp.json()["detail"].lower()


def test_wrong_audience_gives_401():
    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_32B_KEY
    client = TestClient(app)
    now = datetime.datetime.now(datetime.timezone.utc)
    claims = {
        "tid": MERCHANT_A,
        "sub": "user_123",
        "aud": "wrong-audience",
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + 600),
    }
    bad_token = jwt.encode(claims, VALID_32B_KEY, algorithm="HS256")

    resp = client.get("/v1/decisions", headers={"Authorization": f"Bearer {bad_token}"})
    assert resp.status_code == 401
    assert "audience" in resp.json()["detail"].lower()


def test_embed_token_rejected_on_score():
    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_32B_KEY
    client = TestClient(app)
    now = datetime.datetime.now(datetime.timezone.utc)
    claims = {
        "tid": MERCHANT_A,
        "sub": "user_123",
        "aud": EMBED_TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + 600),
    }
    token = jwt.encode(claims, VALID_32B_KEY, algorithm="HS256")

    score_resp = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount": 100.0},
    )
    assert score_resp.status_code in [401, 403]


def test_token_tenant_cannot_read_another_tenants_rows():
    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_32B_KEY
    client = TestClient(app)

    # Merchant A creates a decision via POST /v1/score
    score_resp = client.post(
        "/v1/score",
        json={"order_id": f"ord_a_{uuid.uuid4().hex[:8]}", "amount": 1500.0},
        headers={"Authorization": f"Bearer {TEST_KEY_RAW}"},
    )
    assert score_resp.status_code == 200
    a_decision_id = score_resp.json()["decision_id"]

    # Merchant B creates an embed token
    now = datetime.datetime.now(datetime.timezone.utc)
    claims_b = {
        "tid": MERCHANT_B,
        "sub": "user_b_456",
        "aud": EMBED_TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + 600),
    }
    token_b = jwt.encode(claims_b, VALID_32B_KEY, algorithm="HS256")

    # Merchant B reads Merchant A's decision -> 404 NOT FOUND
    resp = client.get(f"/v1/decisions/{a_decision_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


def test_models_and_analytics_endpoints():
    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_32B_KEY
    client = TestClient(app)
    now = datetime.datetime.now(datetime.timezone.utc)
    claims = {
        "tid": MERCHANT_A,
        "sub": "user_123",
        "aud": EMBED_TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + 600),
    }
    token = jwt.encode(claims, VALID_32B_KEY, algorithm="HS256")

    # Analytics summary
    a_resp = client.get("/v1/analytics/summary", headers={"Authorization": f"Bearer {token}"})
    assert a_resp.status_code == 200
    a_data = a_resp.json()
    assert a_data["tenant_id"] == MERCHANT_A
    assert "total_decisions" in a_data

    # Models performance
    m_resp = client.get("/v1/models/performance", headers={"Authorization": f"Bearer {token}"})
    assert m_resp.status_code == 200
    m_data = m_resp.json()
    assert "synthetic" in m_data
    assert "ieee_cis" in m_data
    assert m_data["synthetic"]["dataset_name"] == "synthetic"
    assert m_data["ieee_cis"]["dataset_name"] == "ieee_cis"

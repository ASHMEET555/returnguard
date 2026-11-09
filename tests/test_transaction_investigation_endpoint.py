import datetime
import hashlib
import os
import uuid
import jwt
import pytest
from fastapi.testclient import TestClient
from api.main import app
from auth.embed_tokens import EMBED_SIGNING_KEY_ENV, EMBED_TOKEN_AUDIENCE
from db.models import APIKey, Investigation, Merchant
from db.session import SessionLocal

TEST_SIGNING_KEY = "test-secret-key-for-embed-tokens-32bytes!!"


@pytest.fixture(autouse=True)
def set_env(monkeypatch):
    monkeypatch.setenv(EMBED_SIGNING_KEY_ENV, TEST_SIGNING_KEY)


def make_embed_token(tenant_id: str, sub: str, scopes=None, exp_delta=600):
    if scopes is None:
        scopes = ["evidence:approve", "read", "reviews"]
    payload = {
        "tid": tenant_id,
        "sub": sub,
        "scp": scopes,
        "aud": EMBED_TOKEN_AUDIENCE,
        "exp": datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(seconds=exp_delta),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, TEST_SIGNING_KEY, algorithm="HS256")


def setup_merchant_and_key():
    db = SessionLocal()
    tenant_id = f"merch_txinv_{uuid.uuid4().hex[:6]}"
    m = Merchant(id=tenant_id, name="Test Merchant", email=f"{tenant_id}@test.com")
    db.add(m)
    raw_key = f"rg_live_{uuid.uuid4().hex}"
    h = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    k = APIKey(
        id=f"k_{uuid.uuid4().hex[:8]}",
        merchant_id=tenant_id,
        key_prefix="rg_live_",
        key_hash=h,
        name="Key",
        is_active=True,
    )
    db.add(k)
    db.commit()
    db.close()
    return tenant_id, raw_key


def test_post_transaction_investigation_creates_manual():
    """POST /v1/transactions/{id}/investigation creates manual case with 201."""
    client = TestClient(app)
    tenant_id, _ = setup_merchant_and_key()
    token = make_embed_token(tenant_id, "reviewer_1", scopes=["evidence:approve"])
    tx_id = f"ord_manual_{uuid.uuid4().hex[:8]}"

    resp = client.post(
        f"/v1/transactions/{tx_id}/investigation",
        json={"reason": "Manual review opened"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["transaction_id"] == tx_id
    assert data["source"] == "MANUAL"
    assert data["status"] == "OPEN"
    assert data["merchant_id"] == tenant_id


def test_post_transaction_investigation_returns_existing():
    """POST /v1/transactions/{id}/investigation returns existing case with 200."""
    client = TestClient(app)
    tenant_id, _ = setup_merchant_and_key()
    token = make_embed_token(tenant_id, "reviewer_1", scopes=["evidence:approve"])
    tx_id = f"ord_existing_{uuid.uuid4().hex[:8]}"

    # First call -> 201
    resp1 = client.post(
        f"/v1/transactions/{tx_id}/investigation",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp1.status_code == 201
    id1 = resp1.json()["id"]

    # Second call -> 200 and same ID
    resp2 = client.post(
        f"/v1/transactions/{tx_id}/investigation",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp2.status_code == 200
    assert resp2.json()["id"] == id1


def test_get_transaction_investigation_and_404():
    """GET /v1/transactions/{id}/investigation returns existing case or 404."""
    client = TestClient(app)
    tenant_id, _ = setup_merchant_and_key()
    token = make_embed_token(tenant_id, "reviewer_1", scopes=["read"])
    tx_id = f"ord_get_{uuid.uuid4().hex[:8]}"

    # 404 when none exists
    resp_404 = client.get(
        f"/v1/transactions/{tx_id}/investigation",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp_404.status_code == 404

    # Create one
    approve_token = make_embed_token(
        tenant_id, "reviewer_1", scopes=["evidence:approve"]
    )
    client.post(
        f"/v1/transactions/{tx_id}/investigation",
        headers={"Authorization": f"Bearer {approve_token}"},
    )

    # 200 when exists
    resp_200 = client.get(
        f"/v1/transactions/{tx_id}/investigation",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp_200.status_code == 200
    assert resp_200.json()["transaction_id"] == tx_id


def test_server_key_returns_403_on_post():
    """Server API key returns 403 on POST /v1/transactions/{id}/investigation."""
    client = TestClient(app)
    tenant_id, raw_key = setup_merchant_and_key()
    tx_id = f"ord_srv_{uuid.uuid4().hex[:8]}"

    resp = client.post(
        f"/v1/transactions/{tx_id}/investigation",
        headers={"Authorization": f"Bearer {raw_key}"},
    )
    assert resp.status_code == 403


def test_cross_tenant_returns_404():
    """Cross-tenant access returns 404."""
    client = TestClient(app)
    tenant_a, _ = setup_merchant_and_key()
    tenant_b, _ = setup_merchant_and_key()
    token_a = make_embed_token(tenant_a, "reviewer_a", scopes=["evidence:approve"])
    token_b = make_embed_token(tenant_b, "reviewer_b", scopes=["read"])
    tx_id = f"ord_cross_{uuid.uuid4().hex[:8]}"

    # Tenant A creates case
    resp_create = client.post(
        f"/v1/transactions/{tx_id}/investigation",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert resp_create.status_code == 201

    # Tenant B tries to GET case -> 404
    resp_b = client.get(
        f"/v1/transactions/{tx_id}/investigation",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp_b.status_code == 404

"""Tests for admin API key creation, listing, revocation, and rotation."""

import os
import pytest
from fastapi.testclient import TestClient
from api.main import app
from auth.admin import ADMIN_TOKEN_ENV
from db.models import APIKey, Merchant
from db.session import SessionLocal

VALID_TEST_ADMIN_TOKEN = "rg_admin_super_secret_token_1234567890_abcdef"


@pytest.fixture(autouse=True)
def setup_admin_env():
    old = os.environ.get(ADMIN_TOKEN_ENV)
    os.environ[ADMIN_TOKEN_ENV] = VALID_TEST_ADMIN_TOKEN
    yield
    if old is not None:
        os.environ[ADMIN_TOKEN_ENV] = old
    else:
        os.environ.pop(ADMIN_TOKEN_ENV, None)


@pytest.fixture
def test_merchants():
    db = SessionLocal()
    m1 = db.query(Merchant).filter(Merchant.id == "merch_admin_test_1").first()
    if not m1:
        m1 = Merchant(id="merch_admin_test_1", name="Alpha Merchant", email="alpha@test.com")
        db.add(m1)
    m2 = db.query(Merchant).filter(Merchant.id == "merch_admin_test_2").first()
    if not m2:
        m2 = Merchant(id="merch_admin_test_2", name="Beta Merchant", email="beta@test.com")
        db.add(m2)
    db.commit()
    db.close()
    return "merch_admin_test_1", "merch_admin_test_2"


def test_create_and_list_api_keys(test_merchants):
    m1, m2 = test_merchants
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {VALID_TEST_ADMIN_TOKEN}"}

    # 1. Create key for m1
    create_res = client.post(
        f"/v1/admin/merchants/{m1}/api-keys",
        headers=headers,
        json={"name": "Production Key Alpha"},
    )
    assert create_res.status_code == 200
    data = create_res.json()
    assert "key" in data
    plain_key = data["key"]
    assert plain_key.startswith("rg_live_")
    assert len(plain_key) > 30
    key_id = data["key_id"]

    # 2. List keys for m1
    list_res = client.get(f"/v1/admin/merchants/{m1}/api-keys", headers=headers)
    assert list_res.status_code == 200
    keys = list_res.json()
    assert len(keys) >= 1
    found = next((k for k in keys if k["key_id"] == key_id), None)
    assert found is not None
    assert found["name"] == "Production Key Alpha"
    assert found["is_active"] is True
    assert found["key_prefix"].startswith("rg_live_")
    # Verify neither plaintext key nor hash is leaked
    assert "key" not in found
    assert "key_hash" not in found

    # 3. Cross-merchant isolation: m2 should NOT see m1's key
    list_m2 = client.get(f"/v1/admin/merchants/{m2}/api-keys", headers=headers)
    assert list_m2.status_code == 200
    m2_keys = list_m2.json()
    assert not any(k["key_id"] == key_id for k in m2_keys)


def test_unknown_merchant_returns_404():
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {VALID_TEST_ADMIN_TOKEN}"}
    res = client.post(
        "/v1/admin/merchants/non_existent_merchant_xyz/api-keys",
        headers=headers,
        json={"name": "Key"},
    )
    assert res.status_code == 404

    res2 = client.get(
        "/v1/admin/merchants/non_existent_merchant_xyz/api-keys",
        headers=headers,
    )
    assert res2.status_code == 404


def test_revoke_and_rotate_api_key(test_merchants):
    m1, _ = test_merchants
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {VALID_TEST_ADMIN_TOKEN}"}

    # 1. Create key
    create_res = client.post(
        f"/v1/admin/merchants/{m1}/api-keys",
        headers=headers,
        json={"name": "Rotatable Key"},
    )
    assert create_res.status_code == 200
    data = create_res.json()
    old_key = data["key"]
    old_key_id = data["key_id"]

    # Test that old key works on score
    score_payload = {
        "transaction_id": "tx_admin_test_01",
        "order_id": "ord_admin_test_01",
        "customer_id": "cust_admin_test_01",
        "amount": 99.0,
        "currency": "USD",
        "timestamp": "2026-11-10T12:00:00Z",
    }
    score_res = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {old_key}"},
        json=score_payload,
    )
    assert score_res.status_code == 200

    # 2. Rotate key
    rotate_res = client.post(
        f"/v1/admin/api-keys/{old_key_id}/rotate",
        headers=headers,
    )
    assert rotate_res.status_code == 200
    rot_data = rotate_res.json()
    new_key = rot_data["key"]
    new_key_id = rot_data["key_id"]
    assert new_key != old_key
    assert new_key.startswith("rg_live_")

    # 3. Old key now returns 401
    score_old = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {old_key}"},
        json=score_payload,
    )
    assert score_old.status_code == 401

    # 4. New key works on score
    score_new = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {new_key}"},
        json=score_payload,
    )
    assert score_new.status_code == 200

    # 5. Revoke new key
    revoke_res = client.post(
        f"/v1/admin/api-keys/{new_key_id}/revoke",
        headers=headers,
    )
    assert revoke_res.status_code == 200
    assert revoke_res.json()["is_active"] is False

    # Idempotent second revoke
    revoke_res2 = client.post(
        f"/v1/admin/api-keys/{new_key_id}/revoke",
        headers=headers,
    )
    assert revoke_res2.status_code == 200

    # New key now returns 401
    score_revoked = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {new_key}"},
        json=score_payload,
    )
    assert score_revoked.status_code == 401

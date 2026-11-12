"""Unit and integration tests for SaaS User Authentication, Sessions, and API Key Management."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from api.main import app
from db.models import Base, Merchant, User, UserSession, APIKey, SecurityAuditLog
from db.session import get_db

# In-memory test SQLite DB
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_user_registration_and_login_lifecycle(client):
    # 1. Register User Alpha
    reg_payload = {
        "full_name": "Alice Auditor",
        "email": "alice@acme.com",
        "password": "StrongPassword123!",
        "organization_name": "Acme Retail Corp",
    }
    res_reg = client.post("/v1/auth/register", json=reg_payload)
    assert res_reg.status_code == 200, res_reg.text
    user_alpha = res_reg.json()
    assert user_alpha["email"] == "alice@acme.com"
    assert user_alpha["merchant_name"] == "Acme Retail Corp"
    assert user_alpha["merchant_id"].startswith("merch_")
    assert "rg_user_session" in res_reg.cookies

    # 2. Duplicate registration returns 409
    res_dup = client.post("/v1/auth/register", json=reg_payload)
    assert res_dup.status_code == 409

    # 3. Check /v1/auth/me using session cookie
    res_me = client.get("/v1/auth/me")
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "alice@acme.com"

    # 4. Logout invalidates session
    res_logout = client.delete("/v1/auth/logout")
    assert res_logout.status_code == 200

    # Subsequent /v1/auth/me should fail
    res_me_after = client.get("/v1/auth/me")
    assert res_me_after.status_code == 401

    # 5. Login with invalid password returns 401
    res_bad_pw = client.post(
        "/v1/auth/login",
        json={"email": "alice@acme.com", "password": "WrongPassword!"},
    )
    assert res_bad_pw.status_code == 401

    # 6. Login with correct credentials returns 200 and restores session
    res_login = client.post(
        "/v1/auth/login",
        json={"email": "alice@acme.com", "password": "StrongPassword123!"},
    )
    assert res_login.status_code == 200
    assert "rg_user_session" in res_login.cookies


def test_merchant_api_key_lifecycle_and_tenant_isolation(client):
    # Register User 1 (Acme)
    client.post(
        "/v1/auth/register",
        json={
            "full_name": "Alice Acme",
            "email": "alice@acme.com",
            "password": "Password12345!",
            "organization_name": "Acme Org",
        },
    )

    # 1. Create API key for Acme
    res_key = client.post(
        "/v1/merchant/api-keys",
        json={"name": "Production Checkout", "environment": "live"},
    )
    assert res_key.status_code == 200
    key_data = res_key.json()
    assert key_data["name"] == "Production Checkout"
    raw_key = key_data["key"]
    assert raw_key.startswith("rg_live_")
    key_id = key_data["key_id"]

    # 2. List API keys: full key must NOT be returned, only prefix
    res_list = client.get("/v1/merchant/api-keys")
    assert res_list.status_code == 200
    keys = res_list.json()
    assert len(keys) == 1
    assert "key" not in keys[0]
    assert keys[0]["key_prefix"].startswith("rg_live_")

    # 3. Register User 2 (Beta) in separate session
    client_beta = TestClient(app)
    client_beta.post(
        "/v1/auth/register",
        json={
            "full_name": "Bob Beta",
            "email": "bob@beta.com",
            "password": "Password12345!",
            "organization_name": "Beta Org",
        },
    )

    # Tenant Isolation: Bob cannot see Alice's API keys
    res_beta_keys = client_beta.get("/v1/merchant/api-keys")
    assert res_beta_keys.status_code == 200
    assert len(res_beta_keys.json()) == 0

    # Tenant Isolation: Bob cannot revoke Alice's key
    res_revoke_cross = client_beta.post(f"/v1/merchant/api-keys/{key_id}/revoke")
    assert res_revoke_cross.status_code == 404

    # 4. Alice rotates key: atomically revokes old and creates new
    res_rotate = client.post(f"/v1/merchant/api-keys/{key_id}/rotate")
    assert res_rotate.status_code == 200
    new_rotated = res_rotate.json()
    assert new_rotated["key"].startswith("rg_live_")
    assert new_rotated["key_id"] != key_id

    # Check Alice's keys now has 2 keys (1 revoked, 1 active)
    res_alice_keys_after = client.get("/v1/merchant/api-keys")
    assert res_alice_keys_after.status_code == 200
    all_keys = res_alice_keys_after.json()
    assert len(all_keys) == 2
    active_keys = [k for k in all_keys if k["is_active"]]
    revoked_keys = [k for k in all_keys if not k["is_active"]]
    assert len(active_keys) == 1
    assert len(revoked_keys) == 1


def test_security_audit_logging(client):
    # Register and perform key action
    res = client.post(
        "/v1/auth/register",
        json={
            "full_name": "Auditor Dave",
            "email": "dave@audit.com",
            "password": "Password12345!",
            "organization_name": "Audit Co",
        },
    )
    merchant_id = res.json()["merchant_id"]

    db = TestingSessionLocal()
    logs = db.query(SecurityAuditLog).filter(SecurityAuditLog.merchant_id == merchant_id).all()
    assert len(logs) >= 1
    reg_log = [l for l in logs if l.event_type == "USER_REGISTERED"][0]
    assert reg_log.outcome == "SUCCESS"
    assert "Password" not in str(reg_log.details_json)
    db.close()

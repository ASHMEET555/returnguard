"""
Stage 2 Authentication & Tenancy Test Suite for ReturnGuard.

Verifies:
1. No Authorization header on /v1/score returns 401.
2. Malformed header (wrong scheme, empty token) returns 401.
3. Unknown key returns 401.
4. Revoked key returns 401.
5. Valid key returns 200 and matches exact score contract fields.
6. Body merchant_id differs from key's merchant returns 400.
7. Body merchant_id absent returns 200.
8. /health returns 200 without an API key.
9. Stored audit row contains authenticated merchant_id and no plain key or key hash.
10. Two merchants: key A cannot produce audit rows under merchant B.
"""

import datetime
import hashlib
import json
import secrets
import uuid

import pytest
from fastapi.testclient import TestClient

from api.main import app
from db.migrations import run_migrations
from db.models import APIKey, AuditScoreEvent, Merchant
from db.session import SessionLocal, engine


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database schema is initialized for tests."""
    run_migrations(engine)
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture
def client():
    """TestClient for ReturnGuard API."""
    return TestClient(app)


def helper_create_key(
    merchant_id: str,
    name: str = "Test Key",
    is_active: bool = True,
    revoked: bool = False,
    prefix: str = "rg_live_",
) -> tuple[str, str]:
    """
    Creates merchant and API key record in the database.
    Returns (key_id, plain_key).
    """
    db = SessionLocal()
    try:
        merchant = db.query(Merchant).filter_by(id=merchant_id).first()
        if not merchant:
            merchant = Merchant(
                id=merchant_id,
                name=f"Merchant {merchant_id}",
                email=f"{merchant_id}@example.com",
            )
            db.add(merchant)
            db.flush()

        random_secret = secrets.token_urlsafe(32)
        plain_key = f"{prefix}{random_secret}"
        key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
        key_id = f"key_{uuid.uuid4().hex[:16]}"

        now = datetime.datetime.now(datetime.UTC)
        api_key = APIKey(
            id=key_id,
            merchant_id=merchant_id,
            key_prefix=prefix,
            key_hash=key_hash,
            name=name,
            is_active=is_active,
            created_at=now,
            revoked_at=now if revoked else None,
        )
        db.add(api_key)
        db.commit()
        return key_id, plain_key
    finally:
        db.close()


SAMPLE_SCORE_PAYLOAD = {
    "order_id": "ord_auth_test_001",
    "amount": 2500.0,
    "channel": "paypal",
    "features": {
        "amount": 2500.0,
        "amount_zscore": 0.2,
        "amount_vs_avg_ratio": 1.1,
        "prior_txn_count": 4,
        "time_since_prev_txn_min": 60.0,
        "velocity_5min": 0,
        "velocity_30min": 0,
        "velocity_60min": 1,
        "new_device_flag": 0,
        "new_geo_flag": 0,
        "failed_ratio_trailing10": 0.0,
        "account_age_days": 30,
        "hour_of_day": 12,
        "is_night": 0,
        "day_of_week": 1,
    },
}


# 1. No Authorization header
def test_1_no_auth_header_returns_401(client):
    response = client.post("/v1/score", json=SAMPLE_SCORE_PAYLOAD)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or missing authentication credentials"

    # Removed /score alias returns 404 Not Found (Phase E-4)
    alias_resp = client.post("/score", json=SAMPLE_SCORE_PAYLOAD)
    assert alias_resp.status_code == 404


# 2. Malformed headers
@pytest.mark.parametrize(
    "bad_header",
    [
        "Basic dXNlcjpwYXNz",
        "Bearer",
        "Bearer   ",
        "Token some_secret_value",
        "BearerInvalidFormat",
    ],
)
def test_2_malformed_auth_header_returns_401(client, bad_header):
    response = client.post(
        "/v1/score",
        json=SAMPLE_SCORE_PAYLOAD,
        headers={"Authorization": bad_header},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or missing authentication credentials"


# 3. Unknown key
def test_3_unknown_key_returns_401(client):
    response = client.post(
        "/v1/score",
        json=SAMPLE_SCORE_PAYLOAD,
        headers={"Authorization": "Bearer rg_live_unknown_nonexistent_key_abcdef123456"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or missing authentication credentials"


# 4. Revoked key
def test_4_revoked_key_returns_401(client):
    _, plain_key = helper_create_key("merch_revoked_test", revoked=True, is_active=False)
    response = client.post(
        "/v1/score",
        json=SAMPLE_SCORE_PAYLOAD,
        headers={"Authorization": f"Bearer {plain_key}"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or missing authentication credentials"


# 5. Valid key -> 200, contract verified
def test_5_valid_key_returns_200_and_exact_contract(client):
    _, plain_key = helper_create_key("merch_valid_test")
    response = client.post(
        "/v1/score",
        json=SAMPLE_SCORE_PAYLOAD,
        headers={"Authorization": f"Bearer {plain_key}"},
    )
    assert response.status_code == 200
    data = response.json()

    required_keys = [
        "order_id",
        "channel",
        "risk_score",
        "risk_score_100",
        "tier",
        "policy_rule",
        "policy_action",
        "severity",
        "suggested_action",
        "reason_codes",
        "rule_hits",
        "ring_id",
        "model_version",
        "dataset",
        "threshold",
        "model_status",
        "feature_completeness",
        "explanation_status",
        "shadow",
    ]
    for k in required_keys:
        assert k in data, f"Missing required contract key: {k}"

    assert isinstance(data["risk_score"], float)
    assert isinstance(data["risk_score_100"], int)
    assert data["tier"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


# 6. Body merchant_id differs from key's merchant -> 400
def test_6_body_merchant_differs_from_key_merchant_returns_400(client):
    _, plain_key = helper_create_key("merch_owner_1")
    conflicting_payload = dict(SAMPLE_SCORE_PAYLOAD)
    conflicting_payload["merchant_id"] = "merch_intruder_2"

    response = client.post(
        "/v1/score",
        json=conflicting_payload,
        headers={"Authorization": f"Bearer {plain_key}"},
    )
    assert response.status_code == 400
    assert "does not match authenticated merchant" in response.json()["detail"]


# 7. Body merchant_id absent -> 200
def test_7_body_merchant_absent_returns_200(client):
    _, plain_key = helper_create_key("merch_no_mid_test")
    payload = dict(SAMPLE_SCORE_PAYLOAD)
    if "merchant_id" in payload:
        del payload["merchant_id"]

    response = client.post(
        "/v1/score",
        json=payload,
        headers={"Authorization": f"Bearer {plain_key}"},
    )
    assert response.status_code == 200


# 8. /health is open without authentication
def test_8_health_endpoint_open_without_auth(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# 9. Stored audit row contains authenticated merchant_id and no plain key or key hash
def test_9_stored_audit_row_contains_authenticated_merchant_and_no_key_secrets(client):
    merchant_id = "merch_audit_secure"
    _, plain_key = helper_create_key(merchant_id)
    key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()

    test_order_id = f"ord_audit_verify_{uuid.uuid4().hex[:8]}"
    payload = dict(SAMPLE_SCORE_PAYLOAD)
    payload["order_id"] = test_order_id

    response = client.post(
        "/v1/score",
        json=payload,
        headers={"Authorization": f"Bearer {plain_key}"},
    )
    assert response.status_code == 200

    db = SessionLocal()
    try:
        audit_row = (
            db.query(AuditScoreEvent)
            .filter(AuditScoreEvent.order_id == test_order_id)
            .first()
        )
        assert audit_row is not None, "AuditScoreEvent row must be persisted"
        assert audit_row.merchant_id == merchant_id, "Audit row must carry authenticated merchant_id"

        # Check for key leakage across all fields
        row_dict = {c.name: getattr(audit_row, c.name) for c in AuditScoreEvent.__table__.columns}
        serialized = json.dumps(str(row_dict))
        assert plain_key not in serialized, "Plain API key must NEVER be stored in audit records"
        assert key_hash not in serialized, "Key hash must NOT be stored in audit records"
    finally:
        db.close()


# 10. Two merchants: key A cannot produce audit rows under merchant B
def test_10_key_a_cannot_produce_audit_rows_under_merchant_b(client):
    merchant_a = "merch_company_A"
    merchant_b = "merch_company_B"
    _, key_a = helper_create_key(merchant_a)

    # Attempt to forge merchant B's identity in the body using Key A
    target_order_id = f"ord_spoof_{uuid.uuid4().hex[:8]}"
    spoof_payload = dict(SAMPLE_SCORE_PAYLOAD)
    spoof_payload["order_id"] = target_order_id
    spoof_payload["merchant_id"] = merchant_b

    response = client.post(
        "/v1/score",
        json=spoof_payload,
        headers={"Authorization": f"Bearer {key_a}"},
    )
    assert response.status_code == 400

    # Ensure NO audit row was created under merchant B
    db = SessionLocal()
    try:
        spoofed_row = (
            db.query(AuditScoreEvent)
            .filter(AuditScoreEvent.order_id == target_order_id)
            .first()
        )
        assert spoofed_row is None, "Rejected spoof attempt must not create any audit row"

        # When Key A scores without merchant_id, audit row is attributed to merchant A only
        legit_order_id = f"ord_legit_{uuid.uuid4().hex[:8]}"
        legit_payload = dict(SAMPLE_SCORE_PAYLOAD)
        legit_payload["order_id"] = legit_order_id
        if "merchant_id" in legit_payload:
            del legit_payload["merchant_id"]

        legit_resp = client.post(
            "/v1/score",
            json=legit_payload,
            headers={"Authorization": f"Bearer {key_a}"},
        )
        assert legit_resp.status_code == 200

        legit_row = (
            db.query(AuditScoreEvent)
            .filter(AuditScoreEvent.order_id == legit_order_id)
            .first()
        )
        assert legit_row is not None
        assert legit_row.merchant_id == merchant_a, "Must strictly record Merchant A"
        assert legit_row.merchant_id != merchant_b
    finally:
        db.close()

"""
Tests for POST /v1/score and Scoring Service (Phase C7).

Verifies:
1. Complete contract adherence per 02-architecture.md Section G.
2. Default shadow mode (`shadow=True`).
3. Model unavailable fallback behavior (amount-only rule, NEVER BLOCK).
4. Velocity burst triggering `rule_hits = ["spike_velocity"]`.
5. Consistency between policy_action and severity/suggested_action.
"""

import pytest
from fastapi.testclient import TestClient

from api.main import app
from backend.config import settings
from services.score import ScoringService


@pytest.fixture
def client():
    import datetime
    import hashlib
    import secrets
    import uuid
    from db.migrations import run_migrations
    from db.models import APIKey, Merchant
    from db.session import SessionLocal, engine

    run_migrations(engine)
    db = SessionLocal()
    merchant_id = "merch_score_v1_test"
    m = db.query(Merchant).filter_by(id=merchant_id).first()
    if not m:
        m = Merchant(id=merchant_id, name="Score V1 Test", email="v1@test.com")
        db.add(m)
        db.flush()

    plain_key = f"rg_test_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
    api_key = APIKey(
        id=f"key_{uuid.uuid4().hex[:16]}",
        merchant_id=merchant_id,
        key_prefix="rg_test_",
        key_hash=key_hash,
        name="V1 Test Key",
        is_active=True,
        created_at=datetime.datetime.now(datetime.UTC),
    )
    db.add(api_key)
    db.commit()
    db.close()

    c = TestClient(app)
    c.headers["Authorization"] = f"Bearer {plain_key}"
    return c


def test_shadow_mode_default():
    """Verify shadow mode is True by default in settings."""
    assert settings.SHADOW_MODE is True


def test_score_contract_schema(client):
    """
    Assert POST /v1/score returns all exact keys and types per 02-architecture.md Section G.
    """
    payload = {
        "order_id": "ord_test_001",
        "channel": "paypal",
        "amount": 1500.0,
        "features": {
            "amount": 1500.0,
            "amount_zscore": 0.5,
            "amount_vs_avg_ratio": 1.2,
            "prior_txn_count": 5,
            "time_since_prev_txn_min": 120.0,
            "velocity_5min": 0,
            "velocity_30min": 1,
            "velocity_60min": 1,
            "new_device_flag": 0,
            "new_geo_flag": 0,
            "failed_ratio_trailing10": 0.0,
            "account_age_days": 45,
            "hour_of_day": 14,
            "is_night": 0,
            "day_of_week": 2,
        },
    }

    response = client.post("/v1/score", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Exact contract keys from Section G
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

    for key in required_keys:
        assert key in data, f"Missing required key: {key}"

    assert data["order_id"] == "ord_test_001"
    assert data["channel"] == "paypal"
    assert isinstance(data["risk_score"], float)
    assert 0.0 <= data["risk_score"] <= 1.0
    assert isinstance(data["risk_score_100"], int)
    assert 0 <= data["risk_score_100"] <= 100
    assert data["tier"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert data["policy_action"] in [
        "ALLOW",
        "ALLOW_WITH_MONITORING",
        "STEP_UP_VERIFICATION",
        "BLOCK",
    ]
    assert data["severity"] in ["none", "info", "warning", "critical"]
    assert data["suggested_action"] in [
        "allow",
        "step_up_verify",
        "manual_review",
    ]
    assert isinstance(data["reason_codes"], list)
    assert isinstance(data["rule_hits"], list)
    assert data["model_status"] == "ok"
    assert data["threshold"] == 0.40
    assert data["shadow"] is True


def test_fallback_when_model_unavailable_amount_under_25k(client):
    """
    When model is unavailable and amount < 25,000 INR:
    - Must return ALLOW_WITH_MONITORING (severity: info, suggested_action: allow)
    - NEVER returns BLOCK
    - explanation_status is unavailable, reason_codes is empty
    """
    payload = {
        "order_id": "ord_fallback_small",
        "amount": 4999.0,
        "force_unavailable": True,
    }

    response = client.post("/v1/score", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["model_status"] == "unavailable"
    assert data["policy_action"] == "ALLOW_WITH_MONITORING"
    assert data["policy_action"] != "BLOCK"
    assert data["severity"] == "info"
    assert data["suggested_action"] == "allow"
    assert data["explanation_status"] == "unavailable"
    assert data["reason_codes"] == []
    assert data["shadow"] is True


def test_fallback_when_model_unavailable_amount_at_or_above_25k(client):
    """
    When model is unavailable and amount >= 25,000 INR:
    - Must return STEP_UP_VERIFICATION (severity: warning, suggested_action: step_up_verify)
    - NEVER returns BLOCK
    """
    payload = {
        "order_id": "ord_fallback_large",
        "amount": 35000.0,
        "force_unavailable": True,
    }

    response = client.post("/v1/score", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["model_status"] == "unavailable"
    assert data["policy_action"] == "STEP_UP_VERIFICATION"
    assert data["policy_action"] != "BLOCK"
    assert data["severity"] == "warning"
    assert data["suggested_action"] == "step_up_verify"
    assert data["explanation_status"] == "unavailable"
    assert data["reason_codes"] == []


def test_spike_velocity_triggers_in_rule_hits(client):
    """
    Burst velocity inputs must trigger spike_velocity in rule_hits,
    while leaving the model probability and policy action independent.
    """
    burst_payload = {
        "order_id": "ord_burst_001",
        "amount": 1200.0,
        "features": {
            "amount": 1200.0,
            "velocity_5min": 3,
            "velocity_30min": 5,
            "velocity_60min": 7,
            "prior_txn_count": 10,
        },
    }

    response = client.post("/v1/score", json=burst_payload)
    assert response.status_code == 200
    data = response.json()

    assert "spike_velocity" in data["rule_hits"]
    assert data["feature_completeness"] < 1.0


def test_header_fallback_simulation(client):
    """
    Simulating unavailable model via header triggers safe fallback.
    """
    response = client.post(
        "/v1/score",
        json={"order_id": "ord_hdr", "amount": 50000.0},
        headers={"X-Simulate-Model-Unavailable": "true"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_status"] == "unavailable"
    assert data["policy_action"] == "STEP_UP_VERIFICATION"
    assert data["policy_action"] != "BLOCK"

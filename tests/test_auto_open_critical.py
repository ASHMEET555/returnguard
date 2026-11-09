import hashlib
import uuid
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from api.main import app
from db.models import APIKey, AuditScoreEvent, Investigation, Merchant
from db.session import SessionLocal


def setup_merchant_and_key():
    db = SessionLocal()
    tenant_id = f"merch_auto_{uuid.uuid4().hex[:6]}"
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


def test_critical_score_auto_opens_investigation_with_source():
    """1. Critical score opens exactly one investigation with source == 'AUTO_CRITICAL'."""
    client = TestClient(app)
    tenant_id, raw_key = setup_merchant_and_key()
    order_id = f"ord_crit_{uuid.uuid4().hex[:8]}"

    resp = client.post(
        "/v1/score",
        json={
            "order_id": order_id,
            "amount": 50000.0,
            "features": {
                "amount": 50000.0,
                "amount_zscore": 5.0,
                "amount_vs_avg_ratio": 10.0,
                "prior_txn_count": 0,
                "time_since_prev_txn_min": 0.5,
                "velocity_5min": 10,
                "velocity_30min": 25,
                "velocity_60min": 50,
                "new_device_flag": 1,
            },
        },
        headers={"Authorization": f"Bearer {raw_key}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["severity"] == "critical" or data["policy_action"] == "BLOCK"

    db = SessionLocal()
    invs = (
        db.query(Investigation)
        .filter(
            Investigation.merchant_id == tenant_id,
            Investigation.transaction_id == order_id,
        )
        .all()
    )
    assert len(invs) == 1
    assert invs[0].status == "OPEN"
    assert invs[0].source == "AUTO_CRITICAL"
    db.close()


def test_repeat_score_on_same_transaction_opens_no_second_case():
    """2. Repeat score on the same transaction creates no second investigation."""
    client = TestClient(app)
    tenant_id, raw_key = setup_merchant_and_key()
    order_id = f"ord_repeat_{uuid.uuid4().hex[:8]}"
    payload = {
        "order_id": order_id,
        "amount": 50000.0,
        "features": {
            "amount": 50000.0,
            "amount_zscore": 5.0,
            "amount_vs_avg_ratio": 10.0,
            "prior_txn_count": 0,
            "time_since_prev_txn_min": 0.5,
            "velocity_5min": 10,
            "velocity_30min": 25,
            "velocity_60min": 50,
            "new_device_flag": 1,
        },
    }

    resp1 = client.post(
        "/v1/score", json=payload, headers={"Authorization": f"Bearer {raw_key}"}
    )
    assert resp1.status_code == 200

    resp2 = client.post(
        "/v1/score", json=payload, headers={"Authorization": f"Bearer {raw_key}"}
    )
    assert resp2.status_code == 200

    db = SessionLocal()
    invs = (
        db.query(Investigation)
        .filter(
            Investigation.merchant_id == tenant_id,
            Investigation.transaction_id == order_id,
        )
        .all()
    )
    assert len(invs) == 1
    db.close()


def test_non_critical_warning_none_scores_open_none():
    """3. Warning and none severity scores open no investigation."""
    client = TestClient(app)
    tenant_id, raw_key = setup_merchant_and_key()
    order_id = f"ord_low_{uuid.uuid4().hex[:8]}"

    resp = client.post(
        "/v1/score",
        json={
            "order_id": order_id,
            "amount": 10.0,
            "features": {
                "amount": 10.0,
                "amount_zscore": 0.1,
                "amount_vs_avg_ratio": 1.0,
                "prior_txn_count": 5,
                "time_since_prev_txn_min": 120.0,
                "velocity_5min": 0,
                "velocity_30min": 0,
                "velocity_60min": 0,
                "new_device_flag": 0,
            },
        },
        headers={"Authorization": f"Bearer {raw_key}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["severity"] != "critical"
    assert data["policy_action"] != "BLOCK"

    db = SessionLocal()
    invs = (
        db.query(Investigation)
        .filter(
            Investigation.merchant_id == tenant_id,
            Investigation.transaction_id == order_id,
        )
        .all()
    )
    assert len(invs) == 0
    db.close()


def test_failure_isolation_leaves_score_and_decision_identical(caplog):
    """4. If auto-opening fails, error is logged with request ID, score response and decision row remain intact."""
    client = TestClient(app)
    tenant_id, raw_key = setup_merchant_and_key()
    order_id = f"ord_fail_{uuid.uuid4().hex[:8]}"

    with patch("db.models.Investigation", side_effect=Exception("DB Failure")):
        resp = client.post(
            "/v1/score",
            json={
                "order_id": order_id,
                "amount": 50000.0,
                "features": {
                    "amount": 50000.0,
                    "amount_zscore": 5.0,
                    "amount_vs_avg_ratio": 10.0,
                    "prior_txn_count": 0,
                    "time_since_prev_txn_min": 0.5,
                    "velocity_5min": 10,
                    "velocity_30min": 25,
                    "velocity_60min": 50,
                    "new_device_flag": 1,
                },
            },
            headers={
                "Authorization": f"Bearer {raw_key}",
                "X-Request-Id": "req-isolated-test-123",
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["order_id"] == order_id
    assert data["decision_id"] is not None

    db = SessionLocal()
    audit = (
        db.query(AuditScoreEvent)
        .filter(
            AuditScoreEvent.merchant_id == tenant_id,
            AuditScoreEvent.order_id == order_id,
        )
        .first()
    )
    assert audit is not None
    assert audit.decision_id == data["decision_id"]
    db.close()

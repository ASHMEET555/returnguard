"""Tests for Step C2: Auto-open investigation on critical decisions."""

import datetime
import hashlib
import json
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from db.models import APIKey, AuditScoreEvent, Investigation, Merchant
from db.session import SessionLocal


@pytest.fixture
def c2_merchant():
    mid = f"merch_c2_{uuid.uuid4().hex[:8]}"
    raw_key = f"rg_live_c2_{uuid.uuid4().hex}"
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    db = SessionLocal()
    m = Merchant(id=mid, name=f"Merchant {mid}", email=f"{mid}@test.internal")
    db.add(m)
    k = APIKey(
        id=f"k_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        key_prefix="rg_live_",
        key_hash=key_hash,
        name="C2 Key",
        is_active=True,
    )
    db.add(k)
    db.commit()
    db.close()

    return mid, raw_key


def test_critical_score_auto_opens_exactly_one_case(c2_merchant):
    mid, raw_key = c2_merchant
    client = TestClient(app)
    order_id = f"ord_crit_{uuid.uuid4().hex[:8]}"

    # A high amount transaction or adversarial features yielding critical risk score >= 0.80
    resp = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {raw_key}"},
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
                "new_geo_flag": 1,
                "failed_ratio_trailing10": 0.9,
                "account_age_days": 0.1,
                "hour_of_day": 3,
                "is_night": 1,
                "day_of_week": 6,
            },
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["severity"] == "critical" or data["policy_action"] == "BLOCK"

    db = SessionLocal()
    invs = (
        db.query(Investigation)
        .filter(
            Investigation.merchant_id == mid,
            Investigation.transaction_id == order_id,
        )
        .all()
    )
    assert len(invs) == 1
    assert invs[0].status == "OPEN"
    assert invs[0].decision_id == data["decision_id"]
    db.close()


def test_repeat_scoring_does_not_open_second_case(c2_merchant):
    mid, raw_key = c2_merchant
    client = TestClient(app)
    order_id = f"ord_repeat_{uuid.uuid4().hex[:8]}"
    crit_payload = {
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
            "new_geo_flag": 1,
            "failed_ratio_trailing10": 0.9,
            "account_age_days": 0.1,
            "hour_of_day": 3,
            "is_night": 1,
            "day_of_week": 6,
        },
    }

    # Score once
    resp1 = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {raw_key}"},
        json=crit_payload,
    )
    assert resp1.status_code == 200

    # Score again with same order_id
    resp2 = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {raw_key}"},
        json=crit_payload,
    )
    assert resp2.status_code == 200

    db = SessionLocal()
    invs = (
        db.query(Investigation)
        .filter(
            Investigation.merchant_id == mid,
            Investigation.transaction_id == order_id,
        )
        .all()
    )
    # Exactly one open investigation maintained (idempotent)
    assert len(invs) == 1
    db.close()


def test_non_critical_score_opens_no_investigation(c2_merchant):
    mid, raw_key = c2_merchant
    client = TestClient(app)
    order_id = f"ord_low_{uuid.uuid4().hex[:8]}"

    resp = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {raw_key}"},
        json={"order_id": order_id, "amount": 100.0},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["severity"] != "critical"
    assert data["policy_action"] != "BLOCK"

    db = SessionLocal()
    invs = (
        db.query(Investigation)
        .filter(
            Investigation.merchant_id == mid,
            Investigation.transaction_id == order_id,
        )
        .all()
    )
    assert len(invs) == 0
    db.close()


def test_failure_to_open_case_leaves_score_response_and_decision_row_intact(
    c2_merchant, monkeypatch
):
    """If the auto-open investigation mechanism encounters a database error, score response is unaffected."""
    mid, raw_key = c2_merchant
    client = TestClient(app)
    order_id = f"ord_error_handled_{uuid.uuid4().hex[:8]}"

    # Patch SessionLocal to simulate failure in auto-open
    import db.session

    real_session_local = db.session.SessionLocal

    def broken_session():
        raise RuntimeError(
            "Simulated DB connection error in auto-open background block"
        )

    # Monkeypatch specifically inside the score route import
    import api.routes.score

    monkeypatch.setattr(api.routes.score, "SessionLocal", broken_session, raising=False)

    resp = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {raw_key}"},
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
                "new_geo_flag": 1,
                "failed_ratio_trailing10": 0.9,
                "account_age_days": 0.1,
                "hour_of_day": 3,
                "is_night": 1,
                "day_of_week": 6,
            },
        },
    )
    # Score response returns 200 successfully despite auto-open error
    assert resp.status_code == 200
    data = resp.json()
    assert data["order_id"] == order_id

    # Decision audit row is safely stored
    db = real_session_local()
    audit = (
        db.query(AuditScoreEvent)
        .filter(AuditScoreEvent.decision_id == data["decision_id"])
        .first()
    )
    assert audit is not None
    assert audit.order_id == order_id
    db.close()

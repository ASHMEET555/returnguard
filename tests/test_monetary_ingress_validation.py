"""
Tests for Ingress Monetary Validation on POST /v1/score.

Verifies:
1. Fractional numeric unit_price (e.g. 0.1, 0.1 + 0.2) is rejected with HTTP 422.
2. Fractional numeric total in order_summary (e.g. 1.005) is rejected with HTTP 422.
3. Unsafe integers (> 2^53-1) are rejected with HTTP 422.
4. Rejected requests create ZERO database audit records.
5. Canonical decimal strings ("0.10", "99999999999999999.99") succeed and survive persistence and audit reconstruction unchanged.
6. Safe integer inputs (100) succeed for backward compatibility.
7. Top-level ML scoring float amount behavior remains unaffected.
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


@pytest.fixture
def score_client():
    run_migrations(engine)
    db = SessionLocal()
    merchant_id = f"merch_monetary_{uuid.uuid4().hex[:8]}"
    m = Merchant(id=merchant_id, name="Monetary Test Merchant", email="monetary@test.com")
    db.add(m)
    db.flush()

    plain_key = f"rg_test_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
    api_key = APIKey(
        id=f"key_{uuid.uuid4().hex[:16]}",
        merchant_id=merchant_id,
        key_prefix="rg_test_",
        key_hash=key_hash,
        name="Monetary Key",
        is_active=True,
        created_at=datetime.datetime.now(datetime.UTC),
    )
    db.add(api_key)
    db.commit()
    db.close()

    c = TestClient(app)
    c.headers["Authorization"] = f"Bearer {plain_key}"
    return c, merchant_id


def test_reject_fractional_unit_price_in_line_items(score_client):
    client, mid = score_client
    db = SessionLocal()
    audit_count_before = db.query(AuditScoreEvent).filter_by(merchant_id=mid).count()
    db.close()

    payload = {
        "order_id": f"ord_float_{uuid.uuid4().hex[:8]}",
        "amount": 500.0,
        "line_items": [
            {
                "name": "Invalid Float Item",
                "quantity": 1,
                "unit_price": 0.1,  # Fractional float must be rejected
            }
        ],
    }

    res = client.post("/v1/score", json=payload)
    assert res.status_code == 422
    err_body = res.json()
    assert "detail" in err_body
    assert any("unit_price" in str(err) for err in err_body["detail"])

    # Invariant: Rejected request creates ZERO audit records
    db = SessionLocal()
    audit_count_after = db.query(AuditScoreEvent).filter_by(merchant_id=mid).count()
    db.close()
    assert audit_count_after == audit_count_before


def test_reject_drift_float_in_line_items(score_client):
    client, _ = score_client
    payload = {
        "order_id": f"ord_drift_{uuid.uuid4().hex[:8]}",
        "amount": 500.0,
        "line_items": [
            {
                "quantity": 1,
                "total_amount": 0.1 + 0.2,  # 0.30000000000000004
            }
        ],
    }
    res = client.post("/v1/score", json=payload)
    assert res.status_code == 422


def test_reject_fractional_total_in_order_summary(score_client):
    client, _ = score_client
    payload = {
        "order_id": f"ord_sum_{uuid.uuid4().hex[:8]}",
        "amount": 500.0,
        "order_summary": {
            "total": 1.005,  # Fractional float rejected
        },
    }
    res = client.post("/v1/score", json=payload)
    assert res.status_code == 422


def test_reject_unsafe_integer_in_nested_items(score_client):
    client, _ = score_client
    payload = {
        "order_id": f"ord_unsafe_{uuid.uuid4().hex[:8]}",
        "amount": 500.0,
        "order_summary": {
            "items": [
                {
                    "quantity": 1,
                    "unit_price": 9007199254740992,  # > MAX_SAFE_INTEGER
                }
            ]
        },
    }
    res = client.post("/v1/score", json=payload)
    assert res.status_code == 422


def test_accept_canonical_decimal_strings_and_reconstruct_exact(score_client):
    client, mid = score_client
    order_id = f"ord_exact_{uuid.uuid4().hex[:8]}"

    payload = {
        "order_id": order_id,
        "amount": 1000.0,  # ML scoring float
        "currency": "USD",
        "line_items": [
            {
                "name": "Micro Precision Item",
                "quantity": "3",
                "unit_price": "0.10",
                "total_amount": "0.30",
            },
            {
                "name": "Large Value Item",
                "quantity": 1,
                "unit_price": "99999999999999999.99",
                "total_amount": "99999999999999999.99",
            },
        ],
        "order_summary": {
            "order_id": order_id,
            "currency": "USD",
            "total": "100000000000000000.29",
        },
    }

    res = client.post("/v1/score", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["order_id"] == order_id
    assert "risk_score" in data
    decision_id = data.get("decision_id")
    assert decision_id is not None

    # Verify audit reconstruction returns exact strings without float corruption
    audit_res = client.get(f"/v1/decisions/{decision_id}/audit")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()["data"]

    reconstructed_items = audit_data["line_items"]
    assert len(reconstructed_items) == 2
    assert reconstructed_items[0]["unit_price"] == "0.10"
    assert reconstructed_items[0]["total_amount"] == "0.30"
    assert reconstructed_items[1]["unit_price"] == "99999999999999999.99"
    assert reconstructed_items[1]["total_amount"] == "99999999999999999.99"

    reconstructed_summary = audit_data["order_summary"]
    assert reconstructed_summary["total"] == "100000000000000000.29"


def test_accept_safe_integers_for_compatibility(score_client):
    client, _ = score_client
    order_id = f"ord_safe_int_{uuid.uuid4().hex[:8]}"

    payload = {
        "order_id": order_id,
        "amount": 200.0,
        "line_items": [
            {
                "name": "Integer Item",
                "quantity": 2,
                "unit_price": 100,  # Safe integer 100
            }
        ],
    }

    res = client.post("/v1/score", json=payload)
    assert res.status_code == 200

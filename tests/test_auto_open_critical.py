import hashlib
import uuid
import pytest
from fastapi.testclient import TestClient
from api.main import app
from db.models import APIKey, Investigation, Merchant
from db.session import SessionLocal


def test_critical_score_auto_opens_investigation_with_source():
    """Failing test for Step 0: Critical score must open an investigation with source=AUTO_CRITICAL."""
    client = TestClient(app)
    db = SessionLocal()
    tenant_id = f"merch_failing_{uuid.uuid4().hex[:6]}"
    m = Merchant(id=tenant_id, name="Test Merchant", email="test@test.com")
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

    inv = (
        db.query(Investigation)
        .filter(
            Investigation.merchant_id == tenant_id,
            Investigation.transaction_id == order_id,
        )
        .first()
    )
    assert inv is not None, "Expected an OPEN investigation to be created"
    assert inv.status == "OPEN"
    # Fails because source column does not exist yet on Investigation model/table
    assert hasattr(inv, "source"), "Investigation model is missing 'source' attribute"
    assert (
        inv.source == "AUTO_CRITICAL"
    ), f"Expected source AUTO_CRITICAL, got {getattr(inv, 'source', None)}"
    db.close()

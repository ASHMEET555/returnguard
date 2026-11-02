"""
Audit privacy compliance tests.

Verifies that audit score rows store zero customer IDs, device IDs, or raw geography strings,
ensuring strict privacy and PII protection across audit_score_events and audit_log tables.
"""

import json
from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.models import Base as AppBase, AuditScoreEvent, Order, Merchant, Customer, Address, Device
from features.builder import build
from backend.services.audit_service import AuditStore, AuditLogEntry
from ml.evaluation.decision_engine import make_decision


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    AppBase.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_audit_score_events_stores_no_pii_or_device_geo(test_db):
    """
    Assert that AuditScoreEvent rows do not store customer_id, device_id,
    or geographic strings in either tabular columns or serialized feature snapshots.
    """
    session = test_db

    # Seed order with sensitive identifiers
    sensitive_cust_id = "CUST-SECRET-PII-7777"
    sensitive_dev_id = "DEVICE-FINGERPRINT-HEX-9999"
    sensitive_geo = "Karnataka-Bangalore-Urban"

    m = Merchant(id="m_priv", name="Merchant Privacy", email="privacy@merchant.com")
    c = Customer(id=sensitive_cust_id, merchant_id="m_priv", email="user@sensitive.com", phone="+919876543210")
    a = Address(id="a_priv", customer_id=sensitive_cust_id, line1="123 Private Road", city="Bangalore", state="KA", pincode="560001")
    d = Device(id="d_priv", customer_id=sensitive_cust_id, device_hash=sensitive_dev_id)
    session.add_all([m, c, a, d])
    session.flush()

    o = Order(
        id="ord_priv_001",
        merchant_id="m_priv",
        customer_id=sensitive_cust_id,
        address_id="a_priv",
        device_id="d_priv",
        channel="paypal",
        order_value=5000.0,
        category="retail",
        order_time=datetime(2026, 6, 1, 12, 0, 0),
    )
    session.add(o)
    session.flush()

    # Build features and write snapshot to AuditScoreEvent
    order_data = {
        "customer_id": sensitive_cust_id,
        "merchant_id": "m_priv",
        "merchant_category": "retail",
        "timestamp": "2026-06-01T12:00:00Z",
        "amount": 5000.0,
        "device_id": sensitive_dev_id,
        "geo_region": sensitive_geo,
        "payment_method": "card",
        "status": "success",
        "account_created": "2026-01-01T00:00:00Z",
    }

    result = build("ord_priv_001", as_of="2026-06-01T12:00:00Z", order_record=order_data, db_session=session)
    session.commit()

    # Query back the stored audit row
    event = session.query(AuditScoreEvent).filter(AuditScoreEvent.order_id == "ord_priv_001").first()
    assert event is not None

    # 1. Structural column check
    column_names = {col.name for col in AuditScoreEvent.__table__.columns}
    assert "customer_id" not in column_names, "AuditScoreEvent must NOT have a customer_id column"
    assert "device_id" not in column_names, "AuditScoreEvent must NOT have a device_id column"
    assert "geo_region" not in column_names, "AuditScoreEvent must NOT have a geo_region column"
    assert "ip_address" not in column_names, "AuditScoreEvent must NOT have an ip_address column"
    assert "phone" not in column_names, "AuditScoreEvent must NOT have a phone column"

    # 2. Content privacy check on feature_snapshot_json
    snapshot_str = event.feature_snapshot_json
    assert snapshot_str is not None
    assert sensitive_cust_id not in snapshot_str, "Sensitive customer_id must not leak into snapshot JSON"
    assert sensitive_dev_id not in snapshot_str, "Sensitive device_id must not leak into snapshot JSON"
    assert sensitive_geo not in snapshot_str, "Raw geography string must not leak into snapshot JSON"

    # Novelty flags are strictly numerical (0 or 1), never leaking raw values
    snapshot = json.loads(snapshot_str)
    assert snapshot["new_device_flag"] in (0, 1)
    assert snapshot["new_geo_flag"] in (0, 1)


def test_audit_log_entry_stores_no_pii_or_device_geo():
    """Verify backend AuditLogEntry table also strictly omits customer and device identifiers."""
    store = AuditStore(db_url="sqlite:///:memory:")

    decision = make_decision(
        transaction_id="txn_priv_999",
        model_probability=0.75,
        amount=1200.0,
        model_explanation=["Transaction amount is high"],
    )

    store.record_decision(
        request_id="req_priv_123",
        decision_record=decision,
        top_reasons=["Transaction amount is high"],
        source="manual",
    )

    session = store.Session()
    entry = session.query(AuditLogEntry).filter(AuditLogEntry.request_id == "req_priv_123").first()
    assert entry is not None

    columns = {col.name for col in AuditLogEntry.__table__.columns}
    assert "customer_id" not in columns
    assert "device_id" not in columns
    assert "geo_region" not in columns
    assert "ip_address" not in columns
    session.close()

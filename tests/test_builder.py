"""
Tests for FeatureBuilder wrapper.

Verifies:
1. build(order_id, as_of) returns the verified 15-feature vector.
2. Identical inputs produce byte-for-byte identical feature_snapshot_json.
3. Feature snapshot writes to the AuditScoreEvent table in SQLite schema.
"""

from datetime import datetime
import json
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from features.builder import build, FeatureBuilder
from ml.features.build_features import FEATURE_COLUMNS
from db.models import Base, AuditScoreEvent, Order, Merchant, Customer, Address, Device


@pytest.fixture
def in_memory_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_builder_returns_15_features():
    """Verify build() returns all 15 active model features."""
    order_data = {
        "customer_id": "cust_101",
        "merchant_id": "merch_1",
        "merchant_category": "electronics",
        "timestamp": "2026-05-15T12:00:00Z",
        "amount": 2500.0,
        "device_id": "dev_101",
        "geo_region": "IN-KA",
        "payment_method": "card",
        "status": "success",
        "account_created": "2026-01-01T00:00:00Z",
    }
    result = build("order_test_101", as_of="2026-05-15T12:00:00Z", order_record=order_data)

    assert len(result.feature_vector) == 15
    assert len(result.features) == 15
    for feat in FEATURE_COLUMNS:
        assert feat in result.features


def test_builder_byte_identical_determinism():
    """Verify identical inputs give byte-for-byte identical snapshot outputs."""
    order_data = {
        "customer_id": "cust_det",
        "merchant_id": "merch_det",
        "merchant_category": "apparel",
        "timestamp": "2026-06-01T10:00:00Z",
        "amount": 1499.0,
        "device_id": "dev_det",
        "geo_region": "IN-MH",
        "payment_method": "upi",
        "status": "success",
        "account_created": "2026-02-01T00:00:00Z",
    }
    as_of = "2026-06-01T10:00:00Z"

    call1 = build("order_det_1", as_of=as_of, order_record=order_data)
    call2 = build("order_det_1", as_of=as_of, order_record=order_data)

    # Compare encoded bytes directly
    bytes1 = call1.feature_snapshot_json.encode("utf-8")
    bytes2 = call2.feature_snapshot_json.encode("utf-8")

    assert bytes1 == bytes2
    assert call1.feature_vector == call2.feature_vector


def test_builder_writes_feature_snapshot_to_audit(in_memory_db):
    """Verify build() populates feature_snapshot_json on AuditScoreEvent."""
    session = in_memory_db

    # Seed minimal foreign key entities
    m = Merchant(id="m1", name="Merchant 1", email="m1@example.com")
    c = Customer(id="c1", merchant_id="m1", email="c1@example.com", phone="+919876543210")
    a = Address(id="a1", customer_id="c1", line1="123 Road", city="Bangalore", state="KA", pincode="560001")
    d = Device(id="d1", customer_id="c1", device_hash="dhash_12345")
    session.add_all([m, c, a, d])
    session.flush()

    o = Order(
        id="ord_audit_test",
        merchant_id="m1",
        customer_id="c1",
        address_id="a1",
        device_id="d1",
        channel="paypal",
        order_value=3200.0,
        category="retail",
        order_time=datetime(2026, 7, 1, 15, 0, 0),
    )
    session.add(o)
    session.flush()

    result = build("ord_audit_test", as_of=datetime(2026, 7, 1, 15, 0, 0), db_session=session)
    session.commit()

    # Query back the written AuditScoreEvent
    event = session.query(AuditScoreEvent).filter(AuditScoreEvent.order_id == "ord_audit_test").first()
    assert event is not None
    assert event.feature_snapshot_json is not None
    assert event.feature_snapshot_json == result.feature_snapshot_json

    # Parse JSON to verify valid 15-feature dictionary
    snapshot = json.loads(event.feature_snapshot_json)
    assert len(snapshot) == 15
    assert "amount" in snapshot
    assert "velocity_5min" in snapshot

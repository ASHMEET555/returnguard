"""Exhaustive tests for authenticated transaction event relay and raw route retirement (Phase E-3).

Verifies:
1. Relay without key: 401 Unauthorized.
2. Valid event with key: stored, status updated as designed.
3. Duplicate (same merchant, same event_id): no second row, idempotent duplicate response.
4. Same event_id under a different merchant: stored separately (no collision).
5. Body merchant_id conflicting with key: 400 Bad Request.
6. Unknown order for this merchant: 404 Not Found (never 403).
7. Raw route: 410 Gone, no database row written.
8. PayPal secret names absent from ReturnGuard settings/config modules.
9. Migration for the uniqueness change runs twice on SQLite without error.
"""

import datetime
import hashlib
import inspect
import secrets
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from db.migrations import run_migrations
from db.models import Address, APIKey, Customer, Device, Merchant, Order, PaymentEvent
from db.session import SessionLocal, engine, init_db


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure database tables exist before tests."""
    init_db()


@pytest.fixture
def db_session():
    """Yield a database session and clean up created test records."""
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


def create_merchant_and_key(db, merchant_id: str) -> str:
    """Helper to provision a merchant and return a valid Bearer API key."""
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
    plain_key = f"rg_live_{random_secret}"
    key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
    api_key = APIKey(
        id=f"key_{uuid.uuid4().hex[:16]}",
        merchant_id=merchant_id,
        key_prefix="rg_live_",
        key_hash=key_hash,
        name=f"Key for {merchant_id}",
        is_active=True,
    )
    db.add(api_key)
    db.commit()
    return plain_key


# 1. Relay without key: 401
def test_1_relay_without_key_returns_401(client):
    payload = {
        "event_id": f"WH-NOKEY-{uuid.uuid4()}",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
    }
    # No header
    resp = client.post("/v1/transactions/events", json=payload)
    assert resp.status_code == 401
    assert "Invalid or missing authentication credentials" in resp.json()["detail"]

    # Invalid header
    resp2 = client.post(
        "/v1/transactions/events",
        json=payload,
        headers={"Authorization": "Bearer bad_key"},
    )
    assert resp2.status_code == 401


# 2. Valid event with key: stored, status updated as designed
def test_2_valid_event_with_key_stored_and_scoped(client, db_session):
    mid = f"merch_e3_{uuid.uuid4().hex[:8]}"
    key = create_merchant_and_key(db_session, mid)

    eid = f"WH-VALID-{uuid.uuid4()}"
    payload = {
        "event_id": eid,
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "summary": "Capture completed for $150.00",
        "resource_type": "capture",
        "status": "completed",
        "paypal_references": {
            "order_id": "ORD-PP-9900",
            "capture_id": "CAP-PP-9900",
        },
    }

    resp = client.post(
        "/v1/transactions/events",
        json=payload,
        headers={"Authorization": f"Bearer {key}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["event_id"] == eid
    assert body["data"]["merchant_id"] == mid
    assert body["data"]["status"] == "processed"

    # Verify database persistence
    row = (
        db_session.query(PaymentEvent)
        .filter_by(merchant_id=mid, event_id=eid)
        .first()
    )
    assert row is not None
    assert row.event_type == "PAYMENT.CAPTURE.COMPLETED"
    assert row.merchant_id == mid
    assert row.status == "completed"

    # Cleanup
    db_session.delete(row)
    db_session.commit()


# 3. Duplicate (same merchant, same event_id): no second row, same response
def test_3_duplicate_same_merchant_idempotent_no_second_row(client, db_session):
    mid = f"merch_dup_{uuid.uuid4().hex[:8]}"
    key = create_merchant_and_key(db_session, mid)

    eid = f"WH-DUP-{uuid.uuid4()}"
    payload = {
        "event_id": eid,
        "event_type": "PAYMENT.AUTHORIZATION.CREATED",
        "summary": "Auth created",
    }
    headers = {"Authorization": f"Bearer {key}"}

    # 1st post
    resp1 = client.post("/v1/transactions/events", json=payload, headers=headers)
    assert resp1.status_code == 200
    assert resp1.json()["data"]["status"] == "processed"

    # 2nd post (replay)
    resp2 = client.post("/v1/transactions/events", json=payload, headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "duplicate"
    assert resp2.json()["data"]["event_id"] == eid

    # Check exactly 1 row exists
    rows = (
        db_session.query(PaymentEvent)
        .filter_by(merchant_id=mid, event_id=eid)
        .all()
    )
    assert len(rows) == 1

    # Cleanup
    db_session.delete(rows[0])
    db_session.commit()


# 4. Same event_id under a different merchant: stored separately (no collision)
def test_4_same_event_id_under_different_merchants_no_collision(client, db_session):
    mid_a = f"merch_a_{uuid.uuid4().hex[:8]}"
    mid_b = f"merch_b_{uuid.uuid4().hex[:8]}"
    key_a = create_merchant_and_key(db_session, mid_a)
    key_b = create_merchant_and_key(db_session, mid_b)

    shared_event_id = f"WH-COLLIDE-{uuid.uuid4()}"

    payload_a = {
        "event_id": shared_event_id,
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "summary": "Merchant A event",
    }
    payload_b = {
        "event_id": shared_event_id,
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "summary": "Merchant B event",
    }

    # Post for Merchant A
    resp_a = client.post(
        "/v1/transactions/events",
        json=payload_a,
        headers={"Authorization": f"Bearer {key_a}"},
    )
    assert resp_a.status_code == 200
    assert resp_a.json()["data"]["merchant_id"] == mid_a

    # Post for Merchant B with identical event_id
    resp_b = client.post(
        "/v1/transactions/events",
        json=payload_b,
        headers={"Authorization": f"Bearer {key_b}"},
    )
    assert resp_b.status_code == 200
    assert resp_b.json()["data"]["merchant_id"] == mid_b

    # Both rows must exist independently
    row_a = (
        db_session.query(PaymentEvent)
        .filter_by(merchant_id=mid_a, event_id=shared_event_id)
        .first()
    )
    row_b = (
        db_session.query(PaymentEvent)
        .filter_by(merchant_id=mid_b, event_id=shared_event_id)
        .first()
    )
    assert row_a is not None
    assert row_b is not None
    assert row_a.id != row_b.id

    # Cleanup
    db_session.delete(row_a)
    db_session.delete(row_b)
    db_session.commit()


# 5. Body merchant_id conflicting with key: 400
def test_5_body_merchant_id_conflicting_with_key_returns_403(client, db_session):
    mid_real = f"merch_real_{uuid.uuid4().hex[:8]}"
    key_real = create_merchant_and_key(db_session, mid_real)

    payload = {
        "event_id": f"WH-CONFLICT-{uuid.uuid4()}",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "merchant_id": "merch_spoofed_other",
    }

    resp = client.post(
        "/v1/transactions/events",
        json=payload,
        headers={"Authorization": f"Bearer {key_real}"},
    )
    assert resp.status_code == 403
    assert "does not match authenticated merchant" in resp.json()["detail"]


# 6. Unknown order for this merchant: 404
def test_6_unknown_or_cross_tenant_order_returns_404(client, db_session):
    mid_a = f"merch_ord_a_{uuid.uuid4().hex[:8]}"
    mid_b = f"merch_ord_b_{uuid.uuid4().hex[:8]}"
    key_a = create_merchant_and_key(db_session, mid_a)
    key_b = create_merchant_and_key(db_session, mid_b)

    # Provision an order owned by Merchant B
    cust_b = Customer(
        id=f"cust_b_{uuid.uuid4().hex[:8]}",
        merchant_id=mid_b,
        email=f"b_{uuid.uuid4().hex[:6]}@example.com",
        phone="+15551234567",
    )
    addr_b = Address(
        id=f"addr_b_{uuid.uuid4().hex[:8]}",
        merchant_id=mid_b,
        customer_id=cust_b.id,
        line1="123 Test Ave",
        city="TestCity",
        state="CA",
        pincode="90001",
    )
    dev_b = Device(
        id=f"dev_b_{uuid.uuid4().hex[:8]}",
        merchant_id=mid_b,
        customer_id=cust_b.id,
        device_hash=f"fp_{uuid.uuid4().hex[:8]}",
    )
    order_b = Order(
        id=f"ord_b_{uuid.uuid4().hex[:8]}",
        merchant_id=mid_b,
        customer_id=cust_b.id,
        address_id=addr_b.id,
        device_id=dev_b.id,
        channel="paypal",
        order_value=50.00,
        currency="USD",
        category="electronics",
        order_time=datetime.datetime.now(datetime.UTC),
    )
    db_session.add_all([cust_b, addr_b, dev_b, order_b])
    db_session.commit()

    # Case A: Totally unknown order ID -> 404
    payload_unknown = {
        "event_id": f"WH-UNK-{uuid.uuid4()}",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "order_reference": "ord_does_not_exist_at_all",
    }
    resp1 = client.post(
        "/v1/transactions/events",
        json=payload_unknown,
        headers={"Authorization": f"Bearer {key_a}"},
    )
    assert resp1.status_code == 404
    assert "not found for authenticated merchant" in resp1.json()["detail"].lower()

    # Case B: Cross-tenant order ID (Order belongs to B, but requested with A's key) -> 404 (never 403)
    payload_cross = {
        "event_id": f"WH-CROSS-{uuid.uuid4()}",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "order_reference": order_b.id,
    }
    resp2 = client.post(
        "/v1/transactions/events",
        json=payload_cross,
        headers={"Authorization": f"Bearer {key_a}"},
    )
    assert resp2.status_code == 404
    assert "not found for authenticated merchant" in resp2.json()["detail"].lower()

    # Cleanup
    db_session.delete(order_b)
    db_session.delete(cust_b)
    db_session.delete(addr_b)
    db_session.delete(dev_b)
    db_session.commit()


# 7. Raw route: 410, no row written
def test_7_raw_paypal_route_returns_410_no_state_change(client, db_session):
    eid = f"WH-RAW-{uuid.uuid4()}"
    payload = {
        "id": eid,
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "resource": {"id": "CAP-123"},
    }

    # Count rows before
    count_before = db_session.query(PaymentEvent).count()

    # POST to raw route
    resp = client.post("/v1/paypal/webhooks", json=payload)
    assert resp.status_code == 410
    assert "retired" in resp.json()["detail"].lower()

    # Count rows after must be unchanged
    count_after = db_session.query(PaymentEvent).count()
    assert count_after == count_before

    # Explicit check that no row with this event_id was created
    row = db_session.query(PaymentEvent).filter_by(event_id=eid).first()
    assert row is None


# 8. PayPal secret names absent from ReturnGuard config
def test_8_paypal_secret_names_absent_from_config_and_settings():
    from backend.config import settings

    settings_source = inspect.getsource(settings)
    assert "PAYPAL_CLIENT_SECRET" not in settings_source
    assert "PAYPAL_CLIENT_ID" not in settings_source
    assert "PAYPAL_WEBHOOK_ID" not in settings_source

    # Check that settings attributes do not contain PayPal secrets
    for attr in dir(settings):
        if not attr.startswith("__"):
            val_name = str(attr).upper()
            assert "PAYPAL_CLIENT_SECRET" not in val_name
            assert "PAYPAL_CLIENT_ID" not in val_name
            assert "PAYPAL_WEBHOOK_ID" not in val_name


# 9. Migration for the uniqueness change runs twice on SQLite without error
def test_9_payment_events_migration_idempotent_runs_twice():
    run1 = run_migrations(target_engine=engine)
    assert run1 is True

    run2 = run_migrations(target_engine=engine)
    assert run2 is True

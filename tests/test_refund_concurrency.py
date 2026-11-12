"""Refund Concurrency & Cumulative Limit Test Suite (Phase 1).

Validates:
1. Concurrent partial refund race: e.g. Gross $1000.00, refund A $700.00, refund B $500.00.
   Under write serialization with acquire_immediate_lock:
   - Exactly one refund is accepted (RECONCILED).
   - The conflicting refund is safely recorded as RECONCILIATION_ERROR.
   - Cumulative accepted refunds never exceed capture gross.
2. Duplicate refund event deduplication: replay returns duplicate status without modifying balances.
3. Currency mismatch rejection: refund in mismatched currency recorded as RECONCILIATION_ERROR.
4. Cumulative partial refunds within bounds: sequential partials $300 + $400 against $1000 gross succeed.
"""

from concurrent.futures import ThreadPoolExecutor
import datetime
from decimal import Decimal
import hashlib
import secrets
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from db.models import (
    Address,
    APIKey,
    Customer,
    Device,
    Merchant,
    Order,
    Payment,
    Refund,
)
from db.session import SessionLocal, init_db


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def db():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def create_merchant_and_key(db, merchant_id: str) -> str:
    merchant = db.query(Merchant).filter_by(id=merchant_id).first()
    if not merchant:
        merchant = Merchant(
            id=merchant_id,
            name=f"Merchant {merchant_id}",
            email=f"{merchant_id}@example.com",
        )
        db.add(merchant)
        db.commit()

    raw_key = f"rg_live_{merchant_id}_{secrets.token_urlsafe(24)}"
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

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
    return raw_key


def seed_order_and_capture(db, merchant_id: str, order_id: str, capture_id: str, amount: str, currency: str = "USD"):
    cust = Customer(
        id=f"cust_{uuid.uuid4().hex[:8]}",
        merchant_id=merchant_id,
        email=f"c_{uuid.uuid4().hex[:6]}@example.com",
        phone="+15551234567",
    )
    addr = Address(
        id=f"addr_{uuid.uuid4().hex[:8]}",
        merchant_id=merchant_id,
        customer_id=cust.id,
        line1="100 Pine St",
        city="San Francisco",
        state="CA",
        pincode="94111",
    )
    dev = Device(
        id=f"dev_{uuid.uuid4().hex[:8]}",
        merchant_id=merchant_id,
        customer_id=cust.id,
        device_hash=f"fp_{uuid.uuid4().hex[:8]}",
    )
    order = Order(
        id=order_id,
        merchant_id=merchant_id,
        customer_id=cust.id,
        address_id=addr.id,
        device_id=dev.id,
        channel="paypal",
        order_value=float(amount),
        currency=currency,
        category="retail",
        order_time=datetime.datetime.now(datetime.UTC),
    )
    payment = Payment(
        id=f"pay_{uuid.uuid4().hex[:16]}",
        merchant_id=merchant_id,
        order_id=order_id,
        channel="paypal",
        amount=Decimal(amount),
        currency=currency,
        status="captured",
        capture_id=capture_id,
        refunded_amount=Decimal("0.00"),
    )
    db.add_all([cust, addr, dev, order, payment])
    db.commit()
    return order, payment


def test_concurrent_partial_refunds_never_exceed_gross(client, db):
    """Race test: Gross $1000.00 with concurrent refunds $700.00 and $500.00.
    
    Proves write serialization ensures cumulative accepted refunds <= $1000.00.
    """
    mid = f"m_race_{uuid.uuid4().hex[:8]}"
    key = create_merchant_and_key(db, mid)

    order_id = f"ord_race_{uuid.uuid4().hex[:8]}"
    cap_id = f"CAP-RACE-{uuid.uuid4().hex[:8]}"
    seed_order_and_capture(db, mid, order_id, cap_id, "1000.00", "USD")

    # Prepare two conflicting refund requests: A: 700.00, B: 500.00 (Total 1200.00 > 1000.00)
    req_a = {
        "event_id": f"evt_ref_race_a_{uuid.uuid4().hex[:8]}",
        "event_type": "PAYMENT_REFUNDED",
        "amount": "700.00",
        "currency": "USD",
        "order_reference": order_id,
        "paypal_references": {"capture_id": cap_id},
    }
    req_b = {
        "event_id": f"evt_ref_race_b_{uuid.uuid4().hex[:8]}",
        "event_type": "PAYMENT_REFUNDED",
        "amount": "500.00",
        "currency": "USD",
        "order_reference": order_id,
        "paypal_references": {"capture_id": cap_id},
    }

    def post_refund(payload):
        # Create dedicated client or reuse client to send request
        c = TestClient(app)
        return c.post(
            "/v1/transactions/events",
            json=payload,
            headers={"Authorization": f"Bearer {key}"},
        )

    # Fire both concurrently across threads
    with ThreadPoolExecutor(max_workers=2) as executor:
        f_a = executor.submit(post_refund, req_a)
        f_b = executor.submit(post_refund, req_b)
        resp_a = f_a.result()
        resp_b = f_b.result()

    assert resp_a.status_code == 200
    assert resp_b.status_code == 200

    # Query DB to inspect resulting refunds
    db.expire_all()
    refunds = db.query(Refund).filter(Refund.merchant_id == mid, Refund.order_id == order_id).all()
    assert len(refunds) == 2

    reconciled = [r for r in refunds if r.status == "RECONCILED"]
    errors = [r for r in refunds if r.status == "RECONCILED" or r.status == "RECONCILIATION_ERROR"]

    # Exactly one succeeded and one exceeded remaining balance
    assert len(reconciled) == 1
    assert any(r.status == "RECONCILIATION_ERROR" and "exceeds" in (r.error_reason or "").lower() for r in refunds)

    # Check payment refunded_amount never exceeded 1000.00
    payment = db.query(Payment).filter(Payment.capture_id == cap_id).first()
    assert payment.refunded_amount <= Decimal("1000.00")
    assert payment.refunded_amount in (Decimal("700.00"), Decimal("500.00"))


def test_cumulative_partial_refunds_within_limit(client, db):
    """Two legitimate sequential partial refunds ($300.00 + $400.00 against $1000.00) both succeed."""
    mid = f"m_part_{uuid.uuid4().hex[:8]}"
    key = create_merchant_and_key(db, mid)

    order_id = f"ord_part_{uuid.uuid4().hex[:8]}"
    cap_id = f"CAP-PART-{uuid.uuid4().hex[:8]}"
    seed_order_and_capture(db, mid, order_id, cap_id, "1000.00", "USD")

    # Refund 1: $300.00
    resp1 = client.post(
        "/v1/transactions/events",
        json={
            "event_id": f"evt_part_1_{uuid.uuid4().hex[:8]}",
            "event_type": "PAYMENT_REFUNDED",
            "amount": "300.00",
            "currency": "USD",
            "order_reference": order_id,
            "paypal_references": {"capture_id": cap_id},
        },
        headers={"Authorization": f"Bearer {key}"},
    )
    assert resp1.status_code == 200

    # Refund 2: $400.00
    resp2 = client.post(
        "/v1/transactions/events",
        json={
            "event_id": f"evt_part_2_{uuid.uuid4().hex[:8]}",
            "event_type": "PAYMENT_REFUNDED",
            "amount": "400.00",
            "currency": "USD",
            "order_reference": order_id,
            "paypal_references": {"capture_id": cap_id},
        },
        headers={"Authorization": f"Bearer {key}"},
    )
    assert resp2.status_code == 200

    db.expire_all()
    payment = db.query(Payment).filter(Payment.capture_id == cap_id).first()
    assert payment.refunded_amount == Decimal("700.00")

    refs = db.query(Refund).filter(Refund.merchant_id == mid, Refund.order_id == order_id).all()
    assert len(refs) == 2
    assert all(r.status == "RECONCILED" for r in refs)


def test_duplicate_refund_id_deduplication(client, db):
    """Replaying identical refund event is idempotently ignored."""
    mid = f"m_dup_{uuid.uuid4().hex[:8]}"
    key = create_merchant_and_key(db, mid)

    order_id = f"ord_dup_{uuid.uuid4().hex[:8]}"
    cap_id = f"CAP-DUP-{uuid.uuid4().hex[:8]}"
    seed_order_and_capture(db, mid, order_id, cap_id, "500.00", "USD")

    event_id = f"evt_dup_ref_{uuid.uuid4().hex[:8]}"
    payload = {
        "event_id": event_id,
        "event_type": "PAYMENT_REFUNDED",
        "amount": "100.00",
        "currency": "USD",
        "order_reference": order_id,
        "paypal_references": {"capture_id": cap_id},
    }

    # First delivery: success
    res1 = client.post("/v1/transactions/events", json=payload, headers={"Authorization": f"Bearer {key}"})
    assert res1.status_code == 200
    assert res1.json()["status"] == "success"

    # Redelivery (retry): duplicate ignored
    res2 = client.post("/v1/transactions/events", json=payload, headers={"Authorization": f"Bearer {key}"})
    assert res2.status_code == 200
    assert res2.json()["status"] == "duplicate"

    # Balance incremented only once
    db.expire_all()
    payment = db.query(Payment).filter(Payment.capture_id == cap_id).first()
    assert payment.refunded_amount == Decimal("100.00")


def test_currency_mismatch_reconciliation_error(client, db):
    """Refund currency differing from capture currency is recorded as RECONCILIATION_ERROR."""
    mid = f"m_curr_{uuid.uuid4().hex[:8]}"
    key = create_merchant_and_key(db, mid)

    order_id = f"ord_curr_{uuid.uuid4().hex[:8]}"
    cap_id = f"CAP-CURR-{uuid.uuid4().hex[:8]}"
    seed_order_and_capture(db, mid, order_id, cap_id, "500.00", "USD")

    res = client.post(
        "/v1/transactions/events",
        json={
            "event_id": f"evt_mismatch_{uuid.uuid4().hex[:8]}",
            "event_type": "PAYMENT_REFUNDED",
            "amount": "50.00",
            "currency": "EUR",
            "order_reference": order_id,
            "paypal_references": {"capture_id": cap_id},
        },
        headers={"Authorization": f"Bearer {key}"},
    )
    assert res.status_code == 200

    db.expire_all()
    ref = db.query(Refund).filter(Refund.merchant_id == mid, Refund.order_id == order_id).first()
    assert ref is not None
    assert ref.status == "RECONCILIATION_ERROR"
    assert ref.error_reason == "CURRENCY_MISMATCH"

    payment = db.query(Payment).filter(Payment.capture_id == cap_id).first()
    assert payment.refunded_amount == Decimal("0.00")

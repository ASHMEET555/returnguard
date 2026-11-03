"""Unit and integration tests for Payment Event Relay processing and idempotency.

Migrated from raw PayPal webhook endpoint to authenticated relay endpoint (POST /v1/transactions/events).
PayPal signature verification logic is covered in ShopPoint (tests/d3_signature.test.js).
"""

import hashlib
import json
import secrets
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from db.models import APIKey, Merchant, Order, PaymentEvent
from db.session import SessionLocal, init_db
from payments.webhooks import is_valid_paypal_cert_url, record_payment_event


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


def create_test_merchant_and_key(db, merchant_id: str = "merch_relay_test") -> str:
    """Helper to provision a test merchant and return a valid plaintext API key."""
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
        name="Relay Test Key",
        is_active=True,
    )
    db.add(api_key)
    db.commit()
    return plain_key


def test_cert_url_validation_security():
    """Verify PayPal certificate URL domain whitelisting against SSRF/spoofing (defensive utility)."""
    assert is_valid_paypal_cert_url("https://api.paypal.com/v1/notifications/certs/CERT-123") is True
    assert is_valid_paypal_cert_url("https://api-m.sandbox.paypal.com/certs/CERT-456") is True
    assert is_valid_paypal_cert_url("https://paypal.com/cert") is True

    # Insecure or spoofed domains must be rejected
    assert is_valid_paypal_cert_url("http://api.paypal.com/cert") is False  # Must be HTTPS
    assert is_valid_paypal_cert_url("https://evil-paypal.com/cert") is False
    assert is_valid_paypal_cert_url("https://paypal.com.attacker.org/cert") is False
    assert is_valid_paypal_cert_url("https://notpaypal.com") is False
    assert is_valid_paypal_cert_url("invalid-url") is False


def test_webhook_successful_processing(client, db_session):
    """Migrated: Test receiving and recording a valid new payment event via relay endpoint."""
    merchant_id = f"merch_succ_{uuid.uuid4().hex[:8]}"
    api_key = create_test_merchant_and_key(db_session, merchant_id)

    test_event_id = f"WH-TEST-{uuid.uuid4()}"
    payload = {
        "event_id": test_event_id,
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "summary": "Payment capture completed for order 123",
        "resource_type": "capture",
        "status": "completed",
        "paypal_references": {
            "order_id": "ORD-PAYPAL-123",
            "capture_id": "CAP-887766",
        },
    }

    headers = {"Authorization": f"Bearer {api_key}"}

    response = client.post("/v1/transactions/events", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["status"] == "processed"
    assert data["data"]["event_id"] == test_event_id
    assert data["data"]["merchant_id"] == merchant_id

    # Verify database persistence
    saved_event = (
        db_session.query(PaymentEvent)
        .filter_by(merchant_id=merchant_id, event_id=test_event_id)
        .first()
    )
    assert saved_event is not None
    assert saved_event.event_type == "PAYMENT.CAPTURE.COMPLETED"
    assert saved_event.summary == "Payment capture completed for order 123"
    assert saved_event.status == "completed"
    assert saved_event.merchant_id == merchant_id

    # Cleanup
    db_session.delete(saved_event)
    db_session.commit()


def test_webhook_idempotency_duplicate_replay(client, db_session):
    """Migrated: Test that replaying an identical event returns 200 idempotent response without duplicate DB rows."""
    merchant_id = f"merch_dup_{uuid.uuid4().hex[:8]}"
    api_key = create_test_merchant_and_key(db_session, merchant_id)

    test_event_id = f"WH-DUP-{uuid.uuid4()}"
    payload = {
        "event_id": test_event_id,
        "event_type": "PAYMENT.AUTHORIZATION.CREATED",
        "summary": "Authorization created for checkout",
        "resource_type": "authorization",
        "paypal_references": {
            "authorization_id": "AUTH-112233",
        },
    }

    headers = {"Authorization": f"Bearer {api_key}"}

    # First delivery: processed
    resp1 = client.post("/v1/transactions/events", json=payload, headers=headers)
    assert resp1.status_code == 200
    assert resp1.json()["data"]["status"] == "processed"

    # Second delivery (replay): duplicate idempotent no-op
    resp2 = client.post("/v1/transactions/events", json=payload, headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "duplicate"
    assert resp2.json()["data"]["event_id"] == test_event_id

    # Assert exactly 1 row in database
    records = (
        db_session.query(PaymentEvent)
        .filter_by(merchant_id=merchant_id, event_id=test_event_id)
        .all()
    )
    assert len(records) == 1

    # Cleanup
    db_session.delete(records[0])
    db_session.commit()


def test_webhook_signature_failure_rejected(client):
    """Migrated: Test that unauthenticated relay requests are rejected with 401 Unauthorized.

    Note: Cryptographic PayPal transmission signature verification is owned by ShopPoint
    and verified in ShopPoint's test suite (tests/d3_signature.test.js).
    ReturnGuard enforces authentication at its API boundary via Bearer API Keys.
    """
    payload = {
        "event_id": f"WH-FAIL-{uuid.uuid4()}",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
    }

    # Missing Authorization header
    resp1 = client.post("/v1/transactions/events", json=payload)
    assert resp1.status_code == 401
    assert "Invalid or missing authentication credentials" in resp1.json()["detail"]

    # Invalid Authorization header
    headers = {"Authorization": "Bearer invalid_secret_key_12345"}
    resp2 = client.post("/v1/transactions/events", json=payload, headers=headers)
    assert resp2.status_code == 401
    assert "Invalid or missing authentication credentials" in resp2.json()["detail"]


def test_webhook_event_types_coverage(db_session):
    """Migrated: Test record_payment_event across all key event types with merchant scoping."""
    event_types = [
        "PAYMENT.AUTHORIZATION.CREATED",
        "PAYMENT.AUTHORIZATION.VOIDED",
        "PAYMENT.CAPTURE.COMPLETED",
        "PAYMENT.CAPTURE.DENIED",
        "CHECKOUT.ORDER.APPROVED",
    ]

    test_merchant_id = f"merch_et_{uuid.uuid4().hex[:8]}"
    created_records = []
    for et in event_types:
        eid = f"WH-ET-{uuid.uuid4()}"
        result = record_payment_event(
            {
                "event_id": eid,
                "event_type": et,
                "summary": f"Summary for {et}",
                "resource_type": "payment",
                "merchant_id": test_merchant_id,
            },
            db_session,
            merchant_id=test_merchant_id,
        )
        assert result["status"] == "processed"
        assert result["event_type"] == et
        assert result["merchant_id"] == test_merchant_id
        created_records.append(eid)

    # Clean up
    for eid in created_records:
        rec = (
            db_session.query(PaymentEvent)
            .filter_by(merchant_id=test_merchant_id, event_id=eid)
            .first()
        )
        if rec:
            db_session.delete(rec)
    db_session.commit()

"""Unit and integration tests for PayPal webhook processing and idempotency."""

import json
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from db.models import PaymentEvent
from db.session import SessionLocal, init_db
from payments.webhooks import is_valid_paypal_cert_url, record_payment_event, verify_webhook_signature


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


def test_cert_url_validation_security():
    """Verify PayPal certificate URL domain whitelisting against SSRF/spoofing."""
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
    """Test receiving and recording a valid new PayPal webhook event."""
    test_event_id = f"WH-TEST-{uuid.uuid4()}"
    payload = {
        "id": test_event_id,
        "event_version": "1.0",
        "create_time": "2026-11-03T12:00:00Z",
        "resource_type": "capture",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "summary": "Payment capture completed for order 123",
        "resource": {
            "id": "CAP-887766",
            "amount": {"value": "89.50", "currency_code": "USD"},
            "status": "COMPLETED",
        },
    }

    headers = {
        "paypal-auth-algo": "SHA256withRSA",
        "paypal-cert-url": "https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT-001",
        "paypal-transmission-id": str(uuid.uuid4()),
        "paypal-transmission-sig": "TEST_VALID_SIG",
        "paypal-transmission-time": "2026-11-03T12:00:00Z",
    }

    response = client.post("/v1/paypal/webhooks", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["status"] == "processed"
    assert data["data"]["event_id"] == test_event_id

    # Verify database persistence
    saved_event = db_session.query(PaymentEvent).filter_by(event_id=test_event_id).first()
    assert saved_event is not None
    assert saved_event.event_type == "PAYMENT.CAPTURE.COMPLETED"
    assert saved_event.summary == "Payment capture completed for order 123"
    assert saved_event.status == "processed"

    # Cleanup
    db_session.delete(saved_event)
    db_session.commit()


def test_webhook_idempotency_duplicate_replay(client, db_session):
    """Test that replaying an identical webhook event returns 200 idempotent response without duplicates."""
    test_event_id = f"WH-DUP-{uuid.uuid4()}"
    payload = {
        "id": test_event_id,
        "event_type": "PAYMENT.AUTHORIZATION.CREATED",
        "summary": "Authorization created for checkout",
        "resource_type": "authorization",
        "resource": {
            "id": "AUTH-112233",
            "status": "CREATED",
        },
    }

    headers = {
        "paypal-auth-algo": "SHA256withRSA",
        "paypal-cert-url": "https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT-001",
        "paypal-transmission-id": str(uuid.uuid4()),
        "paypal-transmission-sig": "TEST_VALID_SIG",
        "paypal-transmission-time": "2026-11-03T12:00:00Z",
    }

    # First delivery: processed
    resp1 = client.post("/v1/paypal/webhooks", json=payload, headers=headers)
    assert resp1.status_code == 200
    assert resp1.json()["data"]["status"] == "processed"

    # Second delivery (replay): duplicate idempotent no-op
    resp2 = client.post("/v1/paypal/webhooks", json=payload, headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()["data"]["status"] == "duplicate"
    assert resp2.json()["data"]["event_id"] == test_event_id

    # Assert exactly 1 row in database
    records = db_session.query(PaymentEvent).filter_by(event_id=test_event_id).all()
    assert len(records) == 1

    # Cleanup
    db_session.delete(records[0])
    db_session.commit()


def test_webhook_signature_failure_rejected(client):
    """Test that requests with invalid signatures are rejected with 400 Bad Request."""
    payload = {
        "id": f"WH-FAIL-{uuid.uuid4()}",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
    }

    # Invalid headers
    headers = {
        "paypal-auth-algo": "SHA256withRSA",
        "paypal-cert-url": "https://attacker-domain.com/cert",  # Untrusted domain
        "paypal-transmission-id": "fake-trans-id",
        "paypal-transmission-sig": "INVALID_SIGNATURE_STRING",
        "paypal-transmission-time": "2026-11-03T12:00:00Z",
    }

    response = client.post("/v1/paypal/webhooks", json=payload, headers=headers)
    assert response.status_code == 400
    assert "signature verification failed" in response.json()["detail"].lower()


def test_webhook_event_types_coverage(db_session):
    """Test record_payment_event across all key Phase D webhook event types."""
    event_types = [
        "PAYMENT.AUTHORIZATION.CREATED",
        "PAYMENT.AUTHORIZATION.VOIDED",
        "PAYMENT.CAPTURE.COMPLETED",
        "PAYMENT.CAPTURE.DENIED",
        "CHECKOUT.ORDER.APPROVED",
    ]

    created_records = []
    for et in event_types:
        eid = f"WH-ET-{uuid.uuid4()}"
        result = record_payment_event(
            {
                "id": eid,
                "event_type": et,
                "summary": f"Summary for {et}",
                "resource_type": "payment",
            },
            db_session,
        )
        assert result["status"] == "processed"
        assert result["event_type"] == et
        created_records.append(eid)

    # Clean up
    for eid in created_records:
        rec = db_session.query(PaymentEvent).filter_by(event_id=eid).first()
        if rec:
            db_session.delete(rec)
    db_session.commit()

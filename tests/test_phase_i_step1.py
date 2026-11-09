"""Tests for Step I1: Dispute ingestion, documents, and completeness."""

import hashlib
import uuid
import pytest
from fastapi.testclient import TestClient

import datetime
from api.main import app
from db.models import Merchant, APIKey, Order, Customer, Address, Device
from db.session import SessionLocal


@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture
def seeded_merchants(db_session):
    """Seed test merchants and API keys."""
    m1_id = f"m_i1_{uuid.uuid4().hex[:8]}"
    m2_id = f"m_i1_{uuid.uuid4().hex[:8]}"

    m1 = Merchant(id=m1_id, name="Merchant I1 A", email="i1a@test.com")
    m2 = Merchant(id=m2_id, name="Merchant I1 B", email="i1b@test.com")
    db_session.add_all([m1, m2])

    raw_key1 = f"rg_live_i1_{uuid.uuid4().hex}"
    raw_key2 = f"rg_live_i1_{uuid.uuid4().hex}"

    h1 = hashlib.sha256(raw_key1.encode("utf-8")).hexdigest()
    h2 = hashlib.sha256(raw_key2.encode("utf-8")).hexdigest()

    k1 = APIKey(
        id=f"k_{uuid.uuid4().hex[:8]}",
        merchant_id=m1_id,
        key_prefix="rg_live_",
        key_hash=h1,
        name="Key 1",
        is_active=True,
    )
    k2 = APIKey(
        id=f"k_{uuid.uuid4().hex[:8]}",
        merchant_id=m2_id,
        key_prefix="rg_live_",
        key_hash=h2,
        name="Key 2",
        is_active=True,
    )
    db_session.add_all([k1, k2])

    c1 = Customer(
        id=f"c1_{uuid.uuid4().hex[:8]}",
        merchant_id=m1_id,
        email="c1@ex.com",
        phone="+15551234567",
    )
    a1 = Address(
        id=f"a1_{uuid.uuid4().hex[:8]}",
        merchant_id=m1_id,
        customer_id=c1.id,
        line1="1 St",
        city="City",
        state="CA",
        pincode="90001",
    )
    d1 = Device(
        id=f"d1_{uuid.uuid4().hex[:8]}",
        merchant_id=m1_id,
        customer_id=c1.id,
        device_hash="dhash1",
    )
    db_session.add_all([c1, a1, d1])

    c2 = Customer(
        id=f"c2_{uuid.uuid4().hex[:8]}",
        merchant_id=m2_id,
        email="c2@ex.com",
        phone="+15559876543",
    )
    a2 = Address(
        id=f"a2_{uuid.uuid4().hex[:8]}",
        merchant_id=m2_id,
        customer_id=c2.id,
        line1="2 St",
        city="City",
        state="NY",
        pincode="10001",
    )
    d2 = Device(
        id=f"d2_{uuid.uuid4().hex[:8]}",
        merchant_id=m2_id,
        customer_id=c2.id,
        device_hash="dhash2",
    )
    db_session.add_all([c2, a2, d2])

    now = datetime.datetime.now(datetime.timezone.utc)
    # Add an order for merchant 1
    o1 = Order(
        id=f"ord_i1_{uuid.uuid4().hex[:8]}",
        merchant_id=m1_id,
        customer_id=c1.id,
        address_id=a1.id,
        device_id=d1.id,
        order_time=now,
        channel="paypal",
        order_value=125.0,
        currency="USD",
        item_count=1,
        category="electronics",
    )
    # Add an order for merchant 2
    o2 = Order(
        id=f"ord_i1_{uuid.uuid4().hex[:8]}",
        merchant_id=m2_id,
        customer_id=c2.id,
        address_id=a2.id,
        device_id=d2.id,
        order_time=now,
        channel="paypal",
        order_value=75.0,
        currency="USD",
        item_count=1,
        category="apparel",
    )
    db_session.add_all([o1, o2])
    db_session.commit()

    return {
        "m1_id": m1_id,
        "raw_key1": raw_key1,
        "m1_order": o1.id,
        "m2_id": m2_id,
        "raw_key2": raw_key2,
        "m2_order": o2.id,
    }


def test_dispute_upsert_and_idempotency(seeded_merchants):
    """POST /v1/disputes upserts by (merchant_id, external_dispute_id) idempotently."""
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {seeded_merchants['raw_key1']}"}

    payload = {
        "external_dispute_id": "PP-D-1001",
        "transaction_id": seeded_merchants["m1_order"],
        "reason_code": "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
        "status": "OPEN",
        "amount": 125.0,
        "currency": "USD",
    }

    # 1. First insert
    res1 = client.post("/v1/disputes", headers=headers, json=payload)
    assert res1.status_code == 200, res1.text
    data1 = res1.json()
    assert data1["external_dispute_id"] == "PP-D-1001"
    assert data1["completeness"]["completeness_pct"] == 0.0
    assert "PROOF_OF_DELIVERY" in data1["completeness"]["missing_kinds"]

    # 2. Update with modified amount and status
    payload["status"] = "UNDER_REVIEW"
    payload["amount"] = 150.0
    res2 = client.post("/v1/disputes", headers=headers, json=payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["id"] == data1["id"]  # Same internal dispute ID
    assert data2["status"] == "UNDER_REVIEW"
    assert data2["amount"] == 150.0


def test_dispute_cross_tenant_transaction_returns_404(seeded_merchants):
    """Referencing another tenant's transaction_id must return 404."""
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {seeded_merchants['raw_key1']}"}

    payload = {
        "external_dispute_id": "PP-D-CROSS",
        "transaction_id": seeded_merchants["m2_order"],  # Belongs to merchant 2!
        "reason_code": "UNAUTHORISED",
        "status": "OPEN",
        "amount": 50.0,
        "currency": "USD",
    }

    res = client.post("/v1/disputes", headers=headers, json=payload)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_oversized_document_returns_413(seeded_merchants):
    """Document text exceeding 1 MB returns HTTP 413."""
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {seeded_merchants['raw_key1']}"}

    # Ingest dispute
    res_disp = client.post(
        "/v1/disputes",
        headers=headers,
        json={
            "external_dispute_id": "PP-D-SIZE",
            "reason_code": "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
            "status": "OPEN",
            "amount": 100.0,
        },
    )
    disp_id = res_disp.json()["id"]

    # Create 1 MB + 10 bytes content
    big_content = "X" * (1024 * 1024 + 10)
    res_doc = client.post(
        f"/v1/disputes/{disp_id}/documents",
        headers=headers,
        json={
            "evidence_type": "PROOF_OF_DELIVERY",
            "filename": "huge_pod.txt",
            "text_content": big_content,
        },
    )
    assert res_doc.status_code == 413
    assert "exceeds 1 mb" in res_doc.json()["detail"].lower()


def test_document_hash_matches_content(seeded_merchants):
    """Server-side SHA-256 matches actual document content."""
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {seeded_merchants['raw_key1']}"}

    res_disp = client.post(
        "/v1/disputes",
        headers=headers,
        json={
            "external_dispute_id": "PP-D-HASH",
            "reason_code": "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
            "status": "OPEN",
            "amount": 80.0,
        },
    )
    disp_id = res_disp.json()["id"]

    doc_text = (
        "Carrier Delivery Confirmation: Delivered to Doorstep on 2026-11-01T14:22:00Z."
    )
    expected_sha256 = hashlib.sha256(doc_text.encode("utf-8")).hexdigest()

    res_doc = client.post(
        f"/v1/disputes/{disp_id}/documents",
        headers=headers,
        json={
            "evidence_type": "PROOF_OF_DELIVERY",
            "filename": "pod_receipt.txt",
            "text_content": doc_text,
        },
    )
    assert res_doc.status_code == 201
    doc_data = res_doc.json()
    assert doc_data["sha256"] == expected_sha256
    assert doc_data["byte_size"] == len(doc_text.encode("utf-8"))


def test_completeness_percentages_correct(seeded_merchants):
    """Completeness percentage updates as required kinds are attached."""
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {seeded_merchants['raw_key1']}"}

    # Reason MERCHANDISE_OR_SERVICE_NOT_RECEIVED requires PROOF_OF_DELIVERY and TRACKING_INFORMATION
    res_disp = client.post(
        "/v1/disputes",
        headers=headers,
        json={
            "external_dispute_id": "PP-D-COMPL",
            "reason_code": "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
            "status": "OPEN",
            "amount": 90.0,
        },
    )
    disp_id = res_disp.json()["id"]
    assert res_disp.json()["completeness"]["completeness_pct"] == 0.0

    # Add 1st required document
    client.post(
        f"/v1/disputes/{disp_id}/documents",
        headers=headers,
        json={
            "evidence_type": "PROOF_OF_DELIVERY",
            "filename": "delivery.txt",
            "text_content": "Delivered",
        },
    )

    get1 = client.get(f"/v1/disputes/{disp_id}", headers=headers)
    assert get1.json()["completeness"]["completeness_pct"] == 50.0
    assert get1.json()["completeness"]["missing_kinds"] == ["TRACKING_INFORMATION"]

    # Add 2nd required document
    client.post(
        f"/v1/disputes/{disp_id}/documents",
        headers=headers,
        json={
            "evidence_type": "TRACKING_INFORMATION",
            "filename": "tracking.txt",
            "text_content": "Carrier FedEx 982347102948",
        },
    )

    get2 = client.get(f"/v1/disputes/{disp_id}", headers=headers)
    assert get2.json()["completeness"]["completeness_pct"] == 100.0
    assert get2.json()["completeness"]["missing_kinds"] == []
    assert get2.json()["completeness"]["is_complete"] is True

"""Executable Two-Merchant Isolation Matrix Test Suite (Phase 1, Requirement 10).

Validates strict cryptographic tenant boundaries, independent financial ledger projection,
out-of-order pending refund reconciliation, review queue isolation, review idempotency,
investigation sealing, and multi-currency captured value accounting across:
- Merchant Alpha: `merch_alpha_iso`
- Merchant Beta:  `merch_beta_iso`
"""

import datetime
from decimal import Decimal
import hashlib
import json
import secrets
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from db.models import (
    Address,
    APIKey,
    AuditScoreEvent,
    Customer,
    Device,
    Dispute,
    EvidencePack,
    Investigation,
    Merchant,
    MerchantAudit,
    Order,
    Payment,
    PaymentEvent,
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


def create_tenant_and_key(db, merchant_id: str) -> str:
    merchant = db.query(Merchant).filter_by(id=merchant_id).first()
    if not merchant:
        merchant = Merchant(
            id=merchant_id,
            name=f"Enterprise {merchant_id}",
            email=f"{merchant_id}@example.com",
        )
        db.add(merchant)
        db.commit()

    random_secret = secrets.token_urlsafe(32)
    plain_key = f"rg_live_{merchant_id}_{random_secret}"
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


def seed_tenant_order(db, merchant_id: str, order_id: str, amount: float = 100.0, currency: str = "USD") -> Order:
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
        line1="123 Market St",
        city="San Francisco",
        state="CA",
        pincode="94105",
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
        order_value=amount,
        currency=currency,
        category="general",
        order_time=datetime.datetime.now(datetime.UTC),
    )
    db.add_all([cust, addr, dev, order])
    db.commit()
    return order


class TestTwoMerchantIsolationMatrix:
    """Rigorous 2-merchant isolation matrix covering all 7 operational vectors."""

    MERCH_ALPHA = f"merch_alpha_{uuid.uuid4().hex[:6]}"
    MERCH_BETA = f"merch_beta_{uuid.uuid4().hex[:6]}"

    def test_01_setup_merchants(self, db):
        self.key_alpha = create_tenant_and_key(db, self.MERCH_ALPHA)
        self.key_beta = create_tenant_and_key(db, self.MERCH_BETA)
        assert self.key_alpha != self.key_beta

    def test_02_capture_ingestion_and_tenant_isolation(self, client, db):
        key_alpha = create_tenant_and_key(db, self.MERCH_ALPHA)
        key_beta = create_tenant_and_key(db, self.MERCH_BETA)

        # Alpha captures $100.00 USD
        resp_a = client.post(
            "/v1/transactions/events",
            json={
                "event_id": f"evt_cap_alpha_{uuid.uuid4().hex[:8]}",
                "event_type": "PAYMENT_CAPTURED",
                "amount": "100.00",
                "currency": "USD",
                "paypal_references": {
                    "order_id": "PP-ORD-A-1",
                    "capture_id": "PP-CAP-A-1",
                },
            },
            headers={"Authorization": f"Bearer {key_alpha}"},
        )
        assert resp_a.status_code == 200
        assert resp_a.json()["status"] == "success"

        # Beta captures $250.00 USD
        resp_b = client.post(
            "/v1/transactions/events",
            json={
                "event_id": f"evt_cap_beta_{uuid.uuid4().hex[:8]}",
                "event_type": "PAYMENT_CAPTURED",
                "amount": "250.00",
                "currency": "USD",
                "paypal_references": {
                    "order_id": "PP-ORD-B-1",
                    "capture_id": "PP-CAP-B-1",
                },
            },
            headers={"Authorization": f"Bearer {key_beta}"},
        )
        assert resp_b.status_code == 200

        # Cross-tenant check: Alpha cannot see Beta's payments
        pay_a = db.query(Payment).filter(Payment.merchant_id == self.MERCH_ALPHA).all()
        pay_b = db.query(Payment).filter(Payment.merchant_id == self.MERCH_BETA).all()

        assert any(p.capture_id == "PP-CAP-A-1" for p in pay_a)
        assert not any(p.capture_id == "PP-CAP-B-1" for p in pay_a)

        assert any(p.capture_id == "PP-CAP-B-1" for p in pay_b)
        assert not any(p.capture_id == "PP-CAP-A-1" for p in pay_b)

    def test_03_out_of_order_refund_reconciliation(self, client, db):
        key_alpha = create_tenant_and_key(db, self.MERCH_ALPHA)

        order_id = f"ord_ooo_{uuid.uuid4().hex[:8]}"
        cap_id = f"CAP-OOO-{uuid.uuid4().hex[:8]}"
        seed_tenant_order(db, self.MERCH_ALPHA, order_id, 100.0, "USD")

        # Step 1: Refund arrives BEFORE capture arrives (out-of-order)
        resp_ref = client.post(
            "/v1/transactions/events",
            json={
                "event_id": f"evt_ref_ooo_{uuid.uuid4().hex[:8]}",
                "event_type": "PAYMENT_REFUNDED",
                "amount": "30.00",
                "currency": "USD",
                "order_reference": order_id,
                "paypal_references": {"capture_id": cap_id},
            },
            headers={"Authorization": f"Bearer {key_alpha}"},
        )
        assert resp_ref.status_code == 200

        # Verify stored as PENDING_CAPTURE_LINK
        pending_ref = (
            db.query(Refund)
            .filter(Refund.merchant_id == self.MERCH_ALPHA, Refund.order_id == order_id)
            .first()
        )
        assert pending_ref is not None
        assert pending_ref.status == "PENDING_CAPTURE_LINK"
        assert pending_ref.payment_id in (None, "PENDING_CAPTURE_LINK")

        # Step 2: Capture arrives later for $100.00 USD
        resp_cap = client.post(
            "/v1/transactions/events",
            json={
                "event_id": f"evt_cap_ooo_{uuid.uuid4().hex[:8]}",
                "event_type": "PAYMENT_CAPTURED",
                "amount": "100.00",
                "currency": "USD",
                "order_reference": order_id,
                "paypal_references": {"capture_id": cap_id},
            },
            headers={"Authorization": f"Bearer {key_alpha}"},
        )
        assert resp_cap.status_code == 200

        # Step 3: Verify automatic reconciliation
        db.expire_all()
        reconciled_ref = (
            db.query(Refund)
            .filter(Refund.merchant_id == self.MERCH_ALPHA, Refund.order_id == order_id)
            .first()
        )
        assert reconciled_ref.status == "RECONCILED"
        assert reconciled_ref.payment_id is not None
        assert reconciled_ref.reconciled_at is not None

        # Verify payment refunded_amount updated to 30.00
        pay = db.query(Payment).filter(Payment.capture_id == cap_id).first()
        assert pay is not None
        assert Decimal(str(pay.refunded_amount)) == Decimal("30.00")

    def test_04_refund_balance_and_currency_validation(self, client, db):
        key_alpha = create_tenant_and_key(db, self.MERCH_ALPHA)

        order_id = f"ord_val_{uuid.uuid4().hex[:8]}"
        cap_id = f"CAP-VAL-{uuid.uuid4().hex[:8]}"
        seed_tenant_order(db, self.MERCH_ALPHA, order_id, 50.0, "USD")

        # Create capture for $50.00 USD
        client.post(
            "/v1/transactions/events",
            json={
                "event_id": f"evt_cap_val_{uuid.uuid4().hex[:8]}",
                "event_type": "PAYMENT_CAPTURED",
                "amount": "50.00",
                "currency": "USD",
                "order_reference": order_id,
                "paypal_references": {"capture_id": cap_id},
            },
            headers={"Authorization": f"Bearer {key_alpha}"},
        )

        # Case A: Refund with mismatched currency (EUR vs USD)
        client.post(
            "/v1/transactions/events",
            json={
                "event_id": f"evt_ref_mismatch_{uuid.uuid4().hex[:8]}",
                "event_type": "PAYMENT_REFUNDED",
                "amount": "10.00",
                "currency": "EUR",
                "order_reference": order_id,
                "paypal_references": {"capture_id": cap_id},
            },
            headers={"Authorization": f"Bearer {key_alpha}"},
        )

        mismatch_ref = (
            db.query(Refund)
            .filter(Refund.merchant_id == self.MERCH_ALPHA, Refund.currency == "EUR")
            .first()
        )
        assert mismatch_ref is not None
        assert mismatch_ref.status == "RECONCILIATION_ERROR"
        assert mismatch_ref.error_reason == "CURRENCY_MISMATCH"

        # Case B: Refund exceeding gross captured amount ($60.00 > $50.00)
        client.post(
            "/v1/transactions/events",
            json={
                "event_id": f"evt_ref_overflow_{uuid.uuid4().hex[:8]}",
                "event_type": "PAYMENT_REFUNDED",
                "amount": "60.00",
                "currency": "USD",
                "order_reference": order_id,
                "paypal_references": {"capture_id": cap_id},
            },
            headers={"Authorization": f"Bearer {key_alpha}"},
        )

        overflow_ref = (
            db.query(Refund)
            .filter(Refund.merchant_id == self.MERCH_ALPHA, Refund.amount == 60.0)
            .first()
        )
        assert overflow_ref is not None
        assert overflow_ref.status == "RECONCILIATION_ERROR"
        assert "exceeds" in overflow_ref.error_reason.lower()

    def test_05_review_queue_isolation_and_idempotency(self, client, db):
        key_alpha = create_tenant_and_key(db, self.MERCH_ALPHA)
        key_beta = create_tenant_and_key(db, self.MERCH_BETA)

        dec_id_a = f"dec_a_{uuid.uuid4().hex[:8]}"
        dec_id_b = f"dec_b_{uuid.uuid4().hex[:8]}"

        # Seed decision for Alpha
        ev_a = AuditScoreEvent(
            id=str(uuid.uuid4()),
            decision_id=dec_id_a,
            order_id="ord_a_1",
            merchant_id=self.MERCH_ALPHA,
            risk_score=Decimal("0.75"),
            tier="MANUAL_REVIEW",
            policy_action="REVIEW",
            suggested_action="manual_review",
            channel="paypal",
        )
        # Seed decision for Beta
        ev_b = AuditScoreEvent(
            id=str(uuid.uuid4()),
            decision_id=dec_id_b,
            order_id="ord_b_1",
            merchant_id=self.MERCH_BETA,
            risk_score=Decimal("0.82"),
            tier="MANUAL_REVIEW",
            policy_action="BLOCK",
            suggested_action="manual_review",
            channel="paypal",
        )
        db.add_all([ev_a, ev_b])
        db.commit()

        # Alpha queries pending reviews: must see dec_id_a, NEVER dec_id_b
        resp_q_a = client.get("/v1/reviews?status=pending", headers={"Authorization": f"Bearer {key_alpha}"})
        assert resp_q_a.status_code == 200
        items_a = [item["decision_id"] for item in resp_q_a.json()["items"]]
        assert dec_id_a in items_a
        assert dec_id_b not in items_a

        # Beta attempts to review Alpha's decision -> 404
        resp_cross_rev = client.post(
            "/v1/reviews",
            json={"decision_id": dec_id_a, "action": "approve"},
            headers={"Authorization": f"Bearer {key_beta}"},
        )
        assert resp_cross_rev.status_code == 404

        # Alpha submits genuine review with deterministic operation ID
        op_id = f"op_rev_{dec_id_a}_v1"
        ev_id = f"evt_rev_{dec_id_a}_approve_v1"
        resp_rev_a = client.post(
            "/v1/reviews",
            json={
                "decision_id": dec_id_a,
                "action": "approve",
                "operation_id": op_id,
                "event_id": ev_id,
                "notes": "Verified manual shipping address",
            },
            headers={"Authorization": f"Bearer {key_alpha}"},
        )
        assert resp_rev_a.status_code == 200
        assert resp_rev_a.json()["idempotent_replay"] is False

        # Replaying identical outbox dispatch returns 200 with idempotent_replay=True
        resp_replay = client.post(
            "/v1/reviews",
            json={
                "decision_id": dec_id_a,
                "action": "approve",
                "operation_id": op_id,
                "event_id": ev_id,
            },
            headers={"Authorization": f"Bearer {key_alpha}"},
        )
        assert resp_replay.status_code == 200
        assert resp_replay.json()["idempotent_replay"] is True

        # Now, Alpha's pending queue must NOT show dec_id_a (it is resolved)
        resp_q_after = client.get("/v1/reviews?status=pending", headers={"Authorization": f"Bearer {key_alpha}"})
        items_after = [item["decision_id"] for item in resp_q_after.json()["items"]]
        assert dec_id_a not in items_after

    def test_06_analytics_summary_multi_tenant_segregation(self, client, db):
        key_alpha = create_tenant_and_key(db, self.MERCH_ALPHA)
        key_beta = create_tenant_and_key(db, self.MERCH_BETA)

        # Alpha summary
        resp_sum_a = client.get("/v1/analytics/summary", headers={"Authorization": f"Bearer {key_alpha}"})
        assert resp_sum_a.status_code == 200
        data_a = resp_sum_a.json()

        # Beta summary
        resp_sum_b = client.get("/v1/analytics/summary", headers={"Authorization": f"Bearer {key_beta}"})
        assert resp_sum_b.status_code == 200
        data_b = resp_sum_b.json()

        # Confirm strict mathematical accounting separation
        assert data_a["tenant_id"] == self.MERCH_ALPHA
        assert data_b["tenant_id"] == self.MERCH_BETA

        # Beta has 1 capture for $250.00 USD with 0 refunds
        assert data_b["gross_captured_value"] == 250.0
        assert data_b["refunded_value"] == 0.0
        assert data_b["net_captured_value"] == 250.0

        # Alpha had captures $100 + $100 + $50 = $250, with $30 reconciled refund -> Net $220.0
        assert data_a["gross_captured_value"] >= 200.0
        assert data_a["refunded_value"] == 30.0
        assert data_a["net_captured_value"] == data_a["gross_captured_value"] - 30.0

    def test_07_investigation_sealing_tenant_isolation(self, client, db):
        """Vector 5: Investigation sealing isolation across tenants."""
        import os
        import time
        import jwt
        from auth.embed_tokens import get_embed_signing_key, EMBED_TOKEN_AUDIENCE
        from db.models import Investigation, EvidencePack

        signing_key = get_embed_signing_key()

        # Seed investigation and evidence pack under Alpha
        inv_id_a = f"inv_iso_a_{uuid.uuid4().hex[:8]}"
        pack_hash_a = f"hash_pack_{uuid.uuid4().hex[:12]}"

        inv_a = Investigation(
            id=inv_id_a,
            merchant_id=self.MERCH_ALPHA,
            status="OPEN",
            case_hash="hash_case_123",
        )
        pack_a = EvidencePack(
            id=f"pack_iso_a_{uuid.uuid4().hex[:8]}",
            merchant_id=self.MERCH_ALPHA,
            investigation_id=inv_id_a,
            pack_hash=pack_hash_a,
            version=1,
            pack_json={"version": 1},
            pack_md="# Evidence Pack Alpha",
        )
        db.add_all([inv_a, pack_a])
        db.commit()

        # Token for Beta reviewer with approve scope
        payload_beta = {
            "iss": "returnguard",
            "aud": EMBED_TOKEN_AUDIENCE,
            "tid": self.MERCH_BETA,
            "sub": "rev_beta_1",
            "scp": ["evidence:approve", "read"],
            "exp": int(time.time()) + 3600,
        }
        token_beta = jwt.encode(payload_beta, signing_key, algorithm="HS256")

        # 1. Beta attempts to inspect Alpha's investigation -> 404
        resp_get = client.get(
            f"/v1/investigations/{inv_id_a}",
            headers={"Authorization": f"Bearer {token_beta}"},
        )
        assert resp_get.status_code == 404

        # 2. Beta attempts to approve/seal Alpha's investigation -> 404
        resp_approve_beta = client.post(
            f"/v1/investigations/{inv_id_a}/approve",
            json={"pack_hash": pack_hash_a},
            headers={"Authorization": f"Bearer {token_beta}"},
        )
        assert resp_approve_beta.status_code == 404

        # 3. Alpha reviewer approves/seals own investigation -> 200 Success
        payload_alpha = {
            "iss": "returnguard",
            "aud": EMBED_TOKEN_AUDIENCE,
            "tid": self.MERCH_ALPHA,
            "sub": "rev_alpha_1",
            "scp": ["evidence:approve", "read"],
            "exp": int(time.time()) + 3600,
        }
        token_alpha = jwt.encode(payload_alpha, signing_key, algorithm="HS256")

        resp_approve_alpha = client.post(
            f"/v1/investigations/{inv_id_a}/approve",
            json={"pack_hash": pack_hash_a},
            headers={"Authorization": f"Bearer {token_alpha}"},
        )
        assert resp_approve_alpha.status_code == 200
        assert resp_approve_alpha.json()["status"] == "success"

        # Verify evidence approval record and sealed audit step
        db.expire_all()
        from db.models import EvidenceApproval
        approval = db.query(EvidenceApproval).filter_by(investigation_id=inv_id_a).first()
        assert approval is not None
        assert approval.decision == "APPROVE"
        assert approval.approver_sub == "rev_alpha_1"

    def test_08_outbox_dispatch_cross_tenant_spoofing_rejected(self, client, db):
        """Vector 7: Outbox dispatch / relay isolation rejecting cross-tenant spoofing."""
        key_alpha = create_tenant_and_key(db, self.MERCH_ALPHA)

        # Alpha dispatcher attempts to spoof event targeting Beta
        spoofed_cap_id = f"PP-SPOOF-{uuid.uuid4().hex[:8]}"
        resp_spoof = client.post(
            "/v1/transactions/events",
            json={
                "event_id": f"evt_spoof_{uuid.uuid4().hex[:8]}",
                "event_type": "PAYMENT_CAPTURED",
                "amount": "999.00",
                "currency": "USD",
                "merchant_id": self.MERCH_BETA,
                "paypal_references": {"capture_id": spoofed_cap_id},
            },
            headers={"Authorization": f"Bearer {key_alpha}"},
        )
        # Must be rejected with HTTP 403 Forbidden
        assert resp_spoof.status_code == 403
        assert "does not match authenticated merchant" in resp_spoof.json()["detail"]

        # Ensure no payment record was created for Beta
        pay_beta_spoof = db.query(Payment).filter(Payment.capture_id == spoofed_cap_id).first()
        assert pay_beta_spoof is None

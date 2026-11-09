"""Tenant-scoped repository for multi-tenant data access (Phase E-2).

Enforces:
1. Every query requires merchant_id. Unscoped queries are strictly prevented.
2. Cross-tenant reads return None (triggering 404 at the HTTP layer, never 403).
3. Customer lookups are keyed by compound (merchant_id, customer_id).
4. All writes automatically stamp merchant_id.
"""

import datetime
import json
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy.orm import Session

from db.models import (
    Address,
    AuditScoreEvent,
    Customer,
    Device,
    Dispute,
    DisputeDocument,
    EvidenceApproval,
    EvidencePack,
    EvidenceSubmission,
    Investigation,
    InvestigationFinding,
    LLMRun,
    MerchantAudit,
    Order,
    Payment,
    PaymentEvent,
    Refund,
    SubmissionResult,
)


class TenantScopedRepository:
    """Encapsulates tenant-isolated database access."""

    def __init__(self, db: Session, merchant_id: str):
        if not merchant_id or not str(merchant_id).strip():
            raise ValueError("merchant_id is required for TenantScopedRepository")
        self.db = db
        self.merchant_id = str(merchant_id).strip()

    # --- Customer & Identity Lookups (Compound Key: merchant_id, customer_id) ---

    def get_customer(self, customer_id: str) -> Optional[Customer]:
        """Fetch customer strictly within this merchant's scope."""
        return (
            self.db.query(Customer)
            .filter(
                Customer.id == customer_id,
                Customer.merchant_id == self.merchant_id,
            )
            .first()
        )

    def get_customer_history(
        self, customer_id: str, as_of: Optional[datetime.datetime] = None
    ) -> List[Order]:
        """Fetch prior orders for customer strictly within this merchant's scope."""
        query = self.db.query(Order).filter(
            Order.merchant_id == self.merchant_id,
            Order.customer_id == customer_id,
        )
        if as_of is not None:
            query = query.filter(Order.order_time <= as_of)
        return query.order_by(Order.order_time.asc()).all()

    def get_device(self, device_id: str) -> Optional[Device]:
        """Fetch device record strictly within this merchant's scope."""
        return (
            self.db.query(Device)
            .filter(
                Device.id == device_id,
                Device.merchant_id == self.merchant_id,
            )
            .first()
        )

    def get_address(self, address_id: str) -> Optional[Address]:
        """Fetch delivery address strictly within this merchant's scope."""
        return (
            self.db.query(Address)
            .filter(
                Address.id == address_id,
                Address.merchant_id == self.merchant_id,
            )
            .first()
        )

    # --- Order & Payment Operations ---

    def get_order(self, order_id: str) -> Optional[Order]:
        """Fetch order strictly within this merchant's scope."""
        return (
            self.db.query(Order)
            .filter(
                Order.id == order_id,
                Order.merchant_id == self.merchant_id,
            )
            .first()
        )

    def get_payment(self, payment_id: str) -> Optional[Payment]:
        """Fetch payment strictly within this merchant's scope."""
        return (
            self.db.query(Payment)
            .filter(
                Payment.id == payment_id,
                Payment.merchant_id == self.merchant_id,
            )
            .first()
        )

    # --- Decision & Audit Records ---

    def get_decision(self, decision_id: str) -> Optional[AuditScoreEvent]:
        """Fetch decision record strictly within this merchant's scope.

        Matches by decision_id, event id, or order_id strictly under tenant isolation.
        Returns None if decision belongs to another merchant or does not exist.
        """
        from sqlalchemy import or_

        return (
            self.db.query(AuditScoreEvent)
            .filter(
                AuditScoreEvent.merchant_id == self.merchant_id,
                or_(
                    AuditScoreEvent.decision_id == decision_id,
                    AuditScoreEvent.id == decision_id,
                    AuditScoreEvent.order_id == decision_id,
                ),
            )
            .order_by(AuditScoreEvent.created_at.desc())
            .first()
        )

    def get_decision_by_order(self, order_id: str) -> Optional[AuditScoreEvent]:
        """Fetch decision by order_id strictly within this merchant's scope."""
        return (
            self.db.query(AuditScoreEvent)
            .filter(
                AuditScoreEvent.order_id == order_id,
                AuditScoreEvent.merchant_id == self.merchant_id,
            )
            .first()
        )

    def save_audit_score_event(self, audit_event: AuditScoreEvent) -> AuditScoreEvent:
        """Enforces that the persisted audit record carries this merchant's ID."""
        audit_event.merchant_id = self.merchant_id
        self.db.add(audit_event)
        self.db.commit()
        return audit_event

    # --- Payment Events & Webhook Relays ---

    def get_payment_event(self, event_id: str) -> Optional[PaymentEvent]:
        """Fetch payment event strictly within this merchant's scope."""
        return (
            self.db.query(PaymentEvent)
            .filter(
                PaymentEvent.merchant_id == self.merchant_id,
                PaymentEvent.event_id == event_id,
            )
            .first()
        )

    def record_payment_event(
        self,
        event_id: str,
        event_type: str,
        order_reference: Optional[str] = None,
        summary: Optional[str] = None,
        resource_type: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        status: str = "processed",
    ) -> PaymentEvent:
        """Record payment event strictly scoped to this merchant."""
        event_kwargs = {
            "id": str(uuid.uuid4()),
            "merchant_id": self.merchant_id,
            "event_id": event_id,
            "event_type": event_type,
            "summary": summary,
            "resource_type": resource_type,
            "payload_json": json.dumps(payload or {}),
            "status": status,
        }
        if hasattr(PaymentEvent, "order_reference") and order_reference is not None:
            event_kwargs["order_reference"] = order_reference

        new_event = PaymentEvent(**event_kwargs)
        self.db.add(new_event)
        self.db.commit()
        self.db.refresh(new_event)
        return new_event

    def get_payment_events_for_order(self, order_id: str) -> List[PaymentEvent]:
        """Fetch all payment/relay events linked to an order reference within this merchant's scope."""
        return (
            self.db.query(PaymentEvent)
            .filter(
                PaymentEvent.merchant_id == self.merchant_id,
                PaymentEvent.order_reference == order_id,
            )
            .order_by(PaymentEvent.received_at.asc())
            .all()
        )

    def list_decisions(
        self,
        cursor: Optional[str] = None,
        limit: int = 50,
    ) -> tuple[List[AuditScoreEvent], Optional[str]]:
        """Cursor-paginated listing of decisions for this tenant.

        Ordered stably by created_at DESC, id DESC.
        Limit capped at 100.
        """
        import base64

        limit = max(1, min(limit, 100))
        query = self.db.query(AuditScoreEvent).filter(
            AuditScoreEvent.merchant_id == self.merchant_id
        )

        if cursor:
            try:
                decoded = base64.urlsafe_b64decode(cursor.encode("utf-8")).decode(
                    "utf-8"
                )
                c_created_str, c_id = decoded.split("|", 1)
                c_created = datetime.datetime.fromisoformat(c_created_str)
                query = query.filter(
                    (AuditScoreEvent.created_at < c_created)
                    | (
                        (AuditScoreEvent.created_at == c_created)
                        & (AuditScoreEvent.id < c_id)
                    )
                )
            except Exception:
                pass

        query = query.order_by(
            AuditScoreEvent.created_at.desc(), AuditScoreEvent.id.desc()
        )
        items = query.limit(limit + 1).all()

        next_cursor = None
        if len(items) > limit:
            items = items[:limit]
            last_item = items[-1]
            raw_c = f"{last_item.created_at.isoformat()}|{last_item.id}"
            next_cursor = base64.urlsafe_b64encode(raw_c.encode("utf-8")).decode(
                "utf-8"
            )

        return items, next_cursor

    # --- Phase I: Dispute, Investigation, Document, and Evidence Operations ---

    def upsert_dispute(
        self,
        external_dispute_id: str,
        reason_code: str,
        status: str,
        amount: float,
        currency: str = "USD",
        transaction_id: Optional[str] = None,
        payment_id: Optional[str] = None,
        opened_at: Optional[datetime.datetime] = None,
    ) -> Dispute:
        """Upsert a dispute by (merchant_id, external_dispute_id)."""
        dispute = (
            self.db.query(Dispute)
            .filter(
                Dispute.merchant_id == self.merchant_id,
                Dispute.external_dispute_id == external_dispute_id,
            )
            .first()
        )

        now = datetime.datetime.now(datetime.timezone.utc)
        if dispute:
            dispute.reason_code = reason_code
            dispute.status = status
            dispute.amount = amount
            dispute.currency = currency
            if transaction_id is not None:
                dispute.transaction_id = transaction_id
            if payment_id is not None:
                dispute.payment_id = payment_id
            if opened_at is not None:
                dispute.opened_at = opened_at
            dispute.received_at = now
        else:
            dispute = Dispute(
                id=f"disp_{uuid.uuid4().hex[:16]}",
                merchant_id=self.merchant_id,
                external_dispute_id=external_dispute_id,
                transaction_id=transaction_id,
                payment_id=payment_id,
                reason_code=reason_code,
                status=status,
                amount=amount,
                currency=currency,
                opened_at=opened_at or now,
                received_at=now,
                created_at=now,
            )
            self.db.add(dispute)

        self.db.commit()
        self.db.refresh(dispute)
        return dispute

    def get_dispute(self, dispute_id: str) -> Optional[Dispute]:
        """Fetch dispute by internal id or external_dispute_id strictly within tenant scope."""
        return (
            self.db.query(Dispute)
            .filter(
                Dispute.merchant_id == self.merchant_id,
                (Dispute.id == dispute_id)
                | (Dispute.external_dispute_id == dispute_id),
            )
            .first()
        )

    def list_disputes(
        self,
        status: Optional[str] = None,
        cursor: Optional[str] = None,
        limit: int = 50,
    ) -> tuple[List[Dispute], Optional[str]]:
        """List disputes for this tenant with cursor pagination."""
        import base64

        limit = max(1, min(limit, 100))
        query = self.db.query(Dispute).filter(Dispute.merchant_id == self.merchant_id)
        if status:
            query = query.filter(Dispute.status == status)

        if cursor:
            try:
                decoded = base64.urlsafe_b64decode(cursor.encode("utf-8")).decode(
                    "utf-8"
                )
                c_created_str, c_id = decoded.split("|", 1)
                c_created = datetime.datetime.fromisoformat(c_created_str)
                query = query.filter(
                    (Dispute.received_at < c_created)
                    | ((Dispute.received_at == c_created) & (Dispute.id < c_id))
                )
            except Exception:
                pass

        query = query.order_by(Dispute.received_at.desc(), Dispute.id.desc())
        items = query.limit(limit + 1).all()

        next_cursor = None
        if len(items) > limit:
            items = items[:limit]
            last_item = items[-1]
            raw_c = f"{last_item.received_at.isoformat()}|{last_item.id}"
            next_cursor = base64.urlsafe_b64encode(raw_c.encode("utf-8")).decode(
                "utf-8"
            )

        return items, next_cursor

    def add_dispute_document(
        self,
        dispute_id: str,
        evidence_type: str,
        filename: str,
        text_content: str,
        sha256: str,
        byte_size: int,
    ) -> DisputeDocument:
        """Store a document associated with a dispute under tenant isolation."""
        doc = DisputeDocument(
            id=f"doc_{uuid.uuid4().hex[:16]}",
            merchant_id=self.merchant_id,
            dispute_id=dispute_id,
            evidence_type=evidence_type,
            filename=filename,
            text_content=text_content,
            sha256=sha256,
            byte_size=byte_size,
            received_at=datetime.datetime.now(datetime.timezone.utc),
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def get_dispute_documents(self, dispute_id: str) -> List[DisputeDocument]:
        """Fetch all documents for a dispute under tenant isolation."""
        return (
            self.db.query(DisputeDocument)
            .filter(
                DisputeDocument.merchant_id == self.merchant_id,
                DisputeDocument.dispute_id == dispute_id,
            )
            .order_by(DisputeDocument.received_at.asc())
            .all()
        )

    def get_or_create_investigation(self, dispute_id: str) -> Investigation:
        """Get or create the investigation case for a dispute."""
        inv = (
            self.db.query(Investigation)
            .filter(
                Investigation.merchant_id == self.merchant_id,
                Investigation.dispute_id == dispute_id,
            )
            .first()
        )
        if not inv:
            now = datetime.datetime.now(datetime.timezone.utc)
            inv = Investigation(
                id=f"inv_{uuid.uuid4().hex[:16]}",
                merchant_id=self.merchant_id,
                dispute_id=dispute_id,
                status="OPEN",
                created_at=now,
                updated_at=now,
            )
            self.db.add(inv)
            self.db.commit()
            self.db.refresh(inv)
        return inv

    def get_investigation(self, investigation_id: str) -> Optional[Investigation]:
        """Fetch investigation strictly within tenant scope."""
        return (
            self.db.query(Investigation)
            .filter(
                Investigation.merchant_id == self.merchant_id,
                (Investigation.id == investigation_id)
                | (Investigation.dispute_id == investigation_id),
            )
            .first()
        )

    def list_investigations(
        self,
        status: Optional[str] = None,
        cursor: Optional[str] = None,
        limit: int = 50,
    ) -> tuple[List[Investigation], Optional[str]]:
        """Cursor-paginated list of investigations for this tenant."""
        import base64

        limit = max(1, min(limit, 100))
        query = self.db.query(Investigation).filter(
            Investigation.merchant_id == self.merchant_id
        )
        if status:
            query = query.filter(Investigation.status == status)

        if cursor:
            try:
                decoded = base64.urlsafe_b64decode(cursor.encode("utf-8")).decode(
                    "utf-8"
                )
                c_created_str, c_id = decoded.split("|", 1)
                c_created = datetime.datetime.fromisoformat(c_created_str)
                query = query.filter(
                    (Investigation.created_at < c_created)
                    | (
                        (Investigation.created_at == c_created)
                        & (Investigation.id < c_id)
                    )
                )
            except Exception:
                pass

        query = query.order_by(Investigation.created_at.desc(), Investigation.id.desc())
        items = query.limit(limit + 1).all()

        next_cursor = None
        if len(items) > limit:
            items = items[:limit]
            last_item = items[-1]
            raw_c = f"{last_item.created_at.isoformat()}|{last_item.id}"
            next_cursor = base64.urlsafe_b64encode(raw_c.encode("utf-8")).decode(
                "utf-8"
            )

        return items, next_cursor

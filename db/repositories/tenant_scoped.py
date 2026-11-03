"""Tenant-scoped repository for multi-tenant data access (Phase E-2).

Enforces:
1. Every query requires merchant_id. Unscoped queries are strictly prevented.
2. Cross-tenant reads return None (triggering 404 at the HTTP layer, never 403).
3. Customer lookups are keyed by compound (merchant_id, customer_id).
4. All writes automatically stamp merchant_id.
"""

import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from db.models import (
    Address,
    AuditScoreEvent,
    Customer,
    Device,
    Dispute,
    EvidencePack,
    EvidenceSubmission,
    MerchantAudit,
    Order,
    Payment,
    PaymentEvent,
    Refund,
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
        query = (
            self.db.query(Order)
            .filter(
                Order.merchant_id == self.merchant_id,
                Order.customer_id == customer_id,
            )
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

        Returns None if decision belongs to another merchant or does not exist.
        """
        return (
            self.db.query(AuditScoreEvent)
            .filter(
                AuditScoreEvent.decision_id == decision_id,
                AuditScoreEvent.merchant_id == self.merchant_id,
            )
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

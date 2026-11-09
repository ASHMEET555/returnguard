"""SQLAlchemy database models for ReturnGuard."""

import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from db.session import Base


class Merchant(Base):
    """Merchant entity."""

    __tablename__ = "merchants"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    customers = relationship("Customer", back_populates="merchant")
    orders = relationship("Order", back_populates="merchant")
    api_keys = relationship("APIKey", back_populates="merchant")


class Customer(Base):
    """Customer entity."""

    __tablename__ = "customers"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(32), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    merchant = relationship("Merchant", back_populates="customers")
    addresses = relationship("Address", back_populates="customer")
    devices = relationship("Device", back_populates="customer")
    orders = relationship("Order", back_populates="customer")


class Address(Base):
    """Customer physical delivery address."""

    __tablename__ = "addresses"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=True, index=True
    )
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False)
    line1 = Column(String(255), nullable=False)
    locality = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(16), nullable=False)
    country = Column(String(64), default="India", nullable=False)
    normalized_hash = Column(String(128), nullable=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    customer = relationship("Customer", back_populates="addresses")
    orders = relationship("Order", back_populates="address")


class Device(Base):
    """Customer device session and hardware fingerprint."""

    __tablename__ = "devices"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=True, index=True
    )
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False)
    device_hash = Column(String(128), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    customer = relationship("Customer", back_populates="devices")
    orders = relationship("Order", back_populates="device")


class Order(Base):
    """Order transaction across COD and PayPal channels."""

    __tablename__ = "orders"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False)
    address_id = Column(String(64), ForeignKey("addresses.id"), nullable=False)
    device_id = Column(String(64), ForeignKey("devices.id"), nullable=False)
    channel = Column(String(32), nullable=False, index=True)  # 'cod' | 'paypal'
    order_value = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    item_count = Column(Integer, default=1, nullable=False)
    category = Column(String(64), nullable=False)
    status = Column(String(32), default="created", nullable=False)
    order_time = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    merchant = relationship("Merchant", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    address = relationship("Address", back_populates="orders")
    device = relationship("Device", back_populates="orders")
    payments = relationship("Payment", back_populates="order")
    shipments = relationship("Shipment", back_populates="order")


class Payment(Base):
    """Payment record linked to an order."""

    __tablename__ = "payments"

    id = Column(String(64), primary_key=True)
    order_id = Column(String(64), ForeignKey("orders.id"), nullable=False)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=True, index=True
    )
    channel = Column(String(32), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(
        String(32), nullable=False
    )  # 'created', 'authorized', 'captured', 'pending'
    paypal_order_id = Column(String(128), nullable=True, index=True)
    authorization_id = Column(String(128), nullable=True)
    capture_id = Column(String(128), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    order = relationship("Order", back_populates="payments")


class Shipment(Base):
    """Shipment and logistics fulfillment entity."""

    __tablename__ = "shipments"

    id = Column(String(64), primary_key=True)
    order_id = Column(String(64), ForeignKey("orders.id"), nullable=False)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=True, index=True
    )
    carrier = Column(String(64), nullable=False)
    tracking_number = Column(String(128), nullable=False, index=True)
    status = Column(
        String(32), nullable=False
    )  # 'in_transit', 'delivered', 'rto_delivered'
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    rto_initiated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    order = relationship("Order", back_populates="shipments")


class ReturnEvent(Base):
    """Customer return request or physical return receipt event."""

    __tablename__ = "return_events"

    id = Column(String(64), primary_key=True)
    order_id = Column(String(64), ForeignKey("orders.id"), nullable=False)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=True, index=True
    )
    reason = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False)  # 'requested', 'received', 'inspected'
    received_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    order = relationship("Order")


class Refund(Base):
    """Refund transaction record."""

    __tablename__ = "refunds"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=True, index=True
    )
    payment_id = Column(String(64), ForeignKey("payments.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String(32), nullable=False)  # 'pending', 'completed', 'failed'
    paypal_refund_id = Column(String(128), nullable=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    payment = relationship("Payment")


class PaymentEvent(Base):
    """Normalized relayed payment events stored idempotently per merchant."""

    __tablename__ = "payment_events"
    __table_args__ = (
        UniqueConstraint(
            "merchant_id", "event_id", name="uq_payment_events_merchant_event"
        ),
    )

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    event_id = Column(String(128), nullable=False, index=True)
    order_reference = Column(String(64), nullable=True, index=True)
    event_type = Column(String(128), nullable=False)
    summary = Column(String(255), nullable=True)
    resource_type = Column(String(64), nullable=True)
    payload_json = Column(Text, nullable=False)
    received_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )
    status = Column(String(32), default="processed", nullable=False)


class Dispute(Base):
    """Payment dispute record from PayPal Disputes API."""

    __tablename__ = "disputes"
    __table_args__ = (
        UniqueConstraint(
            "merchant_id",
            "external_dispute_id",
            name="uq_disputes_merchant_external_id",
        ),
    )

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    external_dispute_id = Column(String(128), nullable=False, index=True)
    transaction_id = Column(
        String(64), ForeignKey("orders.id"), nullable=True, index=True
    )
    payment_id = Column(
        String(64), ForeignKey("payments.id"), nullable=True, index=True
    )
    reason_code = Column(String(128), nullable=False)
    status = Column(String(64), nullable=False)  # 'WAITING_FOR_SELLER_RESPONSE', etc.
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    received_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )
    # Compatibility properties/columns for analytics and prior references
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )
    evidences_requested_json = Column(Text, nullable=True)
    dispute_life_cycle_stage = Column(String(64), nullable=True)

    paypal_dispute_id = Column(String(128), nullable=True)
    reason = Column(String(128), nullable=True)

    payment = relationship("Payment")
    documents = relationship(
        "DisputeDocument", back_populates="dispute", cascade="all, delete-orphan"
    )
    investigations = relationship(
        "Investigation", back_populates="dispute", cascade="all, delete-orphan"
    )


class DisputeDocument(Base):
    """Document evidence associated with a dispute."""

    __tablename__ = "dispute_documents"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    dispute_id = Column(
        String(64), ForeignKey("disputes.id"), nullable=False, index=True
    )
    evidence_type = Column(String(64), nullable=False)  # e.g. PROOF_OF_DELIVERY
    filename = Column(String(255), nullable=False)
    text_content = Column(Text, nullable=False)  # capped at 1 MB
    sha256 = Column(String(64), nullable=False)
    byte_size = Column(Integer, nullable=False)
    received_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    dispute = relationship("Dispute", back_populates="documents")


class Investigation(Base):
    """Investigation case container for a disputed transaction."""

    __tablename__ = "investigations"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    dispute_id = Column(
        String(64), ForeignKey("disputes.id"), nullable=True, index=True
    )
    transaction_id = Column(
        String(64), ForeignKey("orders.id"), nullable=True, index=True
    )
    decision_id = Column(String(64), nullable=True, index=True)
    status = Column(
        String(32), default="OPEN", nullable=False
    )  # 'OPEN', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUBMITTED'
    source = Column(
        String(32), default="AUTO_CRITICAL", nullable=False
    )  # 'AUTO_CRITICAL', 'MANUAL'
    case_hash = Column(String(64), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        onupdate=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    dispute = relationship("Dispute", back_populates="investigations")
    findings = relationship(
        "InvestigationFinding",
        back_populates="investigation",
        cascade="all, delete-orphan",
    )
    llm_runs = relationship(
        "LLMRun", back_populates="investigation", cascade="all, delete-orphan"
    )
    evidence_packs = relationship(
        "EvidencePack", back_populates="investigation", cascade="all, delete-orphan"
    )
    approvals = relationship(
        "EvidenceApproval", back_populates="investigation", cascade="all, delete-orphan"
    )
    submission_results = relationship(
        "SubmissionResult", back_populates="investigation", cascade="all, delete-orphan"
    )
    steps = relationship(
        "InvestigationStep",
        back_populates="investigation",
        cascade="all, delete-orphan",
        order_by="InvestigationStep.created_at.asc(), InvestigationStep.id.asc()",
    )


class InvestigationStep(Base):
    """Append-only audit step log for an investigation."""

    __tablename__ = "investigation_steps"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    investigation_id = Column(
        String(64), ForeignKey("investigations.id"), nullable=False, index=True
    )
    step_type = Column(String(64), nullable=False)
    actor = Column(String(128), nullable=False)  # embed-token sub or "system"
    actor_type = Column(String(32), nullable=False)  # "reviewer", "system"
    note = Column(Text, nullable=True)
    pack_hash = Column(String(64), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    investigation = relationship("Investigation", back_populates="steps")


class InvestigationFinding(Base):
    """Deterministic, code-generated finding for an investigation case."""

    __tablename__ = "investigation_findings"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    investigation_id = Column(
        String(64), ForeignKey("investigations.id"), nullable=False, index=True
    )
    finding_code = Column(String(64), nullable=False)
    severity = Column(
        String(32), nullable=False
    )  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INFO'
    alias_refs = Column(JSON, nullable=False)  # list of alias strings e.g. ["O1", "R1"]
    computed_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    investigation = relationship("Investigation", back_populates="findings")


class LLMRun(Base):
    """Audit log of LLM reasoning runs for an investigation."""

    __tablename__ = "llm_runs"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    investigation_id = Column(
        String(64), ForeignKey("investigations.id"), nullable=False, index=True
    )
    provider = Column(String(64), nullable=False)
    model = Column(String(64), nullable=False)
    prompt_hash = Column(String(64), nullable=False)
    raw_output = Column(Text, nullable=True)
    validation_result = Column(JSON, nullable=True)
    final_status = Column(
        String(32), nullable=False
    )  # 'VALIDATED', 'FAILED_RETRY', 'FALLBACK_TEMPLATE'
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    investigation = relationship("Investigation", back_populates="llm_runs")


class EvidencePack(Base):
    """Grounded evidence package generated from stored records only."""

    __tablename__ = "evidence_packs"
    __table_args__ = (
        UniqueConstraint(
            "investigation_id",
            "version",
            name="uq_evidence_packs_investigation_version",
        ),
    )

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    investigation_id = Column(
        String(64), ForeignKey("investigations.id"), nullable=False, index=True
    )
    version = Column(Integer, default=1, nullable=False)
    pack_hash = Column(String(64), nullable=False, index=True)
    pack_json = Column(JSON, nullable=False)
    pack_md = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    # Backwards-compatibility helper for any legacy property access
    @property
    def dispute_id(self):
        return self.investigation.dispute_id if self.investigation else None

    investigation = relationship("Investigation", back_populates="evidence_packs")


class EvidenceApproval(Base):
    """Human approval or rejection decision record for an evidence pack."""

    __tablename__ = "evidence_approvals"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    investigation_id = Column(
        String(64), ForeignKey("investigations.id"), nullable=False, index=True
    )
    pack_hash = Column(String(64), nullable=False, index=True)
    decision = Column(String(16), nullable=False)  # 'APPROVE' or 'REJECT'
    approver_sub = Column(String(128), nullable=False)
    reason = Column(Text, nullable=True)
    decided_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    investigation = relationship("Investigation", back_populates="approvals")


class SubmissionResult(Base):
    """Result of external submission performed by ShopPoint."""

    __tablename__ = "submission_results"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    investigation_id = Column(
        String(64), ForeignKey("investigations.id"), nullable=False, index=True
    )
    submission_key = Column(String(128), unique=True, nullable=False, index=True)
    pack_hash = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False)  # 'SUBMITTED', 'ACCEPTED', 'REJECTED'
    paypal_reference = Column(String(128), nullable=True)
    reported_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    investigation = relationship("Investigation", back_populates="submission_results")


class EvidenceSubmission(Base):
    """Legacy dispute evidence submission event record (deprecated)."""

    __tablename__ = "evidence_submissions"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=True, index=True
    )
    evidence_pack_id = Column(String(64), nullable=False)
    paypal_dispute_id = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False)  # 'submitted', 'accepted', 'rejected'
    response_payload = Column(Text, nullable=True)
    submitted_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )


class MerchantAudit(Base):
    """Immutable audit log for merchant actions and assistant operations."""

    __tablename__ = "merchant_audits"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=False)
    action = Column(String(64), nullable=False)
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    actor = Column(String(64), nullable=False)  # merchant user or system/assistant
    details_json = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    merchant = relationship("Merchant")


class APIKey(Base):
    """API key for merchant authentication."""

    __tablename__ = "api_keys"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    key_prefix = Column(String(32), nullable=False, index=True)
    key_hash = Column(String(64), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    merchant = relationship("Merchant", back_populates="api_keys")


class AuditScoreEvent(Base):
    """Immutable record of online risk scores and soft policy decisions."""

    __tablename__ = "audit_score_events"

    id = Column(String(64), primary_key=True)
    decision_id = Column(String(64), nullable=True, index=True)
    order_id = Column(String(64), ForeignKey("orders.id"), nullable=False)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=True, index=True
    )
    channel = Column(String(32), default="paypal", nullable=False)
    risk_score = Column(Numeric(6, 4), nullable=False)
    tier = Column(String(32), default="LOW", nullable=False)
    policy_rule = Column(String(64), default="ALLOW_NORMAL", nullable=False)
    policy_action = Column(String(64), default="ALLOW", nullable=False)
    severity = Column(String(32), default="allow", nullable=False)
    suggested_action = Column(String(32), default="allow", nullable=False)
    model_version = Column(String(64), default="candidate_lgbm_v1", nullable=False)
    threshold = Column(Numeric(5, 4), default=0.40, nullable=False)
    model_status = Column(String(32), default="loaded", nullable=False)
    feature_completeness = Column(Numeric(5, 4), default=1.0, nullable=False)
    explanation_status = Column(String(32), default="available", nullable=False)
    reason_codes_json = Column(Text, nullable=True)
    rule_hits_json = Column(Text, nullable=True)
    feature_snapshot_json = Column(Text, nullable=True)
    ring_id = Column(String(64), nullable=True)
    shadow = Column(Integer, default=1, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    order = relationship("Order")

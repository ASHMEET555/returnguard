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
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
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
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
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
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
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
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
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
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
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
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
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
    """Raw verified PayPal webhook events stored idempotently."""

    __tablename__ = "payment_events"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
    event_id = Column(String(128), unique=True, nullable=False, index=True)
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

    id = Column(String(64), primary_key=True)
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
    payment_id = Column(String(64), ForeignKey("payments.id"), nullable=False)
    paypal_dispute_id = Column(String(128), unique=True, nullable=True, index=True)
    reason = Column(String(128), nullable=False)
    status = Column(String(64), nullable=False)  # 'WAITING_FOR_SELLER_RESPONSE', etc.
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    evidences_requested_json = Column(Text, nullable=True)
    dispute_life_cycle_stage = Column(String(64), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    payment = relationship("Payment")
    evidence_packs = relationship("EvidencePack", back_populates="dispute")


class EvidencePack(Base):
    """Evidence pack mapped to PayPal dispute evidence requirements."""

    __tablename__ = "evidence_packs"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
    dispute_id = Column(String(64), ForeignKey("disputes.id"), nullable=False)
    pack_hash = Column(String(128), nullable=False)
    completeness_pct = Column(Numeric(5, 2), nullable=False)
    win_likelihood = Column(Numeric(5, 2), nullable=False)
    sections_json = Column(Text, nullable=False)
    status = Column(String(32), default="draft", nullable=False)  # 'draft', 'approved'
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    dispute = relationship("Dispute", back_populates="evidence_packs")
    submissions = relationship("EvidenceSubmission", back_populates="evidence_pack")


class EvidenceSubmission(Base):
    """Dispute evidence submission event record."""

    __tablename__ = "evidence_submissions"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
    evidence_pack_id = Column(
        String(64), ForeignKey("evidence_packs.id"), nullable=False
    )
    paypal_dispute_id = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False)  # 'submitted', 'accepted', 'rejected'
    response_payload = Column(Text, nullable=True)
    submitted_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False,
    )

    evidence_pack = relationship("EvidencePack", back_populates="submissions")


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
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
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

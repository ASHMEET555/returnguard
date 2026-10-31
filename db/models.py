"""SQLAlchemy database models for ReturnGuard."""

import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
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

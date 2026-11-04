"""Customer endpoints for ReturnGuard (Phase G Milestone 2).

Provides tenant-scoped customer listing with cursor pagination,
and detailed customer profiles including order history, linked devices,
normalized addresses, and risk audit scoring history.
"""

import base64
import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.embed_tokens import AuthContext, require_read_or_review_auth
from db.models import Address, AuditScoreEvent, Customer, Device, Order
from db.session import get_db

router = APIRouter(tags=["customers"])


def _mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "***"
    parts = email.split("@")
    user = parts[0]
    domain = parts[1]
    if len(user) <= 2:
        masked_user = user[0] + "***"
    else:
        masked_user = user[0] + "***" + user[-1]
    return f"{masked_user}@{domain}"


def _mask_phone(phone: str) -> str:
    if not phone:
        return "***"
    cleaned = phone.strip()
    if len(cleaned) <= 4:
        return "***"
    return cleaned[:3] + "******" + cleaned[-2:]


class CustomerListItem(BaseModel):
    customer_id: str
    email: str
    phone: str
    total_orders: int
    total_spent: float
    currency: str
    max_risk_score: float
    last_order_at: Optional[str] = None
    created_at: str


class CustomerListResponse(BaseModel):
    items: List[CustomerListItem]
    next_cursor: Optional[str] = None
    has_more: bool


class LinkedDeviceItem(BaseModel):
    id: str
    device_hash: str
    ip_address: Optional[str] = None
    created_at: str


class LinkedAddressItem(BaseModel):
    id: str
    city: str
    state: str
    pincode: str
    country: str
    created_at: str


class CustomerOrderSummary(BaseModel):
    order_id: str
    order_value: float
    currency: str
    channel: str
    status: str
    order_time: str
    risk_score: Optional[float] = None
    policy_action: Optional[str] = None


class CustomerProfileResponse(BaseModel):
    customer_id: str
    email: str
    phone: str
    created_at: str
    total_orders: int
    total_spent: float
    currency: str
    max_risk_score: float
    average_risk_score: float
    linked_devices: List[LinkedDeviceItem]
    linked_addresses: List[LinkedAddressItem]
    order_history: List[CustomerOrderSummary]


@router.get(
    "/v1/customers",
    response_model=CustomerListResponse,
    status_code=status.HTTP_200_OK,
    summary="List tenant customers with pagination",
)
def list_customers(
    cursor: Optional[str] = Query(None, description="Pagination cursor"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
) -> CustomerListResponse:
    tenant_id = auth.tenant_id

    query = db.query(Customer).filter(Customer.merchant_id == tenant_id)

    if cursor:
        try:
            decoded = base64.urlsafe_b64decode(cursor.encode("utf-8")).decode("utf-8")
            c_created_str, c_id = decoded.split("|", 1)
            c_created = datetime.datetime.fromisoformat(c_created_str)
            query = query.filter(
                (Customer.created_at < c_created)
                | ((Customer.created_at == c_created) & (Customer.id < c_id))
            )
        except Exception:
            pass

    query = query.order_by(Customer.created_at.desc(), Customer.id.desc())
    customers = query.limit(limit + 1).all()

    has_more = len(customers) > limit
    next_cursor = None
    if has_more:
        customers = customers[:limit]
        last = customers[-1]
        raw_c = f"{last.created_at.isoformat()}|{last.id}"
        next_cursor = base64.urlsafe_b64encode(raw_c.encode("utf-8")).decode("utf-8")

    items: List[CustomerListItem] = []
    for c in customers:
        # Aggregate orders for this customer
        orders = (
            db.query(Order)
            .filter(Order.merchant_id == tenant_id, Order.customer_id == c.id)
            .all()
        )
        total_orders = len(orders)
        total_spent = sum(float(o.order_value or 0.0) for o in orders)
        currency = orders[0].currency if orders else "INR"
        last_order = max((o.order_time for o in orders), default=None)

        # Look up max risk score from audit events for customer's orders
        order_ids = [o.id for o in orders]
        max_score = 0.0
        if order_ids:
            scores = (
                db.query(func.coalesce(func.max(AuditScoreEvent.risk_score), 0.0))
                .filter(
                    AuditScoreEvent.merchant_id == tenant_id,
                    AuditScoreEvent.order_id.in_(order_ids),
                )
                .scalar()
            )
            max_score = float(scores or 0.0)

        items.append(
            CustomerListItem(
                customer_id=c.id,
                email=_mask_email(c.email),
                phone=_mask_phone(c.phone),
                total_orders=total_orders,
                total_spent=round(total_spent, 2),
                currency=currency,
                max_risk_score=round(max_score, 4),
                last_order_at=last_order.isoformat() if last_order else None,
                created_at=c.created_at.isoformat() if c.created_at else "",
            )
        )

    return CustomerListResponse(
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


@router.get(
    "/v1/customers/{customer_id}",
    response_model=CustomerProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get detailed customer profile with order & risk history",
)
def get_customer_profile(
    customer_id: str,
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
) -> CustomerProfileResponse:
    tenant_id = auth.tenant_id

    customer = (
        db.query(Customer)
        .filter(Customer.merchant_id == tenant_id, Customer.id == customer_id)
        .first()
    )
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer '{customer_id}' not found.",
        )

    devices = (
        db.query(Device)
        .filter(Device.merchant_id == tenant_id, Device.customer_id == customer_id)
        .all()
    )

    addresses = (
        db.query(Address)
        .filter(Address.merchant_id == tenant_id, Address.customer_id == customer_id)
        .all()
    )

    orders = (
        db.query(Order)
        .filter(Order.merchant_id == tenant_id, Order.customer_id == customer_id)
        .order_by(Order.order_time.desc())
        .all()
    )

    order_history: List[CustomerOrderSummary] = []
    risk_scores: List[float] = []

    for o in orders:
        audit = (
            db.query(AuditScoreEvent)
            .filter(
                AuditScoreEvent.merchant_id == tenant_id,
                AuditScoreEvent.order_id == o.id,
            )
            .first()
        )
        score = float(audit.risk_score) if audit else None
        action = audit.policy_action if audit else None
        if score is not None:
            risk_scores.append(score)

        order_history.append(
            CustomerOrderSummary(
                order_id=o.id,
                order_value=float(o.order_value or 0.0),
                currency=o.currency or "INR",
                channel=o.channel or "web",
                status=o.status or "created",
                order_time=o.order_time.isoformat() if o.order_time else "",
                risk_score=score,
                policy_action=action,
            )
        )

    total_spent = sum(o.order_value for o in order_history)
    max_risk = max(risk_scores, default=0.0)
    avg_risk = sum(risk_scores) / len(risk_scores) if risk_scores else 0.0
    primary_currency = order_history[0].currency if order_history else "INR"

    return CustomerProfileResponse(
        customer_id=customer.id,
        email=_mask_email(customer.email),
        phone=_mask_phone(customer.phone),
        created_at=customer.created_at.isoformat() if customer.created_at else "",
        total_orders=len(orders),
        total_spent=round(total_spent, 2),
        currency=primary_currency,
        max_risk_score=round(max_risk, 4),
        average_risk_score=round(avg_risk, 4),
        linked_devices=[
            LinkedDeviceItem(
                id=d.id,
                device_hash=d.device_hash,
                ip_address=d.ip_address,
                created_at=d.created_at.isoformat() if d.created_at else "",
            )
            for d in devices
        ],
        linked_addresses=[
            LinkedAddressItem(
                id=a.id,
                city=a.city,
                state=a.state,
                pincode=a.pincode,
                country=a.country,
                created_at=a.created_at.isoformat() if a.created_at else "",
            )
            for a in addresses
        ],
        order_history=order_history,
    )

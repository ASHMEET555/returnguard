"""Transactions and Events relay API route.

Receives, validates, and records normalized transaction and payment events
from authenticated merchant sources (e.g., ShopPoint store relay).
Guarantees multi-tenant isolation, idempotent deduplication by (merchant_id, event_id),
strict monetary precision validation, and atomic pending refund reconciliation.
"""

import datetime
from decimal import Decimal
import json
import re
from typing import Any, Dict, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from auth.api_keys import get_api_key_merchant
from db.models import Payment, Refund
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import get_db, acquire_immediate_lock

router = APIRouter(prefix="/v1/transactions", tags=["events"])

SUPPORTED_CURRENCIES = {"USD", "INR", "EUR", "GBP", "CAD", "AUD"}
DECIMAL_REGEX = re.compile(r"^\d+\.\d{2}$")


class PayPalReferences(BaseModel):
    """Associated PayPal gateway references."""

    order_id: Optional[str] = Field(None, description="PayPal Order ID (e.g. 5O190127TN364715T)")
    authorization_id: Optional[str] = Field(None, description="PayPal Authorization ID")
    capture_id: Optional[str] = Field(None, description="PayPal Capture ID")


class NormalizedEventRequest(BaseModel):
    """Normalized payment event payload sent by merchant relay client."""

    event_id: str = Field(..., description="Unique event ID (e.g. WH-12345)")
    event_type: str = Field(..., description="Normalized event type (e.g. PAYMENT.CAPTURE.COMPLETED)")
    order_reference: Optional[str] = Field(None, description="Merchant order reference / ID")
    amount: Optional[str] = Field(None, description="Monetary amount formatted as exact 2-decimal string (e.g. '10.00')")
    currency: Optional[str] = Field(None, description="Currency code from allowlist (e.g. USD, INR)")
    paypal_references: Optional[PayPalReferences] = Field(None, description="PayPal transaction identifiers")
    status: str = Field("completed", description="Event status")
    occurred_at: Optional[datetime.datetime] = Field(None, description="Event occurrence timestamp")
    merchant_id: Optional[str] = Field(None, description="Optional merchant ID; if present, must match API key")
    summary: Optional[str] = Field(None, description="Human-readable event summary")
    resource_type: Optional[str] = Field(None, description="Resource type (e.g. capture, authorization)")
    raw_payload: Optional[Dict[str, Any]] = Field(None, description="Original raw event payload or details")

    @field_validator("amount")
    @classmethod
    def validate_amount_precision(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not isinstance(v, str) or not DECIMAL_REGEX.match(v):
            raise ValueError("Amount must be a string with exact 2 decimal places (e.g. '10.00')")
        dec = Decimal(v)
        if dec <= Decimal("0.00"):
            raise ValueError("Amount must be positive")
        return v

    @field_validator("currency")
    @classmethod
    def validate_currency_allowlist(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        code = v.upper().strip()
        if code not in SUPPORTED_CURRENCIES:
            raise ValueError(f"Currency '{v}' is not supported. Must be one of {sorted(list(SUPPORTED_CURRENCIES))}")
        return code


@router.post("/events", status_code=status.HTTP_200_OK)
def relay_transaction_event(
    event: NormalizedEventRequest,
    auth_merchant_id: str = Depends(get_api_key_merchant),
    db: Session = Depends(get_db),
):
    """Ingest and record a normalized transaction event with strict multi-tenant scoping.

    1. Authenticated via Bearer API Key; merchant identity is extracted from the key.
    2. If payload contains merchant_id and it differs from auth_merchant_id, reject with 403 Forbidden.
    3. Deduplicates idempotently by (merchant_id, event_id). Replays return 200 without second write.
    4. Updates financial ledger projection:
       - On Capture: updates/creates Payment, reconciles pending unlinked refunds.
       - On Refund: validates currency & balance; updates refunded_amount or marks PENDING_CAPTURE_LINK.
    """
    # 1. Enforce strict merchant isolation (reject untrusted cross-tenant payloads with 403 Forbidden)
    if event.merchant_id and event.merchant_id.strip() != auth_merchant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"merchant_id in payload ('{event.merchant_id}') does not match authenticated merchant ('{auth_merchant_id}')",
        )

    repo = TenantScopedRepository(db, auth_merchant_id)

    # 2. Scope order reference if present
    if event.order_reference:
        order = repo.get_order(event.order_reference)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{event.order_reference}' not found for authenticated merchant",
            )

    # 3. Check idempotent deduplication by (merchant_id, event_id)
    existing = repo.get_payment_event(event.event_id)
    if existing:
        return {
            "status": "duplicate",
            "data": {
                "event_id": existing.event_id,
                "merchant_id": existing.merchant_id,
                "event_type": existing.event_type,
                "status": existing.status,
                "message": "Duplicate event ignored idempotently",
            },
        }

    # Acquire RESERVED lock for write transaction in SQLite
    acquire_immediate_lock(db)

    now = event.occurred_at or datetime.datetime.now(datetime.UTC)
    capture_id = event.paypal_references.capture_id if event.paypal_references else None
    paypal_order_id = event.paypal_references.order_id if event.paypal_references else None
    authorization_id = event.paypal_references.authorization_id if event.paypal_references else None

    # 4. Handle financial ledger projection for captures (when amount is supplied)
    if event.event_type in ("PAYMENT.CAPTURE.COMPLETED", "PAYMENT_CAPTURED") and event.amount is not None:
        dec_amount = Decimal(event.amount)
        order_ref = event.order_reference or f"ord_{uuid.uuid4().hex[:12]}"
        curr = event.currency or "USD"

        # Look up existing payment projection by capture_id or order_id
        payment = None
        if capture_id:
            payment = repo.get_payment_by_capture(capture_id)
        if not payment and event.order_reference:
            payment = repo.get_payment_by_order(event.order_reference)

        if payment:
            payment.status = "captured"
            payment.amount = dec_amount
            payment.currency = event.currency
            if capture_id:
                payment.capture_id = capture_id
            if paypal_order_id:
                payment.paypal_order_id = paypal_order_id
            if authorization_id:
                payment.authorization_id = authorization_id
        else:
            payment = Payment(
                id=f"pay_{uuid.uuid4().hex[:16]}",
                order_id=order_ref,
                merchant_id=auth_merchant_id,
                channel="paypal",
                amount=dec_amount,
                refunded_amount=Decimal("0.00"),
                currency=event.currency,
                status="captured",
                paypal_order_id=paypal_order_id,
                authorization_id=authorization_id,
                capture_id=capture_id,
                created_at=now,
            )
            db.add(payment)

        db.flush()

        # Reconcile any unlinked pending refunds for this order
        pending_refunds = repo.get_pending_refunds_for_order(order_ref)
        for r in pending_refunds:
            if r.currency != payment.currency:
                r.status = "RECONCILIATION_ERROR"
                r.error_reason = f"Currency mismatch: capture={payment.currency}, refund={r.currency}"
            elif payment.refunded_amount + r.amount > payment.amount:
                r.status = "RECONCILIATION_ERROR"
                r.error_reason = f"Refund {r.amount} exceeds remaining capture balance {payment.amount - payment.refunded_amount}"
            else:
                r.payment_id = payment.id
                r.status = "RECONCILED"
                r.reconciled_at = datetime.datetime.now(datetime.UTC)
                payment.refunded_amount += r.amount

    # 4. Handle financial ledger projection for refunds
    elif event.event_type in ("PAYMENT.CAPTURE.REFUNDED", "PAYMENT_REFUNDED"):
        if event.amount is None or event.currency is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Refund events must include valid amount and currency",
            )

        dec_refund = Decimal(event.amount)
        order_ref = event.order_reference or ""
        refund_id = capture_id or event.event_id

        # Look up existing capture payment
        payment = None
        if capture_id:
            payment = repo.get_payment_by_capture(capture_id)
        if not payment and order_ref:
            payment = repo.get_payment_by_order(order_ref)

        if payment and payment.status == "captured":
            # Reconcile immediately against active capture
            if event.currency != payment.currency:
                refund_doc = Refund(
                    id=f"ref_{uuid.uuid4().hex[:16]}",
                    merchant_id=auth_merchant_id,
                    payment_id=payment.id,
                    order_id=order_ref or payment.order_id,
                    amount=dec_refund,
                    currency=event.currency,
                    status="RECONCILIATION_ERROR",
                    error_reason="CURRENCY_MISMATCH",
                    paypal_refund_id=refund_id,
                    created_at=now,
                )
                db.add(refund_doc)
            elif payment.refunded_amount + dec_refund > payment.amount:
                refund_doc = Refund(
                    id=f"ref_{uuid.uuid4().hex[:16]}",
                    merchant_id=auth_merchant_id,
                    payment_id=payment.id,
                    order_id=order_ref or payment.order_id,
                    amount=dec_refund,
                    currency=event.currency,
                    status="RECONCILIATION_ERROR",
                    error_reason=f"Refund {dec_refund} exceeds remaining balance {payment.amount - payment.refunded_amount}",
                    paypal_refund_id=refund_id,
                    created_at=now,
                )
                db.add(refund_doc)
            else:
                payment.refunded_amount += dec_refund
                refund_doc = Refund(
                    id=f"ref_{uuid.uuid4().hex[:16]}",
                    merchant_id=auth_merchant_id,
                    payment_id=payment.id,
                    order_id=order_ref or payment.order_id,
                    amount=dec_refund,
                    currency=event.currency,
                    status="RECONCILED",
                    reconciled_at=datetime.datetime.now(datetime.UTC),
                    paypal_refund_id=refund_id,
                    created_at=now,
                )
                db.add(refund_doc)
        else:
            # Capture record not yet arrived: park as PENDING_CAPTURE_LINK
            refund_doc = Refund(
                id=f"ref_{uuid.uuid4().hex[:16]}",
                merchant_id=auth_merchant_id,
                payment_id="PENDING_CAPTURE_LINK",
                order_id=order_ref,
                amount=dec_refund,
                currency=event.currency,
                status="PENDING_CAPTURE_LINK",
                paypal_refund_id=refund_id,
                created_at=now,
            )
            db.add(refund_doc)

    # 5. Record immutable payment event log
    payload_data = event.model_dump() if hasattr(event, "model_dump") else event.dict()
    summary = event.summary or f"Relayed event {event.event_type} for order {event.order_reference or 'n/a'}"
    resource_type = event.resource_type or (
        "paypal" if event.paypal_references and (event.paypal_references.order_id or event.paypal_references.capture_id) else "payment"
    )

    created_event = repo.record_payment_event(
        event_id=event.event_id,
        event_type=event.event_type,
        order_reference=event.order_reference,
        summary=summary,
        resource_type=resource_type,
        payload=payload_data,
        status=event.status,
    )

    return {
        "status": "success",
        "data": {
            "event_id": created_event.event_id,
            "merchant_id": created_event.merchant_id,
            "event_type": created_event.event_type,
            "status": "processed",
            "message": "Event recorded and financial ledger projection updated successfully",
        },
    }

"""Transactions and Events relay API route.

Receives, validates, and records normalized transaction and payment events
from authenticated merchant sources (e.g., ShopPoint store relay).
Guarantees multi-tenant isolation, idempotent deduplication by (merchant_id, event_id),
and strict fail-closed order scoping.
"""

import datetime
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.api_keys import get_api_key_merchant
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import get_db

router = APIRouter(prefix="/v1/transactions", tags=["events"])


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
    paypal_references: Optional[PayPalReferences] = Field(None, description="PayPal transaction identifiers")
    status: str = Field("completed", description="Event status")
    occurred_at: Optional[datetime.datetime] = Field(None, description="Event occurrence timestamp")
    merchant_id: Optional[str] = Field(None, description="Optional merchant ID; if present, must match API key")
    summary: Optional[str] = Field(None, description="Human-readable event summary")
    resource_type: Optional[str] = Field(None, description="Resource type (e.g. capture, authorization)")
    raw_payload: Optional[Dict[str, Any]] = Field(None, description="Original raw event payload or details")


@router.post("/events", status_code=status.HTTP_200_OK)
def relay_transaction_event(
    event: NormalizedEventRequest,
    auth_merchant_id: str = Depends(get_api_key_merchant),
    db: Session = Depends(get_db),
):
    """Ingest and record a normalized transaction event with strict multi-tenant scoping.

    1. Authenticated via Bearer API Key; merchant identity is extracted from the key.
    2. If payload contains merchant_id and it differs from auth_merchant_id, reject with 400.
    3. If order_reference is provided, verify it belongs to this merchant; reject with 404 if not.
    4. Deduplicates idempotently by (merchant_id, event_id). Replays return 200 without second write.
    """
    # 1. Enforce merchant consistency
    if event.merchant_id and event.merchant_id.strip() != auth_merchant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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

    # 4. Construct payload for storage
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
            "message": "Event recorded successfully",
        },
    }

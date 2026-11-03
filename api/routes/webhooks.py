"""PayPal webhooks API route.

Receives, verifies, and records incoming PayPal asynchronous webhook notifications.
Guarantees idempotent event deduplication via PaymentEvent storage.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from db.session import get_db
from payments.webhooks import record_payment_event, verify_webhook_signature

router = APIRouter(prefix="/v1/paypal", tags=["webhooks"])


@router.post("/webhooks", status_code=status.HTTP_200_OK)
async def handle_paypal_webhook(
    request: Request,
    db: Session = Depends(get_db),
    paypal_auth_algo: str | None = Header(None, alias="paypal-auth-algo"),
    paypal_cert_url: str | None = Header(None, alias="paypal-cert-url"),
    paypal_transmission_id: str | None = Header(None, alias="paypal-transmission-id"),
    paypal_transmission_sig: str | None = Header(None, alias="paypal-transmission-sig"),
    paypal_transmission_time: str | None = Header(None, alias="paypal-transmission-time"),
):
    """Handle incoming PayPal webhook notification.

    1. Validates cryptographic signature headers.
    2. Records event into payment_events table with strict deduplication by event_id.
    3. Replayed duplicate events return an idempotent 200 response without side effects.
    """
    raw_body = await request.body()
    try:
        event_payload: Dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload in webhook request",
        )

    headers_dict = dict(request.headers)

    # Cryptographic signature check
    is_valid = verify_webhook_signature(
        headers=headers_dict,
        raw_body=raw_body.decode("utf-8", errors="replace"),
        event_payload=event_payload,
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PayPal webhook signature verification failed",
        )

    # Idempotent database record
    try:
        result = record_payment_event(event_payload, db)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )

    return {
        "status": "success",
        "data": result,
    }

"""Payment event processing (legacy adapter).

NOTE (Phase E-3): Direct PayPal webhook signature verification, PayPal REST API calls,
and PayPal client credentials (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID)
have been completely removed from ReturnGuard.
ShopPoint is the sole PayPal API client that verifies cryptographic signatures at the edge.
ReturnGuard ingests normalized events via POST /v1/transactions/events with Bearer API Key authentication.
"""

import json
import logging
import uuid
from typing import Any, Dict, Optional
from urllib.parse import urlparse

from sqlalchemy.orm import Session
from db.models import PaymentEvent

logger = logging.getLogger(__name__)


class WebhookSignatureError(Exception):
    """Raised when PayPal webhook signature verification fails."""

    pass


def is_valid_paypal_cert_url(cert_url: str) -> bool:
    """Validate that the certificate URL strictly belongs to legitimate PayPal domains.

    Retained as a defensive utility function.
    """
    try:
        parsed = urlparse(cert_url)
        if parsed.scheme.lower() != "https":
            return False
        hostname = (parsed.hostname or "").lower()
        return hostname == "paypal.com" or hostname.endswith(".paypal.com")
    except Exception:
        return False


def verify_webhook_signature(
    headers: Dict[str, str],
    raw_body: str,
    event_payload: Dict[str, Any],
    webhook_id: Optional[str] = None,
) -> bool:
    """Deprecated: PayPal signature verification is retired from ReturnGuard.

    ShopPoint verifies PayPal signatures; ReturnGuard only accepts authenticated
    API requests on POST /v1/transactions/events.
    """
    logger.warning("verify_webhook_signature called on retired ReturnGuard route")
    return False


def record_payment_event(
    event_dict: Dict[str, Any],
    db: Session,
    merchant_id: str = "merch_legacy",
) -> Dict[str, Any]:
    """Record a payment event into payment_events with scoped duplicate deduplication.

    Replayed events with identical (merchant_id, event_id) are treated as idempotent no-ops.
    """
    event_id = event_dict.get("id") or event_dict.get("event_id")
    if not event_id:
        raise ValueError("Webhook event payload must contain an 'id' or 'event_id' attribute")

    actual_merchant_id = event_dict.get("merchant_id") or merchant_id

    # Deduplication check scoped to merchant_id
    existing = (
        db.query(PaymentEvent)
        .filter(
            PaymentEvent.merchant_id == actual_merchant_id,
            PaymentEvent.event_id == event_id,
        )
        .first()
    )
    if existing:
        logger.info(f"Duplicate webhook event ignored: {event_id} for merchant {actual_merchant_id}")
        return {
            "status": "duplicate",
            "event_id": event_id,
            "merchant_id": actual_merchant_id,
            "event_type": existing.event_type,
            "message": "Duplicate event ignored idempotently",
        }

    # Store new event
    new_event = PaymentEvent(
        id=str(uuid.uuid4()),
        merchant_id=actual_merchant_id,
        event_id=event_id,
        order_reference=event_dict.get("order_reference"),
        event_type=event_dict.get("event_type", "UNKNOWN"),
        summary=event_dict.get("summary"),
        resource_type=event_dict.get("resource_type"),
        payload_json=json.dumps(event_dict),
        status="processed",
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    logger.info(f"Processed event {event_id} ({new_event.event_type}) for merchant {actual_merchant_id}")
    return {
        "status": "processed",
        "event_id": event_id,
        "merchant_id": actual_merchant_id,
        "event_type": new_event.event_type,
        "message": "Event recorded successfully",
    }

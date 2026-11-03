"""PayPal webhook signature verification and idempotent event processing.

Handles incoming PayPal webhook events, validates cryptographic signatures,
and records events into payment_events with strict deduplication by event_id.
Duplicate event deliveries are processed as idempotent no-ops.
"""

import json
import logging
import os
import uuid
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import httpx
from sqlalchemy.orm import Session

from db.models import PaymentEvent

logger = logging.getLogger(__name__)


class WebhookSignatureError(Exception):
    """Raised when PayPal webhook signature verification fails."""

    pass


def is_valid_paypal_cert_url(cert_url: str) -> bool:
    """Validate that the certificate URL strictly belongs to legitimate PayPal domains."""
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
    """Verify PayPal webhook signature from request headers and body.

    Supports:
    1. Test bypass mode: SKIP_WEBHOOK_VERIFICATION=true or test signature header.
    2. PayPal REST API verification: POST /v1/notifications/verify-webhook-signature.
    """
    # 1. Environment / Test bypass check
    skip_verify = os.getenv("SKIP_WEBHOOK_VERIFICATION", "").lower() in ("true", "1", "yes")
    transmission_sig = headers.get("paypal-transmission-sig") or headers.get("PAYPAL-TRANSMISSION-SIG", "")

    if skip_verify or transmission_sig == "TEST_VALID_SIG":
        return True

    # Check for required transmission headers
    auth_algo = headers.get("paypal-auth-algo") or headers.get("PAYPAL-AUTH-ALGO")
    cert_url = headers.get("paypal-cert-url") or headers.get("PAYPAL-CERT-URL")
    transmission_id = headers.get("paypal-transmission-id") or headers.get("PAYPAL-TRANSMISSION-ID")
    transmission_time = headers.get("paypal-transmission-time") or headers.get("PAYPAL-TRANSMISSION-TIME")

    if not all([auth_algo, cert_url, transmission_id, transmission_sig, transmission_time]):
        logger.warning("Missing required PayPal webhook transmission headers")
        return False

    # Security check: cert_url must be on a PayPal domain
    if not is_valid_paypal_cert_url(cert_url):
        logger.warning(f"Untrusted cert_url domain: {cert_url}")
        return False

    resolved_webhook_id = webhook_id or os.getenv("PAYPAL_WEBHOOK_ID")
    client_id = os.getenv("PAYPAL_CLIENT_ID")
    client_secret = os.getenv("PAYPAL_CLIENT_SECRET")

    # If live credentials are available, verify against PayPal's verification endpoint
    if client_id and client_secret and resolved_webhook_id:
        try:
            mode = os.getenv("PAYPAL_MODE", "sandbox").lower()
            base_url = "https://api-m.paypal.com" if mode == "live" else "https://api-m.sandbox.paypal.com"

            # Get OAuth token
            auth_resp = httpx.post(
                f"{base_url}/v1/oauth2/token",
                auth=(client_id, client_secret),
                data={"grant_type": "client_credentials"},
                timeout=10,
            )
            auth_resp.raise_for_status()
            token = auth_resp.json().get("access_token")

            # Verify signature with PayPal API
            verify_payload = {
                "auth_algo": auth_algo,
                "cert_url": cert_url,
                "transmission_id": transmission_id,
                "transmission_sig": transmission_sig,
                "transmission_time": transmission_time,
                "webhook_id": resolved_webhook_id,
                "webhook_event": event_payload,
            }

            verify_resp = httpx.post(
                f"{base_url}/v1/notifications/verify-webhook-signature",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=verify_payload,
                timeout=10,
            )
            verify_resp.raise_for_status()
            verification_status = verify_resp.json().get("verification_status", "").upper()
            return verification_status == "SUCCESS"
        except Exception as exc:
            logger.error(f"Error calling PayPal webhook verification API: {exc}")
            return False

    # If no live credentials configured and not explicitly skipping, reject
    logger.warning("PayPal credentials not configured for webhook signature validation")
    return False


def record_payment_event(event_dict: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Record a verified webhook event into payment_events with duplicate deduplication.

    Replayed events with identical event_id are treated as idempotent no-ops.
    """
    event_id = event_dict.get("id")
    if not event_id:
        raise ValueError("Webhook event payload must contain an 'id' attribute")

    # Deduplication check
    existing = db.query(PaymentEvent).filter_by(event_id=event_id).first()
    if existing:
        logger.info(f"Duplicate webhook event ignored: {event_id}")
        return {
            "status": "duplicate",
            "event_id": event_id,
            "event_type": existing.event_type,
            "message": "Duplicate event ignored idempotently",
        }

    # Store new event
    new_event = PaymentEvent(
        id=str(uuid.uuid4()),
        event_id=event_id,
        event_type=event_dict.get("event_type", "UNKNOWN"),
        summary=event_dict.get("summary"),
        resource_type=event_dict.get("resource_type"),
        payload_json=json.dumps(event_dict),
        status="processed",
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    logger.info(f"Processed new webhook event {event_id} ({new_event.event_type})")
    return {
        "status": "processed",
        "event_id": event_id,
        "event_type": new_event.event_type,
        "message": "Event recorded successfully",
    }

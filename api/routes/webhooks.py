"""PayPal webhooks route module.

TODO: Implement POST /v1/paypal/webhooks:
Verify signature, record event, and trigger async handling idempotently.
"""

from fastapi import APIRouter

router = APIRouter()

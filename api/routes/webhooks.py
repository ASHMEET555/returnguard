"""PayPal webhooks API route (Retired).

POST /v1/paypal/webhooks has been retired in Phase E-3 per clean architectural boundaries.
ShopPoint is the sole PayPal client; verified events are relayed to
POST /v1/transactions/events with Bearer API Key authentication.
This endpoint responds with HTTP 410 Gone and performs zero state changes.
"""

from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/v1/paypal", tags=["webhooks"])


@router.post("/webhooks", status_code=status.HTTP_410_GONE)
async def handle_paypal_webhook_retired():
    """Retired raw PayPal webhook route.

    Always returns HTTP 410 Gone without database side effects.
    """
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Raw PayPal webhook route has been retired. Relayed events must be submitted to POST /v1/transactions/events with API key authentication.",
    )

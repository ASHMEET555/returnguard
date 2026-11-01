"""Payments route module.

TODO: Implement /v1/payments/* endpoints:
- POST /v1/payments/create (create PayPal order with intent)
- POST /v1/payments/{id}/authorize
- POST /v1/payments/{id}/capture
"""

from fastapi import APIRouter

router = APIRouter()

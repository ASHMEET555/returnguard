"""Disputes route module.

TODO: Implement /v1/disputes/* endpoints:
- GET /v1/disputes (list and filter disputes)
- GET /v1/disputes/{id} (dispute detail)
- POST /v1/disputes/{id}/evidence-pack (generate evidence pack)
- POST /v1/disputes/{id}/approve (human approval record)
- POST /v1/disputes/{id}/submit (sandbox-gated provide-evidence)
"""
from fastapi import APIRouter

router = APIRouter()

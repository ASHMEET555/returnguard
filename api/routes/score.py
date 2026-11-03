"""
Risk scoring endpoint (Phase C7 / Stage 2 Authenticated).

Implements POST /v1/score returning:
- risk_score (0-1 float) and risk_score_100 (0-100 int)
- tier, policy_rule, policy_action
- severity, suggested_action (from services/policy_mapping.py)
- reason_codes (from ShapExplanationService)
- rule_hits (from SpikeRuleEngine)
- ring_id (display only)
- model_version, dataset, threshold
- model_status, feature_completeness, explanation_status
- shadow (defaults to True)

Includes fallback to amount-only decision when model is unavailable (never blocks).
Protected by Bearer API Key authentication (Phase E / Stage 2).
"""

import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.api_keys import get_api_key_merchant
from db.models import AuditScoreEvent
from db.session import get_db
from services.score import ScoringService, get_scoring_service

router = APIRouter(tags=["scoring"])


class ReasonCode(BaseModel):
    feature: str
    direction: str
    shap_rank: int


class ScoreRequest(BaseModel):
    order_id: Optional[str] = Field(None, description="Unique order/transaction ID")
    transaction_id: Optional[str] = Field(None, description="Alias for order ID")
    amount: float = Field(..., gt=0, description="Transaction amount in INR")
    channel: str = Field(default="paypal", description="Payment channel/gateway")
    customer_id: Optional[str] = Field(default="cust_anonymous")
    device_id: Optional[str] = Field(default="dev_default")
    geo_region: Optional[str] = Field(default="IN-KA")
    payment_method: Optional[str] = Field(default="card")
    status: Optional[str] = Field(default="success")
    merchant_id: Optional[str] = Field(default=None, description="Optional merchant ID; if present, must match key")
    merchant_category: Optional[str] = Field(default="retail")
    timestamp: Optional[str] = None
    account_created: Optional[str] = None
    features: Optional[Dict[str, float]] = Field(
        None, description="Optional pre-computed 15 feature vector"
    )
    prior_transactions: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list, description="Customer prior transaction history"
    )
    ring_id: Optional[str] = Field(None, description="Display-only ring cluster ID")
    force_unavailable: Optional[bool] = Field(
        False, description="Simulate model unavailable fallback"
    )


class ScoreResponse(BaseModel):
    order_id: str
    channel: str
    risk_score: float
    risk_score_100: int
    tier: str
    policy_rule: str
    policy_action: str
    severity: str
    suggested_action: str
    reason_codes: List[ReasonCode]
    rule_hits: List[str]
    ring_id: Optional[str] = None
    model_version: str
    dataset: str
    threshold: float
    model_status: str
    feature_completeness: float
    explanation_status: str
    shadow: bool


@router.post(
    "/v1/score",
    response_model=ScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Online risk scoring and policy evaluation",
)
@router.post(
    "/score",
    response_model=ScoreResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def score_transaction(
    payload: ScoreRequest,
    auth_merchant_id: str = Depends(get_api_key_merchant),
    db: Session = Depends(get_db),
    x_simulate_model_unavailable: Optional[str] = Header(None),
) -> ScoreResponse:
    """
    Evaluates fraud risk for an order or transaction.

    Protected by Bearer API Key authentication.
    - Requires valid Authorization: Bearer <key> header.
    - If payload.merchant_id is provided, must match auth_merchant_id (or 400 Bad Request).
    - Writes immutable audit record to audit_score_events with auth_merchant_id.
    - Returns the complete scoring contract defined in 02-architecture.md Section G.
    """
    # Conflicting body merchant_id check
    if payload.merchant_id is not None and payload.merchant_id != auth_merchant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"merchant_id in body ('{payload.merchant_id}') does not match authenticated merchant ('{auth_merchant_id}')",
        )

    service = get_scoring_service()
    force_unavail = (
        payload.force_unavailable
        or (x_simulate_model_unavailable or "").lower() == "true"
    )

    req_dict = payload.model_dump()
    req_dict["merchant_id"] = auth_merchant_id

    result = service.score(req_dict, force_unavailable=force_unavail)

    # Persist audit record carrying authenticated merchant_id
    try:
        audit_event = AuditScoreEvent(
            id=str(uuid.uuid4()),
            decision_id=str(uuid.uuid4()),
            order_id=result["order_id"],
            merchant_id=auth_merchant_id,
            channel=result["channel"],
            risk_score=result["risk_score"],
            tier=result["tier"],
            policy_rule=result["policy_rule"],
            policy_action=result["policy_action"],
            severity=result["severity"],
            suggested_action=result["suggested_action"],
            model_version=result["model_version"],
            threshold=result["threshold"],
            model_status=result["model_status"],
            feature_completeness=result["feature_completeness"],
            explanation_status=result["explanation_status"],
            reason_codes_json=json.dumps(result.get("reason_codes", [])),
            rule_hits_json=json.dumps(result.get("rule_hits", [])),
            ring_id=result.get("ring_id"),
            shadow=1 if result.get("shadow", True) else 0,
        )
        db.add(audit_event)
        db.commit()
    except Exception:
        db.rollback()

    return ScoreResponse(**result)

"""
Risk scoring endpoint (Phase C7).

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
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, Request, status
from pydantic import BaseModel, Field

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
    merchant_id: Optional[str] = Field(default="m_default")
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
    x_simulate_model_unavailable: Optional[str] = Header(None),
) -> ScoreResponse:
    """
    Evaluates fraud risk for an order or transaction.

    Returns the complete scoring contract defined in 02-architecture.md Section G.
    """
    service = get_scoring_service()
    force_unavail = (
        payload.force_unavailable
        or (x_simulate_model_unavailable or "").lower() == "true"
    )

    req_dict = payload.model_dump()
    result = service.score(req_dict, force_unavailable=force_unavail)

    return ScoreResponse(**result)

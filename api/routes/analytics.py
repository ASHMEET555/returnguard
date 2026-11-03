"""Analytics and aggregate metrics endpoint (Phase F)."""

from typing import Dict, Optional

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.embed_tokens import AuthContext, require_read_or_review_auth
from db.models import AuditScoreEvent, Order
from db.session import get_db

router = APIRouter(tags=["analytics"])


class AnalyticsSummaryResponse(BaseModel):
    tenant_id: str
    total_decisions: int
    allow_count: int
    review_count: int
    block_count: int
    average_risk_score: float
    total_volume_inr: float
    high_risk_volume_inr: float
    tier_distribution: Dict[str, int]


@router.get(
    "/v1/analytics/summary",
    response_model=AnalyticsSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated risk analytics summary for tenant",
)
def get_analytics_summary(
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
) -> AnalyticsSummaryResponse:
    """
    Returns aggregate transaction scoring and tier distributions scoped to tenant.
    """
    tenant_id = auth.tenant_id

    events = (
        db.query(AuditScoreEvent)
        .filter(AuditScoreEvent.merchant_id == tenant_id)
        .all()
    )

    total_decisions = len(events)
    allow_count = sum(1 for e in events if e.policy_action == "ALLOW")
    review_count = sum(1 for e in events if e.policy_action in ["REVIEW", "MANUAL_REVIEW"])
    block_count = sum(1 for e in events if e.policy_action == "BLOCK")

    avg_score = 0.0
    if total_decisions > 0:
        avg_score = float(sum(float(e.risk_score) for e in events) / total_decisions)

    tier_distribution: Dict[str, int] = {}
    for e in events:
        t = e.tier or "UNKNOWN"
        tier_distribution[t] = tier_distribution.get(t, 0) + 1

    # Total order volume
    total_vol = (
        db.query(func.coalesce(func.sum(Order.order_value), 0.0))
        .filter(Order.merchant_id == tenant_id)
        .scalar()
    )

    return AnalyticsSummaryResponse(
        tenant_id=tenant_id,
        total_decisions=total_decisions,
        allow_count=allow_count,
        review_count=review_count,
        block_count=block_count,
        average_risk_score=round(avg_score, 4),
        total_volume_inr=float(total_vol or 0.0),
        high_risk_volume_inr=0.0,
        tier_distribution=tier_distribution,
    )

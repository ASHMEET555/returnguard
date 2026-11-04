"""Analytics and aggregate metrics endpoint (Phase F & G)."""

from typing import Dict, List, Optional
import datetime

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.embed_tokens import AuthContext, require_read_or_review_auth
from db.models import AuditScoreEvent, Dispute, Order
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


class DailyTrendItem(BaseModel):
    date: str
    total_scored: int
    flagged: int
    blocked: int


class ScoreDistribution(BaseModel):
    low_0_15: int
    med_15_40: int
    high_40_80: int
    crit_80_100: int


class ChannelBreakdown(BaseModel):
    paypal: int
    cod: int
    other: int


class DisputeAnalytics(BaseModel):
    total_disputes: int
    disputed_amount: float
    currency: str
    dispute_rate_pct: float


class RiskTrendsResponse(BaseModel):
    tenant_id: str
    daily_trends: List[DailyTrendItem]
    score_distribution: ScoreDistribution
    channel_breakdown: ChannelBreakdown
    policy_breakdown: Dict[str, int]
    dispute_analytics: DisputeAnalytics


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
    """Returns aggregate transaction scoring and tier distributions scoped to tenant."""
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


@router.get(
    "/v1/analytics/risk-trends",
    response_model=RiskTrendsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get risk score distribution, daily trends, and channel breakdown",
)
def get_risk_trends(
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
) -> RiskTrendsResponse:
    """Returns time-series trends, score distributions, and dispute rates for tenant."""
    tenant_id = auth.tenant_id

    events = (
        db.query(AuditScoreEvent)
        .filter(AuditScoreEvent.merchant_id == tenant_id)
        .order_by(AuditScoreEvent.created_at.asc())
        .all()
    )

    # Score bands
    low_count = 0
    med_count = 0
    high_count = 0
    crit_count = 0

    # Policy action counts
    policy_counts: Dict[str, int] = {}

    # Channel counts
    paypal_count = 0
    cod_count = 0
    other_channel = 0

    # Daily aggregation
    trends_map: Dict[str, Dict[str, int]] = {}

    for e in events:
        score = float(e.risk_score or 0.0)
        if score < 0.15:
            low_count += 1
        elif score < 0.40:
            med_count += 1
        elif score < 0.80:
            high_count += 1
        else:
            crit_count += 1

        action = e.policy_action or "ALLOW"
        policy_counts[action] = policy_counts.get(action, 0) + 1

        ch = (e.channel or "web").lower()
        if "paypal" in ch:
            paypal_count += 1
        elif "cod" in ch:
            cod_count += 1
        else:
            other_channel += 1

        dt = e.created_at.date().isoformat() if e.created_at else "recent"
        if dt not in trends_map:
            trends_map[dt] = {"total": 0, "flagged": 0, "blocked": 0}
        trends_map[dt]["total"] += 1
        if action in ["REVIEW", "MANUAL_REVIEW", "BLOCK", "STEP_UP_VERIFICATION"]:
            trends_map[dt]["flagged"] += 1
        if action == "BLOCK":
            trends_map[dt]["blocked"] += 1

    daily_trends = [
        DailyTrendItem(
            date=d,
            total_scored=vals["total"],
            flagged=vals["flagged"],
            blocked=vals["blocked"],
        )
        for d, vals in sorted(trends_map.items())
    ]

    # Dispute statistics
    disputes = (
        db.query(Dispute)
        .filter(Dispute.merchant_id == tenant_id)
        .all()
    )
    total_disputes = len(disputes)
    disputed_amount = sum(float(d.amount or 0.0) for d in disputes)
    total_decisions = len(events)
    dispute_rate = (
        (total_disputes / total_decisions * 100) if total_decisions > 0 else 0.0
    )

    return RiskTrendsResponse(
        tenant_id=tenant_id,
        daily_trends=daily_trends,
        score_distribution=ScoreDistribution(
            low_0_15=low_count,
            med_15_40=med_count,
            high_40_80=high_count,
            crit_80_100=crit_count,
        ),
        channel_breakdown=ChannelBreakdown(
            paypal=paypal_count,
            cod=cod_count,
            other=other_channel,
        ),
        policy_breakdown=policy_counts,
        dispute_analytics=DisputeAnalytics(
            total_disputes=total_disputes,
            disputed_amount=round(disputed_amount, 2),
            currency="INR",
            dispute_rate_pct=round(dispute_rate, 2),
        ),
    )

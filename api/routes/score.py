"""
Risk scoring endpoint (Phase C7 / Phase E-2 Multi-Tenant Authenticated).

Implements:
- POST /v1/score: Online risk scoring and policy evaluation (tenant-scoped)
- POST /score: Alias for /v1/score
- GET /v1/decisions/{decision_id}: Retrieve stored risk decision scoped to authenticated merchant

Includes fallback to amount-only decision when model is unavailable (never blocks).
Protected by Bearer API Key authentication and strict merchant tenancy boundaries.
"""

import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.api_keys import get_api_key_merchant
from db.models import AuditScoreEvent
from db.repositories.tenant_scoped import TenantScopedRepository
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
    decision_id: Optional[str] = None


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

    Protected by Bearer API Key authentication and tenant boundary:
    - Requires valid Authorization: Bearer <key> header.
    - If payload.merchant_id is provided, must match auth_merchant_id (or 400 Bad Request).
    - If any entry in prior_transactions carries a foreign merchant_id, rejects with 400 Bad Request.
    - Writes immutable audit record to audit_score_events stamped with auth_merchant_id.
    - Returns the complete scoring contract defined in 02-architecture.md Section G.
    """
    # 1. Conflicting body merchant_id check
    if payload.merchant_id is not None and payload.merchant_id != auth_merchant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"merchant_id in body ('{payload.merchant_id}') does not match authenticated merchant ('{auth_merchant_id}')",
        )

    # 2. Prior transactions cross-tenant validation (Phase E-2 Design: Reject with 400)
    if payload.prior_transactions:
        for idx, p in enumerate(payload.prior_transactions):
            p_mid = p.get("merchant_id")
            if p_mid is not None and str(p_mid).strip() != "" and str(p_mid).strip() != auth_merchant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"prior_transactions[{idx}].merchant_id ('{p_mid}') "
                        f"does not match authenticated merchant ('{auth_merchant_id}')"
                    ),
                )

    service = get_scoring_service()
    force_unavail = (
        payload.force_unavailable
        or (x_simulate_model_unavailable or "").lower() == "true"
    )

    req_dict = payload.model_dump()
    req_dict["merchant_id"] = auth_merchant_id

    # Stamp all prior records with authenticated merchant_id
    if req_dict.get("prior_transactions"):
        for p in req_dict["prior_transactions"]:
            p["merchant_id"] = auth_merchant_id

    result = service.score(req_dict, force_unavailable=force_unavail)

    decision_id = str(uuid.uuid4())
    result["decision_id"] = decision_id

    # Persist audit record carrying authenticated merchant_id via tenant-scoped repository
    try:
        repo = TenantScopedRepository(db, auth_merchant_id)
        audit_event = AuditScoreEvent(
            id=str(uuid.uuid4()),
            decision_id=decision_id,
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
        repo.save_audit_score_event(audit_event)
    except Exception:
        db.rollback()

    return ScoreResponse(**result)


@router.get(
    "/v1/decisions/{decision_id}",
    response_model=ScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a stored risk scoring decision by ID under tenant isolation",
)
def get_decision_by_id(
    decision_id: str,
    auth_merchant_id: str = Depends(get_api_key_merchant),
    db: Session = Depends(get_db),
) -> ScoreResponse:
    """
    Retrieves a stored risk scoring decision by its decision_id.

    Tenant Isolation Invariant:
    - Scoped strictly to the authenticated merchant.
    - If the decision belongs to another merchant or does not exist, returns HTTP 404 (NEVER HTTP 403).
    """
    repo = TenantScopedRepository(db, auth_merchant_id)
    audit_row = repo.get_decision(decision_id)

    if not audit_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision not found",
        )

    reason_codes = []
    if audit_row.reason_codes_json:
        try:
            raw_reasons = json.loads(audit_row.reason_codes_json)
            reason_codes = [ReasonCode(**r) for r in raw_reasons]
        except Exception:
            reason_codes = []

    rule_hits = []
    if audit_row.rule_hits_json:
        try:
            rule_hits = json.loads(audit_row.rule_hits_json)
        except Exception:
            rule_hits = []

    return ScoreResponse(
        order_id=audit_row.order_id,
        channel=audit_row.channel,
        risk_score=float(audit_row.risk_score),
        risk_score_100=int(round(float(audit_row.risk_score) * 100)),
        tier=audit_row.tier,
        policy_rule=audit_row.policy_rule,
        policy_action=audit_row.policy_action,
        severity=audit_row.severity,
        suggested_action=audit_row.suggested_action,
        reason_codes=reason_codes,
        rule_hits=rule_hits,
        ring_id=audit_row.ring_id,
        model_version=audit_row.model_version,
        dataset="synthetic",
        threshold=float(audit_row.threshold),
        model_status=audit_row.model_status,
        feature_completeness=float(audit_row.feature_completeness),
        explanation_status=audit_row.explanation_status,
        shadow=bool(audit_row.shadow),
        decision_id=audit_row.decision_id,
    )



@router.get(
    "/v1/decisions/{decision_id}/audit",
    status_code=status.HTTP_200_OK,
    summary="Reconstruct full audit trail and evidence for a risk decision",
)
def get_decision_audit_reconstruction(
    decision_id: str,
    auth_merchant_id: str = Depends(get_api_key_merchant),
    db: Session = Depends(get_db),
):
    """
    Reconstructs the full audit record, policy trace, SHAP top-K, rule hits,
    feature snapshot, and linked relay events for the authenticated merchant.

    Strictly read-only; writes zero database rows.
    Returns HTTP 404 if the decision is not found or belongs to another merchant.
    """
    repo = TenantScopedRepository(db, auth_merchant_id)
    audit_row = repo.get_decision(decision_id)

    if not audit_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision not found for authenticated merchant",
        )

    raw_reasons = []
    if audit_row.reason_codes_json:
        try:
            raw_reasons = json.loads(audit_row.reason_codes_json)
        except Exception:
            raw_reasons = []

    rule_hits = []
    if audit_row.rule_hits_json:
        try:
            rule_hits = json.loads(audit_row.rule_hits_json)
        except Exception:
            rule_hits = []

    feature_snapshot = {}
    if audit_row.feature_snapshot_json:
        try:
            feature_snapshot = json.loads(audit_row.feature_snapshot_json)
        except Exception:
            feature_snapshot = {}

    relay_events_rows = repo.get_payment_events_for_order(audit_row.order_id)
    relay_events = [
        {
            "event_id": e.event_id,
            "event_type": e.event_type,
            "status": e.status,
            "summary": e.summary,
            "received_at": e.received_at.isoformat() if e.received_at else None,
        }
        for e in relay_events_rows
    ]

    return {
        "status": "success",
        "data": {
            "decision": {
                "decision_id": audit_row.decision_id,
                "order_id": audit_row.order_id,
                "merchant_id": audit_row.merchant_id,
                "channel": audit_row.channel,
                "risk_score": float(audit_row.risk_score),
                "tier": audit_row.tier,
                "model_version": audit_row.model_version,
                "model_status": audit_row.model_status,
                "threshold": float(audit_row.threshold) if audit_row.threshold is not None else 0.40,
                "feature_completeness": float(audit_row.feature_completeness) if audit_row.feature_completeness is not None else 1.0,
                "explanation_status": audit_row.explanation_status,
                "shadow": bool(audit_row.shadow),
                "created_at": audit_row.created_at.isoformat() if audit_row.created_at else None,
            },
            "policy_trace": {
                "policy_rule": audit_row.policy_rule,
                "policy_action": audit_row.policy_action,
                "suggested_action": audit_row.suggested_action,
                "severity": audit_row.severity,
                "tier": audit_row.tier,
                "threshold": float(audit_row.threshold) if audit_row.threshold is not None else 0.40,
                "rule_hits": rule_hits,
            },
            "shap_top_k": raw_reasons,
            "rule_hits": rule_hits,
            "feature_snapshot": feature_snapshot,
            "relay_events": relay_events,
        },
    }

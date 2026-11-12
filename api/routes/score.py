"""
Risk scoring endpoint (Phase C7 / Phase E-2 Multi-Tenant Authenticated).

Implements:
- POST /v1/score: Online risk scoring and policy evaluation (tenant-scoped)
- GET /v1/decisions/{decision_id}: Retrieve stored risk decision scoped to authenticated merchant

Includes fallback to amount-only decision when model is unavailable (never blocks).
Protected by Bearer API Key authentication and strict merchant tenancy boundaries.
"""

import json
import logging
import re
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

logger = logging.getLogger(__name__)
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from auth.api_keys import get_api_key_merchant
from auth.embed_tokens import AuthContext, require_read_or_review_auth
from db.models import AuditScoreEvent
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import get_db
from services.score import ScoringService, get_scoring_service

router = APIRouter(tags=["scoring"])


def _validate_monetary_field(val: Any, field_name: str) -> None:
    """
    Validates a monetary value in accordance with ReturnGuard's exact monetary contract.
    Canonical format: exact decimal strings (e.g. "0.10", "1234.56").
    Temporary compatibility: safe integers (e.g. 100, 0, -50).
    Strictly rejected: non-integer floats (e.g. 0.1, 1.005), unsafe integers (> 2^53-1), NaN, Infinity, booleans.
    """
    if val is None:
        return
    if isinstance(val, bool):
        raise ValueError(f"Invalid monetary value in {field_name}: boolean is not allowed")
    if isinstance(val, float):
        raise ValueError(
            f"Invalid monetary value in {field_name}: non-integer numeric float ({val}) is rejected. "
            f"Monetary amounts must be provided as exact decimal strings (e.g. '0.10') or safe integers."
        )
    if isinstance(val, int):
        if abs(val) > 9007199254740991:
            raise ValueError(
                f"Invalid monetary value in {field_name}: integer ({val}) exceeds IEEE-754 safe integer limit (9007199254740991)"
            )
        return
    if isinstance(val, str):
        s = val.strip()
        if not re.match(r"^[+-]?(?:\d+\.?\d*|\.\d+)$", s):
            raise ValueError(
                f"Invalid monetary value in {field_name}: malformed decimal string '{val}'"
            )
        return
    raise ValueError(
        f"Invalid monetary value in {field_name}: unsupported type {type(val).__name__}. "
        f"Expected decimal string or safe integer."
    )


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
    merchant_id: Optional[str] = Field(
        default=None, description="Optional merchant ID; if present, must match key"
    )
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
    currency: Optional[str] = Field(default=None, description="Transaction currency (USD, INR, EUR, etc.)")
    line_items: Optional[List[Dict[str, Any]]] = Field(default=None, description="Line items for order context")
    order_summary: Optional[Dict[str, Any]] = Field(default=None, description="Structured order summary")

    @field_validator("line_items")
    @classmethod
    def validate_line_items_monetary(
        cls, items: Optional[List[Dict[str, Any]]]
    ) -> Optional[List[Dict[str, Any]]]:
        if not items:
            return items
        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                raise ValueError(f"line_items[{idx}] must be an object")
            if "unit_price" in item and item["unit_price"] is not None:
                _validate_monetary_field(item["unit_price"], f"line_items[{idx}].unit_price")
            if "total_amount" in item and item["total_amount"] is not None:
                _validate_monetary_field(item["total_amount"], f"line_items[{idx}].total_amount")
        return items

    @field_validator("order_summary")
    @classmethod
    def validate_order_summary_monetary(
        cls, summary: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        if not summary or not isinstance(summary, dict):
            return summary
        if "total" in summary and summary["total"] is not None:
            _validate_monetary_field(summary["total"], "order_summary.total")
        items = summary.get("items")
        if isinstance(items, list):
            for idx, item in enumerate(items):
                if isinstance(item, dict):
                    if "unit_price" in item and item["unit_price"] is not None:
                        _validate_monetary_field(
                            item["unit_price"], f"order_summary.items[{idx}].unit_price"
                        )
                    if "total_amount" in item and item["total_amount"] is not None:
                        _validate_monetary_field(
                            item["total_amount"], f"order_summary.items[{idx}].total_amount"
                        )
        return summary



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
def score_transaction(
    payload: ScoreRequest,
    request: Request = None,
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
    # 1. Conflicting body merchant_id check (403 Forbidden on tenant spoofing)
    if payload.merchant_id is not None and payload.merchant_id != auth_merchant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"merchant_id in body ('{payload.merchant_id}') does not match authenticated merchant ('{auth_merchant_id}')",
        )

    # 2. Prior transactions cross-tenant validation (Phase E-2 Design: Reject with 400)
    if payload.prior_transactions:
        for idx, p in enumerate(payload.prior_transactions):
            p_mid = p.get("merchant_id")
            if (
                p_mid is not None
                and str(p_mid).strip() != ""
                and str(p_mid).strip() != auth_merchant_id
            ):
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
        order_sum: Dict[str, Any] = dict(payload.order_summary or {})
        if payload.line_items and "items" not in order_sum:
            order_sum["items"] = payload.line_items
        if payload.currency and "currency" not in order_sum:
            order_sum["currency"] = payload.currency
        order_sum_json = json.dumps(order_sum) if order_sum else None

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
            order_summary_json=order_sum_json,
        )
        repo.save_audit_score_event(audit_event)
    except Exception:
        db.rollback()

    # Step C2 & Step 1: Auto-open investigation on critical decisions
    # Separate transaction: failure must NEVER fail or alter the score response.
    if result.get("severity") == "critical" or result.get("policy_action") == "BLOCK":
        try:
            from db.session import SessionLocal
            from db.models import Investigation

            separate_db = SessionLocal()
            try:
                # Check idempotency: one open investigation per transaction
                order_id_val = result["order_id"]
                existing_inv = (
                    separate_db.query(Investigation)
                    .filter(
                        Investigation.merchant_id == auth_merchant_id,
                        Investigation.transaction_id == order_id_val,
                        Investigation.status == "OPEN",
                    )
                    .first()
                )
                if not existing_inv:
                    new_inv = Investigation(
                        id=f"inv_{uuid.uuid4().hex[:8]}",
                        merchant_id=auth_merchant_id,
                        transaction_id=order_id_val,
                        decision_id=decision_id,
                        status="OPEN",
                        source="AUTO_CRITICAL",
                    )
                    separate_db.add(new_inv)
                    from disputes.step_logger import record_step, STEP_CASE_OPENED

                    record_step(
                        db=separate_db,
                        merchant_id=auth_merchant_id,
                        investigation_id=new_inv.id,
                        step_type=STEP_CASE_OPENED,
                        actor="system",
                        actor_type="system",
                        note=f"Case automatically opened for critical risk decision (action: {result.get('policy_action')}, severity: {result.get('severity')})",
                    )
                    separate_db.commit()
            except Exception as e:
                separate_db.rollback()
                req_id = (
                    request.headers.get("x-request-id", "unknown")
                    if request
                    else "unknown"
                )
                logger.error(f"[{req_id}] Failed to auto-open investigation: {e}")
            finally:
                separate_db.close()
        except Exception as e:
            req_id = (
                request.headers.get("x-request-id", "unknown") if request else "unknown"
            )
            logger.error(
                f"[{req_id}] Failed to acquire session for auto-open investigation: {e}"
            )

    return ScoreResponse(**result)


@router.get(
    "/v1/decisions/{decision_id}",
    response_model=ScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a stored risk scoring decision by ID under tenant isolation",
)
def get_decision_by_id(
    decision_id: str,
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
) -> ScoreResponse:
    """
    Retrieves a stored risk scoring decision by its decision_id.

    Tenant Isolation Invariant:
    - Scoped strictly to the authenticated merchant.
    - If the decision belongs to another merchant or does not exist, returns HTTP 404 (NEVER HTTP 403).
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
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
        decision_id=audit_row.decision_id or audit_row.order_id or audit_row.id,
    )


@router.get(
    "/v1/decisions/{decision_id}/audit",
    status_code=status.HTTP_200_OK,
    summary="Reconstruct full audit trail and evidence for a risk decision",
)
def get_decision_audit_reconstruction(
    decision_id: str,
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
):
    """
    Reconstructs the full audit record, policy trace, SHAP top-K, rule hits,
    feature snapshot, and linked relay events for the authenticated merchant.

    Strictly read-only; writes zero database rows.
    Returns HTTP 404 if the decision is not found or belongs to another merchant.
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
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

    order_summary_data = None
    line_items_data = None
    if audit_row.order_summary_json:
        try:
            order_summary_data = json.loads(audit_row.order_summary_json)
            if isinstance(order_summary_data, dict):
                line_items_data = order_summary_data.get("items")
            elif isinstance(order_summary_data, list):
                line_items_data = order_summary_data
                order_summary_data = {"items": line_items_data}
        except Exception:
            order_summary_data = None
            line_items_data = None

    return {
        "status": "success",
        "data": {
            "decision": {
                "decision_id": audit_row.decision_id
                or audit_row.order_id
                or audit_row.id,
                "order_id": audit_row.order_id,
                "merchant_id": audit_row.merchant_id,
                "channel": audit_row.channel,
                "risk_score": float(audit_row.risk_score),
                "tier": audit_row.tier,
                "model_version": audit_row.model_version,
                "model_status": audit_row.model_status,
                "threshold": (
                    float(audit_row.threshold)
                    if audit_row.threshold is not None
                    else 0.40
                ),
                "feature_completeness": (
                    float(audit_row.feature_completeness)
                    if audit_row.feature_completeness is not None
                    else 1.0
                ),
                "explanation_status": audit_row.explanation_status,
                "shadow": bool(audit_row.shadow),
                "created_at": (
                    audit_row.created_at.isoformat() if audit_row.created_at else None
                ),
            },
            "policy_trace": {
                "policy_rule": audit_row.policy_rule,
                "policy_action": audit_row.policy_action,
                "suggested_action": audit_row.suggested_action,
                "severity": audit_row.severity,
                "tier": audit_row.tier,
                "threshold": (
                    float(audit_row.threshold)
                    if audit_row.threshold is not None
                    else 0.40
                ),
                "rule_hits": rule_hits,
            },
            "shap_top_k": raw_reasons,
            "rule_hits": rule_hits,
            "feature_snapshot": feature_snapshot,
            "relay_events": relay_events,
            "order_summary": order_summary_data,
            "line_items": line_items_data,
        },
    }


class DecisionsListResponse(BaseModel):
    items: List[ScoreResponse]
    next_cursor: Optional[str] = None
    limit: int


@router.get(
    "/v1/decisions",
    response_model=DecisionsListResponse,
    status_code=status.HTTP_200_OK,
    summary="List stored risk decisions with stable cursor pagination",
)
def list_decisions(
    cursor: Optional[str] = None,
    limit: int = 50,
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
) -> DecisionsListResponse:
    """
    List decisions for the authenticated tenant.
    Cursor-based pagination ordered by created_at DESC, id DESC.
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    items, next_cursor = repo.list_decisions(cursor=cursor, limit=limit)

    results = []
    for audit_row in items:
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

        results.append(
            ScoreResponse(
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
                decision_id=audit_row.decision_id or audit_row.order_id or audit_row.id,
            )
        )

    return DecisionsListResponse(
        items=results,
        next_cursor=next_cursor,
        limit=min(max(1, limit), 100),
    )

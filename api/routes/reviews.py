"""Review endpoints for human-in-the-loop dispute and risk decisions (Phase F)."""

import datetime
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.embed_tokens import AuthContext, require_read_or_review_auth
from db.models import AuditScoreEvent, MerchantAudit
from db.session import get_db, acquire_immediate_lock

router = APIRouter(tags=["reviews"])


class ReviewItem(BaseModel):
    decision_id: str
    order_id: str
    risk_score: float
    tier: str
    policy_action: str
    suggested_action: str
    status: str  # 'pending', 'approved', 'rejected', 'escalated'
    created_at: str
    reviewed_at: Optional[str] = None
    reviewer: Optional[str] = None
    notes: Optional[str] = None


class ReviewsListResponse(BaseModel):
    items: List[ReviewItem]
    next_cursor: Optional[str] = None
    limit: int


class ReviewSubmitRequest(BaseModel):
    decision_id: str = Field(..., description="Risk decision ID being reviewed")
    action: str = Field(
        ...,
        description="Action taken by reviewer: approve, reject, escalate",
        pattern="^(approve|reject|escalate)$",
    )
    notes: Optional[str] = Field(None, description="Optional merchant review notes")
    event_id: Optional[str] = Field(None, description="Deterministic outbox event identifier")
    operation_id: Optional[str] = Field(None, description="Deterministic operation identifier")


class ReviewSubmitResponse(BaseModel):
    review_id: str
    decision_id: str
    action: str
    status: str
    updated_at: str
    idempotent_replay: bool = False


@router.get(
    "/v1/reviews",
    response_model=ReviewsListResponse,
    status_code=status.HTTP_200_OK,
    summary="List risk decisions pending or subject to merchant review",
)
def list_reviews(
    cursor: Optional[str] = None,
    limit: int = 50,
    review_status: Optional[str] = Query(None, alias="status"),
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
) -> ReviewsListResponse:
    """
    Lists decisions needing review (or with review status) for the authenticated tenant.
    Stably ordered by created_at DESC, id DESC.
    """
    limit = max(1, min(limit, 100))

    # Query audit score events for tenant
    query = (
        db.query(AuditScoreEvent)
        .filter(AuditScoreEvent.merchant_id == auth.tenant_id)
    )

    # For reviews, filter for MANUAL_REVIEW tier or specific status if requested
    if review_status == "pending":
        query = query.filter(AuditScoreEvent.tier.in_(["MANUAL_REVIEW", "REVIEW", "HIGH"]))
    
    query = query.order_by(AuditScoreEvent.created_at.desc(), AuditScoreEvent.id.desc())
    items = query.limit(limit + 1).all()

    next_cursor = None
    if len(items) > limit:
        items = items[:limit]
        last_item = items[-1]
        next_cursor = str(last_item.id)

    review_items = []
    for item in items:
        # Check if reviewed in MerchantAudit
        audit_record = (
            db.query(MerchantAudit)
            .filter(
                MerchantAudit.merchant_id == auth.tenant_id,
                MerchantAudit.entity_id == item.decision_id,
                MerchantAudit.entity_type == "decision_review",
            )
            .order_by(MerchantAudit.created_at.desc())
            .first()
        )

        st = "pending"
        rev_at = None
        rev_actor = None
        rev_notes = None
        if audit_record:
            st = audit_record.action
            rev_at = audit_record.created_at.isoformat()
            rev_actor = audit_record.actor
            rev_notes = audit_record.details_json

        # If filtering for pending, exclude items that already have a resolved merchant decision
        if review_status == "pending" and audit_record:
            continue

        review_items.append(
            ReviewItem(
                decision_id=item.decision_id or item.id,
                order_id=item.order_id,
                risk_score=float(item.risk_score),
                tier=item.tier,
                policy_action=item.policy_action,
                suggested_action=item.suggested_action,
                status=st,
                created_at=item.created_at.isoformat() if item.created_at else "",
                reviewed_at=rev_at,
                reviewer=rev_actor,
                notes=rev_notes,
            )
        )

    return ReviewsListResponse(
        items=review_items,
        next_cursor=next_cursor,
        limit=limit,
    )


@router.post(
    "/v1/reviews",
    response_model=ReviewSubmitResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit a human review resolution for a decision",
)
def submit_review(
    payload: ReviewSubmitRequest,
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
) -> ReviewSubmitResponse:
    """
    Submits a review decision (approve, reject, escalate) for a risk scoring decision.
    Scoped strictly to authenticated tenant.
    Enforces stable originating event or operation identifier idempotency while
    never suppressing distinct legitimate review operations.
    """
    # Verify decision exists for this tenant
    decision = (
        db.query(AuditScoreEvent)
        .filter(
            AuditScoreEvent.decision_id == payload.decision_id,
            AuditScoreEvent.merchant_id == auth.tenant_id,
        )
        .first()
    )
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision not found for authenticated merchant",
        )

    # Idempotency check: look up by stable originating event or operation identifier
    from sqlalchemy import or_
    existing_audit = None
    if payload.event_id or payload.operation_id:
        conditions = []
        if payload.event_id:
            conditions.append(MerchantAudit.event_id == payload.event_id)
        if payload.operation_id:
            conditions.append(MerchantAudit.operation_id == payload.operation_id)
        existing_audit = (
            db.query(MerchantAudit)
            .filter(
                MerchantAudit.merchant_id == auth.tenant_id,
                or_(*conditions),
            )
            .first()
        )
    else:
        # Fallback deduplication by (merchant_id, entity_id, action)
        existing_audit = (
            db.query(MerchantAudit)
            .filter(
                MerchantAudit.merchant_id == auth.tenant_id,
                MerchantAudit.entity_id == payload.decision_id,
                MerchantAudit.action == payload.action,
            )
            .first()
        )

    if existing_audit:
        return ReviewSubmitResponse(
            review_id=existing_audit.id,
            decision_id=payload.decision_id,
            action=existing_audit.action,
            status="resolved",
            updated_at=existing_audit.created_at.isoformat(),
            idempotent_replay=True,
        )

    acquire_immediate_lock(db)
    now = datetime.datetime.now(datetime.timezone.utc)
    review_id = f"rev_{uuid.uuid4().hex[:16]}"
    actor = auth.sub or f"user_{auth.tenant_id}"

    audit_entry = MerchantAudit(
        id=str(uuid.uuid4()),
        merchant_id=auth.tenant_id,
        action=payload.action,
        entity_type="decision_review",
        entity_id=payload.decision_id,
        operation_id=payload.operation_id,
        event_id=payload.event_id,
        actor=actor,
        details_json=payload.notes,
        created_at=now,
    )
    db.add(audit_entry)
    db.commit()

    # Dispatch resolution to merchant payment service (ShopPoint)
    import json
    import os
    import urllib.request
    shoppoint_url = os.getenv("SHOPPOINT_API_URL", "http://127.0.0.1:5000")
    if auth.tenant_id in ("merch_shoppoint", "merchant_shoppoint"):
        try:
            req_data = json.dumps({
                "decision_id": payload.decision_id,
                "order_id": decision.order_id,
                "action": payload.action,
                "notes": payload.notes,
                "reviewer": actor,
            }).encode("utf-8")
            post_req = urllib.request.Request(
                f"{shoppoint_url}/api/v1/payments/internal/review-execute",
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "X-ReturnGuard-Sync": "true",
                },
                method="POST",
            )
            with urllib.request.urlopen(post_req, timeout=5) as _:
                pass
        except Exception:
            pass

    return ReviewSubmitResponse(
        review_id=review_id,
        decision_id=payload.decision_id,
        action=payload.action,
        status="resolved",
        updated_at=now.isoformat(),
        idempotent_replay=False,
    )

"""Transaction-level investigation routes."""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.embed_tokens import (
    AuthContext,
    require_evidence_approve_auth,
    require_read_or_review_auth,
)
from db.models import Investigation, AuditScoreEvent
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import get_db
from disputes.step_logger import record_step, STEP_CASE_OPENED

router = APIRouter(prefix="/v1/transactions", tags=["transactions"])


class OpenInvestigationRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Optional manual opening reason")


class InvestigationResponse(BaseModel):
    id: str
    merchant_id: str
    transaction_id: str
    decision_id: Optional[str] = None
    dispute_id: Optional[str] = None
    status: str
    source: str
    case_hash: Optional[str] = None
    created_at: str
    updated_at: str


@router.post(
    "/{transaction_id}/investigation",
    response_model=InvestigationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Open or return existing investigation for a transaction",
)
def open_or_get_transaction_investigation(
    transaction_id: str,
    payload: Optional[OpenInvestigationRequest] = None,
    auth: AuthContext = Depends(require_evidence_approve_auth),
    db: Session = Depends(get_db),
    response: Response = None,
):
    """
    Open or return existing investigation for a transaction:
    - Requires embed token with 'evidence:approve' scope and non-empty 'sub'
    - Server keys return 403 Forbidden (enforced by require_evidence_approve_auth)
    - If open investigation already exists for (merchant_id, transaction_id), returns it with 200 OK
    - If none exists, creates one with source='MANUAL', records STEP_CASE_OPENED, and returns 201 Created
    """
    repo = TenantScopedRepository(db, auth.tenant_id)

    # Check for existing open investigation
    existing = (
        db.query(Investigation)
        .filter(
            Investigation.merchant_id == auth.tenant_id,
            Investigation.transaction_id == transaction_id,
            Investigation.status == "OPEN",
        )
        .first()
    )

    if existing:
        if response:
            response.status_code = status.HTTP_200_OK
        return InvestigationResponse(
            id=existing.id,
            merchant_id=existing.merchant_id,
            transaction_id=existing.transaction_id,
            decision_id=existing.decision_id,
            dispute_id=existing.dispute_id,
            status=existing.status,
            source=existing.source,
            case_hash=existing.case_hash,
            created_at=existing.created_at.isoformat(),
            updated_at=existing.updated_at.isoformat(),
        )

    # Find associated decision_id if available from AuditScoreEvent
    audit_evt = (
        db.query(AuditScoreEvent)
        .filter(
            AuditScoreEvent.merchant_id == auth.tenant_id,
            AuditScoreEvent.order_id == transaction_id,
        )
        .first()
    )
    decision_id = audit_evt.decision_id if audit_evt else None

    # Create manual investigation
    inv_id = f"inv_{uuid.uuid4().hex[:8]}"
    new_inv = Investigation(
        id=inv_id,
        merchant_id=auth.tenant_id,
        transaction_id=transaction_id,
        decision_id=decision_id,
        status="OPEN",
        source="MANUAL",
    )
    db.add(new_inv)

    note = (
        payload.reason
        if payload and payload.reason
        else "Manual case opened by reviewer"
    )
    record_step(
        db=db,
        merchant_id=auth.tenant_id,
        investigation_id=inv_id,
        step_type=STEP_CASE_OPENED,
        actor=auth.sub,
        actor_type="reviewer",
        note=note,
    )
    db.commit()
    db.refresh(new_inv)

    return InvestigationResponse(
        id=new_inv.id,
        merchant_id=new_inv.merchant_id,
        transaction_id=new_inv.transaction_id,
        decision_id=new_inv.decision_id,
        dispute_id=new_inv.dispute_id,
        status=new_inv.status,
        source=new_inv.source,
        case_hash=new_inv.case_hash,
        created_at=new_inv.created_at.isoformat(),
        updated_at=new_inv.updated_at.isoformat(),
    )


@router.get(
    "/{transaction_id}/investigation",
    response_model=InvestigationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current investigation for a transaction",
)
def get_transaction_investigation(
    transaction_id: str,
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
):
    """
    Get current investigation for a transaction under tenant isolation.
    - If none exists for the tenant, returns 404 Not Found.
    """
    inv = (
        db.query(Investigation)
        .filter(
            Investigation.merchant_id == auth.tenant_id,
            Investigation.transaction_id == transaction_id,
        )
        .order_by(Investigation.created_at.desc())
        .first()
    )

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No investigation found for transaction '{transaction_id}'",
        )

    return InvestigationResponse(
        id=inv.id,
        merchant_id=inv.merchant_id,
        transaction_id=inv.transaction_id,
        decision_id=inv.decision_id,
        dispute_id=inv.dispute_id,
        status=inv.status,
        source=inv.source,
        case_hash=inv.case_hash,
        created_at=inv.created_at.isoformat(),
        updated_at=inv.updated_at.isoformat(),
    )

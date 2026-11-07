"""Investigation and human approval endpoints for ReturnGuard."""

import datetime
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.api_keys import get_api_key_merchant
from auth.embed_tokens import (
    AuthContext,
    require_evidence_approve_auth,
    require_read_or_review_auth,
)
from db.models import (
    Dispute,
    EvidenceApproval,
    EvidencePack,
    Investigation,
    InvestigationFinding,
    SubmissionResult,
)
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import get_db

router = APIRouter(prefix="/v1/investigations", tags=["investigations"])


class ApproveRequest(BaseModel):
    pack_hash: str
    decision: str = Field(default="APPROVE", description="'APPROVE' or 'REJECT'")
    reason: Optional[str] = None


class RejectRequest(BaseModel):
    reason: str


class SubmissionResultRequest(BaseModel):
    submission_key: str
    pack_hash: str
    status: str
    paypal_reference: Optional[str] = None


@router.post("/{id}/approve", status_code=status.HTTP_200_OK)
def approve_investigation(
    id: str,
    payload: ApproveRequest,
    auth: AuthContext = Depends(require_evidence_approve_auth),
    db: Session = Depends(get_db),
):
    """
    Approve an evidence package.
    Requires human review auth with 'evidence:approve' scope and sub.
    Validates pack_hash against current pack.
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Get latest pack
    latest_pack: Optional[EvidencePack] = (
        db.query(EvidencePack)
        .filter(
            EvidencePack.investigation_id == id,
            EvidencePack.merchant_id == auth.tenant_id,
        )
        .order_by(EvidencePack.version.desc())
        .first()
    )

    if not latest_pack:
        raise HTTPException(
            status_code=400, detail="No evidence package built for investigation"
        )

    if latest_pack.pack_hash != payload.pack_hash:
        raise HTTPException(
            status_code=409,
            detail=f"Pack hash mismatch. Package has been modified (current: {latest_pack.pack_hash}). Review required.",
        )

    approval = EvidenceApproval(
        id=f"apprv_{uuid.uuid4().hex[:8]}",
        merchant_id=auth.tenant_id,
        investigation_id=id,
        pack_hash=payload.pack_hash,
        decision=payload.decision.upper(),
        approver_sub=auth.sub,
        reason=payload.reason,
    )
    db.add(approval)
    inv.status = "APPROVED" if payload.decision.upper() == "APPROVE" else "REJECTED"
    db.commit()

    return {
        "status": "success",
        "investigation_id": id,
        "pack_hash": payload.pack_hash,
        "decision": approval.decision,
        "approver_sub": auth.sub,
    }


@router.post("/{id}/reject", status_code=status.HTTP_200_OK)
def reject_investigation(
    id: str,
    payload: RejectRequest,
    auth: AuthContext = Depends(require_evidence_approve_auth),
    db: Session = Depends(get_db),
):
    """Reject an evidence package with recorded reason."""
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    latest_pack: Optional[EvidencePack] = (
        db.query(EvidencePack)
        .filter(
            EvidencePack.investigation_id == id,
            EvidencePack.merchant_id == auth.tenant_id,
        )
        .order_by(EvidencePack.version.desc())
        .first()
    )

    pack_hash = latest_pack.pack_hash if latest_pack else "none"

    approval = EvidenceApproval(
        id=f"apprv_{uuid.uuid4().hex[:8]}",
        merchant_id=auth.tenant_id,
        investigation_id=id,
        pack_hash=pack_hash,
        decision="REJECT",
        approver_sub=auth.sub,
        reason=payload.reason,
    )
    db.add(approval)
    inv.status = "REJECTED"
    db.commit()

    return {
        "status": "rejected",
        "investigation_id": id,
        "reason": payload.reason,
        "approver_sub": auth.sub,
    }


@router.get("/{id}/submission-package", status_code=status.HTTP_200_OK)
def get_submission_package(
    id: str,
    merchant_id: str = Depends(get_api_key_merchant),
    db: Session = Depends(get_db),
):
    """
    ShopPoint server key endpoint to retrieve the approved package for submission.
    Requires approved current pack hash, else 409 Conflict.
    """
    repo = TenantScopedRepository(db, merchant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    latest_pack: Optional[EvidencePack] = (
        db.query(EvidencePack)
        .filter(
            EvidencePack.investigation_id == id,
            EvidencePack.merchant_id == merchant_id,
        )
        .order_by(EvidencePack.version.desc())
        .first()
    )

    if not latest_pack:
        raise HTTPException(status_code=400, detail="No evidence package built")

    # Check for active approval on latest pack_hash
    active_approval: Optional[EvidenceApproval] = (
        db.query(EvidenceApproval)
        .filter(
            EvidenceApproval.investigation_id == id,
            EvidenceApproval.merchant_id == merchant_id,
            EvidenceApproval.pack_hash == latest_pack.pack_hash,
            EvidenceApproval.decision == "APPROVE",
            EvidenceApproval.revoked_at.is_(None),
        )
        .first()
    )

    if not active_approval:
        raise HTTPException(
            status_code=409,
            detail="Investigation evidence package has not been approved by a human reviewer or has been revoked.",
        )

    dispute: Optional[Dispute] = repo.get_dispute(inv.dispute_id)

    return {
        "investigation_id": id,
        "external_dispute_id": dispute.external_dispute_id if dispute else None,
        "version": latest_pack.version,
        "pack_hash": latest_pack.pack_hash,
        "approved_by": active_approval.approver_sub,
        "approved_at": active_approval.decided_at.isoformat(),
        "package": latest_pack.pack_json,
    }


@router.post("/{id}/submission-result", status_code=status.HTTP_200_OK)
def record_submission_result(
    id: str,
    payload: SubmissionResultRequest,
    merchant_id: str = Depends(get_api_key_merchant),
    db: Session = Depends(get_db),
):
    """
    ShopPoint records submission result back to ReturnGuard.
    Idempotent by submission_key.
    """
    repo = TenantScopedRepository(db, merchant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Idempotent check
    existing: Optional[SubmissionResult] = (
        db.query(SubmissionResult)
        .filter(
            SubmissionResult.merchant_id == merchant_id,
            SubmissionResult.submission_key == payload.submission_key,
        )
        .first()
    )
    if existing:
        return {
            "status": "already_recorded",
            "submission_id": existing.id,
            "submission_key": existing.submission_key,
        }

    sub_res = SubmissionResult(
        id=f"subres_{uuid.uuid4().hex[:8]}",
        merchant_id=merchant_id,
        investigation_id=id,
        submission_key=payload.submission_key,
        pack_hash=payload.pack_hash,
        status=payload.status,
        paypal_reference=payload.paypal_reference,
    )
    db.add(sub_res)
    inv.status = "SUBMITTED" if payload.status.upper() == "SUBMITTED" else inv.status
    db.commit()

    return {
        "status": "recorded",
        "submission_id": sub_res.id,
        "submission_key": sub_res.submission_key,
    }


# Admin read surface endpoints for investigations


@router.get("", status_code=status.HTTP_200_OK)
def list_investigations(
    status: Optional[str] = Query(None, description="Filter by investigation status"),
    cursor: Optional[str] = Query(
        None, description="Pagination cursor (created_at ISO)"
    ),
    limit: int = Query(50, ge=1, le=100),
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
):
    """
    List investigations for the authenticated tenant with cursor pagination and status filter.
    Returns tenant-scoped investigations; cross-tenant query returns empty.
    """
    query = db.query(Investigation).filter(Investigation.merchant_id == auth.tenant_id)

    if status:
        query = query.filter(Investigation.status == status.upper())

    if cursor:
        try:
            cursor_dt = datetime.datetime.fromisoformat(cursor)
            query = query.filter(Investigation.created_at < cursor_dt)
        except Exception:
            pass

    items = query.order_by(Investigation.created_at.desc()).limit(limit + 1).all()

    has_more = len(items) > limit
    results = items[:limit]
    next_cursor = results[-1].created_at.isoformat() if has_more and results else None

    return {
        "items": [
            {
                "id": inv.id,
                "dispute_id": inv.dispute_id,
                "status": inv.status,
                "created_at": inv.created_at.isoformat(),
                "updated_at": inv.updated_at.isoformat(),
                "case_hash": inv.case_hash,
            }
            for inv in results
        ],
        "next_cursor": next_cursor,
        "has_more": has_more,
    }


@router.get("/{id}", status_code=status.HTTP_200_OK)
def get_investigation_detail(
    id: str,
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
):
    """
    Retrieve full investigation detail:
    - Summary
    - Findings
    - Completeness
    - Advisory LLM assessment (prominently labeled advisory)
    - Decision record snapshot
    - Approval status
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    dispute: Optional[Dispute] = repo.get_dispute(inv.dispute_id)
    if not dispute:
        raise HTTPException(status_code=404, detail="Associated dispute not found")

    # Latest pack
    latest_pack: Optional[EvidencePack] = (
        db.query(EvidencePack)
        .filter(
            EvidencePack.investigation_id == id,
            EvidencePack.merchant_id == auth.tenant_id,
        )
        .order_by(EvidencePack.version.desc())
        .first()
    )

    # Active approval
    active_approval: Optional[EvidenceApproval] = (
        db.query(EvidenceApproval)
        .filter(
            EvidenceApproval.investigation_id == id,
            EvidenceApproval.merchant_id == auth.tenant_id,
            EvidenceApproval.revoked_at.is_(None),
        )
        .order_by(EvidenceApproval.decided_at.desc())
        .first()
    )

    pack_data = latest_pack.pack_json if latest_pack else {}

    return {
        "id": inv.id,
        "dispute_id": inv.dispute_id,
        "status": inv.status,
        "created_at": inv.created_at.isoformat(),
        "updated_at": inv.updated_at.isoformat(),
        "case_hash": inv.case_hash,
        "external_dispute_id": dispute.external_dispute_id,
        "reason_code": dispute.reason_code,
        "amount": float(dispute.amount),
        "currency": dispute.currency,
        "findings": pack_data.get("deterministic_findings", []),
        "advisory_assessment": {
            "disclaimer": "This assessment is generated for advisory and investigative review only. It does not alter risk probability, soft policy tier, or model scoring.",
            "narrative": pack_data.get("investigation_narrative"),
        },
        "decision_record": pack_data.get("target_transaction", {}).get(
            "decision_record"
        ),
        "approval": {
            "is_approved": (
                active_approval.decision == "APPROVE" if active_approval else False
            ),
            "decision": active_approval.decision if active_approval else "PENDING",
            "approver_sub": active_approval.approver_sub if active_approval else None,
            "decided_at": (
                active_approval.decided_at.isoformat() if active_approval else None
            ),
            "pack_hash": active_approval.pack_hash if active_approval else None,
        },
    }


@router.get("/{id}/pack", status_code=status.HTTP_200_OK)
def get_investigation_pack(
    id: str,
    format: str = Query("json", pattern="^(json|md)$"),
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
):
    """Return raw evidence pack in canonical json or markdown format."""
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    latest_pack: Optional[EvidencePack] = (
        db.query(EvidencePack)
        .filter(
            EvidencePack.investigation_id == id,
            EvidencePack.merchant_id == auth.tenant_id,
        )
        .order_by(EvidencePack.version.desc())
        .first()
    )
    if not latest_pack:
        raise HTTPException(status_code=404, detail="Evidence pack not yet generated")

    if format == "md":
        from fastapi.responses import PlainTextResponse

        return PlainTextResponse(
            content=latest_pack.pack_md, media_type="text/markdown"
        )

    return latest_pack.pack_json

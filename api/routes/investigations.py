"""Investigation and human approval endpoints for ReturnGuard."""

import datetime
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.api_keys import get_api_key_merchant
from auth.embed_tokens import AuthContext, require_evidence_approve_auth
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

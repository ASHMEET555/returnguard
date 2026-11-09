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
    LLMRun,
    Dispute,
    EvidenceApproval,
    EvidencePack,
    Investigation,
    InvestigationFinding,
    SubmissionResult,
)
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import get_db
from disputes.completeness import check_completeness
from disputes.step_logger import (
    STEP_CASE_CLOSED,
    STEP_CASE_OPENED,
    STEP_CASE_REOPENED,
    STEP_CASE_VIEWED,
    STEP_DOCUMENTS_REQUESTED,
    STEP_NOTE_ADDED,
    STEP_PACK_APPROVED,
    STEP_PACK_REJECTED,
    STEP_STATUS_CHANGED,
    record_step,
)
from disputes.state_machine import (
    ALL_STATES,
    ALLOWED_TRANSITIONS,
    CLOSED_STATES,
    STATE_AWAITING_REVIEW,
    STATE_CLOSED_APPROVED,
    STATE_CLOSED_NO_ACTION,
    STATE_CLOSED_REJECTED,
    STATE_IN_REVIEW,
    STATE_OPEN,
    STATE_REOPENED,
    InvalidCloseError,
    InvalidReopenError,
    InvalidStateTransitionError,
    validate_close_requirements,
    validate_reopen_requirements,
    validate_transition,
)

router = APIRouter(prefix="/v1/investigations", tags=["investigations"])


class ApproveRequest(BaseModel):
    pack_hash: str
    decision: str = Field(default="APPROVE", description="'APPROVE' or 'REJECT'")
    reason: Optional[str] = None


class RejectRequest(BaseModel):
    reason: str


class TransitionStatusRequest(BaseModel):
    target_status: str


class CloseInvestigationRequest(BaseModel):
    outcome: str = Field(
        ..., description="CLOSED_APPROVED, CLOSED_REJECTED, or CLOSED_NO_ACTION"
    )
    note: str = Field(..., description="Closing note, minimum 20 characters")
    steps_performed: List[str] = Field(
        default_factory=list, description="List of recorded steps performed"
    )


class AddNoteRequest(BaseModel):
    note: str = Field(..., min_length=1, description="Reviewer note content")


class ReopenInvestigationRequest(BaseModel):
    reason: str = Field(..., description="Reason for reopening the closed case")


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
    step_type_to_record = (
        STEP_PACK_APPROVED
        if payload.decision.upper() == "APPROVE"
        else STEP_PACK_REJECTED
    )
    record_step(
        db=db,
        merchant_id=auth.tenant_id,
        investigation_id=id,
        step_type=step_type_to_record,
        actor=auth.sub,
        actor_type="reviewer",
        note=payload.reason or f"Evidence pack {step_type_to_record.lower()}",
        pack_hash=payload.pack_hash,
    )
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
    record_step(
        db=db,
        merchant_id=auth.tenant_id,
        investigation_id=id,
        step_type=STEP_PACK_REJECTED,
        actor=auth.sub,
        actor_type="reviewer",
        note=payload.reason,
        pack_hash=pack_hash,
    )
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

    dispute: Optional[Dispute] = (
        repo.get_dispute(inv.dispute_id) if inv.dispute_id else None
    )

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
        "transaction_id": inv.transaction_id,
        "decision_id": inv.decision_id,
        "status": inv.status,
        "created_at": inv.created_at.isoformat(),
        "updated_at": inv.updated_at.isoformat(),
        "case_hash": inv.case_hash,
        "external_dispute_id": dispute.external_dispute_id if dispute else None,
        "reason_code": (
            dispute.reason_code if dispute else "CRITICAL_TRANSACTION_REVIEW"
        ),
        "amount": float(dispute.amount) if dispute else 0.0,
        "currency": dispute.currency if dispute else "USD",
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


@router.post("/{id}/transition", status_code=status.HTTP_200_OK)
def transition_investigation_status(
    id: str,
    payload: TransitionStatusRequest,
    auth: AuthContext = Depends(require_evidence_approve_auth),
    db: Session = Depends(get_db),
):
    """
    Transition investigation status according to reviewer state machine.
    Disallowed transition raises 409 Conflict.
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    target = payload.target_status.upper()
    try:
        validate_transition(inv.status, target)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))

    previous = inv.status
    inv.status = target
    record_step(
        db=db,
        merchant_id=auth.tenant_id,
        investigation_id=id,
        step_type=STEP_STATUS_CHANGED,
        actor=auth.sub,
        actor_type="reviewer",
        note=f"Status transitioned from {previous} to {target}",
    )
    db.commit()

    return {
        "status": "success",
        "investigation_id": id,
        "previous_status": inv.status,
        "current_status": target,
    }


@router.post("/{id}/close", status_code=status.HTTP_200_OK)
def close_investigation(
    id: str,
    payload: CloseInvestigationRequest,
    auth: AuthContext = Depends(require_evidence_approve_auth),
    db: Session = Depends(get_db),
):
    """
    Close an investigation.
    Requires:
    - Outcome is CLOSED_APPROVED, CLOSED_REJECTED, or CLOSED_NO_ACTION.
    - Note of at least 20 characters.
    - At least one recorded step in steps_performed (or step log).
    - If outcome is CLOSED_APPROVED, requires a current, matching evidence approval.
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    outcome = payload.outcome.upper()

    # Check state transition from current status
    try:
        validate_transition(inv.status, outcome)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))

    # Check for active approval if closing as approved
    active_approval = (
        db.query(EvidenceApproval)
        .filter(
            EvidenceApproval.investigation_id == id,
            EvidenceApproval.merchant_id == auth.tenant_id,
            EvidenceApproval.decision == "APPROVE",
            EvidenceApproval.revoked_at.is_(None),
        )
        .order_by(EvidenceApproval.decided_at.desc())
        .first()
    )
    has_approval = active_approval is not None

    has_steps = len(payload.steps_performed) > 0
    try:
        validate_close_requirements(
            outcome=outcome,
            note=payload.note,
            has_recorded_steps=has_steps,
            has_active_approval=has_approval,
        )
    except InvalidCloseError as e:
        # Note length or missing steps validation error -> 422 Unprocessable Entity
        msg = str(e)
        if "at least 20 characters" in msg or "at least one recorded step" in msg:
            raise HTTPException(status_code=422, detail=msg)
        # Approval missing or disallowed outcome -> 409 Conflict
        raise HTTPException(status_code=409, detail=msg)

    inv.status = outcome
    record_step(
        db=db,
        merchant_id=auth.tenant_id,
        investigation_id=id,
        step_type=STEP_CASE_CLOSED,
        actor=auth.sub,
        actor_type="reviewer",
        note=f"Outcome: {outcome}. {payload.note}",
    )
    db.commit()

    return {
        "status": "success",
        "investigation_id": id,
        "outcome": outcome,
        "note": payload.note,
        "closed_by": auth.sub,
    }


@router.post("/{id}/reopen", status_code=status.HTTP_200_OK)
def reopen_investigation(
    id: str,
    payload: ReopenInvestigationRequest,
    auth: AuthContext = Depends(require_evidence_approve_auth),
    db: Session = Depends(get_db),
):
    """
    Reopen a closed investigation.
    Requires:
    - Current status must be one of CLOSED_*
    - Non-empty reason string
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    try:
        validate_transition(inv.status, STATE_REOPENED)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))

    try:
        validate_reopen_requirements(payload.reason)
    except InvalidReopenError as e:
        raise HTTPException(status_code=422, detail=str(e))

    inv.status = STATE_REOPENED
    record_step(
        db=db,
        merchant_id=auth.tenant_id,
        investigation_id=id,
        step_type=STEP_CASE_REOPENED,
        actor=auth.sub,
        actor_type="reviewer",
        note=payload.reason,
    )
    db.commit()

    return {
        "status": "success",
        "investigation_id": id,
        "current_status": STATE_REOPENED,
        "reason": payload.reason,
        "reopened_by": auth.sub,
    }


@router.post("/{id}/start-review", status_code=status.HTTP_200_OK)
def start_review(
    id: str,
    auth: AuthContext = Depends(require_evidence_approve_auth),
    db: Session = Depends(get_db),
):
    """
    Reviewer starts investigation review: transitions OPEN to IN_REVIEW.
    Requires embed token with evidence:approve scope.
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    try:
        validate_transition(inv.status, STATE_IN_REVIEW)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))

    previous = inv.status
    inv.status = STATE_IN_REVIEW
    record_step(
        db=db,
        merchant_id=auth.tenant_id,
        investigation_id=id,
        step_type=STEP_STATUS_CHANGED,
        actor=auth.sub,
        actor_type="reviewer",
        note=f"Reviewer {auth.sub} started review (transitioned from {previous} to IN_REVIEW)",
    )
    db.commit()

    return {
        "status": "success",
        "investigation_id": id,
        "previous_status": previous,
        "current_status": STATE_IN_REVIEW,
        "reviewer": auth.sub,
    }


@router.post("/{id}/notes", status_code=status.HTTP_200_OK)
def add_note(
    id: str,
    payload: AddNoteRequest,
    auth: AuthContext = Depends(require_evidence_approve_auth),
    db: Session = Depends(get_db),
):
    """
    Reviewer adds a note to the investigation: records a NOTE_ADDED step.
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    step = record_step(
        db=db,
        merchant_id=auth.tenant_id,
        investigation_id=id,
        step_type=STEP_NOTE_ADDED,
        actor=auth.sub,
        actor_type="reviewer",
        note=payload.note,
    )
    db.commit()

    return {
        "status": "success",
        "investigation_id": id,
        "step_id": step.id,
        "note": payload.note,
        "actor": auth.sub,
    }


@router.post("/{id}/request-documents", status_code=status.HTTP_200_OK)
def request_documents(
    id: str,
    auth: AuthContext = Depends(require_evidence_approve_auth),
    db: Session = Depends(get_db),
):
    """
    Records DOCUMENTS_REQUESTED with the missing evidence types from the completeness check.
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Evaluate completeness
    missing_kinds: List[str] = []
    if inv.dispute_id:
        dispute = repo.get_dispute(inv.dispute_id)
        if dispute:
            from db.models import DisputeDocument

            docs = (
                db.query(DisputeDocument)
                .filter(
                    DisputeDocument.dispute_id == dispute.id,
                    DisputeDocument.merchant_id == auth.tenant_id,
                )
                .all()
            )
            present_types = [d.evidence_type for d in docs]
            comp = check_completeness(dispute.reason_code, present_types)
            missing_kinds = comp.get("missing_kinds", [])

    step_note = (
        f"Missing evidence types requested: {', '.join(missing_kinds)}"
        if missing_kinds
        else "Evidence types requested"
    )

    step = record_step(
        db=db,
        merchant_id=auth.tenant_id,
        investigation_id=id,
        step_type=STEP_DOCUMENTS_REQUESTED,
        actor=auth.sub,
        actor_type="reviewer",
        note=step_note,
    )
    db.commit()

    return {
        "status": "success",
        "investigation_id": id,
        "step_id": step.id,
        "missing_evidence_types": missing_kinds,
    }


@router.get("/{id}/timeline", status_code=status.HTTP_200_OK)
def get_investigation_timeline(
    id: str,
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
):
    """
    Returns ordered steps with actor and time for an investigation.
    Requires embed token with evidence:approve scope. Server keys return 403.
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    from db.models import InvestigationStep

    steps = (
        db.query(InvestigationStep)
        .filter(
            InvestigationStep.investigation_id == id,
            InvestigationStep.merchant_id == auth.tenant_id,
        )
        .order_by(InvestigationStep.created_at.asc(), InvestigationStep.id.asc())
        .all()
    )

    return {
        "investigation_id": id,
        "total_steps": len(steps),
        "steps": [
            {
                "id": s.id,
                "step_type": s.step_type,
                "actor": s.actor,
                "actor_type": s.actor_type,
                "note": s.note,
                "pack_hash": s.pack_hash,
                "created_at": s.created_at.isoformat(),
            }
            for s in steps
        ],
    }


@router.get("/{id}/assessment", status_code=status.HTTP_200_OK)
def get_investigation_assessment(
    id: str,
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
):
    """
    Returns LLM assessment visibility view:
    - Model identifier
    - Prompt hash
    - Attempt count
    - Each attempt's validator errors
    - Final status (VALIDATED or TEMPLATE_FALLBACK)
    - Final text
    - Findings it cites
    Always labelled advisory. Never returns private alias mapping or real IDs.
    """
    repo = TenantScopedRepository(db, auth.tenant_id)
    inv = repo.get_investigation(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Fetch latest LLMRun
    llm_run: Optional[LLMRun] = (
        db.query(LLMRun)
        .filter(
            LLMRun.investigation_id == id,
            LLMRun.merchant_id == auth.tenant_id,
        )
        .order_by(LLMRun.created_at.desc())
        .first()
    )

    # Fetch latest EvidencePack for findings & final text
    latest_pack: Optional[EvidencePack] = (
        db.query(EvidencePack)
        .filter(
            EvidencePack.investigation_id == id,
            EvidencePack.merchant_id == auth.tenant_id,
        )
        .order_by(EvidencePack.version.desc())
        .first()
    )

    pack_json = latest_pack.pack_json if latest_pack else {}
    findings_cited = pack_json.get("deterministic_findings", [])
    narrative_obj = pack_json.get("investigation_narrative", {})

    # Determine final status and attempt count
    raw_status = llm_run.final_status if llm_run else "TEMPLATE_FALLBACK"
    if "FALLBACK" in raw_status:
        final_status = "TEMPLATE_FALLBACK"
    else:
        final_status = "VALIDATED"

    # Attempt count and error extraction
    attempt_count = 1
    attempt_errors: List[Dict[str, Any]] = []
    if llm_run and llm_run.validation_result:
        vr = llm_run.validation_result
        if "attempt_1_errors" in vr or "attempt_2_errors" in vr:
            attempt_count = 2
            attempt_errors.append(
                {"attempt": 1, "errors": vr.get("attempt_1_errors", [])}
            )
            attempt_errors.append(
                {"attempt": 2, "errors": vr.get("attempt_2_errors", [])}
            )
        elif "errors" in vr:
            errs = vr.get("errors", [])
            attempt_errors.append({"attempt": 1, "errors": errs})
            if raw_status == "SUCCESS_AFTER_RETRY":
                attempt_count = 2

    # Narrative text summary
    if isinstance(narrative_obj, dict):
        final_text = narrative_obj.get("summary", "")
        steps = narrative_obj.get("steps", [])
        if steps:
            final_text += " " + " ".join(
                s.get("description", "") for s in steps if isinstance(s, dict)
            )
    elif isinstance(narrative_obj, str):
        final_text = narrative_obj
    else:
        final_text = ""

    return {
        "investigation_id": id,
        "advisory_label": "LLM assessment, advisory",
        "disclaimer": "This assessment is generated for advisory and investigative review only. It does not alter risk probability, soft policy tier, or model scoring.",
        "model_identifier": llm_run.model if llm_run else "deterministic_rules_v1",
        "provider": llm_run.provider if llm_run else "template_fallback",
        "prompt_hash": llm_run.prompt_hash if llm_run else "none",
        "attempt_count": attempt_count,
        "attempts": attempt_errors,
        "final_status": final_status,
        "final_text": final_text,
        "findings_cited": findings_cited,
    }

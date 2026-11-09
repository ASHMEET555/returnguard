"""
Append-only step logger utility for ReturnGuard investigations (Step C3).

Step Types:
  CASE_OPENED, CASE_VIEWED, ASSESSMENT_RUN, ASSESSMENT_FALLBACK,
  EVIDENCE_CHECKED, DOCUMENTS_REQUESTED, PACK_BUILT, PACK_APPROVED,
  PACK_REJECTED, PACK_REVOKED, NOTE_ADDED, STATUS_CHANGED,
  CASE_CLOSED, CASE_REOPENED.
"""

import uuid
from typing import Optional
from sqlalchemy.orm import Session

from db.models import InvestigationStep

# Valid step types
STEP_CASE_OPENED = "CASE_OPENED"
STEP_CASE_VIEWED = "CASE_VIEWED"
STEP_ASSESSMENT_RUN = "ASSESSMENT_RUN"
STEP_ASSESSMENT_FALLBACK = "ASSESSMENT_FALLBACK"
STEP_EVIDENCE_CHECKED = "EVIDENCE_CHECKED"
STEP_DOCUMENTS_REQUESTED = "DOCUMENTS_REQUESTED"
STEP_PACK_BUILT = "PACK_BUILT"
STEP_PACK_APPROVED = "PACK_APPROVED"
STEP_PACK_REJECTED = "PACK_REJECTED"
STEP_PACK_REVOKED = "PACK_REVOKED"
STEP_NOTE_ADDED = "NOTE_ADDED"
STEP_STATUS_CHANGED = "STATUS_CHANGED"
STEP_CASE_CLOSED = "CASE_CLOSED"
STEP_CASE_REOPENED = "CASE_REOPENED"

VALID_STEP_TYPES = {
    STEP_CASE_OPENED,
    STEP_CASE_VIEWED,
    STEP_ASSESSMENT_RUN,
    STEP_ASSESSMENT_FALLBACK,
    STEP_EVIDENCE_CHECKED,
    STEP_DOCUMENTS_REQUESTED,
    STEP_PACK_BUILT,
    STEP_PACK_APPROVED,
    STEP_PACK_REJECTED,
    STEP_PACK_REVOKED,
    STEP_NOTE_ADDED,
    STEP_STATUS_CHANGED,
    STEP_CASE_CLOSED,
    STEP_CASE_REOPENED,
}


def record_step(
    db: Session,
    merchant_id: str,
    investigation_id: str,
    step_type: str,
    actor: str = "system",
    actor_type: str = "system",
    note: Optional[str] = None,
    pack_hash: Optional[str] = None,
) -> InvestigationStep:
    """
    Append an immutable step to the investigation step log.
    Executes in the caller's transaction.
    """
    if step_type not in VALID_STEP_TYPES:
        raise ValueError(f"Invalid step_type: {step_type}")

    step = InvestigationStep(
        id=f"step_{uuid.uuid4().hex[:8]}",
        merchant_id=merchant_id,
        investigation_id=investigation_id,
        step_type=step_type,
        actor=actor,
        actor_type=actor_type,
        note=note,
        pack_hash=pack_hash,
    )
    db.add(step)
    return step

"""
Reviewer Investigation State Machine (Step C1).

States:
  - OPEN: Case created, awaiting action
  - AWAITING_REVIEW: Intake complete, queued for human reviewer
  - IN_REVIEW: Reviewer actively inspecting case
  - CLOSED_APPROVED: Case closed with approved evidence pack
  - CLOSED_REJECTED: Case closed as rejected
  - CLOSED_NO_ACTION: Case closed without action
  - REOPENED: Previously closed case reopened by reviewer

Transitions are strictly defined. Any disallowed transition raises InvalidStateTransitionError (HTTP 409).
"""

from typing import Dict, Set

# Valid states enum strings
STATE_OPEN = "OPEN"
STATE_AWAITING_REVIEW = "AWAITING_REVIEW"
STATE_IN_REVIEW = "IN_REVIEW"
STATE_CLOSED_APPROVED = "CLOSED_APPROVED"
STATE_CLOSED_REJECTED = "CLOSED_REJECTED"
STATE_CLOSED_NO_ACTION = "CLOSED_NO_ACTION"
STATE_REOPENED = "REOPENED"

ALL_STATES = {
    STATE_OPEN,
    STATE_AWAITING_REVIEW,
    STATE_IN_REVIEW,
    STATE_CLOSED_APPROVED,
    STATE_CLOSED_REJECTED,
    STATE_CLOSED_NO_ACTION,
    STATE_REOPENED,
}

CLOSED_STATES = {
    STATE_CLOSED_APPROVED,
    STATE_CLOSED_REJECTED,
    STATE_CLOSED_NO_ACTION,
}

# Fixed allowed transition table
# Any transition not in this map is forbidden (HTTP 409)
ALLOWED_TRANSITIONS: Dict[str, Set[str]] = {
    STATE_OPEN: {STATE_AWAITING_REVIEW, STATE_IN_REVIEW, STATE_CLOSED_NO_ACTION},
    STATE_AWAITING_REVIEW: {STATE_IN_REVIEW, STATE_CLOSED_NO_ACTION},
    STATE_IN_REVIEW: {
        STATE_CLOSED_APPROVED,
        STATE_CLOSED_REJECTED,
        STATE_CLOSED_NO_ACTION,
        STATE_AWAITING_REVIEW,
    },
    STATE_CLOSED_APPROVED: {STATE_REOPENED},
    STATE_CLOSED_REJECTED: {STATE_REOPENED},
    STATE_CLOSED_NO_ACTION: {STATE_REOPENED},
    STATE_REOPENED: {STATE_IN_REVIEW, STATE_AWAITING_REVIEW, STATE_CLOSED_NO_ACTION},
}


class InvalidStateTransitionError(Exception):
    """Raised when an illegal state transition is attempted."""

    def __init__(self, current_status: str, target_status: str):
        super().__init__(
            f"Cannot transition investigation from '{current_status}' to '{target_status}'. Allowed transitions: {sorted(ALLOWED_TRANSITIONS.get(current_status, set()))}"
        )
        self.current_status = current_status
        self.target_status = target_status


class InvalidCloseError(Exception):
    """Raised when closing criteria (note length, steps, approval) are not met."""

    pass


class InvalidReopenError(Exception):
    """Raised when reopening criteria (reason) are not met."""

    pass


def validate_transition(current_status: str, target_status: str) -> None:
    """Validate that transition from current_status to target_status is permitted."""
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if target_status not in allowed:
        raise InvalidStateTransitionError(current_status, target_status)


def validate_close_requirements(
    outcome: str,
    note: str,
    has_recorded_steps: bool,
    has_active_approval: bool = False,
) -> None:
    """
    Validate conditions for closing an investigation:
    1. Outcome must be one of the closed states.
    2. Note must be at least 20 characters.
    3. Must have at least one recorded step.
    4. If outcome is CLOSED_APPROVED, requires a current, matching evidence approval.
    """
    if outcome not in CLOSED_STATES:
        raise InvalidCloseError(
            f"Invalid close outcome '{outcome}'. Must be one of: {sorted(CLOSED_STATES)}"
        )

    if not note or len(note.strip()) < 20:
        raise InvalidCloseError(
            "Closing note must be at least 20 characters in length."
        )

    if not has_recorded_steps:
        raise InvalidCloseError(
            "Cannot close investigation without at least one recorded step."
        )

    if outcome == STATE_CLOSED_APPROVED and not has_active_approval:
        raise InvalidCloseError(
            "Closing as CLOSED_APPROVED requires a valid, matching evidence approval."
        )


def validate_reopen_requirements(reason: str) -> None:
    """Validate conditions for reopening an investigation."""
    if not reason or len(reason.strip()) == 0:
        raise InvalidReopenError(
            "Reopening an investigation requires a non-empty reason."
        )

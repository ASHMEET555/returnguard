"""Tests for Reviewer State Machine and Workflow (Step C1)."""

import datetime
import hashlib
import json
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from auth.embed_tokens import EMBED_SIGNING_KEY_ENV, EMBED_TOKEN_AUDIENCE
import jwt
from db.models import (
    APIKey,
    Dispute,
    EvidenceApproval,
    EvidencePack,
    Investigation,
    Merchant,
    Order,
)
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import SessionLocal
from disputes.state_machine import (
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

VALID_SIGNING_KEY = "super_secure_embed_signing_key_at_least_32_bytes_long!"


@pytest.fixture
def test_setup():
    db = SessionLocal()
    mid1 = f"m_c1_a_{uuid.uuid4().hex[:8]}"
    mid2 = f"m_c1_b_{uuid.uuid4().hex[:8]}"
    m1 = Merchant(id=mid1, name="Merchant C1 A", email="c1a@test.com")
    m2 = Merchant(id=mid2, name="Merchant C1 B", email="c1b@test.com")
    db.add_all([m1, m2])

    raw_k1 = f"rg_live_c1_a_{uuid.uuid4().hex}"
    h1 = hashlib.sha256(raw_k1.encode("utf-8")).hexdigest()
    k1 = APIKey(
        id=f"k_{uuid.uuid4().hex[:8]}",
        merchant_id=mid1,
        key_prefix="rg_live_",
        key_hash=h1,
        name="K1",
        is_active=True,
    )
    db.add(k1)

    disp1 = Dispute(
        id=f"disp_{uuid.uuid4().hex[:8]}",
        merchant_id=mid1,
        external_dispute_id=f"ext_{uuid.uuid4().hex[:8]}",
        status="OPEN",
        amount=100.0,
        currency="USD",
        reason_code="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    )
    db.add(disp1)

    inv1 = Investigation(
        id=f"inv_{uuid.uuid4().hex[:8]}",
        merchant_id=mid1,
        dispute_id=disp1.id,
        status="OPEN",
    )
    db.add(inv1)

    db.commit()

    yield db, mid1, mid2, inv1.id, raw_k1
    db.close()


def test_unit_state_machine_allowed_transitions():
    """Verify all defined transitions in ALLOWED_TRANSITIONS succeed."""
    for from_state, to_states in ALLOWED_TRANSITIONS.items():
        for to_state in to_states:
            validate_transition(from_state, to_state)  # Should not raise


def test_unit_state_machine_disallowed_transitions():
    """Verify disallowed transitions raise InvalidStateTransitionError."""
    # OPEN cannot jump directly to CLOSED_APPROVED without review
    with pytest.raises(InvalidStateTransitionError):
        validate_transition(STATE_OPEN, STATE_CLOSED_APPROVED)

    # CLOSED_APPROVED cannot jump directly to IN_REVIEW without REOPENED
    with pytest.raises(InvalidStateTransitionError):
        validate_transition(STATE_CLOSED_APPROVED, STATE_IN_REVIEW)

    # AWAITING_REVIEW cannot jump directly to REOPENED
    with pytest.raises(InvalidStateTransitionError):
        validate_transition(STATE_AWAITING_REVIEW, STATE_REOPENED)


def test_unit_close_requirements_validation():
    """Verify validate_close_requirements conditions."""
    # Note under 20 chars raises InvalidCloseError
    with pytest.raises(InvalidCloseError, match="at least 20 characters"):
        validate_close_requirements(
            STATE_CLOSED_NO_ACTION,
            note="too short",
            has_recorded_steps=True,
        )

    # No recorded steps raises InvalidCloseError
    with pytest.raises(InvalidCloseError, match="at least one recorded step"):
        validate_close_requirements(
            STATE_CLOSED_NO_ACTION,
            note="This is a sufficiently long closing note for testing.",
            has_recorded_steps=False,
        )

    # CLOSED_APPROVED without approval raises InvalidCloseError
    with pytest.raises(
        InvalidCloseError, match="requires a valid, matching evidence approval"
    ):
        validate_close_requirements(
            STATE_CLOSED_APPROVED,
            note="This is a sufficiently long closing note for testing.",
            has_recorded_steps=True,
            has_active_approval=False,
        )

    # Valid CLOSED_APPROVED passes
    validate_close_requirements(
        STATE_CLOSED_APPROVED,
        note="This is a sufficiently long closing note for testing.",
        has_recorded_steps=True,
        has_active_approval=True,
    )


def test_unit_reopen_requirements_validation():
    """Verify validate_reopen_requirements conditions."""
    with pytest.raises(InvalidReopenError, match="non-empty reason"):
        validate_reopen_requirements("")

    with pytest.raises(InvalidReopenError, match="non-empty reason"):
        validate_reopen_requirements("   ")

    validate_reopen_requirements(
        "New customer dispute evidence received from merchant support."
    )


def make_embed_token(merchant_id: str, sub: str = "rev_01", scopes: list = None) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    claims = {
        "tid": merchant_id,
        "sub": sub,
        "aud": EMBED_TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + 3600),
        "scp": scopes or ["read", "reviews", "evidence:approve"],
    }
    return jwt.encode(claims, VALID_SIGNING_KEY, algorithm="HS256")


def test_api_state_machine_allowed_transitions(test_setup):
    db, mid1, mid2, inv_id, raw_k1 = test_setup
    import os

    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_SIGNING_KEY
    client = TestClient(app)
    token = make_embed_token(mid1)

    # OPEN -> IN_REVIEW
    res1 = client.post(
        f"/v1/investigations/{inv_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "IN_REVIEW"},
    )
    assert res1.status_code == 200
    assert res1.json()["current_status"] == "IN_REVIEW"

    # IN_REVIEW -> AWAITING_REVIEW
    res2 = client.post(
        f"/v1/investigations/{inv_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "AWAITING_REVIEW"},
    )
    assert res2.status_code == 200
    assert res2.json()["current_status"] == "AWAITING_REVIEW"


def test_api_state_machine_disallowed_transition_returns_409(test_setup):
    db, mid1, mid2, inv_id, raw_k1 = test_setup
    import os

    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_SIGNING_KEY
    client = TestClient(app)
    token = make_embed_token(mid1)

    # OPEN -> CLOSED_APPROVED directly is disallowed
    res = client.post(
        f"/v1/investigations/{inv_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "CLOSED_APPROVED"},
    )
    assert res.status_code == 409
    assert "Cannot transition" in res.json()["detail"]


def test_api_close_without_note_returns_422(test_setup):
    db, mid1, mid2, inv_id, raw_k1 = test_setup
    import os

    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_SIGNING_KEY
    client = TestClient(app)
    token = make_embed_token(mid1)

    # Move to IN_REVIEW first
    client.post(
        f"/v1/investigations/{inv_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "IN_REVIEW"},
    )

    # Note too short (< 20 chars) -> 422
    res = client.post(
        f"/v1/investigations/{inv_id}/close",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "outcome": "CLOSED_NO_ACTION",
            "note": "short note",
            "steps_performed": ["STEP_1"],
        },
    )
    assert res.status_code == 422
    assert "at least 20 characters" in res.json()["detail"]


def test_api_close_without_steps_returns_422(test_setup):
    db, mid1, mid2, inv_id, raw_k1 = test_setup
    import os

    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_SIGNING_KEY
    client = TestClient(app)
    token = make_embed_token(mid1)

    # Move to IN_REVIEW first
    client.post(
        f"/v1/investigations/{inv_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "IN_REVIEW"},
    )

    # Empty steps_performed -> 422
    res = client.post(
        f"/v1/investigations/{inv_id}/close",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "outcome": "CLOSED_NO_ACTION",
            "note": "Closing this case because merchant resolved the dispute directly with buyer.",
            "steps_performed": [],
        },
    )
    assert res.status_code == 422
    assert "at least one recorded step" in res.json()["detail"]


def test_api_close_as_approved_without_approval_returns_409(test_setup):
    db, mid1, mid2, inv_id, raw_k1 = test_setup
    import os

    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_SIGNING_KEY
    client = TestClient(app)
    token = make_embed_token(mid1)

    # Move to IN_REVIEW first
    client.post(
        f"/v1/investigations/{inv_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "IN_REVIEW"},
    )

    # Close as CLOSED_APPROVED without an active EvidenceApproval -> 409
    res = client.post(
        f"/v1/investigations/{inv_id}/close",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "outcome": "CLOSED_APPROVED",
            "note": "Closing this case as approved with full documentation package.",
            "steps_performed": ["EVIDENCE_CHECKED"],
        },
    )
    assert res.status_code == 409
    assert "matching evidence approval" in res.json()["detail"]


def test_api_reopen_without_reason_returns_422(test_setup):
    db, mid1, mid2, inv_id, raw_k1 = test_setup
    import os

    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_SIGNING_KEY
    client = TestClient(app)
    token = make_embed_token(mid1)

    # Move to IN_REVIEW and close as CLOSED_NO_ACTION
    client.post(
        f"/v1/investigations/{inv_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "IN_REVIEW"},
    )
    client.post(
        f"/v1/investigations/{inv_id}/close",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "outcome": "CLOSED_NO_ACTION",
            "note": "Closing this case because merchant resolved the dispute directly with buyer.",
            "steps_performed": ["CASE_VIEWED"],
        },
    )

    # Reopen with empty reason -> 422
    res = client.post(
        f"/v1/investigations/{inv_id}/reopen",
        headers={"Authorization": f"Bearer {token}"},
        json={"reason": "   "},
    )
    assert res.status_code == 422
    assert "non-empty reason" in res.json()["detail"]


def test_api_cross_tenant_transition_returns_404(test_setup):
    db, mid1, mid2, inv_id, raw_k1 = test_setup
    import os

    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_SIGNING_KEY
    client = TestClient(app)

    # Token for merchant 2
    token_m2 = make_embed_token(mid2)

    # Merchant 2 attempts transition on Merchant 1's investigation -> 404
    res = client.post(
        f"/v1/investigations/{inv_id}/transition",
        headers={"Authorization": f"Bearer {token_m2}"},
        json={"target_status": "IN_REVIEW"},
    )
    assert res.status_code == 404

    # Merchant 2 attempts close -> 404
    res_close = client.post(
        f"/v1/investigations/{inv_id}/close",
        headers={"Authorization": f"Bearer {token_m2}"},
        json={
            "outcome": "CLOSED_NO_ACTION",
            "note": "Closing this case because merchant resolved the dispute directly with buyer.",
            "steps_performed": ["CASE_VIEWED"],
        },
    )
    assert res_close.status_code == 404

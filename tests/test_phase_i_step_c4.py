"""Tests for Step C4: Reviewer API additions and timeline."""

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
    DisputeDocument,
    EvidenceApproval,
    EvidencePack,
    Investigation,
    InvestigationStep,
    Merchant,
)
from db.session import SessionLocal

VALID_SIGNING_KEY = "super_secure_embed_signing_key_at_least_32_bytes_long!"


@pytest.fixture
def c4_setup():
    db = SessionLocal()
    mid1 = f"m_c4_a_{uuid.uuid4().hex[:8]}"
    mid2 = f"m_c4_b_{uuid.uuid4().hex[:8]}"
    m1 = Merchant(id=mid1, name=f"Merchant {mid1}", email=f"{mid1}@test.internal")
    m2 = Merchant(id=mid2, name=f"Merchant {mid2}", email=f"{mid2}@test.internal")
    db.add_all([m1, m2])

    raw_key1 = f"rg_live_c4_{uuid.uuid4().hex}"
    key_hash1 = hashlib.sha256(raw_key1.encode("utf-8")).hexdigest()
    k1 = APIKey(
        id=f"k_{uuid.uuid4().hex[:8]}",
        merchant_id=mid1,
        key_prefix="rg_live_",
        key_hash=key_hash1,
        name="C4 Key",
        is_active=True,
    )
    db.add(k1)

    disp = Dispute(
        id=f"disp_{uuid.uuid4().hex[:8]}",
        merchant_id=mid1,
        external_dispute_id=f"ext_{uuid.uuid4().hex[:8]}",
        status="OPEN",
        amount=300.0,
        currency="USD",
        reason_code="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    )
    db.add(disp)

    inv = Investigation(
        id=f"inv_{uuid.uuid4().hex[:8]}",
        merchant_id=mid1,
        dispute_id=disp.id,
        status="OPEN",
    )
    db.add(inv)

    db.commit()

    yield db, mid1, mid2, inv.id, disp.id, raw_key1
    db.close()


def make_token(merchant_id: str, sub: str = "rev_reviewer_01", scopes: list = None):
    now = datetime.datetime.now(datetime.timezone.utc)
    claims = {
        "tid": merchant_id,
        "sub": sub,
        "aud": EMBED_TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + 3600),
        "scp": (
            scopes if scopes is not None else ["read", "reviews", "evidence:approve"]
        ),
    }
    return jwt.encode(claims, VALID_SIGNING_KEY, algorithm="HS256")


def test_start_review_transitions_open_to_in_review(c4_setup, monkeypatch):
    monkeypatch.setenv(EMBED_SIGNING_KEY_ENV, VALID_SIGNING_KEY)
    db, mid1, mid2, inv_id, disp_id, raw_key1 = c4_setup
    client = TestClient(app)
    token = make_token(mid1, sub="rev_jane")

    res = client.post(
        f"/v1/investigations/{inv_id}/start-review",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["previous_status"] == "OPEN"
    assert data["current_status"] == "IN_REVIEW"
    assert data["reviewer"] == "rev_jane"

    # Repeat start-review from IN_REVIEW -> 409
    res_repeat = client.post(
        f"/v1/investigations/{inv_id}/start-review",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_repeat.status_code == 409


def test_add_note_and_request_documents(c4_setup, monkeypatch):
    monkeypatch.setenv(EMBED_SIGNING_KEY_ENV, VALID_SIGNING_KEY)
    db, mid1, mid2, inv_id, disp_id, raw_key1 = c4_setup
    client = TestClient(app)
    token = make_token(mid1, sub="rev_jane")

    # Add note
    res_note = client.post(
        f"/v1/investigations/{inv_id}/notes",
        headers={"Authorization": f"Bearer {token}"},
        json={"note": "Reviewer verified delivery tracking signature."},
    )
    assert res_note.status_code == 200
    assert res_note.json()["note"] == "Reviewer verified delivery tracking signature."

    # Request documents
    res_req = client.post(
        f"/v1/investigations/{inv_id}/request-documents",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_req.status_code == 200
    data = res_req.json()
    assert "missing_evidence_types" in data
    assert "PROOF_OF_DELIVERY" in data["missing_evidence_types"]


def test_timeline_ordered_steps_and_403_for_server_keys(c4_setup, monkeypatch):
    monkeypatch.setenv(EMBED_SIGNING_KEY_ENV, VALID_SIGNING_KEY)
    db, mid1, mid2, inv_id, disp_id, raw_key1 = c4_setup
    client = TestClient(app)
    token = make_token(mid1, sub="rev_jane")

    # Perform sequence: start-review, notes, request-documents
    client.post(
        f"/v1/investigations/{inv_id}/start-review",
        headers={"Authorization": f"Bearer {token}"},
    )
    client.post(
        f"/v1/investigations/{inv_id}/notes",
        headers={"Authorization": f"Bearer {token}"},
        json={"note": "Step 2 note"},
    )
    client.post(
        f"/v1/investigations/{inv_id}/request-documents",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Fetch timeline with reviewer token
    res_tl = client.get(
        f"/v1/investigations/{inv_id}/timeline",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_tl.status_code == 200
    tl_data = res_tl.json()
    assert tl_data["total_steps"] >= 3
    types = [s["step_type"] for s in tl_data["steps"]]
    assert types == ["STATUS_CHANGED", "NOTE_ADDED", "DOCUMENTS_REQUESTED"]

    # Verify 403 Forbidden for server API keys
    res_forbidden = client.get(
        f"/v1/investigations/{inv_id}/timeline",
        headers={"Authorization": f"Bearer {raw_key1}"},
    )
    assert res_forbidden.status_code == 403

    res_forbidden_start = client.post(
        f"/v1/investigations/{inv_id}/start-review",
        headers={"Authorization": f"Bearer {raw_key1}"},
    )
    assert res_forbidden_start.status_code == 403


def test_cross_tenant_reviewer_actions_return_404(c4_setup, monkeypatch):
    monkeypatch.setenv(EMBED_SIGNING_KEY_ENV, VALID_SIGNING_KEY)
    db, mid1, mid2, inv_id, disp_id, raw_key1 = c4_setup
    client = TestClient(app)
    token_m2 = make_token(mid2, sub="rev_bob")

    # M2 accesses M1 investigation -> 404 on all reviewer routes
    assert (
        client.post(
            f"/v1/investigations/{inv_id}/start-review",
            headers={"Authorization": f"Bearer {token_m2}"},
        ).status_code
        == 404
    )
    assert (
        client.post(
            f"/v1/investigations/{inv_id}/notes",
            headers={"Authorization": f"Bearer {token_m2}"},
            json={"note": "hack"},
        ).status_code
        == 404
    )
    assert (
        client.post(
            f"/v1/investigations/{inv_id}/request-documents",
            headers={"Authorization": f"Bearer {token_m2}"},
        ).status_code
        == 404
    )
    assert (
        client.get(
            f"/v1/investigations/{inv_id}/timeline",
            headers={"Authorization": f"Bearer {token_m2}"},
        ).status_code
        == 404
    )

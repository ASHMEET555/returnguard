"""Tests for Step C3: Append-only step log for every reviewer action."""

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
    InvestigationStep,
    Merchant,
)
from db.session import SessionLocal

VALID_SIGNING_KEY = "super_secure_embed_signing_key_at_least_32_bytes_long!"


@pytest.fixture
def c3_setup():
    db = SessionLocal()
    mid = f"m_c3_{uuid.uuid4().hex[:8]}"
    m = Merchant(id=mid, name=f"Merchant {mid}", email=f"{mid}@test.internal")
    db.add(m)

    raw_key = f"rg_live_c3_{uuid.uuid4().hex}"
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    k = APIKey(
        id=f"k_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        key_prefix="rg_live_",
        key_hash=key_hash,
        name="C3 Key",
        is_active=True,
    )
    db.add(k)

    disp = Dispute(
        id=f"disp_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        external_dispute_id=f"ext_{uuid.uuid4().hex[:8]}",
        status="OPEN",
        amount=250.0,
        currency="USD",
        reason_code="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    )
    db.add(disp)

    inv = Investigation(
        id=f"inv_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        dispute_id=disp.id,
        status="OPEN",
    )
    db.add(inv)

    pack = EvidencePack(
        id=f"pack_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        investigation_id=inv.id,
        version=1,
        pack_hash="hash_test_12345",
        pack_json={"dispute_id": disp.id},
        pack_md="# Pack",
    )
    db.add(pack)

    db.commit()

    yield db, mid, inv.id, pack.pack_hash
    db.close()


def make_token(merchant_id: str, sub: str = "rev_alice"):
    now = datetime.datetime.now(datetime.timezone.utc)
    claims = {
        "tid": merchant_id,
        "sub": sub,
        "aud": EMBED_TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + 3600),
        "scp": ["read", "reviews", "evidence:approve"],
    }
    return jwt.encode(claims, VALID_SIGNING_KEY, algorithm="HS256")


def test_each_action_writes_exactly_one_step_in_order(c3_setup, monkeypatch):
    monkeypatch.setenv(EMBED_SIGNING_KEY_ENV, VALID_SIGNING_KEY)
    db, mid, inv_id, pack_hash = c3_setup
    client = TestClient(app)
    token = make_token(mid, sub="reviewer_bob")

    # 1. Transition OPEN -> IN_REVIEW
    r1 = client.post(
        f"/v1/investigations/{inv_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "IN_REVIEW"},
    )
    assert r1.status_code == 200

    # 2. Approve evidence pack
    r2 = client.post(
        f"/v1/investigations/{inv_id}/approve",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "pack_hash": pack_hash,
            "decision": "APPROVE",
            "reason": "Reviewed and valid",
        },
    )
    assert r2.status_code == 200

    # 3. Close case
    r3 = client.post(
        f"/v1/investigations/{inv_id}/close",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "outcome": "CLOSED_APPROVED",
            "note": "Closing this case as approved with full documentation package.",
            "steps_performed": ["STATUS_CHANGED", "PACK_APPROVED"],
        },
    )
    assert r3.status_code == 200

    # 4. Reopen case
    r4 = client.post(
        f"/v1/investigations/{inv_id}/reopen",
        headers={"Authorization": f"Bearer {token}"},
        json={"reason": "Customer submitted contradictory evidence after closure."},
    )
    assert r4.status_code == 200

    # Verify steps in DB
    db.expire_all()
    steps = (
        db.query(InvestigationStep)
        .filter(InvestigationStep.investigation_id == inv_id)
        .order_by(InvestigationStep.created_at.asc(), InvestigationStep.id.asc())
        .all()
    )

    types = [s.step_type for s in steps]
    assert types == ["STATUS_CHANGED", "PACK_APPROVED", "CASE_CLOSED", "CASE_REOPENED"]
    assert all(s.actor == "reviewer_bob" for s in steps)
    assert all(s.actor_type == "reviewer" for s in steps)
    assert steps[1].pack_hash == pack_hash


def test_steps_cannot_be_updated_or_deleted_through_api(c3_setup, monkeypatch):
    """Verify there are no PUT, PATCH or DELETE endpoints exposed on steps."""
    monkeypatch.setenv(EMBED_SIGNING_KEY_ENV, VALID_SIGNING_KEY)
    db, mid, inv_id, _ = c3_setup
    client = TestClient(app)
    token = make_token(mid)

    # Attempt PUT, PATCH, DELETE on steps
    res_put = client.put(
        f"/v1/investigations/{inv_id}/steps/step_123",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_put.status_code in [404, 405]

    res_patch = client.patch(
        f"/v1/investigations/{inv_id}/steps/step_123",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_patch.status_code in [404, 405]

    res_del = client.delete(
        f"/v1/investigations/{inv_id}/steps/step_123",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_del.status_code in [404, 405]

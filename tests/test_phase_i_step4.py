"""Tests for Step I4: Evidence pack generation, human approval, and submission handoff."""

import hashlib
import json
import uuid
import jwt
import pytest
from fastapi.testclient import TestClient

from api.main import app
from assistant.validator import LLMReasoningOutput, RecommendedNextStep
from auth.embed_tokens import EMBED_SIGNING_KEY_ENV, EMBED_TOKEN_AUDIENCE
from db.models import (
    APIKey,
    Customer,
    Dispute,
    EvidenceApproval,
    EvidencePack,
    Merchant,
    Order,
)
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import SessionLocal
from disputes.case_builder import build_case_file
from disputes.evidence_pack import build_evidence_pack, save_evidence_pack
from disputes.findings import compute_findings


@pytest.fixture
def env_setup(monkeypatch):
    monkeypatch.setenv(
        EMBED_SIGNING_KEY_ENV, "super-secret-signing-key-minimum-32-chars-long!"
    )


@pytest.fixture
def seeded_case(env_setup):
    db = SessionLocal()
    mid = f"m_i4_{uuid.uuid4().hex[:8]}"
    merchant = Merchant(id=mid, name="Merchant I4", email="i4@test.com")
    db.add(merchant)

    raw_key = f"rg_live_i4_{uuid.uuid4().hex}"
    h = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    api_key = APIKey(
        id=f"k_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        key_prefix="rg_live_",
        key_hash=h,
        name="Key I4",
        is_active=True,
    )
    db.add(api_key)

    cid = f"c_{uuid.uuid4().hex[:8]}"
    cust = Customer(id=cid, merchant_id=mid, email="i4@cust.com", phone="+15553334444")
    db.add(cust)
    db.commit()

    order = Order(
        id=f"ord_i4_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id="a_none",
        device_id="d_none",
        order_time=pytest.importorskip("datetime").datetime.now(
            pytest.importorskip("datetime").timezone.utc
        ),
        channel="paypal",
        order_value=250.0,
        currency="USD",
        category="retail",
    )
    db.add(order)
    db.commit()

    dispute = Dispute(
        id=f"disp_i4_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        external_dispute_id="PP-D-I4",
        transaction_id=order.id,
        reason_code="DEFAULT",
        status="OPEN",
        amount=250.0,
        currency="USD",
        opened_at=order.order_time,
        received_at=order.order_time,
    )
    db.add(dispute)
    db.commit()

    repo = TenantScopedRepository(db, mid)
    inv = repo.get_or_create_investigation(dispute.id)

    # Build and save pack v1
    case_file = build_case_file(repo, dispute.id)
    findings = compute_findings(case_file)
    narrative = LLMReasoningOutput(
        summary="Summary for pack v1",
        steps=[],
        evidence_gaps=[],
        recommended_next_step=RecommendedNextStep.CHALLENGE_DISPUTE,
    )
    pack_v1 = build_evidence_pack(case_file, findings, narrative, version=1)
    pack_rec = save_evidence_pack(repo, inv.id, pack_v1)

    yield repo, inv.id, pack_rec, mid, raw_key, db
    db.close()


def create_embed_jwt(mid: str, sub: str, scopes: list) -> str:
    signing_key = "super-secret-signing-key-minimum-32-chars-long!"
    claims = {
        "tid": mid,
        "sub": sub,
        "scp": scopes,
        "aud": EMBED_TOKEN_AUDIENCE,
        "exp": int(pytest.importorskip("time").time()) + 600,
    }
    return jwt.encode(claims, signing_key, algorithm="HS256")


def test_approve_rejects_server_api_key(seeded_case):
    """Server API key is strictly forbidden (403) from approving evidence packages."""
    repo, inv_id, pack, mid, api_key, db = seeded_case
    client = TestClient(app)

    res = client.post(
        f"/v1/investigations/{inv_id}/approve",
        json={"pack_hash": pack.pack_hash},
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert res.status_code == 403


def test_approve_rejects_missing_scope(seeded_case):
    """Embed token without 'evidence:approve' scope returns 403."""
    repo, inv_id, pack, mid, _, db = seeded_case
    client = TestClient(app)

    token = create_embed_jwt(mid, "reviewer_1", ["read", "reviews"])
    res = client.post(
        f"/v1/investigations/{inv_id}/approve",
        json={"pack_hash": pack.pack_hash},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403


def test_approve_and_conflict_on_pack_hash_mismatch(seeded_case):
    """Reviewer approves matching pack_hash; rejecting stale pack_hash returns 409."""
    repo, inv_id, pack, mid, _, db = seeded_case
    client = TestClient(app)

    token = create_embed_jwt(mid, "reviewer_1", ["evidence:approve"])

    # Wrong pack hash -> 409
    res_bad = client.post(
        f"/v1/investigations/{inv_id}/approve",
        json={"pack_hash": "wrong_hash_1234"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_bad.status_code == 409

    # Correct pack hash -> 200
    res_good = client.post(
        f"/v1/investigations/{inv_id}/approve",
        json={"pack_hash": pack.pack_hash},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_good.status_code == 200
    assert res_good.json()["status"] == "success"


def test_new_pack_revokes_prior_approval(seeded_case):
    """Building and saving pack v2 automatically revokes approval for pack v1."""
    repo, inv_id, pack, mid, api_key, db = seeded_case
    client = TestClient(app)
    token = create_embed_jwt(mid, "reviewer_1", ["evidence:approve"])

    # Approve pack v1
    client.post(
        f"/v1/investigations/{inv_id}/approve",
        json={"pack_hash": pack.pack_hash},
        headers={"Authorization": f"Bearer {token}"},
    )

    # Verify submission package is accessible with server key
    sub_res = client.get(
        f"/v1/investigations/{inv_id}/submission-package",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert sub_res.status_code == 200

    # Build & save pack v2 (e.g. document added)
    case_file = build_case_file(repo, repo.get_investigation(inv_id).dispute_id)
    findings = compute_findings(case_file)
    narrative_v2 = LLMReasoningOutput(
        summary="Updated pack v2 narrative",
        steps=[],
        evidence_gaps=[],
        recommended_next_step=RecommendedNextStep.CHALLENGE_DISPUTE,
    )
    pack_v2 = build_evidence_pack(case_file, findings, narrative_v2, version=2)
    save_evidence_pack(repo, inv_id, pack_v2)

    # Submission package now returns 409 Conflict because approval was revoked
    sub_res_after = client.get(
        f"/v1/investigations/{inv_id}/submission-package",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert sub_res_after.status_code == 409


def test_submission_result_idempotency(seeded_case):
    """Submission result endpoint is idempotent by submission_key."""
    repo, inv_id, pack, mid, api_key, db = seeded_case
    client = TestClient(app)

    sub_key = f"sub_key_{uuid.uuid4().hex[:12]}"
    payload = {
        "submission_key": sub_key,
        "pack_hash": pack.pack_hash,
        "status": "SUBMITTED",
        "paypal_reference": "PP-SUB-999",
    }

    # Call 1 -> recorded
    r1 = client.post(
        f"/v1/investigations/{inv_id}/submission-result",
        json=payload,
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert r1.status_code == 200
    assert r1.json()["status"] == "recorded"

    # Call 2 -> already_recorded
    r2 = client.post(
        f"/v1/investigations/{inv_id}/submission-result",
        json=payload,
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "already_recorded"

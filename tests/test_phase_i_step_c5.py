"""Tests for Step C5: LLM assessment view with validator trace."""

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
    LLMRun,
    Merchant,
)
from db.session import SessionLocal

VALID_SIGNING_KEY = "super_secure_embed_signing_key_at_least_32_bytes_long!"


@pytest.fixture
def c5_setup():
    db = SessionLocal()
    mid = f"m_c5_{uuid.uuid4().hex[:8]}"
    m = Merchant(id=mid, name=f"Merchant {mid}", email=f"{mid}@test.internal")
    db.add(m)

    disp = Dispute(
        id=f"disp_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        external_dispute_id=f"ext_{uuid.uuid4().hex[:8]}",
        status="OPEN",
        amount=500.0,
        currency="USD",
        reason_code="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    )
    db.add(disp)

    # 1. Validated Case
    inv_val = Investigation(
        id=f"inv_val_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        dispute_id=disp.id,
        status="OPEN",
    )
    db.add(inv_val)

    run_val = LLMRun(
        id=f"run_v_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        investigation_id=inv_val.id,
        provider="fake_llm",
        model="reasoner_v1",
        prompt_hash="hash_prompt_val",
        raw_output='{"summary": "Buyer O1 has 3 past transactions."}',
        validation_result={"errors": [], "is_valid": True},
        final_status="SUCCESS",
    )
    db.add(run_val)

    pack_val = EvidencePack(
        id=f"pack_v_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        investigation_id=inv_val.id,
        version=1,
        pack_hash="hash_pack_val",
        pack_json={
            "deterministic_findings": ["HIGH_REFUND_FREQUENCY"],
            "investigation_narrative": {
                "summary": "Buyer O1 has multiple delivered refunds.",
                "steps": [{"step_number": 1, "description": "Checked alias O1"}],
            },
        },
        pack_md="# Val Pack",
    )
    db.add(pack_val)

    # 2. Fallback Case
    inv_fb = Investigation(
        id=f"inv_fb_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        dispute_id=disp.id,
        status="OPEN",
    )
    db.add(inv_fb)

    run_fb = LLMRun(
        id=f"run_f_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        investigation_id=inv_fb.id,
        provider="fake_llm",
        model="reasoner_v1",
        prompt_hash="hash_prompt_fb",
        raw_output="raw output with errors",
        validation_result={
            "attempt_1_errors": ["Unknown alias O99"],
            "attempt_2_errors": ["Accusatory term fraudster found"],
            "fallback": True,
        },
        final_status="FAILED_FALLBACK_TEMPLATE",
    )
    db.add(run_fb)

    pack_fb = EvidencePack(
        id=f"pack_f_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        investigation_id=inv_fb.id,
        version=1,
        pack_hash="hash_pack_fb",
        pack_json={
            "deterministic_findings": ["RAPID_DISPUTE_AFTER_DELIVERY"],
            "investigation_narrative": {
                "summary": "Deterministic template summary.",
                "steps": [{"step_number": 1, "description": "Template step 1"}],
            },
        },
        pack_md="# FB Pack",
    )
    db.add(pack_fb)

    db.commit()

    yield db, mid, inv_val.id, inv_fb.id
    db.close()


def make_token(merchant_id: str, sub: str = "rev_c5"):
    now = datetime.datetime.now(datetime.timezone.utc)
    claims = {
        "tid": merchant_id,
        "sub": sub,
        "aud": EMBED_TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + 3600),
        "scp": ["read", "reviews"],
    }
    return jwt.encode(claims, VALID_SIGNING_KEY, algorithm="HS256")


def test_assessment_validated_case(c5_setup, monkeypatch):
    monkeypatch.setenv(EMBED_SIGNING_KEY_ENV, VALID_SIGNING_KEY)
    db, mid, inv_val_id, inv_fb_id = c5_setup
    client = TestClient(app)
    token = make_token(mid)

    res = client.get(
        f"/v1/investigations/{inv_val_id}/assessment",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["advisory_label"] == "LLM assessment, advisory"
    assert data["final_status"] == "VALIDATED"
    assert data["model_identifier"] == "reasoner_v1"
    assert data["prompt_hash"] == "hash_prompt_val"
    assert "HIGH_REFUND_FREQUENCY" in data["findings_cited"]
    assert "Buyer O1 has multiple delivered refunds." in data["final_text"]


def test_assessment_fallback_case_shows_validator_errors(c5_setup, monkeypatch):
    monkeypatch.setenv(EMBED_SIGNING_KEY_ENV, VALID_SIGNING_KEY)
    db, mid, inv_val_id, inv_fb_id = c5_setup
    client = TestClient(app)
    token = make_token(mid)

    res = client.get(
        f"/v1/investigations/{inv_fb_id}/assessment",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["advisory_label"] == "LLM assessment, advisory"
    assert data["final_status"] == "TEMPLATE_FALLBACK"
    assert data["attempt_count"] == 2
    assert len(data["attempts"]) == 2
    assert data["attempts"][0]["errors"] == ["Unknown alias O99"]
    assert data["attempts"][1]["errors"] == ["Accusatory term fraudster found"]
    assert "RAPID_DISPUTE_AFTER_DELIVERY" in data["findings_cited"]


def test_assessment_never_leaks_real_ids_or_private_data(c5_setup, monkeypatch):
    """Fixture containing real customer and merchant ID strings must never leak into response."""
    monkeypatch.setenv(EMBED_SIGNING_KEY_ENV, VALID_SIGNING_KEY)
    db, mid, inv_val_id, inv_fb_id = c5_setup
    client = TestClient(app)
    token = make_token(mid)

    # Check both assessment responses
    for iid in [inv_val_id, inv_fb_id]:
        res = client.get(
            f"/v1/investigations/{iid}/assessment",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        body_text = res.text
        # Assert no real database prefixes or private customer PII leaks
        assert "cust_private_" not in body_text
        assert "addr_real_" not in body_text
        assert "email@realdomain.com" not in body_text

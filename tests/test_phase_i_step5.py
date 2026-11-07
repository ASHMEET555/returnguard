"""Tests for Step I5: Admin read surface and risk-path invariant tests."""

import datetime
import hashlib
import json
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from assistant.validator import LLMReasoningOutput, RecommendedNextStep
from assistant.investigation import run_investigation_reasoning
from assistant.llm_provider import FakeLLMProvider
from db.models import (
    APIKey,
    AuditScoreEvent,
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
def seeded_admin_setup():
    db = SessionLocal()
    mid1 = f"m_i5_a_{uuid.uuid4().hex[:8]}"
    mid2 = f"m_i5_b_{uuid.uuid4().hex[:8]}"
    m1 = Merchant(id=mid1, name="Merchant I5 A", email="i5a@test.com")
    m2 = Merchant(id=mid2, name="Merchant I5 B", email="i5b@test.com")
    db.add_all([m1, m2])

    raw_k1 = f"rg_live_i5_a_{uuid.uuid4().hex}"
    raw_k2 = f"rg_live_i5_b_{uuid.uuid4().hex}"
    h1 = hashlib.sha256(raw_k1.encode("utf-8")).hexdigest()
    h2 = hashlib.sha256(raw_k2.encode("utf-8")).hexdigest()
    k1 = APIKey(
        id=f"k_{uuid.uuid4().hex[:8]}",
        merchant_id=mid1,
        key_prefix="rg_live_",
        key_hash=h1,
        name="K1",
        is_active=True,
    )
    k2 = APIKey(
        id=f"k_{uuid.uuid4().hex[:8]}",
        merchant_id=mid2,
        key_prefix="rg_live_",
        key_hash=h2,
        name="K2",
        is_active=True,
    )
    db.add_all([k1, k2])

    cid = f"c_{uuid.uuid4().hex[:8]}"
    cust = Customer(id=cid, merchant_id=mid1, email="i5@cust.com", phone="+15551113333")
    db.add(cust)
    db.commit()

    now = datetime.datetime.now(datetime.timezone.utc)
    order = Order(
        id=f"ord_i5_{uuid.uuid4().hex[:8]}",
        merchant_id=mid1,
        customer_id=cid,
        address_id="a_none",
        device_id="d_none",
        order_time=now,
        channel="paypal",
        order_value=175.0,
        currency="USD",
        category="retail",
    )
    db.add(order)
    db.commit()

    # Pre-existing risk audit score event
    audit = AuditScoreEvent(
        id=f"aud_{uuid.uuid4().hex[:8]}",
        decision_id=f"dec_{uuid.uuid4().hex[:8]}",
        order_id=order.id,
        merchant_id=mid1,
        channel="paypal",
        risk_score=0.1500,
        tier="LOW",
        policy_rule="ALLOW_NORMAL",
        policy_action="ALLOW",
        severity="allow",
        suggested_action="allow",
        model_version="candidate_lgbm_v1",
        reason_codes_json=json.dumps(["RC_CLEAN_TENURE"]),
        rule_hits_json=json.dumps([]),
    )
    db.add(audit)
    db.commit()

    dispute = Dispute(
        id=f"disp_i5_{uuid.uuid4().hex[:8]}",
        merchant_id=mid1,
        external_dispute_id="PP-D-I5",
        transaction_id=order.id,
        reason_code="DEFAULT",
        status="OPEN",
        amount=175.0,
        currency="USD",
        opened_at=now,
        received_at=now,
    )
    db.add(dispute)
    db.commit()

    repo1 = TenantScopedRepository(db, mid1)
    inv1 = repo1.get_or_create_investigation(dispute.id)

    # Generate pack for inv1
    case_file = build_case_file(repo1, dispute.id)
    findings = compute_findings(case_file)
    narrative = LLMReasoningOutput(
        summary="Advisory assessment for inv1.",
        steps=[],
        evidence_gaps=[],
        recommended_next_step=RecommendedNextStep.CHALLENGE_DISPUTE,
    )
    pack = build_evidence_pack(case_file, findings, narrative, version=1)
    save_evidence_pack(repo1, inv1.id, pack)

    yield repo1, inv1.id, dispute.id, mid1, raw_k1, mid2, raw_k2, audit.id, db
    db.close()


def test_admin_list_and_detail(seeded_admin_setup):
    """GET /v1/investigations lists tenant investigations; detail returns full advisory payload."""
    repo1, inv_id, disp_id, mid1, k1, mid2, k2, _, db = seeded_admin_setup
    client = TestClient(app)

    # 1. List for Merchant 1
    res1 = client.get("/v1/investigations", headers={"Authorization": f"Bearer {k1}"})
    assert res1.status_code == 200
    items1 = res1.json()["items"]
    assert len(items1) >= 1
    assert any(i["id"] == inv_id for i in items1)

    # Cross-tenant list: Merchant 2 receives empty list
    res2 = client.get("/v1/investigations", headers={"Authorization": f"Bearer {k2}"})
    assert res2.status_code == 200
    assert len(res2.json()["items"]) == 0

    # 2. Detail for Merchant 1
    detail_res = client.get(
        f"/v1/investigations/{inv_id}", headers={"Authorization": f"Bearer {k1}"}
    )
    assert detail_res.status_code == 200
    data = detail_res.json()
    assert data["id"] == inv_id
    assert "advisory_assessment" in data
    assert "disclaimer" in data["advisory_assessment"]
    assert (
        "does not alter risk probability" in data["advisory_assessment"]["disclaimer"]
    )

    # Detail cross-tenant: Merchant 2 receives 404
    detail_cross = client.get(
        f"/v1/investigations/{inv_id}", headers={"Authorization": f"Bearer {k2}"}
    )
    assert detail_cross.status_code == 404


def test_get_pack_formats(seeded_admin_setup):
    """GET /v1/investigations/{id}/pack supports format=json and format=md."""
    repo1, inv_id, _, mid1, k1, _, _, _, db = seeded_admin_setup
    client = TestClient(app)

    # JSON format
    res_json = client.get(
        f"/v1/investigations/{inv_id}/pack?format=json",
        headers={"Authorization": f"Bearer {k1}"},
    )
    assert res_json.status_code == 200
    assert "version" in res_json.json()
    assert "target_transaction" in res_json.json()

    # MD format
    res_md = client.get(
        f"/v1/investigations/{inv_id}/pack?format=md",
        headers={"Authorization": f"Bearer {k1}"},
    )
    assert res_md.status_code == 200
    assert res_md.headers.get("content-type", "").startswith("text/markdown")
    assert "# ReturnGuard Dispute Evidence Package" in res_md.text


def test_risk_path_invariance_before_and_after_investigation(seeded_admin_setup):
    """
    CRITICAL INVARIANT TEST:
    Verifies that running the entire investigation pipeline including LLM reasoning
    leaves the risk audit record, probability, score, tier, and policy action 100% byte-identical.
    """
    repo1, inv_id, disp_id, mid1, k1, _, _, audit_id, db = seeded_admin_setup

    # Read audit record before investigation
    before_row = (
        db.query(AuditScoreEvent).filter(AuditScoreEvent.id == audit_id).first()
    )
    before_state = {
        "risk_score": float(before_row.risk_score),
        "tier": before_row.tier,
        "policy_rule": before_row.policy_rule,
        "policy_action": before_row.policy_action,
        "model_version": before_row.model_version,
        "reason_codes_json": before_row.reason_codes_json,
        "rule_hits_json": before_row.rule_hits_json,
    }

    # Execute full reasoning pipeline
    case_file = build_case_file(repo1, disp_id)
    findings = compute_findings(case_file)
    run_investigation_reasoning(
        repo1, inv_id, case_file, findings, provider_override=FakeLLMProvider()
    )

    # Read audit record after investigation
    db.expire_all()
    after_row = db.query(AuditScoreEvent).filter(AuditScoreEvent.id == audit_id).first()
    after_state = {
        "risk_score": float(after_row.risk_score),
        "tier": after_row.tier,
        "policy_rule": after_row.policy_rule,
        "policy_action": after_row.policy_action,
        "model_version": after_row.model_version,
        "reason_codes_json": after_row.reason_codes_json,
        "rule_hits_json": after_row.rule_hits_json,
    }

    # Must be 100% identical
    assert before_state == after_state

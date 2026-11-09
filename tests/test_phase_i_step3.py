"""Tests for Step I3: LLM reasoning, validator, retry, and template fallback."""

import json
import uuid
import pytest

from assistant.investigation import (
    generate_template_fallback,
    run_investigation_reasoning,
)
from assistant.llm_provider import FakeLLMProvider
from assistant.validator import (
    LLMReasoningOutput,
    RecommendedNextStep,
    validate_llm_output,
)
from db.models import Customer, Dispute, LLMRun, Merchant, Order
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import SessionLocal
from disputes.case_builder import build_case_file
from disputes.findings import compute_findings


@pytest.fixture
def repo_and_investigation():
    db = SessionLocal()
    mid = f"m_i3_{uuid.uuid4().hex[:8]}"
    merchant = Merchant(id=mid, name="Merchant I3", email="i3@example.com")
    db.add(merchant)

    cid = f"c_{uuid.uuid4().hex[:8]}"
    customer = Customer(
        id=cid, merchant_id=mid, email="i3@customer.com", phone="+15551112222"
    )
    db.add(customer)
    db.commit()

    order = Order(
        id=f"ord_i3_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id="a_none",
        device_id="d_none",
        order_time=pytest.importorskip("datetime").datetime.now(
            pytest.importorskip("datetime").timezone.utc
        ),
        channel="paypal",
        order_value=120.0,
        currency="USD",
        category="retail",
    )
    db.add(order)
    db.commit()

    dispute = Dispute(
        id=f"disp_i3_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        external_dispute_id="PP-D-I3",
        transaction_id=order.id,
        reason_code="DEFAULT",
        status="OPEN",
        amount=120.0,
        currency="USD",
        opened_at=order.order_time,
        received_at=order.order_time,
    )
    db.add(dispute)
    db.commit()

    repo = TenantScopedRepository(db, mid)
    inv = repo.get_or_create_investigation(dispute.id)

    yield repo, inv.id, dispute.id, db
    db.close()


def test_validator_rejects_hallucinated_alias():
    """Validator strictly rejects aliases not in known_aliases set."""
    known = {"T1", "O1", "D1"}
    bad_payload = {
        "summary": "Evaluation of transaction T1.",
        "steps": [
            {
                "finding_codes": ["F-REFUND-COUNT"],
                "alias_refs": ["O999"],  # Unknown alias
                "text": "Prior refund on unknown order.",
            }
        ],
        "evidence_gaps": [],
        "recommended_next_step": "CHALLENGE_DISPUTE",
    }
    res = validate_llm_output(bad_payload, known)
    assert not res.is_valid
    assert any("O999" in err for err in res.errors)


def test_validator_rejects_accusatory_terms():
    """Validator rejects accusatory terms like 'fraudster'."""
    known = {"T1"}
    bad_payload = {
        "summary": "This customer is a known fraudster attempting criminal chargeback.",
        "steps": [],
        "evidence_gaps": [],
        "recommended_next_step": "CHALLENGE_DISPUTE",
    }
    res = validate_llm_output(bad_payload, known)
    assert not res.is_valid
    assert any("Blocklisted" in err for err in res.errors)


def test_validator_rejects_real_id_leakage():
    """Validator rejects leaking real merchant or order IDs."""
    known = {"T1"}
    bad_payload = {
        "summary": "Investigation regarding ord_real_12345 and m_test_456.",
        "steps": [],
        "evidence_gaps": [],
        "recommended_next_step": "CHALLENGE_DISPUTE",
    }
    res = validate_llm_output(bad_payload, known)
    assert not res.is_valid
    assert any("leakage" in err.lower() for err in res.errors)


def test_retry_on_first_failure_then_success(repo_and_investigation):
    """When provider fails on 1st attempt but passes on 2nd, logs retry and returns result."""
    repo, inv_id, disp_id, db = repo_and_investigation
    case_file = build_case_file(repo, disp_id)
    findings = compute_findings(case_file)

    class RetryFakeProvider:
        def __init__(self):
            self.calls = 0

        def generate_investigation(self, c, f, aliases, previous_errors=None):
            self.calls += 1
            if self.calls == 1:
                # 1st attempt: bad alias
                return json.dumps(
                    {
                        "summary": "Summary",
                        "steps": [
                            {
                                "finding_codes": [],
                                "alias_refs": ["BAD_ALIAS"],
                                "text": "bad",
                            }
                        ],
                        "evidence_gaps": [],
                        "recommended_next_step": "CHALLENGE_DISPUTE",
                    }
                )
            else:
                # 2nd attempt: corrected
                return json.dumps(
                    {
                        "summary": "Corrected summary",
                        "steps": [
                            {"finding_codes": [], "alias_refs": ["T1"], "text": "valid"}
                        ],
                        "evidence_gaps": [],
                        "recommended_next_step": "CHALLENGE_DISPUTE",
                    }
                )

    provider = RetryFakeProvider()
    result = run_investigation_reasoning(
        repo, inv_id, case_file, findings, provider_override=provider
    )

    assert result.summary == "Corrected summary"
    runs = db.query(LLMRun).filter(LLMRun.investigation_id == inv_id).all()
    assert len(runs) == 1
    assert runs[0].final_status == "SUCCESS_AFTER_RETRY"


def test_fallback_to_template_when_both_attempts_fail(repo_and_investigation):
    """When both provider attempts fail validation, falls back to deterministic template."""
    repo, inv_id, disp_id, db = repo_and_investigation
    case_file = build_case_file(repo, disp_id)
    findings = compute_findings(case_file)

    bad_json = json.dumps({"corrupted": "payload"})
    provider = FakeLLMProvider(canned_response=bad_json)

    result = run_investigation_reasoning(
        repo, inv_id, case_file, findings, provider_override=provider
    )

    assert "Automated template case evaluation" in result.summary
    runs = db.query(LLMRun).filter(LLMRun.investigation_id == inv_id).all()
    assert len(runs) == 1
    assert runs[0].final_status == "FAILED_FALLBACK_TEMPLATE"

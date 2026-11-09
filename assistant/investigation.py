"""Orchestrates LLM investigation runs with validation, retry, and template fallback.

Invariants:
- Never changes or writes a probability, tier, policy action, rule hit, or SHAP value.
- Persists all LLM runs with prompt hash, validation status, and raw outputs in llm_runs.
- Falls back to deterministic template narrative on validation failure or missing API key.
"""

import hashlib
import json
from typing import Any, Dict, List, Optional, Set
import uuid

from assistant.llm_provider import BaseLLMProvider, FakeLLMProvider, get_llm_provider
from assistant.validator import (
    LLMReasoningOutput,
    RecommendedNextStep,
    validate_llm_output,
)
from db.models import LLMRun
from db.repositories.tenant_scoped import TenantScopedRepository
from disputes.case_builder import CaseFile
from disputes.findings import Finding


def generate_template_fallback(
    case_file: CaseFile,
    findings: List[Finding],
) -> LLMReasoningOutput:
    """Deterministic, template-driven narrative built purely from deterministic findings."""
    t_alias = case_file.sanitized_case["target_transaction"]["transaction_alias"]
    reason = case_file.sanitized_case["dispute"]["reason_code"]

    summary = (
        f"Automated template case evaluation for transaction {t_alias} under reason code {reason}. "
        f"Generated from {len(findings)} deterministic finding(s)."
    )

    steps = []
    for f in findings:
        steps.append(
            {
                "finding_codes": [f.finding_code],
                "alias_refs": f.alias_refs,
                "text": f"Finding {f.finding_code} ({f.severity}): {f.description}",
            }
        )

    has_missing_evidence = any(f.finding_code == "F-EVIDENCE-MISSING" for f in findings)
    gaps = (
        ["Pending verified delivery or document upload."]
        if has_missing_evidence
        else []
    )

    rec = (
        RecommendedNextStep.REQUEST_MORE_EVIDENCE
        if has_missing_evidence
        else (
            RecommendedNextStep.CHALLENGE_DISPUTE
            if any(f.severity in ["HIGH", "CRITICAL"] for f in findings)
            else RecommendedNextStep.MANUAL_REVIEW_ESCALATION
        )
    )

    return LLMReasoningOutput(
        summary=summary,
        steps=steps,
        evidence_gaps=gaps,
        recommended_next_step=rec,
    )


def run_investigation_reasoning(
    repo: TenantScopedRepository,
    investigation_id: str,
    case_file: CaseFile,
    findings: List[Finding],
    provider_override: Optional[BaseLLMProvider] = None,
) -> LLMReasoningOutput:
    """
    Execute LLM reasoning loop:
    1. Call provider
    2. Validate output
    3. If invalid, retry once passing validation errors
    4. If still invalid or no provider, record run and fall back to template narrative
    5. Always record llm_runs row
    """
    db = repo.db
    known_aliases: Set[str] = set(case_file.private_alias_map.keys())

    provider = provider_override or get_llm_provider()
    prompt_content = f"Case: {json.dumps(case_file.sanitized_case, sort_keys=True)}"
    prompt_hash = hashlib.sha256(prompt_content.encode("utf-8")).hexdigest()

    if not provider:
        # No provider configured: record template fallback run
        fallback_narrative = generate_template_fallback(case_file, findings)
        run_record = LLMRun(
            id=f"run_{uuid.uuid4().hex[:8]}",
            merchant_id=repo.merchant_id,
            investigation_id=investigation_id,
            provider="template_fallback",
            model="deterministic_rules_v1",
            prompt_hash=prompt_hash,
            raw_output=json.dumps(fallback_narrative.model_dump()),
            validation_result={"is_valid": True, "errors": [], "fallback": True},
            final_status="FALLBACK_TEMPLATE",
        )
        db.add(run_record)
        db.commit()
        return fallback_narrative

    # Attempt 1
    raw_1 = provider.generate_investigation(case_file, findings, known_aliases)
    parsed_dict_1: Dict[str, Any] = {}
    try:
        parsed_dict_1 = json.loads(raw_1)
    except Exception as e:
        parsed_dict_1 = {"_raw_parse_error": str(e)}

    val_1 = validate_llm_output(parsed_dict_1, known_aliases)

    if val_1.is_valid and val_1.parsed_output:
        run_record = LLMRun(
            id=f"run_{uuid.uuid4().hex[:8]}",
            merchant_id=repo.merchant_id,
            investigation_id=investigation_id,
            provider="llm_provider",
            model="reasoner_v1",
            prompt_hash=prompt_hash,
            raw_output=raw_1,
            validation_result=val_1.to_dict(),
            final_status="SUCCESS",
        )
        db.add(run_record)
        db.commit()
        return val_1.parsed_output

    # Attempt 2 (Regenerate once with error feedback)
    raw_2 = provider.generate_investigation(
        case_file,
        findings,
        known_aliases,
        previous_errors=val_1.errors,
    )
    parsed_dict_2: Dict[str, Any] = {}
    try:
        parsed_dict_2 = json.loads(raw_2)
    except Exception as e:
        parsed_dict_2 = {"_raw_parse_error": str(e)}

    val_2 = validate_llm_output(parsed_dict_2, known_aliases)

    if val_2.is_valid and val_2.parsed_output:
        run_record = LLMRun(
            id=f"run_{uuid.uuid4().hex[:8]}",
            merchant_id=repo.merchant_id,
            investigation_id=investigation_id,
            provider="llm_provider",
            model="reasoner_v1",
            prompt_hash=prompt_hash,
            raw_output=raw_2,
            validation_result=val_2.to_dict(),
            final_status="SUCCESS_AFTER_RETRY",
        )
        db.add(run_record)
        db.commit()
        return val_2.parsed_output

    # Both attempts failed validation -> Fall back to template narrative
    fallback_narrative = generate_template_fallback(case_file, findings)
    run_record = LLMRun(
        id=f"run_{uuid.uuid4().hex[:8]}",
        merchant_id=repo.merchant_id,
        investigation_id=investigation_id,
        provider="llm_provider",
        model="reasoner_v1",
        prompt_hash=prompt_hash,
        raw_output=raw_2,
        validation_result={
            "attempt_1_errors": val_1.errors,
            "attempt_2_errors": val_2.errors,
            "fallback": True,
        },
        final_status="FAILED_FALLBACK_TEMPLATE",
    )
    db.add(run_record)
    db.commit()
    return fallback_narrative

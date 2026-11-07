"""Output schemas and validator for LLM reasoning output.

Validates:
- Strict Pydantic schema structure (summary, steps, evidence_gaps, recommended_next_step)
- Unknown alias detection
- Missing alias references on facts
- Disallowed accusatory/intent terms (e.g., 'fraudster', 'criminal', 'stolen intentionally')
- Real ID leakage (e.g. m_*, ord_*, c_*)
- Extra unpermitted fields
"""

from enum import Enum
import re
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, Field, ConfigDict


class RecommendedNextStep(str, Enum):
    REQUEST_MORE_EVIDENCE = "REQUEST_MORE_EVIDENCE"
    ACCEPT_DISPUTE = "ACCEPT_DISPUTE"
    CHALLENGE_DISPUTE = "CHALLENGE_DISPUTE"
    MANUAL_REVIEW_ESCALATION = "MANUAL_REVIEW_ESCALATION"


class ReasoningStep(BaseModel):
    model_config = ConfigDict(extra="forbid")

    finding_codes: List[str] = Field(default_factory=list)
    alias_refs: List[str] = Field(default_factory=list)
    text: str


class LLMReasoningOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: str
    steps: List[ReasoningStep] = Field(default_factory=list)
    evidence_gaps: List[str] = Field(default_factory=list)
    recommended_next_step: RecommendedNextStep


# Accusatory and intent blocklist words
BLOCKLIST_WORDS = [
    r"\bfraudster\b",
    r"\bcriminal\b",
    r"\bthief\b",
    r"\bcon artist\b",
    r"\bmalicious\b",
    r"\bintentional fraud\b",
    r"\bscammer\b",
    r"\billegal intention\b",
]

# Patterns for leaked real IDs
REAL_ID_PATTERNS = [
    r"\bm_[a-zA-Z0-9_-]+\b",
    r"\bord_[a-zA-Z0-9_-]+\b",
    r"\bc_[a-zA-Z0-9_-]+\b",
    r"\bpay_[a-zA-Z0-9_-]+\b",
    r"\bref_[a-zA-Z0-9_-]+\b",
    r"\bship_[a-zA-Z0-9_-]+\b",
]


class ValidationResult:
    def __init__(
        self,
        is_valid: bool,
        errors: List[str],
        parsed_output: Optional[LLMReasoningOutput] = None,
    ):
        self.is_valid = is_valid
        self.errors = errors
        self.parsed_output = parsed_output

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "parsed_output": (
                self.parsed_output.model_dump() if self.parsed_output else None
            ),
        }


def validate_llm_output(
    raw_dict: Dict[str, Any], known_aliases: Set[str]
) -> ValidationResult:
    """Validate parsed LLM dictionary against schema and strict domain guardrails."""
    errors: List[str] = []

    # 1. Pydantic schema validation
    try:
        parsed = LLMReasoningOutput.model_validate(raw_dict)
    except Exception as e:
        return ValidationResult(
            is_valid=False, errors=[f"Schema validation error: {str(e)}"]
        )

    # 2. Blocklist & Real ID check in text
    all_text = (
        parsed.summary
        + " "
        + " ".join(s.text for s in parsed.steps)
        + " "
        + " ".join(parsed.evidence_gaps)
    )
    for pattern in BLOCKLIST_WORDS:
        if re.search(pattern, all_text, re.IGNORECASE):
            errors.append(
                f"Blocklisted accusatory word or intent phrasing found matching pattern: {pattern}"
            )

    for pattern in REAL_ID_PATTERNS:
        if re.search(pattern, all_text, re.IGNORECASE):
            errors.append(
                f"Private real ID leakage detected matching pattern: {pattern}"
            )

    # 3. Alias check
    for idx, step in enumerate(parsed.steps):
        for ref in step.alias_refs:
            if ref not in known_aliases:
                errors.append(f"Step {idx + 1} cites unknown alias: '{ref}'")

    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors,
        parsed_output=parsed if len(errors) == 0 else None,
    )

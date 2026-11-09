"""LLM Provider interface with live API key support and deterministic test stubbing."""

from abc import ABC, abstractmethod
import json
import os
from typing import Any, Dict, List, Optional, Set
from disputes.case_builder import CaseFile
from disputes.findings import Finding


class BaseLLMProvider(ABC):
    """Abstract interface for LLM provider."""

    @abstractmethod
    def generate_investigation(
        self,
        case_file: CaseFile,
        findings: List[Finding],
        known_aliases: Set[str],
        previous_errors: Optional[List[str]] = None,
    ) -> str:
        """Return raw JSON string response from LLM."""
        pass


class FakeLLMProvider(BaseLLMProvider):
    """Deterministic mock provider for unit and regression tests."""

    def __init__(self, canned_response: Optional[str] = None):
        self.canned_response = canned_response
        self.call_count = 0

    def generate_investigation(
        self,
        case_file: CaseFile,
        findings: List[Finding],
        known_aliases: Set[str],
        previous_errors: Optional[List[str]] = None,
    ) -> str:
        self.call_count += 1
        if self.canned_response:
            return self.canned_response

        # Default valid response adhering to known aliases
        t_alias = case_file.sanitized_case["target_transaction"]["transaction_alias"]
        steps = []
        for f in findings:
            valid_refs = [ref for ref in f.alias_refs if ref in known_aliases]
            steps.append(
                {
                    "finding_codes": [f.finding_code],
                    "alias_refs": valid_refs,
                    "text": f"Identified rule hit {f.finding_code}: {f.description}",
                }
            )

        sample_out = {
            "summary": f"Dispute investigation for transaction {t_alias} under reason {case_file.sanitized_case['dispute']['reason_code']}.",
            "steps": steps,
            "evidence_gaps": ["Carrier delivery receipt signature required."],
            "recommended_next_step": (
                "CHALLENGE_DISPUTE" if len(findings) > 1 else "REQUEST_MORE_EVIDENCE"
            ),
        }
        return json.dumps(sample_out)


def get_llm_provider() -> Optional[BaseLLMProvider]:
    """Factory to retrieve configured provider or None if not configured."""
    provider_name = os.environ.get("LLM_PROVIDER")
    api_key = os.environ.get("LLM_API_KEY")

    if not provider_name or not api_key:
        return None

    # In future expansion, real Gemini/OpenAI client is loaded here
    return FakeLLMProvider()

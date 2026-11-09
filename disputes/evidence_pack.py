"""Generator for canonical evidence packages in JSON and Markdown formats.

Canonical JSON uses strictly sorted keys and deterministic whitespace to produce
a stable SHA-256 pack_hash. Adding any document, finding, or narrative updates the pack version.
"""

from dataclasses import dataclass
import datetime
import hashlib
import json
from typing import Any, Dict, List, Optional
import uuid

from assistant.validator import LLMReasoningOutput
from db.models import EvidenceApproval, EvidencePack, Investigation
from db.repositories.tenant_scoped import TenantScopedRepository
from disputes.case_builder import CaseFile
from disputes.findings import Finding


@dataclass
class GeneratedPack:
    version: int
    pack_hash: str
    pack_json: Dict[str, Any]
    pack_md: str


def build_evidence_pack(
    case_file: CaseFile,
    findings: List[Finding],
    narrative: LLMReasoningOutput,
    version: int = 1,
) -> GeneratedPack:
    """Build canonical evidence package in sorted JSON and Markdown representations."""
    dispute = case_file.sanitized_case["dispute"]
    tx = case_file.sanitized_case["target_transaction"]
    history = case_file.sanitized_case["history"]
    docs = case_file.sanitized_case["documents"]

    findings_json = [
        {
            "finding_code": f.finding_code,
            "severity": f.severity,
            "description": f.description,
            "alias_refs": sorted(f.alias_refs),
        }
        for f in sorted(findings, key=lambda x: x.finding_code)
    ]

    pack_json: Dict[str, Any] = {
        "version": version,
        "dispute": {
            "alias": dispute["alias"],
            "reason_code": dispute["reason_code"],
            "amount": dispute["amount"],
            "currency": dispute["currency"],
            "status": dispute["status"],
            "opened_at": dispute["opened_at"],
            "received_at": dispute["received_at"],
        },
        "target_transaction": {
            "transaction_alias": tx["transaction_alias"],
            "amount": tx["amount"],
            "currency": tx["currency"],
            "channel": tx["channel"],
            "order_time": tx["order_time"],
            "decision_record": tx.get("decision_record"),
        },
        "deterministic_findings": findings_json,
        "investigation_narrative": narrative.model_dump(),
        "attached_documents": docs,
        "case_hash": case_file.case_hash,
    }

    # Canonical sorted JSON string
    canonical_str = json.dumps(pack_json, sort_keys=True, separators=(",", ":"))
    pack_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    # Markdown format
    md_lines = [
        f"# ReturnGuard Dispute Evidence Package (v{version})",
        "",
        f"**Pack Hash (SHA-256):** `{pack_hash}`  ",
        f"**Dispute:** `{dispute['alias']}` | **Reason:** `{dispute['reason_code']}`  ",
        f"**Amount:** `{dispute['amount']} {dispute['currency']}`  ",
        f"**Transaction Alias:** `{tx['transaction_alias']}`  ",
        "",
        "## Investigation Summary (Advisory)",
        f"{narrative.summary}",
        "",
        "### Recommended Action",
        f"**{narrative.recommended_next_step}**",
        "",
        "## Deterministic Findings",
    ]
    for f in findings:
        refs = ", ".join(f.alias_refs) if f.alias_refs else "None"
        md_lines.append(
            f"- **[{f.finding_code}]** ({f.severity}) {f.description} *(Refs: {refs})*"
        )

    md_lines.append("\n## Evidence Documents")
    if docs:
        for d in docs:
            md_lines.append(
                f"- **{d['document_alias']}**: `{d['filename']}` ({d['evidence_type']}) - SHA256: `{d['sha256']}`"
            )
    else:
        md_lines.append("*(No verified documents attached yet)*")

    if narrative.evidence_gaps:
        md_lines.append("\n## Evidence Gaps")
        for gap in narrative.evidence_gaps:
            md_lines.append(f"- {gap}")

    pack_md = "\n".join(md_lines)

    return GeneratedPack(
        version=version,
        pack_hash=pack_hash,
        pack_json=pack_json,
        pack_md=pack_md,
    )


def save_evidence_pack(
    repo: TenantScopedRepository,
    investigation_id: str,
    pack: GeneratedPack,
) -> EvidencePack:
    """Persist generated pack and revoke any prior approvals since pack_hash changed."""
    db = repo.db

    # Revoke prior approvals for this investigation
    now = datetime.datetime.now(datetime.timezone.utc)
    prior_approvals = (
        db.query(EvidenceApproval)
        .filter(
            EvidenceApproval.investigation_id == investigation_id,
            EvidenceApproval.merchant_id == repo.merchant_id,
            EvidenceApproval.revoked_at.is_(None),
        )
        .all()
    )
    for apprv in prior_approvals:
        apprv.revoked_at = now

    record = EvidencePack(
        id=f"pack_{uuid.uuid4().hex[:8]}",
        merchant_id=repo.merchant_id,
        investigation_id=investigation_id,
        version=pack.version,
        pack_hash=pack.pack_hash,
        pack_json=pack.pack_json,
        pack_md=pack.pack_md,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

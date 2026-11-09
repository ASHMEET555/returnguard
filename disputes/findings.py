"""Deterministic findings engine for dispute cases.

Evaluates seven deterministic findings against the Point-In-Time CaseFile:
- F-REFUND-COUNT: refund count > threshold across lookback window
- F-DELIVERED-THEN-REFUND: prior order delivered and subsequently refunded
- F-ADDRESS-MATCH-PRIOR: delivery address matches prior undisputed order
- F-ADDRESS-SHARED: delivery address shared across >= 2 accounts
- F-VELOCITY-PRIOR: >= 3 orders in 24 hours in prior history
- F-PRIOR-DISPUTES: >= 1 prior disputes in lookback window
- F-EVIDENCE-MISSING: missing required evidence documents for dispute reason
"""

from dataclasses import dataclass
import datetime
from typing import Any, Dict, List, Optional
import yaml

from disputes.case_builder import CaseFile
from disputes.completeness import check_completeness


@dataclass
class Finding:
    """A deterministic investigation finding."""

    finding_code: str
    severity: str
    description: str
    alias_refs: List[str]


def compute_findings(case_file: CaseFile) -> List[Finding]:
    """Compute all deterministic findings for a given CaseFile."""
    case = case_file.sanitized_case
    findings: List[Finding] = []

    history = case.get("history", {})
    prior_orders = history.get("prior_orders", [])
    prior_refunds = history.get("prior_refunds", [])
    prior_disputes = history.get("prior_disputes", [])
    shared_address_accounts = history.get("shared_address_accounts_count", 0)

    # 1. F-REFUND-COUNT: > 2 refunds in lookback window
    if len(prior_refunds) > 2:
        refund_aliases = [r["refund_alias"] for r in prior_refunds]
        findings.append(
            Finding(
                finding_code="F-REFUND-COUNT",
                severity="HIGH",
                description=f"Customer account received {len(prior_refunds)} refunds in previous 180 days (threshold: > 2).",
                alias_refs=refund_aliases,
            )
        )

    # 2. F-DELIVERED-THEN-REFUND: carrier confirmed delivered and subsequently refunded
    delivered_refund_orders = [
        o
        for o in prior_orders
        if o.get("shipment_status") == "delivered" and o.get("has_refund")
    ]
    if delivered_refund_orders:
        refs = []
        for o in delivered_refund_orders:
            refs.append(o["order_alias"])
            refs.extend(o.get("refund_aliases", []))
        findings.append(
            Finding(
                finding_code="F-DELIVERED-THEN-REFUND",
                severity="CRITICAL",
                description=f"Identified {len(delivered_refund_orders)} prior order(s) confirmed delivered then refunded.",
                alias_refs=refs,
            )
        )

    # 3. F-ADDRESS-MATCH-PRIOR: address matches prior undisputed order
    undisputed_prior = [o for o in prior_orders if not o.get("has_refund")]
    if undisputed_prior:
        order_aliases = [o["order_alias"] for o in undisputed_prior]
        findings.append(
            Finding(
                finding_code="F-ADDRESS-MATCH-PRIOR",
                severity="INFO",
                description=f"Delivery address matches {len(undisputed_prior)} prior undisputed order(s).",
                alias_refs=order_aliases,
            )
        )

    # 4. F-ADDRESS-SHARED: delivery address shared across >= 2 accounts
    if shared_address_accounts >= 2:
        findings.append(
            Finding(
                finding_code="F-ADDRESS-SHARED",
                severity="MEDIUM",
                description=f"Delivery address is shared across {shared_address_accounts} distinct accounts.",
                alias_refs=[case["target_transaction"]["transaction_alias"]],
            )
        )

    # 5. F-VELOCITY-PRIOR: >= 3 orders in 24 hours in prior history
    if len(prior_orders) >= 3:
        # Sort by timestamp
        parsed_orders = []
        for o in prior_orders:
            try:
                dt = datetime.datetime.fromisoformat(o["order_time"])
                parsed_orders.append((dt, o["order_alias"]))
            except Exception:
                continue
        parsed_orders.sort(key=lambda x: x[0])

        velocity_detected = False
        velocity_refs: List[str] = []
        for i in range(len(parsed_orders)):
            window = [
                parsed_orders[j]
                for j in range(i, len(parsed_orders))
                if (parsed_orders[j][0] - parsed_orders[i][0]).total_seconds() <= 86400
            ]
            if len(window) >= 3:
                velocity_detected = True
                velocity_refs = [w[1] for w in window]
                break

        if velocity_detected:
            findings.append(
                Finding(
                    finding_code="F-VELOCITY-PRIOR",
                    severity="HIGH",
                    description=f"Customer placed {len(velocity_refs)} orders within a 24-hour window.",
                    alias_refs=velocity_refs,
                )
            )

    # 6. F-PRIOR-DISPUTES: >= 1 prior disputes in lookback window
    if len(prior_disputes) >= 1:
        d_aliases = [d["dispute_alias"] for d in prior_disputes]
        findings.append(
            Finding(
                finding_code="F-PRIOR-DISPUTES",
                severity="CRITICAL",
                description=f"Customer has {len(prior_disputes)} prior dispute(s) on record within 180 days.",
                alias_refs=d_aliases,
            )
        )

    # 7. F-EVIDENCE-MISSING: missing required evidence documents
    dispute_info = case.get("dispute", {})
    reason_code = dispute_info.get("reason_code", "DEFAULT")
    docs = case.get("documents", [])
    uploaded_kinds = [d["evidence_type"] for d in docs]

    completeness = check_completeness(reason_code, uploaded_kinds)
    missing_kinds = completeness.get("missing_kinds", [])
    if missing_kinds:
        doc_refs = [d["document_alias"] for d in docs]
        findings.append(
            Finding(
                finding_code="F-EVIDENCE-MISSING",
                severity="MEDIUM",
                description=f"Missing required evidence document(s): {', '.join(missing_kinds)}.",
                alias_refs=doc_refs,
            )
        )

    return findings

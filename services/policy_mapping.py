"""
Policy Action to Severity and Suggested Action Mapping (Phase C7).

Source of truth: 01-brief.md section 4.
Rules:
- Severity is derived directly and deterministically from the policy action.
- It can never disagree with the action.
- Policy actions: BLOCK, STEP_UP_VERIFICATION, ALLOW_WITH_MONITORING, ALLOW.
"""

from typing import Dict, Any, NamedTuple


class PolicyOutcome(NamedTuple):
    action: str
    severity: str
    suggested_action: str
    money_path_effect: str


POLICY_ACTION_MAP: Dict[str, PolicyOutcome] = {
    "BLOCK": PolicyOutcome(
        action="BLOCK",
        severity="critical",
        suggested_action="manual_review",
        money_path_effect="Capture held until merchant decides",
    ),
    "STEP_UP_VERIFICATION": PolicyOutcome(
        action="STEP_UP_VERIFICATION",
        severity="warning",
        suggested_action="step_up_verify",
        money_path_effect="Merchant prompt shown; capture waits",
    ),
    "ALLOW_WITH_MONITORING": PolicyOutcome(
        action="ALLOW_WITH_MONITORING",
        severity="info",
        suggested_action="allow",
        money_path_effect="Capture proceeds; transaction flagged for log monitoring",
    ),
    "ALLOW": PolicyOutcome(
        action="ALLOW",
        severity="none",
        suggested_action="allow",
        money_path_effect="Capture proceeds immediately without friction",
    ),
}


def map_policy_action(action: str) -> Dict[str, str]:
    """
    Maps policy action to severity and suggested_action.
    Raises ValueError on unrecognized action.
    """
    normalized = action.strip().upper()
    if normalized not in POLICY_ACTION_MAP:
        raise ValueError(
            f"Unrecognized policy action: '{action}'. Must be one of: {list(POLICY_ACTION_MAP.keys())}"
        )
    outcome = POLICY_ACTION_MAP[normalized]
    return {
        "policy_action": outcome.action,
        "severity": outcome.severity,
        "suggested_action": outcome.suggested_action,
        "money_path_effect": outcome.money_path_effect,
    }


def evaluate_policy_contract(
    probability: float,
    amount: float,
    decision_threshold: float = 0.40,
    critical_threshold: float = 0.80,
    low_max_threshold: float = 0.15,
    large_amount_cutoff: float = 25_000.0,
) -> Dict[str, Any]:
    """
    Evaluates the verified 5-rule policy in strict priority order (01-brief.md section 3.1)
    and attaches deterministic severity and suggested action.
    """
    p = float(probability)
    amt = float(amount)

    # 1. CRITICAL_BLOCK: probability >= 0.80
    if p >= critical_threshold:
        rule_id = "CRITICAL_BLOCK"
        action = "BLOCK"
        reason = (
            f"Fraud probability ({p:.4f}) is at or above blocking boundary "
            f"({critical_threshold:.2f})."
        )
    # 2. HIGH_STEP_UP: probability >= decision_threshold (0.40)
    elif p >= decision_threshold:
        rule_id = "HIGH_STEP_UP"
        action = "STEP_UP_VERIFICATION"
        reason = (
            f"Fraud probability ({p:.4f}) is at or above decision threshold "
            f"({decision_threshold:.2f})."
        )
    # 3. MEDIUM_AMOUNT_ESCALATION: probability >= 0.15 and amount >= cutoff
    elif p >= low_max_threshold and amt >= large_amount_cutoff:
        rule_id = "MEDIUM_AMOUNT_ESCALATION"
        action = "STEP_UP_VERIFICATION"
        reason = (
            f"Fraud probability ({p:.4f}) is elevated and amount "
            f"(Rs{amt:,.0f} >= Rs{large_amount_cutoff:,.0f}) justifies verification."
        )
    # 4. MEDIUM_MONITOR: probability >= 0.15
    elif p >= low_max_threshold:
        rule_id = "MEDIUM_MONITOR"
        action = "ALLOW_WITH_MONITORING"
        reason = (
            f"Fraud probability ({p:.4f}) is elevated above baseline ({low_max_threshold:.2f}); "
            f"flagged for monitoring."
        )
    # 5. LOW_ALLOW: otherwise
    else:
        rule_id = "LOW_ALLOW"
        action = "ALLOW"
        reason = f"Fraud probability ({p:.4f}) is below {low_max_threshold:.2f}."

    mapping = map_policy_action(action)
    return {
        "probability": p,
        "amount": amt,
        "policy_rule": rule_id,
        "policy_action": action,
        "policy_reason": reason,
        "severity": mapping["severity"],
        "suggested_action": mapping["suggested_action"],
        "money_path_effect": mapping["money_path_effect"],
    }

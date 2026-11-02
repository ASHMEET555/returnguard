"""
Unit tests for policy action to severity and suggested action mapping (Phase C7).
Verifies:
1. Every row of the 01-brief.md section 4 mapping table.
2. Boundary behavior at probability 0.15, 0.40, 0.80.
3. Boundary behavior at large amount threshold (Rs25,000).
4. Strict priority rule order.
5. Error handling on unknown actions.
"""

import pytest
from services.policy_mapping import (
    map_policy_action,
    evaluate_policy_contract,
    POLICY_ACTION_MAP,
)


def test_mapping_table_rows():
    """Verify all 4 rows match 01-brief.md section 4 exactly."""
    # Row 1: BLOCK -> critical, manual_review
    res = map_policy_action("BLOCK")
    assert res["severity"] == "critical"
    assert res["suggested_action"] == "manual_review"

    # Row 2: STEP_UP_VERIFICATION -> warning, step_up_verify
    res = map_policy_action("STEP_UP_VERIFICATION")
    assert res["severity"] == "warning"
    assert res["suggested_action"] == "step_up_verify"

    # Row 3: ALLOW_WITH_MONITORING -> info, allow
    res = map_policy_action("ALLOW_WITH_MONITORING")
    assert res["severity"] == "info"
    assert res["suggested_action"] == "allow"

    # Row 4: ALLOW -> none, allow
    res = map_policy_action("ALLOW")
    assert res["severity"] == "none"
    assert res["suggested_action"] == "allow"


def test_invalid_action_raises():
    """Unrecognized action must raise ValueError."""
    with pytest.raises(ValueError, match="Unrecognized policy action"):
        map_policy_action("UNKNOWN_ACTION")


def test_policy_boundary_p_0_80():
    """Probability >= 0.80 must trigger CRITICAL_BLOCK -> BLOCK regardless of amount."""
    # Exactly at boundary
    res = evaluate_policy_contract(0.80, amount=100.0)
    assert res["policy_rule"] == "CRITICAL_BLOCK"
    assert res["policy_action"] == "BLOCK"
    assert res["severity"] == "critical"
    assert res["suggested_action"] == "manual_review"

    # High amount at boundary
    res_high = evaluate_policy_contract(0.80, amount=100_000.0)
    assert res_high["policy_rule"] == "CRITICAL_BLOCK"
    assert res_high["policy_action"] == "BLOCK"

    # Just below boundary (0.7999) -> HIGH_STEP_UP
    res_below = evaluate_policy_contract(0.7999, amount=100.0)
    assert res_below["policy_rule"] == "HIGH_STEP_UP"
    assert res_below["policy_action"] == "STEP_UP_VERIFICATION"


def test_policy_boundary_p_0_40():
    """Probability in [0.40, 0.80) triggers HIGH_STEP_UP."""
    # Exactly at boundary
    res = evaluate_policy_contract(0.40, amount=10.0)
    assert res["policy_rule"] == "HIGH_STEP_UP"
    assert res["policy_action"] == "STEP_UP_VERIFICATION"
    assert res["severity"] == "warning"
    assert res["suggested_action"] == "step_up_verify"

    # Just below boundary (0.3999) with low amount -> MEDIUM_MONITOR
    res_below = evaluate_policy_contract(0.3999, amount=10.0)
    assert res_below["policy_rule"] == "MEDIUM_MONITOR"
    assert res_below["policy_action"] == "ALLOW_WITH_MONITORING"
    assert res_below["severity"] == "info"


def test_policy_boundary_amount_escalation():
    """Probability in [0.15, 0.40) and amount >= 25,000 triggers MEDIUM_AMOUNT_ESCALATION."""
    # At boundary p=0.15, amount=25,000 -> STEP_UP_VERIFICATION
    res = evaluate_policy_contract(0.15, amount=25_000.0)
    assert res["policy_rule"] == "MEDIUM_AMOUNT_ESCALATION"
    assert res["policy_action"] == "STEP_UP_VERIFICATION"
    assert res["severity"] == "warning"

    # p=0.15, amount=24,999.99 -> MEDIUM_MONITOR
    res_just_below = evaluate_policy_contract(0.15, amount=24_999.99)
    assert res_just_below["policy_rule"] == "MEDIUM_MONITOR"
    assert res_just_below["policy_action"] == "ALLOW_WITH_MONITORING"
    assert res_just_below["severity"] == "info"

    # High amount with p < 0.15 does NOT escalate (LOW_ALLOW takes precedence)
    res_low_p = evaluate_policy_contract(0.1499, amount=100_000.0)
    assert res_low_p["policy_rule"] == "LOW_ALLOW"
    assert res_low_p["policy_action"] == "ALLOW"
    assert res_low_p["severity"] == "none"


def test_policy_boundary_p_0_15():
    """Probability < 0.15 triggers LOW_ALLOW -> ALLOW."""
    res = evaluate_policy_contract(0.1499, amount=500.0)
    assert res["policy_rule"] == "LOW_ALLOW"
    assert res["policy_action"] == "ALLOW"
    assert res["severity"] == "none"
    assert res["suggested_action"] == "allow"

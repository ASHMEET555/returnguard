"""
Tests for spike_velocity rule and policy non-interference.

Verifies:
1. Clean fixture does not trigger spike_velocity.
2. Burst fixture triggers spike_velocity with evidence bundle.
3. The spike_velocity rule firing does not alter the decision engine's policy action.
"""

import pytest
from rules.engine import SpikeRuleEngine, evaluate_spike_rules
from ml.evaluation.decision_engine import make_decision


def test_clean_fixture_does_not_hit():
    """Traffic within normal bounds produces zero spike rule hits."""
    clean_context = {
        "velocity_5min": 0,
        "velocity_30min": 1,
        "velocity_60min": 1,
    }
    hits, evidence = evaluate_spike_rules(clean_context)
    assert hits == []
    assert "spike_velocity" not in evidence


def test_burst_fixture_hits_spike_velocity():
    """Burst traffic exceeding 99th percentile triggers spike_velocity."""
    burst_context = {
        "velocity_5min": 2,
        "velocity_30min": 4,
        "velocity_60min": 5,
    }
    hits, evidence = evaluate_spike_rules(burst_context)
    assert "spike_velocity" in hits
    assert "spike_velocity" in evidence
    ev = evidence["spike_velocity"]
    assert ev["velocity_5min"] == 2
    assert "velocity_5min" in ev["triggered_by"]
    assert "velocity_30min" in ev["triggered_by"]
    assert "velocity_60min" in ev["triggered_by"]


def test_spike_velocity_does_not_change_policy_action():
    """
    INVARIANT: The spike_velocity rule provides evidence only.
    It does not determine, override, or mutate the decision engine's policy action.
    """
    prob = 0.25
    amt = 1500.0

    # Decision without rule
    clean_context = {"velocity_5min": 0, "velocity_30min": 0, "velocity_60min": 0}
    clean_hits, _ = evaluate_spike_rules(clean_context)
    decision_clean = make_decision("txn_clean", prob, amt)

    # Decision with burst triggering spike_velocity
    burst_context = {"velocity_5min": 5, "velocity_30min": 10, "velocity_60min": 12}
    burst_hits, burst_evidence = evaluate_spike_rules(burst_context)
    decision_burst = make_decision("txn_burst", prob, amt)

    assert clean_hits == []
    assert burst_hits == ["spike_velocity"]

    # Policy action and rule ID must be completely identical regardless of rule hit
    assert decision_clean.action == decision_burst.action
    assert decision_clean.policy_rule_id == decision_burst.policy_rule_id
    assert decision_clean.fraud_probability == decision_burst.fraud_probability

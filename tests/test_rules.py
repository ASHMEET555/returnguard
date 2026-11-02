"""Unit tests for rules engine."""

from rules.engine import SpikeRuleEngine, evaluate_spike_rules


def test_clean_fixture_triggers_no_rules():
    """Verify clean fixture triggers zero spike rules."""
    clean_context = {
        "order_id": "ord_clean_001",
        "orders_24h": 1,
        "orders_7d": 2,
    }
    hits, evidence = evaluate_spike_rules(clean_context)
    assert hits == []
    assert evidence == {}


def test_velocity_burst_triggers_spike_velocity():
    """Verify velocity spike triggers spike_velocity rule."""
    engine = SpikeRuleEngine()
    burst_context = {
        "order_id": "ord_burst_001",
        "orders_24h": 8,
        "orders_7d": 18,
    }
    hits, evidence = engine.evaluate(burst_context)
    assert "spike_velocity" in hits
    assert "spike_velocity" in evidence
    assert evidence["spike_velocity"]["orders_24h"] == 8
    assert "orders_24h" in evidence["spike_velocity"]["triggered_by"]
    assert "orders_7d" in evidence["spike_velocity"]["triggered_by"]

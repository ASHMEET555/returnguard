"""Unit tests for rules engine."""

from rules.engine import SpikeRuleEngine, evaluate_spike_rules


def test_clean_fixture_triggers_no_rules():
    """Verify clean fixture triggers zero spike rules."""
    clean_context = {
        "order_id": "ord_clean_001",
        "orders_24h": 1,
        "orders_7d": 2,
        "cod_share_7d": 0.50,
        "returns_30d": 0,
        "micro_return_pct_30d": 0.0,
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
        "cod_share_7d": 0.20,
        "returns_30d": 0,
        "micro_return_pct_30d": 0.0,
    }
    hits, evidence = engine.evaluate(burst_context)
    assert "spike_velocity" in hits
    assert "spike_velocity" in evidence
    assert evidence["spike_velocity"]["orders_24h"] == 8
    assert "orders_24h" in evidence["spike_velocity"]["triggered_by"]
    assert "orders_7d" in evidence["spike_velocity"]["triggered_by"]


def test_cod_heavy_burst_triggers_spike_cod_heavy():
    """Verify heavy COD concentration triggers spike_cod_heavy rule."""
    engine = SpikeRuleEngine()
    cod_heavy_context = {
        "order_id": "ord_cod_001",
        "orders_24h": 2,
        "orders_7d": 5,
        "cod_share_7d": 1.0,
        "returns_30d": 0,
        "micro_return_pct_30d": 0.0,
    }
    hits, evidence = engine.evaluate(cod_heavy_context)
    assert "spike_cod_heavy" in hits
    assert "spike_cod_heavy" in evidence
    assert evidence["spike_cod_heavy"]["cod_share_7d"] == 1.0
    assert evidence["spike_cod_heavy"]["orders_7d"] == 5


def test_micro_return_structuring_triggers_spike_micro():
    """Verify high proportion of micro-value returns triggers spike_micro."""
    engine = SpikeRuleEngine()
    micro_context = {
        "order_id": "ord_micro_001",
        "orders_24h": 1,
        "orders_7d": 2,
        "cod_share_7d": 0.0,
        "returns_30d": 4,
        "micro_return_pct_30d": 0.85,
    }
    hits, evidence = engine.evaluate(micro_context)
    assert "spike_micro" in hits
    assert "spike_micro" in evidence
    assert evidence["spike_micro"]["returns_30d"] == 4
    assert evidence["spike_micro"]["micro_return_pct_30d"] == 0.85


def test_multi_rule_burst_fixture():
    """Verify multiple rules can trigger simultaneously on high-risk profile."""
    engine = SpikeRuleEngine()
    extreme_burst = {
        "order_id": "ord_multi_001",
        "orders_24h": 10,
        "orders_7d": 20,
        "cod_share_7d": 0.90,
        "returns_30d": 5,
        "micro_return_pct_30d": 0.80,
    }
    hits, evidence = engine.evaluate(extreme_burst)
    assert set(hits) == {"spike_velocity", "spike_cod_heavy", "spike_micro"}
    assert len(evidence) == 3

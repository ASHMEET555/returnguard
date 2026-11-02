"""Spike rules engine.

Evaluates velocity spike rules against transaction context and produces
rule hits and structured evidence_json.
"""

from pathlib import Path
from typing import Any

import yaml

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent / "config.yaml"


class SpikeRuleEngine:
    """Configurable spike rule evaluator."""

    def __init__(self, config_path: str | Path | None = None):
        path = Path(config_path) if config_path else DEFAULT_CONFIG_PATH
        if not path.exists():
            raise FileNotFoundError(f"Rules config not found at: {path}")
        with open(path, "r", encoding="utf-8") as f:
            self.config: dict[str, Any] = yaml.safe_load(f) or {}

    def evaluate(self, context: dict[str, Any]) -> tuple[list[str], dict[str, Any]]:
        """Evaluate spike rules against given context / features dictionary.

        Returns:
            (rule_hits, evidence_json)
        """
        rule_hits: list[str] = []
        evidence: dict[str, Any] = {}

        # 1. spike_velocity rule
        vel_cfg = self.config.get("spike_velocity", {})
        max_24h = vel_cfg.get("max_orders_24h", 5)
        max_7d = vel_cfg.get("max_orders_7d", 15)

        orders_24h = context.get("orders_24h", 0)
        orders_7d = context.get("orders_7d", 0)

        hit_24h = orders_24h > max_24h
        hit_7d = orders_7d > max_7d

        if hit_24h or hit_7d:
            rule_hits.append("spike_velocity")
            evidence["spike_velocity"] = {
                "orders_24h": orders_24h,
                "max_orders_24h": max_24h,
                "orders_7d": orders_7d,
                "max_orders_7d": max_7d,
                "triggered_by": [
                    k for k, v in [("orders_24h", hit_24h), ("orders_7d", hit_7d)] if v
                ],
            }

        return rule_hits, evidence


def evaluate_spike_rules(
    context: dict[str, Any], config_path: str | Path | None = None
) -> tuple[list[str], dict[str, Any]]:
    """Convenience helper to evaluate spike rules."""
    engine = SpikeRuleEngine(config_path=config_path)
    return engine.evaluate(context)

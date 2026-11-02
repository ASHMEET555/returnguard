"""Spike rules engine.

Evaluates velocity spike rules against transaction context / features and produces
evidence-only rule hits and structured evidence_json.
The rules engine NEVER determines or mutates the policy action.
"""

from pathlib import Path
from typing import Any, Dict, List, Tuple

import yaml

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent / "config.yaml"


class SpikeRuleEngine:
    """Configurable spike rule evaluator (evidence-only)."""

    def __init__(self, config_path: str | Path | None = None):
        path = Path(config_path) if config_path else DEFAULT_CONFIG_PATH
        if not path.exists():
            raise FileNotFoundError(f"Rules config not found at: {path}")
        with open(path, "r", encoding="utf-8") as f:
            self.config: Dict[str, Any] = yaml.safe_load(f) or {}

    def evaluate(self, context: Dict[str, Any]) -> Tuple[List[str], Dict[str, Any]]:
        """Evaluate spike rules against given context / features dictionary.

        Returns:
            (rule_hits, evidence_json)
        """
        rule_hits: List[str] = []
        evidence: Dict[str, Any] = {}

        vel_cfg = self.config.get("spike_velocity", {})
        max_5min = vel_cfg.get("max_velocity_5min", 0)
        max_30min = vel_cfg.get("max_velocity_30min", 1)
        max_60min = vel_cfg.get("max_velocity_60min", 1)

        v5 = context.get("velocity_5min", 0)
        v30 = context.get("velocity_30min", 0)
        v60 = context.get("velocity_60min", 0)

        hit_5min = v5 > max_5min
        hit_30min = v30 > max_30min
        hit_60min = v60 > max_60min

        # Backward compatibility with legacy order count keys if present
        max_24h = vel_cfg.get("max_orders_24h")
        max_7d = vel_cfg.get("max_orders_7d")
        orders_24h = context.get("orders_24h", 0)
        orders_7d = context.get("orders_7d", 0)
        hit_legacy_24h = (max_24h is not None) and (orders_24h > max_24h)
        hit_legacy_7d = (max_7d is not None) and (orders_7d > max_7d)

        if hit_5min or hit_30min or hit_60min or hit_legacy_24h or hit_legacy_7d:
            rule_hits.append("spike_velocity")
            triggered = []
            if hit_5min:
                triggered.append("velocity_5min")
            if hit_30min:
                triggered.append("velocity_30min")
            if hit_60min:
                triggered.append("velocity_60min")
            if hit_legacy_24h:
                triggered.append("orders_24h")
            if hit_legacy_7d:
                triggered.append("orders_7d")

            evidence["spike_velocity"] = {
                "velocity_5min": v5,
                "max_velocity_5min": max_5min,
                "velocity_30min": v30,
                "max_velocity_30min": max_30min,
                "velocity_60min": v60,
                "max_velocity_60min": max_60min,
                "orders_24h": orders_24h,
                "orders_7d": orders_7d,
                "triggered_by": triggered,
            }

        return rule_hits, evidence


def evaluate_spike_rules(
    context: Dict[str, Any], config_path: str | Path | None = None
) -> Tuple[List[str], Dict[str, Any]]:
    """Convenience helper to evaluate spike rules."""
    engine = SpikeRuleEngine(config_path=config_path)
    return engine.evaluate(context)

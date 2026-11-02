"""Spike rules engine.

Evaluates velocity, COD-heavy, and micro-return rules against order
features or context and produces rule hits and structured evidence_json.
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

        # 2. spike_cod_heavy rule
        cod_cfg = self.config.get("spike_cod_heavy", {})
        min_orders_7d = cod_cfg.get("min_orders_7d", 3)
        cod_share_thresh = cod_cfg.get("cod_share_threshold", 0.80)

        cod_share_7d = context.get("cod_share_7d", 0.0)

        if orders_7d >= min_orders_7d and cod_share_7d >= cod_share_thresh:
            rule_hits.append("spike_cod_heavy")
            evidence["spike_cod_heavy"] = {
                "orders_7d": orders_7d,
                "min_orders_7d": min_orders_7d,
                "cod_share_7d": cod_share_7d,
                "cod_share_threshold": cod_share_thresh,
            }

        # 3. spike_micro rule
        micro_cfg = self.config.get("spike_micro", {})
        min_returns_30d = micro_cfg.get("min_returns_30d", 3)
        micro_pct_thresh = micro_cfg.get("micro_return_pct_threshold", 0.60)
        max_micro_val = micro_cfg.get("max_micro_order_value", 300)

        # Support both returns_30d and returns_7d / return counts
        returns_30d = context.get(
            "returns_30d",
            context.get("returns_7d", context.get("cust_return_count", 0)),
        )
        micro_return_pct_30d = context.get("micro_return_pct_30d", 0.0)

        if returns_30d >= min_returns_30d and micro_return_pct_30d >= micro_pct_thresh:
            rule_hits.append("spike_micro")
            evidence["spike_micro"] = {
                "returns_30d": returns_30d,
                "min_returns_30d": min_returns_30d,
                "micro_return_pct_30d": micro_return_pct_30d,
                "micro_return_pct_threshold": micro_pct_thresh,
                "max_micro_order_value": max_micro_val,
            }

        return rule_hits, evidence


def evaluate_spike_rules(
    context: dict[str, Any], config_path: str | Path | None = None
) -> tuple[list[str], dict[str, Any]]:
    """Helper function to evaluate spike rules."""
    engine = SpikeRuleEngine(config_path=config_path)
    return engine.evaluate(context)

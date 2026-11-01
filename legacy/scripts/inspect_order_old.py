"""CLI script to inspect point-in-time features and rule hits for sample orders.

Usage:
    python scripts/inspect_order.py <order_id>
    python -m scripts.inspect_order [--order-id ORD_ID]
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

# Ensure project root is in sys.path when script is executed directly
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import pandas as pd

from features.builder import MODEL_INPUT_NAMES, FeatureBuilder
from rings.builder import RingMembershipStore
from rules.engine import SpikeRuleEngine


def inspect_order(
    order_id: str | None = None,
    dataset_path: str = "data/processed/train.parquet",
) -> None:
    """Inspect and print features, rule hits, and ring membership for order(s)."""
    p = Path(dataset_path)
    if not p.exists():
        print(f"Dataset file not found at: {dataset_path}")
        return

    df = pd.read_parquet(p)
    engine = SpikeRuleEngine()
    ring_store = RingMembershipStore()

    if order_id:
        target_rows = df[df["order_id"] == order_id]
        if target_rows.empty:
            print(f"Order ID not found in dataset: {order_id}")
            return
    else:
        # Pick one sample COD order with rule hits if available, and one sample PayPal order
        cod_orders = df[df["channel"] == "cod"]
        paypal_orders = df[df["channel"] == "paypal"]

        burst_cod = cod_orders[cod_orders["orders_24h"] >= 4]
        sample_cod = (
            burst_cod.iloc[0:1] if not burst_cod.empty else cod_orders.iloc[0:1]
        )
        sample_paypal = paypal_orders.iloc[0:1]
        target_rows = pd.concat([sample_cod, sample_paypal], ignore_index=True)

    print("=" * 80)
    print("ReturnGuard -- Order Risk & Feature Inspection (Phase B)")
    print("=" * 80)

    # Initialize builder to ensure dictionary verification
    _ = FeatureBuilder(ring_store=ring_store)

    for _, row in target_rows.iterrows():
        ctx: dict[str, Any] = row.to_dict()
        curr_id = ctx.get("order_id", "unknown")
        channel = ctx.get("channel", "unknown")
        val = ctx.get("order_value", 0.0)
        ot = ctx.get("order_time", "")

        # 1. Evaluate spike rules
        rule_hits, evidence = engine.evaluate(ctx)

        # 2. Extract the 18 model inputs
        model_inputs = {k: ctx.get(k, 0.0) for k in MODEL_INPUT_NAMES}

        print(f"\nOrder ID:    {curr_id}")
        print(f"Channel:     {channel.upper()}")
        print(f"Order Value: INR {val:,.2f}")
        print(f"Order Time:  {ot}")
        print("-" * 50)
        print("Spike Rule Evaluation:")
        if rule_hits:
            print(f"  Rule Hits: {rule_hits}")
            print("  Evidence:")
            for rname, rev in evidence.items():
                print(f"    - {rname}: {json.dumps(rev)}")
        else:
            print("  Rule Hits: [] (No spike thresholds triggered)")

        print("-" * 50)
        print("Model Inputs (18 features):")
        for idx, (fname, fval) in enumerate(model_inputs.items(), 1):
            if isinstance(fval, float):
                val_str = f"{fval:.4f}"
            else:
                val_str = str(fval)
            print(f"  {idx:2d}. {fname:<26}: {val_str}")

        print("-" * 50)
        print("Abuse Ring Sentinel:")
        print(f"  Shared Address Accounts: {ctx.get('shared_address_accounts', 1)}")
        print(f"  Ring Size:               {ctx.get('ring_size', 1)}")
        print(f"  Ring Return Rate:        {ctx.get('ring_return_rate', 0.0):.4f}")
        print("=" * 80)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Inspect features and rule hits for sample ReturnGuard orders."
    )
    parser.add_argument(
        "order_id_pos",
        nargs="?",
        default=None,
        help="Order ID to inspect (positional)",
    )
    parser.add_argument(
        "--order-id",
        type=str,
        default=None,
        help="Specific order_id to inspect",
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default="data/processed/train.parquet",
        help="Path to parquet dataset",
    )
    args = parser.parse_args()
    target_id = args.order_id or args.order_id_pos
    inspect_order(order_id=target_id, dataset_path=args.dataset)


if __name__ == "__main__":
    main()

"""ReturnGuard dataset generator and Parquet exporter.

Generates complete synthetic universe with 7 abuse archetypes,
computes point-in-time features without leakage,
applies customer-level holdout and temporal split,
and exports reproducible train, val, and test parquet datasets.
"""

import datetime
import hashlib
import json
import os
from typing import Any

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from data.generator.abuse_injectors import (
    inject_address_farm_ring,
    inject_clean_loyal_prepaid,
    inject_high_value_first_order,
    inject_paypal_dispute_legit_control,
    inject_paypal_refund_after_delivery,
    inject_serial_rto,
    inject_velocity_spike,
)
from data.generator.seed import DEFAULT_SEED, get_rng
from data.generator.world import (
    SyntheticLabel,
    SyntheticOrder,
    generate_addresses,
    generate_baseline_orders,
    generate_customers,
    generate_devices,
    generate_merchants,
)

GENERATOR_VERSION = "1.0.0"


def compute_point_in_time_features(
    orders: list[SyntheticOrder],
    labels: list[SyntheticLabel],
    addresses_map: dict[str, Any],
    devices_map: dict[str, Any],
    customers_map: dict[str, Any],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Compute point-in-time feature vectors strictly as of order_time.

    Guarantees no future leakage: only outcomes where outcome_time < current order_time
    are observable in customer history or aggregate statistics.
    """
    # Sort orders chronologically
    sorted_pairs = sorted(zip(orders, labels), key=lambda x: (x[0].order_time, x[0].id))
    sorted_orders = [p[0] for p in sorted_pairs]
    sorted_labels = [p[1] for p in sorted_pairs]

    feature_rows = []
    label_rows = []

    # Historical state tracking
    completed_orders_by_cust: dict[str, list[dict]] = {}
    orders_by_cust: dict[str, list[datetime.datetime]] = {}
    completed_orders_by_ring: dict[str, list[dict]] = {}

    # Pre-index graph edges for rings
    address_to_custs: dict[str, set[str]] = {}
    device_to_custs: dict[str, set[str]] = {}
    phone_to_custs: dict[str, set[str]] = {}

    for c_id, cust in customers_map.items():
        phone_to_custs.setdefault(cust.phone, set()).add(c_id)
    for c_id, addr in addresses_map.items():
        address_to_custs.setdefault(addr.normalized_hash, set()).add(c_id)
    for c_id, dev in devices_map.items():
        device_to_custs.setdefault(dev.device_hash, set()).add(c_id)

    # Map order_id to outcome for quick lookup
    label_map = {lbl.order_id: lbl for lbl in sorted_labels}

    for order in sorted_orders:
        as_of = order.order_time
        cid = order.customer_id
        addr = addresses_map[cid]
        dev = devices_map[cid]
        cust = customers_map[cid]

        # 1. Update historical completed outcomes up to as_of
        # Any prior order whose outcome_time < as_of is now known
        cust_history = completed_orders_by_cust.get(cid, [])
        known_history = [o for o in cust_history if o["outcome_time"] < as_of]

        prior_order_count = len(known_history)
        prior_rto_count = sum(
            1 for o in known_history if o["y"] == 1 and o["channel"] == "cod"
        )
        prior_cod_count = sum(1 for o in known_history if o["channel"] == "cod")
        prior_returns = sum(1 for o in known_history if o["y"] == 1)
        prior_refunds = sum(
            1 for o in known_history if o["y"] == 1 and o["channel"] == "paypal"
        )
        prior_paypal_count = sum(1 for o in known_history if o["channel"] == "paypal")

        cust_rto_rate = (
            round(prior_rto_count / prior_cod_count, 4) if prior_cod_count > 0 else 0.0
        )
        cust_return_rate = (
            round(prior_returns / prior_order_count, 4)
            if prior_order_count > 0
            else 0.0
        )
        cust_refund_rate = (
            round(prior_refunds / prior_paypal_count, 4)
            if prior_paypal_count > 0
            else 0.0
        )
        cust_dispute_count = prior_refunds

        # Days since last RTO
        rto_dates = [o["outcome_time"] for o in known_history if o["y"] == 1]
        if rto_dates:
            last_rto_time = max(rto_dates)
            days_since_last_rto = round(
                (as_of - last_rto_time).total_seconds() / 86400.0, 1
            )
        else:
            days_since_last_rto = 999.0  # None/inf sentinel

        # Consecutive non-RTO streak
        streak = 0
        for o in reversed(known_history):
            if o["y"] == 0:
                streak += 1
            else:
                break
        successful_delivery_streak = streak

        # Customer AOV comparison
        if known_history:
            cust_aov = sum(o["order_value"] for o in known_history) / len(known_history)
            order_value_vs_cust_avg = round(order.order_value / max(1.0, cust_aov), 3)
        else:
            order_value_vs_cust_avg = 1.0

        # Is new address for this customer
        prior_addr_count = sum(
            1 for o in known_history if o["address_id"] == order.address_id
        )
        is_new_address = 1 if prior_addr_count == 0 else 0

        # Velocity features across customer orders
        past_order_times = orders_by_cust.get(cid, [])
        orders_24h = sum(
            1
            for t in past_order_times
            if as_of - datetime.timedelta(hours=24) <= t < as_of
        )
        orders_7d = sum(
            1
            for t in past_order_times
            if as_of - datetime.timedelta(days=7) <= t < as_of
        )

        recent_returns_7d = sum(
            1
            for o in known_history
            if o["y"] == 1
            and (as_of - datetime.timedelta(days=7) <= o["outcome_time"] < as_of)
        )
        recent_refunds_7d = sum(
            1
            for o in known_history
            if o["y"] == 1
            and o["channel"] == "paypal"
            and (as_of - datetime.timedelta(days=7) <= o["outcome_time"] < as_of)
        )

        recent_orders_7d_list = [
            o
            for o in known_history
            if as_of - datetime.timedelta(days=7) <= o["order_time"] < as_of
        ]
        cod_in_7d = sum(1 for o in recent_orders_7d_list if o["channel"] == "cod")
        cod_share_7d = round(cod_in_7d / max(1, len(recent_orders_7d_list)), 3)

        # Micro returns in 30d
        returns_30d = [
            o
            for o in known_history
            if o["y"] == 1
            and (as_of - datetime.timedelta(days=30) <= o["outcome_time"] < as_of)
        ]
        micro_returns_30d = sum(1 for o in returns_30d if o["order_value"] <= 300.0)
        micro_return_pct_30d = (
            round(micro_returns_30d / max(1, len(returns_30d)), 3)
            if returns_30d
            else 0.0
        )

        # Ring / Shared entity features
        shared_phone = len(phone_to_custs.get(cust.phone, set()))
        shared_addr = len(address_to_custs.get(addr.normalized_hash, set()))
        shared_dev = len(device_to_custs.get(dev.device_hash, set()))
        ring_size = max(shared_phone, shared_addr, shared_dev)

        ring_key = addr.normalized_hash
        ring_hist = completed_orders_by_ring.get(ring_key, [])
        known_ring_hist = [o for o in ring_hist if o["outcome_time"] < as_of]
        if known_ring_hist:
            ring_return_rate = round(
                sum(o["y"] for o in known_ring_hist) / len(known_ring_hist), 4
            )
        else:
            ring_return_rate = addr.base_rto_rate

        # Payment features
        payment_authorized = 1 if order.channel == "paypal" else 0
        payment_captured = 1 if order.channel == "paypal" else 0
        order_to_payment_ratio = 1.0

        feature_row = {
            "order_id": order.id,
            "customer_id": cid,
            "order_time": order.order_time.isoformat(),
            "channel": order.channel,
            "is_cod": order.is_cod,
            "order_value": order.order_value,
            "order_value_vs_cust_avg": order_value_vs_cust_avg,
            "item_count": order.item_count,
            "category_risk": order.category_risk,
            "checkout_speed_sec": order.checkout_speed_sec,
            "payment_authorized": payment_authorized,
            "payment_captured": payment_captured,
            "order_to_payment_ratio": order_to_payment_ratio,
            "cust_order_count": prior_order_count,
            "cust_rto_rate": cust_rto_rate,
            "cust_return_rate": cust_return_rate,
            "cust_refund_rate": cust_refund_rate,
            "cust_dispute_count": cust_dispute_count,
            "days_since_last_rto": days_since_last_rto,
            "successful_delivery_streak": successful_delivery_streak,
            "address_completeness": addr.completeness,
            "pincode_rto_rate": addr.base_rto_rate,
            "is_new_address": is_new_address,
            "orders_24h": orders_24h,
            "orders_7d": orders_7d,
            "returns_7d": recent_returns_7d,
            "refunds_7d": recent_refunds_7d,
            "cod_share_7d": cod_share_7d,
            "micro_return_pct_30d": micro_return_pct_30d,
            "shared_phone_accounts": shared_phone,
            "shared_address_accounts": shared_addr,
            "shared_device_accounts": shared_dev,
            "ring_size": ring_size,
            "ring_return_rate": ring_return_rate,
        }
        feature_rows.append(feature_row)

        lbl = label_map[order.id]
        label_row = {
            "order_id": order.id,
            "channel": order.channel,
            "y": lbl.y,
            "outcome_type": lbl.outcome_type,
            "outcome_time": lbl.outcome_time.isoformat(),
            "label_delay_days": lbl.label_delay_days,
            "loss_amount": 180.0
            if (lbl.y == 1 and order.channel == "cod")
            else (450.0 if lbl.y == 1 else 0.0),
        }
        label_rows.append(label_row)

        # Update historical state for future iterations
        orders_by_cust.setdefault(cid, []).append(as_of)
        order_record = {
            "order_id": order.id,
            "customer_id": cid,
            "address_id": order.address_id,
            "channel": order.channel,
            "order_value": order.order_value,
            "order_time": as_of,
            "outcome_time": lbl.outcome_time,
            "y": lbl.y,
        }
        completed_orders_by_cust.setdefault(cid, []).append(order_record)
        completed_orders_by_ring.setdefault(ring_key, []).append(order_record)

    df_features = pd.DataFrame(feature_rows)
    df_labels = pd.DataFrame(label_rows)
    return df_features, df_labels


def generate_dataset(
    seed: int = DEFAULT_SEED,
    output_dir: str = "data/processed",
) -> dict[str, Any]:
    """Execute full data generation pipeline and export parquet files."""
    rng = get_rng(seed)

    # 1. Base entities
    merchants = generate_merchants(rng, n=1)
    merchant_id = merchants[0].id
    customers = generate_customers(rng, merchant_id=merchant_id, n_customers=1000)
    addresses = generate_addresses(rng, customers)
    devices = generate_devices(rng, customers)

    cust_map = {c.id: c for c in customers}
    addr_map = {a.customer_id: a for a in addresses}
    dev_map = {d.customer_id: d for d in devices}

    # 2. Designate pure customer holdout (15% of customers, exactly 150)
    all_cust_ids = sorted([c.id for c in customers])
    holdout_cust_ids = set(rng.choice(all_cust_ids, size=150, replace=False))

    # 3. Simulate baseline orders
    orders, _payments, _shipments, labels = generate_baseline_orders(
        rng, merchant_id, customers, addresses, devices, n_orders=3200
    )
    current_order_idx = len(orders)

    # 4. Inject 7 abuse archetypes
    # COD Archetypes
    o1, _p1, _s1, l1, current_order_idx = inject_serial_rto(
        rng, merchant_id, customers, addresses, devices, current_order_idx
    )
    o2, _p2, _s2, l2, current_order_idx = inject_address_farm_ring(
        rng, merchant_id, customers, addresses, devices, current_order_idx
    )
    o3, _p3, _s3, l3, current_order_idx = inject_velocity_spike(
        rng, merchant_id, customers, addresses, devices, current_order_idx
    )
    o4, _p4, _s4, l4, current_order_idx = inject_high_value_first_order(
        rng, merchant_id, customers, addresses, devices, current_order_idx
    )
    o5, _p5, _s5, l5, current_order_idx = inject_clean_loyal_prepaid(
        rng, merchant_id, customers, addresses, devices, current_order_idx
    )

    # PayPal Archetypes
    o6, _p6, _s6, l6, current_order_idx = inject_paypal_refund_after_delivery(
        rng, merchant_id, customers, addresses, devices, current_order_idx
    )
    o7, _p7, _s7, l7, current_order_idx = inject_paypal_dispute_legit_control(
        rng, merchant_id, customers, addresses, devices, current_order_idx
    )

    all_orders = orders + o1 + o2 + o3 + o4 + o5 + o6 + o7
    all_labels = labels + l1 + l2 + l3 + l4 + l5 + l6 + l7

    # 5. Point-in-time featurization
    df_features, df_labels = compute_point_in_time_features(
        all_orders, all_labels, addr_map, dev_map, cust_map
    )

    # 6. Apply customer holdout & temporal split
    # Separate holdout customer orders
    is_holdout = df_features["customer_id"].isin(holdout_cust_ids)

    df_non_holdout = df_features[~is_holdout].copy()
    df_holdout = df_features[is_holdout].copy()

    # Sort non-holdout by order_time
    df_non_holdout = df_non_holdout.sort_values(
        by=["order_time", "order_id"]
    ).reset_index(drop=True)

    n_non_holdout = len(df_non_holdout)
    train_end_idx = int(n_non_holdout * 0.70)
    val_end_idx = int(n_non_holdout * 0.85)

    df_train = df_non_holdout.iloc[:train_end_idx].copy()
    df_val = df_non_holdout.iloc[train_end_idx:val_end_idx].copy()
    df_test_temporal = df_non_holdout.iloc[val_end_idx:].copy()

    # Test split combines temporal tail + 100% of pure customer holdout orders
    df_test = pd.concat([df_test_temporal, df_holdout], ignore_index=True)
    df_test = df_test.sort_values(by=["order_time", "order_id"]).reset_index(drop=True)

    t0_split = df_train["order_time"].max()
    t1_split = df_val["order_time"].max()

    # Align labels
    labels_by_order = df_labels.set_index("order_id")

    df_train_labels = labels_by_order.loc[df_train["order_id"]].reset_index()
    df_val_labels = labels_by_order.loc[df_val["order_id"]].reset_index()
    df_test_labels = labels_by_order.loc[df_test["order_id"]].reset_index()

    os.makedirs(output_dir, exist_ok=True)

    # Export Parquet with deterministic settings
    def write_parquet(df: pd.DataFrame, path: str):
        table = pa.Table.from_pandas(df, preserve_index=False)
        pq.write_table(
            table,
            path,
            compression="snappy",
            version="2.6",
            write_statistics=True,
        )

    paths = {
        "train": os.path.join(output_dir, "train.parquet"),
        "train_labels": os.path.join(output_dir, "train_labels.parquet"),
        "val": os.path.join(output_dir, "val.parquet"),
        "val_labels": os.path.join(output_dir, "val_labels.parquet"),
        "test": os.path.join(output_dir, "test.parquet"),
        "test_labels": os.path.join(output_dir, "test_labels.parquet"),
    }

    write_parquet(df_train, paths["train"])
    write_parquet(df_train_labels, paths["train_labels"])
    write_parquet(df_val, paths["val"])
    write_parquet(df_val_labels, paths["val_labels"])
    write_parquet(df_test, paths["test"])
    write_parquet(df_test_labels, paths["test_labels"])

    # Compute SHA-256 hashes
    def file_hash(filepath: str) -> str:
        h = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()

    file_hashes = {k: file_hash(v) for k, v in paths.items()}

    manifest = {
        "generator_version": GENERATOR_VERSION,
        "seed": seed,
        "generated_at": datetime.datetime.now(datetime.UTC).isoformat(),
        "total_orders": len(df_features),
        "split_summary": {
            "train_rows": len(df_train),
            "val_rows": len(df_val),
            "test_rows": len(df_test),
            "t0_split": t0_split,
            "t1_split": t1_split,
            "held_out_customer_count": len(holdout_cust_ids),
            "held_out_customer_ids": sorted(holdout_cust_ids),
        },
        "channel_positive_rates": {
            "train": {
                "overall": float(df_train_labels["y"].mean()),
                "cod": float(
                    df_train_labels[df_train_labels["channel"] == "cod"]["y"].mean()
                ),
                "paypal": float(
                    df_train_labels[df_train_labels["channel"] == "paypal"]["y"].mean()
                ),
            },
            "val": {
                "overall": float(df_val_labels["y"].mean()),
                "cod": float(
                    df_val_labels[df_val_labels["channel"] == "cod"]["y"].mean()
                ),
                "paypal": float(
                    df_val_labels[df_val_labels["channel"] == "paypal"]["y"].mean()
                ),
            },
            "test": {
                "overall": float(df_test_labels["y"].mean()),
                "cod": float(
                    df_test_labels[df_test_labels["channel"] == "cod"]["y"].mean()
                ),
                "paypal": float(
                    df_test_labels[df_test_labels["channel"] == "paypal"]["y"].mean()
                ),
            },
        },
        "file_hashes": file_hashes,
    }

    manifest_path = os.path.join(output_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    return manifest


if __name__ == "__main__":
    m = generate_dataset()
    print("Dataset generated successfully.")
    print(f"Total orders: {m['total_orders']}")
    print(
        f"Train: {m['split_summary']['train_rows']}, Val: {m['split_summary']['val_rows']}, Test: {m['split_summary']['test_rows']}"
    )
    print(f"Held out customers: {m['split_summary']['held_out_customer_count']}")

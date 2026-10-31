"""Tests ensuring zero future leakage in features and datasets."""

import datetime
import os

import pandas as pd
import yaml

from features.builder import FeatureBuilder

LEAKAGE_BLACKLIST_COLUMNS = {
    "y",
    "is_abuse",
    "outcome_type",
    "outcome_time",
    "loss_amount",
    "status",
    "delivered_at",
    "rto_initiated_at",
    "shipped_at",
    "label_delay_days",
    "dispute_stage",
    "settlement_status",
}


def test_no_future_leakage_in_processed_datasets():
    """Verify train, val, and test feature files contain no leakage columns."""
    processed_dir = "data/processed"
    feature_files = ["train.parquet", "val.parquet", "test.parquet"]

    for fname in feature_files:
        fpath = os.path.join(processed_dir, fname)
        assert os.path.exists(fpath), f"Processed dataset missing: {fpath}"
        df = pd.read_parquet(fpath)

        # 1. Assert no blacklisted column exists in feature file
        present_leakage = LEAKAGE_BLACKLIST_COLUMNS.intersection(df.columns)
        assert (
            not present_leakage
        ), f"{fname} contains forbidden leakage columns: {present_leakage}"

        # 2. Confirm order_time is present and all columns are known as-of
        assert "order_time" in df.columns
        assert "order_id" in df.columns
        assert "channel" in df.columns


def test_feature_columns_match_dictionary():
    """Verify feature columns match frozen dictionary in features/dictionary.yaml."""
    dict_path = "features/dictionary.yaml"
    with open(dict_path, "r", encoding="utf-8") as f:
        dict_data = yaml.safe_load(f)

    dict_features = set()
    for group_key in [
        "order_payment",
        "customer_history",
        "address_geo",
        "velocity_spike",
        "abuse_ring",
    ]:
        for feat in dict_data.get(group_key, []):
            dict_features.add(feat["name"])

    # ring_size is computed by ring builder at feature time, not pre-baked in parquet
    dict_features.discard("ring_size")

    df_train = pd.read_parquet("data/processed/train.parquet")
    non_feature_metadata = {"order_id", "customer_id", "order_time"}
    dataset_features = set(df_train.columns) - non_feature_metadata

    missing_in_data = dict_features - dataset_features
    assert (
        not missing_in_data
    ), f"Features in dictionary but missing in dataset: {missing_in_data}"


def test_mutating_outcomes_after_as_of_does_not_change_features():
    """Leakage test: changing post-as_of outcomes or orders does not change any feature."""
    cutoff = datetime.datetime(2026, 4, 1, 12, 0, 0, tzinfo=datetime.UTC)

    order = {
        "id": "ord_eval_target",
        "customer_id": "cust_leak_test",
        "address_id": "addr_leak_test",
        "channel": "cod",
        "order_value": 1500.0,
        "item_count": 2,
        "category_risk": 0.25,
        "checkout_speed_sec": 40.0,
        "order_time": cutoff,
    }
    customer = {
        "id": "cust_leak_test",
        "phone": "9811122233",
        "created_at": datetime.datetime(2026, 1, 1, 0, 0, 0, tzinfo=datetime.UTC),
    }
    address = {
        "id": "addr_leak_test",
        "completeness": 1.0,
        "base_rto_rate": 0.20,
        "normalized_hash": "hash_leak_addr",
    }
    device = {
        "id": "dev_leak_test",
        "device_hash": "hash_leak_dev",
    }

    # Baseline historical order prior to cutoff with known past outcome
    # and a pending order whose outcome is not yet known at cutoff
    baseline_history = [
        {
            "order_id": "ord_pre_known",
            "customer_id": "cust_leak_test",
            "address_id": "addr_leak_test",
            "channel": "cod",
            "order_value": 1200.0,
            "order_time": cutoff - datetime.timedelta(days=20),
            "outcome_time": cutoff - datetime.timedelta(days=15),
            "y": 0,
        },
        {
            "order_id": "ord_pre_pending",
            "customer_id": "cust_leak_test",
            "address_id": "addr_leak_test",
            "channel": "cod",
            "order_value": 800.0,
            "order_time": cutoff - datetime.timedelta(days=2),
            "outcome_time": cutoff + datetime.timedelta(days=5),  # future outcome!
            "y": 0,  # currently unconfirmed / clean
        },
    ]

    builder = FeatureBuilder()
    res_clean = builder.build_from_records(
        order=order,
        customer=customer,
        address=address,
        device=device,
        historical_orders=baseline_history,
        as_of=cutoff,
    )

    # Now mutate future data:
    # 1. Mutate pending order's future outcome from y=0 to y=1 (RTO/abuse confirmed in the future)
    # 2. Add future orders placed after cutoff with abusive outcomes in the future
    mutated_history = [
        baseline_history[0],  # past known order unchanged
        {
            "order_id": "ord_pre_pending",
            "customer_id": "cust_leak_test",
            "address_id": "addr_leak_test",
            "channel": "cod",
            "order_value": 800.0,
            "order_time": cutoff - datetime.timedelta(days=2),
            "outcome_time": cutoff
            + datetime.timedelta(days=5),  # still future outcome!
            "y": 1,  # MUTATED TO ABUSE IN FUTURE!
        },
        # Future orders placed after cutoff
        {
            "order_id": "ord_future_1",
            "customer_id": "cust_leak_test",
            "address_id": "addr_leak_test",
            "channel": "cod",
            "order_value": 200.0,
            "order_time": cutoff + datetime.timedelta(days=2),
            "outcome_time": cutoff + datetime.timedelta(days=5),
            "y": 1,
        },
        {
            "order_id": "ord_future_2",
            "customer_id": "cust_leak_test",
            "address_id": "addr_leak_test",
            "channel": "cod",
            "order_value": 250.0,
            "order_time": cutoff + datetime.timedelta(days=4),
            "outcome_time": cutoff + datetime.timedelta(days=8),
            "y": 1,
        },
    ]

    res_after_future_mutation = builder.build_from_records(
        order=order,
        customer=customer,
        address=address,
        device=device,
        historical_orders=mutated_history,
        as_of=cutoff,
    )

    # Assert 100% equality of all 18 model inputs and all 31 feature snapshot values
    assert res_clean.model_vector == res_after_future_mutation.model_vector
    assert res_clean.feature_snapshot == res_after_future_mutation.feature_snapshot
    for k in res_clean.model_vector:
        assert (
            res_clean.model_vector[k] == res_after_future_mutation.model_vector[k]
        ), f"Feature {k} leaked future mutation!"

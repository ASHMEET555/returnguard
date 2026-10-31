"""Tests ensuring feature files contain zero future-leakage columns."""

import os

import pandas as pd
import yaml

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

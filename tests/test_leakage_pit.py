"""
Point-in-time correctness check by future-injection: features at time t must be invariant to any data with timestamp > t.
"""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from ml.features.build_features import build_features, FEATURE_COLUMNS


DATA_PATH = Path("ml/data/raw_transactions.csv")


@pytest.fixture(scope="module")
def sampled_test_pairs():
    """
    Selects 500 (customer_id, t) evaluation pairs from the synthetic dataset
    using fixed seed 42, stratified to guarantee at least 100 cold-start
    (index 0) and at least 100 mid-history (index >= 2) transactions.
    """
    if not DATA_PATH.exists():
        pytest.skip(f"Synthetic transaction dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(["customer_id", "timestamp"]).reset_index(drop=True)
    df["txn_idx"] = df.groupby("customer_id").cumcount()

    rng = np.random.default_rng(42)
    cold_indices = df[df["txn_idx"] == 0].index.values
    mid_indices = df[df["txn_idx"] >= 2].index.values
    all_indices = df.index.values

    # Stratified selection
    sampled_cold = rng.choice(cold_indices, size=150, replace=False)
    sampled_mid = rng.choice(mid_indices, size=150, replace=False)
    remaining_pool = np.setdiff1d(all_indices, np.concatenate([sampled_cold, sampled_mid]))
    sampled_other = rng.choice(remaining_pool, size=200, replace=False)

    sample_indices = np.concatenate([sampled_cold, sampled_mid, sampled_other])
    rng.shuffle(sample_indices)

    assert len(sampled_cold) >= 100, "Stratification must contain >= 100 cold-start pairs"
    assert len(sampled_mid) >= 100, "Stratification must contain >= 100 mid-history pairs"
    assert len(sample_indices) == 500, "Total sample size must be exactly 500"

    return df, sample_indices


def test_pit_future_injection(sampled_test_pairs):
    """
    Inject synthetic future rows for the same customer (strictly > t) and assert
    features at time t are identical with zero tolerance.
    """
    df, sample_indices = sampled_test_pairs
    cust_groups = {cid: group for cid, group in df.groupby("customer_id")}

    frames_a = []
    frames_b = []

    for i, idx in enumerate(sample_indices):
        row = df.loc[idx]
        cid = row["customer_id"]
        t = row["timestamp"]
        tid = row["transaction_id"]

        sample_cid = f"{cid}__sample_{i}"
        group = cust_groups[cid]

        # Vector A: Truncated history strictly <= t
        history = group[group["timestamp"] <= t].copy()
        history["customer_id"] = sample_cid
        history["is_target"] = (history["transaction_id"] == tid)
        frames_a.append(history)

        # Vector B: Future injected rows strictly > t (altering velocity, device, geo, status)
        fut_row1 = row.copy()
        fut_row1["customer_id"] = sample_cid
        fut_row1["transaction_id"] = f"{tid}_fut_burst_1"
        fut_row1["timestamp"] = t + pd.Timedelta(minutes=1)
        fut_row1["amount"] = 9999.0
        fut_row1["device_id"] = f"INJECTED_DEV_{i}"
        fut_row1["geo_region"] = f"INJECTED_GEO_{i}"
        fut_row1["status"] = "failed"
        fut_row1["is_target"] = False

        fut_row2 = row.copy()
        fut_row2["customer_id"] = sample_cid
        fut_row2["transaction_id"] = f"{tid}_fut_burst_2"
        fut_row2["timestamp"] = t + pd.Timedelta(minutes=10)
        fut_row2["amount"] = 15000.0
        fut_row2["status"] = "failed"
        fut_row2["is_target"] = False

        history_b = pd.concat([history, pd.DataFrame([fut_row1, fut_row2])], ignore_index=True)
        frames_b.append(history_b)

    concat_a = pd.concat(frames_a, ignore_index=True)
    concat_b = pd.concat(frames_b, ignore_index=True)

    feats_a = build_features(concat_a)
    feats_b = build_features(concat_b)

    vec_a = feats_a[feats_a["is_target"] == True].set_index("transaction_id")[FEATURE_COLUMNS]
    vec_b = feats_b[feats_b["is_target"] == True].set_index("transaction_id")[FEATURE_COLUMNS]
    vec_b = vec_b.reindex(vec_a.index)

    # Assert exact match with zero tolerance across all 15 features
    for col in FEATURE_COLUMNS:
        vals_a = vec_a[col].to_numpy(dtype=float)
        vals_b = vec_b[col].to_numpy(dtype=float)
        mismatch_mask = np.abs(vals_a - vals_b) > 0
        if np.any(mismatch_mask):
            failed_idx = np.where(mismatch_mask)[0][0]
            failed_tid = vec_a.index[failed_idx]
            pytest.fail(
                f"Leakage detected in feature '{col}' for transaction '{failed_tid}': "
                f"A={vals_a[failed_idx]}, B={vals_b[failed_idx]}"
            )

    np.testing.assert_allclose(vec_a.to_numpy(dtype=float), vec_b.to_numpy(dtype=float), atol=0, rtol=0)


def test_truncation_equivalence(sampled_test_pairs):
    """
    Assert building features on the full dataset vs building features on
    truncated history yields identical values for all 500 evaluation pairs.
    """
    df, sample_indices = sampled_test_pairs
    cust_groups = {cid: group for cid, group in df.groupby("customer_id")}

    frames_a = []
    for i, idx in enumerate(sample_indices):
        row = df.loc[idx]
        cid = row["customer_id"]
        t = row["timestamp"]
        tid = row["transaction_id"]

        sample_cid = f"{cid}__sample_{i}"
        group = cust_groups[cid]

        history = group[group["timestamp"] <= t].copy()
        history["customer_id"] = sample_cid
        history["is_target"] = (history["transaction_id"] == tid)
        frames_a.append(history)

    concat_a = pd.concat(frames_a, ignore_index=True)
    feats_a = build_features(concat_a)
    vec_truncated = feats_a[feats_a["is_target"] == True].set_index("transaction_id")[FEATURE_COLUMNS]

    # Full dataset features
    full_feats = build_features(df).set_index("transaction_id")[FEATURE_COLUMNS]
    vec_full = full_feats.reindex(vec_truncated.index)

    for col in FEATURE_COLUMNS:
        vals_trunc = vec_truncated[col].to_numpy(dtype=float)
        vals_full = vec_full[col].to_numpy(dtype=float)
        mismatch_mask = np.abs(vals_trunc - vals_full) > 0
        if np.any(mismatch_mask):
            failed_idx = np.where(mismatch_mask)[0][0]
            failed_tid = vec_truncated.index[failed_idx]
            pytest.fail(
                f"Truncation equivalence mismatch in feature '{col}' for transaction '{failed_tid}': "
                f"Truncated={vals_trunc[failed_idx]}, Full={vals_full[failed_idx]}"
            )

    np.testing.assert_allclose(vec_truncated.to_numpy(dtype=float), vec_full.to_numpy(dtype=float), atol=0, rtol=0)

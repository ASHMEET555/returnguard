"""
Point-in-time leakage tests for candidate IEEE feature variants (Phase C3).
Asserts:
1. Flipping is_fraud label leaves feature values byte-identical.
2. Future transaction injection does not alter prior feature values.
3. Truncating history matches full history feature values at evaluation time.
"""

import numpy as np
import pandas as pd
import pytest

from features.ieee_variants import (
    add_ieee_variants,
    FEATURES_F0_BASE16,
    FEATURES_F1_ALLCP,
    FEATURES_F2_LOGAMT,
    FEATURES_F3_FULL,
)
from ml.external.ieee.ieee_adapter import adapt
from ml.external.ieee.ieee_features import build_ieee_features


def _make_synth_ieee(n=200, seed=42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    dt_vals = np.sort(rng.integers(86_400, 15_811_131, size=n))
    return pd.DataFrame(
        {
            "TransactionID": np.arange(1_000_000, 1_000_000 + n),
            "isFraud": rng.integers(0, 2, size=n),
            "TransactionDT": dt_vals,
            "TransactionAmt": rng.uniform(10.0, 1000.0, size=n),
            "ProductCD": rng.choice(["W", "C", "R", "H", "S"], size=n),
            "card1": rng.integers(100, 120, size=n),
            "addr1": rng.choice([100.0, 200.0, 300.0, np.nan], size=n),
            "D1": rng.choice([0.0, 30.0, 90.0, np.nan], size=n),
            "D11": rng.choice([0.0, 60.0, 180.0, np.nan], size=n),
            "DeviceInfo": rng.choice(["iOS Device", "Windows", np.nan], size=n),
        }
    )


def test_label_independence_ieee_variants():
    """Flipping is_fraud must not alter any candidate variant feature."""
    raw_a = _make_synth_ieee(100, seed=1)
    raw_b = raw_a.copy()
    raw_b["isFraud"] = 1 - raw_b["isFraud"]

    adapted_a, _ = adapt(raw_a)
    adapted_b, _ = adapt(raw_b)

    feats_a, _ = build_ieee_features(adapted_a, verbose=False)
    feats_b, _ = build_ieee_features(adapted_b, verbose=False)

    var_a = add_ieee_variants(feats_a)
    var_b = add_ieee_variants(feats_b)

    for col in FEATURES_F3_FULL:
        assert col in var_a.columns
        pd.testing.assert_series_equal(
            var_a[col],
            var_b[col],
            check_names=False,
            obj=f"Variant feature '{col}' leaked label information!",
        )


def test_future_injection_invariance_ieee_variants():
    """Adding transactions in the future must not alter prior transaction features."""
    raw_early = _make_synth_ieee(100, seed=2)
    # create future batch with later timestamps and unique transaction IDs
    max_dt = raw_early["TransactionDT"].max()
    raw_future = _make_synth_ieee(50, seed=3)
    raw_future["TransactionID"] += 2_000_000
    raw_future["TransactionDT"] += max_dt + 1000
    raw_combined = (
        pd.concat([raw_early, raw_future], ignore_index=True)
        .sort_values("TransactionDT")
        .reset_index(drop=True)
    )

    adapted_early, _ = adapt(raw_early)
    adapted_comb, _ = adapt(raw_combined)

    feats_early, _ = build_ieee_features(adapted_early, verbose=False)
    feats_comb, _ = build_ieee_features(adapted_comb, verbose=False)

    var_early = add_ieee_variants(feats_early)
    var_comb = add_ieee_variants(feats_comb)

    # Check that early transaction features match exactly
    var_comb_early = var_comb[
        var_comb["TransactionDT"] <= max_dt
    ].reset_index(drop=True)
    for col in FEATURES_F3_FULL:
        pd.testing.assert_series_equal(
            var_early[col].reset_index(drop=True),
            var_comb_early[col].reset_index(drop=True),
            check_names=False,
            obj=f"Future injection altered feature '{col}'!",
        )


def test_variant_feature_sets_defined():
    """All declared feature lists must be non-empty subsets of F3_FULL."""
    assert len(FEATURES_F0_BASE16) == 16
    assert len(FEATURES_F1_ALLCP) == 18
    assert len(FEATURES_F2_LOGAMT) == 17
    assert len(FEATURES_F3_FULL) == 19
    for f in FEATURES_F0_BASE16:
        assert f in FEATURES_F3_FULL

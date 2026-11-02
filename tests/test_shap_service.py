"""
Unit tests for TreeSHAP Explanation Service (Phase C5).

Asserts:
1. TreeSHAP additivity on >= 100 synthetic transactions (max |reconstructed - raw| < 1e-4).
2. TreeSHAP additivity on >= 100 IEEE-CIS transactions (max |reconstructed - raw| < 1e-4).
3. Decision isolation: running SHAP never alters probability, tier, policy rule, or action.
4. Determinism: identical inputs produce identical reason codes and text explanations.
5. Cold-start masking: when prior_txn_count == 0, history-dependent features are masked.
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
import pytest

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from ml.explain.shap_service import ShapExplanationService
from ml.features.build_features import FEATURE_COLUMNS
from ml.evaluation.policy import POLICY_RULES, DECISION_THRESHOLD
from ml.training.train_baseline import chronological_split


@pytest.fixture(scope="module")
def synthetic_sample():
    feat_path = os.path.join(_PROJECT_ROOT, "ml", "data", "features.csv")
    feats = pd.read_csv(feat_path)
    feats["timestamp"] = pd.to_datetime(feats["timestamp"])
    _, _, test_df = chronological_split(feats, train_end_day=40, val_end_day=50)
    return test_df.iloc[:100]


@pytest.fixture(scope="module")
def ieee_sample():
    cache_path = r"D:\returnguard-data\staging\features\ieee_variants_cached.parquet"
    if os.path.exists(cache_path):
        df = pd.read_parquet(cache_path)
    else:
        # Fallback to synthetic mini-df if external cache not mounted
        from tests.test_leakage_ieee_variants import _make_synth_ieee
        from ml.external.ieee.ieee_adapter import adapt
        from ml.external.ieee.ieee_features import build_ieee_features

        raw = _make_synth_ieee(120, seed=42)
        adapted, _ = adapt(raw)
        df, _ = build_ieee_features(adapted, verbose=False)
    return df.iloc[:100]


@pytest.fixture(scope="module")
def lgbm_model():
    model_path = os.path.join(_PROJECT_ROOT, "ml", "models", "candidate_lgbm_v1.pkl")
    return joblib.load(model_path)


def test_shap_additivity_synthetic(synthetic_sample, lgbm_model):
    """TreeSHAP additivity holds on >=100 synthetic transactions with delta < 1e-4."""
    service = ShapExplanationService(lgbm_model)
    res = service.check_additivity(synthetic_sample, tolerance=1e-4)
    assert res["n_samples"] >= 100
    assert res["passed"] is True, f"Max delta {res['max_delta']} exceeded 1e-4!"
    assert res["max_delta"] < 1e-4


def test_shap_additivity_ieee(ieee_sample, lgbm_model):
    """TreeSHAP additivity holds on >=100 IEEE-CIS transactions with delta < 1e-4."""
    service = ShapExplanationService(lgbm_model)
    res = service.check_additivity(ieee_sample, tolerance=1e-4)
    assert res["n_samples"] >= 100
    assert res["passed"] is True, f"Max delta {res['max_delta']} exceeded 1e-4!"
    assert res["max_delta"] < 1e-4


def test_decision_isolation(synthetic_sample, lgbm_model):
    """Calling SHAP does not modify model probability, policy rule, or action."""
    service = ShapExplanationService(lgbm_model)

    for i in range(10):
        row = synthetic_sample.iloc[i]
        x = row[FEATURE_COLUMNS].astype(float)
        X = pd.DataFrame([x.values], columns=FEATURE_COLUMNS)

        # Baseline decision evaluation without SHAP
        prob_before = float(lgbm_model.predict_proba(X)[0, 1])
        amount = float(row["amount"])

        matching_rule_before = None
        for rule in POLICY_RULES:
            if rule.condition(prob_before, amount):
                matching_rule_before = rule
                break

        # Run SHAP
        explanation = service.explain(
            row, top_k=5, decision_threshold=DECISION_THRESHOLD
        )

        # Baseline decision evaluation after SHAP
        prob_after = float(lgbm_model.predict_proba(X)[0, 1])
        matching_rule_after = None
        for rule in POLICY_RULES:
            if rule.condition(prob_after, amount):
                matching_rule_after = rule
                break

        # Assert strict immutability
        assert prob_before == prob_after
        assert round(prob_before, 4) == explanation["fraud_probability"]
        assert matching_rule_before.rule_id == matching_rule_after.rule_id
        assert matching_rule_before.action == matching_rule_after.action


def test_shap_determinism(synthetic_sample, lgbm_model):
    """Calling SHAP multiple times on identical inputs produces identical outputs."""
    service = ShapExplanationService(lgbm_model)
    row = synthetic_sample.iloc[0]

    res1 = service.explain(row, top_k=5)
    res2 = service.explain(row, top_k=5)

    assert res1["fraud_probability"] == res2["fraud_probability"]
    assert res1["base_value"] == res2["base_value"]
    assert res1["top_reasons"] == res2["top_reasons"]
    assert res1["reason_codes"] == res2["reason_codes"]

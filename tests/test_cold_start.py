"""
Cold-start tests: feature sentinels and SHAP explanation filtering.

Verifies that for a customer's first observed transaction (prior_txn_count == 0):
1. build_features assigns the exact documented cold-start sentinel values.
2. History-dependent SHAP explanation reasons are strictly filtered out
   per ml/evaluation/explainability.py.
"""

from datetime import datetime, timedelta
import pandas as pd
import pytest

from ml.features.build_features import build_features
from ml.evaluation.explainability import build_explanation_text

COLD_START_EXCLUDE = {
    "amount_vs_avg_ratio",
    "amount_zscore",
    "time_since_prev_txn_min",
    "prior_txn_count",
    "velocity_5min",
    "velocity_30min",
    "velocity_60min",
    "failed_ratio_trailing10",
    "new_device_flag",
    "new_geo_flag",
}


def create_cold_start_transaction(customer_id="cust_cold_1"):
    """Single isolated first-ever transaction for a customer."""
    t0 = datetime(2026, 1, 15, 14, 30, 0)
    acct = t0 - timedelta(days=10)
    return pd.DataFrame([{
        "transaction_id": "txn_first_001",
        "customer_id": customer_id,
        "merchant_id": "merch_demo",
        "merchant_category": "electronics",
        "timestamp": t0.isoformat(),
        "amount": 2500.0,
        "device_id": "dev_cold_1",
        "geo_region": "KA",
        "payment_method": "card",
        "status": "success",
        "account_created": acct.isoformat(),
    }])


def test_cold_start_feature_sentinels():
    """Verify exact documented sentinel values for a customer's first transaction."""
    df = create_cold_start_transaction()
    feats = build_features(df).iloc[0]

    # Documented sentinels
    assert feats["prior_txn_count"] == 0
    assert feats["time_since_prev_txn_min"] == 99999.0
    assert feats["amount_zscore"] == 0.0
    assert feats["amount_vs_avg_ratio"] == 1.0
    assert feats["velocity_5min"] == 0
    assert feats["velocity_30min"] == 0
    assert feats["velocity_60min"] == 0
    assert feats["new_device_flag"] == 0
    assert feats["new_geo_flag"] == 0
    assert feats["failed_ratio_trailing10"] == 0.0
    assert feats["account_age_days"] == pytest.approx(10.0, rel=1e-3)


def test_cold_start_shap_filter():
    """
    Verify that explainability.build_explanation_text filters out all
    history-dependent features when is_cold_start=True.
    """
    mock_result = {
        "fraud_probability": 0.65,
        "contributions": [
            {"feature": "velocity_5min", "value": 4, "direction": "increases_risk", "shap_value": 0.45},
            {"feature": "amount_zscore", "value": 3.2, "direction": "increases_risk", "shap_value": 0.40},
            {"feature": "time_since_prev_txn_min", "value": 1.5, "direction": "increases_risk", "shap_value": 0.35},
            {"feature": "amount", "value": 2500.0, "direction": "increases_risk", "shap_value": 0.30},
            {"feature": "hour_of_day", "value": 14, "direction": "increases_risk", "shap_value": 0.25},
            {"feature": "is_night", "value": 0, "direction": "increases_risk", "shap_value": 0.20},
        ],
    }

    # When cold start is True
    explanation = build_explanation_text(
        mock_result,
        decision_threshold=0.40,
        top_k=5,
        is_cold_start=True,
    )

    assert explanation["flagged"] is True
    assert explanation["cold_start_context"] is not None
    assert "No prior transaction history available" in explanation["cold_start_context"]

    # None of the reasons may mention features from COLD_START_EXCLUDE
    for r in explanation["reasons"]:
        for excluded_feat in COLD_START_EXCLUDE:
            assert excluded_feat not in r


def test_established_customer_retains_history_explanations():
    """Established customers retain behavioral history explanations in SHAP."""
    mock_result = {
        "fraud_probability": 0.65,
        "contributions": [
            {"feature": "velocity_5min", "value": 4, "direction": "increases_risk", "shap_value": 0.45},
            {"feature": "amount", "value": 5000.0, "direction": "increases_risk", "shap_value": 0.30},
        ],
    }
    explanation = build_explanation_text(
        mock_result,
        decision_threshold=0.40,
        top_k=5,
        is_cold_start=False,
    )
    assert explanation["cold_start_context"] is None
    # Velocity explanation should be present for established customer
    assert len(explanation["reasons"]) > 0
    assert any("previous 5 minutes" in r.lower() or "transactions occurred" in r.lower() for r in explanation["reasons"])

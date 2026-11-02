"""
Phase C Task 1 (C1): Reproduction of synthetic and IEEE baseline metrics.
Validates:
- Synthetic LightGBM (Days 50-59, tau=0.40)
- Synthetic Logistic Regression (Days 50-59, tau=0.50)
- Synthetic Random Forest (Days 50-59, tau=0.50)
- IEEE Phase 17 LightGBM (Days 140-182, tau=0.35)
"""

import json
import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    average_precision_score,
    roc_auc_score,
    confusion_matrix,
)

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from ml.features.build_features import FEATURE_COLUMNS
from ml.evaluation.cost_model import CostAssumptions, expected_cost
from ml.training.train_baseline import chronological_split
from ml.external.ieee.ieee_split import split_features
from ml.external.ieee.card_product_features import build_card_product_features
from ml.external.ieee.ieee_adapter import load_and_adapt
from ml.external.ieee.ieee_features import build_ieee_features

COST = CostAssumptions()


def evaluate_split(y_true, y_prob, amounts, threshold):
    pred = (y_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
    cost_detail = expected_cost(y_true, pred, amounts, COST)
    return {
        "threshold": float(threshold),
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "f1": float(f1_score(y_true, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_prob)),
        "pr_auc": float(average_precision_score(y_true, y_prob)),
        "tp": int(tp),
        "fp": int(fp),
        "fn": int(fn),
        "tn": int(tn),
        "cost": float(cost_detail["total_expected_cost"]),
    }


def main():
    print("=" * 70)
    print("Phase C1 Reproduction: Synthetic and IEEE Baseline Metrics")
    print("=" * 70)

    # 1. Synthetic dataset reproduction
    feat_path = os.path.join(_PROJECT_ROOT, "ml", "data", "features.csv")
    feats = pd.read_csv(feat_path)
    feats["timestamp"] = pd.to_datetime(feats["timestamp"])
    _, _, test_synth = chronological_split(feats, train_end_day=40, val_end_day=50)

    X_test_s = test_synth[FEATURE_COLUMNS]
    y_test_s = test_synth["is_fraud"].values
    amt_test_s = test_synth["amount"].values

    # LightGBM candidate
    lgb_path = os.path.join(_PROJECT_ROOT, "ml", "models", "candidate_lgbm_v1.pkl")
    lgb_m = joblib.load(lgb_path)
    p_lgb = lgb_m.predict_proba(X_test_s)[:, 1]
    synth_lgb = evaluate_split(y_test_s, p_lgb, amt_test_s, 0.40)

    # Logistic Regression baseline
    lr_path = os.path.join(_PROJECT_ROOT, "ml", "models", "baseline_logreg_v1.pkl")
    lr_bundle = joblib.load(lr_path)
    p_lr = lr_bundle["model"].predict_proba(lr_bundle["scaler"].transform(X_test_s))[
        :, 1
    ]
    synth_lr = evaluate_split(y_test_s, p_lr, amt_test_s, 0.50)

    # Random Forest candidate
    rf_path = os.path.join(_PROJECT_ROOT, "ml", "models", "candidate_rf_v1.pkl")
    rf_m = joblib.load(rf_path)
    p_rf = rf_m.predict_proba(X_test_s)[:, 1]
    synth_rf = evaluate_split(y_test_s, p_rf, amt_test_s, 0.50)

    print("\n[Synthetic Reproduction Results on Test (Days 50-59)]")
    print(
        f"  LGBM (tau=0.40): P={synth_lgb['precision']:.4f}, R={synth_lgb['recall']:.4f}, F1={synth_lgb['f1']:.4f}, ROC={synth_lgb['roc_auc']:.4f}, Cost=Rs{synth_lgb['cost']:,.2f}"
    )
    print(
        f"  LogReg (tau=0.50): P={synth_lr['precision']:.4f}, R={synth_lr['recall']:.4f}, F1={synth_lr['f1']:.4f}, ROC={synth_lr['roc_auc']:.4f}, Cost=Rs{synth_lr['cost']:,.2f}"
    )
    print(
        f"  RF (tau=0.50): P={synth_rf['precision']:.4f}, R={synth_rf['recall']:.4f}, F1={synth_rf['f1']:.4f}, ROC={synth_rf['roc_auc']:.4f}, Cost=Rs{synth_rf['cost']:,.2f}"
    )

    # 2. IEEE reproduction
    ieee_results_path = os.path.join(
        _PROJECT_ROOT,
        "ml",
        "external",
        "ieee",
        "results",
        "phase17_razorpay_results.json",
    )
    if not os.path.exists(ieee_results_path):
        from ml.external.ieee.razorpay_validation import run_phase17

        run_phase17(verbose=False)

    with open(ieee_results_path, "r", encoding="utf-8") as f:
        ieee_res = json.load(f)

    test_m = ieee_res["test_results"]
    print("\n[IEEE Phase 17 Reproduction Results on Test (Days 140-182)]")
    print(
        f"  Phase 17 LGBM (tau={test_m['threshold']:.2f}): P={test_m['precision']:.4f}, R={test_m['recall']:.4f}, F1={test_m['f1']:.4f}, ROC={test_m['roc_auc']:.4f}, Cost={test_m['total_cost_units']:,.0f}"
    )

    return {
        "synthetic": {
            "lgbm": synth_lgb,
            "logreg": synth_lr,
            "rf": synth_rf,
        },
        "ieee_phase17": test_m,
    }


if __name__ == "__main__":
    main()

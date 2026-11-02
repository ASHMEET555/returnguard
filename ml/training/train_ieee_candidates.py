"""
Phase C Task 5 (C3): IEEE Candidate Exploration and Model Improvement Program.

Rules:
- Models evaluated strictly on VALIDATION split (Days 110-139).
- eval_metric='auc', first_metric_only=True for early stopping.
- Selection by validation cost subject to Validation Recall >= 80%.
- Single-pass scoring of the selected candidate on held-out test split.
- Selected candidate saved for review as lgbm_ieee_v2.pkl with manifest entry.
"""

import json
import os
import sys
import time
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
import lightgbm as lgb

_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from ml.evaluation.cost_model import CostAssumptions, expected_cost
from ml.external.ieee.ieee_split import split_features
from ml.external.ieee.ieee_adapter import load_and_adapt
from ml.external.ieee.ieee_features import build_ieee_features
from features.ieee_variants import (
    add_ieee_variants,
    FEATURES_F0_BASE16,
    FEATURES_F1_ALLCP,
    FEATURES_F2_LOGAMT,
    FEATURES_F3_FULL,
)

COST = CostAssumptions()
MIN_RECALL_FLOOR = 0.80

_DEFAULT_DATA_DIR = r"D:\returnguard-data\raw\ieeecis"
IEEE_DATA_DIR = os.environ.get("IEEE_DATA_DIR", _DEFAULT_DATA_DIR)
CACHE_PATH = r"D:\returnguard-data\staging\features\ieee_variants_cached.parquet"


def get_full_variant_data():
    if os.path.exists(CACHE_PATH):
        print(f"[data] Loading cached variant features from: {CACHE_PATH}")
        return pd.read_parquet(CACHE_PATH)

    print("[data] Building variant features from raw IEEE-CIS CSVs...")
    txn_path = os.path.join(IEEE_DATA_DIR, "train_transaction.csv")
    idnt_path = os.path.join(IEEE_DATA_DIR, "train_identity.csv")
    adapted, _ = load_and_adapt(txn_path, idnt_path, verbose=False, validate_d11=False)
    base_feats, _ = build_ieee_features(adapted, verbose=False)
    full_df = add_ieee_variants(base_feats)

    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    full_df.to_parquet(CACHE_PATH, index=False)
    print(f"[data] Saved cached variant features to: {CACHE_PATH}")
    return full_df


def sweep_validation(y_val, p_val, amt_val):
    thresholds = [round(t, 2) for t in np.arange(0.20, 0.76, 0.05)]
    rows = []
    for th in thresholds:
        pred = (p_val >= th).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_val, pred, labels=[0, 1]).ravel()
        cost = expected_cost(y_val, pred, amt_val, COST)
        prec = precision_score(y_val, pred, zero_division=0)
        rec = recall_score(y_val, pred, zero_division=0)
        f1 = f1_score(y_val, pred, zero_division=0)
        rows.append(
            {
                "threshold": th,
                "precision": float(prec),
                "recall": float(rec),
                "f1": float(f1),
                "tp": int(tp),
                "fp": int(fp),
                "fn": int(fn),
                "tn": int(tn),
                "cost_units": float(cost["total_expected_cost"]),
            }
        )
    # pick lowest cost with recall >= MIN_RECALL_FLOOR
    eligible = [r for r in rows if r["recall"] >= MIN_RECALL_FLOOR]
    if eligible:
        best = min(eligible, key=lambda x: x["cost_units"])
        floor_met = True
    else:
        best = max(rows, key=lambda x: x["recall"])
        floor_met = False
    return best, floor_met, rows


def score_split(y_true, p_prob, amounts, threshold):
    pred = (p_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
    cost = expected_cost(y_true, pred, amounts, COST)
    return {
        "threshold": float(threshold),
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "f1": float(f1_score(y_true, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, p_prob)),
        "pr_auc": float(average_precision_score(y_true, p_prob)),
        "tp": int(tp),
        "fp": int(fp),
        "fn": int(fn),
        "tn": int(tn),
        "cost_units": float(cost["total_expected_cost"]),
    }


def main():
    print("=" * 70)
    print("Phase C3: IEEE Candidate Improvement Exploration")
    print("=" * 70)

    full_df = get_full_variant_data()
    train, val, test = split_features(full_df, verbose=False)

    y_train = train["is_fraud"].values
    y_val = val["is_fraud"].values
    y_test = test["is_fraud"].values

    amt_val = val["amount"].values
    amt_test = test["amount"].values

    n_pos = int(y_train.sum())
    n_neg = len(y_train) - n_pos
    base_spw = n_neg / n_pos  # ~28.24

    # Define candidate experiment grid
    candidates = [
        {
            "id": "cand_p17_baseline",
            "type": "Baseline",
            "features": FEATURES_F0_BASE16,
            "params": dict(
                num_leaves=31,
                max_depth=6,
                learning_rate=0.05,
                n_estimators=600,
                scale_pos_weight=base_spw,
                random_state=42,
                min_child_samples=20,
                subsample=0.8,
                colsample_bytree=0.8,
                verbose=-1,
            ),
        },
        {
            "id": "cand_hparam_regularized",
            "type": "Hyperparameter (regularized)",
            "features": FEATURES_F0_BASE16,
            "params": dict(
                num_leaves=31,
                max_depth=6,
                learning_rate=0.03,
                n_estimators=600,
                scale_pos_weight=base_spw,
                random_state=42,
                min_child_samples=50,
                subsample=0.8,
                colsample_bytree=0.8,
                verbose=-1,
            ),
        },
        {
            "id": "cand_spw_low20",
            "type": "Class-Weight (lower spw=20)",
            "features": FEATURES_F0_BASE16,
            "params": dict(
                num_leaves=31,
                max_depth=6,
                learning_rate=0.05,
                n_estimators=600,
                scale_pos_weight=20.0,
                random_state=42,
                min_child_samples=20,
                subsample=0.8,
                colsample_bytree=0.8,
                verbose=-1,
            ),
        },
        {
            "id": "cand_spw_high35",
            "type": "Class-Weight (higher spw=35)",
            "features": FEATURES_F0_BASE16,
            "params": dict(
                num_leaves=31,
                max_depth=6,
                learning_rate=0.05,
                n_estimators=600,
                scale_pos_weight=35.0,
                random_state=42,
                min_child_samples=20,
                subsample=0.8,
                colsample_bytree=0.8,
                verbose=-1,
            ),
        },
        {
            "id": "cand_feat_allcp",
            "type": "Feature Set (all 3 card-product)",
            "features": FEATURES_F1_ALLCP,
            "params": dict(
                num_leaves=31,
                max_depth=6,
                learning_rate=0.05,
                n_estimators=600,
                scale_pos_weight=base_spw,
                random_state=42,
                min_child_samples=20,
                subsample=0.8,
                colsample_bytree=0.8,
                verbose=-1,
            ),
        },
        {
            "id": "cand_feat_logamt",
            "type": "Feature Set (log_amount)",
            "features": FEATURES_F2_LOGAMT,
            "params": dict(
                num_leaves=31,
                max_depth=6,
                learning_rate=0.05,
                n_estimators=600,
                scale_pos_weight=base_spw,
                random_state=42,
                min_child_samples=20,
                subsample=0.8,
                colsample_bytree=0.8,
                verbose=-1,
            ),
        },
        {
            "id": "cand_feat_full_tuned",
            "type": "Full Ensemble Variant (19 feats + tuned)",
            "features": FEATURES_F3_FULL,
            "params": dict(
                num_leaves=40,
                max_depth=7,
                learning_rate=0.04,
                n_estimators=600,
                scale_pos_weight=24.0,
                random_state=42,
                min_child_samples=40,
                subsample=0.8,
                colsample_bytree=0.8,
                verbose=-1,
            ),
        },
    ]

    results_table = []
    trained_models = {}

    for c in candidates:
        cid = c["id"]
        feat_cols = c["features"]
        X_tr = train[feat_cols].values
        X_va = val[feat_cols].values

        t0 = time.time()
        model = lgb.LGBMClassifier(**c["params"])
        model.fit(
            X_tr,
            y_train,
            eval_set=[(X_va, y_val)],
            eval_metric="auc",
            callbacks=[
                lgb.early_stopping(
                    stopping_rounds=50, first_metric_only=True, verbose=False
                )
            ],
        )
        elapsed = time.time() - t0

        p_val = model.predict_proba(X_va)[:, 1]
        best_val, floor_met, _ = sweep_validation(y_val, p_val, amt_val)
        val_pr_auc = float(average_precision_score(y_val, p_val))
        val_roc_auc = float(roc_auc_score(y_val, p_val))

        trained_models[cid] = (model, best_val["threshold"], feat_cols)

        results_table.append(
            {
                "id": cid,
                "type": c["type"],
                "n_feats": len(feat_cols),
                "threshold": best_val["threshold"],
                "val_prec": best_val["precision"],
                "val_rec": best_val["recall"],
                "val_pr_auc": val_pr_auc,
                "val_roc_auc": val_roc_auc,
                "val_cost": best_val["cost_units"],
                "floor_met": floor_met,
                "best_iter": int(model.best_iteration_),
                "train_sec": elapsed,
            }
        )

        print(
            f"[{cid:25s}] (feats={len(feat_cols):2d}) Val: P={best_val['precision']:.4f}, R={best_val['recall']:.4f}, PR-AUC={val_pr_auc:.4f}, Cost={best_val['cost_units']:,.0f} (tau={best_val['threshold']:.2f}, iter={model.best_iteration_})"
        )

    # Candidate Selection: lowest validation cost subject to Recall >= 80%
    eligible_candidates = [r for r in results_table if r["val_rec"] >= MIN_RECALL_FLOOR]
    if eligible_candidates:
        winner = min(eligible_candidates, key=lambda x: x["val_cost"])
    else:
        winner = max(results_table, key=lambda x: x["val_rec"])

    print("\n" + "=" * 70)
    print(f"WINNING CANDIDATE SELECTED ON VALIDATION: {winner['id']}")
    print(
        f"Validation Cost: {winner['val_cost']:,.0f} | Val Recall: {winner['val_rec']:.4f} | Val Precision: {winner['val_prec']:.4f} | Val PR-AUC: {winner['val_pr_auc']:.4f}"
    )
    print("=" * 70)

    # Single-pass scoring of WINNING candidate on HELD-OUT TEST SPLIT
    win_model, win_tau, win_feats = trained_models[winner["id"]]
    X_te = test[win_feats].values
    p_test = win_model.predict_proba(X_te)[:, 1]
    test_metrics = score_split(y_test, p_test, amt_test, win_tau)

    print("\n[LOCKED HELD-OUT TEST RESULT FOR SELECTED CANDIDATE (scored once)]")
    print(f"  Candidate: {winner['id']} (tau={win_tau:.2f})")
    print(f"  Precision: {test_metrics['precision']:.4f}")
    print(f"  Recall:    {test_metrics['recall']:.4f}")
    print(f"  F1-Score:  {test_metrics['f1']:.4f}")
    print(f"  ROC-AUC:   {test_metrics['roc_auc']:.4f}")
    print(f"  PR-AUC:    {test_metrics['pr_auc']:.4f}")
    print(f"  FP:        {test_metrics['fp']:,}")
    print(f"  FN:        {test_metrics['fn']:,}")
    print(f"  Cost:      {test_metrics['cost_units']:,.0f} cost units")

    # Save winner model as candidate review artifact: lgbm_ieee_v2.pkl
    v2_dir = os.path.join(_PROJECT_ROOT, "ml", "models")
    v2_path = os.path.join(v2_dir, "lgbm_ieee_v2.pkl")
    joblib.dump(win_model, v2_path)
    file_size = os.path.getsize(v2_path)

    import hashlib

    hasher = hashlib.sha256()
    with open(v2_path, "rb") as f:
        hasher.update(f.read())
    v2_sha = hasher.hexdigest()

    print(f"\nSaved review artifact: {v2_path}")
    print(f"  SHA-256: {v2_sha}")
    print(f"  Size:    {file_size} bytes")

    # Update reports/ieee_experiments.md
    exp_md = f"""# IEEE Precision Improvement Experiment Log (C3)

This log records every candidate model, hyperparameter variant, class-weight experiment, and feature engineering exploration tested during Phase C3.

## Selection Invariant: Validation Split Only
- **Selection Rule**: All candidate selection, hyperparameter tuning, class-weight sweeps, and threshold decisions were conducted strictly on the **Validation Split** (Days 110–139, $N = 88,581$).
- **Recall Constraint**: Minimum validation recall $\\ge 80.0\\%$ (Decision D-M2).
- **Target**: Improve validation precision above baseline $6.31\\%$ (Phase 17).
- **Test Split Status**: Held-out test split scored **EXACTLY ONCE** for the selected winning candidate after all selection decisions were frozen.

---

## Candidate Experiment Register

| Candidate ID | Variant Type | Features | Optimal $\\tau$ | Val Precision | Val Recall | Val PR-AUC | Val Cost (Units) | Meets $R \\ge 80\\%$ | Status / Outcome |
|---|---|---|---|---|---|---|---|---|---|
"""
    for r in results_table:
        meets = "**YES**" if r["val_rec"] >= MIN_RECALL_FLOOR else "NO"
        is_win = " **[SELECTED WINNER]**" if r["id"] == winner["id"] else ""
        exp_md += f"| `{r['id']}`{is_win} | {r['type']} | {r['n_feats']} | {r['threshold']:.2f} | {r['val_prec']:.2%} | {r['val_rec']:.2%} | {r['val_pr_auc']:.4f} | {r['val_cost']:,.0f} | {meets} | Evaluated |\n"

    exp_md += f"""
---

## Selected Candidate Held-Out Evaluation (Scored Once)

The winning candidate selected on validation is **`{winner['id']}`** at operating threshold **$\\tau = {win_tau:.2f}$**.

| Metric | Phase 17 Baseline (Held-Out) | Selected Candidate `{winner['id']}` (Held-Out) | Delta |
|---|---|---|---|
| **Operating Threshold ($\\tau$)** | 0.35 | {test_metrics['threshold']:.2f} | {test_metrics['threshold'] - 0.35:+.2f} |
| **Precision** | 6.31% | {test_metrics['precision']:.2%} | {test_metrics['precision'] - 0.0631:+.2%} |
| **Recall** | 79.80% | {test_metrics['recall']:.2%} | {test_metrics['recall'] - 0.7980:+.2%} |
| **F1-Score** | 0.1170 | {test_metrics['f1']:.4f} | {test_metrics['f1'] - 0.1170:+.4f} |
| **ROC-AUC** | 0.7712 | {test_metrics['roc_auc']:.4f} | {test_metrics['roc_auc'] - 0.7712:+.4f} |
| **PR-AUC** | 0.1283 | {test_metrics['pr_auc']:.4f} | {test_metrics['pr_auc'] - 0.1283:+.4f} |
| **False Positives (FP)** | 48,139 | {test_metrics['fp']:,} | {test_metrics['fp'] - 48139:+,} |
| **False Negatives (FN)** | 821 | {test_metrics['fn']:,} | {test_metrics['fn'] - 821:+,} |
| **Total Expected Cost Units** | 2,469,531 | {test_metrics['cost_units']:,.0f} | {test_metrics['cost_units'] - 2469531.16:+,.0f} |

---

## Artifact Review Note (Hard Rule 2 Compliance)
- Saved file for review: `ml/models/lgbm_ieee_v2.pkl`
- SHA-256: `{v2_sha}`
- Size: {file_size:,} bytes
- **STOPPING INVARIANT**: This artifact is stored strictly as a file for review. It is NOT wired into the active serving runtime until user approval.
"""

    exp_log_path = os.path.join(_PROJECT_ROOT, "reports", "ieee_experiments.md")
    with open(exp_log_path, "w", encoding="utf-8") as f:
        f.write(exp_md)
    print(f"Updated experiment log at: {exp_log_path}")

    return {
        "winner": winner["id"],
        "sha256": v2_sha,
        "size": file_size,
        "test_metrics": test_metrics,
    }


if __name__ == "__main__":
    main()

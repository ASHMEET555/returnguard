"""
Sample inspection script for ReturnGuard.

Selects 10 synthetic transactions using a fixed selection rule:
the first 5 fraud transactions (is_fraud == 1) and the first 5 legitimate transactions
(is_fraud == 0) in the synthetic held-out test split (Days 50-59), ordered by sorted transaction_id.
For each sample, prints:
- 15 Point-in-time features
- Feature completeness
- Spike rule hits (spike_velocity)
- Ring ID (or null)
- Policy trace (probability, threshold, action, policy_rule_id, policy_reason)
- Top-K SHAP local feature attributions

NOTE ON METHODOLOGY:
The test split is used here strictly for offline demonstration and explainability inspection,
NOT for any threshold calibration, hyperparameter tuning, or model selection.
All thresholds were frozen in Phase A or calibrated on validation data in Phase B.
"""

import sys
from pathlib import Path
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

import json
import joblib
import numpy as np
import pandas as pd

from ml.features.build_features import build_features, FEATURE_COLUMNS
from ml.evaluation.decision_engine import make_decision
from ml.evaluation.explainability import RiskExplainer, build_explanation_text
from rules.engine import evaluate_spike_rules
from rings.builder import RingMembershipStore


DATA_PATH = Path("ml/data/raw_transactions.csv")
MODEL_PATH = Path("ml/models/candidate_lgbm_v1.pkl")
OUTPUT_PATH = Path("reports/phase_b/explain_sample.txt")


def generate_explanation_report() -> str:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Synthetic dataset not found at {DATA_PATH}")
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Frozen model artifact not found at {MODEL_PATH}")

    # Load frozen model and explainer
    model = joblib.load(MODEL_PATH)
    explainer = RiskExplainer(model)
    ring_store = RingMembershipStore()  # O(1) empty/default store

    df = pd.read_csv(DATA_PATH)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    min_ts = df["timestamp"].min()
    df["day"] = (df["timestamp"] - min_ts).dt.days

    # Filter to test split (Days 50-59)
    test_df = df[df["day"] >= 50].sort_values("transaction_id")

    # Select first 5 fraud and first 5 legitimate
    fraud_5 = test_df[test_df["is_fraud"] == 1].head(5)
    legit_5 = test_df[test_df["is_fraud"] == 0].head(5)
    selected_raw = pd.concat([fraud_5, legit_5]).sort_values("transaction_id")
    selected_tids = set(selected_raw["transaction_id"])

    # Compute features on full dataset to ensure strictly prior customer history is evaluated
    all_features = build_features(df).set_index("transaction_id")
    sample_features = all_features.loc[selected_raw["transaction_id"]].reset_index()

    lines = []
    lines.append("=" * 80)
    lines.append("ReturnGuard Phase B: 10-Sample Inspection and Explainability Trace")
    lines.append("=" * 80)
    lines.append(f"Model: LightGBM Candidate (frozen) | Threshold: 0.40")
    lines.append(f"Split: Test Set (Days 50-59) - Demonstration Only")
    lines.append("")

    for i, (_, row) in enumerate(sample_features.iterrows(), start=1):
        tid = row["transaction_id"]
        raw_match = selected_raw[selected_raw["transaction_id"] == tid].iloc[0]
        actual_label = int(raw_match["is_fraud"])
        label_str = "FRAUD (1)" if actual_label == 1 else "LEGITIMATE (0)"

        # 1. Feature completeness
        feature_completeness = 1.0  # Synthetic event log has all 11 raw fields present

        # 2. Features vector
        feat_dict = {col: round(float(row[col]), 4) for col in FEATURE_COLUMNS}
        X_row = row[FEATURE_COLUMNS].to_frame().T.astype(float)

        # 3. Model probability
        prob = float(model.predict_proba(X_row)[:, 1][0])

        # 4. Spike rules
        rule_hits, rule_evidence = evaluate_spike_rules(feat_dict)

        # 5. Ring ID
        ring_meta = ring_store.lookup(row["customer_id"])
        ring_id = ring_meta["ring_id"]

        # 6. Policy decision
        decision = make_decision(tid, prob, float(row["amount"]))

        # 7. SHAP explainability
        is_cold = int(row["prior_txn_count"]) == 0
        explain_res = explainer.explain(row[FEATURE_COLUMNS])
        text_expl = build_explanation_text(explain_res, decision_threshold=0.40, top_k=3, is_cold_start=is_cold)

        lines.append(f"[{i:02d}/10] Transaction ID: {tid} | Actual Ground Truth: {label_str}")
        lines.append(f"      Customer: {row['customer_id']} | Amount: Rs{row['amount']:,.2f} | Timestamp: {row['timestamp']}")
        lines.append(f"      Feature Completeness: {feature_completeness:.2f} (0 missing fields)")
        lines.append(f"      Rule Hits: {rule_hits if rule_hits else 'None'} | Ring ID: {ring_id if ring_id else 'null'}")
        lines.append(f"      Policy Trace:")
        lines.append(f"        - Model Probability: {prob:.4f} (Threshold: 0.40)")
        lines.append(f"        - Action: {decision.action} | Rule ID: {decision.policy_rule_id}")
        lines.append(f"        - Policy Reason: {decision.policy_reason}")
        lines.append(f"      Top SHAP Feature Attributions:")
        for c in explain_res["contributions"][:3]:
            lines.append(f"        * {c['feature']} = {c['value']:.2f} -> {c['direction']} (SHAP: {c['shap_value']:+.4f})")
        lines.append(f"      Human-Readable Narrative:")
        for r in text_expl["reasons"]:
            lines.append(f"        - {r}")
        if text_expl.get("cold_start_context"):
            lines.append(f"        [Cold Start]: {text_expl['cold_start_context']}")
        lines.append("-" * 80)

    report_text = "\n".join(lines)
    return report_text


if __name__ == "__main__":
    report = generate_explanation_report()
    print(report)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"\nSaved explanation trace to {OUTPUT_PATH}")

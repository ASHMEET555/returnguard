# 02 — Architecture (ML-layer sections, replacing the original)

Sections not listed here are unchanged from the original `02-architecture.md`.

---

## A. Module layout (ML layer)

| Path | Job |
|------|-----|
| `ml/data/generate_synthetic.py` | Synthetic transactions (verified) |
| `ml/features/build_features.py` | 15 causal features (verified) |
| `features/builder.py` | `build(order_id, as_of)` wrapper, writes `feature_snapshot_json` |
| `features/adapter_order_to_txn.py` | PayPal order → verified transaction schema |
| `ml/training/train_baseline.py`, `train_candidates.py` | Logistic regression, Random Forest, LightGBM (verified) |
| `ml/training/train_ieee.py` | IEEE retraining with `card_product_share` (verified path, versioned output) |
| `ml/evaluation/policy.py`, `risk_scoring.py`, `decision_engine.py` | Policy, score, decision (verified) |
| `ml/evaluation/cost_model.py`, `threshold_analysis.py` | Cost and threshold (verified) |
| `ml/explain/shap_service.py` | Read-only SHAP top-K over verified TreeSHAP |
| `ml/evaluate.py`, `ml/evaluate_lift.py` | Holdout reports and lift table |
| `services/policy_mapping.py` | Policy action → severity and suggested action |
| `rules/engine.py` | `spike_velocity` (evidence only) |
| `rings/builder.py` | Display-only ring module |
| `reports/` | Holdout, experiments, manifest |

---

## B. Data and splits (verified)

**Synthetic:** train days 0–39, validation 40–49, test 50–59. About 1.59% fraud.

**IEEE-CIS:** 590,540 rows, about 182 days, 20,663 fraud labels (about 3.499%). Train days 0–110, validation 110–140, test 140–182. The shared boundary at 110 must be fixed in Phase A so intervals do not overlap. Random splits are forbidden.

**IEEE leakage caution:** several IEEE aggregate columns (the C, D and V families) are not guaranteed to be as-of the transaction time. Any such column used as a feature must pass the leakage test in Phase B before it is used.

---

## C. Feature dictionary

**Frozen 15 (synthetic model):**

- Transaction and spending: `amount`, `amount_zscore`, `amount_vs_avg_ratio`, `prior_txn_count`, `time_since_prev_txn_min`
- Velocity: `velocity_5min`, `velocity_30min`, `velocity_60min`
- Novelty: `new_device_flag`, `new_geo_flag`
- Behavioural and temporal: `failed_ratio_trailing10`, `account_age_days`, `hour_of_day`, `is_night`, `day_of_week`

**IEEE variant (`features/dictionary_ieee_v1.yaml`):** the 15 mapped to IEEE fields where available, plus `card_product_share`. Device novelty and failure ratio are missing or differ in IEEE. Each mapping and each missing signal is documented in the file.

**Rules for changing the dictionary:** adding, removing or reordering a feature is a new dictionary version and needs retraining. It cannot be done inside another task.

**Order → transaction mapping (PayPal):** the adapter maps order amount, time, customer, merchant category and payment status. Device and geo come from the merchant's app session data when present. When absent, the sentinel path is used and the response sets `feature_completeness < 1.0` and lists the missing fields. Missing fields are never invented.

---

## D. Models and artifacts

| Artifact | Dataset | Role |
|----------|---------|------|
| `baseline_logreg_v1.pkl` | synthetic | Linear baseline (frozen) |
| `candidate_rf_v1.pkl` | synthetic | Nonlinear baseline (frozen) |
| `candidate_lgbm_v1.pkl` | synthetic | Demo and reference production model (frozen) |
| IEEE LightGBM Phase 17 artifact | IEEE-CIS | Real-world artifact at τ = 0.35 (frozen) |
| IEEE LightGBM v2 (only if the improvement program finds a better validated candidate) | IEEE-CIS | New version, approved by user before use |
| Amount-only baseline | both | Lift-table baseline, dataset-specific amount threshold |

LightGBM hyperparameters (verified): `num_leaves=31`, `max_depth=6`, `learning_rate=0.05`, `n_estimators=600`, `min_child_samples=20`, `subsample=0.8`, `colsample_bytree=0.8`, `scale_pos_weight=73.12`, `objective='binary'`. Early stopping: 50 rounds on validation AUC, with `eval_metric='auc'` and `first_metric_only=True`. Do not use `average_precision` for early stopping; it stopped at iteration 1.

---

## E. Evaluation (verified results, reproduced in Phase C)

### Synthetic held-out test

| Model | Precision | Recall | F1 | PR-AUC | ROC-AUC | Expected cost (₹) |
|---|---:|---:|---:|---:|---:|---:|
| Logistic regression | 0.448 | 0.825 | 0.581 | 0.739 | 0.957 | 110,582 |
| Random Forest | 0.746 | 0.868 | 0.802 | 0.883 | 0.978 | 68,479 |
| LightGBM | 0.785 | 0.882 | 0.830 | 0.901 | 0.984 | 41,377 |

LightGBM reduces expected cost by about 62.6% against logistic regression and about 39.6% against Random Forest.

At τ = 0.40 on validation: precision 0.695, recall 0.877, 216 FP, 69 FN, cost ₹54,827.

### IEEE-CIS external validation

- Experiment A (synthetic model transferred directly): ROC-AUC 0.443, recall 0.5%. Failed. Reported as a finding.
- Experiment B (retrained on IEEE with `card_product_share`): `card_product_share` was third by gain.
- Phase 17 held-out: ROC-AUC 0.771, recall 79.8%, precision 6.3%, 48,139 FP, 3,243 of 4,064 fraud caught, τ = 0.35, cost 2,469,531 cost units (to be recomputed in ₹ per the verification item).

**Honest reading:** the IEEE model is a high-recall filter for step-up verification. It is not a precise blocker. Every external document says so.

### Cost model for reporting

Cost (₹) = FP count × ₹50 + sum of FN amounts × 0.50. The IEEE currency is not stated, so its ₹ figure is labeled "currency assumed, UNVERIFIED."

---

## F. Explainability (SHAP, first layer of explanation)

- Shipping artifact: LightGBM with `shap.TreeExplainer` (verified).
- The top-K SHAP contributions (signed, with direction) form `reason_codes` in the score response.
- Additivity check: reconstructed probability from base value plus SHAP sum, compared with predicted probability. Difference must be below 1e-4. Otherwise `explanation_status: unavailable`.
- Human-readable text comes from deterministic templates. Templates use only the feature name, direction and stored values.
- History-dependent explanations are filtered for customers with no prior transactions.
- SHAP never changes the probability, tier, policy rule or action.
- SHAP for Random Forest and logistic regression is optional and reported only in the lift analysis. It is not in the score response.

---

## G. Score response contract (ML layer)

```json
{
  "order_id": "ord_...",
  "channel": "paypal",
  "risk_score": 0.72,
  "risk_score_100": 72,
  "tier": "HIGH",
  "policy_rule": "HIGH_STEP_UP",
  "policy_action": "STEP_UP_VERIFICATION",
  "severity": "warning",
  "suggested_action": "step_up_verify",
  "reason_codes": [
    {"feature": "velocity_5min", "direction": "increases_risk", "shap_rank": 1}
  ],
  "rule_hits": ["spike_velocity"],
  "ring_id": null,
  "model_version": "lgbm_synth_v1",
  "dataset": "synthetic",
  "threshold": 0.40,
  "model_status": "ok",
  "feature_completeness": 0.87,
  "explanation_status": "ok",
  "shadow": true
}
```

Field notes:
- `risk_score` is the probability (0–1). `risk_score_100` is the verified informational score.
- `policy_action` comes from the verified policy. `severity` and `suggested_action` come from `services/policy_mapping.py`.
- `channel` is informational. The verified model has no channel input.
- `ring_id` is display-only and `null` when no ring applies.
- `model_status`: `ok` or `unavailable`. On `unavailable`, the fallback returns `policy_action` from the amount-only rule (`STEP_UP_VERIFICATION` at or above the amount threshold, otherwise `ALLOW_WITH_MONITORING`). It never returns `BLOCK`.

---

## H. Rules and rings (evidence only)

- `spike_velocity` fires from the verified velocity features. Thresholds are in `rules/config.yaml`, calibrated on validation. It is recorded in `rule_hits` and in the evidence bundle. It does not set the action.
- Ring module: deterministic union-find over phone, address and device. Components of size 3 or more get a `ring_id`. Display-only. Not a model input. Lookup-only on the request path.
- If the verified data lacks phone or address fields, the seed adapter provides them for the demo, and the synthetic model is not retrained because of this.

---

## I. Leakage rules

- All history features use only prior transactions (j < i) and sentinels on cold start.
- Leakage test: insert data after time t, then assert the feature vector at t is unchanged. Covers all 15 features, the IEEE variant, and any IEEE aggregate column used.
- Batch ring builds are cut at `as_of`. The online path only reads precomputed membership.

---

## J. Explicit boundary for the evidence engine (Phase G, unchanged)

The evidence engine receives the stored decision record, the top-K SHAP contributions, and the rule hits. It does not recompute SHAP and does not change the action. Phase G's guardrails are unchanged from the original plan. If you later approve adding a vector DB, it goes into Phase G as a new decision (M6).
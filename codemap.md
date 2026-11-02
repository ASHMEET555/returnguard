# 00 — Codebase map (ML layer only)

Scope: this file lists only the ML layer taken from the verified MerchantShield codebase. The frontend, the Razorpay-track framing, and any other verified parts are not adopted. Everything else in the PayPal + AI plan stays as originally written.

Status key:
- **VERIFIED-FROZEN**: adopt unchanged. Do not modify.
- **VERIFIED-EXTEND**: adopt, then add changes only through new or additive code.
- **NEW**: built in this plan.
- **KEEP-ORIGINAL**: from the original PayPal + AI plan, unchanged.
- **DROP**: removed from the active tree. Move to `legacy/`.

---

## 1. Verified ML layer (adopted)

| Path | Status | Role |
|------|--------|------|
| `ml/data/generate_synthetic.py` | VERIFIED-FROZEN | Synthetic transactions. 213,000 rows, 2,200 customers, 180 merchants, 60 days from 2026-04-01, seed 42. Outputs are gitignored and regenerated. |
| `ml/features/build_features.py` | VERIFIED-FROZEN | 15 causal features using prior transactions only (j < i). Cold start uses sentinels. |
| `ml/training/train_baseline.py` | VERIFIED-FROZEN | Logistic regression, `class_weight='balanced'`, `max_iter=2000`. |
| `ml/training/train_candidates.py` | VERIFIED-FROZEN | Random Forest (300 trees, depth 10, min leaf 5) and LightGBM. |
| `ml/evaluation/explainability.py` | VERIFIED-FROZEN | TreeSHAP with additivity check (< 1e-4). Deterministic templates. Cold-start filter. |
| `ml/evaluation/policy.py` | VERIFIED-FROZEN | Five sequential rules on probability and amount. SHAP cannot affect it. |
| `ml/evaluation/risk_scoring.py` | VERIFIED-FROZEN | Probability to 0–100 score and LOW / MEDIUM / HIGH / CRITICAL tier. Informational only. |
| `ml/evaluation/decision_engine.py` | VERIFIED-FROZEN | Combines policy output into the decision record. |
| `ml/evaluation/cost_model.py` | VERIFIED-FROZEN | FP = ₹50, FN = 50% of amount. Canonical cost model for the ML layer. |
| `ml/evaluation/threshold_analysis.py` | VERIFIED-FROZEN | Threshold sweep with recall constraint. |
| `ml/models/baseline_logreg_v1.pkl` | VERIFIED-FROZEN | Artifact. Hash in manifest. Never overwrite. |
| `ml/models/candidate_rf_v1.pkl` | VERIFIED-FROZEN | Artifact. Same rule. |
| `ml/models/candidate_lgbm_v1.pkl` | VERIFIED-FROZEN | Synthetic production artifact. Same rule. |
| `ml/external/ieee/` | VERIFIED-EXTEND | IEEE-CIS loader via `IEEE_DATA_DIR`. Data not committed. |
| IEEE Phase 17 artifact (LightGBM, retrained with `card_product_share`) | VERIFIED-EXTEND | Real-world artifact. Name and hash recorded in Phase C. Any improvement is saved as a new version (`_v2`), never overwrite. |
| `backend/services/risk_service.py` | VERIFIED-EXTEND | Orchestrates features, model, policy, SHAP, audit. Extend via wrapper services. |
| `backend/services/model_loader.py` | VERIFIED-EXTEND | Loads artifacts once at startup. Add `model_status` (Phase C). |
| `backend/schemas/transaction.py`, `response.py` | VERIFIED-EXTEND | Additive fields only. |
| `backend/api/routes.py` | VERIFIED-EXTEND | Score and explain routes. Additive `/v1` routes only. |
| `tests/` (ML tests) | VERIFIED-FROZEN | Baseline 269 passing across 8 files. Run before and after every change. |

Frozen versions: Python 3.13, FastAPI 0.141.1, Uvicorn 0.52.4, Pydantic 2.13.4, NumPy 2.4.4, Pandas 3.0.2, Scikit-learn 1.8.0, LightGBM 4.7.0, SHAP 0.52.0, SciPy 1.17.1, Joblib 1.5.3, SQLAlchemy 2.0.52, Pytest 9.1.1, HTTPX 0.28.1.

Not adopted from the verified codebase: `frontend/` (all of it), the Razorpay-track documentation, and the SQLite-only audit as the sole store (see M5).

---

## 2. New ML-layer modules

| Path | Status | Purpose |
|------|--------|---------|
| `features/dictionary.yaml` | NEW | Frozen 15-feature dictionary, generated from code names and checked against the spec. |
| `features/dictionary_ieee_v1.yaml` | NEW | IEEE variant: the 15 mapped to IEEE fields, plus `card_product_share`, with missing signals noted. |
| `features/builder.py` | NEW | Wrapper: `build(order_id, as_of)` returns the 15-feature vector and writes `feature_snapshot_json`. |
| `features/adapter_order_to_txn.py` | NEW | Maps PayPal order fields to the verified transaction schema. Missing fields are flagged, not invented. |
| `rules/engine.py`, `rules/config.yaml` | NEW | Velocity rule (`spike_velocity`) for evidence only. Not a model input. Does not set the action. |
| `rings/builder.py` | NEW | Deterministic union-find over phone, address and device. Output is display-only (`ring_id`). Not a model input. |
| `ml/evaluate.py` | EXTEND | Test-split evaluation, separate synthetic and IEEE sections. |
| `ml/explain/shap_service.py` | NEW | Read-only wrapper over verified TreeSHAP. Produces top-K contributions for the score response and the evidence bundle. |
| `ml/evaluate_lift.py` | NEW | Lift table: amount-only, logistic regression, Random Forest, LightGBM. |
| `reports/` | NEW | `holdout_metrics.md/json`, `ieee_experiments.md`, `artifact_manifest.json`. |
| `services/policy_mapping.py` | NEW | Maps policy action to severity and suggested action (Phase C). |

---

## 3. Original plan items, unchanged by this document

These are in the original plan and stay exactly as written: PayPal sandbox connector, webhooks, disputes (Phase D); policy gate on the money path (Phase D); audit tables and shadow default (Phase E); AG Grid Community console and React detail drawer (Phase F); evidence pack, LLM assistant, guardrails and gated submit (Phase G); submission package (Phase H).

The original plan's schema tables (`order`, `payment`, `payment_event`, `dispute`, `evidence_pack`, `evidence_submission`, `merchant_audit`) are still needed by Phases D–H. Phase A keeps them, as schema only.

---

## 4. Dropped from the original plan's ML layer

| Item | Reason |
|------|--------|
| COD/RTO and PayPal refund-abuse generator (`data/generator/`) | Replaced by the verified synthetic generator. The PayPal sandbox seed in Phase D reads the adapter output instead. |
| Parquet train/val/test split for COD labels | Replaced by the verified chronological splits. |
| Old feature dictionary (25 COD/PayPal features) and the 18-feature Option A | Replaced by the verified 15 features. The IEEE variant is versioned separately. |
| XGBoost as primary model | Replaced by LightGBM. Random Forest and logistic regression remain as baselines. |
| Old severity bands (0.30 / 0.50 / 0.67) | Replaced by the verified policy. Severity is derived from policy action (see Phase C). |
| RTO-based Net ₹ formula | Replaced by the verified cost model (see M-cost in the brief). |
| Spike rules `spike_cod_heavy` and `spike_micro` | COD and return-abuse specific. Not carried over. `spike_velocity` is kept. |

---

## 5. Data on disk (verify in Phase A)

- Synthetic: regenerate with seed 42. Compare output hashes.
- IEEE-CIS: `train_transaction.csv` and `train_identity.csv` under `IEEE_DATA_DIR`. Expected 590,540 rows and 20,663 fraud labels.
- Frozen models: the three synthetic `.pkl` files and the IEEE artifact. Hash them.
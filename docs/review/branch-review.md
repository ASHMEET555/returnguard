# Branch Review — ReturnGuard ML Layer Branches

**Date**: 2026-11-02  
**Base Branch**: `main` (commit `e3398ab`, Phase A + Phase B merge)  
**Evaluated Branches**:  
1. `ml-verified` (commit `342173d`, Phase A ML adoption)  
2. `ml-features-verified` (commit `7b7e01b`, Phase B causal features, rules, rings)  

---

## 1. File Classification Matrix

Every file modified, added, or moved between `main` and `ml-features-verified` is classified according to the `codemap.md` taxonomy:

| File Path | Codemap Status | Purpose & Role |
|---|---|---|
| `ml/data/generate_synthetic.py` | **VERIFIED-FROZEN** | Synthetic transaction generator (213k rows, seed 42) |
| `ml/features/build_features.py` | **VERIFIED-FROZEN** | 15 causal feature builder (prior rows only, $j < i$) |
| `ml/training/train_baseline.py` | **VERIFIED-FROZEN** | Logistic regression baseline training |
| `ml/training/train_candidates.py` | **VERIFIED-FROZEN** | Random Forest and LightGBM training |
| `ml/evaluation/explainability.py` | **VERIFIED-FROZEN** | TreeSHAP explainer with additivity check |
| `ml/evaluation/policy.py` | **VERIFIED-FROZEN** | Five-rule decision policy |
| `ml/evaluation/risk_scoring.py` | **VERIFIED-FROZEN** | 0–100 score and LOW/MEDIUM/HIGH/CRITICAL display tier |
| `ml/evaluation/decision_engine.py` | **VERIFIED-FROZEN** | Evaluates policy into decision record |
| `ml/evaluation/cost_model.py` | **VERIFIED-FROZEN** | Canonical cost model ($\text{FP}=₹50, \text{FN}=50\%$) |
| `ml/evaluation/threshold_analysis.py` | **VERIFIED-FROZEN** | Threshold sweep with recall constraint |
| `ml/models/baseline_logreg_v1.pkl` | **VERIFIED-FROZEN** | Logistic regression model artifact |
| `ml/models/candidate_rf_v1.pkl` | **VERIFIED-FROZEN** | Random Forest model artifact |
| `ml/models/candidate_lgbm_v1.pkl` | **VERIFIED-FROZEN** | Primary LightGBM model artifact |
| `ml/models/lgbm_v1_metadata.json` | **VERIFIED-FROZEN** | Training metadata and split specs |
| `ml/models/threshold_analysis_chart.png` | **VERIFIED-FROZEN** | Validation curve visualization |
| `ml/models/threshold_sweep_validation.csv` | **VERIFIED-FROZEN** | Threshold metrics lookup table |
| `ml/external/ieee/*` (7 files) | **VERIFIED-EXTEND** | IEEE loader, features, and split modules |
| `backend/services/risk_service.py` | **VERIFIED-EXTEND** | Risk orchestration service |
| `backend/services/model_loader.py` | **VERIFIED-EXTEND** | Model loading and cache |
| `backend/schemas/transaction.py` | **VERIFIED-EXTEND** | Input transaction schema |
| `backend/schemas/response.py` | **VERIFIED-EXTEND** | Risk decision response schema |
| `backend/api/routes.py` | **VERIFIED-EXTEND** | API endpoints for risk evaluation |
| `backend/main.py` | **UNLISTED (Adopted)** | FastAPI application bootstrap |
| `backend/config/settings.py` | **UNLISTED (Adopted)** | Backend configuration parameters |
| `backend/services/audit_service.py` | **UNLISTED (Adopted)** | Audit logging implementation |
| `features/dictionary.yaml` | **NEW** | Frozen 15-feature dictionary |
| `features/dictionary_ieee_v1.yaml` | **NEW** | IEEE variant feature dictionary |
| `features/builder.py` | **NEW** | Wrapper returning 15-feature vector & audit snapshot |
| `features/adapter_order_to_txn.py` | **NEW** | Pure PayPal order adapter |
| `rules/engine.py` | **NEW** | Velocity rule (`spike_velocity`) for review evidence |
| `rules/config.yaml` | **NEW** | 99th percentile validation thresholds for velocity |
| `rings/builder.py` | **NEW** | Deterministic union-find ring builder (display-only) |
| `scripts/check_ieee_load.py` | **NEW** | IEEE data loading verification script |
| `scripts/explain_sample.py` | **NEW** | Fixed sample explainability runner |
| `scripts/generate_manifest.py` | **NEW** | Artifact hashing script |
| `scripts/seed_adapter.py` | **NEW** | Offline PayPal seed generator |
| `reports/artifact_manifest.json` | **NEW** | SHA-256 manifest of model artifacts |
| `reports/phase_a/*` (6 files) | **NEW** | Phase A verification logs and reports |
| `reports/phase_b/*` (7 files) | **NEW** | Phase B leakage and test reports |
| `docs/api/ml_contract.md` | **NEW** | HTTP contract specification |
| `docs/data_mapping.md` | **NEW** | PayPal order to transaction mapping |
| `docs/split_decisions.md` | **NEW** | IEEE temporal split boundaries |
| `docs/decisions.md` | **NEW** | Architecture decision record |
| `db/migrations.py` | **NEW / EXTEND** | Idempotent migration adding `audit_score_events` |
| `db/models.py` | **EXTEND** | Added `AuditScoreEvent` model |
| `legacy/*` (19 files) | **DROP** | Old COD/RTO generator, old rules, old features, old tests |
| `tests/*` (24 files) | **VERIFIED / NEW** | 8 baseline ML test files + Phase A/B tests |

---

## 2. Invariant Checks & Verification

1. **Frozen Files Integrity**:
   - Every file marked **VERIFIED-FROZEN** was copied from `merchantshield-ai` without modification.
   - All 3 model artifacts match the SHA-256 manifest recorded in `reports/artifact_manifest.json`.

2. **Git Hygiene (No Data, Secrets, or Raw PII)**:
   - Zero raw datasets (`.parquet`, `.csv`, `.duckdb`) are committed.
   - Only `ml/models/threshold_sweep_validation.csv` (a 2 KB summary table of threshold metrics) is tracked, which is a verified model artifact.
   - Model artifacts (`.pkl`) are tracked directly in `ml/models/` and protected by SHA-256 checksums in `tests/test_artifact_hashes.py`. Decision: models are small (< 3 MB total) and remain in git directly without requiring Git LFS.
   - Comprehensive secret scan across the full diff revealed **0 API keys, tokens, or private credentials**.

3. **Legacy Pipeline Isolation**:
   - The old ReturnGuard data pipeline (old COD/RTO generator `data/generator/`, old features builder, old spike rules, and old test files) was moved to `legacy/`.
   - No active module in `ml/`, `backend/`, `features/`, `rules/`, `rings/`, or `api/` imports from `legacy/`.

4. **Frontend & Documentation Exclusions**:
   - `merchantshield-ai/frontend/` (React/Vite dashboard) was **NOT adopted**.
   - `merchantshield-ai/docs/phase17_razorpay_real_data_validation.md` and related Razorpay-specific materials were **NOT adopted** into the active tree.
   - Front-end will be built as an AG Grid Community merchant console in Phase F per the PayPal + AI plan.

5. **Codemap Dropped Items**:
   - All items listed in Codemap Section 4 ("Dropped from the original plan's ML layer") are verified absent from the active tree:
     - Old COD/RTO and PayPal refund-abuse generator $\to$ moved to `legacy/`.
     - Parquet train/val/test split for COD labels $\to$ removed.
     - Old 25-feature dictionary $\to$ moved to `legacy/dictionary_cod_legacy.yaml`.
     - XGBoost primary model $\to$ replaced by LightGBM.
     - Old score bands (0.30 / 0.50 / 0.67) $\to$ replaced by verified 5-rule policy.
     - RTO Net ₹ formula $\to$ replaced by canonical cost model.
     - Spike rules `spike_cod_heavy` and `spike_micro` $\to$ dropped; only `spike_velocity` kept.

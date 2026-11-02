# Reconciliation Report — ReturnGuard & MerchantShield Merge

**Date**: 2026-11-02  
**Purpose**: Document all architectural, algorithmic, and schema conflicts between the legacy `main` codebase and the verified `merchantshield-ai` ML branches, along with the explicit rationale for each resolution.

---

## 1. Conflict Reconciliation Matrix

| # | Conflict Area | Legacy `main` State | MerchantShield / New Plan State | Chosen Resolution | Rationale |
|---|---|---|---|---|---|
| **1** | **Synthetic Data Generator** | Custom COD/RTO return-abuse generator (`data/generator/`) | Verified synthetic transaction generator (`ml/data/generate_synthetic.py`, seed 42, 213k txns) | **Adopt MerchantShield generator; move legacy generator to `legacy/data_generator/`** | The verified generator provides 213k transactions with realistic customer trajectories, velocity patterns, and proven benchmark reproducibility across models. Legacy generator preserved in `legacy/`. |
| **2** | **Primary Model** | XGBoost with custom hyperparameter search (`ml/train.py`) | LightGBM candidate model (`ml/models/candidate_lgbm_v1.pkl`), with Random Forest & Logistic Regression baselines | **Adopt LightGBM as primary; keep RF & LogReg as baselines** | LightGBM artifact is pre-trained, mathematically verified, fast for real-time inference (< 5 ms), and integrates natively with TreeSHAP and additivity assertions. |
| **3** | **Risk Severity & Actions** | Static score thresholds: 0.30 (LOW), 0.50 (MEDIUM), 0.67 (HIGH) | 5-rule policy in `ml/evaluation/policy.py` evaluating fraud probability and amount | **Adopt policy-derived severity; drop static score bands** | Severity is derived strictly from policy action (`BLOCK` $\to$ `critical`, `STEP_UP` $\to$ `warning`, `MONITOR` $\to$ `info`, `ALLOW` $\to$ `none`). Ensures decision action and severity never contradict each other. |
| **4** | **Feature Dictionary** | 25 COD/RTO/PayPal features (`features/dictionary.yaml`) | 15 causal historical features (`features/build_features.py`) + IEEE variant | **Adopt verified 15-feature dictionary; move old 25-feature dictionary to `legacy/`** | All 15 features are strictly causal ($j < i$), proven leak-free by perturbation tests ($\text{atol}=0$), and supported by cold-start sentinels. Old 25 features moved to `legacy/dictionary_cod_legacy.yaml`. |
| **5** | **Rules & Fraud Rings Role** | Rules and graph rings fed as feature inputs into XGBoost | Rules and rings produce evidence and UI metadata; never enter model feature vector | **Adopt evidence-only / display-only semantics for rules & rings** | Enforces clear separation of concerns: LightGBM scores pure transaction behavior; `spike_velocity` elevates review priority; graph rings cluster shared entities for visual merchant investigation without biasing model calibration. |
| **6** | **Frontend Application** | AG Grid Community console planned for Phase F | Full React/Vite merchant dashboard (`merchantshield-ai/frontend/`) | **Exclude MerchantShield frontend; keep original AG Grid Community console plan** | The hackathon requires AG Grid Community in the merchant investigation experience. MerchantShield's React frontend is excluded, leaving `web/` ready for Phase F. |
| **7** | **Database Layer** | SQLite only (`returnguard.db`) | SQLite audit store in MerchantShield; PostgreSQL required by hackathon spec | **PostgreSQL as production primary; SQLite for local dev & testing** | Migration layer (`db/migrations.py`) is written to be strictly idempotent across both PostgreSQL and SQLite, adapting column types dynamically. |
| **8** | **Action Semantics (BLOCK)** | Auto-block payment execution | Decision recommendation only (`BLOCK` = recommend decline / route to investigation) | **Adopt defense-only stance; no automated money movement** | Hackathon track bar and safety rules mandate defense-only semantics: ReturnGuard recommends actions; the merchant reviews and executes captures or holds in PayPal. |

---

## 2. Invariant Checklist Before Merge

- [x] No verified frozen file has been modified or overwritten.
- [x] Model artifacts match SHA-256 manifest recorded in `reports/artifact_manifest.json`.
- [x] Full ML test suite passes with zero regression.
- [x] Legacy data generator and old 25-feature dictionaries are preserved under `legacy/`.
- [x] No data files (`.parquet`, `.csv`, `.duckdb`), secrets, or raw PII are committed in git.
- [x] All 8 conflicts resolved with documented rationale.

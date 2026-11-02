# Phase A Discovery Report

Date: 2026-11-01
Working Directory: `returnguard` (RG_DIR)
Source Directory: `merchantshield-ai` (VERIFIED_DIR, commit: `f9a4333b4136d5d0dfcd3e4cfb018e07a3b3599f`)

## 1. Verified ML Layer Overview (VERIFIED_DIR)
The verified ML layer from `merchantshield-ai` implements a card-not-present payment fraud detection system:
- **Synthetic Data Generator (`ml/data/generate_synthetic.py`)**: Generates 213,000 raw transaction events across 60 days (seed 42, 2,200 customers, 180 merchants) with latent compromise intensity. Observable raw columns only.
- **Feature Pipeline (`ml/features/build_features.py`)**: Computes exactly 15 strictly prior causal features without future leakage ($j < i$). Cold start handles missing history via sentinels.
- **Baseline & Candidate Models (`ml/training/`)**: Logistic regression baseline (`train_baseline.py`), Random Forest and LightGBM candidates (`train_candidates.py`).
- **Frozen Model Artifacts (`ml/models/`)**: `baseline_logreg_v1.pkl`, `candidate_rf_v1.pkl`, `candidate_lgbm_v1.pkl`, with validation sweep metadata in `lgbm_v1_metadata.json`.
- **Evaluation & Policy (`ml/evaluation/`)**:
  - `cost_model.py`: Verified asymmetric cost model: FP = ₹50 flat, FN = 50% of transaction amount.
  - `policy.py`: 5 deterministic sequential rules on predicted fraud probability and amount (BLOCK, STEP_UP, REVIEW, ALLOW).
  - `risk_scoring.py`: 0–100 risk score and LOW / MEDIUM / HIGH / CRITICAL informational tier.
  - `explainability.py`: TreeSHAP with strict additivity check ($< 10^{-4}$ tolerance), top-K features, and deterministic reason templates.
  - `decision_engine.py`: Combines model probability, policy action, and risk tier into the final decision payload.
- **IEEE-CIS Integration (`ml/external/ieee/`)**: Chronological split at Day 110/140, card product feature extraction (`card_product_share`), and validation pipelines.
- **Backend & Schemas (`backend/`)**: FastAPI routes (`/v1/score`, `/v1/explain`), Pydantic schemas (`transaction.py`, `response.py`), and orchestration services (`risk_service.py`, `model_loader.py`, `audit_service.py`).
- **Test Suite (`tests/`)**: 8 test files verifying decision logic, API contracts, TreeSHAP additivity, leakage immunity, card product features, and boundary conditions.

## 2. ReturnGuard Current State & Plan Conflicts (RG_DIR)
The current `returnguard` repository was configured around COD/RTO return abuse prevention. The following components conflict with the adopted ML layer plan and will be resolved in Phase A:

1. **Synthetic Data Generator (`data/generator/`)**:
   - *Conflict*: Generates synthetic e-commerce orders with COD and RTO delivery statuses (`rto_delivered`) and parquet splits.
   - *Resolution*: Move to `legacy/`. Replaced by `ml/data/generate_synthetic.py`.
2. **Feature Dictionary (`features/dictionary.yaml`) & Builder (`features/builder.py`)**:
   - *Conflict*: Contains 31 features for COD/RTO delivery risk rather than the 15 payment fraud features.
   - *Resolution*: Move old dictionary to `legacy/`. Generate new `features/dictionary.yaml` (15 features) and `features/dictionary_ieee_v1.yaml` (16 features with `card_product_share`).
3. **Spike Rules (`rules/`)**:
   - *Conflict*: Contains `spike_cod_heavy` and `spike_micro` which are return-abuse specific.
   - *Resolution*: Move COD/micro spike rules to `legacy/`. Retain `spike_velocity` as an informational signal.
4. **Database Schema (`db/models.py`)**:
   - *Conflict*: `AuditScoreEvent` lacks required score contract fields: `decision_id`, `tier`, `policy_rule`, `policy_action`, `threshold`, `model_status`, `feature_completeness`, and `explanation_status`.
   - *Resolution*: Update `audit_score_events` table definition with idempotent migration support and `feature_snapshot_json`.
5. **Cost Model & Documentation (`README.md`, `docs/`)**:
   - *Conflict*: References RTO Net ₹ formula and COD return abuse.
   - *Resolution*: Update documentation to card-not-present payment fraud, verified cost model (FP = ₹50, FN = 50% amount), and soft policy semantics (BLOCK = investigate).

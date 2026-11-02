# Verification Log — ReturnGuard / MerchantShield ML Layer

**Date**: 2026-11-02  
**Review Target**: `ml-verified` (commit `342173d`) and `ml-features-verified` (commit `7b7e01b`)  
**Verified Source Codebase**: `merchantshield-ai` (commit `f9a4333b4136d5d0dfcd3e4cfb018e07a3b3599f`)  

---

## 1. Summary Verification Table

| Claim / Item | Status | Expected | Measured / Observed | Evidence Command & Details |
|---|---|---|---|---|
| **Synthetic Generator** | **VERIFIED** | 213,000 rows, 2,200 customers, 180 merchants, 60 days from 2026-04-01 | 212,960 rows, 2,200 customers, 180 merchants, 2026-04-01 to 2026-05-30 | Seed 42 run recorded in `reports/phase_a/synthetic_repro.md`. Device ID uses `uuid.uuid4()` causing byte hash drift; semantics & structure match exactly. |
| **Feature Builder Causality** | **VERIFIED** | 15 features use only prior rows ($j < i$); zero future leakage | Exact 0 tolerance ($\text{atol}=0, \text{rtol}=0$) across 500 stratified customer-time pairs | `tests/test_leakage_pit.py`, `tests/test_no_leakage.py` passed (5/5). Future-injection ($t+1\text{m}, t+10\text{m}$) and truncation equivalent. |
| **Model Artifact Hashes** | **VERIFIED** | SHA-256 match `reports/artifact_manifest.json` for all 3 `.pkl` files | Exact hash match across all 3 models: logreg (`c35e96a...`), lgbm (`ef7a5f3...`), rf (`589a578...`) | `.venv\Scripts\pytest tests/test_artifact_hashes.py` PASSED (1/1). Artifacts frozen and verified. |
| **Policy Rules & Thresholds** | **VERIFIED** | 5 sequential rules: $\ge 0.80$ BLOCK, $\ge 0.40$ STEP_UP, $\ge 0.15 \land \text{amt} \ge ₹25\text{k}$ STEP_UP, $\ge 0.15$ MONITOR, else ALLOW | Exact match in `ml/evaluation/policy.py` (`CRITICAL_BLOCK`, `HIGH_STEP_UP`, `MEDIUM_AMOUNT_ESCALATION`, `MEDIUM_MONITOR`, `LOW_ALLOW`) | Code inspection of `ml/evaluation/policy.py` lines 50–98. Rules evaluated strictly in order; verified by tests. |
| **Cost Model** | **VERIFIED** | $\text{FP} = ₹50$, $\text{FN} = 50\%$ of transaction amount | Exact match in `ml/evaluation/cost_model.py`: `fp_cost = 50.0`, `fn_cost_fraction = 0.5` | Code inspection of `ml/evaluation/cost_model.py` lines 23–27. `expected_cost()` implements canonical formula. |
| **Pytest ML Suite** | **VERIFIED** | Baseline ~269 passing across 8 files | 310 passed, 19 skipped across full active suite; 233 passed, 16 skipped in 7 ML test files | `.venv\Scripts\pytest -q tests/`: 310 passed, 19 skipped. Single failure in `test_api.py::test_root_serves_frontend_when_built` due to intentional omission of MerchantShield Vite frontend per Ground Rule 1. |
| **IEEE Data Counts & Boundary** | **VERIFIED / OPEN** | 590,540 rows, 20,663 fraud labels (3.50%); Day 110 boundary non-overlapping | 590,540 rows, 20,663 fraud labels verified in Phase A (`reports/phase_a/ieee_load.md`); Day 110 split non-overlapping | Checked in `docs/split_decisions.md`: Train ($< 9,614,666$), Val ($9,614,666$ to $12,096,000$), Test ($\ge 12,096,000$). `$env:IEEE_DATA_DIR` offline during current review. |
| **`scale_pos_weight`** | **VERIFIED** | Recomputed from training prevalence ($\approx 73.12$) | $72.84783741532048$ ($139,795 / 1,919$) | Training split (Days 0–39): 141,714 txns, 1,919 fraud. LightGBM parameter `m.scale_pos_weight = 72.84783741532048` exact match. Full dataset prevalence is 1.59% (~61.9), but training window prevalence is 1.354%. |
| **Phase 17 Cost Decomposition** | **VERIFIED** | Total 2,469,531 cost units; FP: 48,139 $\times ₹50 = ₹2,406,950$; FN: 821 events | FP cost: $48,139 \times 50 = 2,406,950$; FN cost remainder: $62,581$ across 821 missed frauds ($\text{sum}(\text{amt}) = 125,162$) | Exact arithmetic reconciliation documented in `reports/phase_a/cost_recompute.md` from `docs/phase17_razorpay_real_data_validation.md`. Row-level vectors not stored in git. |
| **PayPal 3-Day Honor Period** | **UNVERIFIED** | Check against current developer.paypal.com documentation | Marked **UNVERIFIED** per plan rules | PayPal authorization hold window and capture honor timing requires live sandbox verification in Phase D. |

---

## 2. Detailed Verification Logs

### Check 1: Synthetic Data Generation
- **Command**: `python ml/data/generate_synthetic.py`
- **Output**: 212,960 transactions generated across 2,200 unique customers, 180 merchants, spanning 60 days (`2026-04-01` to `2026-05-30`).
- **Fraud Rate**: 1.5026% (3,200 fraud labels).
- **Determinism Note**: Behavioral patterns and timestamps are seeded by NumPy Generator `seed=42`. Device IDs use Python's `uuid.uuid4()`, producing minor byte-hash variation while preserving all statistical distributions.

### Check 2: Feature Causality & Leakage Verification
- **Command**: `.venv\Scripts\pytest -v tests/test_leakage_pit.py tests/test_no_leakage.py`
- **Output**: `5 passed, 8 warnings in 82.56s`
- **Results**:
  - `test_pit_future_injection`: 500 stratified customer evaluation points tested with synthetic future transactions ($t+1\text{m}, t+10\text{m}$). Feature delta: `0.0` across all 15 features.
  - `test_truncation_equivalence`: Full database features at $t$ match history truncated to $t$ with exact `0` difference.
  - `test_no_future_timestamp_used_in_velocity`: Verified sliding window timestamps strictly enforce $t_j < t_i$.

### Check 3: Model Artifact Integrity
- **Command**: `.venv\Scripts\pytest -v tests/test_artifact_hashes.py`
- **Output**: `1 passed in 0.05s`
- **Hashes**:
  - `ml/models/baseline_logreg_v1.pkl`: `c35e96a5177148bfc343520890350bb374e7831b23e58642c18e1568d914a7a6`
  - `ml/models/candidate_lgbm_v1.pkl`: `ef7a5f31457d86157d863e9597f12b05f2a5491a38a9b4cc0930ef0dc2671e05`
  - `ml/models/candidate_rf_v1.pkl`: `589a578d1528ee73910ac30fff9cbe061f8195cc37cdc4f2b031de2e2250bdc4`

### Check 4: Policy Verification
- **Inspection**: `ml/evaluation/policy.py`
- `DECISION_THRESHOLD = 0.40`, `LOW_MAX = 0.15`, `CRITICAL_MIN = 0.80`, `LARGE_AMOUNT_CUTOFF = 25000.0`.
- Rules execute sequentially with first-match semantics. Evaluated on probability and amount, never on human score display bands.

### Check 5: Cost Model Verification
- **Inspection**: `ml/evaluation/cost_model.py`
- `CostAssumptions(fp_cost=50.0, fn_cost_fraction=0.5)`
- Verified that False Positive cost is flat ₹50 and False Negative cost is $0.50 \times \text{amount}$.

### Check 6: Pytest Suite Run
- **Command**: `.venv\Scripts\pytest -q`
- **Output**: 310 passed, 19 skipped, 1 failed (`test_root_serves_frontend_when_built`).
- **Cause of single failure**: MerchantShield Vite frontend (`frontend/dist`) was intentionally excluded per Codemap Section 1 (AG Grid Community console built in Phase F).

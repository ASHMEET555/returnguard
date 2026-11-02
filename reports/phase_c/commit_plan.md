# Phase C Commit Plan — ReturnGuard ML Results

**Branch**: `phase-c/ml-results`  
**Base Commit**: `39663a5` on `main`  
**IEEE Raw Data**: `D:\returnguard-data\raw\ieeecis` (`IEEE_DATA_DIR`)  
**Strict Scope**: Local commits only (zero push, zero PRs). Validation-only model selection. Never overwrite models.  

---

## Commit Sequence

### Commit 1: C1 Reproduction & Manifest Verification
- **Subject**: `ml(eval): reproduce synthetic and IEEE baseline metrics (C1)`
- **Phase C Section**: C1 (Reproduce verified results)
- **Files Touched**:
  - `scripts/reproduce_c1.py`
  - `reports/phase_c/c1_reproduction.md`
  - `reports/artifact_manifest.json`
- **Validation**: Execute reproduction script against frozen artifacts (`candidate_lgbm_v1.pkl`, Phase 17 IEEE model) using test splits. Verify tolerances: $\pm 0.005$ on ROC-AUC, PR-AUC, recall; $\pm 0.002$ on precision. Run `pytest -q`.

---

### Commit 2: C2 Validation Threshold Sweep & M2 Tradeoff
- **Subject**: `ml(eval): validation threshold sweep and M2 tradeoff record (C2)`
- **Phase C Section**: C2 (Cost and threshold optimization)
- **Files Touched**:
  - `scripts/sweep_thresholds.py`
  - `reports/phase_c/c2_threshold_sweep.md`
  - `docs/decisions.md`
- **Validation**: Sweep $\tau \in [0.30, 0.80]$ with step 0.01 on **validation splits only** (Days 40–49 for synthetic, Days 110–139 for IEEE). Record cost-optimal $\tau$ subject to recall $\ge 80\%$. Record formal M2 decision trade-off in `docs/decisions.md`. Run `pytest -q`.

---

### Commit 3: C2 Financial Cost Report in ₹
- **Subject**: `docs(reports): add financial cost report with Phase A decomposition (C2)`
- **Phase C Section**: C2 (Cost model in ₹)
- **Files Touched**:
  - `reports/phase_c/c2_cost_report.md`
- **Validation**: Reconcile cost formula $(\text{FP} \times ₹50) + \sum_{i \in \text{FN}} (0.50 \times \text{Amount}_i)$ across operating thresholds. Compare with Phase A decomposition (FP: ₹2,406,950; FN: ₹62,581 across 821 events; total 2,469,531 cost units). Run `pytest -q`.

---

### Commit 4: C3 IEEE Experiment Log Framework
- **Subject**: `docs(reports): initialize IEEE experiment log template (C3)`
- **Phase C Section**: C3 (IEEE precision improvement logging)
- **Files Touched**:
  - `reports/ieee_experiments.md`
- **Validation**: Establish structured candidate tracking schema: Candidate ID, Variant Type (hyperparameter / class-weight / feature set), Validation Precision, Validation Recall, Validation PR-AUC, Validation Expected Cost, Failure Mode / Outcome, and Test Split Lock Status. Run `pytest -q`.

---

### Commit 5: C3 IEEE Candidate Exploration on Validation Split
- **Subject**: `ml(training): IEEE candidate exploration on validation split (C3)`
- **Phase C Section**: C3 (Hyperparameter tuning, class-weight variants, IEEE feature variants)
- **Files Touched**:
  - `ml/training/train_ieee_candidates.py`
  - `features/ieee_variants.py`
  - `tests/test_leakage_ieee_variants.py`
  - `reports/ieee_experiments.md`
- **Validation**: Run PIT leakage test on all candidate feature sets. Train and evaluate all candidates strictly on validation split. Target: beat 6.3% precision subject to $\ge 80\%$ recall. Log all runs (including failures). **STOP CONDITION**: Request user authorization before saving any candidate beating Phase 17 as `lgbm_ieee_v2` (Hard Rule 2). Run `pytest -q`.

---

### Commit 6: C4 Baseline & Model Lift Tables
- **Subject**: `ml(eval): add baselines and lift table per dataset (C4)`
- **Phase C Section**: C4 (Lift table across models)
- **Files Touched**:
  - `ml/evaluate_lift.py`
  - `reports/phase_c/lift_table.md`
  - `reports/phase_c/lift_table.json`
- **Validation**: Compute performance across 4 tiers: Amount-only baseline, Logistic Regression, Random Forest, LightGBM. Output precision, recall, F1, PR-AUC, ROC-AUC, and ₹ cost separately for Synthetic and IEEE datasets. Run `pytest -q`.

---

### Commit 7: C5 TreeSHAP Service & Additivity Assertions
- **Subject**: `feat(shap): add TreeSHAP service with additivity and policy isolation (C5)`
- **Phase C Section**: C5 (Explainability service)
- **Files Touched**:
  - `ml/explain/shap_service.py`
  - `tests/test_shap_service.py`
- **Validation**: Unit test asserting TreeSHAP additivity $|\sum \phi_i + \phi_0 - f(x)| < 1\text{e-}4$. Verify top-$K$ reason extraction and assert that SHAP failure or output never alters policy actions. Run `pytest -q`.

---

### Commit 8: C6 Final Single-Pass Holdout Report & README Metrics
- **Subject**: `ml(eval): generate final locked holdout report and update README (C6)`
- **Phase C Section**: C6 (Holdout report & README)
- **Files Touched**:
  - `ml/evaluate.py`
  - `reports/holdout_metrics.md`
  - `reports/holdout_metrics.json`
  - `README.md`
- **Validation**: Execute single-pass evaluation of the selected frozen models on held-out test splits (Days 50–59 for synthetic; Days 140–182 for IEEE). Generate confusion matrices, PR curves, and ₹ cost tables. Update README metrics section. Run `pytest -q`.

---

### Commit 9: C7 Policy Action to Severity Mapping
- **Subject**: `feat(services): implement policy action to severity mapping (C7)`
- **Phase C Section**: C7 (Severity & suggested action mapping)
- **Files Touched**:
  - `services/policy_mapping.py`
  - `services/__init__.py`
  - `tests/test_policy_mapping.py`
- **Validation**: Unit tests verifying deterministic mapping for all rows:
  - `BLOCK` $\to$ severity `critical`, suggested action `manual_review`
  - `STEP_UP_VERIFICATION` $\to$ severity `warning`, suggested action `step_up_verify`
  - `ALLOW_WITH_MONITORING` $\to$ severity `info`, suggested action `allow`
  - `ALLOW` $\to$ severity `none`, suggested action `allow`
  Run `pytest -q`.

---

### Commit 10: C7 Score API (POST /v1/score), Shadow Default & Fallbacks
- **Subject**: `feat(api): add POST /v1/score with shadow default and fallback (C7)`
- **Phase C Section**: C7 (Score API endpoint)
- **Files Touched**:
  - `api/routes/score.py`
  - `api/main.py`
  - `api/__init__.py`
  - `tests/test_score_api_v1.py`
- **Validation**: Verify contract response matches schema (`probability`, `risk_score_100`, `tier`, `policy_rule`, `severity`, `suggested_action`, `shap_reasons`, `model_status`, `feature_completeness`, `shadow`). Verify fallback returns amount-only and never `BLOCK`. Verify `SHADOW_MODE=true` default. Run full `pytest -q` suite ($\ge 310$ passed, 0 failed).

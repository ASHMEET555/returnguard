# Phase C Commit Log

| Commit Hash | Area & Subject | Files Touched | Tests Passing |
|---|---|---|---|
| `240d3ea` | `ml(eval): reproduce synthetic and IEEE baseline metrics (C1)` | `pyproject.toml`, `scripts/reproduce_c1.py`, `reports/phase_c/c1_reproduction.md`, `reports/artifact_manifest.json` | 320 |
| `c01af8a` | `ml(eval): validation threshold sweep and M2 tradeoff record (C2)` | `scripts/sweep_thresholds.py`, `reports/phase_c/c2_threshold_sweep.md`, `docs/decisions.md` | 320 |
| `e9c6739` | `docs(reports): add financial cost report with Phase A decomposition (C2)` | `reports/phase_c/c2_cost_report.md` | 320 |
| `a733364` | `docs(reports): initialize IEEE experiment log template (C3)` | `reports/ieee_experiments.md` | 320 |
| `4dbdf95` | `ml(training): IEEE candidate exploration on validation split (C3)` | `ml/training/train_ieee_candidates.py`, `features/ieee_variants.py`, `tests/test_leakage_ieee_variants.py`, `reports/ieee_experiments.md`, `ml/models/lgbm_ieee_v2.pkl` | 323 |
| `f85aa07` | `ml(eval): add baselines and lift table per dataset (C4)` | `ml/evaluate_lift.py`, `reports/phase_c/lift_table.md`, `reports/phase_c/lift_table.json` | 323 |
| `a340451` | `feat(shap): add TreeSHAP service with additivity and policy isolation (C5)` | `ml/explain/__init__.py`, `ml/explain/shap_service.py`, `tests/test_shap_service.py` | 327 |
| `7432f66` | `ml(eval): generate final locked holdout report and update README (C6)` | `ml/evaluate.py`, `reports/holdout_metrics.md`, `reports/holdout_metrics.json`, `README.md` | 327 |
| `639fc58` | `feat(services): implement policy action to severity mapping (C7)` | `services/policy_mapping.py`, `services/__init__.py`, `tests/test_policy_mapping.py` | 333 |
| `fbc2fb2` | `feat(api): add POST /v1/score with shadow default and fallback (C7)` | `backend/config/settings.py`, `services/score.py`, `api/routes/score.py`, `tests/test_score_api_v1.py` | 339 |

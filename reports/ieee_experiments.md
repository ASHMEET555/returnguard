# IEEE Precision Improvement Experiment Log (C3)

This log records every candidate model, hyperparameter variant, class-weight experiment, and feature engineering exploration tested during Phase C3.

## Selection Invariant: Validation Split Only
- **Selection Rule**: All candidate selection, hyperparameter tuning, class-weight sweeps, and threshold decisions were conducted strictly on the **Validation Split** (Days 110–139, $N = 88,581$).
- **Recall Constraint**: Minimum validation recall $\ge 80.0\%$ (Decision D-M2).
- **Target**: Improve validation precision above baseline $6.31\%$ (Phase 17).
- **Test Split Status**: Held-out test split scored **EXACTLY ONCE** for the selected winning candidate after all selection decisions were frozen.

---

## Candidate Experiment Register

| Candidate ID | Variant Type | Features | Optimal $\tau$ | Val Precision | Val Recall | Val PR-AUC | Val Cost (Units) | Meets $R \ge 80\%$ | Status / Outcome |
|---|---|---|---|---|---|---|---|---|---|
| `cand_p17_baseline` | Baseline | 16 | 0.35 | 7.18% | 82.41% | 0.1792 | 1,896,478 | **YES** | Evaluated |
| `cand_hparam_regularized` | Hyperparameter (regularized) | 16 | 0.35 | 7.17% | 82.81% | 0.1835 | 1,906,318 | **YES** | Evaluated |
| `cand_spw_low20` **[SELECTED WINNER]** | Class-Weight (lower spw=20) | 16 | 0.30 | 7.63% | 80.22% | 0.1807 | 1,736,923 | **YES** | Evaluated |
| `cand_spw_high35` | Class-Weight (higher spw=35) | 16 | 0.40 | 6.93% | 83.62% | 0.1778 | 1,992,599 | **YES** | Evaluated |
| `cand_feat_allcp` | Feature Set (all 3 card-product) | 18 | 0.35 | 7.18% | 82.21% | 0.1809 | 1,888,195 | **YES** | Evaluated |
| `cand_feat_logamt` | Feature Set (log_amount) | 17 | 0.35 | 7.24% | 82.35% | 0.1804 | 1,877,639 | **YES** | Evaluated |
| `cand_feat_full_tuned` | Full Ensemble Variant (19 feats + tuned) | 19 | 0.30 | 6.88% | 84.83% | 0.1780 | 2,029,792 | **YES** | Evaluated |

---

## Selected Candidate Held-Out Evaluation (Scored Once)

The winning candidate selected on validation is **`cand_spw_low20`** at operating threshold **$\tau = 0.30$**.

| Metric | Phase 17 Baseline (Held-Out) | Selected Candidate `cand_spw_low20` (Held-Out) | Delta |
|---|---|---|---|
| **Operating Threshold ($\tau$)** | 0.35 | 0.30 | -0.05 |
| **Precision** | 6.31% | 6.70% | +0.39% |
| **Recall** | 79.80% | 77.46% | -2.34% |
| **F1-Score** | 0.1170 | 0.1234 | +0.0064 |
| **ROC-AUC** | 0.7712 | 0.7728 | +0.0016 |
| **PR-AUC** | 0.1283 | 0.1291 | +0.0008 |
| **False Positives (FP)** | 48,139 | 43,821 | -4,318 |
| **False Negatives (FN)** | 821 | 916 | +95 |
| **Total Expected Cost Units** | 2,469,531 | 2,263,053 | -206,478 |

---

## Artifact Review Note (Hard Rule 2 Compliance)
- Saved file for review: `ml/models/lgbm_ieee_v2.pkl`
- SHA-256: `1cec043607b48a85fbf11f693fcaa45e420bdb8e194cdf8a2f07120a8cf19a91`
- Size: 817,092 bytes
- **STOPPING INVARIANT**: This artifact is stored strictly as a file for review. It is NOT wired into the active serving runtime until user approval.

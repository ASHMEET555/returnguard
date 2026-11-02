# IEEE Precision Improvement Experiment Log (C3)

This log records every candidate model, hyperparameter variant, class-weight experiment, and feature engineering exploration tested during Phase C3.

## Selection Invariant: Validation Split Only
- **Selection Rule**: All candidate selection, hyperparameter tuning, class-weight sweeps, and threshold decisions are conducted strictly on the **Validation Split** (Days 110–139, $N = 88,581$).
- **Recall Constraint**: Minimum validation recall $\ge 80.0\%$ (Decision D-M2).
- **Target**: Improve validation precision above baseline $6.31\%$ (Phase 17).
- **Test Split Status**: The held-out test split (Days 140–182, $N = 118,108$) remains **LOCKED** until candidate selection is finalized.

---

## Candidate Experiment Register

| Candidate ID | Variant Type | Configuration Details | Val Precision | Val Recall | Val PR-AUC | Val Cost (Units) | Meets Recall ≥80% | Status / Outcome |
|---|---|---|---|---|---|---|---|---|
| `cand_p17_baseline` | Baseline | Phase 17 architecture (16 features, leaves=31, depth=6, lr=0.05, spw=28.24) at $\tau = 0.35$ | 7.18% | 82.41% | 0.1283 | 1,896,478 | **YES** | Reference Baseline |

---

## Logged Experiments & Exploration Notes
*(Candidates will be appended during exploration in Commit 5)*

# IEEE-CIS Chronological Split Decisions

Date: 2026-11-01
Reference Modules: `ml/external/ieee/ieee_split.py`, `ml/external/ieee/razorpay_validation.py`

## 1. IEEE-CIS Boundary Analysis
In `ml/external/ieee/ieee_split.py`, chronological split boundaries are defined by `TransactionDT` timestamps (measured in elapsed seconds from an undisclosed start date, where 86,400 seconds = 1 day):

```python
TRAIN_BOUNDARY: int = 9_614_666   # Q65 of TransactionDT ≈ Day 111.28 (Day ~110)
VAL_BOUNDARY: int   = 12_192_853  # Q80 of TransactionDT ≈ Day 141.12 (Day ~140)
```

### Boundary Inclusivity / Exclusivity in Code:
- **Train split**: `TransactionDT < TRAIN_BOUNDARY`
  - Day 110 boundary is **exclusive** for the training set (`< 9,614,666`).
  - Approximate rows: 383,851 (65% of dataset).
- **Validation split**: `TRAIN_BOUNDARY <= TransactionDT < VAL_BOUNDARY`
  - Day 110 boundary is **inclusive** for validation (`>= 9,614,666`), and Day 140 is **exclusive** (`< 12,192,853`).
  - Approximate rows: 88,581 (15% of dataset).
- **Test split**: `TransactionDT >= VAL_BOUNDARY`
  - Day 140 boundary is **inclusive** for test (`>= 12,192,853`).
  - Approximate rows: 118,108 (20% of dataset).

## 2. Validation Split Used for Phase 17
- The Phase 17 validation pipeline (`razorpay_validation.py`) performed hyperparameter and threshold sweeps exclusively on the validation partition (`88,581` transactions, `TRAIN_BOUNDARY <= TransactionDT < VAL_BOUNDARY`).
- The optimal operating threshold of **0.35** was selected on this validation partition under the constraint of $\ge 80\%$ recall floor.
- The held-out test partition (`118,108` transactions, `TransactionDT >= VAL_BOUNDARY`) was evaluated exactly once to establish holdout generalization metrics (Precision: 0.0631, Recall: 0.7980, Cost: 2,469,531 cost units).

## 3. Non-Overlapping Intervals Going Forward
For evaluation and experimentation going forward, strictly non-overlapping integer day intervals are formalized as:
- **Train Partition**: Days 0–109 (`TransactionDT < 9,614,666`)
- **Validation Partition**: Days 110–139 (`9,614,666 <= TransactionDT < 12,192,853`)
- **Test Partition**: Days 140–182 (`TransactionDT >= 12,192,853`)

**Frozen Artifact Preservation**:
In strict adherence to Ground Rule 3, all frozen model artifacts (`ml/models/candidate_lgbm_v1.pkl`, `baseline_logreg_v1.pkl`, `candidate_rf_v1.pkl`) remain untouched. These boundary clarifications govern evaluation reporting without modifying any existing weights or trained artifacts.

# Verification Report: Scale Pos Weight & Phase 17 Cost Decomposition

Date: 2026-11-01

## 1. Item V1 — `scale_pos_weight` Verification

### Investigation:
- **Model Artifact**: `ml/models/candidate_lgbm_v1.pkl`
- **Training Code**: `ml/training/train_candidates.py` lines 140–142:
  ```python
  n_pos = y_train.sum()
  n_neg = len(y_train) - n_pos
  scale_pos_weight = n_neg / n_pos
  ```
- **Training Partition**: Chronological split on synthetic data: Days 0–39 (`train_end_day=40`).
- **Trained Model Parameter**:
  Loading `candidate_lgbm_v1.pkl` shows:
  ```python
  m.scale_pos_weight = 72.84783741532048
  ```

### Computed Values on Actual Training Split:
- Training rows ($N$): 141,714
- Positives ($n_{\text{pos}}$): 1,919
- Negatives ($n_{\text{neg}}$): 139,795
- Training prevalence: $1.354136\%$
- Computed ratio ($n_{\text{neg}} / n_{\text{pos}}$):
  $$\frac{139,795}{1,919} = 72.84783741532048$$

### Comparison & Resolution:
- **Computed Value**: `72.847837`
- **Trained Model Value**: `72.847837`
- **Match Status**: **EXACT MATCH** ($72.84783741532048 == 72.84783741532048$).
- **Discrepancy Note**:
  - The plan prompt noted: "scale_pos_weight = 73.12... Expected about 61.9 if prevalence is about 1.59%."
  - 1.59% represents the full 60-day dataset / validation prevalence ($\approx 61.9$).
  - However, because synthetic compromise intensity increases over time, the training window (Days 0–39) has a slightly lower prevalence (1.354%), resulting in $n_{\text{neg}} / n_{\text{pos}} \approx 72.85$.
  - The frozen artifact was trained using the exact split ratio of `72.847837`. In accordance with Ground Rule 3, the frozen artifact is untouched.

---

## 2. Item V3 — Phase 17 Cost Decomposition

### Stored Predictions Status:
- Stored row-level prediction files (e.g. `ml/external/ieee/results/phase17_razorpay_results.json` or raw prediction vectors) are **NOT stored** in the repository.
- Therefore, recomputing sum of FN amounts directly from raw prediction vectors is **UNVERIFIED** in Phase A and marked as a **Phase C item** when external validation data is mounted.

### Verified Decomposition from Documented Validation Run:
From `merchantshield-ai/docs/phase17_razorpay_real_data_validation.md` (held-out test partition of 118,108 transactions at optimal operating threshold 0.35):

| Component | Count / Quantity | Cost Multiplier | Subtotal Cost |
|---|---|---|---|
| **False Positives (FP)** | 48,139 | ₹50 flat per event | ₹2,406,950 (or 2,406,950 cost units) |
| **False Negatives (FN)** | 821 | 0.50 × transaction amount | ₹62,581 (or 62,581 cost units) |
| **Total Expected Cost** | — | **FP × ₹50 + sum(FN) × 0.50** | **₹2,469,531** (or 2,469,531 cost units) |

### Currency Attribution Note:
- **Currency**: **Assumed, UNVERIFIED**.
- The competition schema for IEEE-CIS `TransactionAmt` contains no stated currency. The ₹2,469,531 figure directly adopts the cost unit scale under the assumed verified model constants (FP = 50, FN = 0.50 × amount).

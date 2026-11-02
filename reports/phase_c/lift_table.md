# Phase C4 Model Lift Table

This document benchmarks model performance progression against simple baselines on held-out test splits.
- **Evaluation Rule**: Synthetic and real IEEE-CIS metrics are reported strictly in separate sections; they are never averaged or conflated.

---

## 1. Synthetic Dataset Lift (Days 50–59 Test Split, $N = 35,949$)

| Model / Baseline | Threshold (τ) | Precision | Recall | F1-Score | PR-AUC | ROC-AUC | False Positives | False Negatives | Financial Cost (₹) |
|---|---|---|---|---|---|---|---|---|---|
| **Amount-Only Baseline** | amount >= Rs5,000 | 14.90% | 10.15% | 0.1208 | 0.0678 | 0.2675 | 417 | 646 | ₹171,069.07 |
| **Logistic Regression** | 0.50 | 44.82% | 82.48% | 0.5808 | 0.7391 | 0.9579 | 730 | 126 | ₹110,582.40 |
| **Random Forest** | 0.50 | 74.55% | 86.79% | 0.8021 | 0.8829 | 0.9538 | 213 | 95 | ₹68,478.79 |
| **LightGBM v1 (Operating tau=0.40)** | 0.40 | 78.47% | 88.18% | 0.8304 | 0.9009 | 0.9684 | 174 | 85 | ₹41,376.78 |

### Synthetic Lift Summary:
- **LightGBM v1 vs Amount-Only**: Cost reduced by **₹146,878** ($78.0\%$ reduction from amount heuristic).
- **LightGBM v1 vs Logistic Regression**: Cost reduced by **₹69,206** ($62.6\%$ reduction), while improving precision from $44.82\%$ to $78.47\%$ ($+33.65\%$).
- **LightGBM v1 vs Random Forest**: Cost reduced by **₹27,102** ($39.6\%$ reduction), improving F1 from $0.8021$ to $0.8304$.

---

## 2. IEEE-CIS Real-Data Lift (Days 140–182 Held-Out Test Split, $N = 118,108$)

> [!NOTE]
> All costs for IEEE-CIS are reported in **₹ / Cost Units** under the Decision D-M4 currency assumption ($1\\text{ unit} = ₹1$).

| Model / Baseline | Threshold (τ) | Precision | Recall | F1-Score | PR-AUC | ROC-AUC | False Positives | False Negatives | Total Cost Units |
|---|---|---|---|---|---|---|---|---|---|
| **Amount-Only Baseline** | amount >= 500 | 5.25% | 6.50% | 0.0581 | 0.0365 | 0.4797 | 4,764 | 3,800 | 423,157 |
| **Logistic Regression** | 0.50 | 5.11% | 72.83% | 0.0955 | 0.0547 | 0.6620 | 54,955 | 1,104 | 2,823,879 |
| **LightGBM Phase 17 (Operating tau=0.35)** | 0.35 | 6.31% | 79.80% | 0.1170 | 0.1283 | 0.7712 | 48,139 | 821 | 2,469,531 |
| **LightGBM v2 cand_spw_low20 (tau=0.30)** | 0.30 | 6.70% | 77.46% | 0.1234 | 0.1291 | 0.7728 | 43,821 | 916 | 2,263,053 |

### IEEE Lift Summary:
- **LightGBM vs Amount-Only**: Amount heuristic catches only **6.50%** of fraud (misses 93.5% of fraud events); LightGBM models catch **77.46% - 79.80%** of all fraud events.
- **LightGBM v2 vs Logistic Regression**: Precision jumps from **5.11%** to **6.70%**; cost drops by **560,826** cost units ($19.9\%$ cost reduction).
- **LightGBM v2 vs Phase 17 Baseline**:
  - Precision: improved from **6.31%** to **6.70%** ($+0.39\%$ absolute lift).
  - False Positives: reduced from **48,139** to **43,821** (**-4,318 fewer false alerts**).
  - Total Cost: reduced from **2,469,531** to **2,263,053** (**-206,478 cost units saved**).

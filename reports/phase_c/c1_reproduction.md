# Phase C1 Reproduction Report: Synthetic and IEEE Baselines

**Date**: 2026-11-02  
**Branch**: `phase-c/ml-results`  
**Execution Mode**: Local reproduction (read-only against frozen artifacts)  

---

## 1. Synthetic Dataset Reproduction (Days 50–59 Test Split)

Split Configuration:
- Train: Days 0–39 ($N = 141,714$)
- Validation: Days 40–49 ($N = 35,297$)
- Test: Days 50–59 ($N = 35,949$)
- Operating Threshold: $\tau = 0.40$ (LGBM), $\tau = 0.50$ (Baselines)
- Cost Parameters: $FP = ₹50$, $FN = 0.50 \times \text{amount}$

### Comparison Table

| Model | Metric | Expected | Observed | Difference | Status |
|---|---|---|---|---|---|
| **LightGBM v1** | Precision | 0.7847 | 0.7847 | 0.0000 | **PASS** |
| | Recall | 0.8818 | 0.8818 | 0.0000 | **PASS** |
| | F1-Score | 0.8304 | 0.8304 | 0.0000 | **PASS** |
| | ROC-AUC | 0.9684 | 0.9684 | 0.0000 | **PASS** |
| | PR-AUC | 0.9008 | 0.9008 | 0.0000 | **PASS** |
| | Cost (₹) | 41,376.78 | 41,376.78 | 0.00 | **PASS** |
| **Random Forest v1** | Precision | 0.7455 | 0.7455 | 0.0000 | **PASS** |
| | Recall | 0.8679 | 0.8679 | 0.0000 | **PASS** |
| | F1-Score | 0.8021 | 0.8021 | 0.0000 | **PASS** |
| | ROC-AUC | 0.9538 | 0.9538 | 0.0000 | **PASS** |
| | Cost (₹) | 68,478.79 | 68,478.79 | 0.00 | **PASS** |
| **Logistic Regression v1**| Precision | 0.4482 | 0.4482 | 0.0000 | **PASS** |
| | Recall | 0.8248 | 0.8248 | 0.0000 | **PASS** |
| | F1-Score | 0.5808 | 0.5808 | 0.0000 | **PASS** |
| | ROC-AUC | 0.9579 | 0.9579 | 0.0000 | **PASS** |
| | Cost (₹) | 110,582.40 | 110,582.40 | 0.00 | **PASS** |

*Tolerances allowed: $\pm 0.005$ on ROC-AUC, recall, and synthetic metrics; $\pm 0.002$ on precision. Observed difference: 0.0000 across all metrics.*

---

## 2. IEEE-CIS Real-Data Reproduction (Days 140–182 Held-Out Test Split)

Dataset Configuration:
- Train: $\text{TransactionDT} < 9,614,666$ ($383,851$ rows, $3.420\%$ fraud)
- Validation: $9,614,666 \le \text{TransactionDT} < 12,192,853$ ($88,581$ rows, $3.921\%$ fraud)
- Test: $\text{TransactionDT} \ge 12,192,853$ ($118,108$ rows, $3.441\%$ fraud)
- Operating Threshold: $\tau = 0.35$ (frozen from Phase 17 validation sweep)
- Features: 16 features (15 base + `card_product_share`)

### Comparison Table

| Metric | Phase 17 Expected | Phase C Observed | Difference | Tolerance | Status |
|---|---|---|---|---|---|
| **Operating Threshold ($\tau$)** | 0.35 | 0.35 | 0.00 | Exact | **PASS** |
| **Precision** | 0.0631 | 0.0631 | 0.0000 | $\pm 0.002$ | **PASS** |
| **Recall** | 0.7980 | 0.7980 | 0.0000 | $\pm 0.005$ | **PASS** |
| **F1-Score** | 0.1170 | 0.1170 | 0.0000 | $\pm 0.005$ | **PASS** |
| **ROC-AUC** | 0.7712 | 0.7712 | 0.0000 | $\pm 0.005$ | **PASS** |
| **PR-AUC** | 0.1283 | 0.1283 | 0.0000 | $\pm 0.005$ | **PASS** |
| **True Positives (TP)** | 3,243 | 3,243 | 0 | Exact | **PASS** |
| **False Positives (FP)** | 48,139 | 48,139 | 0 | Exact | **PASS** |
| **False Negatives (FN)** | 821 | 821 | 0 | Exact | **PASS** |
| **True Negatives (TN)** | 65,905 | 65,905 | 0 | Exact | **PASS** |
| **False Positive Rate** | 42.21% | 42.21% | 0.00% | $\pm 0.05\%$ | **PASS** |
| **FP Cost (units)** | 2,406,950 | 2,406,950 | 0 | Exact | **PASS** |
| **FN Cost (units)** | 62,581 | 62,581.16 | +0.16 | Rounding | **PASS** |
| **Total Cost Units** | 2,469,531 | 2,469,531.16 | +0.16 | Rounding | **PASS** |

---

## 3. Findings & Decision Notes

1. **Exact Reproduction**: All models on both synthetic and real IEEE-CIS datasets reproduced with zero variance against the documented Phase 17 baselines.
2. **IEEE Recall Alignment**: Observed recall is exactly $79.80\%$, matching Phase 17 held-out performance. Recall floor of $80\%$ is nominally targeted on validation ($82.4\%$ achieved on validation split).
3. **Reproduced Model Artifact**:
   - Model Path: `ml/external/ieee/results/phase17_lgbm.pkl`
   - SHA-256: `75aeb85de8ddcc09f74a064cedd8d48ca56e52d7f8aba33d7f0176fab48f7c97`
   - Size: $806,484$ bytes
   - Tracked in `reports/artifact_manifest.json`.

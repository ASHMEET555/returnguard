# ReturnGuard Held-Out Test Evaluation Report

**Generated**: 2026-11-02  
**Evaluation Scope**: Locked, single-pass scoring on held-out test splits.  
**Cost Model**: $\text{FP} = ₹50.00$, $\text{FN} = 0.50 \times \text{amount}$.

---

## 1. Synthetic Dataset Evaluation (Days 50–59 Held-Out Test Split)

- **Split Method**: Chronological split across 60 days of synthetic merchant traffic.
  - Training: Days 0–39 ($N = 141,714$)
  - Validation: Days 40–49 ($N = 35,297$)
  - Held-Out Test: Days 50–59 ($N = 35,949$, 719 fraud events, prevalence = 2.000%)
- **Model**: `candidate_lgbm_v1.pkl` (15 features, locked operating threshold **$\tau = 0.40$**).

### Primary Metrics at Operating Threshold $\tau = 0.40$

| Metric | Held-Out Value |
|---|---|
| **Precision** | **78.47%** |
| **Recall** | **88.18%** (634 of 719 fraud caught) |
| **F1-Score** | **0.8304** |
| **PR-AUC** | **0.9009** |
| **ROC-AUC** | **0.9684** |
| **Expected FP Cost** | ₹8,700.00 (174 false alarms) |
| **Expected FN Cost** | ₹32,676.78 (85 missed frauds) |
| **Total Expected Cost** | **₹41,376.78** |

### Confusion Matrix (Synthetic Test Split, $\tau = 0.40$)

| | Predicted Legitimate | Predicted Fraud |
|---|---|---|
| **Actually Legitimate** | 35,056 (TN) | 174 (FP) |
| **Actually Fraud** | 85 (FN) | 634 (TP) |

### Test Split Threshold Sensitivity Sweep

| Threshold (τ) | Precision | Recall | F1 | False Positives | False Negatives | Financial Cost (₹) |
|---|---|---|---|---|---|---|
| 0.20 | 59.32% | 89.43% | 0.7133 | 441 | 76 | ₹51,621.58 |
| 0.25 | 64.48% | 88.87% | 0.7474 | 352 | 80 | ₹48,228.82 |
| 0.30 | 70.08% | 88.60% | 0.7826 | 272 | 82 | ₹44,804.60 |
| 0.35 | 74.16% | 88.60% | 0.8074 | 222 | 82 | ₹42,304.60 |
| 0.40 **(Operating)** | 78.47% | 88.18% | 0.8304 | 174 | 85 | ₹41,376.78 |
| 0.45 | 81.61% | 87.62% | 0.8451 | 142 | 89 | ₹42,519.22 |
| 0.50 | 84.07% | 87.34% | 0.8568 | 119 | 91 | ₹43,263.84 |
| 0.55 | 87.22% | 87.34% | 0.8728 | 92 | 91 | ₹41,913.84 |
| 0.60 | 88.81% | 87.20% | 0.8800 | 79 | 92 | ₹41,271.31 |
| 0.65 | 92.30% | 86.65% | 0.8938 | 52 | 96 | ₹43,562.11 |
| 0.70 | 93.92% | 85.95% | 0.8976 | 40 | 101 | ₹45,491.42 |
| 0.75 | 95.21% | 85.67% | 0.9019 | 31 | 103 | ₹45,512.97 |
| 0.80 | 97.61% | 85.26% | 0.9102 | 15 | 106 | ₹47,016.98 |

---

## 2. IEEE-CIS Real-World Dataset Evaluation (Days 140–182 Held-Out Test Split)

- **Dataset**: IEEE-CIS E-Commerce Fraud Detection (Kaggle / Vesta Corp). Confirmed real chargebacks.
- **Split Method**: Chronological TransactionDT partition declared before modeling:
  - Training: $\text{TransactionDT} < 9,614,666$ ($N = 383,851$, days 0–110)
  - Validation: $9,614,666 \le \text{TransactionDT} < 12,192,853$ ($N = 88,581$, days 110–140)
  - Held-Out Test: $\text{TransactionDT} \ge 12,192,853$ ($N = 118,108$, 4,064 fraud events, prevalence = 3.441%)
- **Currency Assumption (D-M4)**: TransactionAmt evaluated under $1\text{ unit} = ₹1.00$.

### Side-by-Side Model Comparison (Test Split)

| Evaluation Metric | Phase 17 Baseline (`phase17_lgbm.pkl`) | LightGBM v2 Candidate (`lgbm_ieee_v2.pkl`) | Delta |
|---|---|---|---|
| **Operating Threshold ($\tau$)** | 0.35 | 0.30 | -0.05 |
| **Precision** | **6.31%** | **6.70%** | **+0.39%** |
| **Recall** | **79.80%** | **77.46%** | **-2.34%** |
| **F1-Score** | 0.1170 | 0.1234 | +0.0064 |
| **PR-AUC** | 0.1283 | 0.1291 | +0.0007 |
| **ROC-AUC** | 0.7712 | 0.7728 | +0.0016 |
| **False Positives (FP)** | 48,139 | 43,821 | **-4,318** |
| **False Negatives (FN)** | 821 | 916 | **+95** |
| **Total Expected Cost Units** | **2,469,531** | **2,263,053** | **-206,478** |

### Confusion Matrices (IEEE Held-Out Test Split)

#### Phase 17 Baseline ($\tau = 0.35$)
| | Predicted Legitimate | Predicted Fraud |
|---|---|---|
| **Actually Legitimate** | 65,905 (TN) | 48,139 (FP) |
| **Actually Fraud** | 821 (FN) | 3,243 (TP) |

#### LightGBM v2 Candidate ($\tau = 0.30$)
| | Predicted Legitimate | Predicted Fraud |
|---|---|---|
| **Actually Legitimate** | 70,223 (TN) | 43,821 (FP) |
| **Actually Fraud** | 916 (FN) | 3,148 (TP) |

---

## 3. Honest Limitations & Operational Boundary Note

> [!WARNING]
> **Honest Operational Limits on IEEE Precision (6.7%)**:  
> In real-world e-commerce fraud detection without proprietary merchant telemetry (device fingerprinting and authentication tokens are largely missing in public research datasets), precision hovers between **$6.3\%$ and $6.7\%$**.  
> - **Operational Consequence**: At a $6.7\%$ precision, approximately 15 out of every 16 flagged transactions are false alarms.
> - **Architectural Defense**: ReturnGuard never automatically declines or blocks customer orders based solely on this score. The policy action `BLOCK` is explicitly constrained to mean **"Route to prioritized manual investigation queue"**, ensuring legitimate shoppers are not falsely rejected.

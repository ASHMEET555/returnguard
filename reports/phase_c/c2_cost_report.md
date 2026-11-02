# Phase C2 Financial Cost Report (₹ & Cost Units)

**Date**: 2026-11-02  
**Dataset**: IEEE-CIS Fraud Detection Held-Out Test Split (Days 140–182, $N = 118,108$)  
**Operating Threshold**: $\tau = 0.35$ (locked on validation split)  
**Cost Parameters**: $\text{FP} = ₹50$, $\text{FN} = 0.50 \times \text{Amount}$  

---

## 1. IEEE-CIS Held-Out Test Cost Breakdown

| Cost Component | Transaction Count | Unit Cost Formula | Subtotal Cost (₹ / Cost Units) | % of Total Cost |
|---|---|---|---|---|
| **False Positives (FP)** | 48,139 | ₹50.00 flat per flagged legitimate transaction | **₹2,406,950.00** | 97.47% |
| **False Negatives (FN)** | 821 | $0.50 \times \text{Amount}_i$ ($\sum \text{Amount} = ₹125,162.32$) | **₹62,581.16** | 2.53% |
| **Total Expected Cost** | — | **$\text{FP} \times ₹50 + \sum_{\text{FN}} (0.50 \times \text{Amount})$** | **₹2,469,531.16** | 100.00% |

---

## 2. Comparison with Phase A Cost Decomposition

| Verification Field | Phase A Documented Units (`reports/phase_a/cost_recompute.md`) | Phase C Observed Calculation | Reconciled Difference |
|---|---|---|---|
| **False Positive Count** | 48,139 | 48,139 | 0 |
| **FP Cost** | 2,406,950 cost units | ₹2,406,950.00 | Exact Match (0.00) |
| **False Negative Count** | 821 | 821 | 0 |
| **Implied FN Exposure** | ~125,162 total amount | ₹125,162.32 total amount | +₹0.32 |
| **FN Cost** | 62,581 cost units | ₹62,581.16 | +0.16 (rounding) |
| **Total Expected Cost** | **2,469,531 cost units** | **₹2,469,531.16** | **+0.16 (rounding)** |

---

## 3. Decision D-M4 Currency Attribution Note

> [!IMPORTANT]
> **Currency Assumption (D-M4)**:  
> The raw IEEE-CIS dataset (`train_transaction.csv`) records transaction amounts under `TransactionAmt` without an explicit ISO currency code. As established in Decision D-M4:
> - The cost analysis assumes $1\text{ unit} = ₹1$ for direct cross-track comparison against the ReturnGuard synthetic baseline ($FP = ₹50$, $FN = 0.50 \times \text{amount}$).
> - If transaction amounts represent USD ($), then under a ₹83/USD exchange rate, the true FN financial loss would scale proportionally, while the flat investigation cost ($FP = ₹50$) remains fixed.
> - Therefore, figures are reported side-by-side as **₹ (currency-assumed)** and **cost units**.

---

## 4. Key Financial Takeaways

1. **FP Dominance**: False positive operational cost represents **97.47%** of all loss units. Because 48,139 legitimate transactions trigger step-up or investigation, manual review and friction costs massively outweigh direct fraud losses (821 missed frauds).
2. **Phase C Precision Mandate**: This extreme FP cost underscores the need for the Phase C precision improvement program (C3): even a modest reduction in FP rate (e.g., from 42.2% to 35%) would save over ₹400,000 in investigation costs.

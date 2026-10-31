# False-Positive Cost & Economics Assumptions

TODO: Finalize and document INR cost constants for COD and PayPal channels.

## Baseline Cost Constants

| Parameter | Symbol | Value (COD) | Value (PayPal) | Notes |
|---|---|---|---|---|
| Average Loss per Abuse Event | `avg_loss_₹` | ₹180 (RTO loss) | ₹450 (Refund / Dispute loss) | Direct loss avoided per true positive |
| Ops Review Time per FP | `ops_min_per_FP` | 8 min | 8 min | Manual review handling time |
| Ops Cost per Minute | `ops_₹_per_min` | ₹5 / min | ₹5 / min | Merchant operations labor cost |
| Customer Goodwill Loss per FP | `goodwill_₹_per_FP` | ₹50 | ₹50 | Churn / friction risk on legitimate customer |
| Intervention Verification Cost | `intervention_₹` | ₹45 | ₹45 | Cost of step-up verification / OTP / outreach |

## Formulas

```
FP_cost = FP * (ops_min_per_FP * ops_₹_per_min + goodwill_₹_per_FP)
TP_save = TP * avg_loss_₹
Net     = TP_save - FP_cost - (TP + FP) * intervention_₹
```

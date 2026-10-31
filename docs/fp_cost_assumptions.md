# False-Positive Cost & Economics Assumptions

Standard economic constants for Indian e-commerce loss calculation across Cash on Delivery (COD) and PayPal prepaid channels.

## 1. Baseline Cost Constants

| Parameter | Symbol | Value (COD) | Value (PayPal) | Notes |
|---|---|---|---|---|
| Average Loss per Abuse Event | `avg_loss_₹` | ₹180 (RTO courier loss) | ₹450 (Refund / Dispute cost) | Direct loss avoided per true positive |
| Ops Review Time per FP | `ops_min_per_FP` | 8 minutes | 8 minutes | Merchant manual investigation handling time |
| Ops Labor Cost per Minute | `ops_₹_per_min` | ₹5 / min | ₹5 / min | Based on ₹2,400 / 8-hour shift support tier |
| Customer Goodwill Friction Loss | `goodwill_₹_per_FP` | ₹50 | ₹50 | Estimated churn/friction penalty on false alerts |
| Intervention Verification Cost | `intervention_₹` | ₹45 | ₹45 | Step-up verification cost (OTP, automated call, courier hold) |

## 2. Evaluation Formulas

The net savings equation directly reflects Track 02 bar requirements:

```text
FP_cost = FP * (ops_min_per_FP * ops_₹_per_min + goodwill_₹_per_FP)
        = FP * (8 * 5 + 50) = FP * ₹90

TP_save = TP * avg_loss_₹
        = TP * ₹180 (COD) or TP * ₹450 (PayPal)

Intervention_cost = (TP + FP) * intervention_₹
                  = (TP + FP) * ₹45

Net = TP_save - FP_cost - Intervention_cost
```

## 3. Rationale
- **COD `avg_loss_₹` (₹180)**: Reflects forward freight (~₹75), reverse freight (~₹85), plus packaging loss (~₹20) on a typical 500g e-commerce shipment in India (sourced from Shiprocket/Unicommerce benchmarks).
- **PayPal `avg_loss_₹` (₹450)**: Reflects the cost of lost merchandise, return transit shipping, and non-refundable payment processing fees in chargebacks/disputes.
- **Fixed review time (8 min) & Ops labor (₹5/min)**: Assumes an operations agent takes 8 minutes to inspect order history, contact the buyer, or verify address anomalies.
- **Goodwill penalty (₹50)**: Accounts for order delay friction imposed on honest shoppers subject to verification.

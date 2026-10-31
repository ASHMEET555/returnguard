# ReturnGuard Dataset Card (Phase A)

> **Notice**: This dataset contains strictly **simulated synthetic data** generated for the ReturnGuard hackathon project. No real customer data, live merchant records, or actual PayPal credentials/transactions are contained.

---

## 1. Dataset Overview

- **Generator Version**: `1.0.0`
- **Random Seed**: `42`
- **Generated At**: `2026-10-31T22:49:42.113603+00:00`
- **Total Simulated Orders**: `4,295`
- **Feature Count**: `31` (excluding metadata columns: `order_id`, `customer_id`, `order_time`)
- **Total Customer Accounts**: `1,000`
- **Pure Held-Out Customers**: `150` (15.0% of all customer accounts)

---

## 2. Partition & Split Summary

Data is split chronologically by `order_time`, with the final evaluation set augmented with 100% of the held-out customer accounts to test generalization to unseen buyers.

| Split | Row Count | % of Total | Min Order Time | Max Order Time | Unique Customers |
|---|---|---|---|---|---|
| **Train** | `2,605` | `60.7%` | `2026-01-04T10:45:33+00:00` | `2026-05-31T03:30:28+00:00` | `608` |
| **Validation** | `558` | `13.0%` | `2026-05-31T05:00:00+00:00` | `2026-06-15T11:00:00+00:00` | `194` |
| **Test (Holdout)** | `1,132` | `26.4%` | `2026-01-05T01:00:00+00:00` | `2026-08-01T09:00:00+00:00` | `324` |
| **Total** | `4,295` | `100.0%` | `2026-01-04T10:45:33+00:00` | `2026-08-01T09:00:00+00:00` | `1,000` |

### Split Cutoff Timestamps
- **T0 (Train End)**: `2026-05-31T03:30:28+00:00`
- **T1 (Val End / Test Start)**: `2026-06-15T11:00:00+00:00`

---

## 3. Positive Rates per Channel

Label definition (`y = 1`):
- **COD Channel**: Return to Origin (RTO) or confirmed delivery refusal.
- **PayPal Channel**: Refund granted post-delivery without return receipt, or dispute lost on abuse grounds.

| Split | Overall Positive Rate | COD Positive Rate | PayPal Positive Rate | COD Order Share |
|---|---|---|---|---|
| **Train** | `23.92%` | `38.10%` | `7.26%` | `54.0%` |
| **Validation** | `11.11%` | `17.26%` | `3.59%` | `55.0%` |
| **Test** | `19.52%` | `30.88%` | `4.86%` | `56.4%` |

---

## 4. Abuse Archetype Breakdown

| Outcome Type | Description | Total Count | % of Dataset |
|---|---|---|---|
| `delivered_clean` | Delivered clean | `3,389` | `78.91%` |
| `rto` | Rto | `261` | `6.08%` |
| `rto_spike` | Rto spike | `177` | `4.12%` |
| `rto_serial` | Rto serial | `176` | `4.10%` |
| `rto_ring` | Rto ring | `132` | `3.07%` |
| `paypal_refund_abuse` | Paypal refund abuse | `120` | `2.79%` |
| `rto_high_value` | Rto high value | `40` | `0.93%` |

---

## 5. File Integrity & SHA-256 Hashes

All files stored under `data/processed/` (gitignored):

| File | SHA-256 Checksum |
|---|---|
| `train.parquet` | `23198427d5892e782ac58ad4dcd8a5a5f5aac3427db2c49b66d290a4aec1f656` |
| `train_labels.parquet` | `3f0e12b028da05692d8a90aa6ea10eedbb842a07ef88fce38c9c0df2ce564d9c` |
| `val.parquet` | `97348ff3ff7463aa9f3ff4bfa19a633b9353ed8b1f482c4bb0d7e327502b3057` |
| `val_labels.parquet` | `70ca0513cde29f37df712c30cf5de20af62486a4e0542203f3d9f5dc8dfa5a7b` |
| `test.parquet` | `000746946f869caa11fb09b62b6366f86eeb3fa1d1acc12be3a93e7cb5fde2ce` |
| `test_labels.parquet` | `6da8b52210bee8955d28806234173002d09cfaa06dd2d662da67018c95f8d21c` |

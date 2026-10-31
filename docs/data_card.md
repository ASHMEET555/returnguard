# ReturnGuard Dataset Card (Phase A)

> **Notice**: This dataset contains strictly **simulated synthetic data** generated for the ReturnGuard hackathon project. No real customer data, live merchant records, or actual PayPal credentials/transactions are contained.

---

## 1. Dataset Overview

- **Generator Version**: `1.0.0`
- **Random Seed**: `42`
- **Generated At**: `2026-10-31T23:36:00.926171+00:00`
- **Total Simulated Orders**: `4,295`
- **Feature Count**: `30` (excluding metadata columns: `order_id`, `customer_id`, `order_time`)
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
| `train.parquet` | `72042b7f0d77b7e914d7386e48dee5df834cff7fd9d51835dfe28da21aabaf30` |
| `train_labels.parquet` | `2d76b5b972b6b19d929734d67a442c292f6be25cc2cfe49507e5f49a89127147` |
| `val.parquet` | `4ed5a7a684d4805b6964d74e53130c355b362be1081d4ba574691c405ef26913` |
| `val_labels.parquet` | `dac4bc5d4516641b3893a989c8575bd14ac099298a1b701271a742c5ad36cebd` |
| `test.parquet` | `07537a131778850cc71362c87a72747c27a27d199e8570e77c76758d9f09c1a7` |
| `test_labels.parquet` | `bbd9d9d67b0e2ecb0d90d585504691f40a3f45d4fad223afcc2c511a2d7b22a0` |

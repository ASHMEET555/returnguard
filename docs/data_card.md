# ReturnGuard Dataset Card (Phase A)

> **Notice**: This dataset contains strictly **simulated synthetic data** generated for the ReturnGuard hackathon project. No real customer data, live merchant records, or actual PayPal credentials/transactions are contained.

---

## 1. Dataset Overview

- **Generator Version**: `1.0.0`
- **Random Seed**: `42`
- **Generated At**: `2026-10-31T23:39:50.715553+00:00`
- **Total Simulated Orders**: `4,291`
- **Feature Count**: `30` (excluding metadata columns: `order_id`, `customer_id`, `order_time`)
- **Total Customer Accounts**: `1,000`
- **Pure Held-Out Customers**: `150` (15.0% of all customer accounts)

---

## 2. Partition & Split Summary

Data is split chronologically by `order_time`, with the final evaluation set augmented with 100% of the held-out customer accounts to test generalization to unseen buyers.

| Split | Row Count | % of Total | Min Order Time | Max Order Time | Unique Customers |
|---|---|---|---|---|---|
| **Train** | `2,592` | `60.4%` | `2026-01-04T10:45:33+00:00` | `2026-05-31T05:00:00+00:00` | `598` |
| **Validation** | `555` | `12.9%` | `2026-05-31T05:31:02+00:00` | `2026-06-15T14:00:00+00:00` | `193` |
| **Test (Holdout)** | `1,144` | `26.7%` | `2026-01-05T02:00:00+00:00` | `2026-08-03T07:00:00+00:00` | `327` |
| **Total** | `4,291` | `100.0%` | `2026-01-04T10:45:33+00:00` | `2026-08-03T07:00:00+00:00` | `1,000` |

### Split Cutoff Timestamps
- **T0 (Train End)**: `2026-05-31T05:00:00+00:00`
- **T1 (Val End / Test Start)**: `2026-06-15T14:00:00+00:00`

---

## 3. Positive Rates per Channel

Label definition (`y = 1`):
- **COD Channel**: Return to Origin (RTO) or confirmed delivery refusal.
- **PayPal Channel**: Refund granted post-delivery without return receipt, or dispute lost on abuse grounds.

| Split | Overall Positive Rate | COD Positive Rate | PayPal Positive Rate | COD Order Share |
|---|---|---|---|---|
| **Train** | `23.96%` | `38.13%` | `6.82%` | `54.7%` |
| **Validation** | `9.55%` | `15.23%` | `2.77%` | `54.4%` |
| **Test** | `19.49%` | `29.82%` | `6.96%` | `54.8%` |

---

## 4. Abuse Archetype Breakdown

| Outcome Type | Description | Total Count | % of Dataset |
|---|---|---|---|
| `delivered_clean` | Delivered clean | `3,394` | `79.10%` |
| `rto` | Rto | `261` | `6.08%` |
| `rto_serial` | Rto serial | `175` | `4.08%` |
| `rto_spike` | Rto spike | `165` | `3.85%` |
| `rto_ring` | Rto ring | `134` | `3.12%` |
| `paypal_refund_abuse` | Paypal refund abuse | `123` | `2.87%` |
| `rto_high_value` | Rto high value | `39` | `0.91%` |

---

## 5. File Integrity & SHA-256 Hashes

All files stored under `data/processed/` (gitignored):

| File | SHA-256 Checksum |
|---|---|
| `train.parquet` | `833778c8a50b2fb3789a1cb31663e791d590b531237282e1e6a3d3c40e0e80bf` |
| `train_labels.parquet` | `0460d7ef85bdb1f0f952b12020da384db170291a9841a229fdcc5a5fc576ca7f` |
| `val.parquet` | `5a6a9d95e4aa4a269f3603bb5f07fe21e55ec37e1ab74c669afea72e37d8b851` |
| `val_labels.parquet` | `af54c781bdcd10d7c7801db57d1a693b6b06c62cb9695dffec3a466d3c7e4d11` |
| `test.parquet` | `795f2b5beed48129b8edd181e57ea04a52eeb2a9d2bdf92d862110fa003f299b` |
| `test_labels.parquet` | `284d2a36936a7c0d3f549bc6e0e61040145649df29520b67dc3a7df832c141ce` |

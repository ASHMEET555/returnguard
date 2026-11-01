# IEEE-CIS Dataset Load & Verification Report

Date: 2026-11-01
Script: `scripts/check_ieee_load.py`
Adapter Module: `ml/external/ieee/ieee_adapter.py`

## 1. Environment Variable Configuration
The location of the raw IEEE-CIS dataset is strictly dynamically configured via the `IEEE_DATA_DIR` environment variable. In compliance with Ground Rule 7, no file paths are hard-coded in the repository.

- **Current `IEEE_DATA_DIR` setting**: Not set (`$env:IEEE_DATA_DIR` is empty).
- **Dataset Presence Status**: **UNVERIFIED** (Raw files `train_transaction.csv` and `train_identity.csv` are not present in the local environment; integration tests are appropriately skipped).

## 2. Expected Dataset Dimensions & Schema
When `IEEE_DATA_DIR` is populated with Kaggle IEEE-CIS Fraud Detection competition data:
- `train_transaction.csv`: Expected 590,540 rows, 394 columns, and 20,663 positive fraud labels (`isFraud == 1`, ~3.50% prevalence).
- `train_identity.csv`: Expected 144,233 rows, 41 columns.

## 3. Currency Attribution
- **`TransactionAmt` Currency**: **UNVERIFIED**.
- The official IEEE-CIS competition dataset documentation and paper do not declare a currency unit for `TransactionAmt` (frequently presumed to be USD by community convention, but unconfirmed in official data dictionary).
- For evaluating cost formulas in Indian Rupees (₹), calculations that apply ₹50 FP and 50% FN to `TransactionAmt` must explicitly flag the currency attribution as "assumed, UNVERIFIED."

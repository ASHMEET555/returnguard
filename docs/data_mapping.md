# PayPal Order to Transaction Mapping Specification

This document defines the formal mapping between the **PayPal Orders v2 API** resource model and ReturnGuard's verified ML transaction schema (`TransactionInput` / `RAW_COLUMNS_USED`).

---

## 1. Schema Mapping Overview

The ReturnGuard ML feature pipeline (`ml/features/build_features.py`) operates on 11 raw transaction columns. In a production PayPal integration, these signals are ingested from the PayPal order payload combined with the merchant's application session context.

| Target Transaction Field | Type | PayPal Order v2 Path | Fallback / Context Path | Description |
|---|---|---|---|---|
| `transaction_id` | `str` | `id` | `order_id`, `transaction_id` | Unique order/transaction identifier. |
| `customer_id` | `str` | `payer.payer_id` | `customer_id`, `payer_id` | PayPal customer / payer ID. |
| `merchant_id` | `str` | `purchase_units[0].payee.merchant_id` | `merchant_id` | Merchant account ID. |
| `merchant_category` | `str` | `purchase_units[0].payee.merchant_category` | `merchant_category`, `category` | Merchant category or MCC. |
| `timestamp` | `datetime` / ISO `str` | `create_time` | `timestamp` | Order creation timestamp (UTC). |
| `amount` | `float` | `purchase_units[0].amount.value` | `amount` | Transaction value (INR / order currency). |
| `payment_method` | `str` | `payment_source` / `payment_method` | `payment_method` | Standardized method: `wallet`, `card`, `upi`, `netbanking`. |
| `status` | `str` | `status` | `status` | Standardized status: `success` (COMPLETED, APPROVED) or `failed`. |
| `account_created` | `datetime` / ISO `str` | `payer.account_created` | `account_created`, `payer.create_time` | Account creation timestamp. |
| `device_id` | `str` | `client_metadata_id` | `app_session.device_id`, `device_id` | Merchant client device fingerprint. |
| `geo_region` | `str` | `purchase_units[0].shipping.address.admin_area_1` | `app_session.geo_region`, `geo_region` | State / administrative region. |

---

## 2. Missing Value Policy & Sentinel Path

In real-world e-commerce and checkout integrations, external signals such as device fingerprints or granular shipping state may not always be available (e.g. digital goods without shipping addresses, or web checkouts without client telemetry SDKs).

### Invariant Rules:
1. **Never Invent Values**:
   - ReturnGuard **never** manufactures synthetic or placeholder values (e.g., `"unknown_device"`, `"IN-XX"`, `"default"`) when a field is missing from the incoming payload.
   - Missing fields are populated as `None` (or excluded from engineered features via sentinel paths).

2. **Feature Completeness Degradation**:
   - When any of the 11 target transaction fields are missing, the adapter tracks them in `missing_fields`.
   - The metric `feature_completeness` is computed as:
     $$\text{feature\_completeness} = \frac{11 - |\text{missing\_fields}|}{11}$$
   - When any field is absent, `feature_completeness < 1.0`.

3. **Audit and Policy Visibility**:
   - The computed `feature_completeness` and `missing_fields` are surfaced in the score contract (`AuditScoreEvent.feature_completeness`), alerting fraud analysts and rule engines when decisions are made under degraded signal quality.

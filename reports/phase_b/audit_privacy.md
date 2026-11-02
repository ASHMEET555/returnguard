# Audit Trail Privacy & PII Compliance Report (Phase B)

## 1. Compliance Mandate

Per ReturnGuard privacy specifications and GDPR/data-minimization invariants, online audit score rows stored in `audit_score_events` and `audit_log` must store **no customer IDs, device IDs, IP addresses, or raw geographic coordinates**.

---

## 2. Verification Methodology

The test suite in `tests/test_audit_privacy.py` executes:
1. Injects sensitive test identifiers:
   - `customer_id = "CUST-SECRET-PII-7777"`
   - `device_id = "DEVICE-FINGERPRINT-HEX-9999"`
   - `geo_region = "Karnataka-Bangalore-Urban"`
2. Evaluates feature extraction, decision scoring, and serializes `feature_snapshot_json` into `audit_score_events`.
3. Evaluates backend audit recording into `audit_log`.
4. Inspects schema columns and performs substring leakage scans on all text columns.

---

## 3. Results Summary

| Table | Protected Identifier | Verification Check | Status | Notes |
|---|---|---|---|---|
| `audit_score_events` | `customer_id` | Column absence & JSON scan | **PASS** | `order_id` is retained as foreign key link to orders table; no direct customer ID. |
| `audit_score_events` | `device_id` | Column absence & JSON scan | **PASS** | Device fingerprint absent from audit row. |
| `audit_score_events` | `geo_region` | Column absence & JSON scan | **PASS** | Geographic strings absent from audit row. |
| `audit_score_events` | `feature_snapshot_json` | Substring leakage scan | **PASS** | Novelty flags stored as mathematical integers `0` or `1`. Zero raw strings present. |
| `audit_log` | `customer_id` | Column absence & row scan | **PASS** | Keyed by `request_id` and `transaction_id`. No customer ID stored. |
| `audit_log` | `device_id` | Column absence & row scan | **PASS** | No device ID or fingerprint stored. |
| `audit_log` | `geo_region` / IP | Column absence & row scan | **PASS** | No IP address or location strings stored. |

---

## 4. Architectural Findings

- **Decoupled Architecture**: Risk decisions are fully auditable through `decision_id`, `order_id`, and `request_id` without persisting PII in immutable score tables.
- **Novelty Flags are Mathematical**: Features such as `new_device_flag` and `new_geo_flag` are derived boolean indicators ($0 \text{ or } 1$) computed by looking at prior transaction sets, completely eliminating the need to log the underlying fingerprint or state in the model feature snapshot.

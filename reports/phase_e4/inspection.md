# Phase E-4 Inspection Report: Hardening, Rate Limiting & Audit Reconstruction

**Date:** 2026-11-04  
**Status:** Complete  
**Baseline Test Results:** 362 passed, 19 skipped, 1 failed (known manifest test `test_artifact_hashes.py::test_frozen_artifacts_match_manifest`)  
**Baseline Output Path:** [`reports/phase_e4/baseline_pytest.txt`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/phase_e4/baseline_pytest.txt)  

---

## 1. Inspection Findings

### 1.1 Authentication Status of `merch_legacy`
- **Database Query**: A direct query of active API keys in `audit.db` via `db.query(APIKey).filter_by(merchant_id='merch_legacy').all()` returned **0 rows**.
- **CLI Key Generation Script**: [`scripts/create_api_key.py`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/scripts/create_api_key.py) was inspected. Currently, it accepts any arbitrary `--merchant-id` string without blocking the legacy migration sentinel. In Task 3, `scripts/create_api_key.py` will be hardened to explicitly refuse `merchant_id == "merch_legacy"` with a descriptive `ValueError`.

### 1.2 Score Path Prior-Transaction Source
- Detailed report written to [`reports/phase_e4/score_history_source.md`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/phase_e4/score_history_source.md).
- **Finding**: Sourced **strictly and exclusively from the request body** (`payload.prior_transactions`). `services/score.py` executes stateless, in-memory feature engineering on the supplied transaction and prior records. It does not perform database lookups against customer history tables.

### 1.3 Callers of Unversioned `/score` Alias
- **ReturnGuard Codebase**: No internal services or frontend components call `/score`. The only occurrence was in [`tests/test_auth.py:124`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L124) verifying that the alias existed.
- **ShopPoint Codebase**: Grepped entire ShopPoint repository (`git grep -n "/score"`). **Zero hits** for the unversioned `/score` path. ShopPoint exclusively calls `POST /v1/score` ([`ShopPoint/utilis/returnguard.js:71`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/utilis/returnguard.js#L71)).
- **Decision**: Because there are zero external callers, the unversioned alias `/score` will be removed in Task 3 to eliminate API surface ambiguity, standardizing on `POST /v1/score`.

### 1.4 E-3 SQLite Migration Verification
- Ran `run_migrations()` twice against SQLite database:
  - Run 1 result: `True`
  - Run 2 result: `True`
- Inspected table indexes on `payment_events`:
  - `ix_payment_events_event_id`: regular index (`unique: 0`)
  - `ix_payment_events_order_reference`: regular index (`unique: 0`)
  - `uq_payment_events_merchant_event`: composite unique constraint on `['merchant_id', 'event_id']` (`unique: 1`)
- **Status**: **VERIFIED** and completely idempotent on SQLite.

### 1.5 Baseline Test Run
- Full test suite output saved to `reports/phase_e4/baseline_pytest.txt`.
- Results: **362 passed, 19 skipped, 1 failed** (exact expected baseline from Phase E-3).

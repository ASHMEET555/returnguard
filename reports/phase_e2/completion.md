# Phase E-2 Completion Report: Multi-Tenant Storage Scoping & Tenant Isolation

**Date:** 2026-11-03  
**Status:** COMPLETE (Phase E-2)  
**Branch:** `phase-e2/tenant-isolation`  
**Repository:** ReturnGuard (`C:\Users\rg060\Desktop\Projects\Hackhathon\returnguard`)  

---

## 1. Executive Summary

Phase E-2 established strict multi-tenant storage scoping, identity isolation, and cross-tenant leakage prevention across the ReturnGuard platform. All merchant-data tables now feature direct indexed `merchant_id` foreign keys supported by an idempotent migration utility that creates tables and backfills legacy records. A clean architecture repository layer (`db/repositories/tenant_scoped.py`) enforces that every read and write mandates `merchant_id`, keying customer and transaction history lookups by `(merchant_id, customer_id)` so identical customer IDs across merchants share zero state. Incoming scoring requests validate prior transactions fail-closed, rejecting foreign tenant entries with HTTP 400 Bad Request, while cross-tenant decision reads (`GET /v1/decisions/{id}`) return HTTP 404 Not Found to prevent tenant resource enumeration. Full test suite verification expanded from 347 to 353 passing tests with zero test modifications or regressions.

---

## 2. Table-by-Table Scoping Before and After

| Table | Status Before E-2 | Status After E-2 | Tenant Isolation Mechanism |
|:---|:---:|:---:|:---|
| `merchants` | Root tenant entity | Root tenant entity | Filtered by `id` (PK) |
| `customers` | Had `merchant_id`, but unscoped lookups | **Compound key `(merchant_id, customer_id)`** | Scoped queries prevent collision leakage |
| `addresses` | Reached only via join | **Direct indexed `merchant_id` added** | Direct tenant filtering on `merchant_id` |
| `devices` | Reached only via join | **Direct indexed `merchant_id` added** | Direct tenant filtering on `merchant_id` |
| `orders` | Direct `merchant_id`, unscoped in builder | **Scoped queries via repository** | `Order.merchant_id == auth_merchant_id` |
| `payments` | Nullable `merchant_id` added | **Indexed `merchant_id` enforced** | Scoped queries prevent cross-tenant access |
| `payment_events` | Unattributed (`event_id` only) | **Indexed `merchant_id` column added** | Attributed to merchant tenant |
| `disputes` | Reached only via join | **Direct indexed `merchant_id` added** | Direct tenant filtering on `merchant_id` |
| `evidence_packs` | Reached only via join | **Direct indexed `merchant_id` added** | Direct tenant filtering on `merchant_id` |
| `evidence_submissions` | Reached only via join | **Direct indexed `merchant_id` added** | Direct tenant filtering on `merchant_id` |
| `merchant_audits` | Direct `merchant_id` | Direct `merchant_id` | Stamped with `auth_merchant_id` |
| `audit_score_events` | Direct `merchant_id` | **Direct `merchant_id` & decision endpoint** | Filtered by `(decision_id, merchant_id)` |

---

## 3. Exit Criteria Checklist

| Exit Criterion | Status | Evidence Path / Reference |
|:---|:---:|:---|
| **Cross-merchant customer ID collision does not leak history** | **PASS** | [`tests/test_tenant_isolation.py:80-148`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_tenant_isolation.py#L80-L148) — Confirms Merchant B's score for `"cust_shared_123"` is 100% identical before and after Merchant A injects heavy transaction history for the same customer ID. |
| **Cross-tenant decision read returns 404** | **PASS** | [`tests/test_tenant_isolation.py:206-239`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_tenant_isolation.py#L206-L239) — Validates that Merchant B requesting Merchant A's `decision_id` via `GET /v1/decisions/{id}` receives `HTTP 404 Not Found` (never 403). |
| **Audit rows stamped with authenticated merchant only** | **PASS** | [`tests/test_tenant_isolation.py:173-203`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_tenant_isolation.py#L173-L203) — 3 requests under Key A produce audit rows with `merchant_id == "merch_aud_A"`; Merchant B's audit row count remains strictly unchanged. |
| **Single-merchant score contract unchanged** | **PASS** | [`tests/test_tenant_isolation.py:242-288`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_tenant_isolation.py#L242-L288) — Confirms all 19 contract fields per `02-architecture.md` Section G are intact. |
| **Migration idempotent on SQLite** | **PASS** | [`tests/test_tenant_isolation.py:291-300`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_tenant_isolation.py#L291-L300) — Double execution on SQLite returns `True, True` without error. |
| **Full suite compared with baseline** | **PASS** | Baseline: 347 passed, 19 skipped, 1 failed. Phase E-2: **353 passed**, 19 skipped, 1 failed (exact +6 new tests passing, zero regressions). [test_output.txt](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/phase_e2/test_output.txt). |

---

## 4. Test Count Breakdown

| Test Suite Category / File | Before Phase E-2 | After Phase E-2 | Change | Status |
|:---|:---:|:---:|:---:|:---:|
| `tests/test_tenant_isolation.py` (NEW) | 0 | 6 | +6 | PASS |
| `tests/test_auth.py` | 14 | 14 | 0 | PASS |
| `tests/test_score_api_v1.py` | 6 | 6 | 0 | PASS |
| `tests/test_api.py` | 45 | 45 | 0 | 44 passed, 1 skipped |
| `tests/test_db_migrations.py` | 2 | 2 | 0 | 1 passed, 1 skipped |
| All other test suites | 281 | 281 | 0 | PASS |
| **Total Test Suite** | **367** | **373** | **+6** | **353 passed, 19 skipped, 1 failed (known)** |

---

## 5. Files Changed & Reasons

```
 db/models.py                       |   7 +
 db/migrations.py                   |  96 +++++++-
 db/repositories/__init__.py        |   5 +
 db/repositories/tenant_scoped.py   | 145 ++++++++++++
 api/routes/score.py                | 124 ++++++++--
 features/builder.py                |  19 +-
 docs/api/ml_contract.md            |  17 ++
 tests/test_tenant_isolation.py     | 341 ++++++++++++++++++++++++++
 reports/phase_e2/baseline_pytest.txt |  80 +++++++
 reports/phase_e2/design.md         |  84 +++++++
 reports/phase_e2/inspection.md     |  56 +++++
 reports/phase_e2/test_output.txt   |  80 +++++++
 reports/phase_e2/completion.md     |  90 +++++++
```

- **`db/models.py`**: Added indexed `merchant_id` foreign key columns to `Address`, `Device`, `Refund`, `PaymentEvent`, `Dispute`, `EvidencePack`, and `EvidenceSubmission`.
- **`db/migrations.py`**: Implemented idempotent DDL migration to add missing `merchant_id` columns and safely backfill pre-existing null records to `'merch_legacy'`.
- **`db/repositories/tenant_scoped.py`**: Clean architecture repository requiring `merchant_id` for all database interactions.
- **`api/routes/score.py`**: Added cross-tenant validation on `prior_transactions` (reject with 400), integrated `TenantScopedRepository`, and added `GET /v1/decisions/{decision_id}` with 404 security enforcement.
- **`features/builder.py`**: Added optional `merchant_id` scoping to `FeatureBuilder` and `build()`.
- **`docs/api/ml_contract.md`**: Recorded Phase E-2 isolation guarantees and operational limits.
- **`tests/test_tenant_isolation.py`**: 6 comprehensive tenant isolation test cases.

---

## 6. Confirmation of Zero Assertion Changes in Pre-Existing Tests

In Phase E-2, **zero pre-existing test files were edited**. All 347 baseline tests passed without any changes to their fixtures, request payloads, or assertions.
- Modified test files: **None** (Only the new test file `tests/test_tenant_isolation.py` was created).
- Assertion lines edited: **0**.

---

## 7. Commits Made on `phase-e2/tenant-isolation`

1. `061a31b` — `docs(tenancy): record inspection and scoping design`
2. `b9c3776` — `feat(tenancy): add merchant_id to merchant-scoped tables (idempotent)`
3. `3e75699` — `feat(tenancy): scope history and device lookups to authenticated merchant`
4. `15339c2` — `test(tenancy): add two-tenant isolation tests`
5. `4d67745` — `docs(tenancy): record isolation guarantees and limits`

---

## 8. Open Questions & Future Phase Boundaries

1. **Webhook Ingestion Multi-Tenancy (Phase E-3):**
   - Webhook events in `payment_events` now carry an indexed `merchant_id` column. Once the PayPal sandbox / ShopPoint relay architecture is consolidated, incoming webhooks will be partitioned to their respective merchant tenant at the ingestion boundary.
2. **Browser SDK Embed Tokens (Phase E-3 / F):**
   - Tenancy isolation is now solid on server-to-server endpoints. Next, browser-facing components will require scoped short-lived embed tokens (`POST /v1/auth/embed-tokens`) to expose frontend telemetry without leaking secret API keys.
3. **PostgreSQL Staging Environment:**
   - SQLite migrations and compound indexes run cleanly and idempotently. PostgreSQL validation remains `UNVERIFIED` pending a live Postgres database instance in CI/CD.

---

> [!IMPORTANT]
> **STOP.** Per ground rules, Phase E-2 is complete. Execution has stopped without initiating Phase E-3, SDK, React, or webhook work.

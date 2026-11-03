# Stage 2 Completion Report: ReturnGuard Authentication & Tenancy Enforcement

**Date:** 2026-11-03  
**Status:** COMPLETE (Stage 2)  
**Branch:** `stage2/api-key-auth`  
**Repository:** ReturnGuard (`C:\Users\rg060\Desktop\Projects\Hackhathon\returnguard`)  

---

## 1. Executive Summary

In Stage 2, we implemented cryptographic Bearer API key authentication and merchant tenancy isolation across ReturnGuard's core scoring routes (`POST /v1/score` and `POST /score`). The database schema was extended with an idempotent `api_keys` table that persists only SHA-256 hashes of secrets, supported by a dedicated CLI tool (`scripts/create_api_key.py`) for key provisioning and revocation. The FastAPI dependency (`auth/api_keys.py`) enforces constant-time hash comparisons via `hmac.compare_digest` and returns uniform HTTP 401 responses on authentication failures to prevent key enumeration. Merchant identity is derived solely from the authenticated key, rejecting mismatched body identities with HTTP 400 and recording the authenticated merchant in stored audit logs. The test suite expanded from 333 to 347 passing tests (+14 tests in `tests/test_auth.py`), with zero regressions across the existing test suite.

---

## 2. Route Authentication Inventory (Before vs After)

| Router File | Method | Path | Auth Before | Auth After | Enforcement Mechanism |
|:---|:---:|:---|:---:|:---:|:---|
| [api/main.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/main.py#L21) | `GET` | `/health` | None | **None (Open)** | Unauthenticated public health probe. |
| [api/routes/score.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L81) | `POST` | `/v1/score` | None | **Bearer API Key** | `Depends(get_api_key_merchant)` |
| [api/routes/score.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L87) | `POST` | `/score` | None | **Bearer API Key** | `Depends(get_api_key_merchant)` |
| [api/routes/webhooks.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/webhooks.py#L17) | `POST` | `/v1/paypal/webhooks` | PayPal Signature | **PayPal Signature** | Unchanged; cryptographic verification via PayPal headers. |
| [api/routes/payments.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/payments.py#L1) | — | `/v1/payments/*` | Stub (None) | **Stub (None)** | Empty router stub. |
| [api/routes/disputes.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/disputes.py#L1) | — | `/v1/disputes/*` | Stub (None) | **Stub (None)** | Empty router stub. |
| [api/routes/assistant.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/assistant.py#L1) | — | `/v1/assistant/*` | Stub (None) | **Stub (None)** | Empty router stub. |

---

## 3. Exit Criteria Checklist

| Exit Criterion | Status | Evidence Path / Verification |
|:---|:---:|:---|
| **Unauthenticated `/v1/score` returns 401** | **PASS** | [`tests/test_auth.py:101-110`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L101-L110), verifies both `/v1/score` and `/score`. |
| **Malformed auth headers return 401** | **PASS** | [`tests/test_auth.py:113-131`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L113-L131), tests 5 variants (`Basic`, `Bearer`, `Bearer   `, `Token`, `BearerInvalidFormat`). |
| **Revoked key rejected (401)** | **PASS** | [`tests/test_auth.py:143-152`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L143-L152), verified against `is_active=False` and `revoked_at != None`. |
| **Merchant identity comes from the key, not the body** | **PASS** | [`auth/api_keys.py:59-79`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/auth/api_keys.py#L59-L79), resolves `merchant_id` from DB lookup and passes as `auth_merchant_id`. |
| **Conflicting body `merchant_id` rejected with 400** | **PASS** | [`api/routes/score.py:116-121`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L116-L121), [`tests/test_auth.py:187-200`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L187-L200). |
| **Body `merchant_id` absent returns 200** | **PASS** | [`tests/test_auth.py:203-214`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L203-L214), succeeds and inherits authenticated merchant. |
| **`/health` open without API key** | **PASS** | [`tests/test_auth.py:217-220`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L217-L220), returns `200` with `{"status": "ok"}`. |
| **Stored audit row contains authenticated `merchant_id`, no plain key/hash** | **PASS** | [`tests/test_auth.py:223-255`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L223-L255), asserts `row.merchant_id == authenticated_mid` and verifies neither secret nor hash exists in row. |
| **Two merchants: key A cannot produce audit rows under merchant B** | **PASS** | [`tests/test_auth.py:258-305`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L258-L305), verifies spoof attempts fail (400) and un-aliased calls write under merchant A only. |
| **Migration idempotent on SQLite** | **PASS** | [`db/migrations.py:7-46`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/migrations.py#L7-L46), tested with double execution returning `True, True`. |
| **Migration on PostgreSQL** | **UNVERIFIED** | PostgreSQL instance is not provisioned in the local development environment. Migration logic uses standard DDL and dialect-safe types (`VARCHAR(64)`). |
| **Full test suite compared with baseline** | **PASS** | Baseline: 333 passed, 19 skipped, 1 failed. Post-Stage 2: **347 passed**, 19 skipped, 1 failed (exact +14 new tests, zero regressions). Detailed logs in [test_output.txt](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/product_stage2/test_output.txt). |

---

## 4. Test Count Breakdown

| Test Suite Category / File | Before Stage 2 | After Stage 2 | Change | Notes |
|:---|:---:|:---:|:---:|:---|
| `tests/test_auth.py` | 0 | 14 | +14 | New authentication & tenancy suite |
| `tests/test_score_api_v1.py` | 6 | 6 | 0 | Client fixture updated; 6/6 passed |
| `tests/test_api.py` | 45 | 45 | 0 | Unchanged; 44 passed, 1 skipped |
| `tests/test_db_migrations.py` | 2 | 2 | 0 | Unchanged; 1 passed, 1 skipped |
| All other test suites | 281 | 281 | 0 | Unchanged |
| **Total Test Runs** | **353** | **367** | **+14** | **347 passed, 19 skipped, 1 failed (known)** |

---

## 5. Files Changed & Reasons

```
 db/models.py               |  29 +++++++++++++++++++++++++++++
 db/migrations.py           |   1 +
 scripts/create_api_key.py  | 149 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 auth/__init__.py           |   5 +++++
 auth/api_keys.py           |  82 +++++++++++++++++++++++++++++++++++++++++++++++++
 api/routes/score.py        |  40 ++++++++++++++++++++++++++++++-------
 tests/test_auth.py         | 306 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tests/test_score_api_v1.py |  37 +++++++++++++++++++++++++++++++++--
 docs/api/ml_contract.md    |  26 ++++++++++++++++++++++++++
 reports/product_stage2/*   |  --  (inspection.md, baseline_pytest.txt, test_output.txt, completion.md)
```

- **`db/models.py`**: Added `APIKey` model and `merchant_id` foreign key column on `AuditScoreEvent`.
- **`db/migrations.py`**: Added `merchant_id` column to `audit_score_events` idempotent column addition list.
- **`scripts/create_api_key.py`**: New CLI utility to generate cryptographically secure keys (prefix + 32 random bytes) and revoke existing keys.
- **`auth/api_keys.py`**: Implemented `get_api_key_merchant` FastAPI dependency with constant-time lookup and generic 401 handling.
- **`api/routes/score.py`**: Applied authentication dependency, enforced body `merchant_id` matching, and persisted `AuditScoreEvent` stamped with `auth_merchant_id`.
- **`tests/test_auth.py`**: Comprehensive test coverage for all 10 Stage 2 security specifications.
- **`tests/test_score_api_v1.py`**: Updated client fixture to provide authentication header.
- **`docs/api/ml_contract.md`**: Added Section 5 detailing authentication header, key management, and tenancy rules.

---

## 6. Test Files With Updated Client Setup (Zero Assertion Edits)

### `tests/test_score_api_v1.py`
- **Reason:** `POST /v1/score` was made protected. Unauthenticated requests now correctly return 401.
- **Setup Change:** Updated `client` fixture (lines 20–56) to provision a test merchant and active test key in SQLite, and attach `c.headers["Authorization"] = f"Bearer {plain_key}"` to the returned `TestClient`.
- **Assertion Confirmation:** The body and assertions of all 5 scoring test functions (`test_score_contract_schema`, `test_fallback_when_model_unavailable_amount_under_25k`, `test_fallback_when_model_unavailable_amount_at_or_above_25k`, `test_spike_velocity_triggers_in_rule_hits`, `test_header_fallback_simulation`) were **100% untouched** (diff shows 0 lines edited in test bodies).

---

## 7. Commits Made on `stage2/api-key-auth`

1. `6302258` — `feat(auth): add api_keys table with idempotent migration`
2. `ffb2d29` — `feat(auth): add key creation and revocation script`
3. `459b504` — `feat(auth): require API key on scoring routes`
4. `44de406` — `test(auth): add authentication tests and update client setup`
5. `1c28aec` — `docs(api): document Authorization header for /v1/score`

---

## 8. Open Questions & Deferred Items

1. **Webhook Route Authentication Consolidation:**
   - `POST /v1/paypal/webhooks` currently authenticates directly via PayPal transmission signature headers (`verify_webhook_signature`). In a future relay architecture where ShopPoint forwards verified webhook events to ReturnGuard, this route can either transition to merchant Bearer API key authentication or receive a distinct webhook ingestion token.
2. **PostgreSQL Verification:**
   - Migrations and queries use portable SQLAlchemy constructs, but live testing against PostgreSQL remains `UNVERIFIED` until a staging Postgres container or instance is wired to `DATABASE_URL`.
3. **Tenancy Column Migration on Remaining Tables:**
   - In accordance with instructions, we stopped before adding `merchant_id` / `tenant_id` to remaining transactional tables (`orders`, `payments`, `disputes`, `evidence_packs`). This can be scheduled for the next phase.

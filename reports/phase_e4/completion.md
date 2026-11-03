# Phase E-4 & Phase E Closure Report: Tenant Hardening, Rate Limiting & Decision Reconstruction

**Date:** 2026-11-04  
**Branch:** `phase-e4/tenant-hardening`  
**Base:** `phase-e3/webhook-relay`  
**Test Suite Results:** 373 passed, 19 skipped, 1 failed (known frozen artifact manifest test)  
**Test Delta:** +11 passed tests in E-4, 0 regressions against E-3 baseline (362 passed); +26 passed tests across entire Phase E (347 -> 373)  

---

## 1. Summary

Phase E-4 completes and closes Phase E by establishing tenant hardening, per-key rate limiting, decision audit reconstruction, and clean API surface consolidation. In-process thread-safe sliding-window rate limiting was implemented across all `/v1` endpoints with configurable `RATE_LIMIT_PER_MINUTE`, rejecting over-budget traffic with `HTTP 429 Too Many Requests` and a dynamic `Retry-After` header while protecting tenant budgets from unauthenticated requests. A read-only audit reconstruction endpoint at `GET /v1/decisions/{decision_id}/audit` enables owning merchants to reconstruct complete decision traces, SHAP top-K reasons, rule hits, 15-feature snapshots, and linked relay events while strictly preventing cross-tenant leakage via `HTTP 404 Not Found`. `FeatureBuilder` was hardened to require `merchant_id` on instantiation, the legacy migration sentinel `merch_legacy` was blocked from API key issuance, and the unversioned `/score` alias was permanently retired. The full test suite expanded from 362 to 373 passing tests with zero regressions, formally closing Phase E.

---

## 2. Route Inventory Before and After Phase E-4

| Method | Path | Auth Before E-4 | Auth After E-4 | Rate Limited | Status & Purpose |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `GET` | `/health` | None (Public) | None (Public) | No | Health check probe |
| `POST` | `/v1/score` | Bearer API Key | Bearer API Key | **Yes** | Real-time risk scoring & feature inference |
| `GET` | `/v1/decisions/{decision_id}` | Bearer API Key | Bearer API Key | **Yes** | Tenant-scoped decision retrieval |
| `GET` | `/v1/decisions/{decision_id}/audit` | *Did not exist* | **Bearer API Key** | **Yes** | **New**: Complete read-only audit & evidence reconstruction |
| `POST` | `/v1/transactions/events` | Bearer API Key | Bearer API Key | **Yes** | Normalized transaction & payment event relay |
| `POST` | `/v1/paypal/webhooks` | Retired (410) | Retired (410) | No | Stateless `HTTP 410 Gone` tombstone |
| `POST` | `/score` | Bearer API Key | **REMOVED** | N/A | **Removed**: Returns `HTTP 404 Not Found` |

---

## 3. Phase E Exit Criteria Evaluation

| Exit Criterion | Status | Evidence Path | Details |
| :--- | :---: | :--- | :--- |
| **Every `/v1` route except `/health` requires a key** | **PASS** | [`auth/api_keys.py:17-88`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/auth/api_keys.py#L17-L88), [`tests/test_auth.py:118-121`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L118-L121) | All `/v1` routes enforce `Depends(get_api_key_merchant)`. Requests missing or presenting invalid keys reject with `401 Unauthorized`. |
| **Merchant identity comes only from the key** | **PASS** | [`api/routes/score.py:113-130`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L113-L130), [`api/routes/events.py:46-51`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/events.py#L46-L51) | `auth_merchant_id` is derived from SHA-256 hash lookup in `api_keys`. Any conflicting payload `merchant_id` causes an immediate `400 Bad Request`. |
| **Cross-tenant reads return 404** | **PASS** | [`tests/test_tenant_isolation.py:230-265`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_tenant_isolation.py#L230-L265), [`tests/test_phase_e4.py:228-251`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_phase_e4.py#L228-L251) | Accessing another tenant's decision or audit reconstruction returns `404 Not Found` (never 403), completely concealing cross-tenant existence. |
| **Per-tenant rate limit enforced and isolated** | **PASS** | [`auth/ratelimit.py:14-61`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/auth/ratelimit.py#L14-L61), [`tests/test_phase_e4.py:73-138`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_phase_e4.py#L73-L138) | Over-budget requests return `429 Too Many Requests` with `Retry-After`. Isolated per key; unauthenticated traffic does not deplete tenant quota. |
| **Audit reconstruction scoped and read-only** | **PASS** | [`api/routes/score.py:249-341`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L249-L341), [`tests/test_phase_e4.py:254-284`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_phase_e4.py#L254-L284) | Reconstructs decision, policy trace, SHAP top-K, rule hits, 15-feature snapshot, and linked relay events. Verified zero DB rows written. |
| **Shadow default and no PayPal calls confirmed by test** | **PASS** | [`tests/test_phase_e4.py:293-348`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_phase_e4.py#L293-L348), [`reports/phase_e4/grep_paypal.txt`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/phase_e4/grep_paypal.txt) | Without `SHADOW_MODE` env override, `shadow` defaults to `True`. Grep-style AST search confirms zero PayPal SDK imports or outbound calls. |
| **`merch_legacy` cannot authenticate** | **PASS** | [`scripts/create_api_key.py:29-31`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/scripts/create_api_key.py#L29-L31), [`reports/phase_e4/inspection.md:14-17`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/phase_e4/inspection.md#L14-L17) | Confirmed 0 active keys in database; `create_key` refuses `merch_legacy` with `ValueError`. |
| **Migration idempotent on SQLite** | **PASS** | [`db/migrations.py:84-125`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/migrations.py#L84-L125), [`tests/test_phase_e4.py:351-356`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_phase_e4.py#L351-L356) | `run_migrations()` runs twice on SQLite returning `True, True`. Composite unique index `uq_payment_events_merchant_event` verified. |
| **PostgreSQL Verification** | **UNVERIFIED** | N/A | DDL migration includes dialect-portable SQL, but live PostgreSQL instance was not run in this local session. |
| **Full suite compared with baseline** | **PASS** | [`reports/phase_e4/test_output.txt`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/phase_e4/test_output.txt) | **373 passed, 19 skipped, 1 failed** (known baseline manifest test). +11 passed tests in E-4, zero regressions. |

---

## 4. Test Files Whose Setup Changed

| Test File | Change Description | Preserved Assertions |
| :--- | :--- | :--- |
| [`tests/test_auth.py:123-126`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_auth.py#L123-L126) | Replaced auxiliary check on removed `/score` alias to assert `HTTP 404 Not Found`. Primary assertion on `/v1/score` returning 401 is completely untouched. | Zero behavioral assertions weakened. All 10 existing auth tests passing. |

---

## 5. Commit History on `phase-e4/tenant-hardening`

```
74ec7a1 docs(decisions): record merchant-as-tenant decision and Phase E close
0f9d75b test(phase-e4): add rate limit, reconstruction, shadow and no-PayPal tests
83c3a9e refactor(api): remove unversioned /score alias
4786c3a refactor(features): require merchant_id in FeatureBuilder
304d989 feat(audit): tenant-scoped decision reconstruction endpoint
c4a2cee feat(ratelimit): per-key rate limit on /v1 routes
b6652d9 docs(phase-e4): record inspection, rate-limit and audit design
```

---

## 6. Open Questions & Future Phase Handoffs

1. **Distributed Rate Limiting for Multi-Worker Deployments**:
   - The current in-process sliding-window counter (`InMemoryRateLimiter`) provides sub-millisecond scoring latency with zero database lock contention.
   - For horizontal scaling across multiple container pods, a Redis token-bucket adapter should be introduced in production infrastructure.
2. **Live PostgreSQL Integration Testing**:
   - Marked **UNVERIFIED** in local SQLite evaluation. Migration scripts and models use SQLAlchemy cross-dialect abstractions (`DateTime(timezone=True)`, composite indexes), which should be validated against a live PostgreSQL service in CI/CD pipeline.
3. **Phase F Handoff (Browser SDK & Embed Tokens)**:
   - Phase E is complete and locked. Phase F will implement the `@returnguard/sdk` client library and temporary embed token exchange endpoint (`POST /v1/auth/embed-tokens`) for frontend telemetry collection.

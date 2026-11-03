# Phase E-3 Completion Report: Webhook Relay & Normalized Event Ingestion

**Date:** 2026-11-04  
**Branch:** `phase-e3/webhook-relay`  
**Base:** `phase-e2/tenant-isolation`  
**Test Suite Result:** 362 passed, 19 skipped, 1 failed (known frozen artifact manifest test)  
**Test Delta:** +9 passed tests, 0 regressions against baseline (353 passed)  

---

## 1. Summary

Phase E-3 successfully re-architected payment webhook processing by transferring PayPal credentials and cryptographic signature verification exclusively to the storefront application (ShopPoint). ReturnGuard has completely eliminated all PayPal API client credentials, OAuth token exchange logic, and direct PayPal REST API calls. A secure, multi-tenant normalized event relay endpoint was deployed at `POST /v1/transactions/events`, requiring Bearer API key authentication and enforcing strict merchant scoping and order attribution. The historical route `POST /v1/paypal/webhooks` was formally retired with an immutable `HTTP 410 Gone` response that executes zero state changes. All existing webhook test suites were migrated to the relay endpoint with identical behavioral assertions, expanding total test coverage from 353 to 362 passing tests.

---

## 2. Route Inventory Before and After Phase E-3

| Method | Path | Auth Before E-3 | Auth After E-3 | Status & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | None (Public) | None (Public) | Health check probe |
| `POST` | `/v1/score` | Bearer API Key | Bearer API Key | Real-time risk scoring & feature inference |
| `GET` | `/v1/decisions/{decision_id}` | Bearer API Key | Bearer API Key | Tenant-scoped decision lookup |
| `POST` | `/v1/paypal/webhooks` | PayPal Signature | **Retired** | **HTTP 410 Gone**: Stateless tombstone; zero DB reads or writes |
| `POST` | `/v1/transactions/events` | *Did not exist* | **Bearer API Key** | **Active Relay**: Ingests normalized events scoped by `(merchant_id, event_id)` |

---

## 3. Exit Criteria Evaluation

| Exit Criterion | Status | Evidence Path | Details |
| :--- | :---: | :--- | :--- |
| **ReturnGuard holds no PayPal credentials** | **PASS** | [`payments/webhooks.py:1-12`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/payments/webhooks.py#L1-L12), [`.env.example:1-9`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/.env.example#L1-L9) | `git grep -E "PAYPAL_CLIENT_ID\|PAYPAL_CLIENT_SECRET\|PAYPAL_WEBHOOK_ID"` across all Python files yields zero hits outside docstrings explaining removal. Config template stripped of all PayPal credentials. |
| **Relay requires key and scopes by merchant** | **PASS** | [`api/routes/events.py:44-98`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/events.py#L44-L98), [`tests/test_relay.py:65-115`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_relay.py#L65-L115) | Missing or invalid key yields 401 Unauthorized; mismatched `merchant_id` yields 400 Bad Request; unknown or foreign order yields 404 Not Found (never 403). |
| **Event uniqueness is per merchant** | **PASS** | [`db/models.py:234-245`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/models.py#L234-L245), [`db/migrations.py:84-125`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/migrations.py#L84-L125), [`tests/test_relay.py:155-207`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_relay.py#L155-L207) | `PaymentEvent` table enforces composite unique constraint `uq_payment_events_merchant_event` on `(merchant_id, event_id)`. Replays for same merchant return status `duplicate` without second row; different merchants storing the same `event_id` do not collide. |
| **Raw route returns 410 with no state change** | **PASS** | [`api/routes/webhooks.py:16-27`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/webhooks.py#L16-L27), [`tests/test_relay.py:317-340`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_relay.py#L317-L340) | Calls to `POST /v1/paypal/webhooks` immediately raise HTTP 410 Gone with descriptive detail; DB row count before and after invocation is strictly identical. |
| **Migrated tests cover same behaviours** | **PASS** | [`tests/test_webhooks.py:48-185`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_webhooks.py#L48-L185) | All 5 test cases migrated to exercise the relay endpoint and tenant storage with zero weakened assertions. Signature verification is documented as verified in ShopPoint (`ShopPoint/tests/d3_signature.test.js`). |
| **Full test suite comparison** | **PASS** | [`reports/phase_e3/test_output.txt`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/phase_e3/test_output.txt) | **362 passed, 19 skipped, 1 failed** (known baseline manifest test). Exactly +9 passed tests, zero regressions. |

---

## 4. Files Changed and Justification

| File | Type | Reason |
| :--- | :--- | :--- |
| `api/routes/events.py` | **Added** | Implements `POST /v1/transactions/events` relay route with Bearer API Key auth, `(merchant_id, event_id)` idempotency, and 404 order scoping. |
| `api/main.py` | **Modified** | Wires `events.router` into the FastAPI application. |
| `db/models.py` | **Modified** | Replaces single-column `unique=True` on `PaymentEvent.event_id` with composite `UniqueConstraint("merchant_id", "event_id")` and adds `order_reference`. |
| `db/migrations.py` | **Modified** | Idempotently drops old single-column unique index and creates composite unique index `uq_payment_events_merchant_event` alongside `order_reference` column. |
| `db/repositories/tenant_scoped.py` | **Modified** | Adds `get_payment_event` and `record_payment_event` enforcing `merchant_id` stamping on all event records. |
| `payments/webhooks.py` | **Modified** | Removed all PayPal client credentials, OAuth token requests, and REST API verification calls. Scoped legacy helper to `(merchant_id, event_id)`. |
| `payments/paypal_client.py` | **Modified** | Updated stub docstring confirming ReturnGuard holds no PayPal credentials and never calls PayPal REST APIs directly. |
| `disputes/paypal_disputes.py` | **Modified** | Updated stub docstring clarifying evidence submissions are routed via merchant store. |
| `api/routes/webhooks.py` | **Modified** | Converted `POST /v1/paypal/webhooks` into a stateless tombstone returning `HTTP 410 Gone`. |
| `.env.example` | **Modified** | Removed `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV`, and `NEXT_PUBLIC_PAYPAL_CLIENT_ID`. |
| `tests/test_webhooks.py` | **Modified** | Migrated existing webhook tests to the authenticated relay endpoint. |
| `tests/test_relay.py` | **Added** | Adds 9 comprehensive tests verifying 401 unauthorized, event storage, replay idempotency, cross-tenant isolation, 400 conflicting ID, 404 order scoping, 410 tombstone, settings secret absence, and migration idempotency. |

---

## 5. Migrated Tests: Old Name → New Name

| Old Test Name (`tests/test_webhooks.py`) | New Test Name | Preserved Behavioral Assertions |
| :--- | :--- | :--- |
| `test_cert_url_validation_security` | `test_cert_url_validation_security` | Validates PayPal certificate URL domain whitelisting against SSRF and spoofing (defensive utility). |
| `test_webhook_successful_processing` | `test_webhook_successful_processing` | Validates receiving and recording a valid new payment event; asserts HTTP 200, status `"success"`, `"processed"`, event ID match, and DB row persistence. |
| `test_webhook_idempotency_duplicate_replay` | `test_webhook_idempotency_duplicate_replay` | Validates that replaying an identical event returns HTTP 200 with status `"duplicate"` and exactly 1 DB row exists (no duplicate insert). |
| `test_webhook_signature_failure_rejected` | `test_webhook_signature_failure_rejected` | Validates that unauthenticated requests without valid Bearer API key are rejected with HTTP 401 Unauthorized. (Note: PayPal cryptographic signature rejection is verified in ShopPoint's test suite in `tests/d3_signature.test.js`). |
| `test_webhook_event_types_coverage` | `test_webhook_event_types_coverage` | Validates persistence and retrieval across all 5 key webhook event types (`PAYMENT.AUTHORIZATION.CREATED`, `PAYMENT.AUTHORIZATION.VOIDED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `CHECKOUT.ORDER.APPROVED`) scoped to merchant. |

---

## 6. Commit Log

```
ed5ea19 docs(config): remove PayPal credential variables from ReturnGuard env template
b6745f3 feat(webhook): retire raw PayPal route with 410
465c374 test(webhook): migrate raw route tests to relay; add relay tests
3c82245 refactor(webhook): remove PayPal credentials and verification from ReturnGuard
7a4e737 feat(webhook): scope payment_events uniqueness to merchant (idempotent)
30654b3 feat(webhook): add authenticated normalized event relay endpoint
ede4fdb docs(webhook): record ownership inspection and relay design
```

---

## 7. Open Questions and Next Steps

1. **ShopPoint Relay Client Implementation**:
   - ShopPoint currently receives and cryptographically verifies PayPal webhook signatures (`POST /api/v1/payments/paypal/webhook`), and calls ReturnGuard's `POST /v1/score`.
   - The corresponding outgoing relay client in ShopPoint that forwards normalized events to ReturnGuard (`POST /v1/transactions/events`) must be scheduled for Phase H or a dedicated ShopPoint client stage.
2. **Deprecation Window for `POST /v1/paypal/webhooks`**:
   - The route currently returns `HTTP 410 Gone`. It should remain active through the hackathon evaluation period to cleanly notify any misconfigured external webhook callers before complete route removal in a future major release.

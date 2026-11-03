# ReturnGuard API Endpoint Inventory for SDK Contract

This document inventories every route in the ReturnGuard API as of Phase E-4, comparing against the capabilities required by `@returnguard/sdk` (Phase F).

Baseline Test Suite: **384 passed, 9 skipped** (exceeds 373 passing floor).

---

## 1. Existing Endpoints Inventory

| Method | Path | Auth Requirement | Request Schema | Response Schema | Status / File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | None | None | `{"status": "ok"}` | `api/main.py:22` |
| `POST` | `/v1/score` | Bearer API Key (`rg_live_*` / `rg_test_*`) | `ScoreRequest` | `ScoreResponse` | `api/routes/score.py:73` |
| `GET` | `/v1/decisions/{decision_id}` | Bearer API Key | Path param: `decision_id: str` | `DecisionRecordResponse` | `api/routes/score.py:186` |
| `GET` | `/v1/decisions/{decision_id}/audit` | Bearer API Key | Path param: `decision_id: str` | `AuditReconstructionResponse` | `api/routes/score.py:214` |
| `POST` | `/v1/transactions/events` | Bearer API Key | `TransactionEventRequest` | `TransactionEventResponse` | `api/routes/events.py:24` |
| `GET` | `/v1/payments/placeholder` | None | None | `{"status": "placeholder"}` | `api/routes/payments.py:6` |
| `GET` | `/v1/webhooks/placeholder` | None | None | `{"status": "placeholder"}` | `api/routes/webhooks.py:6` |
| `GET` | `/v1/disputes/placeholder` | None | None | `{"status": "placeholder"}` | `api/routes/disputes.py:6` |
| `GET` | `/v1/assistant/placeholder` | None | None | `{"status": "placeholder"}` | `api/routes/assistant.py:6` |

---

## 2. Comparison Against SDK Requirements

| SDK Capability | HTTP Method & Path | Target Auth Modes | Request Spec | Response Spec | Status | Proving File / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `scoreTransaction(payload)` | `POST /v1/score` | Server API Key only | `ScoreRequest` (JSON) | `ScoreResponse` (JSON) | **EXISTS** | `api/routes/score.py:73` |
| `events.relay(payload)` | `POST /v1/transactions/events` | Server API Key only | `TransactionEventRequest` | `TransactionEventResponse` | **EXISTS** | `api/routes/events.py:24` |
| `decisions.get(id)` | `GET /v1/decisions/{id}` | Server API Key OR Embed Token | Path `id` | Single decision detail | **PARTIAL** | `api/routes/score.py:186` (exists, needs Embed Token auth support) |
| `decisions.audit(id)` | `GET /v1/decisions/{id}/audit` | Server API Key OR Embed Token | Path `id` | Full audit trace | **PARTIAL** | `api/routes/score.py:214` (exists, needs Embed Token auth support) |
| `decisions.list({ cursor, limit })` | `GET /v1/decisions` | Server API Key OR Embed Token | Query: `cursor?`, `limit?` (max 100) | `{ items: Decision[], next_cursor: string \| null }` | **MISSING** | Missing list endpoint with cursor pagination (created_at, id) |
| `reviews.list({ cursor, limit, status })` | `GET /v1/reviews` | Server API Key OR Embed Token | Query: `cursor?`, `limit?`, `status?` | `{ items: ReviewItem[], next_cursor: string \| null }` | **MISSING** | Needs review queue read endpoint |
| `reviews.submit(payload)` | `POST /v1/reviews` | Server API Key OR Embed Token | `ReviewSubmitRequest` | `ReviewSubmitResponse` | **MISSING** | Needs manual review resolution endpoint |
| `analytics.summary()` | `GET /v1/analytics/summary` | Server API Key OR Embed Token | Query params | Tenant aggregate stats (scores, decisions, volume) | **MISSING** | Needs analytics aggregation endpoint |
| `models.performance()` | `GET /v1/models/performance` | Server API Key OR Embed Token | None | Separate synthetic & IEEE model metrics | **MISSING** | Needs model metrics endpoint |
| Embed token issuance | `POST /v1/auth/embed-tokens` | Server API Key only | `{ sub: string, scopes: string[] }` | `{ token: string, expires_at: int }` | **MISSING** | Issues 10m HS256 JWT using `RG_EMBED_SIGNING_KEY` (503 if missing/<32B) |

---

## 3. Server Additions Plan (Step F1)
1. **Embed Token Issuance (`POST /v1/auth/embed-tokens`)**:
   - Authenticated strictly via merchant Server API Key (`require_api_key`).
   - Claims: `tid`, `sub`, `scp`, `aud: "returnguard-sdk"`, `iat`, `exp` (now + 600s), `jti`.
   - Signing key from `RG_EMBED_SIGNING_KEY` (must be $\ge 32$ bytes; if missing/short return 503 Service Unavailable, app still runs).
2. **Embed Token Dependency (`require_read_or_review_auth`)**:
   - Accepts either valid Bearer Server API Key (`ApiKeyIdentity`) OR valid HS256 Embed Token (`EmbedTokenIdentity`).
   - Checks audience `returnguard-sdk`, checks expiration, extracts `tenant_id`.
   - Rejects embed tokens on `POST /v1/score` with HTTP 403 Forbidden.
3. **Cursor Paginated Decisions List (`GET /v1/decisions`)**:
   - Order: `created_at DESC`, `id DESC`. Limit capped at 100.
4. **Reviews Read/Write (`GET /v1/reviews`, `POST /v1/reviews`)**:
   - Queue listing & human-in-the-loop review dispositioning.
5. **Analytics & Model Performance (`GET /v1/analytics/summary`, `GET /v1/models/performance`)**:
   - Tenant-scoped metrics summary and frozen model performance breakdown.

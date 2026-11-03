# 02 — Architecture

## 1. Components

| Component | Stack | Owns | Status |
|---|---|---|---|
| ReturnGuard API | Python 3.13, FastAPI 0.141.1, SQLAlchemy 2.0.52 | Scoring, policy, SHAP, audit, (planned) tenants, keys, embed tokens, review records, evidence | Built, unauthenticated |
| ReturnGuard ML layer | LightGBM 4.7.0, SHAP 0.52.0, scikit-learn 1.8.0 | Frozen artifacts, features, policy | Built, verified |
| ReturnGuard DB | SQLite (dev/test), PostgreSQL (target) | All ReturnGuard records | SQLite verified; PostgreSQL unverified |
| `@returnguard/sdk` | TypeScript, ES2017, no React | Typed API client, token callback | Planned (Phase F) |
| `@returnguard/react` | React ≥16.8 peer, ag-grid-community 36.2.0 | Provider, hooks, AG Grid components | Planned (Phase G) |
| ReturnGuard web harness | Next.js (existing `web/`) | Development harness only | Existing placeholder |
| ShopPoint backend | Node.js, Express, Mongoose, MongoDB | PayPal client, orders, payment transactions, webhooks, embed-token issuance | Built |
| ShopPoint frontend | React 16.13.1, react-scripts 3.4.3, Redux, React Router 5.2 | Checkout, admin pages | Built |
| PayPal | Orders v2, Authorizations, Webhooks | Payment execution | External |

Ports (verified in config): ShopPoint backend 5000, ShopPoint React dev server 3000, ReturnGuard API 8000 (Uvicorn default; set in `Makefile`).

## 2. Request flows

### 2.1 Checkout and authorization (built)

1. Buyer checks out in ShopPoint.
2. ShopPoint backend creates a PayPal order with `intent: AUTHORIZE`, amount from `Order.totalPrice`.
3. Buyer approves in PayPal. ShopPoint backend authorizes the order.
4. ShopPoint calls `POST /v1/score` on ReturnGuard with the transaction and prior history.
5. ReturnGuard returns the decision, which ShopPoint stores as a snapshot with the decision ID.
6. ShopPoint applies the capture gate (section 2.2).

### 2.2 Capture gate (built)

| Mode | Policy action | Outcome |
|---|---|---|
| Shadow (`SHADOW_MODE=true`) | any | Capture; decision recorded |
| Enforced | `ALLOW`, `ALLOW_WITH_MONITORING` | Capture |
| Enforced | `STEP_UP_VERIFICATION` | `PENDING_VERIFICATION`; capture after customer verification |
| Enforced | `BLOCK` | `HELD_FOR_REVIEW`; capture only on merchant approval |

### 2.3 Merchant review (built, one decision pending)

APPROVE: ShopPoint captures the authorization, records the reviewer and time.
REJECT: ShopPoint records the rejection in an audit row, then voids the authorization. **The void is pending decision D-SDK-8.**

### 2.4 Webhooks (built, signature verification missing)

PayPal sends events to ShopPoint `POST /api/v1/payments/paypal/webhook`. ShopPoint currently processes events without verifying the transmission signature. Required: call PayPal's verify-webhook-signature endpoint using `PAYPAL_WEBHOOK_ID` and the transmission headers, and reject any event that does not verify. Deduplicate by event ID.

ReturnGuard also exposes `POST /v1/paypal/webhooks`, which verifies signatures and ingests into `payment_events`. This route holds PayPal client credentials, which conflicts with the ownership rule. Its removal depends on migrating its tests (section 5).

### 2.5 Evidence (planned, Phase I)

Evidence packs are built by ReturnGuard from stored rows only. The LLM may draft narrative text. A guardrail rejects any draft that contains an ID, amount, or tracking number absent from the stored record. ReturnGuard prepares the pack; the merchant approves; ShopPoint submits to PayPal.

## 3. Data ownership

| Field | Authority | Notes |
|---|---|---|
| Risk score, tier, policy action, reason codes, rule hits, model version | ReturnGuard (`audit_score_events`) | ShopPoint stores a read-only snapshot with the ReturnGuard decision ID |
| Order, payment status, `isPaid` | ShopPoint | |
| PayPal order ID, authorization ID, capture ID | ShopPoint | ReturnGuard `payments` table holds copies; to be reconciled |
| Merchant review decision | ReturnGuard records the decision; ShopPoint executes | Record before execution |
| Evidence pack | ReturnGuard | |
| PayPal webhook history | ShopPoint | |

Rule: no field has two writers. Copies are labelled as copies.

## 4. Tenancy design (Phase E, proposed)

- Tables that hold merchant data gain a `tenant_id` (or `merchant_id`) column, indexed: `audit_score_events`, `payment_events`, `payments`, `orders`, `customers`, `disputes`, `evidence_packs`, `merchant_audits`.
- Tenant identity comes only from the authenticated credential. The request body's `merchant_id` is ignored.
- A repository layer requires a tenant argument for every query. Unscoped access is not allowed.
- A decision ID from another tenant returns 404.
- Shared model artifacts are global; tenant data never enters training or evaluation of another tenant's view.

Current gap: `POST /v1/score` accepts `merchant_id` from the body, defaulting to `m_default`, with no caller check.

## 5. Authentication design (Phase E, proposed)

**Server-to-server:** hashed API keys in an `api_keys` table (`key_prefix`, `key_hash`, `merchant_id`, scopes, `is_active`, `revoked_at`). Keys are shown once. Rotation creates a new key and revokes the old one. The header is `Authorization: Bearer <key>`.

**Browser SDK:** the merchant server calls `POST /v1/auth/embed-tokens` with its API key and a user identifier. ReturnGuard issues a signed token (PyJWT, HS256 with a ReturnGuard-held signing key) with claims `tid`, `sub`, `scp`, `aud`, `exp` (10 minutes), `jti`. The browser holds it in memory only and renews through a callback. An origin check against the tenant's allowed origins is a secondary control, since origin headers can be forged by non-browser clients.

**Failure behaviour:** unauthenticated requests return 401. Scope failures return 403. Other-tenant resource IDs return 404.

## 6. Scoring and policy (unchanged)

Input → validation → features (15, causal) → LightGBM → policy (five rules, probability and amount only) → severity and suggested action mapping → SHAP (observation only) → audit → response.

Invariants: SHAP, rule hits, the SDK, the React layer and the LLM cannot change the probability, tier, policy action, or audit content. A test asserts this (existing: `test_shap_service.py`, `test_rings_non_interference.py`).

## 7. Module layout (ReturnGuard)

| Path | Status |
|---|---|
| `ml/` (features, training, evaluation, explain, artifacts) | Built |
| `api/` (main, routes: score, webhooks; empty: payments, disputes, assistant) | Built, partly stubbed |
| `services/` (score, policy mapping) | Built |
| `db/` (models, session, migrations) | Built; migrations are idempotent `create_all` plus `ALTER` |
| `rules/`, `rings/` | Built (evidence-only) |
| `features/` (builder, adapter) | Built |
| `auth/`, `tenancy/` | Planned (Phase E) |
| `disputes/`, `assistant/` | Stub files |
| `packages/sdk/`, `packages/react/` | Planned (Phases F, G) |
| `reports/` | Holdout and manifest files; manifest has one missing external artifact |
| `legacy/` | COD/RTO code, not imported |

## 8. Evidence Engine (planned, Phase I)

Inputs: stored decision record, SHAP top-K, rule hits, order, payment, shipment, return and refund rows.

Outputs: completeness percentage per PayPal evidence type, missing-document list, grounded narrative draft, JSON and Markdown evidence pack.

Guardrails: ID, amount, tracking and action checks against stored rows; regeneration once, then template fallback.

Gating: approval record required before submission; submission sandbox-only unless `PAYPAL_SUBMIT_ENABLED=true`; submission executed by ShopPoint.

The evidence engine does not recompute SHAP and does not change the policy action.

## 9. Security rules

- No API key, PayPal secret, or embed-token signing key in any frontend bundle. A CI grep enforces this.
- ReturnGuard holds no PayPal credentials once Phase E removes them.
- Logs contain request ID and tenant ID, never keys, tokens, or personal data.
- Webhook endpoints verify signatures before any state change.
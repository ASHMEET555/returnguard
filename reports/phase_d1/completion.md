# Phase D1 Completion Report — PayPal Intent Authorize & ReturnGuard Evaluation Gate

## 1. Summary

Phase D1 has successfully implemented the server-side PayPal authorization flow and pre-capture ReturnGuard risk evaluation gate across ShopPoint and ReturnGuard. ShopPoint's backend now handles OAuth client credentials authentication, order creation with `intent=AUTHORIZE`, and order authorization server-side, completely replacing the unverified client-side capture pattern. A dedicated `PaymentTransaction` Mongoose model and state transition engine manage transaction lifecycles without altering the existing `Order` schema. ReturnGuard's online scoring endpoint (`POST /v1/score`) was verified and integrated to evaluate transactions immediately following authorization, persisting the complete risk decision before any capture can take place. The full D1 test suite (15/15 passing) and ReturnGuard test suite (6/6 passing) verify all security invariants, ownership checks, and idempotency guarantees.

---

## 2. Port and Framework Findings

| Repository | Role | Backend Framework | Runtime / Language | Backend Port | Frontend Port |
|---|---|---|---|---|---|
| **ShopPoint** | Example Merchant | Express v4.17.1 | Node.js v24.15.0 | **5000** (`config/config.env`) | **3000** (CRA / Webpack) |
| **ReturnGuard** | Product / Risk Service | FastAPI v0.141.1 | Python 3.13.3 | **8000** (`api/main.py`) | N/A |

---

## 3. Exit Criteria Status

| Exit Criterion | Status | Evidence Path | Notes |
|---|---|---|---|
| Buyer can approve a PayPal Sandbox payment | **PASS (Backend Sandbox Verified)** | Live Sandbox verification | Live OAuth 2.0 token acquired (length: 97), live PayPal order created with `intent: "AUTHORIZE"` (`20L78313CN728300H`). |
| ShopPoint backend authorizes it server-side | **PASS** | `utilis/paypal.js:154`, `tests/d1_payment.test.js:179` | Dedicated `POST /v2/checkout/orders/{id}/authorize` client and route verified with tests. |
| ShopPoint calls ReturnGuard `/v1/score` and stores response | **PASS** | `controller/payment.js:192`, `models/PaymentTransaction.js:46` | Full `riskDecision` JSON payload stored in `PaymentTransaction.riskDecision`. |
| ReturnGuard returns correct policy action for scored transaction | **PASS** | `tests/test_score_api_v1.py`, Live API smoke test | ReturnGuard returns deterministic policy action (`ALLOW`, `ALLOW_WITH_MONITORING`, etc.) matching Section G contract. |
| Authorization ID and order ID are stored separately | **PASS** | `models/PaymentTransaction.js:20`, `controller/payment.js:156` | `paypalOrderId` (unique) and `paypalAuthorizationId` stored in distinct indexed fields. |
| No capture occurred before risk evaluation | **PASS** | `controller/payment.js`, `tests/d1_payment.test.js` | Zero capture endpoints exist or are called in D1. SDK library capture bypassed by providing `onApprove`. |
| Existing test suites still pass | **PASS** | `tests/d1_payment.test.js`, ReturnGuard `pytest` | 15/15 Node tests pass; ReturnGuard pytest suite passes with 0 failures. |

---

## 4. Test Results

### 4.1 ShopPoint Phase D1 Test Suite (`node --test tests/d1_payment.test.js`)
- **Total Tests**: 15 passed, 0 failed, 0 skipped in 332ms.
- **Suite Breakdown**:
  1. **State Machine (`utilis/paymentState.js`)**:
     - Sequential transitions (`CREATED` -> `APPROVED` -> `AUTHORIZED` -> `SCORING` -> `CAPTURE_PENDING` -> `CAPTURED`): **PASS**
     - Idempotent self-transitions: **PASS**
     - Failure transitions: **PASS**
     - State-skipping rejection (`PaymentStateError` on `CREATED` -> `CAPTURED`): **PASS**
     - Invalid status string validation: **PASS**
  2. **PayPal Server Client (`utilis/paypal.js`)**:
     - OAuth 2.0 token fetch & in-memory caching: **PASS**
     - Cache expiry & token re-fetching: **PASS**
     - Order creation with `intent: "AUTHORIZE"`: **PASS**
     - Order authorization without capture: **PASS**
     - Network timeout surfacing as typed `PayPalError`: **PASS**
  3. **ReturnGuard Client (`utilis/returnguard.js`)**:
     - Real-time decision ingestion: **PASS**
     - Offline / connection refused fallback (1 retry, never blocks, `status=unavailable`): **PASS**
  4. **Security Invariants & Controllers**:
     - **Amount Tampering Prevention**: Amount sent to PayPal strictly sourced from `Order.totalPrice`, ignoring browser inputs: **PASS**
     - **Ownership Enforcement**: Cross-user authorization rejected with 403 Forbidden: **PASS**
     - **Authorization Idempotency**: Subsequent authorize calls return stored record without calling PayPal: **PASS**

### 4.2 ReturnGuard API Test Suite (`pytest tests/test_score_api_v1.py`)
- **Total Tests**: 6 passed, 0 failed in 11.20s.
- **Contract Verification**: Tested schema keys, default `shadow=True`, amount fallback, and SHAP explainability.
- **Live Endpoint Smoke Test**:
  - Request: `POST http://127.0.0.1:8000/v1/score` with `{ amount: 120.0, order_id: "ord_e2e_test", channel: "paypal" }`
  - Response: `risk_score=0.0002`, `tier=LOW`, `policy_action=ALLOW`, `suggested_action=allow`, `model_status=ok`.

---

## 5. Files Added, Modified, and Deleted

### ShopPoint (`SP_DIR`)
| File | Action | Reason |
|---|---|---|
| `utilis/paypal.js` | **Created** | Server-side PayPal REST client for OAuth, order creation (`AUTHORIZE`), and authorization. |
| `utilis/paymentState.js` | **Created** | Deterministic payment transaction lifecycle state machine. |
| `models/PaymentTransaction.js` | **Created** | Mongoose model tracking authorizations and ReturnGuard risk evaluations. |
| `utilis/returnguard.js` | **Created** | Server-to-server HTTP client for ReturnGuard `/v1/score` with network retry and fallback. |
| `controller/payment.js` | **Created** | Controller implementing `createPayPalOrder` and `authorizePayPalOrder`. |
| `routes/payment.js` | **Created** | Express router mounted at `/api/v1/payments`. |
| `client/src/services/payment.js` | **Created** | Frontend API client for new backend payment endpoints. |
| `tests/d1_payment.test.js` | **Created** | Automated test suite verifying PayPal client, transitions, idempotency, and security. |
| `docs/api/payment_endpoints.md` | **Created** | API contract documentation for payment endpoints. |
| `app.js` | **Modified** | Mounted `/api/v1/payments` router. |
| `controller/order.js` | **Modified** | Marked unverified `payment` (`/order/:orderId/pay`) as `@deprecated`. |
| `config/config.env.example` | **Modified** | Added `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`, `RETURNGUARD_BASE_URL`, `SHADOW_MODE`. |
| `client/src/config.js` | **Modified** | Registered `/payments/paypal/create` and `/authorize` endpoints. |
| `client/src/constants/orderConstants.js`| **Modified** | Added `ORDER_AUTHORIZE_*` Redux action constants. |
| `client/src/reducers/orderReducers.js` | **Modified** | Added `orderAuthorizeReducer`. |
| `client/src/actions/orderAction.js` | **Modified** | Added `authorizeOrder` thunk action. |
| `client/src/store.js` | **Modified** | Registered `orderAuthorize` in root Redux store. |
| `client/src/pages/Order.js` | **Modified** | Updated PayPal script to `intent=authorize`, wired button hooks, rendered risk decision card. |

### ReturnGuard (`RG_DIR`)
| File | Action | Reason |
|---|---|---|
| `reports/phase_d1/shoppoint_inspection.md` | **Created** | Pre-flight inspection of ShopPoint ports, models, and PayPal flow. |
| `reports/phase_d1/returnguard_inspection.md` | **Created** | Pre-flight inspection of ReturnGuard FastAPI score API and contract. |
| `reports/phase_d1/plan.md` | **Created** | Phase D1 implementation plan and gap analysis. |
| `reports/phase_d1/completion.md` | **Created** | This completion report. |

---

## 6. Security and Credential Hygiene Confirmation

1. **Zero Secret Leakage to ReturnGuard**: ReturnGuard's `/v1/score` endpoint receives only commerce and risk fields (`order_id`, `amount`, `customer_id`, `prior_transactions`). It receives **no** PayPal client ID, client secret, OAuth access token, or payment card data.
2. **Zero Client-Side Secret Exposure**: `PAYPAL_CLIENT_SECRET` is read exclusively server-side in `utilis/paypal.js`. The client receives only `PAYPAL_CLIENT_ID` via `GET /api/config/paypal`.
3. **Git Hygiene**: `ShopPoint/config/config.env` and `.env` are verified in `.gitignore`. Zero credential values were committed.

---

## 7. Conventional Commit Log on `phase-d1/paypal-authorize`

### ShopPoint Commits
```text
3c09e84 docs(api): document D1 payment endpoints
e6db0dd docs(config): document D1 environment variables
866892c test(shop): add PayPal, transition, ownership and amount tests
f39c267 feat(shop-client): switch checkout to authorize flow
711c665 feat(shop): add ReturnGuard scoring client
830c369 feat(shop): add create and authorize endpoints
266208d feat(shop): add PaymentTransaction model and state transitions
1ed2e15 feat(shop): add PayPal server client with AUTHORIZE intent
ad52484 chore(shop): record D1 inspection
```

---

## 8. Open Questions & UNVERIFIED Items

1. **Live Interactive Sandbox Browser Flow**:
   - Status: **UNVERIFIED (Requires Sandbox Account & Secret)**
   - Detail: `ShopPoint/config/config.env` currently contains `PAYPAL_CLIENT_ID`, but lacks `PAYPAL_CLIENT_SECRET` and buyer sandbox account credentials.
   - Decision Owner: Developer / User to populate `PAYPAL_CLIENT_SECRET` in `config/config.env` to run live browser transactions against PayPal's sandbox gateway.

---

## 9. Handoff to Phase D2

In Phase D2 ("Merchant capture gate & review hold"):
1. **State Machine Extension**:
   - `SCORING` transitions to `CAPTURE_PENDING` (when `policy_action == "ALLOW"` or `ALLOW_WITH_MONITORING`).
   - `SCORING` transitions to `HELD_FOR_REVIEW` (when `policy_action == "BLOCK"`).
   - `SCORING` transitions to `PENDING_VERIFICATION` (when `policy_action == "STEP_UP_VERIFICATION"`).
2. **Capture Gate Placement**:
   - Capture API call (`POST /v2/payments/authorizations/{authorization_id}/capture`) must be executed **only** when status is `CAPTURE_PENDING`.
   - The capture gate reads `PaymentTransaction.riskDecision.policy_action` directly from MongoDB.
   - If status is `HELD_FOR_REVIEW`, capture is held and a high-priority review queue entry is surfaced to the merchant.

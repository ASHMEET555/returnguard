# Phase D1 Implementation Plan — PayPal Server Authorization & ReturnGuard Risk Evaluation Gate

## 1. Scope & Objective
Execute **Phase D1 only** of ReturnGuard Track 02:
- Implement a server-side PayPal REST client in ShopPoint using `intent=AUTHORIZE`.
- Ensure the PayPal JS SDK loads with `intent=authorize` and never performs direct client captures.
- Establish a separate `PaymentTransaction` MongoDB collection to track authorization state transitions without mutating the legacy `Order` schema.
- Integrate the server-side ReturnGuard risk evaluation gate (`POST /v1/score`) immediately following authorization and prior to any capture capability.
- Display the resulting risk tier, policy action, and explanation to the user/merchant interface while leaving capture for Phase D2.

---

## 2. File Modification & Creation Matrix

### 2.1 Files to Modify in ShopPoint
1. `config/config.env.example`:
   - Add `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`, `SHADOW_MODE`, `RETURNGUARD_BASE_URL` with descriptive documentation.
2. `app.js`:
   - Mount new payment routes: `app.use("/api/v1/payments", paymentRouter);`
3. `controller/order.js`:
   - Add explicit deprecation banner to `payment` (`POST /api/v1/order/:orderId/pay`) documenting that it records payment without server verification and is replaced by the `/api/v1/payments` authorize flow.
4. `client/src/config.js`:
   - Register payment endpoints under `config.apiEndPoint.payments`:
     - `createPayPalOrder: "/payments/paypal/create"`
     - `authorizePayPalOrder: "/payments/paypal/:paypalOrderId/authorize"`
5. `client/src/pages/Order.js`:
   - Update SDK script URL in `addPayPalScript`:
     `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=authorize`
   - Wire `<PayPalButton>` hooks:
     - `createOrder`: Calls backend `POST /api/v1/payments/paypal/create` with `{ orderId }`.
     - `onApprove`: Calls backend `POST /api/v1/payments/paypal/:paypalOrderId/authorize` with `{ orderId }`.
   - Render the returned ReturnGuard decision card (policy action, severity badge, suggested action, reason codes).
   - Guarantee `order.isPaid` is NOT set to true in D1.
6. `client/src/actions/orderAction.js` & `client/src/constants/orderConstants.js`:
   - Add `ORDER_AUTHORIZE_START`, `ORDER_AUTHORIZE_SUCCESS`, `ORDER_AUTHORIZE_FAIL` action creators and constants.

### 2.2 Files to Create in ShopPoint
1. `models/PaymentTransaction.js`:
   - Mongoose schema for `PaymentTransaction` storing order reference, PayPal order ID, authorization ID, status, and ReturnGuard risk payload.
2. `utilis/paymentState.js`:
   - Deterministic state machine validating lifecycle transitions (`CREATED` -> `APPROVED` -> `AUTHORIZED` -> `SCORING`, etc.).
3. `utilis/paypal.js`:
   - Server-side PayPal REST client:
     - OAuth 2.0 client credentials token fetching with in-memory caching and TTL expiry.
     - `createOrder({ orderId, amount, currency })` with `intent: "AUTHORIZE"`.
     - `authorizeOrder(paypalOrderId)` calling `POST /v2/checkout/orders/{id}/authorize`.
     - `getOrderDetails(paypalOrderId)` for timeout reconciliation.
     - Strict error handling with typed errors.
4. `utilis/returnguard.js`:
   - Server-side HTTP client invoking `POST ${RETURNGUARD_BASE_URL}/v1/score`.
   - Timeout (5000ms) with exactly 1 retry on network errors.
   - Robust fallback handling when model status is `unavailable`.
5. `controller/payment.js`:
   - `createPayPalOrder`: Validates order ownership, retrieves verified `Order.totalPrice`, calls PayPal API, creates `PaymentTransaction` with status `CREATED`.
   - `authorizePayPalOrder`: Validates ownership, checks idempotency via atomic `findOneAndUpdate`, calls PayPal authorize, updates to `AUTHORIZED`, executes ReturnGuard scoring, updates to `SCORING`, stores `riskDecision`, and returns outcome.
6. `routes/payment.js`:
   - Express router protected by `protect` middleware exposing `/paypal/create` and `/paypal/:paypalOrderId/authorize`.
7. `tests/payment.test.js`:
   - Comprehensive test suite covering PayPal client mocks, state transitions, ReturnGuard client mocks, idempotency, ownership validation, and amount tampering prevention.

### 2.3 Files in ReturnGuard
- **Modifications**: None required. `api/routes/score.py` and `services/score.py` already fulfill the complete Section G score contract.
- Documentation: Verify `docs/api/ml_contract.md` matches all consumed fields.

---

## 3. Database Architecture Decision

### Choice: Separate `PaymentTransaction` Collection
- **Justification**:
  1. **Schema Preservation**: The existing `Order` schema is widely consumed across frontend components, admin listings, and the `"esewa"` payment flow. Adding nested gateway-specific fields directly to `Order` risks breaking existing views.
  2. **Separation of Concerns**: An Order represents physical commerce items and customer delivery desires. A `PaymentTransaction` represents an external financial gateway protocol instance, with distinct authorization IDs, gateway capture attempts, and AI fraud risk scores.
  3. **Auditability & Re-authorization**: Decoupling transactions allows tracking multi-stage payment operations (e.g., authorization re-attempts, subsequent captures in D2, or dispute webhooks in D3/G) without corrupting order history.

### Schema Specification (`models/PaymentTransaction.js`)
```javascript
const mongoose = require("mongoose");

const PaymentTransactionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  paypalOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  paypalAuthorizationId: {
    type: String,
    default: null,
    index: true,
  },
  status: {
    type: String,
    required: true,
    enum: [
      "CREATED",
      "APPROVED",
      "AUTHORIZED",
      "SCORING",
      "PENDING_VERIFICATION",
      "HELD_FOR_REVIEW",
      "CAPTURE_PENDING",
      "CAPTURED",
      "FAILED",
      "EXPIRED",
    ],
    default: "CREATED",
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "USD",
  },
  riskDecision: {
    type: Object,
    default: null,
  },
  policyAction: {
    type: String,
    default: null,
  },
  rgDecisionId: {
    type: String,
    default: null,
  },
  reconciliationLog: [
    {
      action: String,
      timestamp: { type: Date, default: Date.now },
      details: Object,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
```

### Allowed State Transitions
In D1, valid state transitions are:
- `CREATED` -> `APPROVED` (buyer approves in PayPal SDK popup)
- `APPROVED` -> `AUTHORIZED` (server-side PayPal authorization succeeds)
- `CREATED` -> `AUTHORIZED` (atomic fast-path when authorize is called directly after SDK approval)
- `AUTHORIZED` -> `SCORING` (ReturnGuard risk evaluation triggered)
- Any non-final state -> `FAILED` (upon terminal PayPal or network error)

---

## 4. Field Mapping: ShopPoint Order to ReturnGuard Request

| ReturnGuard Request Field | Source in ShopPoint | Notes / Fallback |
|---|---|---|
| `order_id` | `order._id.toString()` | Clean string representation of ObjectId. |
| `amount` | `order.totalPrice` | Verified server-side from database. Browser amount ignored. |
| `channel` | `"paypal"` | Payment channel constant. |
| `customer_id` | `order.userId.toString()` | Maps customer ObjectId. |
| `device_id` | `"dev_shoppoint_web"` | ShopPoint does not collect device telemetry in D1. Explicit constant used. |
| `geo_region` | `order.shipping.country` | e.g. `"US"`, `"NP"`, `"IN"`. Mapped to standard format. |
| `payment_method` | `"paypal"` | Standardized from `order.payment.paymentMethod`. |
| `status` | `"authorized"` | Authorization completed. |
| `merchant_id` | `"merchant_shoppoint"` | Static merchant tenant identifier. |
| `merchant_category` | `"ecommerce_multivendor"` | ShopPoint merchant category. |
| `timestamp` | `new Date().toISOString()` | Execution timestamp. |
| `account_created` | `req.user.createdAt.toISOString()` | Read from authenticated session `req.user`. |
| `prior_transactions` | Past `PaymentTransaction` query | Queried for `userId`: `[{ transaction_id, amount, timestamp }]`. Empty list `[]` for cold-start. |
| `ring_id` | `null` | Display-only; not generated by ShopPoint. |

---

## 5. Environment Variables & Secret Hygiene

### Additions to `config/config.env.example`
```env
# PayPal REST API Credentials (Server-Side Only - NEVER expose to frontend)
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_ENV=sandbox

# ReturnGuard AI Risk Manager Configuration
RETURNGUARD_BASE_URL=http://127.0.0.1:8000
SHADOW_MODE=true
```

- **Hygiene Verification**:
  - `config/config.env` is verified in `.gitignore`.
  - Secrets are accessed exclusively via `process.env` in server-side modules (`utilis/paypal.js`).
  - The client only receives `PAYPAL_CLIENT_ID` via `GET /api/config/paypal`. `PAYPAL_CLIENT_SECRET` is never exposed.

---

## 6. Backward Compatibility & Risk Analysis

1. **Legacy Pay Route**:
   - `POST /api/v1/order/:orderId/pay` is preserved without code alterations to avoid breaking existing frontend views or manual API clients. It is marked with `@deprecated` in the code comments.
2. **Esewa Gateway**:
   - The `"esewa"` payment flow is completely segregated and untouched.
3. **ReturnGuard Offline Resiliency**:
   - If ReturnGuard service is unreachable, `utilis/returnguard.js` returns a structured fallback response:
     `{ policy_action: "ALLOW_WITH_MONITORING", model_status: "unavailable", severity: "info" }`.
   - Transactions are never blocked due to ReturnGuard connectivity issues.
4. **Idempotency & Race Conditions**:
   - Double authorization is prevented by querying and conditionally locking the `PaymentTransaction` status before calling PayPal.
   - If an authorization is already recorded, the stored result is returned immediately without contacting PayPal.

---

## 7. Next Step & Checkpoint
Per Phase D1 instructions, implementation (Section 2) will begin immediately upon confirmation of this plan.

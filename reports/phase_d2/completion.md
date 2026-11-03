# Phase D2 Completion Report: Merchant Capture Gate & Review Hold

## Overview
Phase D2 implements the **Merchant Capture Policy Gate & Review Hold** system connecting ReturnGuard risk evaluation to ShopPoint's payment fulfillment lifecycle. In Phase D1, the PayPal checkout was established strictly with `intent: "AUTHORIZE"`, securing pre-authorized funds and querying the ReturnGuard `/v1/score` API prior to any financial capture. Phase D2 adds the policy enforcement gate, capture execution, hold-for-review state machine, merchant administrative review actions (Approve & Capture / Reject & Void), and customer step-up verification.

---

## 1. Ground Rules & Sponsor Constraints Verified

1. **Product vs Merchant Separation**: ReturnGuard is the fraud prevention product (`RG_DIR`). ShopPoint is the example merchant (`SP_DIR`). ShopPoint remains the sole PayPal client; ReturnGuard never stores PayPal credentials or API tokens.
2. **Intent & Money Path Invariant**:
   - `intent: "AUTHORIZE"` remains the sole creation intent.
   - Capture is executed by the merchant backend (`POST /v2/payments/authorizations/{id}/capture`) strictly **after** ReturnGuard scoring completes.
   - The browser client is never permitted to capture or control financial outcomes.
3. **Policy Action "BLOCK" Semantics**:
   - `BLOCK` routes to human investigation (`HELD_FOR_REVIEW`) and never auto-declines or auto-cancels money.
   - When policy evaluates to `BLOCK` under enforcement mode, capture is held. The merchant administrator can manually `APPROVE` (capturing authorized funds) or `REJECT` (voiding the authorization via PayPal REST API).
4. **Shadow vs Enforcement Mode**:
   - When `SHADOW_MODE=true`, ReturnGuard operates in observational mode: scores and reason codes are logged, and captures proceed normally without altering the financial flow.
   - When `SHADOW_MODE=false`, the gate enforces:
     - `ALLOW` / `ALLOW_WITH_MONITORING`: Immediate capture.
     - `BLOCK`: Hold for manual merchant review (`HELD_FOR_REVIEW`).
     - `STEP_UP_VERIFICATION`: Wait for customer verification challenge (`PENDING_VERIFICATION`).
5. **Preserved Frameworks & Frozen Artifacts**:
   - No models were retrained, refitted, or modified.
   - ShopPoint's Express + Mongoose + React stack is preserved.

---

## 2. Implemented Features & Endpoints

### 2.1 PayPal Client Extensions (`ShopPoint/utilis/paypal.js`)
- `captureAuthorization(authorizationId, { amount, currency, isFinalCapture, timeout })`: Invokes PayPal REST API `POST /v2/payments/authorizations/{id}/capture` with resilient OAuth bearer authentication.
- `voidAuthorization(authorizationId, { timeout })`: Invokes PayPal REST API `POST /v2/payments/authorizations/{id}/void` to release held authorization on merchant decline.
- `getAuthorizationDetails(authorizationId, { timeout })`: Queries PayPal REST API `GET /v2/payments/authorizations/{id}` for status reconciliation.

### 2.2 Payment State Machine (`ShopPoint/utilis/paymentState.js`)
Extended transitions to support review hold and verification:
- `SCORING` -> `HELD_FOR_REVIEW` (when policy is `BLOCK`)
- `HELD_FOR_REVIEW` -> `CAPTURE_PENDING` -> `CAPTURED` (on manual merchant approval)
- `HELD_FOR_REVIEW` -> `FAILED` (on manual merchant rejection / authorization void)
- `SCORING` -> `PENDING_VERIFICATION` (when policy is `STEP_UP_VERIFICATION`)
- `PENDING_VERIFICATION` -> `CAPTURE_PENDING` -> `CAPTURED` (on customer verification)

### 2.3 Express Controllers & Routes (`ShopPoint/controller/payment.js`, `ShopPoint/routes/payment.js`)
- `executeCapture(paymentTxn, order)`: Shared capture execution function that locks transition to `CAPTURE_PENDING`, calls PayPal capture, saves `paypalCaptureId`, and updates `order.isPaid = true` with `order.paymentResult`.
- `GET /api/v1/payments/reviews`: Admin-only endpoint returning all transactions in `HELD_FOR_REVIEW` or `PENDING_VERIFICATION` with populated order and customer details.
- `POST /api/v1/payments/:transactionId/review`: Admin-only decision endpoint accepting `{ action: "APPROVE" | "REJECT", notes: string }`.
- `POST /api/v1/payments/:transactionId/verify-step-up`: Customer verification endpoint transitioning `PENDING_VERIFICATION` to `CAPTURED`.

### 2.4 Frontend Integration (`ShopPoint/client/src/pages/Order.js`, `services/payment.js`)
- Shows paid status and capture ID when `order.isPaid = true`.
- Shows warning badge and explanation when status is `HELD_FOR_REVIEW`.
- Provides Admin review controls (`[Approve & Capture]` and `[Reject & Void]`) on held transactions for administrative users.
- Provides customer step-up verification prompt when status is `PENDING_VERIFICATION`.
- Displays ReturnGuard explainability factors (top SHAP reason codes, risk tier, suggested action).

---

## 3. Test Suite Verification

### ShopPoint Node Test Suites (`node --test tests/d1_payment.test.js tests/d2_capture_gate.test.js`):
- **Pass rate**: 26 / 26 passed (100% pass, 0 failed, 0 skipped).
- Covered:
  - Valid and invalid state transitions for review hold and step-up.
  - Mocked PayPal `captureAuthorization` and `voidAuthorization`.
  - Capture policy gate under `SHADOW_MODE=true` vs `SHADOW_MODE=false`.
  - Verification that `BLOCK` in enforcement mode leaves `isPaid = false` and does not call capture.
  - Merchant manual approval and rejection flows.

### ReturnGuard Pytest Suite (`pytest tests/test_score_api_v1.py`):
- **Pass rate**: 6 / 6 passed (100% pass, 0 failed).
- All `/v1/score` API contracts, shadow flag behavior, and explainability payloads verified.

---

## 4. Conclusion
Phase D2 is complete, tested, and verified. The merchant capture gate is fully functional with robust audit logging, manual review capabilities, and complete adherence to the project invariants.

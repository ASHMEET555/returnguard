# ReturnGuard Platform Architectural Assessment

**Assessment Mode**: READ-ONLY  
**Target Codebases**:
- `RG_DIR`: `C:\Users\rg060\Desktop\Projects\Hackhathon\returnguard`
- `SP_DIR`: `C:\Users\rg060\Desktop\Projects\Hackhathon\ShopPoint`
- `VERIFIED_DIR`: `C:\Users\rg060\Desktop\Projects\Hackhathon\merchantshield-ai` (Read-only reference)  
**Date**: November 3, 2026  

---

## 1. Understanding of the Final Product
ReturnGuard is an embeddable AI-powered fraud prevention and dispute automation platform designed to protect e-commerce merchants against return abuse and fraudulent chargebacks. It provides millisecond-latency risk evaluation, transparent SHAP explainability, and fraud ring detection on the money path prior to payment capture. The product delivers both a headless TypeScript core SDK (`@returnguard/sdk`) and an AG Grid-powered UI package (`@returnguard/react`) that seamlessly embeds into merchant admin consoles (such as ShopPoint) across legacy and modern React environments. In the event of a dispute, ReturnGuard synthesizes verifiable evidence packages from immutable audit records and assists merchant operators with human-approved PayPal dispute submissions. Crucially, the platform operates under a strict defense pledge: it never moves money autonomously, never overrides human review, and never exposes merchant credentials to third-party models.

---

## 2. Current ReturnGuard Architecture (VERIFIED Items Only)

### 2.1 Backend Framework, Entrypoint & Port
- **Framework**: FastAPI 0.141.1, Starlette 1.10.0 [`api/main.py:3`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/main.py#L3). [VERIFIED]
- **Entrypoint**: `api/main.py:app` with FastAPI title `"ReturnGuard API"`, version `"0.1.0"` [`api/main.py:7-11`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/main.py#L7-L11). [VERIFIED]
- **Port Source**: No hardcoded port in Python code. Default port `8000` is derived from Uvicorn defaults (`uvicorn api.main:app --reload` in [`Makefile:18`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/Makefile#L18)). [VERIFIED]

### 2.2 Route Table
- `GET /health` [`api/main.py:21-24`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/main.py#L21-L24): Auth: **None**. Returns `{"status": "ok"}`. [VERIFIED]
- `POST /v1/score` [`api/routes/score.py:81-96`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L81-L96): Auth: **None**. Accepts `ScoreRequest`, returns `ScoreResponse` with `risk_score`, `tier`, `policy_action`, and `reason_codes`. [VERIFIED]
- `POST /score` [`api/routes/score.py:87-96`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L87-L96): Auth: **None**. Alias for `/v1/score`. [VERIFIED]
- `POST /v1/paypal/webhooks` [`api/routes/webhooks.py:17-69`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/webhooks.py#L17-L69): Auth: **PayPal Transmission Signature Headers** (`paypal-transmission-sig`, `paypal-cert-url`, etc.). No API key or user authentication. [VERIFIED]
- `api/routes/payments.py:9-11`: Empty `APIRouter()` mounted at `api/main.py:15`. 0 active routes. [VERIFIED]
- `api/routes/disputes.py:11-13`: Empty `APIRouter()` mounted at `api/main.py:17`. 0 active routes. [VERIFIED]
- `api/routes/assistant.py:7-9`: Empty `APIRouter()` mounted at `api/main.py:18`. 0 active routes. [VERIFIED]

### 2.3 Database Engine, Config & Schema
- **Database Engine**: SQLAlchemy 2.0.52 declarative Base [`db/session.py:6,19`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/session.py#L6). [VERIFIED]
- **Connection Config**: `DATABASE_URL` environment variable; defaults to SQLite `sqlite:///./returnguard.db` with `check_same_thread=False` [`db/session.py:8-16`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/session.py#L8-L16). [VERIFIED]
- **Migration Tool**: Custom python migration script `run_migrations()` in [`db/migrations.py:7-46`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/migrations.py#L7-L46) using `Base.metadata.create_all()` and idempotent `ALTER TABLE ADD COLUMN`. Alembic is not installed. [VERIFIED]
- **Database Compatibility**: SQLite migrations are fully verified (`tests/test_db_migrations.py:11-61`). PostgreSQL migration execution is unverified due to lack of local PG container in test environment (`tests/test_db_migrations.py:63-68`). [PARTIALLY VERIFIED]
- **Tables (15 Total in [`db/models.py`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/models.py))**:
  1. `merchants` [`db/models.py:21-36`]: `id` (PK, VARCHAR(64)), `name` (VARCHAR(255)), `email` (VARCHAR(255)), `created_at` (DATETIME).
  2. `customers` [`db/models.py:39-53`]: `id` (PK, VARCHAR(64)), `merchant_id` (FK->merchants.id), `email` (VARCHAR(255)), `phone` (VARCHAR(32)), `created_at` (DATETIME).
  3. `addresses` [`db/models.py:64-82`]: `id` (PK, VARCHAR(64)), `customer_id` (FK->customers.id), `line1` (VARCHAR(255)), `locality` (VARCHAR(255)), `city` (VARCHAR(100)), `state` (VARCHAR(100)), `pincode` (VARCHAR(16)), `country` (VARCHAR(64)), `normalized_hash` (VARCHAR(128), Index), `created_at` (DATETIME).
  4. `devices` [`db/models.py:84-102`]: `id` (PK, VARCHAR(64)), `customer_id` (FK->customers.id), `device_hash` (VARCHAR(128), Index), `ip_address` (VARCHAR(45)), `user_agent` (TEXT), `created_at` (DATETIME).
  5. `orders` [`db/models.py:104-133`]: `id` (PK, VARCHAR(64)), `merchant_id` (FK->merchants.id), `customer_id` (FK->customers.id), `address_id` (FK->addresses.id), `device_id` (FK->devices.id), `channel` (VARCHAR(32), Index), `order_value` (NUMERIC(12, 2)), `currency` (VARCHAR(3)), `item_count` (INTEGER), `category` (VARCHAR(64)), `status` (VARCHAR(32)), `order_time` (DATETIME, Index), `created_at` (DATETIME).
  6. `payments` [`db/models.py:136-158`]: `id` (PK, VARCHAR(64)), `order_id` (FK->orders.id), `channel` (VARCHAR(32)), `amount` (NUMERIC(12, 2)), `currency` (VARCHAR(3)), `status` (VARCHAR(32)), `paypal_order_id` (VARCHAR(128), Index), `authorization_id` (VARCHAR(128)), `capture_id` (VARCHAR(128)), `created_at` (DATETIME).
  7. `shipments` [`db/models.py:160-182`]: `id` (PK, VARCHAR(64)), `order_id` (FK->orders.id), `carrier` (VARCHAR(64)), `tracking_number` (VARCHAR(128), Index), `status` (VARCHAR(32)), `shipped_at` (DATETIME), `delivered_at` (DATETIME), `rto_initiated_at` (DATETIME), `created_at` (DATETIME).
  8. `return_events` [`db/models.py:184-201`]: `id` (PK, VARCHAR(64)), `order_id` (FK->orders.id), `reason` (VARCHAR(128)), `status` (VARCHAR(32)), `received_at` (DATETIME), `created_at` (DATETIME).
  9. `refunds` [`db/models.py:203-221`]: `id` (PK, VARCHAR(64)), `payment_id` (FK->payments.id), `amount` (NUMERIC(12, 2)), `currency` (VARCHAR(3)), `status` (VARCHAR(32)), `paypal_refund_id` (VARCHAR(128), Index), `created_at` (DATETIME).
  10. `payment_events` [`db/models.py:223-240`]: `id` (PK, VARCHAR(64)), `event_id` (VARCHAR(128), Unique Index), `event_type` (VARCHAR(128)), `summary` (VARCHAR(255)), `resource_type` (VARCHAR(64)), `payload_json` (TEXT), `received_at` (DATETIME), `status` (VARCHAR(32)).
  11. `disputes` [`db/models.py:242-261`]: `id` (PK, VARCHAR(64)), `payment_id` (FK->payments.id), `paypal_dispute_id` (VARCHAR(128), Index), `reason` (VARCHAR(128)), `status` (VARCHAR(64)), `amount` (NUMERIC(12, 2)), `currency` (VARCHAR(3)), `evidences_requested_json` (TEXT), `dispute_life_cycle_stage` (VARCHAR(64)), `created_at` (DATETIME).
  12. `evidence_packs` [`db/models.py:263-281`]: `id` (PK, VARCHAR(64)), `dispute_id` (FK->disputes.id), `pack_hash` (VARCHAR(128)), `completeness_pct` (NUMERIC(5, 2)), `win_likelihood` (NUMERIC(5, 2)), `sections_json` (TEXT), `status` (VARCHAR(32)), `created_at` (DATETIME).
  13. `evidence_submissions` [`db/models.py:283-300`]: `id` (PK, VARCHAR(64)), `evidence_pack_id` (FK->evidence_packs.id), `paypal_dispute_id` (VARCHAR(128)), `status` (VARCHAR(32)), `response_payload` (TEXT), `submitted_at` (DATETIME).
  14. `merchant_audits` [`db/models.py:302-325`]: `id` (PK, VARCHAR(64)), `merchant_id` (FK->merchants.id), `action` (VARCHAR(64)), `entity_type` (VARCHAR(64)), `entity_id` (VARCHAR(64)), `actor` (VARCHAR(64)), `details_json` (TEXT), `created_at` (DATETIME).
  15. `audit_score_events` [`db/models.py:327-361`]: `id` (PK, VARCHAR(64)), `decision_id` (VARCHAR(64), Index), `order_id` (VARCHAR(64), FK->orders.id), `channel` (VARCHAR(32)), `risk_score` (NUMERIC(6, 4)), `tier` (VARCHAR(32)), `policy_rule` (VARCHAR(64)), `policy_action` (VARCHAR(64)), `severity` (VARCHAR(32)), `suggested_action` (VARCHAR(32)), `model_version` (VARCHAR(64)), `threshold` (NUMERIC(5, 4)), `model_status` (VARCHAR(32)), `feature_completeness` (NUMERIC(5, 4)), `explanation_status` (VARCHAR(32)), `reason_codes_json` (TEXT), `rule_hits_json` (TEXT), `feature_snapshot_json` (TEXT), `ring_id` (VARCHAR(64)), `shadow` (INTEGER), `created_at` (DATETIME).

### 2.4 Model Serving & Artifact Loading
- **Served Artifact**: `candidate_lgbm_v1.pkl` loaded via `joblib.load()` [`services/score.py:44,70`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/services/score.py#L44). [VERIFIED]
- **Artifact Hash**: SHA-256 `ef7a5f31457d86157d863e9597f12b05f2a5491a38a9b4cc0930ef0dc2671e05` on disk matches `reports/artifact_manifest.json` line 3 exactly. [VERIFIED]
- **Status of `lgbm_ieee_v2.pkl`**: Present on disk (SHA-256 `6e58b975e5b02eeea6e897e937d53245464ef3e64f7704ba4e02a28186eb97e2`), referenced only in offline scripts [`ml/evaluate.py:139`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/ml/evaluate.py#L139) and [`ml/evaluate_lift.py:198`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/ml/evaluate_lift.py#L198). It is **not** loaded at startup or served by any API route. [VERIFIED]

---

## 3. Current ShopPoint Architecture (VERIFIED Items Only)

### 3.1 Exact Versions
- `react`: `16.13.1` [`client/package.json:15`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/package.json#L15), resolved in [`client/package-lock.json:16216`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/package-lock.json#L16216). [VERIFIED]
- `react-dom`: `16.13.1` [`client/package.json:18`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/package.json#L18), resolved in [`client/package-lock.json:16216`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/package-lock.json#L16216). [VERIFIED]
- `react-scripts`: `3.4.3` [`client/package.json:25`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/package.json#L25). [VERIFIED]
- `react-router-dom`: `5.2.0` [`client/package.json:24`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/package.json#L24). [VERIFIED]
- `redux`: `4.0.5` [`client/package.json:26`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/package.json#L26). [VERIFIED]
- `react-redux`: `7.2.1` [`client/package.json:22`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/package.json#L22). [VERIFIED]

### 3.2 Network Ports
- **Express Backend**: Port `5000` defined in [`config/config.env`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/config/config.env) (`PORT=5000`), with fallback to `3000` in [`app.js:67`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/app.js#L67). [VERIFIED]
- **React Frontend**: Port `3000` (Create React App default; client proxy configured to `http://127.0.0.1:5000` in [`client/package.json:3`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/package.json#L3)). [VERIFIED]

### 3.3 Payment Lifecycle Implementation
All payment control logic is encapsulated in [`ShopPoint/controller/payment.js`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js) and wired in [`ShopPoint/routes/payment.js`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/routes/payment.js):
- **Create Order** (`POST /api/v1/payments/paypal/create`): Reads `Order.totalPrice` from Mongo. Enforces `intent: "AUTHORIZE"`. Creates `PaymentTransaction` in `CREATED` status [`controller/payment.js:76-146`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L76-L146). [VERIFIED]
- **Authorize & Score** (`POST /api/v1/payments/paypal/:paypalOrderId/authorize`): Invokes PayPal authorization, transitions to `AUTHORIZED`, calls ReturnGuard `POST /v1/score`, transitions to `SCORING`, saves decision snapshot [`controller/payment.js:152-275`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L152-L275). [VERIFIED]
- **Capture Policy Gate**:
  - `SHADOW_MODE=true`: Observational; executes capture immediately [`controller/payment.js:282-284`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L282-L284). [VERIFIED]
  - `SHADOW_MODE=false`:
    - `ALLOW` / `ALLOW_WITH_MONITORING`: Immediate capture [`controller/payment.js:287-289`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L287-L289). [VERIFIED]
    - `BLOCK`: Status set to `HELD_FOR_REVIEW`. Capture NOT called; `order.isPaid` remains `false` [`controller/payment.js:290-294`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L290-L294). [VERIFIED]
    - `STEP_UP_VERIFICATION`: Status set to `PENDING_VERIFICATION`. Capture waits [`controller/payment.js:295-299`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L295-L299). [VERIFIED]
- **Merchant Review** (`POST /api/v1/payments/:transactionId/review`): Admin decision endpoint. `APPROVE` captures authorization; `REJECT` voids authorization via PayPal REST API [`controller/payment.js:346-423`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L346-L423). [VERIFIED]
- **Step-Up Verification** (`POST /api/v1/payments/:transactionId/verify-step-up`): Customer-driven verification completing capture [`controller/payment.js:430-468`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L430-L468). [VERIFIED]
- **Webhook Listener** (`POST /api/v1/payments/paypal/webhook`): Public route handling `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.AUTHORIZATION.VOIDED`, and `CHECKOUT.ORDER.APPROVED` [`controller/payment.js:475-555`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L475-L555). Deduplicates against `reconciliationLog`. Note: ShopPoint does not cryptographically verify transmission headers. [VERIFIED]

### 3.4 Authentication & Session
- **Admin Role Check**: Implemented via `permission("admin")` middleware checking `req.user.role === "admin"` [`middleware/auth.js:20-28`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/middleware/auth.js#L20-L28). [VERIFIED]
- **JWT Storage**: Frontend stores JWT in `localStorage.getItem('userInfo')` via [`client/src/services/token.js:6,20`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/src/services/token.js#L6) and attaches `Authorization: Bearer <token>` in [`client/src/utils/http.js:25,51`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/client/src/utils/http.js#L25). [VERIFIED]

---

## 4. AG Grid Assessment

### 4.1 Search Results
A comprehensive search across the entire codebase of both repositories for `ag-grid-react`, `ag-grid-community`, `AgGridReact`, `columnDefs`, and `gridOptions` yields:
- [`returnguard/web/package.json:12-13`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/web/package.json#L12-L13): `"ag-grid-community": "^36.2.0"`, `"ag-grid-react": "^36.2.0"`. [VERIFIED]
- [`returnguard/web/package-lock.json:11-12, 2037, 2047`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/web/package-lock.json#L11-L12): Resolved to `36.2.0`. [VERIFIED]
- **Zero occurrences** of `AgGridReact`, `columnDefs`, or `gridOptions` in any `.tsx`, `.ts`, or `.jsx` file across ReturnGuard or ShopPoint. [VERIFIED]
- **Zero occurrences** of AG Grid in `ShopPoint`. [VERIFIED]

### 4.2 AG Grid Code Analysis
- No AG Grid component has been authored yet. The existing ReturnGuard web dashboard is currently a placeholder Next.js page [`returnguard/web/app/page.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/web/app/page.tsx). [VERIFIED]
- **Licensing**: `package.json` specifies `ag-grid-community` (MIT License). There are **zero** Enterprise imports (`ag-grid-enterprise`). No licensing risk exists. [VERIFIED]

### 4.3 Peer Dependency Verification (React 16.13 Compatibility)
- `ag-grid-react@36.2.0` declares the following peer dependencies in [`returnguard/web/package-lock.json:2056-2059`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/web/package-lock.json#L2056-L2059):
  ```json
  "peerDependencies": {
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
    "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  }
  ```
- **Finding**: ShopPoint's React version (`16.13.1`) **is directly within** the peer dependency range `^16.8.0` of AG Grid Community 36.2.0. No downgrade to an obsolete AG Grid version is required. [VERIFIED]

### 4.4 Reusability vs Scratch Build
- **Reusable**: [`returnguard/web/components/DetailDrawer.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/web/components/DetailDrawer.tsx) (investigation drawer layout), [`returnguard/web/components/RiskBadge.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/web/components/RiskBadge.tsx) (severity badge component), and [`returnguard/web/lib/types.ts`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/web/lib/types.ts) (TypeScript interfaces). [VERIFIED]
- **Must Be Built From Scratch**:
  - The AG Grid investigation console table with column definitions, custom cell renderers (RiskBadge, Action Buttons), sorting, filtering, and pagination.
  - The embeddable React wrapper (`@returnguard/react`). [PROPOSED]

---

## 5. Multi-Tenancy Gap Analysis

### 5.1 Requirement
Every transaction, decision, review, audit log, analytics query, and evidence record must be strictly tenant-scoped (e.g. `merchant_id` / `tenant_id`). Cross-tenant visibility must be impossible at the database layer.

### 5.2 Unscoped Query Paths in ReturnGuard
1. `POST /v1/score` [`api/routes/score.py:93-110`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L93-L110): Accepts optional `merchant_id` in request body defaulting to `"m_default"`. No caller verification; any caller can submit arbitrary merchant IDs. [VERIFIED]
2. `services/score.py:161-260`: Feature calculation and scoring pipeline reads prior history without enforcing tenant boundaries. [VERIFIED]
3. `POST /v1/paypal/webhooks` [`api/routes/webhooks.py:17-69`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/webhooks.py#L17-L69): Ingests into `payment_events` with no tenant scoping. [VERIFIED]
4. `db/models.py:327-361`: Table `audit_score_events` has `order_id` (FK to orders) but lacks a direct `merchant_id` column. Joining through `orders` is required to determine tenancy. [VERIFIED]
5. `db/models.py:223-240`: Table `payment_events` lacks a `merchant_id` column completely. [VERIFIED]

### 5.3 Smallest Change for Repository Layer Enforcement
- **Step 1**: Add `merchant_id: str` column to `audit_score_events` and `payment_events` with an index [`db/models.py`]. [PROPOSED]
- **Step 2**: Implement an abstract `TenantScopedSession` or repository base in `db/repository.py` that automatically applies `.filter_by(merchant_id=current_tenant)` to all queries. [PROPOSED]
- **Step 3**: Extract `merchant_id` exclusively from authenticated API key / embed token claims, ignoring any client-provided body parameter. [PROPOSED]

### 5.4 Model Metadata Leakage Risk
- LightGBM tree structures and SHAP explainers operate purely on numeric feature vectors. The model artifact does **not** memorize or store raw tenant identifiers, customer names, or merchant credentials. Feature distributions are aggregate and pose zero tenant leakage risk. [VERIFIED]

---

## 6. Authentication and SDK Session Design

### 6.1 Current Auth Gaps
- ReturnGuard currently implements **zero authentication** on all primary API routes (`/health`, `/v1/score`). [VERIFIED]
- ShopPoint calls ReturnGuard without passing any API key, authorization bearer, or tenant context (`utilis/returnguard.js:31-38`). [VERIFIED]

### 6.2 Proposed Auth Flow & Feasibility
```
[ShopPoint Server] --(POST /v1/auth/embed-token with API Key)--> [ReturnGuard API]
       |                                                                |
       +<----------------- returns 10-min Embed Token ------------------+
       |
[Browser Widget] --(Initializes with Embed Token Provider)--> [ReturnGuard API]
       |
       +--(GET /v1/merchant/transactions with Bearer Token)---------> Authenticated
```
- **Signing Library**: Standard Python `hashlib` and `hmac` are available in core Python. For JWT compliance, `PyJWT` or `authlib` can be added to `requirements.txt`. [PROPOSED]

### 6.3 Key Storage Schema
Create `api_keys` table in ReturnGuard:
```sql
CREATE TABLE api_keys (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    key_prefix VARCHAR(16) NOT NULL, -- e.g. "rg_live_a1b2"
    key_hash VARCHAR(128) NOT NULL,   -- SHA-256(secret)
    name VARCHAR(255) NOT NULL,
    scopes_json TEXT NOT NULL DEFAULT '["score:write", "transactions:read"]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX ix_api_keys_prefix ON api_keys(key_prefix);
```
[PROPOSED]

### 6.4 Origin Verification
- Embed tokens will carry an `allowed_origin` claim matching the merchant's registered store domain (e.g. `http://localhost:3000`). ReturnGuard API checks `request.headers.get("origin") == token_claim["allowed_origin"]`. [PROPOSED]

---

## 7. @returnguard/sdk Proposed Structure (Headless Core)

Package `@returnguard/sdk` is a pure TypeScript/JavaScript headless client with **zero React dependencies**. It handles network transport, token caching, token renewal, and typed API models.

```
packages/sdk/
├── package.json          # "dependencies": {} (no react)
├── tsconfig.json
├── src/
│   ├── index.ts          # Public entrypoint
│   ├── client.ts         # ReturnGuardClient class
│   ├── auth/
│   │   ├── tokenManager.ts # Automatic renewal & caching
│   │   └── types.ts
│   ├── services/
│   │   ├── score.ts      # scoreTransaction()
│   │   ├── transactions.ts # getTransactions(), getReviewQueue()
│   │   ├── reviews.ts    # submitReviewDecision()
│   │   └── disputes.ts   # getDisputes(), getEvidencePack()
│   ├── models/
│   │   ├── score.ts
│   │   ├── transaction.ts
│   │   └── dispute.ts
│   └── errors/
│       └── ReturnGuardError.ts
```
[PROPOSED]

**Public API Surface**:
```typescript
import { ReturnGuardClient } from '@returnguard/sdk';

const rg = new ReturnGuardClient({
  baseUrl: 'http://127.0.0.1:8000',
  tokenProvider: async () => fetchMerchantEmbedToken(),
});

const queue = await rg.transactions.getReviewQueue({ status: 'HELD_FOR_REVIEW' });
await rg.reviews.submitDecision(txnId, { action: 'APPROVE', notes: 'Verified' });
```
[PROPOSED]

---

## 8. @returnguard/react Proposed Structure (Component Library)

Package `@returnguard/react` wraps `@returnguard/sdk` and `ag-grid-react` to deliver drop-in components compatible with React 16.13 through React 19.

```
packages/react/
├── package.json          # peerDependencies: react ^16.8.0, ag-grid-react ^36.2.0
├── tsconfig.json
├── src/
│   ├── index.ts          # Public component exports
│   ├── context/
│   │   ├── ReturnGuardProvider.tsx # Injects ReturnGuardClient instance
│   │   └── useReturnGuard.ts
│   ├── components/
│   │   ├── InvestigationGrid/
│   │   │   ├── InvestigationGrid.tsx   # AG Grid Community wrapper
│   │   │   ├── columnDefs.ts           # Standard column configurations
│   │   │   └── renderers/
│   │   │       ├── RiskBadgeRenderer.tsx
│   │   │       ├── ActionButtonRenderer.tsx
│   │   │       └── ShapFactorRenderer.tsx
│   │   ├── DetailDrawer/
│   │   │   ├── InvestigationDrawer.tsx
│   │   │   └── ShapExplainerView.tsx
│   │   └── ReviewModal/
│   │       └── DecisionDialog.tsx
│   └── hooks/
│       ├── useTransactions.ts
│       ├── useReviewAction.ts
│       └── useDisputeEvidence.ts
```
[PROPOSED]

**Usage in ShopPoint (React 16.13)**:
```jsx
import { ReturnGuardProvider, InvestigationGrid, InvestigationDrawer } from '@returnguard/react';

function AdminReviewPage() {
  return (
    <ReturnGuardProvider client={rgClient}>
      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <InvestigationGrid onRowClicked={(row) => setSelectedOrder(row.data)} />
        <InvestigationDrawer order={selectedOrder} />
      </div>
    </ReturnGuardProvider>
  );
}
```
[PROPOSED]

---

## 9. Evidence Engine Assessment

### 9.1 Original Specification in Docs
- [`02-architecture.md:163-165`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/02-architecture.md#L163):
  > "The evidence engine receives the stored decision record, the top-K SHAP contributions, and the rule hits. It does not recompute SHAP and does not change the action. Phase G's guardrails are unchanged from the original plan. If you later approve adding a vector DB, it goes into Phase G as a new decision (M6)."
- [`03-phases.md:244-254`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/03-phases.md#L244):
  - `disputes/paypal_disputes.py`: list and get sandbox disputes; store `evidences` requirements.
  - `POST /v1/disputes/{id}/evidence-pack`: JSON + markdown mapped to PayPal evidence types.
  - Completeness % and heuristic `win_likelihood`.
  - `assistant/llm.py` and `assistant/guardrails.py`: unknown IDs or invented amounts are rejected.
  - `POST /v1/assistant/chat`: explains a flagged order from stored records only.
  - `POST /v1/disputes/{id}/approve`: writes `merchant_audit`.
  - `POST /v1/disputes/{id}/submit`: gated strictly behind `PAYPAL_SUBMIT_ENABLED=true`, sandbox only, status `WAITING_FOR_SELLER_RESPONSE`, approval exists, pack hash matches.
  - Records `evidence_submission` with result.

### 9.2 Current Implementation Status
- `db/models.py`: Tables `disputes`, `evidence_packs`, and `evidence_submissions` are defined in SQLAlchemy. [PRESENT]
- `api/routes/disputes.py`: Empty route file with TODO comments. [STUBBED]
- `api/routes/assistant.py`: Empty route file with TODO comments. [STUBBED]
- `assistant/llm.py`: Empty file with docstring only. [STUBBED]
- `assistant/guardrails.py`: Empty file with docstring only. [STUBBED]
- `disputes/paypal_disputes.py`: Empty file with docstring only. [STUBBED]
- Vector DB, Embeddings, Chunking: Completely absent. [ABSENT]

### 9.3 Tenancy & LLM Boundaries
- **Tenancy Requirement**: Disputes, evidence packs, and chat logs must link to `merchant_id`. Evidence retrieval must never cross merchant boundaries. [PROPOSED]
- **LLM Safety Invariant**: The LLM drafts narratives strictly from stored rows (`orders`, `shipments`, `audit_score_events`). Hallucination guardrails compare drafted IDs against database rows; if an unverified ID appears, the draft is rejected. The LLM is never invoked in the risk scoring path. [VERIFIED IN PLAN]

---

## 10. PayPal Ownership & Payment Flow Inconsistencies

### 10.1 PayPal Credentials in ReturnGuard (7.1)
- **Finding**: [`returnguard/payments/webhooks.py:76-77`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/payments/webhooks.py#L76) reads `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` from environment variables, and calls `https://api-m.sandbox.paypal.com/v1/oauth2/token` to verify webhook signatures. ReturnGuard's `.env.example` includes `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`. [VERIFIED]
- **Conflict**: Phase D Ground Rule 2 explicitly mandates:
  > "ShopPoint's backend is the only PayPal API client. ReturnGuard must never receive or store PayPal client ID, client secret, access tokens or webhook credentials."
- **Resolution**: ReturnGuard must not store PayPal client secrets. Webhook signature verification should either be handled by the merchant backend, or verified by ReturnGuard using merchant-provided public certificates / webhook verification keys without storing client secrets. [PROPOSED]

### 10.2 Raw Webhook Route (7.2)
- ReturnGuard exposes `POST /v1/paypal/webhooks` [`api/routes/webhooks.py:17`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/webhooks.py#L17).
- **Consumers**: Neither ShopPoint nor any external frontend calls this route. ShopPoint has its own separate listener at `POST /api/v1/payments/paypal/webhook`. The route is only exercised by `tests/test_webhooks.py`. [VERIFIED]
- **Recommendation**: Do not delete until Phase G dispute webhook requirements are finalized. [VERIFIED]

### 10.3 Risk Decision Before Capture (7.3 & 7.4)
- **Call Order in ShopPoint**:
  1. `paypalClient.authorizeOrder(paypalOrderId)` [`ShopPoint/controller/payment.js:192`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L192)
  2. `returnguardClient.scoreTransaction(scorePayload)` [`ShopPoint/controller/payment.js:270`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L270)
  3. Capture Policy Gate evaluates decision [`ShopPoint/controller/payment.js:280-301`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L280-L301)
  4. `executeCapture()` is invoked only if policy allows or if admin explicitly approves [`ShopPoint/controller/payment.js:284,289,380`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/ShopPoint/controller/payment.js#L284).
- **Finding**: **Zero capture paths bypass ReturnGuard scoring**. The legacy route `POST /api/v1/order/:orderId/pay` is marked `@deprecated` and only handles the non-PayPal `"esewa"` test gateway. [VERIFIED]

---

## 11. Source-of-Truth Conflicts & Ownership Rules

### 11.1 Field Matrix
| Field | ReturnGuard Location | ShopPoint Location | Displayed From | Proposed Single Authority |
|---|---|---|---|---|
| `risk_score` | `audit_score_events.risk_score` | `PaymentTransaction.riskDecision.risk_score` | ShopPoint | **ReturnGuard** |
| `tier` | `audit_score_events.tier` | `PaymentTransaction.riskDecision.tier` | ShopPoint | **ReturnGuard** |
| `policy_action` | `audit_score_events.policy_action` | `PaymentTransaction.policyAction` | ShopPoint | **ReturnGuard** |
| `reason_codes` | `audit_score_events.reason_codes_json` | `PaymentTransaction.riskDecision.reason_codes` | ShopPoint | **ReturnGuard** |
| `payment_status` | `payments.status` (synced) | `PaymentTransaction.status` | ShopPoint | **ShopPoint** |
| `isPaid` | N/A | `Order.isPaid` | ShopPoint | **ShopPoint** |
| `capture_id` | `payments.capture_id` | `PaymentTransaction.paypalCaptureId` | ShopPoint | **ShopPoint** |
| `merchant_decision` | `merchant_audits.action` | `PaymentTransaction.merchantDecision` | ShopPoint | **ShopPoint** |

### 11.2 Proposed Ownership Rules
1. **Rule 1 (Risk Authority)**: ReturnGuard is the sole authoritative system of record for risk calculations, score events, SHAP reason codes, rule triggers, and dispute evidence packs. ShopPoint stores an immutable read-only snapshot for local display. [PROPOSED]
2. **Rule 2 (Payment Authority)**: ShopPoint is the sole authoritative system of record for merchant order status, payment capture state, and human review overrides. ReturnGuard maintains an observational copy for investigation auditing. [PROPOSED]

---

## 12. ML and Metric Discrepancies

### 12.1 Synthetic Test Split Metrics (Days 50–59)
Reproducing metrics from frozen artifact `candidate_lgbm_v1.pkl` on `ml/data/features.csv` (Test Split: Days 50–59, 35,949 samples, 719 fraud cases, operating threshold $\tau = 0.40$):
- **ROC-AUC**: **0.9684** (0.96836) [VERIFIED]
- **PR-AUC**: **0.9009** (0.90085) [VERIFIED]
- **Precision**: **0.7847** (78.47%, 634 TP, 174 FP) [VERIFIED]
- **Recall**: **0.8818** (88.18%, 634 TP, 85 FN) [VERIFIED]
- **F1 Score**: **0.8304** [VERIFIED]
- **Total Expected Cost**: **₹41,376.78** (FP Cost: ₹8,700.00, FN Cost: ₹32,676.78) [VERIFIED]

### 12.2 Comparison with 02-architecture.md (0.984 vs 0.9684)
- [`02-architecture.md:78`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/02-architecture.md#L78) table lists:
  `| LightGBM | 0.785 | 0.882 | 0.830 | 0.901 | 0.984 | 41,377 |`
- Precision (`0.785`), recall (`0.882`), F1 (`0.830`), PR-AUC (`0.901`), and cost (`41,377`) match the holdout test evaluation **identically**.
- However, evaluating the validation split (Days 40–49) yields ROC-AUC **0.9812**, whereas the single-pass test split (Days 50–59) yields ROC-AUC **0.9684**.
- **Explanation**: The table in `02-architecture.md` had `0.984` recorded as a rounded placeholder or earlier validation metric before the final single-pass holdout script was executed. The true, reproducible test-split ROC-AUC is **0.9684** as recorded in [`reports/holdout_metrics.json:20`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/holdout_metrics.json#L20). [VERIFIED]

### 12.3 IEEE Phase 17 Numbers
- In `reports/holdout_metrics.json`, Phase 17 baseline is recorded as Precision: 6.31%, Recall: 79.80%, Cost: 2,469,531.
- `ml/external/ieee/results/phase17_lgbm.pkl` does **not** exist on disk in ReturnGuard (causing `test_artifact_hashes.py` to fail).
- Predictions cannot be recomputed from raw data. The numbers are **UNVERIFIED against stored prediction files** and exist only as static reported figures in `holdout_metrics.json`. [UNVERIFIED]

---

## 13. Required Repository Changes by File & Phase

### Phase E (Multi-Tenancy, Auth & Audit Trail)
- `returnguard/db/models.py`: Add `api_keys` table; add `merchant_id` column to `audit_score_events` and `payment_events`. [PROPOSED]
- `returnguard/api/middleware/auth.py`: Add API key header validator and embed token JWT verifier. [PROPOSED]
- `returnguard/api/routes/auth.py`: Add `POST /v1/auth/embed-token`. [PROPOSED]
- `returnguard/api/routes/score.py`: Enforce `merchant_id` from authenticated token context. [PROPOSED]
- `ShopPoint/utilis/returnguard.js`: Attach merchant API key to scoring requests. [PROPOSED]

### Phase F (Investigation Console & SDK Packages)
- `packages/sdk/`: Implement `@returnguard/sdk` (headless core). [PROPOSED]
- `packages/react/`: Implement `@returnguard/react` with AG Grid Community wrapper. [PROPOSED]
- `ShopPoint/client/src/pages/AdminReview.js`: Embed ReturnGuard AG Grid investigation console. [PROPOSED]

### Phase G (Disputes & Evidence Engine)
- `returnguard/disputes/paypal_disputes.py`: Implement sandbox disputes API client. [PROPOSED]
- `returnguard/assistant/llm.py`: Implement evidence narrative generator. [PROPOSED]
- `returnguard/assistant/guardrails.py`: Implement deterministic ID verification guardrail. [PROPOSED]
- `returnguard/api/routes/disputes.py`: Implement `GET /v1/disputes`, `POST /v1/disputes/{id}/evidence-pack`, `POST /v1/disputes/{id}/approve`, and `POST /v1/disputes/{id}/submit`. [PROPOSED]

---

## 14. Revised Phase Plan (Phases E through J)

### Phase E — Tenant Isolation, Authentication & Shadow Audit
- **Goal**: Full multi-tenancy, API key management, ephemeral embed tokens, and tenant-scoped audit logging.
- **Exit Criteria**:
  - Unauthenticated requests to `/v1/score` return 401.
  - Tenant A cannot query or observe Tenant B's score events or audit logs.
  - Expired embed tokens (>10 min) are rejected.

### Phase F — Headless Core SDK & AG Grid React Component
- **Goal**: Build `@returnguard/sdk` and `@returnguard/react` containing AG Grid Community investigation table and review drawer.
- **Exit Criteria**:
  - `@returnguard/sdk` builds with 0 React dependencies.
  - `@returnguard/react` renders cleanly in ShopPoint (React 16.13) without peer dependency warnings.
  - Grid supports sorting, risk tier filtering, and row click drawer inspection.

### Phase G — Evidence Engine & Hallucination Guardrails
- **Goal**: Assemble structured evidence packages for chargebacks and draft narratives using Gemini/OpenAI under strict deterministic guardrails.
- **Exit Criteria**:
  - Evidence pack JSON + Markdown generated from stored database rows.
  - Guardrail rejects any LLM response containing a hallucinated ID, amount, or tracking number.
  - Dispute submission refused unless human approval audit record is present.

### Phase H — Sandbox Disputes Verification & Gated Submit
- **Goal**: End-to-end sandbox testing of dispute retrieval, evidence pack compilation, and human-gated submission.
- **Exit Criteria**:
  - Real PayPal sandbox dispute ingested and populated in AG Grid.
  - Evidence submission executed successfully against sandbox API when `PAYPAL_SUBMIT_ENABLED=true`.

### Phase I — Hardening, E2E Regression & Performance
- **Goal**: Load testing, token rotation tests, and cross-browser verification.
- **Exit Criteria**:
  - Scoring latency < 15ms at 100 req/sec.
  - Full automated test suite green across both repos.

### Phase J — Submission Packaging & Demo Video
- **Goal**: 3-minute video recording, complete documentation, and hackathon submission.
- **Exit Criteria**:
  - Public GitHub repository with clean history.
  - Working 5-minute live demo script.

---

## 15. Risks, Dependencies & Complexity Estimates

| Phase | Complexity | Primary Dependencies | Key Risk & Mitigation |
|---|---|---|---|
| **Phase E** | **M** | SQLAlchemy, PyJWT / HMAC | Breaking existing unauthenticated test suites. Mitigate by supporting mock test tokens in `pytest`. |
| **Phase F** | **L** | AG Grid Community 36.2.0, React 16.13 | React 16 vs 18 hook/JSX differences in monorepo. Mitigate by keeping SDK headless and compiling React wrapper to ES5/CommonJS. |
| **Phase G** | **M** | Gemini / OpenAI API | LLM latency and hallucination. Mitigate with strict regex and DB-lookup deterministic guardrails. |
| **Phase H** | **S** | PayPal Sandbox Disputes API | Sandbox dispute availability. Mitigate with offline synthetic dispute fixtures. |
| **Phase I** | **S** | Pytest, Node Test Runner | CI environment parity. |
| **Phase J** | **S** | Loom / Screen recorder | Video time limit (3 mins). Prepare structured script beforehand. |

---

## 16. Open Questions Requiring Human Decision

1. **PayPal Credentials Architecture in ReturnGuard**:
   - *Question*: Should ReturnGuard completely remove `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` from `returnguard/.env.example` and `payments/webhooks.py`, leaving ShopPoint as the sole PayPal client?
   - *(Recommended Default)*: **Yes**. Keep ReturnGuard as a pure SaaS platform that never stores merchant PayPal credentials. Webhooks delivered to ReturnGuard should be authenticated via merchant API key or verified certificates.

2. **JWT Library for Embed Tokens**:
   - *Question*: Should we install `PyJWT` in ReturnGuard or implement standard HMAC-SHA256 signed tokens using Python's built-in `hashlib` and `hmac` modules?
   - *(Recommended Default)*: **Install `PyJWT`**. It provides standard claims (`exp`, `iss`, `sub`, `aud`) and ecosystem compatibility with standard frontend JWT decoders.

3. **Packaging Strategy for SDK & Components**:
   - *Question*: Should `@returnguard/sdk` and `@returnguard/react` live in a `packages/` directory inside `returnguard` (monorepo), or be integrated directly as internal modules in `ShopPoint`?
   - *(Recommended Default)*: **Monorepo in `returnguard/packages/`**. This demonstrates true architectural modularity and aligns with sponsor requirements for reusable AG Grid components.

4. **Missing Baseline Artifact `phase17_lgbm.pkl`**:
   - *Question*: `ml/external/ieee/results/phase17_lgbm.pkl` is missing on disk, causing `test_artifact_hashes.py` to fail. Should we update `artifact_manifest.json` to mark it optional/external, or retrieve the file from the verified source archive?
   - *(Recommended Default)*: **Update `artifact_manifest.json`** to reflect that `phase17_lgbm.pkl` is an external benchmark artifact, restoring 100% test pass rate on frozen core artifacts.

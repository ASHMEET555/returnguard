# ReturnGuard Landing & Onboarding Preflight Report

**Date**: 2026-11-11  
**Branch**: `landing/onboarding`  
**Base Commit**: `08b63e0` ("Merge branch 'feat/redesign-stripe-linear'")

---

## 1. Web Application Routes & `/` Mapping

### Current Routes in `web/app`:
- `/`: Currently renders `Home` (`web/app/page.tsx`), which renders `<ReturnGuardDashboard />` directly in client-side mode with mock/URL parameter tokens (`rg_embed_test_token`).
- `/investigations`: Renders `InvestigationsRoute` (`web/app/investigations/page.tsx`), wrapping `<InvestigationsPage />` in `<DashboardShell>` under `@returnguard/react`.

### Target Route Architecture for Onboarding:
- `/`: Becomes the public product landing page showcasing value proposition, technical architecture, models & metrics, security model, and interactive preview CTA.
- `/dashboard`: Existing full merchant dashboard moves here from `/` to keep production operational views intact without breaking any active links.
- `/settings`: Operator & merchant key management workspace (admin session authentication, API key generation with one-time reveal, key revocation, key rotation).
- `/docs/integrate`: Integration instructions, SDK download (`/downloads/returnguard-sdk.tgz`), SHA-256 verification, and verified server/browser code snippets.

---

## 2. Next.js and React Versions & Compatibility Analysis

### Installed Versions in Workspace:
- `web/package.json`:
  - `next`: `16.4.3` (App Router, webpack build)
  - `react`: `19.3.0`
  - `react-dom`: `19.3.0`
  - `ag-grid-community`: `^36.2.0`
  - `ag-grid-react`: `^36.2.0`
- `packages/react/package.json`:
  - `peerDependencies`: `react`: `>=16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`
  - `peerDependencies`: `react-dom`: `>=16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`
  - `devDependencies`: `react`: `^19.3.0`, `react-dom`: `^19.3.0`
- `packages/sdk/package.json`:
  - Framework agnostic (`node: >=20`), TypeScript `5.7.3`.

### Mismatch & Constraint Assessment:
- The brief notes a historical React 16.13 constraint in `packages/react`. In base `08b63e0`, `packages/react` specifies `peerDependencies` of `react: ">=16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"`.
- `web/` executes on Next.js 16.4.3 and React 19.3.0.
- All 140 React tests pass cleanly on Vitest (`react 19.3.0`).
- No version changes are needed or executed in this step.

---

## 3. Database Schema: API Keys & Merchants, Admin Routes

### Existing Tables (`db/models.py`):
1. **`merchants`**:
   - `id`: VARCHAR(64) PK
   - `name`: VARCHAR(255)
   - `email`: VARCHAR(255)
   - `created_at`: DATETIME
2. **`api_keys`**:
   - `id`: VARCHAR(64) PK
   - `merchant_id`: VARCHAR(64) FK (`merchants.id`)
   - `key_prefix`: VARCHAR(32)
   - `key_hash`: VARCHAR(64) (SHA-256 hex string)
   - `name`: VARCHAR(255) (key label)
   - `is_active`: BOOLEAN
   - `created_at`: DATETIME
   - `revoked_at`: DATETIME (nullable)
   - *Missing for full audit*: `last_used_at` (DATETIME, nullable) - will be added additively via schema evolution / migration.

### Admin Routes:
- Currently, **zero** admin authentication routes exist.
- No `/v1/admin/*` endpoints exist in `api/routes/`.
- No admin session cookie mechanism or rate-limited login exists.

---

## 4. SDK Package Metadata & Exports

### Package Details (`packages/sdk`):
- **Name**: `@returnguard/sdk`
- **Version**: `0.1.0`
- **Main / Module / Types**:
  - `main`: `./dist/index.cjs`
  - `module`: `./dist/index.js`
  - `types`: `./dist/index.d.ts`
- **Exports**:
  - `SDK_VERSION`: string constant (`"0.1.0"`)
  - `getVersion()`: returns string
  - `ReturnGuardClient`: core client class with domains `score`, `decisions`, `customers`, `analytics`, `models`, `events`, `reviews`, `investigations`, `transactions`
  - `Transport`: HTTP request transport with HMAC / Bearer auth, retries, and error handling
  - Error classes: `ReturnGuardError`, `AuthenticationError`, `NotFoundError`, `RateLimitError`, `ValidationError`, `APIError`, `NetworkError`
  - Types: Full TypeScript interfaces for requests, responses, models, audit trails, and investigation packs
  - Auth helpers: `tokenProvider` and JWT decoder

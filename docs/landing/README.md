# ReturnGuard Landing & Onboarding System

ReturnGuard is an AI-powered B2B payment-abuse risk engine that classifies post-order fraud, generates cryptographic evidence packets, and automates reviewer workflows.

## Architecture & Routes

| Route | Purpose | Authentication |
|---|---|---|
| `/` | Product landing page (hero, architecture, features, model metrics, security, FAQ) | Public |
| `/dashboard` | Operational console embed (overview, risk analytics, investigations queue) | Role-based embed token (JWT) |
| `/investigations` | Deep reviewer investigation queue and collusion dossier view | Role-based embed token (JWT) |
| `/settings` | Merchant API key management (generate, inspect, rotate, revoke) | Admin session (`rg_admin_session` cookie or `RG_ADMIN_TOKEN`) |
| `/docs/integrate` | Developer SDK guide, local tarball download, and runnable code snippets | Public |
| `/downloads/returnguard-sdk.tgz` | Pre-packaged standalone `@returnguard/sdk` npm tarball | Public |
| `/downloads/returnguard-sdk.tgz.sha256` | SHA-256 integrity checksum for the SDK tarball | Public |

## Running Locally

### 1. Start the ReturnGuard Backend

```bash
# Configure the admin secret (must be >= 32 characters)
export RG_ADMIN_TOKEN="rg_admin_super_secret_token_1234567890_abcdef"

# Run with uvicorn or Docker
uvicorn api.main:app --host 127.0.0.1 --port 8000
```

### 2. Start the Frontend (Next.js 16)

```bash
cd web
npm install
npm run dev --webpack
# Console accessible at http://localhost:3000
```

### 3. Build & Verify Production Bundle

```bash
npm run build --prefix web
python scripts/bundle_check.py
```

### 4. Run End-to-End Test Suite

```bash
cd web
npx playwright test tests/e2e.spec.ts
```

## Security & Architectural Boundaries

1. **Zero Money Movement:** ReturnGuard never calls PayPal, never initiates refunds, and never holds banking or payment gateway credentials.
2. **Merchant Execution:** The merchant's order-management or payment pipeline executes policy recommendations (`ALLOW`, `WARN`, `REVIEW`, `BLOCK`).
3. **Advisory LLM:** All AI summaries are strictly advisory, watermarked `"LLM assessment, advisory"`, and cannot close cases without recorded human reviewer notes.
4. **Zero Key Leakage:** Plaintext keys are shown strictly once upon generation. Only truncated prefixes (`rg_live_ab...`) and SHA-256 hashes are persisted in the database.
5. **Admin Protection:** Constant-time `hmac.compare_digest` verification and sliding-window rate limiting (5 attempts/min, returns 429 Retry-After on 6th).

## Verifiable Model Benchmarks

| Dataset | ROC-AUC | PR-AUC | Precision | Recall | Reproduction Status |
|---|---|---|---|---|---|
| Synthetic Return-Abuse Pipeline | 0.9996 | 0.9999 | 98.60% | 98.58% | CI Verified |
| IEEE CIS Fraud Benchmark | 0.8874 | N/A* | 6.31%* | 79.80% | Reproduced External |

*\*Honest Limits Disclosure: IEEE precision is 6.31% at 79.80% recall — designed as a high-recall filter for manual reviewer queues (~1 fraud per 15 flags), not an automated blocker. IEEE PR-AUC is withheld to prevent misleading claims on skewed distributions.*

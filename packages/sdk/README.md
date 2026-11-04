# @returnguard/sdk

Official TypeScript client for the ReturnGuard Risk Detection and Dispute Evidence API.

## Features
- **Server and Client Auth Modes**: Server API key (`rg_live_*`, `rg_test_*`) for backend processes; ephemeral embed tokens for frontend apps.
- **Browser Protection**: Automatically refuses server API keys in browser contexts to prevent accidental credential leakage.
- **In-Memory Token Renewal**: `createRenewingTokenProvider` handles JWT decode, expiration checks, and automatic re-authentication without touching disk or persistent web storage.
- **Typed Errors**: Specific subclasses (`ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `RateLimitError`, `ServerError`, `TimeoutError`, `NetworkError`) with error codes, request IDs, and `retryAfterSeconds`.
- **Safe Retries**: Automatic exponential backoff for read operations (`GET`); mutations (`POST /v1/score`, `POST /v1/reviews`) are never retried automatically.
- **Strict ES2017 dual bundle**: Emits ESM (`.js`) and CJS (`.cjs`) with complete TypeScript `.d.ts` declarations. No React dependencies.

## Installation

```bash
npm install @returnguard/sdk
```

## Quick Start (Backend Server)

```typescript
import { ReturnGuardClient } from "@returnguard/sdk";

const client = new ReturnGuardClient({
  baseUrl: "https://api.returnguard.ai",
  apiKey: process.env.RETURN_GUARD_API_KEY, // e.g. rg_live_...
});

// Score a transaction
const score = await client.scoreTransaction({
  order_id: "ord_10293",
  amount: 2499.00,
  channel: "paypal",
  customer_id: "cust_9921",
});

console.log("Risk Score:", score.risk_score_100, score.policy_action);
```

## Quick Start (Frontend / Embed Token)

```typescript
import { ReturnGuardClient, createRenewingTokenProvider } from "@returnguard/sdk";

// Token provider fetches short-lived embed tokens from your backend
const tokenProvider = createRenewingTokenProvider({
  fetchToken: async () => {
    const res = await fetch("/api/returnguard/embed-token");
    const data = await res.json();
    return data.token;
  },
});

const client = new ReturnGuardClient({
  baseUrl: "https://api.returnguard.ai",
  tokenProvider,
});

// Fetch decisions and analytics securely from frontend
const decisions = await client.decisions.list({ limit: 10 });
const analytics = await client.analytics.summary();
```

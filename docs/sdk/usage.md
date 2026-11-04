# ReturnGuard SDK Usage Guide

Comprehensive integration patterns for `@returnguard/sdk`.

---

## 1. Authentication Modes

### Server-to-Server (`apiKey`)
Used in server environments (Node.js, edge workers, cloud functions). Provides full access to risk scoring, relay event ingestion, audit reconstruction, and review operations.

```typescript
import { ReturnGuardClient } from "@returnguard/sdk";

const client = new ReturnGuardClient({
  baseUrl: process.env.RG_API_URL || "https://api.returnguard.ai",
  apiKey: process.env.RG_SERVER_KEY, // rg_live_* or rg_test_*
  timeoutMs: 8000,
});
```

*Note: Passing `apiKey` in a browser environment throws `ConfigurationError`.*

---

### Client-Side App / Embed (`tokenProvider`)
Used in web applications or dashboard integrations (e.g. Next.js, Vite). Only has read and review scopes (`read`, `reviews`), and is strictly forbidden from scoring transactions (`POST /v1/score` returns 401/403).

```typescript
import { ReturnGuardClient, createRenewingTokenProvider } from "@returnguard/sdk";

const tokenProvider = createRenewingTokenProvider({
  fetchToken: async () => {
    // Your merchant backend route that calls POST /v1/auth/embed-tokens
    const res = await fetch("/api/auth/rg-token");
    const json = await res.json();
    return json.token;
  },
  refreshMarginSeconds: 45, // Proactively refresh 45s before JWT exp
});

const client = new ReturnGuardClient({
  baseUrl: "https://api.returnguard.ai",
  tokenProvider,
});
```

---

## 2. Resources & Operations

### Scoring Transactions (Server only)
```typescript
const score = await client.scoreTransaction({
  order_id: "ord_20261104_01",
  amount: 4500.0,
  channel: "paypal",
  customer_id: "cust_781",
  device_id: "dev_9941",
});

if (score.policy_action === "BLOCK") {
  // Flag or hold order
} else if (score.policy_action === "REVIEW") {
  // Queue for merchant inspection
}
```

### Listing & Paginating Decisions
```typescript
// Single page
const page = await client.decisions.list({ limit: 20 });
console.log(page.items, page.next_cursor);

// Automatically iterate all pages
const allDecisions = await client.decisions.listAll({ maxPages: 10, pageSize: 50 });
```

### Retrieving Audit Trails
```typescript
const audit = await client.decisions.audit("decision_id_here");
console.log(audit.data.decision);
console.log(audit.data.policy_trace);
console.log(audit.data.shap_top_k);
```

### Review Queue & Submission
```typescript
// List pending reviews
const reviews = await client.reviews.list({ status: "pending", limit: 25 });

// Submit human decision
await client.reviews.submit({
  decision_id: "dec_123",
  action: "approve", // 'approve' | 'reject' | 'escalate'
  notes: "Customer confirmed identity via SMS",
});
```

### Analytics & Model Performance
```typescript
// Tenant analytics
const stats = await client.analytics.summary();
console.log(stats.allow_count, stats.average_risk_score);

// Transparent model benchmarks
const modelMetrics = await client.models.performance();
console.log("Synthetic AUC-ROC:", modelMetrics.synthetic.auc_roc);
console.log("IEEE-CIS AUC-ROC:", modelMetrics.ieee_cis.auc_roc);
```

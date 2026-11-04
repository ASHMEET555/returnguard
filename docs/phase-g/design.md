# ReturnGuard Phase G — Architecture & Dashboard Blueprint

## 1. Overview
This specification details the architecture for the first 50% milestone of ReturnGuard Phase G. It establishes `@returnguard/react` containing the operational fraud dashboard, primary transactions grid, and sliding detail drawer.

## 2. Component Hierarchy

```text
ReturnGuardProvider (auth/embed token, apiClient, theme context, currency context)
 ├── DashboardShell (responsive layout, sidebar navigation, top header)
 │    ├── DashboardHeader (brand slot, tenant badge, currency select, date picker, search)
 │    ├── DashboardSidebar (compact navigation: Overview, Transactions, Risk Analytics [deferred], etc.)
 │    └── Page Container
 │         ├── OverviewPage
 │         │    ├── KPIStrip (Scored count, Flagged count/rate, High-risk count, Latency)
 │         │    ├── VolumeTrendsCard (Transaction volume & flagged trends over time)
 │         │    ├── DecisionDistributionCard (ALLOW, MONITOR, STEP_UP, BLOCK breakdown)
 │         │    ├── RiskScoreHistogramCard (Distribution by score bands: Low, Medium, High, Critical)
 │         │    └── RecentFlaggedTable (Top flagged decisions awaiting operator review)
 │         │
 │         └── TransactionsPage
 │              ├── TransactionsFilterToolbar (Search, risk band, policy action filter, CSV export)
 │              ├── RiskDecisionGrid (AG Grid Community instance, custom cell renderers)
 │              └── TransactionDetailDrawer (Sliding panel on row selection)
 │                   ├── DrawerHeader (Transaction ID, Risk Score badge, Policy action, close button)
 │                   ├── Section: Summary & Latency
 │                   ├── Section: Why This Was Flagged (SHAP / feature contribution chips)
 │                   ├── Section: Triggered Rules (Rule names, condition summaries, severity)
 │                   ├── Section: Payment & Provider Status (Independent from RG recommendation)
 │                   └── Section: Customer & Velocity Signals (Masked PII, velocity, IP/BIN)
```

## 3. Data Mapping Matrix

| UI Component / Metric | API Endpoint | API Response Fields | Fallback / Unavailable State |
|---|---|---|---|
| **KPI: Total Scored** | `GET /v1/analytics/summary` | `total_transactions` | Render `0` or Skeleton |
| **KPI: Flagged Rate** | `GET /v1/analytics/summary` | `flagged_count`, `flagged_rate` | Display percentage or `--` |
| **KPI: High Risk** | `GET /v1/analytics/summary` | `high_risk_count` | Display integer count |
| **Policy Distribution** | `GET /v1/analytics/summary` | `decisions_breakdown` | Render bar chart / count pill |
| **Transactions Grid** | `GET /v1/decisions?limit=50&cursor=` | `items[]`: `id`, `transaction_id`, `order_id`, `risk_score`, `suggested_action`, `severity`, `amount`, `currency`, `created_at` | Loading overlay, empty state |
| **Drawer: Risk Score** | `GET /v1/decisions/{id}` & `/audit` | `risk_score`, `severity`, `suggested_action` | Badge with numerical score |
| **Drawer: Explanations** | `GET /v1/decisions/{id}/audit` | `explanation.top_factors` / `contributions` | "No explanation features recorded" |
| **Drawer: Rules** | `GET /v1/decisions/{id}/audit` | `rules_evaluated` or rule engine snapshot | "No rules triggered" |
| **Drawer: Payment Outcome** | `GET /v1/decisions/{id}` | `payment_status` / webhook relay state | Distinct "Provider Status: Pending Capture" |

## 4. Prioritised Backend Gap Register

1. **Date Window Aggregation on `/v1/analytics/summary`:** Currently returns lifetime or sliding window summary; date range query params (`from`, `to`) need graceful client fallback when backend returns full set.
2. **Multi-currency Totals:** Backend returns mixed currencies if transactions vary. Frontend will isolate amounts by selected currency and never sum across FX boundaries without confirmed rates.
3. **Dedicated Customer Directory Endpoint:** Backend currently scopes by `merchant_id` and indexes decisions by `transaction_id`/`order_id`. Dedicated customer aggregate queries will be supported via unique customer references in decisions list.

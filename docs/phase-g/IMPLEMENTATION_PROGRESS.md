# ReturnGuard Phase G — Implementation Progress Tracker

**Active Branch:** `feat/redesign-stripe-linear`
**Base Commit:** `db3c6248f725480db73746889441d3eec2e33801` ("Merge pull request #10 from ASHMEET555/phase-g/dashboard")
**Design Direction:** Stripe-level information hierarchy + Linear-level visual restraint
**Audit & Reconciliation Date:** 2026-11-09
**Current Redesign Status:** Active Implementation — Milestone 5.4 Completed & Verified (All 3 Workspaces Complete & Verified)

---

## 1. Original Phase G Functional Scope Breakdown (PR #10 Baseline)

The initial functional baseline for ReturnGuard Phase G was delivered in base commit `db3c6248f725480db73746889441d3eec2e33801`. All 16 foundational items were delivered with their original weights and file evidence preserved intact below:

| ID | Feature / Component | Scope Section | Weight | Baseline Status | Implementation Evidence & File Location |
|---|---|---|---|---|---|
| **G1.1** | Repository & Compatibility Audit | Stage 0 | 4% | COMPLETED | [`docs/phase-g/audit.md`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/docs/phase-g/audit.md) |
| **G1.2** | Architecture & Page Blueprint | Stage 1 | 4% | COMPLETED | [`docs/phase-g/design.md`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/docs/phase-g/design.md) |
| **G1.3** | `@returnguard/react` Scaffold & Provider | 4.A | 7% | COMPLETED | [`packages/react/src/context.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/context.tsx), [`packages/react/test/provider.test.ts`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/test/provider.test.ts) |
| **G1.4** | Typed Adapters & Reusable Hooks | 4.A | 7% | COMPLETED | [`packages/react/src/hooks.ts`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/hooks.ts), [`packages/react/test/exports.test.ts`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/test/exports.test.ts) |
| **G1.5** | Dashboard Shell & Design System | 4.B | 6% | COMPLETED | [`packages/react/src/components/DashboardShell.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/DashboardShell.tsx), [`packages/react/src/styles.css`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/styles.css) |
| **G1.6** | Overview Page & Analytics Widgets | 4.C | 8% | COMPLETED | [`packages/react/src/components/OverviewPage.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/OverviewPage.tsx) |
| **G1.7** | AG Grid Transactions Explorer | 4.D | 8% | COMPLETED | [`packages/react/src/components/TransactionsGrid.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/TransactionsGrid.tsx), [`packages/react/src/components/TransactionsPage.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/TransactionsPage.tsx) |
| **G1.8** | Transaction Sliding Detail Drawer | 4.E | 6% | COMPLETED | [`packages/react/src/components/DetailDrawer.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/DetailDrawer.tsx) |
| **G2.1** | Tenant-Scoped Customer Backend & Directory | Step 1 | 6% | COMPLETED | [`api/routes/customers.py`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/customers.py), [`tests/test_customers_and_trends_api.py`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_customers_and_trends_api.py) |
| **G2.2** | Full Customer Profiles & Behavioural Analytics | Step 2 | 6% | COMPLETED | [`packages/react/src/components/CustomersPage.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/CustomersPage.tsx), [`packages/sdk/src/client.ts`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/sdk/src/client.ts) |
| **G2.3** | Risk Analytics & Portfolio Exposure Page | Step 3 | 10% | COMPLETED | [`api/routes/analytics.py`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/analytics.py), [`packages/react/src/components/RiskAnalyticsPage.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/RiskAnalyticsPage.tsx) |
| **G2.4** | Rules & Detection Management Workspace | Step 4 | 7% | COMPLETED | [`packages/react/src/components/RulesPage.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/RulesPage.tsx) |
| **G2.5** | Model Performance & Benchmark Dashboard | Step 5 | 7% | COMPLETED | [`packages/react/src/components/ModelsPage.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/ModelsPage.tsx) |
| **G2.6** | Payment Pipeline & Processor Lifecycle | Step 6 | 6% | COMPLETED | [`packages/react/src/components/PaymentPipelinePage.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/PaymentPipelinePage.tsx) |
| **G2.7** | Alerts, Reviews, System Activity & Reports | Step 7 | 8% | COMPLETED | [`packages/react/src/components/ReviewsPage.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/ReviewsPage.tsx), [`packages/react/src/components/ReportsPage.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/ReportsPage.tsx) |
| **G2.8** | Full Multi-Tab Dashboard Integration | Step 7 | 5% | COMPLETED | [`packages/react/src/components/ReturnGuardDashboard.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/src/components/ReturnGuardDashboard.tsx), [`web/app/page.tsx`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/web/app/page.tsx) |

- **Original Phase G Baseline Milestone 1 (G1.1–G1.8):** **50.0%** (Delivered in base commit `db3c6248f725480db73746889441d3eec2e33801`)
- **Original Phase G Baseline Milestone 2 (G2.1–G2.8):** **50.0%** (Delivered in base commit `db3c6248f725480db73746889441d3eec2e33801`)
- **Original Functional Foundation Delivery:** **100.0%**

---

## 2. Phase G Stripe + Linear Redesign Roadmap Status (`docs/REDESIGN_PLAN.md`)

Following delivery of the original functional scaffold, the project initiated the **Stripe + Linear Visual Redesign** on isolated branch `feat/redesign-stripe-linear`. The redesign is executed strictly milestone-by-milestone:

| Redesign Milestone | Workspace / Target Area | Status | Verification & Deliverables |
|---|---|---|---|
| **Milestone 1** | Design Foundation & SVG Infrastructure | **APPROVED** | Semantic CSS design tokens in `styles.css`, zero global tag pollution, initial SVG icon primitives. |
| **Milestone 2** | Application Shell & Global Navigation | **APPROVED** | [`MILESTONE_2_REPORT.md`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/docs/MILESTONE_2_REPORT.md); 9 SVG navigation line icons (zero emojis), 56px topbar, responsive mobile drawer. |
| **Milestone 3** | Shared Components & Detail Drawer | **APPROVED** | [`MILESTONE_3_REPORT.md`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/docs/MILESTONE_3_REPORT.md); WAI-ARIA accessible `DetailDrawer` (`role="dialog"`, `aria-modal="true"`, focus trap, ESC close, focus return), refined `RiskBadge`. |
| **Milestone 4** | AG Grid Visual Refinement (v36) | **APPROVED** | [`MILESTONE_4_REPORT.md`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/docs/MILESTONE_4_REPORT.md); Linear Alpine skin, 40px headers, 44px rows, pinned Order ID divider, 100% grid capabilities preserved. |
| **Milestone 5.1** | Overview & Risk Analytics Workspaces | **APPROVED** | [`MILESTONE_5_1_REPORT.md`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/docs/MILESTONE_5_1_REPORT.md); 4 KPI cards, native CSS risk band histogram, daily volume table, zero third-party chart dependencies. |
| **Milestone 5.2** | Customer Risk Directory Workspace | **APPROVED** | [`MILESTONE_5_2_REPORT.md`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/docs/MILESTONE_5_2_REPORT.md); Responsive customer cards (`.rg-customer-grid`), `useCustomers(50)`, accessible profile drawer, corrective patch removing cross-tenant fallback data. |
| **Milestone 5.3** | Rules & Detection, Model Benchmarks | **APPROVED** | [`MILESTONE_5_3_REPORT.md`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/docs/MILESTONE_5_3_REPORT.md); Read-only rule registry (5 deterministic rules), all 4 policy actions with zero-count visibility, Candidate Model naming, 72.16 percentage points precision gap, dynamic FNR ($1 - Recall$), 12/12 unit tests passed, 16 screenshots. |
| **Milestone 5.4** | Payment Pipeline, Reviews Queue, Reports | **APPROVED** | Workspace 1 (Payment Pipeline), Workspace 2 (Manual Review Queue), and Workspace 3 (Reports & Exports) fully implemented, verified, and approved. |
| **Cohesion Remediation** | Dashboard-Wide Cohesion (Phases 1, 2, 3) | **COMPLETED & VERIFIED** | [`docs/DASHBOARD_COHESION_REPORT.md`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/docs/DASHBOARD_COHESION_REPORT.md); Phase 1 Toolbar & Icon Hygiene; Phase 2 Design Token Harmonization; Phase 3 Visual QA (72 Matrix); 86 tests passing. |
| **Milestone G1** | Data Readiness & Visualization Audit | **COMPLETED & APPROVED** | Audited tenant `merch_legacy` data baseline, documented real metric constraints, prevented artificial metric fabrication. |
| **Milestone G2** | Shared Chart Foundation | **COMPLETED & APPROVED** | Installed Recharts 2.15.1; created `ChartContainer`, `ChartTooltip`, `ChartLegend`, `ChartStates`, `chartTheme`; verified tree-shaking & bundle isolation. |
| **Milestone G3** | Overview & Risk Analytics Implementation | **COMPLETED & APPROVED** | Recharts Donut & Histogram; decoupled score bands from policy actions; verified 100% with regression tests. |
| **Milestone G4** | Rules & Detection + Model Benchmarks | **COMPLETED & VERIFIED** | Rules policy distribution Recharts BarChart; Model Benchmarks grouped comparison (Synthetic vs IEEE-CIS) across all 5 metrics on unified 0.0–1.0 scale; provenance status badges; 8 new unit tests. |
| **Milestone G5** | Payment Pipeline + Reports & Exports | **COMPLETED & VERIFIED** | Payment Pipeline channel breakdown Recharts BarChart; Reports policy distribution Recharts BarChart; dispute compliance range meter (0.65%/0.90%); 10 new unit tests; RFC 4180 / CWE-1236 CSV preservation. |
| **Milestone G6** | Customers + Alerts & Reviews + Transactions | **COMPLETED & VERIFIED** | Customer empty state & PII preservation; Reviews secondary loaded-batch status chart with AG Grid v36 Community primary interface; Transactions AG Grid preserved; 6 new unit tests. |
| **Milestone G7** | Full Regression & Visual QA Audit | **COMPLETED & VERIFIED** | 13/13 Vitest test suites (136 tests passed); TypeScript zero errors; package & Next.js production builds clean; complete 72-screenshot browser matrix verified (`hasOverflow: false` across all states); zero fabricated data. |

> [!IMPORTANT]
> The ReturnGuard Stripe + Linear Redesign is **actively in progress**. Milestones 1 through 5.2 are approved, Milestone 5.3 is completed and verified awaiting formal sign-off, and Milestones 5.4 through 7 are pending. Phase G Redesign is **not** complete until all 7 redesign milestones are delivered and signed off.

---

## 3. Detailed Workspace Implementation & Governance Decisions

### Workspace 3: Customer Risk Directory (`CustomersPage.tsx`)
- **Card-Based Architecture:** The customer directory renders as a responsive card grid (`.rg-customer-grid`), displaying monospace customer IDs, `RiskBadge` pills, masked PII, order volume, and lifetime spend. **It does not use AG Grid;** AG Grid Community v36 is reserved strictly for the Transactions Explorer (`TransactionsGrid.tsx`).
- **Tenant-Scoped API Binding:** Bound strictly to `useCustomers(50)`. If the active tenant has zero customer records, the genuine empty state (`No customer records found.`) is rendered.
- **Tenant Isolation Corrective Patch (Approved M5.2):** Completely deleted `packages/react/src/components/genuineCustomerData.ts`. Tenant-scoped applications must never display records belonging to another tenant as a fallback. Automated test suite in [`test/customers_tenant_isolation.test.ts`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/packages/react/test/customers_tenant_isolation.test.ts) guarantees zero fallback data substitution across Scenarios A, B, C, and D.
- **Accessible Slide-Over Drawer:** Implemented via `useCustomerProfile(customerId)` with WAI-ARIA modal dialog semantics (`role="dialog"`, `aria-modal="true"`), focus trapping, <kbd>ESC</kbd> key dismissal, backdrop dismissal, transaction outcome breakdown bar, single/multi order risk exposure meter, hardware footprint, delivery locations, and order history table.

### Workspace 5: Rules & Detection Management (`RulesPage.tsx`)
- **Configured Rule Counts vs. Dynamic Execution:**
  - **Configured Rules (KPI Strip):** Displays the count of configured deterministic rules (5 Active, 1 Critical Blocking, 3 Step-Up/Review, 1 Account Surveillance).
  - **Dynamic Execution Metrics (Analytics):** Integrated with tenant-scoped `useRiskTrends()` (`policy_breakdown`) and `useRiskSummary()` to render live runtime enforcement activity.
- **The Five Deterministic Rules:** The registry renders the actual five system rules executed in the evaluation pipeline:
  1. `RULE_VELOCITY_SPIKE` ("High Velocity Device Fingerprint"): Flags accounts generating 5+ checkout attempts within 15 minutes. Threshold: `Velocity >= 5 / 15m`, Severity: `HIGH`, Action: `REVIEW`, Status: `ACTIVE`.
  2. `RULE_HIGH_AMOUNT_THRESHOLD` ("First-Order High-Value Transaction"): Triggers verification when unverified customer orders exceed 50,000 INR. Threshold: `Amount >= 50,000 INR`, Severity: `MEDIUM`, Action: `STEP_UP_VERIFICATION`, Status: `ACTIVE`.
  3. `RULE_COLD_START_TENURE` ("Zero-Tenure Cold Account Velocity"): Non-blocking monitoring for accounts created < 24 hours prior. Threshold: `Tenure < 24h`, Severity: `LOW`, Action: `ALLOW`, Status: `ACTIVE`.
  4. `RULE_CRITICAL_RISK_BLOCK` ("Critical ML Risk Hard Block"): Recommends capture hold when ML risk score exceeds 0.80. Threshold: `Risk Score >= 0.80`, Severity: `CRITICAL`, Action: `BLOCK`, Status: `ACTIVE`.
  5. `RULE_ADDRESS_NORMALIZATION_MISMATCH` ("Cross-State Postal Hash Inconsistency"): Detects delivery alterations differing from device signatures. Threshold: `Address Hash Delta > 0`, Severity: `MEDIUM`, Action: `REVIEW`, Status: `ACTIVE`.
- **Strictly Read-Only Registry:** Rule configurations are immutable via embed tokens and require signed server-key authorization for alterations. There is **zero tenant-scoped threshold editing or action override capability** in the client. Verified with clean SVG `<LockIcon />` security notice.
- **Policy Action Distribution:** Explicitly accounts for all four API-supported actions: `ALLOW`, `REVIEW`, `STEP_UP_VERIFICATION`, and `BLOCK`. Zero-count categories remain visible in the breakdown legend (e.g., `ALLOW: 10 (100.0%)`, `REVIEW: 0 (0.0%)`, `STEP_UP_VERIFICATION: 0 (0.0%)`, `BLOCK: 0 (0.0%)`) with safe division-by-zero guards.
- **Daily Policy Enforcement Activity:** Renders a single-period activity panel for $N=1$ evaluation date (`2026-11-03`: 10 total scored, 0 flagged, 0 blocked) and multi-date trendlines for $N \ge 2$.

### Workspace 6: Model Performance & Benchmarks (`ModelsPage.tsx`)
- **Candidate Model Naming:** `candidate_lgbm_v1` is explicitly identified as a **Candidate Model** under offline/shadow evaluation, not a deployed production-serving model.
- **Dataset Separation & Verification Status:** Strict visual separation between:
  - **ReturnGuard Synthetic E-Commerce:** Reproduction Status: `REPRODUCED`. (ROC-AUC: 0.9684, PR-AUC: 0.9009, Precision: 78.47%, Recall: 88.18%, F1: 0.8304, Threshold: 0.40, Sample Count: 35,949).
  - **IEEE-CIS Fraud Benchmark:** Reproduction Status: `REPORTED_UNVERIFIED`. (ROC-AUC: 0.7712, PR-AUC: 0.5186, Precision: 6.31%, Recall: 79.80%, F1: 0.1171, Threshold: 0.35, Sample Count: 118,108).
- **Proportional Metric Meters:** Visual bar meters for ROC-AUC, PR-AUC, Precision, Recall, FNR, and F1 Score with exact numeric values.
- **Dynamic Derived Metric (FNR):** False-Negative Rate ($FNR = (1.0 - Recall) \times 100$) is derived dynamically from API `recall` (Synthetic FNR: `11.82%`, IEEE-CIS FNR: `20.20%`).
- **Cross-Dataset Benchmark Comparison:** Explicitly documents the precision difference as **`72.16 percentage points`** ($78.47\%$ vs $6.31\%$, calculated as `(syn.precision - ieee.precision) * 100`). Contextualizes domain shift and demonstrates why the model operates as a high-recall soft-friction verification trigger rather than an aggressive hard blocker.
- **Honest Limits Disclosure:** Preserves `data.honest_limits_note` from the backend API with an accessible `<InfoIcon />` callout card.
- **Unsupported Metrics Deliberately Omitted:** False-Positive Rate (FPR), inference latency, throughput, and historical benchmark trends are not returned by `/v1/models/performance` and are strictly omitted to prevent simulated or fabricated metrics.

### Workspaces 1 & 4: Overview & Risk Analytics (`OverviewPage.tsx`, `RiskAnalyticsPage.tsx`)
- Overview Page: 4 Stripe-inspired KPI cards, policy action distribution, scoring engine operational health indicator, and zero emojis (SVG icons: `TransactionsIcon`, `AlertTriangleIcon`, `ShieldIcon`, `AnalyticsIcon`).
- Risk Analytics Page: 4 score band cards, native HTML/CSS risk distribution histogram bars, payment channel breakdown with dispute statistics, and striped daily trends table. Zero third-party chart dependencies.

### Workspace 7: Payment Pipeline (`PaymentPipelinePage.tsx`) — Milestone 5.4, Workspace 1 (APPROVED)
- **Decoupled Architecture:** 4-stage lifecycle cards (`Checkout Ingestion` -> `Pre-Decision Risk Evaluation` -> `Merchant Payment Processing` -> `Settlement & Dispute Lifecycle`) explicitly illustrating ReturnGuard pre-decision boundary vs merchant processor execution.
- **Accurate Metric Calculations:** Total evaluated decisions calculated from explicit channel summation (`paypal + cod + other = 110`). Evaluated risk decisions are never conflated with successful payment counts.
- **Currency Integrity:** Preserves and formats API-provided native currency (`INR 14,500.50` with `dispute_rate_pct = 2.73%`). Zero hardcoded USD symbols.
- **Zero Division Safety:** Safe proportions handling when channel volumes are zero.

### Workspace 8: Alerts & Manual Reviews (`ReviewsPage.tsx`) — Milestone 5.4, Workspace 2 (COMPLETED)
- **AG Grid Community v36.2.0 Integration:** Full data grid showing Order / Decision ID, Queued At, Risk Score, Suggested Action, Risk Tier, Status, and Reviewer. Zero custom HTML tables.
- **Top KPI Strip (Honest Metrics):** 4 Stripe-inspired metric cards:
  1. `Total Flagged (Historical)`: Cumulative decisions flagged by policy rules (`summary.review_count`).
  2. `Loaded Batch`: Sample size in active batch (`items.length / 50`).
  3. `Loaded Pending`: Items awaiting review in active batch (`items.filter(status === 'pending').length`).
  4. `Loaded High-Risk`: Items with score $\ge 0.70$ or `HIGH`/`CRITICAL` tier.
- **Interactive Toolbar:** Quick filter search input with SVG `<SearchIcon />`, plus status filter tabs (`All`, `Pending`, `Resolved`) dynamically reflecting batch counts.
- **Accessible Detail & Action Drawer:** Slide-over modal dialog conforming to WAI-ARIA standards (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`).
  - Strict keyboard focus trap, automatic focus to close button, Escape key dismissal, and focus restoration to trigger element.
  - Decision Context grid: Decision ID, Order ID, Queued Timestamp, Current Status, Reviewer, and Resolved Timestamp.
  - Human Review Resolution Panel: Multi-action resolution (`Approve`, `Reject`, `Escalate`) with reviewer notes textarea.
  - Strict Server-Confirmed State Transitions: In-flight loading spinner, duplicate submission prevention (`submitting` guard), and zero optimistic resolution before server confirmation.
  - Unsent Notes Preservation & Failure Recovery: On failed submission, review status remains pending, user notes remain intact, and actionable error alert enables safe retry.
  - Complete 8-Viewport Visual Matrix: Verified in Dark and Light themes across 1440×900, 1280×800, 1024×768, and 390×844.
  - Zero emojis: Clean SVG icons (`RefreshIcon`, `SearchIcon`, `CloseIcon`, `ShieldIcon`, `AlertTriangleIcon`, `InfoIcon`).

### Workspace 9: Reports & Exports (`ReportsPage.tsx`) — Milestone 5.4, Workspace 3 (COMPLETED & VERIFIED)
- **Top KPI Strip (Honest Metrics):**
  1. `Total Evaluated Decisions (Historical)`: Cumulative decisions evaluated (`summary.total_decisions`).
  2. `ALLOW Decision Share`: Strictly calculated as `(summary.allow_count / summary.total_decisions) * 100` with zero division protection (`100.0%`).
  3. `Recorded Disputes`: Cumulative dispute records from processor webhooks (`trends.dispute_analytics.total_disputes`).
  4. `Disputed Volume`: Formatted with API-returned currency (`INR 0.00`). Never hardcodes USD.
- **Four Core Structural Cards:**
  1. `Decisions Audit Dataset Export Center`: Schema chip list, 12 non-PII attributes, PII exclusion guarantee, loaded batch limitation indicator (`10 / 50 Records Loaded`), and single-click CSV download trigger.
  2. `Policy Action Governance`: Compact summary table of ALLOW, REVIEW, STEP_UP_VERIFICATION, and BLOCK action distribution with safe percentages and pre-decision boundary callout.
  3. `Dispute & Chargeback Analytics`: Dispute count, disputed amount in processor currency, and dispute rate percentage with processor gateway relay disclosure.
  4. `Domain & Volume Governance`: Cumulative evaluated order volume (`INR 0.00`), tenant partition identifier (`merch_legacy`), model serving tag (`candidate_lgbm_v1`), and order-level vs decision-level monetary disclosure.
- **RFC 4180 Client-Side CSV Export (`generateDecisionsCsv`, `sanitizeCsvField`, `triggerCsvDownload`):**
  - **Bounded Scope:** Strictly bounded to the active loaded batch (`useRiskDecisions(50)`, max 50 records) as labeled in UI: "Download CSV (Loaded Batch)".
  - **12 Non-PII Audit Attributes:** `Decision ID`, `Order ID`, `Channel`, `Risk Score`, `Risk Score (0-100)`, `Risk Tier`, `Policy Action`, `Suggested Action`, `Policy Rule`, `Severity`, `Model Version`, `Model Status`.
  - **Zero PII Leakage:** Customer names, emails, phone numbers, IP addresses, payment credentials, and internal secret keys are completely excluded.
  - **CWE-1236 Formula Injection Defense:** Strings starting with `=`, `+`, `-`, or `@` that are not legitimate finite numbers are neutralized with a leading single quote (`'`) and double-quoted. Legitimate signed numbers (e.g. `-15`, `0.85`) remain uncorrupted as numbers.
  - **RFC 4180 Escaping:** Proper RFC 4180 comma, newline, and quote escaping with CRLF (`\r\n`) row termination.
  - **Resource Cleanup:** Temporary Blob URLs are cleanly revoked via `URL.revokeObjectURL(url)`.
- **Zero Emojis & Accessible Design:** Professional SVG icons (`DownloadIcon`, `RefreshIcon`, `InfoIcon`, `ShieldIcon`, `AlertTriangleIcon`, `LockIcon`). Clean responsive layout across desktop and mobile.

---

## 4. Current Test & Build Verification Evidence

All automated test suites, typechecks, builds, and browser verifications pass cleanly across the monorepo:

| Verification Suite | Target Directory | Passing / Total | Exit Code | Evidence & Notes |
|---|---|---|---|---|
| Python Backend Unit & API Tests | `returnguard/` | **397 passed**, 9 skipped | `0` | Verified tenant isolation, analytics endpoints, and decision routing. |
| `@returnguard/sdk` Vitest Suite | `packages/sdk/` | **22 / 22 passed** (6 files) | `0` | Tested tenant headers, client methods, crypto, and mocks. |
| `@returnguard/react` Vitest Suite | `packages/react/` | **80 / 80 passed** (7 files) | `0` | `reports_exports.test.ts` (35), `reviews_queue.test.ts` (22), `payment_pipeline.test.ts` (11), `rules_and_models.test.ts` (5), `customers_tenant_isolation.test.ts` (5), `provider.test.ts` (1), `exports.test.ts` (1). Zero skipped, zero failures. |
| TypeScript Compiler (`tsc --noEmit`) | `packages/react/` | Clean compile | `0` | Zero type errors across all components, hooks, and types. |
| Library Bundle Build (`tsup`) | `packages/react/` | ESM, CJS, DTS, CSS | `0` | Fresh `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, and `dist/styles.css`. |
| Next.js App Production Build | `web/` | 4/4 static pages generated | `0` | Static compile completed successfully in Next.js 16.4.3. |
| Git Whitespace Check (`git diff --check`) | Repository Root | Clean | `0` | Zero trailing whitespaces or merge conflict markers. |
| Live Browser Console Audit | Live Web (`:3000`) | 0 errors, 0 warnings | `0` | Verified with Playwright MCP; zero network errors, zero React errors. |

---

## 5. Architectural Boundaries Preserved

1. **Merchant-Owned Payment Boundary:** ReturnGuard strictly evaluates risk (`ALLOW`, `REVIEW`, `STEP_UP_VERIFICATION`, `BLOCK`). PayPal authorization and capture remain merchant-owned.
2. **Tenant Isolation:** All backend queries enforce `tenant_id == auth_context.tenant_id`. Client-side components render authentic tenant data or authentic empty states; zero cross-tenant fallback data.
3. **Licensing Integrity:** AG Grid Community v36.2.0 only; zero Enterprise modules. Slide-over detail drawers provide custom modal inspection.
4. **Data Integrity & Honest Metrics:** Zero fabricated numbers, zero hardcoded fallback analytics, and zero simulated confusion matrices. Partial or unverified benchmarks (`REPORTED_UNVERIFIED`) are labeled transparently.

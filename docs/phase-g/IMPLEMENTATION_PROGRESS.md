# ReturnGuard Phase G — Implementation Progress Tracker

**Milestone Target:** First 50% Implementation Checkpoint  
**Audit & Verification Date:** 2026-11-04  
**Audit Status:** AUDITED & INDEPENDENTLY VERIFIED

---

## 1. Feature-Wise Breakdown & Recalculated Scope

| ID | Feature / Component | Brief Section | Weight | Status | Evidence & File Location |
|---|---|---|---|---|---|
| **G1.1** | Repository & Compatibility Audit | Stage 0 | 4% | COMPLETED | `docs/phase-g/audit.md` |
| **G1.2** | Architecture & Page Blueprint | Stage 1 | 4% | COMPLETED | `docs/phase-g/design.md` |
| **G1.3** | `@returnguard/react` Scaffold & Provider | 4.A | 7% | COMPLETED | `packages/react/src/context.tsx`, `packages/react/test/provider.test.ts` |
| **G1.4** | Typed Adapters & Reusable Hooks | 4.A | 7% | COMPLETED | `packages/react/src/hooks.ts`, `packages/react/test/exports.test.ts` |
| **G1.5** | Dashboard Shell & Design System | 4.B | 6% | COMPLETED | `packages/react/src/components/DashboardShell.tsx`, `styles.css` |
| **G1.6** | Overview Page & Analytics Widgets | 4.C | 8% | COMPLETED | `packages/react/src/components/OverviewPage.tsx` |
| **G1.7** | AG Grid Transactions Explorer | 4.D | 8% | COMPLETED | `packages/react/src/components/TransactionsGrid.tsx`, `TransactionsPage.tsx` |
| **G1.8** | Transaction Sliding Detail Drawer | 4.E | 6% | COMPLETED | `packages/react/src/components/DetailDrawer.tsx` |
| **G2.1** | Customer Directory Foundation | 4.F | 4% | COMPLETED | `packages/react/src/components/CustomersPage.tsx` (derived entity aggregation) |
| **G2.2** | Full Customer Profiles & Deep Analytics | 5 | 8% | DEFERRED | Milestone 2 |
| **G2.3** | Complete Risk Analytics Page | 5 | 8% | DEFERRED | Milestone 2 |
| **G2.4** | Rules & Detection Management Workspace | 5 | 8% | DEFERRED | Milestone 2 |
| **G2.5** | Models & Evaluation Benchmark Dashboard | 5 | 8% | DEFERRED | Milestone 2 |
| **G2.6** | Payment Pipeline & Chargeback Analytics | 5 | 6% | DEFERRED | Milestone 2 |
| **G2.7** | Alerts, Reviews & System Activity Workspace| 5 | 8% | DEFERRED | Milestone 2 |
| **G2.8** | Phase I Investigation & Evidence Packs | 5 | 8% | DEFERRED | Phase I |

- **Milestone 1 Genuinely Implemented:** **50.0%**
- **Deferred to Milestone 2 / Phase I:** **50.0%**

---

## 2. Metric & Drawer Field Data Traceability

| UI Component | Field Displayed | Source Endpoint / Calculation | Hardcoded / Inferred Elements |
|---|---|---|---|
| **Overview KPI** | Total Scored | `GET /v1/analytics/summary` -> `total_decisions` | None |
| **Overview KPI** | Flagged Count & Rate | `(review_count + block_count)` / `total_decisions * 100` | Calculation documented; denominator guarded |
| **Overview KPI** | High Risk / Blocks | `GET /v1/analytics/summary` -> `block_count` | None |
| **Overview KPI** | Average Score | `GET /v1/analytics/summary` -> `average_risk_score * 100` | Normalized to 0–100 scale |
| **Overview Policy Breakdown** | ALLOW, REVIEW, BLOCK | `GET /v1/analytics/summary` individual action counts | None |
| **Transactions Grid** | Order ID, Risk Score, Policy Action, Tier, Severity | `GET /v1/decisions` item fields | None |
| **Transactions Grid** | Payment Status | Displayed as `Authorized` | Hardcoded label for shadow-mode authorized payments pending capture |
| **Detail Drawer** | Score, Action, Severity, Shadow flag | `GET /v1/decisions/{id}` fields | None |
| **Detail Drawer** | Contributing Factors | `GET /v1/decisions/{id}` -> `reason_codes[].feature & direction` | SHAP direction strings from model explainer |
| **Detail Drawer** | Audit Snapshot | `GET /v1/decisions/{id}/audit` -> `data.policy_trace`, `data.feature_snapshot` | None |
| **Customer Foundation**| Aggregated Count & Max Score | Aggregated in frontend memory from `useRiskDecisions(100)` | Backend has no customer aggregate endpoint yet |

---

## 3. Mocked Data, Placeholders & Hardcoded Values Identified

1. **Payment Status in Grid & Drawer:** Updated to explicitly show `Provider Owned (ShopPoint)` and `Not Verified (Owned by Merchant / ShopPoint)`. ReturnGuard recommendation and shadow mode status are displayed strictly separate from external processor outcomes.
2. **Customer Aggregation:** Explicitly labeled as `Customer Directory (Partial In-Memory Sample)` with a `PARTIAL VIEW` badge indicating the count represents only the current loaded 100-record batch, not lifetime customer history.
3. **Date Range / Currency Dropdowns:** Updated to disable unsupported cross-currency conversions and time-window filtering with clear limitation tooltips (`[Active: INR]`, `[Lifetime Metrics]`), preventing any misleading implication that server results are filtered.
4. **Model Name Label:** `candidate_lgbm_v1` is displayed as the serving model from `lgbm_v1_metadata.json`.

---

## 4. Test & Verification Results

- **Python Backend Test Suite:**
  `395 passed, 9 skipped, 208 warnings in 61.21s`
- **SDK Vitest Suite (`packages/sdk`):**
  `6 passed test files, 22 passed tests`
- **React SDK Vitest Suite (`packages/react`):**
  `2 passed test files, 2 passed tests`
- **Next.js Production Build (`web`):**
  `✓ Compiled successfully in 4.1s, static pages generated (4/4)`
- **Bundle Syntax Verification:**
  - `packages/react/dist/index.cjs`: Strict ES2017 parse verified with Acorn
  - `packages/react/dist/index.js`: Strict ES2017 parse verified with Acorn
  - Zero React imports in `@returnguard/sdk`
  - Zero API secrets in frontend packages

---

## 5. Classification of 208 Test Warnings

- **Pre-existing / External Deprecation (201 warnings):**
  - `shap/explainers/_tree.py:586`: 200 warnings (`UserWarning: LightGBM binary classifier with TreeExplainer shap values output has changed to a list of ndarray`). Pre-existing from Phase C SHAP tests.
  - `pytest_asyncio/plugin.py:207`: 1 warning (`PytestDeprecationWarning: asyncio_default_fixture_loop_scope is unset`). Pre-existing.
- **Harmless Environment Warnings (7 warnings):**
  - `sklearn/base.py:376`: `InconsistentVersionWarning` (LabelEncoder unpickled from 1.8.0 on 1.5.2). Pre-existing from Phase A artifact freeze.
  - `joblib/externals/loky`: `UserWarning` (WMIC physical core lookup on Windows). Harmless local environment warning.
- **Introduced Warnings:** **0** (No warnings introduced by Phase G code).

---

## 6. Stop Confirmation
All verification points completed. Development stopped before Milestone 2.

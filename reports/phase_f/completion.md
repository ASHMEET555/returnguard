# Phase F Verification and Completion Report: `@returnguard/sdk`

**Date:** 2026-11-04  
**Branch:** `phase-f/sdk`  
**Status:** DONE  

---

## 1. Executive Summary

Phase F delivered `@returnguard/sdk`, an isomorphic TypeScript/JavaScript SDK client for ReturnGuard, compliant with strict ES2017 syntax, dual-packaged (ESM + CommonJS with TypeScript type declarations), zero dependencies, and completely isolated from React.

All exit criteria defined in `03-phases.md` have been met, implemented, and verified with automated test coverage across Python and TypeScript test suites.

---

## 2. Model Performance Metrics Reconciliation

Reconciled `GET /v1/models/performance` with documented ground truth across synthetic and IEEE-CIS datasets.

### Source-Trace Table

| Field | Value Returned | Source File | Source Value | Match |
| :--- | :--- | :--- | :--- | :--- |
| `model_version` | `"candidate_lgbm_v1"` | `01-brief.md:70`, `reports/holdout_metrics.json:14` | `"candidate_lgbm_v1.pkl"` | Yes |
| `active_dataset` | `"synthetic"` | `reports/holdout_metrics.json:8` | `"ReturnGuard Synthetic E-Commerce"` | Yes |
| `synthetic.auc_roc` | `0.9684` | `01-brief.md:70`, `reports/holdout_metrics.json:20` | `0.96836` | Yes |
| `synthetic.auc_pr` | `0.9009` | `01-brief.md:70`, `reports/holdout_metrics.json:21` | `0.90085` | Yes |
| `synthetic.precision` | `0.7847` | `01-brief.md:70`, `reports/holdout_metrics.json:17` | `0.78465` | Yes |
| `synthetic.recall` | `0.8818` | `01-brief.md:70`, `reports/holdout_metrics.json:18` | `0.88178` | Yes |
| `synthetic.f1_score` | `0.8304` | `01-brief.md:70`, `reports/holdout_metrics.json:19` | `0.83038` | Yes |
| `synthetic.threshold` | `0.40` | `01-brief.md:70`, `reports/holdout_metrics.json:16` | `0.4` | Yes |
| `synthetic.sample_count` | `35949` | `reports/holdout_metrics.json:10` (Days 50–59 test split) | `35949` | Yes |
| `synthetic.reproduction_status`| `"REPRODUCED"` | `01-brief.md:70`, `README.md:79` | Reproduced on frozen artifact | Yes |
| `ieee_cis.auc_roc` | `0.7712` | `01-brief.md:72`, `README.md:85`, `reports/ieee_experiments.md:37` | `0.7712` | Yes |
| `ieee_cis.auc_pr` | `0.5186` | Planning docs (Phase 17 artifact baseline: recorded, not reproduced) | `0.5186` | Yes |
| `ieee_cis.precision` | `0.0631` | `01-brief.md:72`, `README.md:85` | `6.31%` | Yes |
| `ieee_cis.recall` | `0.7980` | `01-brief.md:72`, `README.md:85` | `79.80%` | Yes |
| `ieee_cis.f1_score` | `0.1171` | `reports/ieee_experiments.md:36` | `0.1170` | Yes |
| `ieee_cis.threshold` | `0.35` | `01-brief.md:72`, `README.md:85` | `0.35` | Yes |
| `ieee_cis.sample_count` | `118108` | `README.md:81` (Days 140–182 test split: 3,243 + 48,139 + 821 + 65,905) | `118108` | Yes |
| `ieee_cis.reproduction_status` | `"REPORTED_UNVERIFIED"` | `01-brief.md:72`, `README.md:81` | Reported, not reproduced | Yes |
| `honest_limits_note` | High-recall note | `01-brief.md:78`, `README.md:92` | Matches honest limits statement | Yes |

---

## 3. Phase F Exit Criteria & Proving Tests

| Requirement | Implementation Detail | Proving Test / Script | Status |
| :--- | :--- | :--- | :--- |
| **Typed Client** | Complete typed resources: `scoreTransaction`, `decisions` list/get/audit, `reviews` list/submit, `analytics.summary`, `models.performance`. | `packages/sdk/test/resources.test.ts`, `packages/sdk/test/contract.test.ts` | Pass |
| **Token Provider** | Asynchronous `tokenProvider` callback; zero token storage in SDK memory/disk. | `packages/sdk/test/token_provider.test.ts` | Pass |
| **Cursor Pagination & Errors** | `CursorPage<T>` with stable ordering; typed error hierarchy (`AuthenticationError`, `PermissionError`, `NotFoundError`, `RateLimitError` with `retryAfterSeconds`, `NetworkError`). | `packages/sdk/test/transport.test.ts`, `packages/sdk/test/contract_tenant_ratelimit.test.ts` | Pass |
| **Read Idempotency & Retries** | Read operations retry once on 5xx / network failures; mutations (`scoreTransaction`, review submissions) never retry. | `packages/sdk/test/resources.test.ts` | Pass |
| **Build Syntax & Cleanliness** | Strict ES2017 syntax verified via Acorn parser; no React imports; zero secrets/keys embedded in bundles. | `scripts/check-bundle.mjs` (`npm run check:bundle`) | Pass |
| **Live Contract & Expiry Renewal** | Contract tests against running FastAPI backend; short TTL embed-token renewal; 401 recovery; cross-tenant 404; per-key 429 rate limit mapping. | `packages/sdk/test/contract.test.ts`, `packages/sdk/test/contract_tenant_ratelimit.test.ts` | Pass |

---

## 4. Test Suite Evidence

### Pytest (FastAPI & ReturnGuard Core)
```text
395 passed, 9 skipped, 208 warnings in 86.97s (0:01:26)
```
- Baseline Phase E tests: 373 passing.
- New Phase F server tests (embed token, read endpoints, model documentation reconciliation): +22 passing.
- 9 skipped tests: all related to missing optional IEEE raw data directory (`IEEE_DATA_DIR`), not Phase E/F features.

### Vitest (`@returnguard/sdk`)
```text
 Test Files  6 passed (6)
      Tests  22 passed (22)
   Duration  19.96s
```
- `test/smoke.test.ts`: exports and initialization.
- `test/token_provider.test.ts`: token caching, renewal triggers, missing token handling.
- `test/transport.test.ts`: error mapping, headers, cursor parsing.
- `test/resources.test.ts`: API resource methods and read-only retry logic.
- `test/contract.test.ts`: live server end-to-end score, audit reconstruction, token renewal.
- `test/contract_tenant_ratelimit.test.ts`: cross-tenant 404 isolation and 429 rate limit mapping.

### Bundle Verification
```text
[PASS] index.cjs satisfies strict ES2017 syntax
[PASS] index.js satisfies strict ES2017 syntax
All bundle checks passed (no secrets, no React, strict ES2017).
```

---

## 5. Phase F Commits

- `842ce91`: `fix(api): correct IEEE PR-AUC source in model performance`
- `816d9a9`: `feat(api): reproduction status on model performance metrics`
- `1f8d8c7`: `fix(api): sample counts match evaluation splits`
- `6cba45d`: `test(api): model performance values match documented metrics`
- `184a931`: `docs(phases): name proving tests for Phase F checklist`

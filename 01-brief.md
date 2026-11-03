# 01 — Brief

## 1. What ReturnGuard is

ReturnGuard is a B2B payment-risk platform. Merchants send payment transactions to it from their servers. It returns a fraud probability, a policy recommendation, and SHAP-based reasons for that recommendation. Merchants may also embed its risk components in their own admin applications through a JavaScript SDK and React components.

ReturnGuard recommends. The merchant executes. ReturnGuard never moves money, cancels orders, voids authorizations, refunds payments, or files disputes on its own.

**ShopPoint** is the reference merchant integration and demo application. It is not the ReturnGuard product. ShopPoint owns checkout, PayPal credentials, PayPal order creation, authorization, capture, and PayPal webhooks.

**Loss class:** card-not-present payment fraud, including chargebacks.

**Hackathon:** Build What's Next with PayPal and AI. PayPal and AI must be used meaningfully. AG Grid Community is a required component of the merchant risk-management dashboard.

## 2. Product principles

1. Decisions are made by ReturnGuard's risk engine and policy, not by the LLM, the SDK, or the merchant UI.
2. Shadow mode is the default. Enforcement is an explicit merchant configuration.
3. Every merchant's data is isolated. A merchant can never read another merchant's transactions, decisions, reviews, audit rows or evidence.
4. Payment execution belongs to the merchant's payment integration. ReturnGuard never holds PayPal credentials and never calls PayPal.
5. Every recommendation is explainable through stored records and SHAP output, and every action leaves an audit row.

## 3. Product scope

| Area | Status | Notes |
|---|---|---|
| Risk scoring API (`POST /v1/score`) | Built | Unauthenticated today. Authentication is Phase E |
| ML model (LightGBM, frozen) | Built | Synthetic and IEEE-CIS artifacts; see section 6 |
| Policy engine (five rules) | Built | Verified; unchanged |
| SHAP explanations | Built | Additivity check in place |
| Shadow mode | Built | Default on |
| Audit records (`audit_score_events`) | Built | No customer, device or geography stored |
| Merchant tenancy and API keys | Not built | Phase E |
| Embed tokens for browser SDK | Not built | Phase E/F |
| `@returnguard/sdk` | Not built | Phase F |
| `@returnguard/react` with AG Grid | Not built | Phase G |
| ShopPoint PayPal authorize / capture gate | Built, partly verified | Mocked tests pass; live sandbox evidence pending |
| ShopPoint PayPal webhooks | Built, **signature verification missing** | Phase D3 reopened |
| Evidence Engine (dispute packs, LLM drafts) | Not built; tables and stubs exist | Phase I |
| Vector retrieval | Deferred | Not required for MVP |

## 4. Integration boundary

| Concern | Owner |
|---|---|
| Merchant login and admin roles | Merchant (ShopPoint) |
| Checkout and order records | Merchant |
| PayPal credentials, orders, authorization, capture, void | Merchant (ShopPoint) |
| PayPal webhook receipt and signature verification | Merchant (ShopPoint) |
| Risk score, policy action, SHAP reasons, rule hits | ReturnGuard |
| Risk decision history and audit | ReturnGuard |
| Merchant review decisions (recorded) | ReturnGuard records; merchant executes |
| Evidence packs and dispute drafts | ReturnGuard prepares; merchant approves and submits |

## 5. Policy and action semantics

| Policy action | Recommended merchant behaviour | Enforced only when |
|---|---|---|
| `ALLOW` | Capture | Always |
| `ALLOW_WITH_MONITORING` | Capture and monitor | Always |
| `STEP_UP_VERIFICATION` | Hold capture until customer verification | `SHADOW_MODE=false` |
| `BLOCK` | Hold capture for merchant review. Never auto-decline | `SHADOW_MODE=false` |

In shadow mode the merchant captures every payment and ReturnGuard records what it would have done.

A merchant-initiated void (on review rejection) is a separate action in the merchant's own payment workflow. Whether this exists is an open decision (D-SDK-8).

## 6. Model and metrics

**Primary (synthetic):** LightGBM, frozen artifact `candidate_lgbm_v1.pkl`. Test split days 50–59. Reproduced on this machine: ROC-AUC 0.9684, PR-AUC 0.9009, precision 0.7847, recall 0.8818, F1 0.8304, expected cost ₹41,376.78.

**External validation (IEEE-CIS):** Phase 17 artifact at τ = 0.35. Reported: precision 6.31%, recall 79.80%, ROC-AUC 0.7712. The artifact file and its stored predictions are not present in the repository, so these figures are reported, not reproduced. They are **UNVERIFIED** until predictions are regenerated.

**Unreconciled:** an earlier table lists synthetic ROC-AUC 0.984. Neither the 0.984 figure nor its script has been found. Publish 0.9684 with the split stated, and mark 0.984 as unreconciled until it is traced.

**Candidate v2 (IEEE):** `lgbm_ieee_v2.pkl` exists on disk and reports precision 6.70%. It is **not approved for serving** under Hard Rule 2. Serving remains on the frozen artifacts.

**Honest reading:** the IEEE-CIS model is a high-recall filter for step-up review. Its precision is low, about one true fraud per 15 flags. It must not be presented as a precise blocker.

## 7. Money-path invariants

1. Risk is evaluated after authorization and before any capture.
2. No capture path bypasses the decision check.
3. A `BLOCK` holds capture; it never voids or declines automatically.
4. A rejection by the merchant is recorded in an audit row before any PayPal void is attempted.
5. Replayed PayPal webhooks change nothing.
6. ReturnGuard never receives or stores PayPal secrets.

## 8. Definition of Done (current)

- [ ] Every ReturnGuard route except health requires authentication
- [ ] Two-tenant isolation tests pass for decisions, audit, reviews, analytics and evidence
- [ ] Cross-tenant identifiers return 404
- [ ] ShopPoint webhook verifies PayPal signatures; invalid and missing signatures are rejected, with tests
- [ ] D1 sandbox end-to-end run with saved logs
- [ ] Artifact manifest matches disk, or the external-artifact decision is recorded
- [ ] ROC-AUC 0.984 reconciled or removed from all documents
- [ ] `@returnguard/sdk` contract tests pass against the running API
- [ ] `@returnguard/react` renders in ShopPoint on React 16.13
- [ ] ShopPoint admin page shows live decisions through the SDK
- [ ] Evidence Engine: evidence packs generated from stored rows; guardrail test rejects injected IDs
- [ ] Demo video under 3 minutes; public repo; LICENSE in About

## 9. Out of scope

Hosted or iframe dashboard, billing, self-serve onboarding, multi-region deployment, Kafka, ClickHouse, vector database (until Phase I justifies it), return-abuse module, abuse-ring as a model feature, live card-network submission, any code path where ReturnGuard calls PayPal.

## 10. Open decisions

| # | Decision | Status |
|---|---|---|
| D-SDK-8 | Merchant-initiated PayPal void on review rejection | Open. Needs sign-off |
| D-MAN | `phase17_lgbm.pkl` missing from disk while listed as frozen | Open. Recommended: move to an external section with a stated reason |
| D-ROC | Synthetic ROC-AUC 0.984 vs 0.9684 | Open. Publish 0.9684 with split stated |
| D-PP | Remove PayPal credentials from ReturnGuard `.env.example` and `payments/webhooks.py` | Recommended yes; execute in Phase E |
| D-RAW | Raw PayPal webhook route in ReturnGuard (`/v1/paypal/webhooks`) | Tested; disable only after tests are migrated |
| D-UI | Existing Next.js `web/` app | Keep as dev harness consuming `packages/react`; add no new pages |
# 01 — Brief, locks, decisions, Definition of Done (ML-layer update)

Read once before Phase A. Re-check before submission.

---

## 1. What we are building

**ReturnGuard / MerchantShield ML layer on the PayPal + AI hackathon plan.** The product is a payment fraud risk layer for a merchant using PayPal sandbox orders. It estimates fraud probability for each order, explains the estimate with SHAP, and recommends an action. The merchant executes the action. The system does not move money, cancel orders, or file disputes on its own.

Hackathon: **Build What's Next with PayPal and AI.** The project must meaningfully use PayPal and AI. PayPal and AG Grid are compulsory and stay in the plan as written.

**Loss class (ML target):** card-not-present payment fraud, including chargebacks. This replaces the original return-abuse target (decision M1).

---

## 2. Track bar (must ship)

| Requirement | Proof |
|-------------|-------|
| One loss class stated clearly | README and demo open with it |
| Working detector with explainable output | `POST /v1/score` returns probability, severity, suggested action, SHAP reasons |
| Precision and recall on a held-out set | `reports/holdout_metrics.md` and `.json`, synthetic and IEEE in separate sections, with split method |
| Honest false-positive cost | ₹ cost at the operating threshold, from the verified cost model |
| Defense-only | Recommendation actions, shadow default, human approval for external action |

---

## 3. Product locks (ML rows changed)

| Decision | Choice |
|----------|--------|
| Primary model | LightGBM (verified). Random Forest and logistic regression are baselines in the same lift table |
| Feature set | Verified 15 causal features. IEEE variant adds `card_product_share` and is versioned separately |
| Datasets | Synthetic (verified generator, seed 42) and IEEE-CIS (`IEEE_DATA_DIR`) |
| Cost model | FP = ₹50, FN = 50% of amount (verified). Threshold chosen on validation to minimise cost, subject to a recall constraint |
| Policy | Verified five-rule policy: `BLOCK`, `STEP_UP_VERIFICATION`, `ALLOW_WITH_MONITORING`, `ALLOW` |
| Severity and suggested action | Derived from the policy action (table in section 4) |
| Explainability | TreeSHAP for the shipping LightGBM artifact, plus verified additivity check. Deterministic templates, not an LLM |
| Stance | Shadow default on. Recommendations only |
| Frontend | AG Grid Community console (original plan, Phase F). Verified React dashboard is not adopted |
| LLM | Gemini or OpenAI. Explains and drafts. Never decides risk, severity or action |

### 3.1 Policy rules (verified, unchanged)

| Order | Condition | Action |
|-------|-----------|--------|
| 1 | probability ≥ 0.80 | `BLOCK` |
| 2 | probability ≥ 0.40 | `STEP_UP_VERIFICATION` |
| 3 | probability ≥ 0.15 and amount ≥ amount threshold | `STEP_UP_VERIFICATION` |
| 4 | probability ≥ 0.15 | `ALLOW_WITH_MONITORING` |
| 5 | otherwise | `ALLOW` |

Operating threshold for the policy decision point: τ = 0.40 on synthetic validation (recall constraint). IEEE artifact τ = 0.35 (Phase 17). Each artifact keeps its own threshold. Thresholds are never shared silently.

Amount threshold: ₹25,000 for synthetic. For IEEE, the amount threshold is chosen on validation and documented, because the IEEE currency is not stated (decision M4).

`BLOCK` means "recommend decline to the merchant." It holds a PayPal capture for merchant review. It does not reject the buyer or move money.

---

## 4. Severity and suggested action (replaces the old score bands)

| Policy action | Severity | Suggested action | Money-path effect (Phase D) |
|---------------|----------|------------------|-----------------------------|
| `BLOCK` | `critical` | `manual_review` | Capture held until merchant decides |
| `STEP_UP_VERIFICATION` | `warning` | `step_up_verify` | Merchant prompt shown; capture waits |
| `ALLOW_WITH_MONITORING` | `info` | `allow` (+ log) | Capture proceeds |
| `ALLOW` | `none` | `allow` | Capture proceeds |

Severity is derived from the policy action in code. It can never disagree with the action.

---

## 5. Changes from the original plan (ML layer only)

| Original | Now | Reason |
|----------|-----|--------|
| XGBoost primary | LightGBM (verified) | Verified accuracy and tests |
| Return-abuse target | Payment fraud / chargebacks | Matches the verified datasets |
| COD/PayPal feature set (25) | Verified 15 + IEEE variant | Frozen, reproducible |
| Score bands 0.30 / 0.50 / 0.67 | Policy-derived severity | One source of truth for actions |
| RTO Net ₹ formula | Verified cost model | Card-fraud relevant |
| Spike and cod-heavy rules as model inputs | Rules are evidence only; velocity is also a model feature | Keeps the model frozen and the rules auditable |
| Abuse-ring as model input | Display-only ring module | Used by the demo; not a model input |
| Rules-only fallback | Amount-only fallback, never `BLOCK` | Safe fallback |

---

## 6. Open decisions (ML layer)

| # | Decision | Recommendation | Blocks |
|---|----------|----------------|--------|
| M1 | Loss class: payment fraud (recommended) vs return abuse | Payment fraud. Confirm PayPal dispute reason names in sandbox | Phase A |
| M2 | IEEE recall 79.8% vs the 80% constraint | Relax to 0.78 for IEEE with user approval, or select a model that meets 0.80 | Phase C |
| M3 | IEEE precision target | Set a number, or "beat 6.3% on validation; report test honestly" | Phase C |
| M4 | IEEE amount currency and amount threshold | Validation-chosen threshold, currency marked UNVERIFIED | Phase C |
| M5 | Database | PostgreSQL per original stack. Verified audit tested on both SQLite and PostgreSQL | Phase A |
| M6 | Vector DB and SaaS tenancy | Not added (Phase E and G locked). Revisit only if those phases may change | Not in scope |
| M7 | Hackathon and sponsor rules | PayPal + AI, as in the original plan | Closed |

Agents stop and ask before resolving any of M1–M6.

---

## 7. Verification items (Phase A records results)

1. `scale_pos_weight = 73.12` against the training-split prevalence.
2. IEEE boundary at day 110: inclusive or exclusive, and non-overlapping intervals.
3. Pytest baseline: 269 passing across 8 files.
4. Phase 17 cost: 2,469,531 cost units. With FP = ₹50 and 48,139 FP, FP cost is 2,406,950. The remainder (62,581 units) implies FN amounts of about 125,162 total across 821 FN. Verify this decomposition against the stored predictions before reporting it.
5. PayPal 3-day honor period on the current PayPal page. Mark `UNVERIFIED` until confirmed.
6. Dispute reason and evidence type names in the PayPal sandbox (needed by Phase G).

---

## 8. Definition of Done (ML layer)

- [ ] One loss class stated (payment fraud)
- [ ] Verified ML tests pass (269 across 8 files)
- [ ] Synthetic and IEEE metrics reproduce within tolerance
- [ ] LightGBM, Random Forest, logistic regression and amount-only baseline in the lift table
- [ ] IEEE precision improvement program run on validation only, all candidates logged, including failures
- [ ] Holdout precision and recall published, synthetic and IEEE separately, with split method
- [ ] ₹ cost table at operating thresholds, with currency note for IEEE
- [ ] SHAP top-K and additivity check pass on the shipping artifact
- [ ] Score API returns probability, `risk_score_100`, tier, policy rule, severity, suggested action, SHAP reasons, `model_status`, `feature_completeness`, `explanation_status`, `shadow`
- [ ] Fallback returns amount-only result and never `BLOCK`
- [ ] Shadow mode on by default
- [ ] Leakage test passes for the 15 features and the IEEE variant
- [ ] Original plan's DoD items for Phases D–H still checked as written

---

## 9. Out of scope (unchanged from original, plus ML)

Redis or Feast online features, Kafka, ClickHouse, full RBAC, live card-network submission, automated dispute filing, offense tooling, abuse-ring as a model feature, return-abuse module, multi-currency settlement, vector DB and SaaS tenancy (M6).
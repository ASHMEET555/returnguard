# 03 — Build phases A→H (ML layer updated; D–H unchanged)

Do one phase at a time. Tick exit criteria only when evidence is in the phase report. Phase C is the bar. Do not start Phase D until C is green.

Tags: **[REUSE]** verified and frozen, **[EXTEND]** additive change, **[NEW]** built in this plan, **[KEEP]** original plan unchanged.

---

## Phase A — Adopt the verified ML layer, freeze data, keep the PayPal schema

**Replaces:** original Phase A's COD/PayPal generator, parquet split and COD labels. Keeps the original schema (as schema only).

**Goal:** Bring in the verified ML layer without edits. Reproduce its data. Freeze features, costs, datasets, and the database schema that Phases D–H need.

### Tasks

- [x] Create branch `ml-verified`. Copy the ML files listed in `00-codebase-map.md` section 1 with no edits. Commit as-is. **[REUSE]**
- [x] Record the commit hash and a SHA-256 manifest of `ml/models/*.pkl` to `reports/artifact_manifest.json`. **[NEW]**
- [x] Create a virtual environment with the pinned versions from `00-codebase-map.md`. **[REUSE]**
- [x] Run the ML test subset. Expected 269 passing across 8 files. Save output to `reports/phase_a/pytest.txt`. **[REUSE]**
- [x] Regenerate synthetic data with seed 42. Compare output hashes with the prior run. If they differ, record the cause. **[REUSE]**
- [x] Set `IEEE_DATA_DIR`. Load IEEE and confirm 590,540 rows and 20,663 fraud labels. Record the currency note for `TransactionAmt` as UNVERIFIED. **[REUSE + NEW]**
- [x] Verification 1: check `scale_pos_weight = 73.12` against training-split prevalence. Record it. **[NEW]**
- [x] Verification 2: fix the IEEE train/validation boundary at day 110 so intervals do not overlap. Record the choice in `docs/split_decisions.md`. **[NEW]**
- [x] Verification 4: decompose the Phase 17 cost (2,469,531) against stored predictions. Record the implied FN amount total. **[NEW]**
- [x] Verification 5 and 6: confirm the PayPal 3-day honor period and the sandbox dispute reason and evidence type names. Mark UNVERIFIED until confirmed. **[NEW]**
- [x] Generate `features/dictionary.yaml` from the verified 15 names in code. Check against `02-architecture.md` section C. Fail the phase on any mismatch. **[NEW]**
- [x] Generate `features/dictionary_ieee_v1.yaml` for the IEEE variant. Document each mapping and each missing signal. **[NEW]**
- [x] Keep the original schema tables as schema only: `order`, `payment`, `payment_event`, `dispute`, `evidence_pack`, `evidence_submission`, `merchant_audit`. Add `audit_score_event` with `feature_snapshot_json` (nullable). Migrations are idempotent. **[KEEP + EXTEND]**
- [x] Run the audit layer tests on both SQLite and PostgreSQL, per decision M5. **[NEW]**
- [x] Write `docs/data_mapping.md`: PayPal order fields to the verified transaction schema, with missing-field handling. **[NEW]**
- [x] Seed adapter: a script that reads the verified synthetic transactions and writes an order-shaped file for Phase D's sandbox seed. Do not run it until Phase D. **[NEW]**
- [x] Move the COD/RTO generator, parquet split, COD label code and the old 25-feature dictionary to `legacy/`. Do not import from `legacy/`. **[DROP]**
- [x] Keep `LICENSE` and the defense pledge text. **[KEEP]**

### Exit criteria

- [x] Verified ML layer runs from a clean clone with the documented steps
- [x] ML test subset matches baseline (269 passing)
- [x] Artifact manifest matches files on disk
- [x] Synthetic regeneration matches, or the difference is explained
- [x] IEEE loads with expected counts; currency note recorded
- [x] Verifications 1, 2, 4, 5 and 6 have recorded results
- [x] Feature dictionaries match the code
- [x] Schema migrations run twice without error on both databases

**Next:** Phase B

---

## Phase B — Verify features, rules, rings and the order adapter

**Replaces:** original Phase B's COD spike rules, COD-specific features, and the old as-of builder spec. Rings are kept as display-only.

**Goal:** Prove the 15 features are causal, the adapter is honest about missing data, and the rule and ring modules produce deterministic evidence without touching the model or the action.

### Tasks

- [x] Leakage test for all 15 features: insert data after t, assert the vector at t is unchanged. **[NEW, verifies verified code]**
- [ ] Leakage test for the IEEE variant and each IEEE aggregate column used as a feature. **[NEW]**
- [x] Velocity test: a burst fixture raises `velocity_5min`, `velocity_30min` and `velocity_60min` above a clean fixture. **[NEW]**
- [x] Cold-start test: first transaction for a customer uses sentinels; history-dependent explanations are filtered. **[NEW, verifies verified behaviour]**
- [x] `features/builder.py`: `build(order_id, as_of)` returns the 15 vector and writes `feature_snapshot_json`. Same inputs give identical output. **[NEW]**
- [x] Adapter test: a PayPal order with missing device and geo fields produces `feature_completeness < 1.0`, lists missing fields, and never fills them with invented values. **[NEW]**
- [x] `rules/engine.py` with `spike_velocity` only. Burst fixture hits. Clean fixture does not. The rule never sets the action. **[NEW]**
- [x] `rings/builder.py`: deterministic union-find over phone, address and device. Size-3 shared-address fixture is discovered. Size-2 pairs are not. Same input gives the same `ring_id`s. Display-only. **[NEW]**
- [x] Read `backend/schemas/transaction.py` and `response.py`. Write `docs/api/ml_contract.md` describing the current request and response. New fields are additive. **[EXTEND]**
- [x] Confirm audit rows store no customer ID, device ID or geography. **[REUSE, verify]**
- [x] `scripts/explain_sample.py`: prints features, `feature_completeness`, rule hits, ring ID, and policy trace for sample synthetic and IEEE transactions. No training run needed. **[NEW]**
- [x] Record in `docs/decisions.md`: rules and rings are evidence only; `spike_cod_heavy`, `spike_micro` and the 18-feature option are dropped. **[NEW]**

### Exit criteria

- [ ] Leakage tests pass for the 15 features and the IEEE variant
- [x] Velocity, cold-start and adapter tests pass
- [x] Rule and ring tests pass; neither changes the action
- [x] `docs/api/ml_contract.md` matches the schemas
- [ ] `scripts/explain_sample.py` runs on both datasets
- [x] Full ML test suite still passes

**Next:** Phase C

---

## Phase C — ML training, IEEE improvement, SHAP, holdout report, score API (THE BAR)

**Replaces:** original Phase C (XGBoost, logistic baseline, holdout, score API). Adds SHAP as the first explanation layer.

**Goal:** Reproduce the verified results. Train or refresh LightGBM, Random Forest and logistic regression on both datasets. Improve IEEE precision on validation only. Attach SHAP. Publish the holdout report with ₹ cost. Serve the score API with fallbacks.

### C1 — Reproduce verified results

- [ ] Reproduce the synthetic test metrics (table in `02-architecture.md` section E) from `candidate_lgbm_v1.pkl`, days 50–59. Tolerance ±0.005. **[REUSE]**
- [ ] Reproduce the IEEE Phase 17 metrics on days 140–182. Tolerance ±0.005 on ROC-AUC and recall, ±0.002 on precision. **[REUSE]**
- [ ] Reproduce the logistic regression and Random Forest synthetic metrics. Tolerance ±0.005. **[REUSE]**
- [ ] Record artifact names, versions and hashes in `reports/artifact_manifest.json`. **[NEW]**

### C2 — Cost and threshold (validation only)

- [ ] Cost is computed by `cost_model.py`: FP = ₹50, FN = 50% of amount. **[REUSE]**
- [ ] Threshold sweep 0.30–0.80 on validation, with alert volume %, recall, precision and cost. Recall constraint applied as decided in M2. **[REUSE + NEW report]**
- [ ] Choose τ on validation only. Synthetic τ = 0.40 is re-checked; IEEE τ = 0.35 is re-checked. Record both in `docs/decisions.md`. **[REUSE + NEW]**
- [ ] If the IEEE recall constraint is not met (currently 79.8% vs 80%), follow the decision in M2 and record it. **[DECISION]**
- [ ] Recompute IEEE cost in ₹ on the test split, with the currency-assumed label (M4). Show the Phase 17 cost units next to it with the decomposition from Phase A. **[NEW]**

### C3 — IEEE precision improvement program (validation only)

Goal: raise IEEE precision above 6.3%, without giving up the recall agreed in M2. Target set in M3.

- [ ] Candidate 1: LightGBM hyperparameter search on validation AUC with the verified early-stopping rule. Keep `eval_metric='auc'` and `first_metric_only=True`. **[NEW]**
- [ ] Candidate 2: class-weight variants around `scale_pos_weight`, each re-thresholded on validation. **[NEW]**
- [ ] Candidate 3: IEEE feature variants from fields documented in `dictionary_ieee_v1.yaml` (card, address, email-domain match, product code, device type). Each new feature must pass the Phase B leakage test before use. **[NEW]**
- [ ] Candidate 4: amount threshold for the IEEE amount rule, chosen on validation (M4). **[NEW]**
- [ ] Log every candidate, including failures, in `reports/ieee_experiments.md` with validation cost, precision and recall. **[NEW]**
- [ ] Select one candidate by validation cost, subject to the recall constraint. **[NEW]**
- [ ] Evaluate the selected candidate once on the test split. Report the test result as is, even if it does not reach the target. **[NEW]**
- [ ] If the selected candidate beats Phase 17, save it as `lgbm_ieee_v2` with its own manifest entry and get user approval before use (see Hard Rule 2 in AGENTS.md). Phase 17 remains available. **[NEW]**

### C4 — Baselines and lift table

- [ ] Amount-only baseline (dataset-specific amount threshold) on the same test split. **[NEW]**
- [ ] Lift table per dataset: amount-only, logistic regression, Random Forest, LightGBM (and `lgbm_ieee_v2` if approved). Precision, recall, F1, PR-AUC, ROC-AUC, cost in ₹. **[NEW]**
- [ ] Synthetic and IEEE in separate sections. Never averaged. **[NEW]**

### C5 — SHAP explainability

- [ ] `ml/explain/shap_service.py`: read-only top-K over the verified `explainability.py`. No change to SHAP values. **[EXTEND]**
- [ ] Additivity test on at least 100 transactions per dataset: reconstructed vs predicted probability difference below 1e-4. **[REUSE, verify coverage]**
- [ ] Deterministic templates for reason text, using only feature names, directions and stored values. **[REUSE]**
- [ ] Test: SHAP output does not change probability, tier, policy rule or action. **[NEW]**

### C6 — Holdout report

- [ ] `ml/evaluate.py` writes `reports/holdout_metrics.md` and `.json`. Synthetic and IEEE in separate sections, split method stated. Confusion matrix at the operating threshold. Threshold sweep. ₹ cost. **[EXTEND]**
- [ ] README metrics section: P, R, F1, cost, split method, per dataset. States IEEE precision (6.3% on Phase 17, or the improved figure if approved) and the honest-limits note. **[NEW]**

### C7 — Policy mapping and score API

- [ ] `services/policy_mapping.py`: policy action → severity and suggested action, per section 4 of `01-brief.md`. Unit test every row. **[NEW]**
- [ ] `POST /v1/score` returns the contract in `02-architecture.md` section G. Additive to the existing routes. **[EXTEND]**
- [ ] Fallback when `model_status = unavailable`: amount-only policy result. Test: never `BLOCK`. **[NEW]**
- [ ] `SHADOW_MODE=true` default in settings. Test confirms default. **[EXTEND]**
- [ ] Policy boundary tests at probability 0.15, 0.40 and 0.80 and at the amount threshold, confirming rule order. **[NEW]**

### Exit criteria (the bar)

- [ ] Synthetic and IEEE metrics reproduce within tolerance
- [ ] Lift table and holdout report exist, separated per dataset, with split method
- [ ] ₹ cost table published at the operating thresholds, with IEEE currency note
- [ ] IEEE improvement program logged; selected candidate evaluated on test once
- [ ] SHAP additivity passes; SHAP does not change any decision
- [ ] Score API returns the contract; fallback never blocks; `shadow=true` by default
- [ ] Policy mapping unit tests pass
- [ ] README metrics section written with honest limits

**Next:** Phase D

---

## Phase D — PayPal payment path (sandbox)

**[KEEP]** Unchanged from the original plan.

**Goal:** A real PayPal sandbox order runs through the ReturnGuard policy. Captures stay separate from scoring.

### Build checklist

- [x] `payments/paypal_client.py`: OAuth token from sandbox credentials (env vars only)
- [x] `POST /v1/payments/create`: sandbox order with `intent` per `SHADOW_MODE`
- [x] Buyer approval in sandbox checkout (Next.js page with PayPal SDK button)
- [x] Score on approval, write `audit_score_event`
- [x] Policy gate: `allow` and `info` capture; `warning` waits for merchant; `critical` holds
- [x] `POST /v1/payments/{id}/authorize` and `POST /v1/payments/{id}/capture`
- [x] Authorization review deadline stored; expiry notifies merchant
- [x] `POST /v1/paypal/webhooks`: signature verify, `payment_event` by `event_id`, duplicate replay is a no-op
- [x] Seed script creates sandbox orders from the adapter output in Phase A (seed adapter)

### Exit criteria

- [x] Sandbox payment captured after ReturnGuard policy allows it
- [x] A held (`critical`) order is not captured until merchant action
- [x] Replayed webhook event does not change state
- [x] No PayPal secret appears in git history

**Next:** Phase E

---

## Phase E — Policy, shadow, audit

**[KEEP]** Unchanged from the original plan.

**Goal:** Defense-only semantics. Shadow first. No silent money block.

### Build checklist

- [ ] `services/policy.py`: severity → action table; the LLM cannot change it
- [ ] `SHADOW_MODE=true` default; shadow never changes a payment outcome
- [ ] `audit_score_event`, `audit_evidence_event`, `merchant_audit` tables
- [ ] Query helper: reconstruct the decision for an `order_id` end to end
- [ ] Calibration note: shadow high-risk vs actual labels on test

### Exit criteria

- [ ] No code path auto-cancels, voids, rejects or refunds an order
- [ ] Audit log reconstructs score, policy action, capture decision and evidence approval

**Next:** Phase F

---

## Phase F — AG Grid investigation console

**[KEEP]** Unchanged from the original plan.

**Goal:** The primary merchant interface. Built on AG Grid Community.

### Build checklist

- [ ] Transaction explorer: sort, filter, pagination, severity badges as cell renderers
- [ ] Abuse-ring explorer: filter by `ring_id`, click row to open ring drawer
- [ ] Dispute investigation: click row to open a React detail drawer (PayPal transaction ID, order history, score, reason codes, rule hits, ring, evidence status)
- [ ] Model performance view: precision, recall, F1, FP cost and threshold table, per dataset
- [ ] Seed button and fixtures for demo orders
- [ ] No Enterprise-only features in the required path. Master-detail is optional, only with a trial key from an env var

### Exit criteria

- [ ] All four views load from the API with seeded data
- [ ] Repo runs with AG Grid Community alone (no license key)

**Next:** Phase G

---

## Phase G — Evidence verifier, LLM assistant, gated submit

**[KEEP]** Unchanged from the original plan. The evidence bundle may read the SHAP top-K and rule hits from Phase C, as stored data. It does not recompute them.

**Goal:** Dispute evidence drafted from records, LLM explanations that cannot invent IDs, and a sandbox-only submit after human approval.

### Build checklist

- [ ] `disputes/paypal_disputes.py`: list and get sandbox disputes; store `evidences` requirements
- [ ] Seed sandbox disputes (buyer enablement in sandbox; create dispute through sandbox endpoints)
- [ ] `POST /v1/disputes/{id}/evidence-pack`: JSON + markdown, mapped to PayPal evidence types
- [ ] Completeness % and heuristic `win_likelihood` (documented as a heuristic)
- [ ] Optional prior-order match helper, labelled as an internal helper
- [ ] `assistant/llm.py` and `assistant/guardrails.py`: unknown IDs or invented amounts are rejected
- [ ] `POST /v1/assistant/chat` explains a flagged order from stored records only
- [ ] `POST /v1/disputes/{id}/approve`: writes `merchant_audit`
- [ ] `POST /v1/disputes/{id}/submit`: only if `PAYPAL_SUBMIT_ENABLED=true`, sandbox only, status `WAITING_FOR_SELLER_RESPONSE`, approval exists, pack hash matches
- [ ] Records `evidence_submission` with result

### Exit criteria

- [ ] Judge can open a readable pack and see pass/fail per PayPal evidence type
- [ ] LLM test: ask about an order, inject a fake ID into the output, guardrail rejects it
- [ ] Submit returns 403 when the flag is off, and works in sandbox when it is on
- [ ] Submit without approval is refused

**Next:** Phase H

---

## Phase H — Submission package & demo

**[KEEP]** Unchanged from the original plan.

**Goal:** Everything the hackathon asks for, in a 5-minute reproducible demo under the 3-minute video limit.

### Demo beats (video ≤ 3 min; live demo ≤ 5 min)

1. Clean prepaid loyal order (PayPal sandbox) → low score, captured
2. COD first order, bad pincode → elevated, step-up shown
3. Velocity spike → rule hit badge
4. Address ring → ring badge and ring drawer
5. Model performance: P/R and cost per dataset
6. PayPal dispute → evidence pack → LLM explanation → human approve → sandbox submit
7. Show the PayPal sandbox transaction ID and the audit row

### Submission checklist

- [ ] Public GitHub repo with LICENSE visible in About
- [ ] README: problem, features, setup and run steps, sandbox setup, `.env.example`
- [ ] Text description covering features and functionality
- [ ] Tools section: LightGBM, scikit-learn, SHAP, LLM provider, PayPal APIs, AG Grid Community; how each is used
- [ ] Hosted demo URL (optional) or clean-clone run instructions tested on a second machine
- [ ] Demo video under 3 minutes, shows the project running, uploaded to YouTube publicly
- [ ] No third-party logos or copyrighted music without permission
- [ ] Full DoD in `01-brief.md` checked

### Exit criteria

- [ ] Fresh clone runs with the documented steps
- [ ] Seed reproducible on a clean machine
- [ ] Submission form complete before the deadline confirmed on the hackathon page

---

## Suggested calendar (solo / weekend pace)

| Block | Phases |
|-------|--------|
| 1 | A + B (adopt and verify the ML layer) |
| 2 | C (the bar: training, IEEE improvement, SHAP, holdout, score API) |
| 3 | D (PayPal sandbox payment path) |
| 4 | E + F (policy, console) |
| 5 | G (evidence, LLM, gated submit) |
| 6 | H (submission, video, rehearsal) |

If short on time, cut in this order: LLM polish → master-detail → extra console views. Never cut Phase C, the PayPal sandbox payment in Phase D, or the audit trail in Phase E.
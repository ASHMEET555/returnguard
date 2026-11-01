# 03 — Build phases A→H

Do **one phase at a time**. Tick exit criteria before moving on. Phase **C** is the Track 02 bar. Do not start PayPal or UI work until C is green.

---

## Phase A — Spec, schema & dataset

**Goal:** Freeze the loss class, features, costs, channels and reproducible data.

### Build checklist

- [x] Repo `returnguard` scaffold: FastAPI, PostgreSQL, `requirements.txt`, `.env.example`, `LICENSE`
- [x] Copy defense pledge into README
- [x] `features/dictionary.yaml` from [02-architecture.md](02-architecture.md)
- [x] Schema: order, payment, payment_event, dispute, evidence_pack, evidence_submission, merchant_audit
- [x] `docs/fp_cost_assumptions.md` with ₹ constants (COD and PayPal)
- [x] `data/generator/`: synthetic COD and PayPal world, 7 abuse archetypes
- [x] Fixed seed → `train.parquet` / `val.parquet` / `test.parquet`
- [x] Data card: row counts, positive rate per channel, split dates, held-out customer count

### Exit criteria

- [x] Re-run generator with the same seed → identical holdout IDs
- [x] Feature files have **no** future-leakage columns

**Next:** Phase B

---

## Phase B — Rules, rings, features

**Goal:** Hybrid Layer-1 ready. Every online feature is computable as-of.

### Build checklist

- [x] `rules/` spike engine + `config.yaml` thresholds
- [x] Unit tests: burst fixture hits; clean fixture does not
- [x] `rings/` builder: phone, address and device edges → components
- [x] Unit test: shared-address ring of size ≥ 3 is discovered
- [x] `features/builder.py`: `build(order_id, as_of)` → 15–20 vector, with `channel`
- [x] Persist `feature_snapshot` JSON for audit
- [x] CLI script: print features and rule_hits for sample orders (COD and PayPal)

### Exit criteria

- [x] Same `order_id` + `as_of` → deterministic features
- [x] Spike and ring demos work **without** ML

**Next:** Phase C

---

## Phase C — ML + holdout + score API (BAR, unchanged)

**Goal:** Satisfy the Track 02 precision, recall and FP-cost bar.

### Build checklist

- [ ] `ml/train.py`: logistic baseline and XGBoost; save `ml/artifacts/`
- [ ] Threshold chosen on **validation** (F1 or Net ₹)
- [ ] `ml/evaluate.py`: **test only**. Write `reports/holdout_metrics.md` and `.json`, per channel
- [ ] Lift table: rules-only vs LR vs XGB
- [ ] `POST /v1/score` implementing the score contract in 02
- [ ] Reason codes (top-K), rule_hits, suggested_action
- [ ] Model-missing fallback → rules-only severity

### Exit criteria

- [ ] README shows P, R, F1, FP cost and split method, per channel
- [ ] API returns reasons; `shadow=true` by default

**Next:** Phase D

---

## Phase D — PayPal payment path (sandbox)

**Goal:** A real PayPal sandbox order runs through the ReturnGuard policy. Captures stay separate from scoring.

### Build checklist

- [ ] `payments/paypal_client.py`: OAuth token from sandbox credentials (env vars only)
- [ ] `POST /v1/payments/create`: sandbox order with `intent` per `SHADOW_MODE`
- [ ] Buyer approval in sandbox checkout (Next.js page with PayPal SDK button)
- [ ] Score on approval, write `audit_score_event`
- [ ] Policy gate: `allow` and `info` capture; `warning` waits for merchant; `critical` holds
- [ ] `POST /v1/payments/{id}/authorize` and `POST /v1/payments/{id}/capture`
- [ ] Authorization review deadline stored; expiry notifies merchant
- [ ] `POST /v1/paypal/webhooks`: signature verify, `payment_event` by `event_id`, duplicate replay is a no-op
- [ ] Seed script creates sandbox orders from the generator's PayPal world

### Exit criteria

- [ ] Sandbox payment captured after ReturnGuard policy allows it
- [ ] A held (`critical`) order is not captured until merchant action
- [ ] Replayed webhook event does not change state
- [ ] No PayPal secret appears in git history

**Next:** Phase E

---

## Phase E — Policy, shadow, audit

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

**Goal:** The primary merchant interface. Built on AG Grid Community.

### Build checklist

- [ ] Transaction explorer: sort, filter, pagination, severity badges as cell renderers
- [ ] Abuse-ring explorer: filter by `ring_id`, click row to open ring drawer
- [ ] Dispute investigation: click row to open a React detail drawer (PayPal transaction ID, order history, score, reason codes, rule hits, ring, evidence status)
- [ ] Model performance view: precision, recall, F1, FP cost and threshold table, per channel
- [ ] Seed button and fixtures for demo orders
- [ ] No Enterprise-only features in the required path. Master-detail is optional, only with a trial key from an env var

### Exit criteria

- [ ] All four views load from the API with seeded data
- [ ] Repo runs with AG Grid Community alone (no license key)

**Next:** Phase G

---

## Phase G — Evidence verifier, LLM assistant, gated submit

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

**Goal:** Everything the hackathon asks for, in a 5-minute reproducible demo under the 3-minute video limit.

### Demo beats (video ≤ 3 min; live demo ≤ 5 min)

1. Clean prepaid loyal order (PayPal sandbox) → low score, captured
2. COD first order, bad pincode → elevated, step-up shown
3. Velocity spike → rule hit badge
4. Address ring → ring badge and ring drawer
5. Model performance: P/R and Net ₹ per channel
6. PayPal dispute → evidence pack → LLM explanation → human approve → sandbox submit
7. Show the PayPal sandbox transaction ID and the audit row

### Submission checklist

- [ ] Public GitHub repo with LICENSE visible in About
- [ ] README: problem, features, setup and run steps, sandbox setup, `.env.example`
- [ ] Text description covering features and functionality
- [ ] Tools section: XGBoost, scikit-learn, LLM provider, PayPal APIs, AG Grid Community; how each is used
- [ ] Hosted demo URL (optional) or clean-clone run instructions tested on a second machine
- [ ] Demo video under 3 minutes, shows the project running, uploaded to YouTube publicly
- [ ] No third-party logos or copyrighted music without permission
- [ ] Full DoD in [01-brief.md](01-brief.md) checked

### Exit criteria

- [ ] Fresh clone runs with the documented steps
- [ ] Seed reproducible on a clean machine
- [ ] Submission form complete before the deadline confirmed on the hackathon page

---

## Suggested calendar (solo / weekend pace — adjust to the confirmed deadline)

| Block | Phases |
|-------|--------|
| 1 | A + start B |
| 2 | Finish B + C (bar green) |
| 3 | D (PayPal sandbox payment path) |
| 4 | E + F (policy, console) |
| 5 | G (evidence, LLM, gated submit) |
| 6 | H (submission, video, rehearsal) |

If short on time, cut in this order: LLM polish → master-detail → extra console views. Never cut Phase C, the PayPal sandbox payment in Phase D, or the audit trail in Phase E.

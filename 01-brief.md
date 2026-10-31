# 01 — Brief, rules, decisions, definition of done

Read this once before Phase A. Re-check the rules and DoD before submission.

---

## Hackathon rules that shape the build

Source: hackathon brief (Build What's Next with PayPal and AI).

| Rule | What it means for ReturnGuard |
|------|-------------------------------|
| Must meaningfully use PayPal | PayPal Orders API (sandbox) is in the live payment path, not a decorative button |
| Must meaningfully use AI | XGBoost risk model + LLM investigation/evidence assistant |
| Working prototype | Judges can run it locally or use a hosted URL |
| Functional demo | Setup + run instructions in the repo, or hosted demo. Mockups do not count |
| Tools section | List every AI/model service and how it is used |
| Public repo | GitHub, GitLab or Bitbucket. All source, assets and run instructions included |
| License file | Visible at top of repo (About section) |
| Demo video | Under 3 minutes, shows the project on the device it was built for, uploaded to YouTube publicly, link on the form |
| Third-party material | No trademarks or copyrighted material without permission (see brand note below) |
| Text description | Features, functionality, tools used |

**Brand note:** use the PayPal SDK-rendered checkout button rather than copying PayPal logos. Check PayPal brand guidelines before putting any PayPal logo in screenshots or the video. Avoid AG Grid and Gemini/OpenAI logos unless their brand rules allow them.

**Deadline:** the brief in the uploaded pack does not give a submission date. Confirm the deadline on the hackathon page before locking the phase calendar.

---

## Track 02 bar (must ship, unchanged)

| Requirement | Proof judges see |
|-------------|------------------|
| One class of loss | Return / RTO / refund abuse, stated in README and demo |
| Working detector or verifier | Live `POST /v1/score` + evidence pack API |
| Precision & recall on held-out set | `reports/holdout_metrics.md` + split method |
| Honest false-positive cost | ₹ model + threshold / Net table |
| Defense-only | Soft actions + human approve; no attack tools |

The PayPal layer does not replace this bar. It sits on top of it.

---

## Product locks

| Decision | Choice |
|----------|--------|
| Name | **ReturnGuard** |
| Primary loss class | Return / RTO / refund abuse (applies to COD orders and PayPal orders) |
| Primary artifact | Detector: risk score 0–1 + severity + reasons |
| Secondary artifact | Dispute **evidence pack** with a human approve step |
| Payment channels | `cod` (legacy, original features) and `paypal` (new, sandbox) |
| Stance | Shadow-first; soft actions only |
| Model | XGBoost (or HistGB) primary; logistic regression baseline; one model with `channel` feature, metrics reported per channel |
| Feature budget | 15–20 features per channel, plus payment features where available |
| Score timing | Order create (pre-dispatch). For PayPal, also after authorize and before capture |
| Repo | New greenfield. Patterns only, no copied code from other projects |
| Frontend | Next.js + React, AG Grid Community as the core grid |
| LLM | Gemini or OpenAI. Explains and drafts. Never decides risk |

### Severity → soft action

| Band | Score | Action |
|------|-------|--------|
| `none` | < 0.30 | `allow` |
| `info` | 0.30–0.50 | `allow` + log |
| `warning` | 0.50–0.67 | `step_up_verify` or `prefer_prepaid` |
| `critical` | ≥ 0.67 | `manual_review` |

On a PayPal order, `manual_review` holds the capture. It does not reject the buyer.

---

## Plan review decisions

Each recommendation from the PayPal/AG Grid plan was checked against the original build pack, the hackathon rules and the current PayPal and AG Grid docs.

| # | Recommendation | Decision | Reason |
|---|----------------|----------|--------|
| 1 | Keep ReturnGuard as the core project | **Accepted** | Strong existing base; the rules want a meaningful PayPal and AI use, which this adds |
| 2 | PayPal Orders API for checkout and capture | **Accepted** | Core PayPal use. Sandbox only |
| 3 | Authorize, then score, then capture | **Modified** | Good idea. Only active when `SHADOW_MODE=false`. In shadow, capture normally and log the score. PayPal holds authorizations up to 29 days, and capture is recommended within about 3 days (verify on the current PayPal page before relying on it) |
| 4 | PayPal Webhooks for lifecycle events | **Accepted** | Verify signatures, process idempotently by event ID |
| 5 | PayPal Disputes API: retrieve and submit evidence | **Accepted, gated** | Real endpoint: `POST /v1/customer/disputes/{id}/provide-evidence` (multipart with an `input` JSON field and optional evidence file). Merchants can only provide evidence when the dispute is `WAITING_FOR_SELLER_RESPONSE`. Submission is behind `PAYPAL_SUBMIT_ENABLED=false` by default |
| 6 | Visa CE 3.0-style match matrix as the evidence logic for PayPal disputes | **Modified** | PayPal disputes use PayPal evidence types (for example `PROOF_OF_FULFILLMENT`, `PROOF_OF_REFUND`). The CE 3.0 matrix is a card-network rule. Keep it as an optional "prior-order match" helper, and map evidence to PayPal types |
| 7 | AG Grid as the primary investigation console | **Accepted** | Fits the investigation need |
| 8 | Master-detail expandable rows for the investigation view | **Modified** | Master-detail is an **AG Grid Enterprise** feature. Community edition is MIT and free. Use Community with a React detail drawer. Enterprise only if a trial licence is available and the key is kept out of the repo (see 02) |
| 9 | Row grouping, Excel export, server-side model in the console | **Modified** | All Enterprise features. Use client-side filtering, sorting, pagination and custom cell renderers instead |
| 10 | XGBoost for risk, LLM for explanation | **Accepted** | Matches the original separation. Add deterministic checks so the LLM cannot cite IDs that do not exist |
| 11 | Human approval before any dispute submit | **Accepted, updated** | Original Phase D only logged approval. Updated: approve records the decision, then a separate submit call sends it. Submit is sandbox-gated and off by default |
| 12 | Extend PostgreSQL with payment, event, dispute, evidence and audit entities | **Accepted** | Needed for the PayPal path |
| 13 | Do not assume PayPal gives device, IP or behaviour data | **Accepted** | Use application-side records. For PayPal orders, many COD features are null, so the model uses a channel flag and reports metrics per channel |
| 14 | Prioritise Phases A–C, then PayPal, then AG Grid, then LLM, then disputes | **Accepted** | Same order, plus policy/audit kept before the UI |
| 15 | Prize references ($69,750 total, $5,000 AG Grid prize) | **Partly verified** | $69,750 total is in the uploaded brief. The AG Grid prize amount is from the plan only and is not in the uploaded brief. Confirm on the hackathon page |
| 16 | Elastic or APIMatic as alternatives | **Not used** | Stay focused. One sponsor tool (AG Grid) is enough |
| 17 | Offer the Razorpay / other-ecosystem positioning | **Kept as note** | Positioning: a measured return-risk detector with hold-out P/R and FP cost, not a clone |

### What the plan missed (added by this review)

- **Channel mismatch:** PayPal orders are prepaid, so the COD/RTO label does not apply to them. Define a separate label for PayPal: refund after delivery, or return with no receipt, within the outcome window. Train one model with a `channel` feature and report metrics per channel.
- **Sandbox data is synthetic:** PayPal sandbox disputes must be created manually or through sandbox-only endpoints. Seed disputes and orders with the synthetic generator so the demo is reproducible.
- **Authorize timing and shadow mode conflict:** a hold that waits on a human review can expire. Set a review SLA, or capture by default in shadow mode.
- **Evidence must come from records, not the LLM:** every delivery number, tracking ID and address in an evidence pack must trace to a stored row.
- **Public repo hygiene:** no PayPal client secrets, Gemini/OpenAI keys or AG Grid license keys in the repo. Use `.env.example`.

---

## Track example directions (all appear in one product)

### Return-risk scorer (PRIMARY)

Score orders early enough to intervene. Hybrid rules + behavioural ML. Output probability, tier and reason codes. Proportional friction, and no punishment of good customers.

### Fraud-spike detector

Windowed velocity, COD-heavy and micro-return rules → `spike_alert` + `evidence_json`. Feeds numeric features into the scorer. Demoable alone.

### Abuse-ring sentinel

Shared phone, address or device across accounts. Batch connected components → `ring_id` + graph features. Flags for review only.

### Dispute evidence responder (VERIFIER)

Given a PayPal dispute and its order, draft an evidence pack mapped to PayPal evidence types, with a checklist, history and risk score. Heuristic `win_likelihood`. Human approves before any sandbox submit.

---

## Ecosystem note

Other payment platforms market similar return and dispute products. Position ReturnGuard as a **measured** return-risk detector and evidence verifier, with hold-out precision and recall, FP cost and a Net ₹ table. Do not present it as a clone of anyone's product.

---

## Definition of done

- [ ] One loss class stated clearly
- [ ] Detector API with explainable reasons
- [ ] Spike + ring visible in API and UI
- [ ] PayPal sandbox order created, authorized or captured through ReturnGuard's policy
- [ ] PayPal webhook signature verified; duplicate event replay is a no-op
- [ ] AG Grid console: filter, sort, pagination, detail drawer, high-risk highlighting
- [ ] Evidence pack mapped to PayPal evidence types, with human approve
- [ ] Sandbox submit works only when `PAYPAL_SUBMIT_ENABLED=true`
- [ ] LLM explains a flag using only stored record IDs (deterministic check passes)
- [ ] Held-out precision and recall published, per channel
- [ ] FP cost and Net ₹ vs threshold published
- [ ] Shadow / defense-only default
- [ ] No secrets in repo; `.env.example` present
- [ ] LICENSE file at repo root and set in GitHub About
- [ ] Demo video under 3 minutes, uploaded to YouTube publicly, link in form
- [ ] Text description and Tools section written
- [ ] 5-minute reproducible demo from a clean clone

---

## What not to build in v1

Redis real-time micro-batch p95, Kafka, investigation outbox, ClickHouse warehouse, full RBAC, live card-network submit, offense tooling, automated dispute filing, AG Grid Enterprise features as a requirement, Elastic or APIMatic integrations, multi-currency settlement.

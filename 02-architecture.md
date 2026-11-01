# 02 — Architecture, PayPal flows, features, data & eval

Use while implementing Phases B–G. Freeze feature names after Phase A.

---

## Module layout

| Path | Job | Track mapping |
|------|-----|---------------|
| `data/generator/` | Synthetic COD and PayPal orders, refunds, disputes, abuse injectors | Dataset |
| `rules/` | Spike thresholds, evidence_json | Fraud-spike |
| `rings/` | Graph build + membership features | Abuse-ring |
| `features/` | As-of feature builder, zero-fill, channel flag | Scorer input |
| `ml/train.py`, `ml/evaluate.py` | Train, holdout, artifacts, per-channel metrics | Bar metrics |
| `services/score.py` | Online detector | Return-risk scorer |
| `services/policy.py` | Severity → soft action, shadow gate | Defense |
| `services/evidence.py` | Pack builder mapped to PayPal evidence types | Dispute verifier |
| `payments/paypal_client.py` | OAuth token, Orders create / authorize / capture (sandbox) | PayPal |
| `payments/webhooks.py` | Signature verify, idempotent event store | PayPal |
| `disputes/paypal_disputes.py` | List / get disputes, provide-evidence (sandbox-gated) | PayPal |
| `assistant/llm.py` | LLM explanation and draft calls | AI (LLM) |
| `assistant/guardrails.py` | Verifies every cited ID exists in stored records | AI safety |
| `api/` | FastAPI routes | Working system |
| `reports/` | `holdout_metrics.md/json`, per channel | Bar artifact |
| `web/` | Next.js console with AG Grid Community | Judge UX |
| `.env.example` | All secret names, no values | Repo hygiene |
| `LICENSE` | Visible at repo root | Rules |

---

## Channels

Every order has a `channel`:

- `cod`: original COD/RTO channel. Original features apply. Label is RTO or confirmed abusive return.
- `paypal`: PayPal Orders sandbox channel. Prepaid. Label is refund abuse, meaning refund after delivery confirmation with no return receipt, or a dispute the seller lost on abuse grounds, within the outcome window.

One model, `channel` as a feature. Report metrics per channel and overall. Do not average them to hide weak performance on one channel.

---

## PayPal payment flow (sandbox)

1. Customer starts checkout on the Next.js page. Client calls `POST /v1/payments/create`.
2. Backend creates a PayPal order (`intent` = `AUTHORIZE` when `SHADOW_MODE=false`, otherwise `CAPTURE`) and stores `payment` with `status = created`.
3. Buyer approves in the PayPal sandbox checkout. Backend receives the approval.
4. Score the order as-of now (features + rules). Write `audit_score_events`.
5. Policy decides:
   - `allow`, `info`: capture (or authorize, then capture).
   - `warning`: `step_up_verify` shown to the merchant. Capture waits for the merchant's choice.
   - `critical`: `manual_review`. Capture is held. Merchant decides in the console.
6. Capture: `POST /v1/payments/{id}/capture`. Capture and evidence submission are separate operations.
7. Webhooks: `POST /v1/paypal/webhooks` verifies the signature, stores `payment_event` by `event_id`, and ignores duplicates.

**Invariants**

- The money path never auto-cancels, voids or rejects.
- A held authorization has a review deadline. If it expires, the merchant is notified and can re-authorize or capture.
- Shadow mode (`SHADOW_MODE=true`, default): capture as normal, log the score and suggested action. The policy never changes the payment outcome.

---

## Online score flow

1. Client `POST /v1/score` with `order_id` (COD or PayPal).
2. Run spike rules as-of now → `rule_hits` + evidence.
3. FeatureBuilder as-of `order_time`, joined with batch ring features.
4. Model `predict_proba` → `risk_score`. If the model is missing, fall back to rules-only severity.
5. Policy → severity + `suggested_action`.
6. Append `audit_score_events`.
7. Return JSON. Never block money in shadow mode.

**Invariants**

- Features as-of order time. No future leakage.
- Rules always run.
- Reason codes = top-K SHAP-style or model-contribution values.

### Score response contract

```json
{
  "order_id": "ord_...",
  "channel": "paypal",
  "risk_score": 0.72,
  "severity": "critical",
  "reason_codes": ["cust_rto_rate", "is_cod", "ring_size"],
  "rule_hits": ["spike_velocity"],
  "ring_id": "R17",
  "suggested_action": "manual_review",
  "shadow": true,
  "model_version": "rg_xgb_v1"
}
```

---

## Ring build (batch)

1. Normalize phone, address and device → undirected edges.
2. Connected components; keep size ≥ 3 with high `ring_return_rate`.
3. Write `ring_membership` and aggregates.
4. Online score looks up only. No graph walk on the request path.

---

## Dispute evidence flow (PayPal Disputes API)

1. `GET /v1/disputes` (sandbox) → store `dispute` with `paypal_dispute_id`, reason, status, amount, and the `evidences` array.
2. Find the linked `payment` and order. Score the order if no score exists.
3. Build the evidence checklist from the dispute's requested evidence (`source = REQUESTED_FROM_SELLER`), using PayPal evidence types.
4. Find up to 2 prior undisputed orders from the same customer and address for the prior-order match helper (optional, labelled as an internal helper, not a network rule).
5. Compute completeness % and heuristic `win_likelihood`. Document it as a heuristic.
6. Return JSON + markdown draft. Every number traces to a stored row.
7. `POST /v1/disputes/{id}/approve`: writes `merchant_audit` with approver and time.
8. `POST /v1/disputes/{id}/submit`: runs only if `PAYPAL_SUBMIT_ENABLED=true` and environment is sandbox. Calls `POST /v1/customer/disputes/{id}/provide-evidence` with the approved pack. Records `evidence_submission`.

**Submit guards:** dispute status must be `WAITING_FOR_SELLER_RESPONSE`; approval must exist; the pack hash must match the approved hash.

### PayPal evidence type mapping

| Dispute evidence type (PayPal) | Source in ReturnGuard |
|--------------------------------|-----------------------|
| `PROOF_OF_FULFILLMENT` | `delivery` record: tracking, carrier, delivered date |
| `PROOF_OF_REFUND` | `refund` record: refund ID, amount, date |
| `PROOF_OF_RETURN` | `return_event` record, received-at date |
| `OTHER` | Free-text notes, reviewed by the human |

Check the exact evidence types returned by the sandbox dispute before hard-coding this table. Unknown types go to `OTHER` with a checklist warning.

### Evidence pack sections

Dispute header → disputed payment → delivery / return / refund records → prior-order match helper (optional) → risk score, reasons and ring → PayPal evidence checklist (pass/fail per type) → `win_likelihood` disclaimer.

---

## LLM assistant

The ML model decides. The LLM explains.

**Input to the LLM:** only the stored JSON for the order (score, severity, reason codes, rule hits, ring, dispute, delivery and refund records).

**Output rules:**
- Plain-language explanation of each reason code.
- Recommended action from the policy table. The LLM cannot change it.
- Every ID it mentions must exist in the input record.

**Guardrails (`assistant/guardrails.py`):**
- Extract IDs from the LLM output and check each one against the input record. Reject or regenerate if any ID is unknown.
- Block any claim of a delivery confirmation, tracking number or amount that is not in the record.
- Store the prompt and output in `merchant_audit`.

**Endpoints:** `POST /v1/assistant/chat` (questions about one order or dispute), and the same LLM call used for evidence narrative drafts.

---

## AG Grid licensing and scope

Checked against AG Grid docs.

| Feature | Community (MIT, free) | Enterprise (commercial) |
|---------|------------------------|--------------------------|
| Sorting, filtering, pagination, row selection | Yes | Yes |
| Custom cell renderers (risk badges, severity colours) | Yes | Yes |
| Row pinning, column pinning | Yes | Yes |
| Master-detail (expandable rows) | No | Yes |
| Row grouping and aggregation | No | Yes |
| Excel export | No | Yes |
| Server-side row model | No | Yes |
| Tool panels, context menu | No | Yes |

**Decision:** build the console on AG Grid Community.

- Transaction explorer: sort, filter, severity badges, pagination.
- Abuse-ring explorer: filter by `ring_id`, click a row to open the ring drawer.
- Dispute investigation: click a row to open a **React detail drawer** showing PayPal transaction ID, order history, score, reason codes, rule hits, ring and evidence status.
- Model performance: precision, recall, F1, FP cost and threshold table, per channel.

**Enterprise option:** if a 30-day Enterprise trial is used for master-detail, the Enterprise key must come from an environment variable, never the repo. The repo must still run with Community alone. Judges running locally can use the Enterprise packages without a key, but a hosted demo needs a key. Choose this only if time allows.

---

## Feature dictionary (15–20 per channel, plus payment)

### Order / payment

| Feature | Channel | Notes |
|---------|---------|-------|
| `channel` | both | `cod` or `paypal` |
| `is_cod` | both | 0 for PayPal |
| `order_value` | both | Gross ₹ |
| `order_value_vs_cust_avg` | both | vs customer AOV |
| `item_count` | both | Lines |
| `category_risk` | both | Category return-rate bucket |
| `checkout_speed_sec` | both | Synthetic session proxy in sandbox |
| `payment_authorized` | paypal | Authorization status at score time |
| `payment_captured` | paypal | Capture status at score time |
| `order_to_payment_ratio` | paypal | Order value / amount authorized |

### Customer history

| Feature | Notes |
|---------|-------|
| `cust_order_count` | Prior completed orders, any channel |
| `cust_rto_rate` | Prior RTO rate (COD) |
| `cust_return_rate` | Prior return rate |
| `cust_refund_rate` | Prior refund rate (PayPal) |
| `cust_dispute_count` | Prior PayPal disputes |
| `days_since_last_rto` | Recency |
| `successful_delivery_streak` | Consecutive non-RTO |

### Address / geo

| Feature | Notes |
|---------|-------|
| `address_completeness` | Required fields |
| `pincode_rto_rate` | Pincode bucket history |
| `is_new_address` | First use for customer |

### Velocity / spike (also rules)

| Feature | Notes |
|---------|-------|
| `orders_24h`, `orders_7d` | Burst |
| `returns_7d`, `refunds_7d` | Return and refund spike |
| `cod_share_7d` | Cash-heavy |
| `micro_return_pct_30d` | Micro structuring |

Rules: `spike_velocity`, `spike_cod_heavy`, `spike_micro` in `rules/config.yaml`.

### Abuse-ring

| Feature | Notes |
|---------|-------|
| `shared_phone_accounts` | Distinct customers |
| `shared_address_accounts` | Normalized address |
| `shared_device_accounts` | `device_hash` from the merchant's own app data (not PayPal) |
| `ring_size` | Component size |
| `ring_return_rate` | Component mean |

### Leakage blacklist (do not train on)

- Outcomes after the as-of time.
- Dispute results and PayPal settlement fields for the pre-ship model. Allowed only in the evidence pack.
- Label-mirroring composites.
- Webhook event timestamps later than as-of.

---

## Data & labels

**Entities:** merchant, customer, address, device, order, payment, payment_event, shipment, return_event, refund, dispute, evidence_pack, evidence_submission, merchant_audit.

**Channel-specific labels:**
- `cod`: `y = 1` if RTO or confirmed abusive return within the outcome window.
- `paypal`: `y = 1` if refund after delivery with no return receipt, or a dispute lost on abuse grounds, within the outcome window.

**Abuse injectors (synthetic):** serial RTO on COD; address-farm ring; velocity spike week; high-value first order; clean loyal prepaid; PayPal refund-after-delivery repeat; PayPal dispute on a legitimate delivered order (negative control).

**Label delay:** simulate 3–7 days for both channels.

### Split

1. Sort by `order_time`.
2. Train ≤ T0; validation (T0, T1]; **test > T1**.
3. Hold out about 15% of `customer_id` never seen in training.
4. Publish sizes, base rates and split dates per channel.

### Metrics package (`reports/holdout_metrics.*`)

- Confusion matrix at the operating threshold, per channel and overall.
- Precision, recall, F1, PR-AUC.
- Threshold sweep 0.3–0.8 with alert volume %.
- FP cost and Net ₹:

```
avg_rto_loss_₹     = 180
ops_min_per_FP     = 8
ops_₹_per_min      = 5
goodwill_₹_per_FP  = 50
intervention_₹     = 45

FP_cost = FP * (ops_min_per_FP * ops_₹_per_min + goodwill_₹_per_FP)
TP_save = TP * avg_rto_loss_₹
Net     = TP_save - FP_cost - (TP+FP)*intervention_₹
```

Use the same constants for PayPal with `avg_refund_loss_₹` set in `docs/fp_cost_assumptions.md`.

**Baselines on the same holdout:** (1) rules-only, (2) logistic, (3) XGBoost. Publish the lift table per channel.

---

## Security and config

- `.env.example` lists `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV=sandbox`, `PAYPAL_SUBMIT_ENABLED=false`, `SHADOW_MODE=true`, `LLM_API_KEY`, `AG_GRID_LICENSE_KEY` (optional).
- Webhook endpoint rejects any event without a valid signature.
- Logs redact card and account data. The demo uses sandbox accounts only.

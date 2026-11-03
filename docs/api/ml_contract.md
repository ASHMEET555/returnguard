# ReturnGuard ML API & Score Response Contract

This document specifies the unified ML API contracts for ReturnGuard, detailing existing fields from the verified ML baseline and additive fields required by `02-architecture.md` Section G.

---

## 1. Request Contract (`/risk/score`, `/risk/evaluate`)

### Input Payload (`RiskRequest`)
Defined in `backend/schemas/transaction.py`:

```json
{
  "transaction": {
    "transaction_id": "txn_001",
    "customer_id": "cust_123",
    "merchant_id": "merch_456",
    "merchant_category": "electronics",
    "timestamp": "2026-06-01T12:00:00Z",
    "amount": 2500.0,
    "device_id": "dev_789",
    "geo_region": "IN-KA",
    "payment_method": "card",
    "status": "success",
    "account_created": "2026-01-01T00:00:00Z"
  },
  "prior_transactions": [],
  "source": "manual"
}
```

- **Validation Scope**: Validates schema shape, timestamps, and non-empty identifiers. No engineered features or business risk judgements are accepted from callers.
- **Prior Context**: In-memory historical context for the customer. Missing context defaults to cold-start evaluation (`prior_txn_count = 0`).

---

## 2. Response Contract (`RiskEvaluateResponse` / Score Contract)

Below is the complete score response contract as specified in `02-architecture.md` Section G, mapping each field to its schema status:

```json
{
  "order_id": "ord_98765",
  "channel": "paypal",
  "risk_score": 0.72,
  "risk_score_100": 72,
  "tier": "HIGH",
  "policy_rule": "HIGH_STEP_UP",
  "policy_action": "STEP_UP_VERIFICATION",
  "severity": "warning",
  "suggested_action": "step_up_verify",
  "reason_codes": [
    {
      "feature": "velocity_5min",
      "direction": "increases_risk",
      "shap_rank": 1
    }
  ],
  "rule_hits": [
    "spike_velocity"
  ],
  "ring_id": null,
  "model_version": "candidate_lgbm_v1",
  "dataset": "synthetic",
  "threshold": 0.40,
  "model_status": "ok",
  "feature_completeness": 1.0,
  "explanation_status": "ok",
  "shadow": true
}
```

---

## 3. Field-by-Field Specification & Additive Mapping

| Field | Type | Status | Source / Derivation | Description |
|---|---|---|---|---|
| `transaction_id` | `str` | **Existing** | `request.transaction.transaction_id` | Unique transaction ID from request. |
| `order_id` | `str` | **New (Additive)** | Adapter alias for `transaction_id` | Canonical order identifier across e-commerce channels. |
| `channel` | `str` | **New (Additive)** | Fixed `"paypal"` | Informational transaction payment channel. |
| `fraud_probability` | `float` | **Existing** | Model `predict_proba[:, 1]` | Raw calibrated model probability ($0.0 \dots 1.0$). |
| `risk_score` | `float` | **Existing / Synced** | Same as `fraud_probability` | Floating-point risk probability. |
| `risk_score_100` | `int` | **New (Additive)** | `int(round(fraud_probability * 100))` | Scaled 0–100 integer score for merchant dashboard display. |
| `risk_category` | `str` | **Existing** | `decision.risk_category` | Category from existing baseline: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `tier` | `str` | **New (Additive)** | Upper-case alias for `risk_category` | Standardized tier name for investigation queues. |
| `action` | `str` | **Existing** | `decision.action` | Decision action: `ALLOW`, `ALLOW_WITH_MONITORING`, `STEP_UP_VERIFICATION`, `BLOCK`. |
| `policy_action` | `str` | **New (Additive)** | Same as `action` | Canonical policy action name. |
| `policy_rule_id` | `str` | **Existing** | `decision.policy_rule_id` | Rule ID: `LOW_ALLOW`, `MEDIUM_MONITOR`, `HIGH_STEP_UP`, `CRITICAL_BLOCK`. |
| `policy_rule` | `str` | **New (Additive)** | Same as `policy_rule_id` | Canonical policy rule identifier. |
| `policy_reason` | `str` | **Existing** | `decision.policy_reason` | Human-readable explanation of why policy rule triggered. |
| `severity` | `str` | **New (Additive)** | `services/policy_mapping.py` | UI badge severity: `"allow"`, `"info"`, `"warning"`, `"critical"`. |
| `suggested_action` | `str` | **New (Additive)** | `services/policy_mapping.py` | Action guidance: `"allow"`, `"monitor"`, `"step_up_verify"`, `"investigate"`. |
| `reason_codes` | `list[dict]` | **New (Additive)** | Ranked SHAP contributions | Structured attributions: `{"feature", "direction", "shap_rank"}`. |
| `rule_hits` | `list[str]` | **New (Additive)** | `rules/engine.py` | Spike rules triggered (e.g. `["spike_velocity"]`). Evidence only. |
| `ring_id` | `str \| null` | **New (Additive)** | `rings/builder.py` | Precomputed cluster identifier (`"R01"` or `null`). Display only. |
| `model_version` | `str` | **Existing** | `"candidate_lgbm_v1"` | Identifier of frozen model artifact in production. |
| `dataset` | `str` | **New (Additive)** | `"synthetic"` | Training dataset variant (`"synthetic"` or `"ieee"`). |
| `threshold` | `float` | **Existing** | `0.40` | Frozen cost-optimal decision threshold. |
| `model_status` | `str` | **New (Additive)** | `"ok"` \| `"unavailable"` | `"ok"` when primary model runs; `"unavailable"` triggers fallback amount rule. |
| `feature_completeness` | `float` | **New (Additive)** | `adapter_order_to_txn` | Ratio of non-null required signals ($0.0 \dots 1.0$). Never invented. |
| `explanation_status` | `str` | **New (Additive)** | `"ok"` \| `"unavailable"` | `"ok"` if SHAP additivity test passes ($\le 10^{-4}$); else `"unavailable"`. |
| `shadow` | `bool` | **New (Additive)** | `True` | Invariant flag: soft actions only, shadow evaluation mode active. |

---

## 4. Backward Compatibility Invariant

1. **Existing Clients**: Existing response fields (`transaction_id`, `fraud_probability`, `risk_score`, `risk_category`, `action`, `policy_rule_id`, `policy_reason`, `reasons`) remain unchanged in type and location.
2. **Additive Safety**: All new fields (`severity`, `suggested_action`, `rule_hits`, `ring_id`, `feature_completeness`, `shadow`) are purely additive extensions. No existing client response field is deprecated or mutated.


---

## 5. Authentication & Merchant Tenancy (`POST /v1/score`)

### Required Authorization Header
`POST /v1/score` and `POST /score` require Bearer API key authentication:
```http
Authorization: Bearer <api_key>
```

- **Key Format**: Prefix (`rg_live_` or `rg_test_`) followed by 32+ cryptographically random URL-safe bytes (e.g. `rg_live_WXk1LwpgE18Xcm_flep6YPKiBNvOWLIgykb2QAAXnhQ`).
- **Generation & Revocation**: Managed via `scripts/create_api_key.py`:
  - Create: `python scripts/create_api_key.py --merchant-id <merchant_id> --name "Label"`
  - Revoke: `python scripts/create_api_key.py --revoke <key_id>`
- **Storage**: Only the SHA-256 hash is persisted in the `api_keys` table. The plain key is shown once upon generation and never stored or logged.

### Tenancy and Merchant Identity Rules
1. **Source of Truth**: The merchant identity is determined strictly by the authenticated API key, not by client-controlled request fields.
2. **Body `merchant_id` Validation**:
   - If `merchant_id` is omitted from the request body: evaluation succeeds (`200 OK`) and is attributed to the authenticated merchant.
   - If `merchant_id` matches the key's merchant: evaluation succeeds (`200 OK`).
   - If `merchant_id` differs from the key's merchant: the request is rejected with `400 Bad Request` to prevent cross-tenant spoofing.
3. **Audit Trail**: Every scored transaction persists an immutable record to `audit_score_events` stamped with the authenticated `merchant_id`. No plain keys or hashes are ever logged or stored in audit records.
4. **Authentication Errors**: Missing, malformed, unknown, or revoked API keys return `401 Unauthorized` with a generic error detail (`"Invalid or missing authentication credentials"`), avoiding account enumeration.

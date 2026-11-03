# Phase E-4 Design Document: Rate Limiting, Audit Reconstruction & Schema Hardening

**Date:** 2026-11-04  
**Status:** Approved for Implementation  

---

## 1. Rate Limiting Architecture

### 1.1 Strategy and Trust Boundary
- **Order of Execution**: Authentication strictly precedes rate-limit evaluation.
  - If a request lacks valid authentication credentials, it is rejected immediately with `HTTP 401 Unauthorized`.
  - Unauthenticated attackers cannot exhaust an authenticated tenant's rate limit budget.
- **Keying**: Keyed by `api_key_id` (from the authenticated `APIKey` record).
  - Each key has an independent budget.
  - An exhausted budget for Merchant A has zero impact on Merchant B.
- **Configuration**:
  - Environment variable: `RATE_LIMIT_PER_MINUTE`.
  - Default: `60` requests per minute.
- **Response Contract on Exhaustion**:
  - Status code: `HTTP 429 Too Many Requests`.
  - Header: `Retry-After: <seconds_until_budget_replenished>` (e.g. `Retry-After: 60`).
  - Body: `{"detail": "Rate limit exceeded. Try again in X seconds."}`.
- **Coverage**:
  - Applies to all protected `/v1/*` routes (`POST /v1/score`, `GET /v1/decisions/{id}`, `GET /v1/decisions/{id}/audit`, `POST /v1/transactions/events`).
  - `/health` is open and unmetered.

### 1.2 Storage Decision: In-Process Sliding-Window Counter
- **Decision**: In-process thread-safe sliding-window counter (`InMemoryRateLimiter`).
- **Justification**:
  1. *Sub-millisecond Latency*: Online fraud evaluation requires <15ms response times; executing a database write and transaction commit for every inbound request would create database lock contention and degrade scoring throughput.
  2. *Zero Database Bloat*: Rate limiting counters are transient and do not require long-term ACID durability.
- **Architectural Limitation**:
  In a multi-process deployment (e.g., multi-worker Gunicorn/Uvicorn), memory is not shared across OS worker processes. Each worker enforces its own budget partition (effective limit = $N \times \text{limit}$). For horizontal production scaling across Kubernetes pods, a shared Redis store is the standard evolution path. For the hackathon reference implementation, an in-process sliding-window counter provides the highest performance and zero external dependencies.

---

## 2. Audit Reconstruction Endpoint: `GET /v1/decisions/{decision_id}/audit`

### 2.1 Route & Authentication
- **Path**: `GET /v1/decisions/{decision_id}/audit`
- **Method**: `GET`
- **Authentication**: `auth_merchant_id: str = Depends(get_api_key_merchant)`
- **Behavior**: Pure read-only query. Writes zero rows to any database table.

### 2.2 Tenant Scoping & Security Boundary
- Query looks up `AuditScoreEvent` matching `(decision_id, auth_merchant_id)`.
- If the decision does not exist OR belongs to another merchant:
  - Return `HTTP 404 Not Found` (never `403 Forbidden`).
  - Conceals the existence of decisions across tenants.

### 2.3 Response Payload Contract
```json
{
  "status": "success",
  "data": {
    "decision": {
      "decision_id": "dec_12345",
      "order_id": "ord_999",
      "merchant_id": "merch_abc",
      "channel": "paypal",
      "risk_score": 0.4500,
      "tier": "MEDIUM",
      "policy_rule": "STEP_UP_VERIFICATION",
      "policy_action": "STEP_UP_VERIFICATION",
      "severity": "warning",
      "suggested_action": "step_up_verify",
      "model_version": "candidate_lgbm_v1",
      "model_status": "loaded",
      "threshold": 0.40,
      "feature_completeness": 1.0,
      "explanation_status": "available",
      "shadow": true,
      "created_at": "2026-11-04T00:00:00Z"
    },
    "policy_trace": {
      "policy_rule": "STEP_UP_VERIFICATION",
      "policy_action": "STEP_UP_VERIFICATION",
      "suggested_action": "step_up_verify",
      "severity": "warning",
      "tier": "MEDIUM",
      "threshold": 0.40,
      "rule_hits": []
    },
    "shap_top_k": [
      {
        "feature": "amount",
        "value": 150.0,
        "attribution": 0.12,
        "direction": "increases_risk",
        "description": "High transaction amount increases risk"
      }
    ],
    "rule_hits": [],
    "feature_snapshot": {
      "amount": 150.0,
      "new_device_flag": 0.0,
      "failed_ratio": 0.0
    },
    "relay_events": [
      {
        "event_id": "WH-12345",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "status": "completed",
        "summary": "Capture completed",
        "received_at": "2026-11-04T00:01:00Z"
      }
    ]
  }
}
```

---

## 3. Removal of `/score` Unversioned Alias

- **Finding**: Task 1 confirmed zero callers in ShopPoint and ReturnGuard.
- **Action**: Delete `@router.post("/score")` from [`api/routes/score.py`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py).
- **Target State**: All scoring must use `POST /v1/score`. Requests to `POST /score` will return `HTTP 404 Not Found`. Update API contract in `docs/api/ml_contract.md`.

---

## 4. `FeatureBuilder` Merchant Requirement

- In [`features/builder.py`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/features/builder.py):
  - Change `FeatureBuilder.__init__(self, merchant_id: str, db_session: Any = None)`.
  - Calling `FeatureBuilder()` without arguments raises `TypeError`.
  - Update `build()` helper to accept and forward `merchant_id`.
  - Update all test callers in `tests/test_builder.py`.

---

## 5. Architectural Decision: Merchant as Tenant Entity

- Document in `docs/decisions.md`:
  - `merchants` table represents the primary tenant entity.
  - A distinct `tenants` table would introduce redundant indirection without architectural benefit.
  - All multi-tenant scoping and indexing keys on `merchant_id`.

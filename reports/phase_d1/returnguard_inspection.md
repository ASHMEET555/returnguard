# Phase D1 — Pre-Flight Inspection: ReturnGuard

## 1. Backend Framework and Server Entrypoint
- **Framework**: **FastAPI** (v0.141.1, Python 3.13) with Uvicorn.
- **Entrypoint**: `api/main.py` (`app = FastAPI(...)`).
  - Wire routers: `score.router`, `payments.router`, `webhooks.router`, `disputes.router`, `assistant.router`.
  - Health check: `GET /health` -> `{"status": "ok"}`.
- **Port Configuration**:
  - Uvicorn default port is **8000** (run via `uvicorn api.main:app --port 8000`).
  - Legacy `backend/main.py` also exists from Phase A/B for internal regression/audit testing with `settings.py`.

## 2. Risk Scoring Endpoint (`POST /v1/score`)
- **Route Definition**: `api/routes/score.py`
  - Decorator: `@router.post("/v1/score", response_model=ScoreResponse, status_code=200)`
  - Coordinate Service: `services/score.py` (`ScoringService`)

### Request Body Schema (`ScoreRequest`)
| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | `float` | **Yes** (`gt=0`) | Transaction amount in INR (or merchant currency unit). |
| `order_id` | `str` | No | Unique order/transaction ID. If omitted, falls back to `transaction_id` or generated timestamp ID. |
| `transaction_id` | `str` | No | Alias for `order_id`. |
| `channel` | `str` | No (default `"paypal"`) | Payment gateway / channel identifier. |
| `customer_id` | `str` | No (default `"cust_anonymous"`) | Customer identifier for history grouping. |
| `device_id` | `str` | No (default `"dev_default"`) | Device hash or fingerprint. |
| `geo_region` | `str` | No (default `"IN-KA"`) | Geo region ISO / state code. |
| `payment_method` | `str` | No (default `"card"`) | Payment method string. |
| `status` | `str` | No (default `"success"`) | Status of transaction. |
| `merchant_id` | `str` | No (default `"m_default"`) | Merchant account identifier. |
| `merchant_category` | `str` | No (default `"retail"`) | Merchant business category. |
| `timestamp` | `str` | No (default current ISO) | Transaction evaluation timestamp (ISO format). |
| `account_created` | `str` | No (default `timestamp`) | Timestamp when customer account was opened. |
| `prior_transactions` | `List[Dict[str, Any]]` | No (default `[]`) | Historical list of prior customer transactions used to compute sliding-window velocity and frequency features. |
| `features` | `Dict[str, float]` | No | Optional pre-computed 15-feature dictionary (if provided, bypasses raw history computation). |
| `ring_id` | `str` | No | Optional display-only graph ring cluster ID. |
| `force_unavailable` | `bool` | No (default `false`) | Test flag to simulate model unavailable fallback. |

### How Prior Transactions and Identifiers Are Used
- **Prior Transactions**: When `prior_transactions` is provided, `ScoringService._build_feature_row` combines prior rows with the current row into a Pandas DataFrame and calls `ml/features/build_features.py:build_features()`. This calculates the 15 features point-in-time: `velocity_5min`, `velocity_30min`, `velocity_60min`, `prior_txn_count`, `time_since_prev_txn_min`, `amount_zscore`, `new_device_flag`, `new_geo_flag`, etc. If omitted or empty, the transaction is treated as a clean cold start (`prior_txn_count=0`).
- **`order_id`**: Returned in `response.order_id` to correlate scoring decisions with merchant orders.
- **`channel`**: Stored and returned in `response.channel` (default `"paypal"`).

### Exact Response Fields (`ScoreResponse`)
```json
{
  "order_id": "ord_12345",
  "channel": "paypal",
  "risk_score": 0.085,
  "risk_score_100": 9,
  "tier": "LOW",
  "policy_rule": "MODEL_LOW_ALLOW",
  "policy_action": "ALLOW",
  "severity": "none",
  "suggested_action": "allow",
  "reason_codes": [
    { "feature": "amount", "direction": "decreases_risk", "shap_rank": 1 }
  ],
  "rule_hits": [],
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

## 3. Authentication & Network Boundary
- **Authentication Scheme**: **None**. `POST /v1/score` does not require an API key, bearer token, or HMAC signature.
- **Security Assessment & Known Limitation**: Because the scoring endpoint has no auth headers, it **must never be exposed directly to the public internet or client browsers**.
- **Access Policy**: Calls to `POST /v1/score` must originate strictly from the merchant backend network (ShopPoint server-to-server). Client browsers must never call ReturnGuard directly.

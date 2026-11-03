# Score Path Prior-Transaction Source Analysis

**Date:** 2026-11-04  
**Status:** Inspected & Verified  

---

## 1. Code Analysis

### 1.1 `api/routes/score.py`
In [`api/routes/score.py:96-146`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L96-L146):
1. The route parses `ScoreRequest` payload.
2. In lines 120–130, it validates every entry in `payload.prior_transactions`. If any entry contains a `merchant_id` that differs from `auth_merchant_id`, it rejects the request with `HTTP 400 Bad Request`.
3. In lines 138–144, it stamps `req_dict["merchant_id"] = auth_merchant_id` and stamps all entries in `req_dict["prior_transactions"]` with `auth_merchant_id`.
4. In line 146, it invokes:
   ```python
   result = service.score(req_dict, force_unavailable=force_unavail)
   ```
5. No database read of customer history, prior orders, or prior payments is performed in `score_transaction()` prior to calling `service.score()`.

### 1.2 `services/score.py`
In [`services/score.py:223-226`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/services/score.py#L223-L226):
```python
feature_row, completeness = self._build_feature_row(
    payload, payload.get("prior_transactions")
)
```
In `_build_feature_row()` (lines 83–145):
- The method constructs transaction context `curr_raw` from `transaction_dict`.
- If `prior_transactions` is passed in the argument list (derived from `payload.get("prior_transactions")`), it iterates through those dictionaries to assemble `all_raw`.
- It executes `build_features(df)` in-memory via pandas.
- No database query (`db.query()`, SQL `SELECT`, or repository call) exists anywhere in `services/score.py`.

---

## 2. Conclusion on History Source

**Finding:** History for the online risk score path (`POST /v1/score`) comes **strictly and exclusively from the request body** (`payload.prior_transactions`). It does **not** read from stored database tables during inference.

---

## 3. What the Phase E-2 Isolation Test Actually Proved

In Phase E-2, [`tests/test_tenant_isolation.py::test_1_customer_collision_history_isolation`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/tests/test_tenant_isolation.py#L80-L150) proved:
1. **Stateless Request Isolation**: Scoring a request for `cust_collision_test` under Merchant A does not contaminate subsequent or concurrent scoring requests for `cust_collision_test` under Merchant B.
2. **Strict Body Scoping**: Any foreign `merchant_id` embedded inside `prior_transactions` is rejected with `HTTP 400 Bad Request`, preventing tenant history spoofing via request payloads.
3. **Audit Scoping**: Audit rows written to `audit_score_events` are strictly stamped with the authenticated merchant's ID and isolated by tenant.
4. **Decision Scoping**: `GET /v1/decisions/{decision_id}` returns `404 Not Found` when accessed by any tenant other than the owner.

*Architectural Implication*: Because `services/score.py` is purely functional and stateless with respect to customer history tables, multi-tenant isolation in the scoring pipeline is governed by request-boundary validation and audit persistence scoping (`TenantScopedRepository`).

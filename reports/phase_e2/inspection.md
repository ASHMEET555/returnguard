# Phase E-2 Inspection Report: Merchant Tenancy & Storage Scoping

**Date:** 2026-11-03  
**Status:** VERIFIED  
**Repository:** ReturnGuard (`C:\Users\rg060\Desktop\Projects\Hackhathon\returnguard`)  
**Baseline Test Execution:** `reports/phase_e2/baseline_pytest.txt` (347 passed, 19 skipped, 1 failed)  

---

## 1. Table-by-Table Merchant Data Scoping Inventory

We audited all 12 tables defined in `db/models.py` holding merchant data:

| Table Name | Primary Key | Current Direct `merchant_id`? | Reached Via Join? | Reads Filter by Merchant? | Writes Stamp Merchant? |
|:---|:---:|:---:|:---:|:---:|:---:|
| `merchants` | `id` | Root (`id`) | No | Filtered by `id` | N/A (Tenant definition) |
| `customers` | `id` | Yes (`merchant_id`) | No | **No** (Often filtered by `id` only) | Yes (`merchant_id` stamped) |
| `addresses` | `id` | **No** | Yes (`Customer.id`) | **No** (Unscoped or via `customer_id`) | **No** (Lacks direct column) |
| `devices` | `id` | **No** | Yes (`Customer.id`) | **No** (Unscoped or via `customer_id`) | **No** (Lacks direct column) |
| `orders` | `id` | Yes (`merchant_id`) | No | **No** (e.g. `builder.py` queries by `id` only) | Yes (`merchant_id` stamped) |
| `payments` | `id` | Yes (`merchant_id`)* | No | **No** (Queried by `order_id` or `id`) | Optional / nullable |
| `payment_events` | `id` | **No** | N/A | **No** (Deduplicated by `event_id` only) | **No** (Unattributed) |
| `disputes` | `id` | **No** | Yes (`Payment` $\rightarrow$ `Order`) | **No** | **No** |
| `evidence_packs` | `id` | **No** | Yes (`Dispute` $\rightarrow$ `Payment`) | **No** | **No** |
| `evidence_submissions` | `id` | **No** | Yes (`EvidencePack` $\rightarrow$ `Dispute`) | **No** | **No** |
| `merchant_audits` | `id` | Yes (`merchant_id`) | No | Filtered by `merchant_id` | Yes (`merchant_id` stamped) |
| `audit_score_events` | `id` | Yes (`merchant_id`) | No | Filtered by `order_id` (Unscoped) | Yes (Stamped via Stage 2 API key) |

*\*Note: Added in Stage 2 as nullable.*

### Key Structural Findings:
1. **Tables Lacking Direct `merchant_id` Column:** `addresses`, `devices`, `payment_events`, `disputes`, `evidence_packs`, and `evidence_submissions` lack direct `merchant_id` foreign keys. To enforce strict single-tenant queries without multi-hop joins and prevent cross-tenant data leakage, direct indexed `merchant_id` columns must be added.
2. **Customer Collision Risk:** `customers.id` is not guaranteed globally unique across independent merchants (e.g., two different merchants can have customer `"cust_1"`). Lookups must be strictly scoped to `(merchant_id, customer_id)`.

---

## 2. History & Entity Queries in `services/`, `api/`, `features/`, `rings/`

1. **`services/score.py`**:
   - `ScoringService._build_feature_row()` (lines 118–159): Combines `curr_raw` with caller-provided `prior_transactions`. Currently takes `p.get("merchant_id", "m_default")` without validating that caller-provided prior history belongs to the authenticated merchant.
2. **`features/builder.py`**:
   - Line 115: `order_obj = session.query(Order).filter(Order.id == order_id).first()` reads an order without scoping by `Order.merchant_id == merchant_id`.
   - Line 168: `audit_record = session.query(AuditScoreEvent).filter(AuditScoreEvent.order_id == order_id).first()` reads audit record without scoping by `AuditScoreEvent.merchant_id == merchant_id`.
3. **`api/routes/score.py`**:
   - Stamped `merchant_id = auth_merchant_id` onto `AuditScoreEvent` during write (Stage 2).
   - Currently lacks read endpoints (e.g. `GET /v1/decisions/{decision_id}`) to inspect historical decisions under tenant isolation.
4. **`rings/`**:
   - Pure in-memory / algorithm module; contains zero database queries.

---

## 3. Baseline Test Suite Verification

- Executed `pytest` against `.venv/Scripts/pytest.exe`.
- Result: **347 passed, 19 skipped, 1 failed** (`test_artifact_hashes.py::test_frozen_artifacts_match_manifest`, known).
- Log recorded at `reports/phase_e2/baseline_pytest.txt`. Matches expected baseline.

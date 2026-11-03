# Phase E-2 Architecture & Tenancy Design: Merchant Data Isolation

**Date:** 2026-11-03  
**Status:** PROPOSED DESIGN (Prior to Implementation)  
**Repository:** ReturnGuard (`C:\Users\rg060\Desktop\Projects\Hackhathon\returnguard`)  

---

## 1. Tenancy Model & Identity Scope

### 1.1 Source of Truth for Identity
ReturnGuard treats the authenticated API credential (`Authorization: Bearer <key>`) as the **sole source of truth** for tenant identity (`merchant_id`).
- All reads and writes must be scoped to the authenticated `merchant_id`.
- Caller-supplied identifiers are strictly untrusted parameters evaluated against the authenticated merchant boundary.

### 1.2 Customer & History Lookups
- Customer IDs (e.g., `"cust_1"`, `"cust_anonymous"`) are common strings that repeat across independent merchants.
- **Rule:** Every customer, address, device, and historical transaction query must be keyed by the compound tuple:
  $$\text{Key} = (\text{merchant\_id}, \text{customer\_id})$$
- Merchant A's activity for `"cust_1"` must have **zero influence** on Merchant B's feature calculations, risk score, rule hits, or audit records for `"cust_1"`.

---

## 2. Policy on Prior Transactions with Foreign `merchant_id`: Reject with 400

### 2.1 The Decision: **REJECT WITH HTTP 400 BAD REQUEST**
If a request body to `/v1/score` contains `prior_transactions`, each item is inspected:
- If a prior transaction item explicitly specifies a `merchant_id` that differs from the authenticated `merchant_id`, ReturnGuard will **immediately reject the entire request with `HTTP 400 Bad Request`**.
- If a prior transaction item omits `merchant_id`, it is automatically attributed to the authenticated `merchant_id`.

### 2.2 Justification:
1. **Consistency with Top-Level Score Contract**: Stage 2 established that a mismatch between top-level `payload.merchant_id` and the authenticated key rejects with `400 Bad Request`. Applying the identical rule to sub-records maintains strict API consistency.
2. **Fail-Closed Security**: Silently ignoring or remapping foreign records hides misconfigured data pipelines in the merchant's backend or potential poisoning attacks. A hard `400` forces the client to fix data leakage at the source.
3. **Audit Integrity**: ReturnGuard's audit trail guarantees that every record used to compute a score belongs to the billing tenant. Rejecting foreign records guarantees zero pollution of feature vectors.

---

## 3. Storage Scoping & Schema Migration Design

### 3.1 Direct `merchant_id` on All Merchant-Data Tables
To eliminate multi-hop joins and enforce indexed tenant filtering, the following tables will be updated:

| Table | Target Column | Migration Strategy | Backfill Rule |
|:---|:---:|:---:|:---|
| `addresses` | `merchant_id` | Add `VARCHAR(64)` FK to `merchants.id`, indexed | Backfill via `Customer.merchant_id` if rows exist; fallback `"merch_legacy"` |
| `devices` | `merchant_id` | Add `VARCHAR(64)` FK to `merchants.id`, indexed | Backfill via `Customer.merchant_id` if rows exist; fallback `"merch_legacy"` |
| `payment_events` | `merchant_id` | Add `VARCHAR(64)` FK to `merchants.id`, indexed | Nullable; default `"merch_legacy"` for pre-existing un-attributed events |
| `disputes` | `merchant_id` | Add `VARCHAR(64)` FK to `merchants.id`, indexed | Backfill via `Payment` $\rightarrow$ `Order.merchant_id`; fallback `"merch_legacy"` |
| `evidence_packs` | `merchant_id` | Add `VARCHAR(64)` FK to `merchants.id`, indexed | Backfill via `Dispute.merchant_id`; fallback `"merch_legacy"` |
| `evidence_submissions` | `merchant_id` | Add `VARCHAR(64)` FK to `merchants.id`, indexed | Backfill via `EvidencePack.merchant_id`; fallback `"merch_legacy"` |
| `payments` | `merchant_id` | Add indexed `VARCHAR(64)` FK | Backfill via `Order.merchant_id`; fallback `"merch_legacy"` |
| `audit_score_events` | `merchant_id` | Verified indexed `VARCHAR(64)` FK | Stamped by Stage 2 API key |

### 3.2 Idempotent SQLite / PostgreSQL Migration
The migration in `db/migrations.py` will:
1. Call `Base.metadata.create_all(bind=eng)` to create new tables.
2. Inspect existing columns and execute `ALTER TABLE <table> ADD COLUMN merchant_id VARCHAR(64)` inside safe idempotency blocks.
3. Check row counts and safely backfill any legacy rows where `merchant_id IS NULL`.

---

## 4. Repository Access Layer Architecture

To prevent raw unscoped queries (`db.query(Model).filter(Model.id == id).first()`), a tenant-scoped repository layer will be introduced (`db/repositories/tenant_scoped.py`):
```python
class ScopedRepository:
    def __init__(self, db: Session, merchant_id: str):
        self.db = db
        self.merchant_id = merchant_id

    def get_order(self, order_id: str) -> Optional[Order]:
        return self.db.query(Order).filter(Order.id == order_id, Order.merchant_id == self.merchant_id).first()

    def get_decision(self, decision_id: str) -> Optional[AuditScoreEvent]:
        return self.db.query(AuditScoreEvent).filter(AuditScoreEvent.decision_id == decision_id, AuditScoreEvent.merchant_id == self.merchant_id).first()
```
- No query in `api/` or `services/` may query merchant data without the `merchant_id` parameter.

---

## 5. Security & Error Model: 404 vs 403

- **Requirement:** Any request attempting to access another tenant's resource by ID (e.g. `GET /v1/decisions/{decision_id}`) must return **`404 Not Found`**, **never `403 Forbidden`**.
- **Security Justification:** Returning `403 Forbidden` confirms to an attacker that a resource exists with that ID under another organization. Returning `404 Not Found` treats foreign resources as non-existent within the tenant's bounded context, preventing identifier enumeration.

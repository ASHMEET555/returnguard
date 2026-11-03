# Stage 2 Inspection Report: ReturnGuard Authentication & Tenancy Baseline

**Date:** 2026-11-03  
**Status:** VERIFIED  
**Repository:** ReturnGuard (`C:\Users\rg060\Desktop\Projects\Hackhathon\returnguard`)  
**Baseline Test Execution:** `reports/product_stage2/baseline_pytest.txt` (333 passed, 19 skipped, 1 failed)  

---

## 1. Route Table & Current Authentication Inventory

Inspection of `api/main.py` and `api/routes/*`:

| Router File | Method | Path | Current Auth | Purpose / Status |
|:---|:---:|:---|:---:|:---|
| [api/main.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/main.py#L21) | `GET` | `/health` | **None** | Application health probe. Returns `{"status": "ok"}`. |
| [api/routes/score.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L81) | `POST` | `/v1/score` | **None** | Primary online risk scoring and policy evaluation. |
| [api/routes/score.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/score.py#L87) | `POST` | `/score` | **None** | Schema alias to `/v1/score`. |
| [api/routes/webhooks.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/webhooks.py#L17) | `POST` | `/v1/paypal/webhooks` | **PayPal Signature** | Verifies PayPal webhook cryptographic headers via `verify_webhook_signature()`. |
| [api/routes/payments.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/payments.py#L1) | — | `/v1/payments/*` | None (Stub) | Empty router stub (`TODO` comments only). |
| [api/routes/disputes.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/disputes.py#L1) | — | `/v1/disputes/*` | None (Stub) | Empty router stub (`TODO` comments only). |
| [api/routes/assistant.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/api/routes/assistant.py#L1) | — | `/v1/assistant/*` | None (Stub) | Empty router stub (`TODO` comments only). |

**Conclusion:** Prior to Stage 2, `POST /v1/score` and `POST /score` have **no authentication dependency**. Anyone can invoke the risk scoring engine anonymously. `POST /v1/paypal/webhooks` uses PayPal webhook transmission headers and is left untouched.

---

## 2. Request Body `merchant_id` Reads & Storage Writes

### 2.1 Request Body Reads
- **`api/routes/score.py`**:
  - `ScoreRequest` model defines `merchant_id: Optional[str] = Field(default="m_default")`.
  - Serialized via `payload.model_dump()` and passed into `services.score.ScoringService.score()`.
- **`services/score.py`**:
  - `ScoringService._build_feature_row()` reads `transaction_dict.get("merchant_id", "m_default")` to construct tabular feature frames for feature derivation.
  - Crucially, client requests currently dictate the `merchant_id`.

### 2.2 Storage Writes & Data Mapping
- **`db/models.py`**:
  - `Merchant` (table `merchants`): Primary key `id` (`VARCHAR(64)`).
  - `Order` (table `orders`): `merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=False)`.
  - `Customer` (table `customers`): `merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=False)`.
  - `MerchantAudit` (table `merchant_audits`): `merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=False)`.
  - `AuditScoreEvent` (table `audit_score_events`): Links to `order_id` (`ForeignKey("orders.id")`). Does not currently contain a direct `merchant_id` column; an order references a merchant.

---

## 3. Database Schema Synchronization & Idempotency

- [db/models.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/models.py) defines declarative entities inheriting from `db.session.Base`.
- [db/migrations.py](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/migrations.py):
  - Calls `Base.metadata.create_all(bind=eng)` to create any newly registered tables idempotently.
  - Inspects existing tables (such as `audit_score_events`) using `sqlalchemy.inspect` to add any missing columns via `ALTER TABLE ... ADD COLUMN ...` inside safe `try/except` blocks.
  - Safe for multiple repeated executions on both SQLite and PostgreSQL.

---

## 4. Baseline Test Suite Verification

- Ran `pytest` against Python virtual environment `.venv/Scripts/pytest.exe`.
- Output recorded at [baseline_pytest.txt](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/product_stage2/baseline_pytest.txt).
- **Results:**
  - **333 passed**
  - **19 skipped**
  - **1 failed** (`tests/test_artifact_hashes.py::test_frozen_artifacts_match_manifest`, known missing historical binary `phase17_lgbm.pkl`).
  - Exactly matches expected baseline.

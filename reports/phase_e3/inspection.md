# Phase E-3 Inspection Report: Webhook Ownership & Event Relay

**Date:** 2026-11-03  
**Status:** Complete  
**Baseline Test Results:** 353 passed, 19 skipped, 1 failed (known manifest test `test_artifact_hashes.py::test_frozen_artifacts_match_manifest`)  
**Baseline Output Path:** [`reports/phase_e3/baseline_pytest.txt`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/reports/phase_e3/baseline_pytest.txt)

---

## 1. Overview and Problem Definition

Under clean architectural boundaries and the hackathon ownership rules:
1. **ShopPoint** is the store and the sole PayPal API client. It manages PayPal credentials, receives PayPal webhooks (`POST /api/v1/payments/paypal/webhook`), and verifies transmission signatures against PayPal's verification endpoint (`POST /v1/notifications/verify-webhook-signature`).
2. **ReturnGuard** is the fraud-risk decision and audit platform. It must **never** hold PayPal credentials, call PayPal APIs, or perform external signature validation.
3. Currently in ReturnGuard:
   - `api/routes/webhooks.py` exposes `POST /v1/paypal/webhooks` with PayPal cryptographic signature verification headers.
   - `payments/webhooks.py` reads `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_WEBHOOK_ID` and attempts OAuth client credentials token acquisition to call PayPal's verification REST API.
   - `db/models.py` defines `PaymentEvent.event_id` with a global unique index (`unique=True`), which conflicts with multi-tenant isolation where different merchants might receive or relay identical external event identifiers.
   - `.env.example` lists `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV`, and `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.

---

## 2. Grep Inventory of PayPal Credentials and Webhook References

### 2.1 ReturnGuard Repo Hits
- **`.env.example`**:
  - Line 1: `PAYPAL_CLIENT_ID=`
  - Line 2: `PAYPAL_CLIENT_SECRET=`
  - Line 3: `PAYPAL_WEBHOOK_ID=`
  - Line 11: `NEXT_PUBLIC_PAYPAL_CLIENT_ID=`
- **`payments/webhooks.py`**:
  - Line 75: `resolved_webhook_id = webhook_id or os.getenv("PAYPAL_WEBHOOK_ID")`
  - Line 76: `client_id = os.getenv("PAYPAL_CLIENT_ID")`
  - Line 77: `client_secret = os.getenv("PAYPAL_CLIENT_SECRET")`
- **`api/routes/webhooks.py`**:
  - Line 14: `router = APIRouter(prefix="/v1/paypal", tags=["webhooks"])`
  - Line 17: `@router.post("/webhooks", status_code=status.HTTP_200_OK)`
- **`tests/test_webhooks.py`**:
  - Line 73: `response = client.post("/v1/paypal/webhooks", json=payload, headers=headers)`
  - Line 115: `resp1 = client.post("/v1/paypal/webhooks", json=payload, headers=headers)`
  - Line 120: `resp2 = client.post("/v1/paypal/webhooks", json=payload, headers=headers)`
  - Line 150: `response = client.post("/v1/paypal/webhooks", json=payload, headers=headers)`
- **Documentation & Stubs**:
  - `01-brief.md`: Line 116 (`/v1/paypal/webhooks` raw route to be retired after test migration)
  - `02-architecture.md`: Lines 46, 48 (documents that raw route holds PayPal client credentials and conflicts with ownership rule)
  - `03-phases.md`: Lines 63, 69 (checkbox for removing raw route and PayPal credentials)
  - `README.md`: Lines 56–58 (specifies PayPal credentials belong in ShopPoint, never in ReturnGuard)
  - `payments/paypal_client.py`: Lines 1–5 (unpopulated stub)
  - `disputes/paypal_disputes.py`: Lines 1–9 (unpopulated stub)

### 2.2 ShopPoint Repo Hits
- **`.env.example`**: Line 22 (`PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id`)
- **`config/config.env.example`**:
  - Line 22: `PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id`
  - Line 23: `PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret`
- **`app.js`**: Line 49 (`res.send(process.env.PAYPAL_CLIENT_ID)`)
- **`controller/payment.js`**: Lines 493, 495 (`process.env.PAYPAL_WEBHOOK_ID`)
- **`utilis/paypal.js`**:
  - Lines 51, 52 (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`)
  - Lines 372, 382, 389 (`PAYPAL_WEBHOOK_ID` signature verification)
- **`utilis/returnguard.js`**:
  - Line 26: `process.env.RETURNGUARD_BASE_URL` (only invokes `POST /v1/score`)
  - No occurrence of `/v1/paypal/webhooks` or event relay forwarding logic.
- **Relay Forwarding Design Status**: **UNVERIFIED**. ShopPoint currently receives and verifies PayPal webhook signatures (completed in Stage 1), but has not yet implemented a relay client forwarding normalized events to ReturnGuard. This relay client will be built in Phase H or ShopPoint stage.

---

## 3. Database Schema: `PaymentEvent` Uniqueness Inspection

In [`db/models.py`](file:///C:/Users/rg060/Desktop/Projects/Hackhathon/returnguard/db/models.py#L231-L249):
```python
class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(String(64), primary_key=True)
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=True, index=True)
    event_id = Column(String(128), unique=True, nullable=False, index=True)
    event_type = Column(String(128), nullable=False)
    summary = Column(String(255), nullable=True)
    resource_type = Column(String(64), nullable=True)
    payload_json = Column(Text, nullable=False)
    received_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.UTC), nullable=False)
    status = Column(String(32), default="processed", nullable=False)
```

**Finding:**
`event_id` is currently constrained by a global unique index (`unique=True`).
Under multi-tenancy:
- If Merchant A receives event `WH-100` and Merchant B receives event `WH-100`, the global index prevents Merchant B from storing their event.
- The constraint must be modified to a composite unique constraint `(merchant_id, event_id)` (`UniqueConstraint("merchant_id", "event_id", name="uq_payment_events_merchant_event")`).
- SQLite table recreation/index alteration and PostgreSQL constraint alterations must be handled idempotently in `db/migrations.py`.

---

## 4. Current Test Suite State
- **Baseline Run**:
  - Passed: 353
  - Skipped: 19
  - Failed: 1 (known `test_artifact_hashes.py::test_frozen_artifacts_match_manifest` due to historical `phase17_lgbm.pkl`)
- **Webhooks Tests to Migrate**:
  - `test_cert_url_validation_security`: Signature helper test; moves/stays as internal unit test or verified in ShopPoint.
  - `test_webhook_successful_processing`: Migrates to relay endpoint (`POST /v1/transactions/events`).
  - `test_webhook_idempotency_duplicate_replay`: Migrates to relay endpoint, asserting `(merchant_id, event_id)` idempotency.
  - `test_webhook_signature_failure_rejected`: Signature checking is handled by ShopPoint (covered in ShopPoint `tests/d3_signature.test.js`); raw route now responds 410 Gone.
  - `test_webhook_event_types_coverage`: Migrates to relay event persistence.

# Phase E-3 Design Document: Webhook Relay & Normalized Event Ingestion

**Date:** 2026-11-03  
**Status:** Approved for Implementation  

---

## 1. Architectural Boundary and Trust Model

### 1.1 Separation of Responsibilities
- **ShopPoint (Storefront & PayPal Client)**:
  - Owns PayPal API credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`).
  - Acts as the public receiver for PayPal webhooks (`POST /api/v1/payments/paypal/webhook`).
  - Verifies cryptographic signatures using PayPal's verification API.
  - Normalizes verified events and relays them securely to ReturnGuard via ReturnGuard's authenticated relay endpoint.
- **ReturnGuard (Risk Manager & Dispute Audit)**:
  - **Zero PayPal Credentials**: Holds no client IDs, secrets, or webhook IDs.
  - **Zero Direct PayPal Ingestion**: Retires `POST /v1/paypal/webhooks` with `HTTP 410 Gone`.
  - **Authenticated Ingestion**: Ingests normalized events exclusively via `POST /v1/transactions/events` (or `POST /v1/events`).
  - **Strict Multi-Tenant Scoping**: All event reads, idempotency checks, and writes are scoped strictly to the authenticated `merchant_id` extracted from the Bearer API Key.

### 1.2 Trust Boundary Statement
ReturnGuard does not perform external PayPal cryptographic signature verification. Cryptographic authenticity is verified at the edge by the merchant's gateway (ShopPoint). ReturnGuard trusts only incoming requests bearing a valid merchant Bearer API Key (`Authorization: Bearer <key>`). The security perimeter relies on HTTPS transport security, high-entropy secret API keys, and constant-time HMAC key authentication.

---

## 2. Relay Endpoint Design: `POST /v1/transactions/events`

### 2.1 Route Definition
- **Method / Path**: `POST /v1/transactions/events`
- **Authentication**: `auth_merchant_id: str = Depends(get_api_key_merchant)`
- **Tags**: `["events"]`

### 2.2 Request Schema (`NormalizedEventRequest`)
```python
class PayPalReferences(BaseModel):
    order_id: Optional[str] = Field(None, description="PayPal Order ID (e.g. 5O190127TN364715T)")
    authorization_id: Optional[str] = Field(None, description="PayPal Authorization ID")
    capture_id: Optional[str] = Field(None, description="PayPal Capture ID")

class NormalizedEventRequest(BaseModel):
    event_id: str = Field(..., description="Unique event ID from PayPal or gateway (e.g. WH-12345)")
    event_type: str = Field(..., description="Normalized event type (e.g. PAYMENT.CAPTURE.COMPLETED)")
    order_reference: Optional[str] = Field(None, description="Merchant order reference / ID")
    paypal_references: Optional[PayPalReferences] = Field(None, description="Associated PayPal resource IDs")
    status: str = Field("completed", description="Event status")
    occurred_at: Optional[datetime.datetime] = Field(None, description="Event occurrence timestamp")
    merchant_id: Optional[str] = Field(None, description="Optional merchant ID; if present, must match API key")
    summary: Optional[str] = Field(None, description="Human-readable event summary")
    resource_type: Optional[str] = Field(None, description="Resource type (e.g. capture, authorization)")
    raw_payload: Optional[Dict[str, Any]] = Field(None, description="Original raw payload or details")
```

### 2.3 Authentication and Multi-Tenant Validation
1. **API Key Dependency**: Request must supply `Authorization: Bearer <valid_key>`. If absent or invalid, returns `HTTP 401 Unauthorized` with generic details (`"Invalid or missing authentication credentials"`).
2. **Merchant ID Consistency**: If `body.merchant_id` is supplied and does not equal `auth_merchant_id`, the endpoint immediately aborts with `HTTP 400 Bad Request` (`"merchant_id in payload does not match authenticated merchant"`), matching the fail-closed pattern established in Phase E-2 (`POST /v1/score`).
3. **Order Reference Scoping**: If `body.order_reference` is provided, ReturnGuard verifies that the order exists under `auth_merchant_id`. If the order does not exist or belongs to another merchant, ReturnGuard returns `HTTP 404 Not Found` (never `403 Forbidden` to avoid leaking cross-tenant order existence). If no `order_reference` is provided, the event is recorded without order linkage.

### 2.4 Idempotency Semantics
- **Composite Key**: `(merchant_id, event_id)` uniquely identifies an event within each merchant's namespace.
- **Deduplication Check**: Before inserting, ReturnGuard queries:
  ```python
  existing = db.query(PaymentEvent).filter_by(merchant_id=auth_merchant_id, event_id=body.event_id).first()
  ```
- **Replay Behavior**: If `existing` is found, ReturnGuard returns `HTTP 200 OK` with status `"duplicate"`, the stored event metadata, and message `"Duplicate event ignored idempotently"`. No new row is written; no mutation occurs.
- **Cross-Merchant Isolation**: An identical `event_id` submitted by Merchant B is treated as an independent new event for Merchant B, without colliding with Merchant A's record.

---

## 3. Database Schema Changes: `PaymentEvent` Composite Uniqueness

### 3.1 Model Update in `db/models.py`
Remove `unique=True` from `PaymentEvent.event_id`. Add a composite `UniqueConstraint`:
```python
class PaymentEvent(Base):
    __tablename__ = "payment_events"
    __table_args__ = (
        UniqueConstraint("merchant_id", "event_id", name="uq_payment_events_merchant_event"),
    )

    id = Column(String(64), primary_key=True)
    merchant_id = Column(String(64), ForeignKey("merchants.id"), nullable=False, index=True)
    event_id = Column(String(128), nullable=False, index=True)
    ...
```

### 3.2 Migration Strategy in `db/migrations.py`
In `run_migrations()`:
- Inspect existing unique constraints and indexes on `payment_events`.
- In SQLite: Recreate table or manage index cleanly without failing on re-runs.
- In PostgreSQL: Drop old single-column unique index `uq_payment_events_event_id` or `ix_payment_events_event_id` if unique, and create composite index/constraint `uq_payment_events_merchant_event`.
- The migration must be completely idempotent and executable multiple times without raising errors.

---

## 4. Retiring the Raw PayPal Webhook Route

### 4.1 Transition to HTTP 410 Gone
- The route `POST /v1/paypal/webhooks` in `api/routes/webhooks.py` is updated to return:
  ```json
  HTTP/1.1 410 Gone
  {
    "detail": "Raw PayPal webhook route has been retired. Relayed events must be submitted to POST /v1/transactions/events with API key authentication."
  }
  ```
- No database read, write, or signature verification is performed. State changes are zero.

### 4.2 Ordering Justification
1. **First**, create the new relay endpoint `POST /v1/transactions/events` and migrate all functional test cases (successful processing, deduplication, event types) to exercise the relay endpoint.
2. **Second**, remove PayPal credential references and signature verification dependencies from ReturnGuard.
3. **Third**, replace the implementation of `POST /v1/paypal/webhooks` with the `410 Gone` tombstone and verify via dedicated tests that any invocation returns 410 without database side effects.
*Justification*: Retiring the route after creating the relay endpoint ensures there is zero gap in test coverage and prevents regression in event ingestion logic.

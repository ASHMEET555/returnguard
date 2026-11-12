# ReturnGuard Implementation Roadmap & Phase Register

## 1. Purpose

This document is the implementation roadmap and phase register for ReturnGuard.

It records:
- The product architecture and ownership boundaries.
- The original implementation phases (A–J).
- The additional reviewer workflow and evidence-engine work.
- The approved technical contract and durable payment foundation.
- Implementation status, verification requirements, and acceptance gates.

### Status definitions

| Status | Meaning |
|---|---|
| DONE | Implementation reported complete. Retain relevant verification evidence. |
| IMPLEMENTED — VERIFY | Implementation reported complete, but runtime or integration verification remains. |
| PARTIAL / OPEN | Some work exists, but the phase is not complete. |
| APPROVED — NOT STARTED | Scope and contract are approved; implementation has not started. |
| TODO | Work remains to be completed. |

A reported test count or agent completion statement is not, by itself, proof of production readiness.

---

## 2. Product Architecture and Ownership

ReturnGuard is a reusable, embeddable, multi-tenant risk-management platform. ShopPoint is its first merchant integration.

### ReturnGuard owns

- Risk intelligence and scoring.
- Feature generation and risk policies.
- Decision explanations and audit records.
- Merchant-scoped payment projections.
- Reviews and investigations.
- Evidence ingestion, association, and completeness.
- Evidence packs and reviewer workflows.
- Risk analytics.
- JavaScript and React SDKs.
- Configurable merchant dashboard templates.

### ShopPoint owns

- Customers and orders.
- Merchant administrator authentication.
- PayPal credentials.
- PayPal authorization, capture, void, and refund execution.
- PayPal webhook signature verification.
- Durable local payment state.
- Payment state-machine transitions.
- Transactional outbox for merchant-side events.

### Integration boundary

ShopPoint is the first merchant integration, not a special case embedded into ReturnGuard's core architecture.

A second independent merchant integration is required to demonstrate that ReturnGuard is genuinely reusable and not tightly coupled to ShopPoint.

### Frontend and security requirements

- Native React SDK components are required.
- The configurable `MerchantDashboardTemplate` remains part of the integration model.
- A full-dashboard iframe must not replace native React embedding.
- AG Grid Community is mandatory for operational data grids.
- ReturnGuard server API keys must never be exposed in browser bundles.
- PayPal credentials must remain server-side.

---

## 3. Master Phase Register

| Phase | Scope | Current status |
|---|---|---|
| A | ML baseline and benchmark freeze | PARTIAL / OPEN |
| B | Features, velocity rules, and policy | PARTIAL / OPEN |
| C | ML scoring and API | PARTIAL / OPEN |
| D1 | PayPal authorization and scoring | PARTIAL / OPEN |
| D2 | Capture gate, review, and idempotency | PARTIAL / OPEN |
| D3 | Webhooks and reconciliation | PARTIAL / OPEN |
| E | Multi-tenancy, authentication, and audit | DONE — reported |
| F | JavaScript SDK | DONE — reported |
| G | React SDK and merchant embedding | IMPLEMENTED — VERIFY |
| H | ShopPoint integration | IMPLEMENTED — VERIFY |
| I | Evidence Engine | DONE — reported |
| I-R | Reviewer workflow and dashboard | DONE — reported |
| J | Final submission, demo, and release | TODO |
| Phase 0 | Technical contract | APPROVED |
| Phase 1 | ShopPoint Durable Payment Foundation | APPROVED — NOT STARTED |

---

## 4. Original Implementation Phases

### Phase A — ML Baseline and Benchmark Freeze

**Status: PARTIAL / OPEN**

Scope:
- Establish the baseline model and benchmark.
- Freeze the evaluation methodology.
- Preserve dataset and artifact provenance.
- Separate synthetic-data metrics from real-world metrics.
- Check for data leakage.
- Make experiments reproducible.
- Reconcile model performance against real data.

Completion requirements:
- Dataset provenance is documented.
- Evaluation results are reproducible.
- Synthetic and real-world performance are not conflated.
- Benchmark assumptions and limitations are documented.

### Phase B — Features, Velocity Rules, and Policy

**Status: PARTIAL / OPEN**

Scope:
- Implement deterministic feature generation.
- Add velocity-based rules.
- Define cold-start behavior.
- Map risk outputs to policy decisions.
- Support shadow mode.
- Preserve compatibility with legacy decision mappings where necessary.

Supported decision actions:

- `BLOCK`
- `STEP_UP_VERIFICATION`
- `ALLOW_WITH_MONITORING`
- `ALLOW`

Legacy mappings must remain compatibility mechanisms, not become the source of truth for the new decision model.

Completion requirements:
- Feature generation is deterministic.
- Cold-start behavior is defined.
- Velocity rules are tested.
- Policy mappings are explicit.
- Shadow-mode behavior is verified.

### Phase C — ML Scoring and API

**Status: PARTIAL / OPEN**

Scope:
- Version model artifacts.
- Implement deterministic feature generation.
- Provide explainability.
- Expose scoring through the API.
- Reconcile model outputs against real data.
- Verify deployment and database compatibility.

Completion requirements:
- Model versions are identifiable.
- Scoring is reproducible.
- Explanations are available.
- API behavior is tested.
- Deployment compatibility is verified.

### Phase D1 — PayPal Authorization and Scoring

**Status: PARTIAL / OPEN**

Scope:
- Integrate authorization flow with risk scoring.
- Preserve the boundary between ShopPoint's payment execution and ReturnGuard's risk intelligence.
- Ensure authorization data is associated with the correct merchant and payment transaction.

### Phase D2 — Capture Gate, Review, and Idempotency

**Status: PARTIAL / OPEN**

Scope:
- Gate capture based on risk decisions and review state.
- Prevent capture while a transaction is held for review.
- Enforce idempotency.
- Handle duplicate requests safely.
- Preserve the distinction between payment execution and risk decisions.

### Phase D3 — Webhooks and Reconciliation

**Status: PARTIAL / OPEN**

Scope:
- Process asynchronous payment events.
- Reconcile local payment state against PayPal.
- Handle out-of-order and duplicate events.
- Avoid treating an HTTP success response alone as proof of a successful financial operation.

Ownership:
- ShopPoint verifies PayPal webhook signatures.
- ShopPoint normalizes provider events.
- ReturnGuard receives authenticated, normalized events.

### Phase E — Multi-Tenancy, Authentication, and Audit

**Status: DONE — reported**

Scope:
- Merchant entities.
- API-key hashing.
- One-time API-key display.
- Key rotation and revocation.
- Tenant-scoped repositories.
- Tenant-aware rate limits.
- Audit records.

Reported historical verification: 373 tests.

The test suite must be rerun before release.

#### Multi-tenancy requirements

Multi-tenancy is part of the original ReturnGuard architecture and remains a non-negotiable requirement.

The authenticated merchant identity must come from verified API bearer tokens or signed JWT claims.

The client must not be allowed to select another tenant by submitting a `merchant_id` in the request body.

If the payload merchant ID conflicts with the authenticated merchant identity, reject the request with `403 Forbidden`.

Tenant isolation must cover:
- API requests.
- Database reads and writes.
- Payment ingestion.
- Refund ingestion.
- Reviews.
- Investigations.
- Evidence.
- Analytics.
- SDK operations.
- Background workers.
- Outbox processing.

A two-merchant test matrix is required across:

1. Capture Ingestion.
2. Refund Ingestion.
3. Review Listing.
4. Review Submission.
5. Investigation Sealing.
6. Analytics Aggregation.
7. Outbox Dispatch.

Phase E being reported complete does not eliminate the need to verify tenant isolation in the new payment and financial workflows.

### Phase F — JavaScript SDK

**Status: DONE — reported**

Scope:
- Typed JavaScript SDK.
- Scoring and decision APIs.
- Explanations.
- Review operations.
- Analytics.
- Model-performance access.
- Token provider.
- Cursor pagination.
- Typed errors.
- Retry handling.
- React-independent implementation.

Completion evidence should include:
- SDK build.
- Type checks.
- Tests.
- API compatibility verification.

### Phase G — React SDK and Merchant Embedding

**Status: IMPLEMENTED — VERIFY**

Scope includes:
- `RiskScoreBadge`
- `RiskSummary`
- `RiskDecisionGrid`
- `ReviewQueue`
- `RiskExplanation`
- `AuditTimeline`
- `useReviewQueue`
- Configurable `MerchantDashboardTemplate`

The dashboard template supports configurable workspaces, layouts, themes, and branding.

**AG Grid Community is mandatory** for operational grids.

Reported agent verification:
- 143/143 tests.
- Builds completed.

Still required:
- Verify the deployed runtime.
- Verify real tenant data.
- Verify grid behavior with operational datasets.
- Verify the native React integration.
- Confirm no sensitive server credentials enter browser bundles.

### Phase H — ShopPoint Integration

**Status: IMPLEMENTED — VERIFY**

Scope:
- Integrate native ReturnGuard React components.
- Keep server-side credentials on the server.
- Separate review workflows from financial synchronization.
- Preserve ShopPoint's ownership of PayPal operations.

Reported agent verification:
- Six integration tests.
- Client build completed.

Still required:
- Verify live tenant data.
- Test PayPal sandbox authorization and capture.
- Test void behavior.
- Test webhook processing.
- Test reconciliation.
- Verify deployed end-to-end behavior.

### Phase I — Evidence Engine

**Status: DONE — reported**

Scope:
- Evidence ingestion and storage.
- Evidence association.
- Evidence completeness checks.
- Grounded narrative generation.
- Prompt-injection safeguards.
- JSON and Markdown evidence packs.
- Human approval before submission.
- Canonical hashing.
- Approval invalidation when evidence changes.

Ownership:
- ReturnGuard prepares and manages evidence.
- A human approves the evidence pack.
- ShopPoint executes the actual submission.

Evidence sealing and investigation closure are separate operations.

### Phase I-R — Reviewer Workflow and Dashboard

**Status: DONE — reported**

Scope:
- Investigation state machine.
- Reviewer notes.
- Document requests.
- Investigation timeline.
- Append-only step log.
- Approve, reject, close, and reopen operations.

LLM output is advisory only.

Evidence sealing remains separate from investigation closure.

### Phase J — Final Submission, Demo, and Release

**Status: TODO**

Scope:
- Public documentation.
- Public demo.
- Repository readiness.
- Fresh-clone setup verification.
- End-to-end demo recording.
- Release evidence.
- Final integration verification.

Completion requirements:
- A fresh clone can be configured and run using documented steps.
- The demo shows the complete user-facing workflow.
- The integration boundaries are clear.
- Security-sensitive credentials are not exposed.
- Tests and release evidence are current.

---

## 5. Additional Approved Workstream

### Phase 0 — Technical Contract

**Status: APPROVED**

Phase 0 defines the technical contract for the durable payment foundation.

It establishes the rules that Phase 1 must implement and verify.

### Phase 1 — ShopPoint Durable Payment Foundation

**Status: APPROVED — NOT STARTED**

The purpose of Phase 1 is to make ShopPoint's payment lifecycle durable, idempotent, recoverable, and safe under concurrency and partial failures.

The following requirements are part of the approved contract.

---

## 6. Phase 1 Technical Requirements

### 6.1 SQLite and PostgreSQL Transaction Behavior

SQLite requirements:
- Enable WAL mode.
- Configure `busy_timeout = 30000`.
- Use `BEGIN IMMEDIATE` for financial writes.
- Ensure connection-level configuration is applied consistently.
- Verify SQLAlchemy transaction lifecycle behavior.
- Test multiple connections and multiple processes.

PostgreSQL must use its native locking and transaction behavior.

Do not assume that SQLite and PostgreSQL provide identical concurrency semantics.

### 6.2 Unified Payment State Machine

The ShopPoint payment state machine must distinguish application-driven transitions from provider-driven asynchronous transitions.

States:

- `CREATED`
- `APPROVED`
- `AUTHORIZED`
- `SCORING`
- `PENDING_VERIFICATION`
- `HELD_FOR_REVIEW`
- `CAPTURE_PENDING`
- `VOID_PENDING`
- `RECONCILIATION_REQUIRED`
- `CAPTURED`
- `VOIDED`
- `FAILED`
- `EXPIRED`

Application-driven capture:

`HELD_FOR_REVIEW → CAPTURE_PENDING → CAPTURED`

If the outcome cannot be established:

`CAPTURE_PENDING → RECONCILIATION_REQUIRED`

Application-driven void:

`HELD_FOR_REVIEW → VOID_PENDING → VOIDED`

If the outcome cannot be established:

`VOID_PENDING → RECONCILIATION_REQUIRED`

Provider-driven events may confirm transitions such as:

`AUTHORIZED → VOIDED`

Recovery may return a pending transaction to `HELD_FOR_REVIEW` only when PayPal definitively confirms:
- The authorization is still active.
- No capture has occurred.
- No void has occurred.

Ambiguous outcomes must remain `RECONCILIATION_REQUIRED`.

Do not automatically convert ambiguous provider responses into `FAILED`.

### 6.3 MongoDB Atomicity and Projections

MongoDB replica-set transactions must persist:
- Payment state.
- Order projection.
- Outbox event.

These writes must be part of the same transaction.

For PaymentTransaction and Order updates, assert:

`matchedCount === 1`

A transaction must not silently commit when the expected document was not matched.

If commit acknowledgement is ambiguous, recover using provider evidence rather than assuming the transaction succeeded or failed.

### 6.4 Transactional Outbox

Outbox lifecycle:

- `PENDING`
- `CLAIMED`
- `DELIVERED`
- `EXHAUSTED`
- `LOCAL_ONLY`

Requirements:
- Atomic event claims.
- Lease expiry.
- Lease reclaim.
- Worker ownership validation during acknowledgement.
- Retry with backoff.
- Bounded retry attempts.
- Exhausted-event visibility.
- Operator replay.
- Stable event ID and payload during replay.

Financial capture events and review events must be separate documents and pipelines.

Event IDs must be deterministic and stable.

A stale worker must not be allowed to acknowledge an event claimed by another worker.

### 6.5 Refund Ledger

Refund lifecycle:

- `PENDING_CAPTURE_LINK`
- `LINKED`
- `FAILED_EXCEEDED_BALANCE`
- `FAILED_CURRENCY_MISMATCH`

Requirements:
- Handle refunds arriving before their capture event.
- Link pending refunds atomically when the corresponding capture arrives.
- Validate currency.
- Ensure cumulative refunds never exceed the capture gross amount.
- Preserve immutable refund ledger records.
- Derive or recompute the `refunded_amount` projection instead of blindly incrementing it.
- Enforce tenant-scoped uniqueness for provider identifiers.

Duplicate and out-of-order events must not cause duplicate financial effects.

### 6.6 Monetary Validation

Requirements:
- Use exact decimal strings.
- Require exactly two decimal places.
- Do not use floating-point arithmetic for money.
- Do not silently round invalid values.
- Do not assume USD when currency is missing.

Currency allowlist:

- `USD`
- `INR`
- `EUR`
- `GBP`
- `CAD`
- `AUD`

Invalid amounts or unsupported currencies must be rejected explicitly.

### 6.7 PayPal Recovery and Reconciliation

Recovery must match exact provider evidence across:
- `reference_id` / order ID.
- Authorization ID.
- Capture ID.
- Provider status.
- Amount.
- Currency.

Do not assume that the relevant purchase unit is always `purchase_units[0]`. Inspect all relevant purchase units.

Do not treat HTTP 200 alone as proof of successful capture.

A provider 404 must not automatically mean the payment is `FAILED`.

Uncertain outcomes must transition to `RECONCILIATION_REQUIRED`.

#### PayPal request idempotency

Persist a stable `PayPal-Request-Id` for each distinct operation.

- Reuse the same ID only when retrying the same operation.
- A genuinely new capture or void action must receive a new operation ID or version.
- Do not accidentally reuse an idempotency key for a different financial operation.

### 6.8 Multi-Tenancy

Multi-tenancy remains mandatory throughout Phase 1.

The authenticated merchant identity must be derived from:
- A verified API bearer token, or
- Verified signed JWT claims.

The client-supplied `merchant_id` must never override the authenticated identity.

If the payload merchant ID conflicts with the authenticated merchant, return `403 Forbidden`.

Tenant isolation must be enforced across:
- Payment transactions.
- Capture ingestion.
- Refund ingestion.
- Reviews.
- Investigations.
- Evidence.
- Analytics.
- Outbox events.
- Background workers.
- Deduplication keys.
- SDK-facing operations.

#### Required two-merchant test matrix

| Test area | Required verification |
|---|---|
| Capture Ingestion | Merchant A cannot access or mutate Merchant B's capture records. |
| Refund Ingestion | Refund events cannot cross tenant boundaries. |
| Review Listing | Each merchant sees only its own reviews. |
| Review Submission | A merchant cannot submit decisions for another merchant's review. |
| Investigation Sealing | Evidence and investigations remain tenant-scoped. |
| Analytics Aggregation | Aggregates do not include another merchant's data. |
| Outbox Dispatch | Events are dispatched and acknowledged within the correct tenant context. |

The tests must cover both read and write paths, including duplicate-event and background-worker behavior.

### 6.9 Automatic and Human Decision Semantics

An automatic ReturnGuard `ALLOW` decision must not fabricate a human `merchantDecision`.

Only manual operator actions populate `merchantDecision` and enqueue `RETURNGUARD_REVIEW`.

An automatic `ALLOW` emits:

`PAYMENT_CAPTURED`

It must not create a fake human review decision.

### 6.10 Deterministic Review Outbox IDs

Review event ID formula:

`evt_rev_<txnId>_<action>_<decisionId-or-local>_v<version>`

ReturnGuard audit matching must use:

`(merchant_id, entity_id, action)`

Duplicate events must not create duplicate audit records or mutate existing timestamps.

---

## 7. Phase 1 Acceptance Gates

Phase 1 is not complete until the following gates pass.

### Payment state machine
- All legal transitions are tested.
- Illegal transitions are rejected.
- Application-driven and provider-driven transitions are distinguished.
- Operation ownership is enforced.
- Ambiguous outcomes enter `RECONCILIATION_REQUIRED`.

### PayPal recovery
- Recovery uses exact provider evidence.
- Amount and currency are validated.
- All relevant purchase units are inspected.
- HTTP 200 is not treated as sufficient proof of capture.
- A 404 does not automatically become `FAILED`.
- Idempotency keys are stable for retries of the same operation.

### MongoDB atomicity
- Payment state, Order projection, and outbox are persisted atomically.
- `matchedCount === 1` is asserted for expected updates.
- Commit acknowledgement ambiguity is handled safely.

### Outbox
- Claims are atomic.
- Lease expiry and reclaim work.
- Stale workers cannot acknowledge another worker's claim.
- Retries are bounded.
- Exhausted events are visible.
- Operator replay preserves event ID and payload.

### Refund ledger
- Duplicate refunds are safe.
- Out-of-order refunds link correctly.
- Concurrent partial refunds cannot exceed the capture balance.
- Pending refunds link exactly once.
- Currency mismatches are rejected.

### SQLite
- WAL is enabled.
- `busy_timeout` is configured per connection.
- `BEGIN IMMEDIATE` works with the SQLAlchemy transaction lifecycle.
- Multi-connection and multi-process tests pass.

### Multi-tenancy
- Two-merchant tests pass across all seven required vectors.
- Reads and writes are tenant-scoped.
- Deduplication is tenant-scoped.
- Workers cannot cross tenant boundaries.
- Reviews, investigations, evidence, and analytics remain isolated.

### Decision semantics
- Automatic ALLOW does not fabricate a human decision.
- Manual review actions populate `merchantDecision`.
- Correct outbox events are emitted.

### Monetary correctness
- Decimal validation is exact.
- Invalid precision is rejected.
- Unsupported currencies are rejected.
- No floating-point money calculations are used.

### Operational recovery
- Failed and exhausted events are visible.
- Ambiguous payment states are recoverable.
- Operators can identify and replay eligible events.
- Recovery does not create duplicate financial effects.

---

## 8. Cross-Cutting Non-Negotiables

1. ReturnGuard must remain merchant-agnostic.
2. ShopPoint must remain the owner of PayPal execution and webhook signature verification.
3. Tenant identity must come from verified authentication, not client-supplied fields.
4. Financial operations must be idempotent and recoverable.
5. Ambiguous provider outcomes must not be guessed.
6. Money must use exact decimal handling.
7. Payment state, Order projection, and outbox persistence must be atomic where specified.
8. Human review decisions must remain distinct from automated risk decisions.
9. Evidence approval and investigation closure must remain separate.
10. Native React SDK embedding must be preserved.
11. AG Grid Community remains mandatory for operational grids.
12. No server API keys or PayPal credentials may enter browser bundles.
13. Reported implementation status must be supported by current verification evidence.

---

## 9. Open Verification Items

Before declaring the platform release-ready, verify:

- Phase A–D completion and real-data reconciliation.
- Current test results for Phase E.
- JavaScript SDK build and API compatibility.
- React SDK runtime behavior and AG Grid integration.
- ShopPoint sandbox payment lifecycle.
- Webhook signature verification and event normalization.
- Payment reconciliation and recovery.
- Phase 1 acceptance gates.
- Two-merchant isolation across all required vectors.
- Evidence-pack approval and invalidation.
- Reviewer workflow and audit behavior.
- Fresh-clone setup and deployment instructions.
- Public demo and end-to-end recording.

Previously exposed credentials should be rotated if this has not already been completed.

---

## 10. Changelog

| Change | Description |
|---|---|
| Original roadmap | Phases A–J established. |
| Phase D refinement | Split into D1 authorization and scoring, D2 capture and review, D3 webhook and reconciliation. |
| Evidence Engine | Added Phase I. |
| Reviewer workflow | Added Phase I-R. |
| Technical contract | Added approved Phase 0. |
| Durable payment foundation | Added approved Phase 1 with payment, outbox, refund, reconciliation, monetary, and tenancy requirements. |
| Multi-tenancy clarification | Reaffirmed tenant isolation as an original architectural requirement and added explicit two-merchant acceptance coverage for the new payment workflows. |
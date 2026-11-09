# ReturnGuard Architecture & Evaluation Decisions

This document formally records architectural, evaluation, and policy decisions established during Phase A.

---

### D-M1: Loss Function & Target Imbalance Handling
- **Decision**: Binary fraud classification ($y \in \{0, 1\}$) with severe class imbalance (~1.35% positive prevalence in training). LightGBM candidate model uses `scale_pos_weight = 72.8478` ($N_{\text{neg}} / N_{\text{pos}}$ on training days 0–39).
- **Rationale**: Direct loss re-weighting forces gradient updates to penalize missed positive cases without distorting raw feature representations.

---

### D-M2: Recall Constraint & Operating Threshold Trade-off (RESOLVED)
- **Decision**: Operating thresholds are locked exclusively on validation data:
  - **Synthetic Model (`candidate_lgbm_v1.pkl`)**: Locked at **$\tau = 0.40$** (Validation Recall $87.72\% \ge 80\%$, cost-optimal at ₹54,827.42).
  - **IEEE Phase 17 Model (`phase17_lgbm.pkl`)**: Locked at **$\tau = 0.35$** (Validation Recall $82.41\% \ge 80\%$, cost-optimal at 1,896,478 cost units).
- **M2 Trade-off Formalization**:
  - On IEEE validation data, any threshold $\tau \ge 0.40$ causes recall to drop below the mandatory 80% floor ($77.60\%$ at $\tau = 0.40$).
  - Although $\tau = 0.35$ produces a higher alert volume ($45.00\%$, FP: 37,002), it is the lowest-cost operating point that satisfies the $\ge 80\%$ recall floor.
  - On the held-out test split, $\tau = 0.35$ delivers $79.80\%$ recall (within $0.2\%$ of the $80\%$ validation target, within empirical noise bounds). Thresholds are never tuned on the test split.

---

### D-M3: IEEE Precision Target
- **Decision**: Program goal in Phase C is to improve IEEE precision above the baseline 6.3% on validation split while strictly preserving the $\ge 80\%$ recall constraint.
- **Rationale**: An extremely low precision (< 6%) floods merchant fraud operations with false positive investigations.

---

### D-M4: Currency Unit Assumption (UNVERIFIED)
- **Decision**: IEEE-CIS dataset `TransactionAmt` values are assumed to represent currency units directly convertible to ₹ for cost function evaluation, marked explicitly as **UNVERIFIED**.
- **Rationale**: The public IEEE-CIS dataset does not specify transaction currencies. Treating units consistently enables quantitative comparison between synthetic and external benchmarks.

---

### D-M5: Database Layer (PostgreSQL Primary, SQLite Test Harness)
- **Decision**: PostgreSQL is the primary production database (utilizing native `JSONB` for `feature_snapshot_json`), while SQLite is supported for fast in-memory test runs (using `JSON` fallback).
- **Implementation**: Database schema migrations (`db/migrations.py`) are strictly idempotent and dynamically adapt column types to the active engine.

---

### D-M6: Vector Database Out of Scope
- **Decision**: Vector databases (e.g., Pinecone, Chroma, pgvector) are excluded from the ReturnGuard architecture.
- **Rationale**: Return-abuse graph rings, device clusters, and velocity tracking operate on deterministic relational links and memory hash stores. Vector similarity is unnecessary and adds operational complexity.

---

### D-M7: Sponsor Requirements Enforcement
- **Decision**: ReturnGuard strictly fulfills sponsor tracks for **PayPal** (sandbox Orders v2, Webhooks, Disputes API) and **AG Grid** (merchant investigation grid).
- **Constraint**: No Razorpay APIs, SDKs, or branding may be introduced into the repository.

---

### D-policy: Policy Action Semantics (BLOCK = Investigate)
- **Decision**: The policy action `BLOCK` strictly denotes **"route to investigation as a high-priority case for human review."**
- **Safety Invariant**: Under no circumstances does `BLOCK` or any ReturnGuard decision auto-cancel, void, decline, or silently withhold payment funds.

---

### D-cost: Asymmetric Cost Function
- **Decision**: Adopt the verified financial cost model:
  $$\text{Cost} = (\text{FP} \times ₹50) + \sum_{i \in \text{FN}} (0.50 \times \text{Amount}_i)$$
- **Retirement**: Legacy COD/RTO Net ₹ profit formulas are fully retired.

---

### D-B1: `spike_velocity` Rule Threshold Derivation
- **Decision**: Calibrate rule thresholds for `spike_velocity` strictly on the validation split (Days 40–49, 34,735 legitimate transactions) at the 99th percentile of legitimate traffic:
  - `velocity_5min`: 99th percentile = 0.0 (firing condition: $> 0$)
  - `velocity_30min`: 99th percentile = 1.0 (firing condition: $> 1$)
  - `velocity_60min`: 99th percentile = 1.0 (firing condition: $> 1$)
- **Action**: When any condition is met, policy action escalates to `REVIEW` with reason `HIGH_VELOCITY_BURST`.
- **Rationale**: Never calibrate rule thresholds on test splits; 99th percentile of legitimate behavior ensures the false-positive review rate introduced by the velocity rule remains $\le 1\%$.

---

### D-B2: Feature Leakage Verification Methodology
- **Decision**: Verify point-in-time (PIT) leakage using perturbation-based testing on 500 stratified customer-time pairs (150 cold-start, 150 mid-history, 200 uniform random).
- **Invariants**:
  1. *Future Injection Invariance*: Injecting synthetic transactions into customer history at $t + 1\text{ min}$ and $t + 10\text{ min}$ must yield exactly 0 difference ($\text{atol}=0, \text{rtol}=0$) across all 15 feature dimensions computed at evaluation time $t$.
  2. *Truncation Equivalence*: Truncating raw transaction history to $t$ before computing features must equal features computed against the full database at $t$ with exact 0 tolerance.
- **Rationale**: Confirms that sliding window queries strictly use `timestamp < t` and temporal boundaries are leak-free.

---

### D-B3: Fraud Ring Graph Builder Architecture
- **Decision**: Ring detection is display-only and operates via disjoint-set (union-find) clustering with path compression:
  - Canonical edge ordering ensures deterministic component discovery regardless of row input order.
  - Threshold: Components with fewer than 3 connected entities are discarded (`min_size = 3`).
  - Strict Non-Interference: Phone numbers and address entities are external to the model. Ring attributes (`ring_size`, `ring_return_rate`) are display-only UI metadata; they must never enter the model feature vector, LightGBM probability scoring, or policy decision engine.

---

### D-B4: Deferral of IEEE Leakage Check to Phase C
- **Decision**: External IEEE-CIS dataset evaluation and its dedicated point-in-time leakage audit are explicitly moved to Phase C.
- **Rationale**: Phase B focuses entirely on feature builder determinism, sliding window verification, rules calibration, and ring graph generation on synthetic transaction data without model retraining or test split contamination.


---

### D-E1: Merchant Entity as the Tenant (No Redundant Tenants Table)
- **Decision**: The existing `merchants` table serves as the primary tenant entity across ReturnGuard. A separate `tenants` table is not introduced.
- **Context & Rationale**:
  1. *Entity Correspondence*: Every business using ReturnGuard is an independent merchant. There is a strict 1:1 mapping between a tenant boundary and a registered merchant organization.
  2. *Indirection Overhead*: Creating a `tenants` table would introduce redundant foreign key joins (`orders` -> `merchants` -> `tenants`) without providing functional partitioning.
  3. *Clean Architecture Scoping*: All tenant-scoped entities (`customers`, `addresses`, `devices`, `orders`, `payments`, `payment_events`, `disputes`, `evidence_packs`, `audit_score_events`, `api_keys`) link directly via `merchant_id`. Compound keys (such as `(merchant_id, customer_id)` and `(merchant_id, event_id)`) enforce strict cryptographic and data isolation at the database layer.

---

### D-E2: Phase E Architecture Closure & Tenancy Invariants
- **Decision**: Phase E (Multi-Tenancy, Authentication & Tenant Hardening) is formally closed with the following locked architectural guarantees:
  1. *Authentication Enforcement*: Every `/v1/*` endpoint requires Bearer API Key authentication (`Authorization: Bearer <key>`). The public health check `/health` is the sole unauthenticated path.
  2. *Tenant Identity*: Tenant identity is extracted exclusively from the validated API key (`auth_merchant_id`). Any conflicting `merchant_id` in request payloads causes an immediate fail-closed `HTTP 400 Bad Request`.
  3. *Information Concealment*: Cross-tenant resource lookups (decisions, orders, events) return `HTTP 404 Not Found` (never `403 Forbidden`) to eliminate resource enumeration side-channels.
  4. *Zero ReturnGuard PayPal Footprint*: ReturnGuard holds zero PayPal client credentials, tokens, or webhook secrets. The storefront (`ShopPoint`) is the sole PayPal client. Incoming events are ingested via the authenticated normalized relay endpoint `POST /v1/transactions/events`, and the legacy route `POST /v1/paypal/webhooks` is retired with `HTTP 410 Gone`.
  5. *Per-Key Sliding-Window Rate Limiting*: Rate limiting is enforced per API key (`RATE_LIMIT_PER_MINUTE`, default 60) in-process after authentication, returning `HTTP 429 Too Many Requests` with `Retry-After`. Unauthenticated traffic cannot exhaust tenant budgets.
  6. *Read-Only Audit Reconstruction*: `GET /v1/decisions/{decision_id}/audit` provides immutable, read-only decision reconstruction for the owning tenant with zero state mutation.
---

### D-I1: Point-in-Time Case File & Alias Isolation
- **Decision**: All dispute investigations construct a strict point-in-time snapshot as-of the disputed transaction cutoff (`target_order.order_time` or dispute timestamp). All real IDs (`merchants.id`, `orders.id`, `refunds.id`, etc.) are mapped to deterministic sanitized aliases (`T1`, `O1..On`, `R1..Rn`, `D1..Dn`).
- **Rationale**: Prevents data leakage from subsequent orders or post-dispute actions. Completely eliminates private PII and real IDs from being ingested by LLM reasoning layers.

---

### D-I2: LLM Boundary & Non-Interference
- **Decision**: The LLM is strictly an advisory synthesizer of findings and writer of draft narratives. The LLM is prohibited from setting, recalculating, or modifying risk probabilities, tiers, policy actions, rule hits, SHAP values, or audit records.
- **Verification**: Enforced by import boundary AST checks (`tests/test_phase_i_import_boundaries.py`) and byte-identical invariance tests (`tests/test_phase_i_step5.py`).

---

### D-I3: Human Reviewer Approval Gate
- **Decision**: Evidence pack approvals require an embed token (`AuthContext` mode `embed_token`) carrying scope `evidence:approve` and an individual reviewer subject `sub`. Server API keys are strictly rejected with 403 Forbidden. Modifying any finding, document, or narrative revokes prior approvals.
- **Rationale**: Guarantees merchant human-in-the-loop accountability before evidence submission.

---

### D-I4: PayPal Submission Handoff Boundary
- **Decision**: ReturnGuard never communicates directly with PayPal Disputes API. Submission logic belongs exclusively to the merchant storefront (`ShopPoint`). ReturnGuard provides canonical JSON/Markdown packages via `GET /v1/investigations/{id}/submission-package` and records submission results via `POST /v1/investigations/{id}/submission-result`.
- **Rationale**: Preserves ReturnGuard as a dedicated risk detection engine and prevents PayPal credential contamination.

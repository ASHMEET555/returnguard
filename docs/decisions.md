# ReturnGuard Architecture & Evaluation Decisions

This document formally records architectural, evaluation, and policy decisions established during Phase A.

---

### D-M1: Loss Function & Target Imbalance Handling
- **Decision**: Binary fraud classification ($y \in \{0, 1\}$) with severe class imbalance (~1.35% positive prevalence in training). LightGBM candidate model uses `scale_pos_weight = 72.8478` ($N_{\text{neg}} / N_{\text{pos}}$ on training days 0–39).
- **Rationale**: Direct loss re-weighting forces gradient updates to penalize missed positive cases without distorting raw feature representations.

---

### D-M2: Recall Constraint
- **Decision**: Maintain a minimum target recall of $\ge 80\%$ on held-out validation data.
- **Context & Handling**: In IEEE validation evaluations, if candidate LightGBM achieves 79.8% at default $\tau = 0.35$, Phase C will conduct a granular validation threshold sweep (0.30–0.80) to calibrate $\tau$ to satisfy the $80\%$ constraint, or document the exact validation-to-test trade-off.

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


# Phase B Research Notes — ReturnGuard: Rules, Rings, and Features

## 1. Rule Design for Spike Rules
Three heuristic spike rules run during the online scoring path (`rules/engine.py`) and operate deterministically based on thresholds configured in `rules/config.yaml`:

### Rule Definitions & Windows
1. `spike_velocity`:
   - **Window**: Trailing 24 hours (`orders_24h`) and trailing 7 days (`orders_7d`).
   - **Thresholds**: `orders_24h > max_orders_24h` (default: 5) OR `orders_7d > max_orders_7d` (default: 15).
   - **Rationale**: In legitimate baseline customer behavior, placing >5 distinct orders in 24 hours represents an extreme outlier (>95th percentile). Synthetic velocity burst injectors generate 6–12 orders within 24–36 hours.
2. `spike_cod_heavy`:
   - **Window**: Trailing 7 days.
   - **Thresholds**: `orders_7d >= min_orders_7d` (default: 3) AND `cod_share_7d >= cod_share_threshold` (default: 0.80).
   - **Rationale**: COD carries 100% merchant exposure for forward and reverse logistics loss upon refusal. A burst of orders where at least 80% are cash-on-delivery indicates a high-risk unhedged volume spike. Requiring `min_orders_7d >= 3` prevents false positives on isolated single COD purchases.
3. `spike_micro`:
   - **Window**: Trailing 30 days.
   - **Thresholds**: `returns_30d >= min_returns_30d` (default: 3) AND `micro_return_pct_30d >= micro_return_pct_threshold` (default: 0.60), where micro orders have `order_value <= max_micro_order_value` (default: ₹300).
   - **Rationale**: Exploits merchant "returnless refund" policies or negligible return friction on low-value items. Structuring returns across micro transactions flags this abuse pattern.

### Setting Thresholds & Avoiding Synthetic Generator Overfitting
- Thresholds are calibrated using the empirical cumulative distribution function (CDF) of baseline legitimate orders versus abuse clusters in Phase A's synthetic dataset (`train.parquet`).
- Rather than hardcoding synthetic injector parameters (e.g. exact injector batch sizes), thresholds are isolated in `rules/config.yaml`.
- The rule engine produces structured `rule_hits: list[str]` and rich `evidence_json: dict` detailing exact measured counts, window boundaries, and triggering values to ensure transparency.

---

## 2. Connected Components for Abuse Rings Using Union-Find
The abuse-ring sentinel identifies coordinated multi-accounting syndicates sharing identities across customer boundaries.

### Graph Construction & Disjoint-Set Union (DSU)
- **Entities & Nodes**: Customers share edges if they link via:
  1. `phone`: Customer contact phone number.
  2. `address`: Normalized delivery address hash (`Address.normalized_hash`).
  3. `device`: Application session device fingerprint hash (`Device.device_hash`).
- **Algorithm**: Disjoint-Set Union (Union-Find) with path compression and rank optimization.

### Determinism Guarantees
To guarantee 100% deterministic, reproducible ring discovery across runs:
1. **Canonical Edge Ordering**: Undirected edges `(u, v)` are normalized such that `u < v`, deduplicated into a set, and sorted lexicographically before processing.
2. **Stable Node Insertion**: Nodes are initialized in sorted order.
3. **Deterministic `ring_id` Assignment**: For each discovered component, find the lexicographically smallest member identifier (e.g., minimum customer ID). Hash this canonical minimum member (`SHA-256`) or assign stable identifiers sorted by canonical member ID (e.g., `R01, R02...`).
4. **Size $\ge$ 3 Filter**:
   - Singletons (size 1) and legitimate household pairs (size 2, e.g., partners sharing an address or tablet) are filtered out.
   - Only connected components with `ring_size >= 3` are flagged as abuse rings and receive a persistent `ring_id` and aggregate tracking (`ring_return_rate`).

---

## 3. As-Of Semantics & Leakage Prevention
Every feature, rule evaluation, and ring lookup must strictly adhere to point-in-time constraints as of `order_time`.

### Point-in-Time Boundaries
- **Query Restriction**: Only database records where `timestamp <= as_of` are observable.
- **Logistics & Label Delay**: In e-commerce, order outcomes (return requested, RTO delivered, refund executed) occur 3–14 days *after* order placement. A prior order placed before `as_of` whose outcome occurred *after* `as_of` cannot have its outcome observable at scoring time. Only outcomes where `outcome_time <= as_of` contribute to historical return/RTO rates.
- **Batch-Built Ring Graph Leakage**:
  - If ring edges are extracted from transactions or account links occurring *after* `as_of`, future associations leak into past orders.
  - To prevent this, batch ring builds must be parameterized by snapshot cutoff date (`as_of`), or constructed incrementally using edges established before `as_of`.
  - The online scoring path strictly performs key-value lookups against precomputed `ring_membership` and ring aggregates; it never traverses or walks the graph dynamically at request time.
- **Leakage Verification Test**:
  - The leakage test evaluates an order at `as_of = T`, then mutates or adds future data (new orders, links, or outcomes at $T + \Delta t$), and re-evaluates the feature vector at `as_of = T`.
  - The resulting feature vector must be bitwise identical. Any mutation proves future leakage.

---

## 4. Feature Count Reconciliation
### Document Precedence & Discrepancy Statement
- **02-architecture.md** (`Product locks`, Line 55) sets: `"Feature budget: 15–20 features per channel, plus payment features where available"`.
- However, **02-architecture.md** (`Feature dictionary`, Lines 184–241) lists **25 distinct features** across 5 categories:
  - *Order / Payment (6)*: `channel`, `is_cod`, `order_value`, `order_value_vs_cust_avg`, `item_count`, `category_risk`, `checkout_speed_sec` *(plus 3 paypal-specific: `payment_authorized`, `payment_captured`, `order_to_payment_ratio`)*.
  - *Customer history (7)*: `cust_order_count`, `cust_rto_rate`, `cust_return_rate`, `cust_refund_rate`, `cust_dispute_count`, `days_since_last_rto`, `successful_delivery_streak`.
  - *Address / geo (3)*: `address_completeness`, `pincode_rto_rate`, `is_new_address`.
  - *Velocity / spike (6)*: `orders_24h`, `orders_7d`, `returns_7d`, `refunds_7d`, `cod_share_7d`, `micro_return_pct_30d`.
  - *Abuse-ring (5)*: `shared_phone_accounts`, `shared_address_accounts`, `shared_device_accounts`, `ring_size`, `ring_return_rate`.
- In `features/dictionary.yaml` (Phase A frozen output), all 31 individual entries (including payment features) are defined, and `tests/test_leakage.py` asserts all dictionary entries exist in `data/processed/train.parquet`.

### Proposed Reconciliations (Awaiting User Selection)
To reconcile the 15–20 feature budget with the 25 features listed in the doc, we propose two options:

- **Option A (Compact 18-Feature Budget)**:
  Prune 7 redundant / composite features:
  1. *Order/Payment (5)*: `is_cod`, `order_value`, `order_value_vs_cust_avg`, `category_risk`, `checkout_speed_sec`
  2. *Customer History (4)*: `cust_order_count`, `cust_rto_rate`, `cust_return_rate`, `successful_delivery_streak` (drop `days_since_last_rto` and `cust_dispute_count`; merge refund rate into return rate)
  3. *Address/Geo (2)*: `pincode_rto_rate`, `is_new_address` (drop `address_completeness`)
  4. *Velocity/Spike (4)*: `orders_24h`, `orders_7d`, `cod_share_7d`, `returns_7d` (drop `refunds_7d`, `micro_return_pct_30d`)
  5. *Abuse-Ring (3)*: `shared_address_accounts`, `ring_size`, `ring_return_rate` (drop `shared_phone_accounts`, `shared_device_accounts` as they fold into `ring_size`)
  *Total: 18 features.*

- **Option B (Full 25-Feature Set from Architecture Specification)**:
  Treat the 15–20 statement as a guideline for base models ("15–20 per channel, plus payment features") and keep the 25 specified features intact so `dictionary.yaml`, `train.parquet`, and existing Phase A leakage tests remain 100% aligned without modifying frozen artifacts.

*(Per prompt instructions, FeatureBuilder implementation will pause until the user selects Option A or Option B).*

---

## 5. Feature Snapshot Storage for Audit
- `AuditScoreEvent` in `db/models.py` records online risk assessments.
- Currently, `AuditScoreEvent` includes `reason_codes_json`, `rule_hits_json`, `risk_score`, `severity`, etc., but does not have a dedicated `feature_snapshot_json` column.
- **Storage Choice**:
  - Extend the existing `AuditScoreEvent` model by adding `feature_snapshot_json = Column(Text, nullable=True)`.
  - This keeps audit trail persistence strictly within the existing Phase A table `audit_score_events` without creating new tables, ensuring full offline reproducibility and regulatory explainability.

---

## Commit Plan
1. `feat(rules): spike engine and thresholds in rules/config.yaml (spike_velocity, spike_cod_heavy, spike_micro)`
2. `test(rules): burst fixture triggers each spike rule; clean fixture triggers none`
3. `feat(rings): edge builder for phone, address and device, with union-find connected components`
4. `test(rings): shared-address ring of size >= 3 is discovered; size-2 pairs are not`
5. `feat(rings): write ring_membership and per-ring aggregates (ring_size, ring_return_rate)`
6. `feat(features): velocity and COD-share features computed as-of order_time`
7. `feat(features): customer history features computed as-of order_time`
8. `feat(features): order, address and ring lookup features (lookups only, no graph walk on the request path)`
9. `feat(features): FeatureBuilder.build(order_id, as_of) with zero-fill and validation against features/dictionary.yaml`
10. `feat(features): persist feature_snapshot JSON for audit`
11. `test(features): same order_id and as_of always returns an identical vector`
12. `test(features): changing any data after as_of does not change the vector (leakage test)`
13. `feat(cli): script that prints features and rule_hits for sample orders`
14. `docs: tick Phase B checkboxes in 03-phases.md, only where true`

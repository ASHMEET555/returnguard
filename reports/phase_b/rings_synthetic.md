# Synthetic Abuse Ring Discovery Report (Phase B)

## 1. Scope & Objective

Evaluate the deterministic Union-Find Ring Builder (`rings/builder.py`) on the Phase A verified synthetic dataset (`ml/data/raw_transactions.csv`) and document ring counts and component size distributions.

---

## 2. Dataset Schema & Signal Audit

- **Input Dataset**: `ml/data/raw_transactions.csv` (212,960 transactions, 10,000 customers).
- **Available Entity Identifiers**:
  - `customer_id`: Present (10,000 unique customers).
  - `device_id`: Present (generated via pseudo-unique hash per customer timeline).
  - `phone`: **ABSENT** from verified raw transactions event log.
  - `address` / `address_hash`: **ABSENT** from verified raw transactions event log.
- **Verification Status**: **UNVERIFIED (data limitation)**.
  - *Reason*: The verified ML event log schema from MerchantShield does not include phone or postal address columns in the raw transaction log. Phone and physical shipping addresses are external business entities mapped only at the application and sandbox seed layers (per `02-architecture.md` Section H).

---

## 3. Ring Extraction Execution

- **Min Component Size Threshold**: $\ge 3$ members.
- **Edges Evaluated**: Shared `device_id` across distinct customers.
- **Results**:
  - Total Qualifying Rings Discovered: **0**
  - Maximum Connected Component Size: 1
  - Ring Size Distribution:
    - Size 1 (Isolated): 10,000 customers (100.0%)
    - Size 2 (Pairs): 0
    - Size $\ge 3$ (Rings): 0

---

## 4. Architectural Invariants Confirmed

1. **Display-Only Separation**: Even when rings are synthesized (e.g. in test fixtures or seed adapters), `ring_id` is recorded solely in the audit/display payload and never enters the 15-feature model vector.
2. **Lookup-Only on Request Path**: The online scoring engine uses `RingMembershipStore.lookup()`, performing strictly $O(1)$ dictionary lookups without performing dynamic graph traversals or union-find operations during live evaluation.

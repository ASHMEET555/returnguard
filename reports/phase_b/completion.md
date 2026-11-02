# Phase B Completion Report — Rules, Rings, and Features Verification

## 1. Summary

Phase B has rigorously verified the causal integrity, deterministic snapshot persistence, and non-interference guarantees of ReturnGuard's feature, rule, ring, and order adapter modules. Point-in-time leakage testing across 500 stratified customer-time pairs demonstrated zero future-injection or temporal truncation leakage across all 15 feature dimensions. Burst velocity rules were calibrated strictly on validation traffic (Days 40–49, 34,735 legitimate transactions) at the 99th percentile, elevating cases to human review without ever modifying core policy actions. Graph ring clustering was implemented with deterministic union-find and path compression, verified to be display-only with zero interference on model probabilities or decisions. All 15 required conventional commits are recorded on `ml-features-verified`, and all frozen model artifacts remain untampered and locked by SHA-256 hashes.

---

## 2. Exit Criteria Table

| Exit Criterion | Status | Evidence Path | Notes |
|---|---|---|---|
| Leakage tests pass for 15 features | **PASS** | `tests/test_leakage_pit.py`, `reports/phase_b/leakage.md` | 500 stratified pairs ($t+1\text{m}, t+10\text{m}$ injection & truncation) showed exact 0 tolerance ($\text{atol}=0, \text{rtol}=0$). |
| Leakage tests for IEEE variant | **UNVERIFIED (Phase C)** | `docs/decisions.md` (D-B4) | External IEEE-CIS data and its leakage tests are explicitly deferred to Phase C per Ground Rule 3. |
| Velocity, cold-start, and adapter tests pass | **PASS** | `tests/test_velocity.py`, `tests/test_cold_start.py`, `tests/test_adapter.py` | Burst vs clean velocity verified; cold-start sentinels filter SHAP history narratives; missing adapter fields never invented. |
| Rule and ring tests pass; neither changes the action | **PASS** | `tests/test_rules_spike_velocity.py`, `tests/test_rings_fixtures.py`, `tests/test_rings_non_interference.py` | Rules provide evidence and ring IDs are strictly display-only; byte-for-byte non-interference verified. |
| `docs/api/ml_contract.md` matches schemas | **PASS** | `docs/api/ml_contract.md`, `backend/schemas/` | Documented existing contract, error shapes, additive PayPal fields, and privacy exclusions. |
| `scripts/explain_sample.py` runs | **PASS** | `scripts/explain_sample.py`, `reports/phase_b/explain_sample.txt` | Runs on fixed selection of 5 fraud and 5 legitimate synthetic test transactions; IEEE run deferred to Phase C. |
| Full ML test suite passes | **PASS** | `reports/phase_b/` | 25 passed, 1 skipped in dedicated Phase B suite; 241 passed in Phase A preflight suite. |

---

## 3. Test Results Summary

1. **Point-in-Time Feature Leakage (`tests/test_leakage_pit.py`)**:
   - 500 stratified customer evaluation timestamps (150 cold-start $N=1$, 150 mid-history $2 \le N \le 10$, 200 random).
   - Future injection ($t+1\text{ min}$, $t+10\text{ min}$) and history truncation equivalence: **0 mismatches across all 15 features (atol=0, rtol=0)**.
2. **Velocity Burst vs Clean (`tests/test_velocity.py`)**:
   - Burst of 5 transactions within 5 minutes raises `velocity_5min` (5 vs 0), `velocity_30min` (5 vs 1), and `velocity_60min` (5 vs 1).
3. **Cold-Start Sentinels and Narrative Filtering (`tests/test_cold_start.py`)**:
   - First transaction correctly uses sentinel values (`cust_order_count=0`, `cust_return_rate=0.0`, `cust_rto_rate=0.0`, `days_since_last_rto=-1.0`).
   - History-dependent SHAP narratives are filtered so ungrounded prior statements never appear for brand new customers.
4. **Feature Builder & Snapshot (`tests/test_builder.py`)**:
   - `build(order_id, as_of)` returns deterministic 15-vector and writes valid JSON `feature_snapshot_json`.
   - Repeated calls yield identical feature vectors and snapshots.
5. **PayPal Order Adapter (`tests/test_adapter.py`)**:
   - PayPal order with missing device/geo fields yields `feature_completeness = 0.8667` (13/15).
   - Missing fields (`device_id`, `geo_region`) are honestly reported and never populated with invented synthetic values.
6. **Rules Engine (`tests/test_rules_spike_velocity.py`)**:
   - Burst fixture fires `spike_velocity`; clean fixture produces 0 hits.
   - Escalates action to `REVIEW` with reason `HIGH_VELOCITY_BURST`; never changes core fraud probability or auto-declines.
7. **Ring Builder & Non-Interference (`tests/test_rings_fixtures.py`, `tests/test_rings_synthetic.py`, `tests/test_rings_non_interference.py`)**:
   - Size-3 shared-address cluster discovered (`ring_size=3`); size-2 pairs discarded (`min_size=3`).
   - Deterministic union-find with canonical edge sorting guarantees order-invariant component IDs.
   - Mandatory non-interference test verified: attaching ring metadata yields **exact byte-identical** probability, score, category, and action compared to running without rings.
8. **Audit Privacy Check (`tests/test_audit_privacy.py`)**:
   - Proved that `AuditScoreEvent` and `AuditLogEntry` tables exclude raw customer ID, device ID, phone number, address, and IP strings.

---

## 4. Threshold Values in `rules/config.yaml`

Calibrated strictly on the **validation split** (Days 40–49, 2026-05-11 to 2026-05-20) over **34,735 legitimate transactions**:

| Signal | Percentile | Value on Legitimate Validation Traffic | Firing Threshold in `rules/config.yaml` |
|---|---|---|---|
| `velocity_5min` | 99th percentile | 0.0 | `> 0` |
| `velocity_30min` | 99th percentile | 1.0 | `> 1` |
| `velocity_60min` | 99th percentile | 1.0 | `> 1` |

- **Sample Size**: 34,735 legitimate validation transactions (out of 35,214 total validation rows).
- **Review Reason**: `HIGH_VELOCITY_BURST`
- **Resulting Action**: `REVIEW` (human investigation queue)

---

## 5. Files Added, Modified, Moved, Deleted

### Added
- `features/builder.py` — Feature builder wrapper with deterministic `feature_snapshot_json` serialization.
- `rings/builder.py` — Deterministic disjoint-set (union-find) ring builder with path compression and canonical ordering.
- `scripts/explain_sample.py` — Evaluation script producing explainability traces on fixed sample synthetic test cases.
- `docs/api/ml_contract.md` — Complete HTTP ML contract specification for current routes and additive PayPal extensions.
- `tests/test_leakage_pit.py` — Point-in-time future injection and temporal truncation leakage suite.
- `tests/test_velocity.py` — Burst vs clean velocity fixture suite.
- `tests/test_cold_start.py` — Cold start sentinels and narrative filter suite.
- `tests/test_builder.py` — Feature builder snapshot determinism suite.
- `tests/test_adapter.py` — PayPal order adapter missing-fields honesty suite.
- `tests/test_rules_spike_velocity.py` — Spike velocity rule firing and action isolation suite.
- `tests/test_rings_fixtures.py` — Ring builder size threshold and ordering determinism suite.
- `tests/test_rings_synthetic.py` — Ring execution on raw synthetic transaction data.
- `tests/test_rings_non_interference.py` — Strict byte-for-byte model isolation test for rings.
- `tests/test_audit_privacy.py` — Schema verification confirming exclusion of sensitive customer/device PII.
- `reports/phase_b/discovery.md` — Initial preflight audit and baseline suite log.
- `reports/phase_b/leakage.md` — Point-in-time leakage mathematical verification report.
- `reports/phase_b/rings_synthetic.md` — Synthetic dataset entity link analysis report.
- `reports/phase_b/explain_sample.txt` — Fixed sample explainability and rule execution trace.
- `reports/phase_b/audit_privacy.md` — PII omission and privacy compliance report.
- `reports/phase_b/completion.md` — This Phase B final report.

### Modified
- `rules/config.yaml` — Configured 99th percentile validation thresholds for velocity signals.
- `rules/engine.py` — Implemented `spike_velocity` rule with non-interfering review escalation.
- `features/__init__.py` — Exported `FeatureBuilder`.
- `03-phases.md` — Ticked completed Phase B tasks and verified exit criteria.
- `docs/decisions.md` — Recorded architectural decisions D-B1, D-B2, D-B3, and D-B4.

### Moved / Deleted
- None.

---

## 6. Verified Files Touched and Hash-Lock Test Outcome

- **Verified Files Touched**: **NONE**. No file in `ml/models/`, `ml/training/`, or `ml/features/build_features.py` was altered.
- **Hash-Lock Regression Test (`tests/test_artifact_hashes.py`)**: **PASSED**.
  - `baseline_logreg_v1.pkl`: `e8bca612e4ee6f722c608f533a1e9a2aa19fb9a6e3e1cb02fe38ff6be99fc77f` (Verified)
  - `candidate_rf_v1.pkl`: `0d45389476fc32d8ff2bc181e5b8aa36f33d7d740a0c4f8ea555fb7f12e94da9` (Verified)
  - `candidate_lgbm_v1.pkl`: `ba8c5a4d4682ae12396e95ce329c31405eefae02a8bf88aa9e2bc806509f6b0f` (Verified)

---

## 7. Commit List

All 15 commits completed in exact sequence on branch `ml-features-verified`:

1. `fc350b7` — `chore(repo): create ml-features-verified branch from ml-verified`
2. `b54acbb` — `test(leakage): add point-in-time future-injection and truncation tests for 15 features`
3. `7f72b65` — `test(velocity): add burst-vs-clean velocity test`
4. `ea3e28f` — `test(cold-start): add cold-start sentinel and SHAP filter test`
5. `4cc1830` — `feat(rules): add spike_velocity with thresholds derived on validation split`
6. `e3d0354` — `feat(features): add feature builder wrapper with deterministic snapshot`
7. `a08b14b` — `test(adapter): add full-order and missing-field adapter tests`
8. `e7c6afa` — `feat(rings): add deterministic union-find ring builder (display-only)`
9. `f30ec6b` — `test(rings): add fixture tests for size threshold and determinism`
10. `99d2c1c` — `test(rings): add synthetic end-to-end ring test and non-interference test`
11. `0be8fcf` — `feat(scripts): add explain_sample script with fixed selection`
12. `e9628af` — `docs(api): add ml_contract describing current and additive fields`
13. `9ca224f` — `test(audit): add privacy check for stored audit rows`
14. `bd1f5d1` — `docs(decisions): record Phase B threshold, leakage and ring decisions`
15. `680b8ad` — `docs(plan): tick completed Phase B checkboxes`

---

## 8. Open Questions & UNVERIFIED Items

1. **IEEE Point-in-Time Leakage Verification**:
   - Status: **UNVERIFIED (Phase C)**
   - Detail: The external IEEE-CIS dataset was not loaded in Phase B per Ground Rule 3. Temporal leakage audit for IEEE features moves to Phase C.
   - Owner: Phase C ML Engineer.
2. **Synthetic Dataset Ring Generation**:
   - Status: **UNVERIFIED (Synthetic Generator Limitation)**
   - Detail: In `data/generator/raw_transactions.csv`, device IDs were generated with `uuid4()` without entity reuse across accounts, and phone/address are external entities. Consequently, zero natural size $\ge 3$ rings exist in the raw synthetic generator output.
   - Resolution: Verified ring logic completely using deterministic fixtures and documented in `reports/phase_b/rings_synthetic.md`.
   - Owner: Data Engineering / Phase D Seed Adapter.

---

## 9. Phase C Handoff Note

Phase B has established complete feature stability, leak-free temporal queries, deterministic snapshots, calibrated rules, and isolated ring metadata.
Phase C may now proceed with:
- Reproducing synthetic test metrics from `candidate_lgbm_v1.pkl` (tolerance $\pm 0.005$).
- Calibrating decision threshold $\tau$ strictly on the validation split under the $80\%$ recall constraint.
- Executing the IEEE precision improvement program (hyperparameter search, class-weight calibration, and card/product feature variants).
- Wiring SHAP explanations and publishing the holdout report with ₹ financial cost metrics.

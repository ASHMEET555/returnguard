# Phase B Discovery & Conflict Audit

## 1. Pre-Flight Verification Status

- **Phase A Completion Status**: PASS (verified in `reports/phase_a/completion.md`).
- **Base Branch**: `ml-verified` (commit `342173d`).
- **Working Branch**: `ml-features-verified`.
- **Pre-Flight Test Suite**: **241 passed, 17 skipped, 0 failed** in 185.95s (saved to `reports/phase_b/preflight_pytest.txt`).
- **Artifact Hash-Lock**: `tests/test_artifact_hashes.py` PASSED (all frozen pickle hashes match `reports/artifact_manifest.json`).

---

## 2. Planned File Modifications & Additions

| File | Action | Purpose |
|---|---|---|
| `tests/test_leakage_pit.py` | Create | 500-pair point-in-time future injection and truncation equivalence tests. |
| `reports/phase_b/leakage.md` | Create | Causality & PIT invariance audit report. |
| `tests/test_velocity.py` | Create | Velocity burst vs clean traffic statistical test. |
| `tests/test_cold_start.py` | Create | Sentinel value verification and SHAP history explanation suppression. |
| `rules/config.yaml` | Modify | Calibrate `spike_velocity` thresholds on legitimate validation split (99th percentile). |
| `rules/engine.py` | Update | Enforce evidence-only `spike_velocity` evaluation without altering `policy_action`. |
| `tests/test_rules_spike_velocity.py` | Create | Spike velocity burst vs clean test and non-interference with decision policy. |
| `features/builder.py` | Create | Clean `build(order_id, as_of)` wrapper writing deterministic `feature_snapshot_json`. |
| `tests/test_builder.py` | Create | Byte-for-byte snapshot determinism test. |
| `tests/test_adapter.py` | Create | Verified PayPal order adapter test suite. |
| `rings/builder.py` | Create | Deterministic union-find graph cluster builder (display-only, size >= 3). |
| `tests/test_rings_fixtures.py` | Create | Canonical edge ordering and size threshold tests. |
| `tests/test_rings_synthetic.py` | Create | End-to-end synthetic run (or UNVERIFIED note if external fields absent). |
| `reports/phase_b/rings_synthetic.md` | Create | Ring count and component size distribution report. |
| `tests/test_rings_non_interference.py` | Create | Invariant check: rings do NOT alter feature vectors, probability, or actions. |
| `scripts/explain_sample.py` | Create | Offline sample explanation script (first 5 fraud, 5 legitimate from test split). |
| `reports/phase_b/explain_sample.txt` | Create | Sample explain output capture. |
| `docs/api/ml_contract.md` | Create | ML contract specification documenting existing vs additive fields. |
| `tests/test_audit_privacy.py` | Create | PII leak prevention test on `audit_score_events`. |
| `reports/phase_b/audit_privacy.md` | Create | Audit privacy compliance report. |
| `docs/decisions.md` | Modify | Append Phase B decisions (threshold derivation, PIT leakage, ring constraints). |
| `03-phases.md` | Modify | Check off completed Phase B tasks. |
| `reports/phase_b/completion.md` | Create | Final Phase B completion deliverable. |

---

## 3. Plan & Architecture Conflict Audit

We audited `02-architecture.md` sections C, F, H, I against the Phase B task instructions:

1. **Section C (Feature Dictionary)**:
   - *Architecture*: Frozen 15 features for synthetic model (`amount`, `amount_zscore`, `amount_vs_avg_ratio`, `prior_txn_count`, `time_since_prev_txn_min`, `velocity_5min`, `velocity_30min`, `velocity_60min`, `new_device_flag`, `new_geo_flag`, `failed_ratio_trailing10`, `account_age_days`, `hour_of_day`, `is_night`, `day_of_week`).
   - *Conflict Check*: **No conflict**. All Phase B tasks strictly evaluate these 15 features without additions or mutations.

2. **Section F (Explainability)**:
   - *Architecture*: TreeExplainer on LightGBM. Cold-start requests suppress history-dependent explanation templates.
   - *Conflict Check*: **No conflict**. Task 2.2 specifically exercises the existing `explainability.py` cold-start path.

3. **Section H (Rules and Rings)**:
   - *Architecture*: `spike_velocity` is evidence-only; thresholds calibrated on validation legitimate data; rings use deterministic union-find with size $\ge 3$ components receiving `ring_id`; phone/address are display-only and never model inputs.
   - *Conflict Check*: **No conflict**. Task 2.3, 2.6, and Ground Rules 6 & 7 strictly maintain this separation and add a dedicated non-interference test (`test_rings_non_interference.py`).

4. **Section I (Leakage Rules)**:
   - *Architecture*: Requires that all historical features use only prior transactions ($j < i$), and points to IEEE aggregate leakage checks.
   - *Conflict Check / Scope Clarification*: `02-architecture.md` Section I mentions IEEE aggregate leakage tests. Per Ground Rule 3, IEEE-CIS data is out of scope for Phase B and deferred to Phase C. Phase B implements the rigorous point-in-time future injection test specifically for the 15 verified synthetic features. This is a deliberate scoping decision aligned with Ground Rule 3.

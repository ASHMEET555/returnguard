# Phase B Feature Leakage & Point-in-Time Correctness Report

## 1. Executive Summary

A perturbation-based point-in-time (PIT) future-injection test and truncation equivalence test were conducted across all 15 active model features defined in `ml/features/build_features.py`.

- **Method**: Point-in-time correctness check by future-injection: *features at time $t$ must be invariant to any data with timestamp $> t$*.
- **Sample Size**: 500 $(customer\_id, t)$ evaluation pairs chosen with fixed seed (`numpy.random.default_rng(42)`).
- **Stratification**: 150 cold-start pairs ($prior\_txn\_count = 0$), 150 mid-history pairs ($prior\_txn\_count \ge 2$), and 200 random timeline pairs.
- **Features Tested (all 15)**: `amount`, `amount_zscore`, `amount_vs_avg_ratio`, `prior_txn_count`, `time_since_prev_txn_min`, `velocity_5min`, `velocity_30min`, `velocity_60min`, `new_device_flag`, `new_geo_flag`, `failed_ratio_trailing10`, `account_age_days`, `hour_of_day`, `is_night`, `day_of_week`.
- **Result**: **0 mismatches** across all 500 pairs on both future-injection and truncation equivalence tests with **exact zero tolerance** ($\text{atol}=0, \text{rtol}=0$).

---

## 2. Test 1: Future-Injection Perturbation Check

For each evaluation pair at time $t$:
1. **Vector A**: Baseline feature vector generated solely from customer history strictly $\le t$.
2. **Vector B**: Feature vector recomputed after appending synthetic future transactions strictly $> t$ for the customer (including high-velocity burst transactions, unobserved device IDs, unobserved regions, and failed status flags designed to disturb running statistics).
3. **Assertion**: Vector A and Vector B must match identically at time $t$.

| Feature Name | Category | Evaluation Pairs | Mismatches Detected | Max Absolute Deviation | Status |
|---|---|---:|---:|---:|---|
| `amount` | Transaction | 500 | 0 | 0.0 | **PASS** |
| `amount_zscore` | Historical Stats | 500 | 0 | 0.0 | **PASS** |
| `amount_vs_avg_ratio` | Historical Stats | 500 | 0 | 0.0 | **PASS** |
| `prior_txn_count` | Running Count | 500 | 0 | 0.0 | **PASS** |
| `time_since_prev_txn_min` | Temporal Gap | 500 | 0 | 0.0 | **PASS** |
| `velocity_5min` | Velocity Window | 500 | 0 | 0.0 | **PASS** |
| `velocity_30min` | Velocity Window | 500 | 0 | 0.0 | **PASS** |
| `velocity_60min` | Velocity Window | 500 | 0 | 0.0 | **PASS** |
| `new_device_flag` | Novelty | 500 | 0 | 0.0 | **PASS** |
| `new_geo_flag` | Novelty | 500 | 0 | 0.0 | **PASS** |
| `failed_ratio_trailing10` | Running Ratio | 500 | 0 | 0.0 | **PASS** |
| `account_age_days` | Account History | 500 | 0 | 0.0 | **PASS** |
| `hour_of_day` | Calendar/Cyclical | 500 | 0 | 0.0 | **PASS** |
| `is_night` | Calendar/Cyclical | 500 | 0 | 0.0 | **PASS** |
| `day_of_week` | Calendar/Cyclical | 500 | 0 | 0.0 | **PASS** |

---

## 3. Test 2: Truncation Equivalence

The full synthetic dataset (212,960 transactions) was processed through `build_features()`. For all 500 sampled $(customer\_id, t)$ pairs, the feature slice extracted from the batch run was compared against the feature vector computed on individual histories truncated at time $t$.

- **Total Comparisons**: 500 pairs $\times$ 15 features = 7,500 feature values.
- **Identical Matches**: 7,500 / 7,500 (100.0%).
- **Status**: **PASS**.

---

## 4. Conclusion & Causality Verification

The verified feature pipeline exhibits strict causal ordering:
1. Historical expanding statistics (`cum_sum`, `cum_sum_sq`, `prior_mean`, `prior_std`) compute expanding metrics strictly on rows prior to index $i$.
2. Trailing windows (`velocity_5min`, `velocity_30min`, `velocity_60min`) use forward index boundaries strictly bounded by $j < i$.
3. Cold-start sentinels (`time_since_prev_txn_min = 99999`, novelty flags = 0) reliably prevent leakage when prior history is absent.
4. Future transactions have zero mathematical influence on decisions made at time $t$.

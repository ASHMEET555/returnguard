# Synthetic Data Reproducibility Report

Date: 2026-11-01
Script: `ml/data/generate_synthetic.py`
Feature Builder: `ml/features/build_features.py`
Seed: 42

## 1. Summary of Execution
Synthetic transactions were generated into a temporary directory using `ml/data/generate_synthetic.py` with seed 42, followed by feature extraction via `ml/features/build_features.py`.

### Measured Dataset Statistics:
- **Total Transactions**: 212,960 rows
- **Unique Customers**: 2,200
- **Unique Merchants**: 180
- **Simulation Duration**: 60 days
- **Date Range**: `2026-04-01 00:00:08` to `2026-05-30 23:59:38`
- **Fraud Rate**: 1.5026% (3,200 positive labels out of 212,960)

## 2. Hash Comparison & Determinism Analysis
Two successive generation runs with seed 42 were executed and compared:
- **Run 1 `raw_transactions.csv` SHA-256**: `2c98c370f7948b53b964bc735ac0bd548b10c20030d59859a5d8c4c8f1f7a4e7`
- **Run 2 `raw_transactions.csv` SHA-256**: `e13dba9c740397aeccfa4576c7434331510cd76f6e6d1bcdea2f6a517e4ae8c6`
- **Hash Match**: False

### Root Cause Analysis:
Inspection of `ml/data/generate_synthetic.py` shows that while all customer behavioral attributes, timestamps, transaction amounts, and fraud labels are seeded deterministically through `_rng = np.random.default_rng(RNG_SEED)`, device identifiers are created using Python's standard `uuid` library:
- Line 66: `home_device = f"dev_{uuid.uuid4().hex[:10]}"`
- Line 73: `legit_devices = [home_device] + [f"dev_{uuid.uuid4().hex[:10]}" for _ in range(n_legit_devices - 1)]`
- Line 170: `device_id = f"dev_{uuid.uuid4().hex[:10]}"`

Because `uuid.uuid4()` pulls entropy from the operating system rather than NumPy's pseudo-random number generator, the assigned device ID hex strings vary across executions. Consequently, the literal CSV byte streams differ, yielding non-identical SHA-256 hashes despite identical row counts, timestamps, customer histories, and label distributions.

## 3. Preservation & Gitignore
As instructed by the plan, `raw_transactions.csv` and `features.csv` are gitignored under `ml/data/*.csv` and will not be committed to git.

"""
Velocity feature tests: burst fixture vs clean fixture.

Verifies that rapid transaction bursts strictly increase velocity_5min,
velocity_30min, and velocity_60min metrics compared to normal, spaced-out traffic.
"""

from datetime import datetime, timedelta
import pandas as pd
import pytest

from ml.features.build_features import build_features


def create_clean_fixture(customer_id="cust_clean", n_txns=10, base_time=None):
    """Generates normal transactions spaced 1 to 2 days apart."""
    if base_time is None:
        base_time = datetime(2026, 1, 1, 10, 0, 0)

    rows = []
    acct_created = base_time - timedelta(days=90)
    for i in range(n_txns):
        ts = base_time + timedelta(days=i * 2, hours=i % 4)
        rows.append({
            "transaction_id": f"txn_clean_{i}",
            "customer_id": customer_id,
            "merchant_id": "merch_1",
            "merchant_category": "retail",
            "timestamp": ts.isoformat(),
            "amount": 500.0 + (i * 20.0),
            "device_id": "dev_clean_1",
            "geo_region": "DL",
            "payment_method": "card",
            "status": "success",
            "account_created": acct_created.isoformat(),
        })
    return pd.DataFrame(rows)


def create_burst_fixture(customer_id="cust_burst", n_txns=10, base_time=None):
    """Generates rapid transactions arriving within 1 to 3 minutes of each other."""
    if base_time is None:
        base_time = datetime(2026, 1, 1, 10, 0, 0)

    rows = []
    acct_created = base_time - timedelta(days=90)
    for i in range(n_txns):
        ts = base_time + timedelta(minutes=i * 2)
        rows.append({
            "transaction_id": f"txn_burst_{i}",
            "customer_id": customer_id,
            "merchant_id": "merch_1",
            "merchant_category": "retail",
            "timestamp": ts.isoformat(),
            "amount": 500.0 + (i * 20.0),
            "device_id": "dev_burst_1",
            "geo_region": "DL",
            "payment_method": "card",
            "status": "success",
            "account_created": acct_created.isoformat(),
        })
    return pd.DataFrame(rows)


def test_velocity_burst_strictly_greater_means():
    """
    Assert that the mean velocity (5min, 30min, 60min) across transactions in a
    burst scenario is strictly greater than in a clean, spaced-out scenario.
    """
    clean_df = create_clean_fixture(n_txns=10)
    burst_df = create_burst_fixture(n_txns=10)

    clean_feats = build_features(clean_df)
    burst_feats = build_features(burst_df)

    for vel_col in ["velocity_5min", "velocity_30min", "velocity_60min"]:
        clean_mean = clean_feats[vel_col].mean()
        burst_mean = burst_feats[vel_col].mean()

        # In clean traffic spaced days apart, trailing window velocities must be 0
        assert clean_mean == 0.0, f"Clean {vel_col} mean should be 0.0, got {clean_mean}"

        # In burst traffic arriving every 2 minutes, trailing window velocities must be elevated
        assert burst_mean > clean_mean, (
            f"Burst {vel_col} mean ({burst_mean}) must be strictly greater than clean ({clean_mean})"
        )


def test_velocity_monotonically_increases_during_burst():
    """Verify that inside a tight 5-minute burst, velocity_5min increases for successive transactions."""
    burst_df = create_burst_fixture(n_txns=4)  # At minutes 0, 2, 4, 6
    burst_feats = build_features(burst_df)

    v5 = burst_feats["velocity_5min"].tolist()
    # At t=0: prior within 5 min = 0
    # At t=2: prior within 5 min (t=0) = 1
    # At t=4: prior within 5 min (t=0, t=2) = 2
    # At t=6: prior within 5 min (t=2, t=4) = 2 (t=0 is > 5min ago)
    assert v5[0] == 0
    assert v5[1] == 1
    assert v5[2] == 2
    assert v5[3] == 2

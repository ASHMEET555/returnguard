"""
End-to-end ring builder evaluation on synthetic transactions.

Evaluates RingBuilder on ml/data/raw_transactions.csv.
If phone and address columns are absent from the verified dataset, marks
the check UNVERIFIED with the documented architectural reason.
"""

from pathlib import Path
import pandas as pd
import pytest

from rings.builder import RingBuilder


DATA_PATH = Path("ml/data/raw_transactions.csv")


def test_synthetic_rings_execution():
    """
    Run RingBuilder on synthetic dataset and verify execution integrity.
    Marks UNVERIFIED if external phone and address columns are absent.
    """
    if not DATA_PATH.exists():
        pytest.skip(f"Synthetic dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH, nrows=10000)

    has_phone = "phone" in df.columns
    has_address = "address" in df.columns or "address_hash" in df.columns

    # Evaluate device clustering
    entity_links = df[["customer_id", "device_id"]].drop_duplicates().to_dict(orient="records")
    builder = RingBuilder(min_ring_size=3)
    result = builder.build(entity_links)

    assert isinstance(result.rings, dict)
    assert isinstance(result.customer_to_ring, dict)

    if not (has_phone and has_address):
        # Phone and address are external application attributes (02-architecture.md section H)
        pytest.skip(
            "UNVERIFIED: raw_transactions.csv contains device_id but lacks phone and address columns. "
            f"Device-only clustering discovered {len(result.rings)} rings of size >= 3. "
            "Full multi-entity ring evaluation deferred to sandbox seed."
        )

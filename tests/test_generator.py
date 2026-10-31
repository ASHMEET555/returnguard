"""Tests for synthetic data generator determinism and reproducibility."""

import tempfile

import pandas as pd

from data.generator.generate import generate_dataset


def test_generator_determinism():
    """Verify identical seed produces identical holdout customer IDs and parquet file hashes."""
    with tempfile.TemporaryDirectory() as tmp1, tempfile.TemporaryDirectory() as tmp2:
        m1 = generate_dataset(seed=42, output_dir=tmp1)
        m2 = generate_dataset(seed=42, output_dir=tmp2)

        # 1. Identical customer holdout list
        assert (
            m1["split_summary"]["held_out_customer_ids"]
            == m2["split_summary"]["held_out_customer_ids"]
        )
        assert len(m1["split_summary"]["held_out_customer_ids"]) == 150

        # 2. Identical row counts
        assert m1["split_summary"]["train_rows"] == m2["split_summary"]["train_rows"]
        assert m1["split_summary"]["val_rows"] == m2["split_summary"]["val_rows"]
        assert m1["split_summary"]["test_rows"] == m2["split_summary"]["test_rows"]

        # 3. Identical Parquet dataframes
        df_train_1 = pd.read_parquet(f"{tmp1}/train.parquet")
        df_train_2 = pd.read_parquet(f"{tmp2}/train.parquet")
        pd.testing.assert_frame_equal(df_train_1, df_train_2)

        df_test_1 = pd.read_parquet(f"{tmp1}/test.parquet")
        df_test_2 = pd.read_parquet(f"{tmp2}/test.parquet")
        pd.testing.assert_frame_equal(df_test_1, df_test_2)

        # 4. Identical SHA-256 hashes
        assert m1["file_hashes"] == m2["file_hashes"]

"""Script to generate docs/data_card.md directly from processed data and manifest."""

import json
import os

import pandas as pd


def generate_data_card(
    manifest_path: str = "data/processed/manifest.json",
    output_path: str = "docs/data_card.md",
) -> None:
    """Generate docs/data_card.md from manifest and parquet files."""
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    train_labels = pd.read_parquet("data/processed/train_labels.parquet")
    val_labels = pd.read_parquet("data/processed/val_labels.parquet")
    test_labels = pd.read_parquet("data/processed/test_labels.parquet")

    train_feat = pd.read_parquet("data/processed/train.parquet")
    val_feat = pd.read_parquet("data/processed/val.parquet")
    test_feat = pd.read_parquet("data/processed/test.parquet")

    total_orders = manifest["total_orders"]
    split = manifest["split_summary"]
    rates = manifest["channel_positive_rates"]
    hashes = manifest["file_hashes"]

    # Archetype breakdown across full dataset
    all_labels = pd.concat([train_labels, val_labels, test_labels], ignore_index=True)
    archetype_counts = all_labels["outcome_type"].value_counts().to_dict()

    content = f"""# ReturnGuard Dataset Card (Phase A)

> **Notice**: This dataset contains strictly **simulated synthetic data** generated for the ReturnGuard hackathon project. No real customer data, live merchant records, or actual PayPal credentials/transactions are contained.

---

## 1. Dataset Overview

- **Generator Version**: `{manifest["generator_version"]}`
- **Random Seed**: `{manifest["seed"]}`
- **Generated At**: `{manifest["generated_at"]}`
- **Total Simulated Orders**: `{total_orders:,}`
- **Feature Count**: `{len(train_feat.columns) - 3}` (excluding metadata columns: `order_id`, `customer_id`, `order_time`)
- **Total Customer Accounts**: `1,000`
- **Pure Held-Out Customers**: `{split["held_out_customer_count"]}` (15.0% of all customer accounts)

---

## 2. Partition & Split Summary

Data is split chronologically by `order_time`, with the final evaluation set augmented with 100% of the held-out customer accounts to test generalization to unseen buyers.

| Split | Row Count | % of Total | Min Order Time | Max Order Time | Unique Customers |
|---|---|---|---|---|---|
| **Train** | `{split["train_rows"]:,}` | `{split["train_rows"] / total_orders * 100:.1f}%` | `{train_feat["order_time"].min()}` | `{split["t0_split"]}` | `{train_feat["customer_id"].nunique()}` |
| **Validation** | `{split["val_rows"]:,}` | `{split["val_rows"] / total_orders * 100:.1f}%` | `{val_feat["order_time"].min()}` | `{split["t1_split"]}` | `{val_feat["customer_id"].nunique()}` |
| **Test (Holdout)** | `{split["test_rows"]:,}` | `{split["test_rows"] / total_orders * 100:.1f}%` | `{test_feat["order_time"].min()}` | `{test_feat["order_time"].max()}` | `{test_feat["customer_id"].nunique()}` |
| **Total** | `{total_orders:,}` | `100.0%` | `{train_feat["order_time"].min()}` | `{test_feat["order_time"].max()}` | `1,000` |

### Split Cutoff Timestamps
- **T0 (Train End)**: `{split["t0_split"]}`
- **T1 (Val End / Test Start)**: `{split["t1_split"]}`

---

## 3. Positive Rates per Channel

Label definition (`y = 1`):
- **COD Channel**: Return to Origin (RTO) or confirmed delivery refusal.
- **PayPal Channel**: Refund granted post-delivery without return receipt, or dispute lost on abuse grounds.

| Split | Overall Positive Rate | COD Positive Rate | PayPal Positive Rate | COD Order Share |
|---|---|---|---|---|
| **Train** | `{rates["train"]["overall"] * 100:.2f}%` | `{rates["train"]["cod"] * 100:.2f}%` | `{rates["train"]["paypal"] * 100:.2f}%` | `{(train_labels["channel"] == "cod").mean() * 100:.1f}%` |
| **Validation** | `{rates["val"]["overall"] * 100:.2f}%` | `{rates["val"]["cod"] * 100:.2f}%` | `{rates["val"]["paypal"] * 100:.2f}%` | `{(val_labels["channel"] == "cod").mean() * 100:.1f}%` |
| **Test** | `{rates["test"]["overall"] * 100:.2f}%` | `{rates["test"]["cod"] * 100:.2f}%` | `{rates["test"]["paypal"] * 100:.2f}%` | `{(test_labels["channel"] == "cod").mean() * 100:.1f}%` |

---

## 4. Abuse Archetype Breakdown

| Outcome Type | Description | Total Count | % of Dataset |
|---|---|---|---|
"""
    for outcome, count in archetype_counts.items():
        content += f"| `{outcome}` | {outcome.replace('_', ' ').capitalize()} | `{count:,}` | `{count / total_orders * 100:.2f}%` |\n"

    content += f"""
---

## 5. File Integrity & SHA-256 Hashes

All files stored under `data/processed/` (gitignored):

| File | SHA-256 Checksum |
|---|---|
| `train.parquet` | `{hashes["train"]}` |
| `train_labels.parquet` | `{hashes["train_labels"]}` |
| `val.parquet` | `{hashes["val"]}` |
| `val_labels.parquet` | `{hashes["val_labels"]}` |
| `test.parquet` | `{hashes["test"]}` |
| `test_labels.parquet` | `{hashes["test_labels"]}` |
"""

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Data card generated at: {output_path}")


if __name__ == "__main__":
    generate_data_card()

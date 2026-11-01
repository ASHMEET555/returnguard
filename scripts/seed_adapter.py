"""
Phase D PayPal Sandbox Seed Adapter.

Transforms ReturnGuard / MerchantShield verified synthetic transactions into
PayPal Orders v2-compliant JSON payloads for future sandbox environment seeding.

NOTE: This script does NOT invoke external PayPal APIs in Phase A. It purely
formats and stages synthetic order payloads for offline preparation.
"""

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List
import pandas as pd


def transaction_to_paypal_order(row: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a single verified transaction row to a PayPal Order v2 dictionary."""
    payment_method = str(row.get("payment_method", "wallet")).lower()
    if payment_method in ("wallet", "upi"):
        payment_source = {"paypal": {}}
    else:
        payment_source = {payment_method: {}}

    status = "COMPLETED" if str(row.get("status", "success")).lower() == "success" else "DECLINED"
    amount_val = float(row.get("amount", 0.0))

    order = {
        "id": f"ORD-{row.get('transaction_id', 'UNKNOWN')}",
        "status": status,
        "intent": "CAPTURE",
        "create_time": str(row.get("timestamp")),
        "payment_source": payment_source,
        "payer": {
            "payer_id": str(row.get("customer_id", "CUST-0")),
            "account_created": str(row.get("account_created")),
        },
        "purchase_units": [
            {
                "reference_id": f"PU-{row.get('transaction_id', '0')}",
                "amount": {
                    "currency_code": "INR",
                    "value": f"{amount_val:.2f}",
                },
                "payee": {
                    "merchant_id": str(row.get("merchant_id", "MERCHANT-0")),
                    "merchant_category": str(row.get("merchant_category", "general")),
                },
                "shipping": {
                    "address": {
                        "admin_area_1": str(row.get("geo_region", "")),
                        "country_code": "IN",
                    }
                },
            }
        ],
        "app_session": {
            "device_id": str(row.get("device_id", "")),
        },
    }
    return order


def convert_transactions(
    input_path: Path,
    output_path: Path,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """Read transactions CSV and serialize to order-shaped JSON."""
    if not input_path.exists():
        raise FileNotFoundError(f"Input transaction file not found: {input_path}")

    df = pd.read_csv(input_path, nrows=limit)
    orders = [transaction_to_paypal_order(row) for row in df.to_dict(orient="records")]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(orders, f, indent=2)

    return orders


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert synthetic transactions to PayPal Order format for Phase D sandbox seeding."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("ml/data/raw_transactions.csv"),
        help="Path to raw transactions CSV.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/sandbox_orders_seed.json"),
        help="Path to output orders JSON file.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Number of records to adapt.",
    )
    args = parser.parse_args()

    orders = convert_transactions(args.input, args.output, limit=args.limit)
    print(f"Successfully converted {len(orders)} transactions to PayPal order format: {args.output}")

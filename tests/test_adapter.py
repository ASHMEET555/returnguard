"""
Unit tests for PayPal Order-to-Transaction Adapter.

Verifies:
1. Full PayPal order produces feature_completeness == 1.0 with zero missing fields.
2. Orders with missing device and geo fields produce feature_completeness < 1.0,
   list missing fields, and NEVER invent synthetic placeholder values.
3. Prior transaction context is preserved without mutation.
"""

import pytest
from features.adapter_order_to_txn import adapt_order_to_transaction


@pytest.fixture
def sample_full_order():
    return {
        "id": "ORD-PAYPAL-12345",
        "status": "COMPLETED",
        "create_time": "2026-06-15T10:00:00Z",
        "payment_source": "card",
        "payer": {
            "payer_id": "CUST-PAYPAL-99",
            "account_created": "2026-01-01T00:00:00Z",
        },
        "purchase_units": [
            {
                "amount": {
                    "currency_code": "INR",
                    "value": "2499.00",
                },
                "payee": {
                    "merchant_id": "MERCHANT-ABC",
                    "merchant_category": "apparel",
                },
                "shipping": {
                    "address": {
                        "admin_area_1": "Maharashtra",
                        "country_code": "IN",
                    }
                },
            }
        ],
        "app_session": {
            "device_id": "DEV-HARDWARE-HASH-999",
        },
    }


def test_full_order_completeness_1_0(sample_full_order):
    """A complete PayPal order achieves exactly 1.0 completeness with no missing fields."""
    result = adapt_order_to_transaction(sample_full_order)

    assert result["feature_completeness"] == 1.0
    assert result["missing_fields"] == []

    txn = result["transaction"]
    assert txn["transaction_id"] == "ORD-PAYPAL-12345"
    assert txn["customer_id"] == "CUST-PAYPAL-99"
    assert txn["merchant_id"] == "MERCHANT-ABC"
    assert txn["merchant_category"] == "apparel"
    assert txn["timestamp"] == "2026-06-15T10:00:00Z"
    assert txn["amount"] == 2499.00
    assert txn["device_id"] == "DEV-HARDWARE-HASH-999"
    assert txn["geo_region"] == "Maharashtra"
    assert txn["payment_method"] == "card"
    assert txn["status"] == "success"
    assert txn["account_created"] == "2026-01-01T00:00:00Z"


def test_order_missing_device_and_geo(sample_full_order):
    """
    When device telemetry and shipping geo are absent:
    - feature_completeness must be strictly < 1.0
    - missing_fields must list 'device_id' and 'geo_region'
    - transaction values for device_id and geo_region must be None (never invented)
    """
    order = sample_full_order.copy()
    del order["app_session"]
    order["purchase_units"][0]["shipping"]["address"]["admin_area_1"] = ""

    result = adapt_order_to_transaction(order)

    assert result["feature_completeness"] < 1.0
    assert result["feature_completeness"] == pytest.approx(9 / 11, rel=1e-4)
    assert "device_id" in result["missing_fields"]
    assert "geo_region" in result["missing_fields"]

    txn = result["transaction"]
    assert txn["device_id"] is None
    assert txn["geo_region"] is None

    # Verify present fields remain uncorrupted
    assert txn["transaction_id"] == "ORD-PAYPAL-12345"
    assert txn["amount"] == 2499.00


def test_no_invented_values_on_sparse_order():
    """Minimal payload with only transaction ID and customer ID never invents missing data."""
    sparse_order = {
        "id": "ORD-SPARSE-001",
        "payer": {"payer_id": "CUST-SPARSE"},
    }
    result = adapt_order_to_transaction(sparse_order)

    assert result["feature_completeness"] < 0.3
    txn = result["transaction"]

    for field in result["missing_fields"]:
        assert txn[field] is None, f"Field '{field}' must not be filled with invented values"


def test_prior_transactions_passthrough(sample_full_order):
    """Adapter passes through prior transaction records cleanly for context extraction."""
    priors = [
        {"transaction_id": "ORD-HIST-1", "amount": 500.0, "timestamp": "2026-06-01T10:00:00Z"},
        {"transaction_id": "ORD-HIST-2", "amount": 750.0, "timestamp": "2026-06-10T12:00:00Z"},
    ]
    result = adapt_order_to_transaction(sample_full_order, prior_txns=priors)

    assert "prior_transactions" in result
    assert len(result["prior_transactions"]) == 2
    assert result["prior_transactions"][0]["transaction_id"] == "ORD-HIST-1"

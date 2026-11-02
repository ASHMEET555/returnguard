"""
Unit tests for the PayPal Order to Transaction Adapter.

Verifies schema normalization, feature_completeness computation, and the critical
invariant that missing fields are never invented with synthetic placeholders.
"""

import pytest
from features.adapter_order_to_txn import adapt_order_to_transaction


@pytest.fixture
def full_paypal_order():
    return {
        "id": "ORD-PAYPAL-98765",
        "status": "COMPLETED",
        "create_time": "2026-11-01T12:00:00Z",
        "payment_source": "card",
        "payer": {
            "payer_id": "CUST-PAYER-1122",
            "account_created": "2026-01-15T08:30:00Z",
        },
        "purchase_units": [
            {
                "amount": {
                    "currency_code": "INR",
                    "value": "1450.50",
                },
                "payee": {
                    "merchant_id": "MERCHANT-99",
                    "merchant_category": "electronics",
                },
                "shipping": {
                    "address": {
                        "admin_area_1": "Karnataka",
                        "country_code": "IN",
                    }
                },
            }
        ],
        "app_session": {
            "device_id": "DEV-FINGERPRINT-ABC",
        },
    }


def test_full_order_completeness(full_paypal_order):
    """A fully populated PayPal order achieves 1.0 completeness with 0 missing fields."""
    res = adapt_order_to_transaction(full_paypal_order)

    assert res["feature_completeness"] == 1.0
    assert res["missing_fields"] == []
    txn = res["transaction"]
    assert txn["transaction_id"] == "ORD-PAYPAL-98765"
    assert txn["customer_id"] == "CUST-PAYER-1122"
    assert txn["merchant_id"] == "MERCHANT-99"
    assert txn["merchant_category"] == "electronics"
    assert txn["timestamp"] == "2026-11-01T12:00:00Z"
    assert txn["amount"] == 1450.50
    assert txn["payment_method"] == "card"
    assert txn["status"] == "success"
    assert txn["account_created"] == "2026-01-15T08:30:00Z"
    assert txn["device_id"] == "DEV-FINGERPRINT-ABC"
    assert txn["geo_region"] == "Karnataka"


def test_missing_device_and_geo_fields(full_paypal_order):
    """
    When device and geo are absent from the session/order:
    - completeness is strictly < 1.0
    - missing_fields lists device_id and geo_region
    - device_id and geo_region in transaction are None (NEVER invented)
    """
    order = full_paypal_order.copy()
    del order["app_session"]
    order["purchase_units"][0]["shipping"]["address"]["admin_area_1"] = ""

    res = adapt_order_to_transaction(order)

    assert res["feature_completeness"] < 1.0
    assert res["feature_completeness"] == round(9 / 11, 4)
    assert "device_id" in res["missing_fields"]
    assert "geo_region" in res["missing_fields"]
    assert res["transaction"]["device_id"] is None
    assert res["transaction"]["geo_region"] is None


def test_missing_fields_never_invented():
    """Missing signals must not receive placeholder or default fallback strings."""
    minimal_order = {
        "id": "ORD-MIN-1",
        "payer": {"payer_id": "CUST-1"},
        "status": "APPROVED",
    }
    res = adapt_order_to_transaction(minimal_order)

    assert res["feature_completeness"] < 0.5
    txn = res["transaction"]
    for field in res["missing_fields"]:
        assert txn[field] is None


def test_prior_transactions_passthrough(full_paypal_order):
    """Adapter passes through prior_transactions context without mutation."""
    priors = [{"transaction_id": "ORD-PREV-1", "amount": 200.0}]
    res = adapt_order_to_transaction(full_paypal_order, prior_txns=priors)

    assert "prior_transactions" in res
    assert res["prior_transactions"] == priors

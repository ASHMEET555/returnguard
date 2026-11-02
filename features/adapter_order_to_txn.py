"""
PayPal Order to Verified Transaction Schema Adapter.

Maps incoming PayPal Orders v2 payloads to ReturnGuard's verified ML transaction schema.
Enforces the strict invariant: missing signals lower feature_completeness < 1.0 and
are NEVER invented.
"""

from typing import Any, Dict, List, Optional


TARGET_FIELDS = [
    "transaction_id",
    "customer_id",
    "merchant_id",
    "merchant_category",
    "timestamp",
    "amount",
    "device_id",
    "geo_region",
    "payment_method",
    "status",
    "account_created",
]

_PAYMENT_METHOD_MAP = {
    "paypal": "wallet",
    "wallet": "wallet",
    "card": "card",
    "credit_card": "card",
    "debit_card": "card",
    "upi": "upi",
    "netbanking": "netbanking",
}

_STATUS_MAP = {
    "completed": "success",
    "approved": "success",
    "success": "success",
    "succeeded": "success",
    "failed": "failed",
    "declined": "failed",
    "cancelled": "failed",
    "canceled": "failed",
}


def adapt_order_to_transaction(
    order: Dict[str, Any],
    prior_txns: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Pure adapter function mapping a PayPal Order v2 dictionary to ReturnGuard's
    verified transaction schema.

    Parameters
    ----------
    order : dict
        PayPal Order v2 payload or order-shaped dictionary.
    prior_txns : list, optional
        Customer's prior transaction history context.

    Returns
    -------
    dict
        {
            "transaction": dict,
            "feature_completeness": float,
            "missing_fields": list[str],
            "prior_transactions": list
        }
    """
    transaction: Dict[str, Any] = {}
    missing_fields: List[str] = []

    # Safe extraction helpers
    payer = order.get("payer") or {}
    purchase_units = order.get("purchase_units") or []
    unit0 = purchase_units[0] if (isinstance(purchase_units, list) and len(purchase_units) > 0) else {}
    payee = unit0.get("payee") or {}
    shipping = unit0.get("shipping") or {}
    shipping_addr = shipping.get("address") or {}
    app_session = order.get("app_session") or {}
    metadata = order.get("metadata") or {}

    # 1. transaction_id
    raw_tid = order.get("id") or order.get("order_id") or order.get("transaction_id")
    if raw_tid and str(raw_tid).strip():
        transaction["transaction_id"] = str(raw_tid).strip()
    else:
        transaction["transaction_id"] = None
        missing_fields.append("transaction_id")

    # 2. customer_id
    raw_cid = payer.get("payer_id") or order.get("customer_id") or order.get("payer_id")
    if raw_cid and str(raw_cid).strip():
        transaction["customer_id"] = str(raw_cid).strip()
    else:
        transaction["customer_id"] = None
        missing_fields.append("customer_id")

    # 3. merchant_id
    raw_mid = payee.get("merchant_id") or order.get("merchant_id")
    if raw_mid and str(raw_mid).strip():
        transaction["merchant_id"] = str(raw_mid).strip()
    else:
        transaction["merchant_id"] = None
        missing_fields.append("merchant_id")

    # 4. merchant_category
    raw_cat = payee.get("merchant_category") or order.get("merchant_category") or order.get("category")
    if raw_cat and str(raw_cat).strip():
        transaction["merchant_category"] = str(raw_cat).strip()
    else:
        transaction["merchant_category"] = None
        missing_fields.append("merchant_category")

    # 5. timestamp
    raw_ts = order.get("create_time") or order.get("timestamp")
    if raw_ts and str(raw_ts).strip():
        transaction["timestamp"] = str(raw_ts).strip()
    else:
        transaction["timestamp"] = None
        missing_fields.append("timestamp")

    # 6. amount
    amount_val = None
    if isinstance(unit0.get("amount"), dict):
        amount_val = unit0.get("amount", {}).get("value")
    elif unit0.get("amount") is not None:
        amount_val = unit0.get("amount")
    elif order.get("amount") is not None:
        amount_val = order.get("amount")

    if amount_val is not None:
        try:
            transaction["amount"] = float(amount_val)
        except (ValueError, TypeError):
            transaction["amount"] = None
            missing_fields.append("amount")
    else:
        transaction["amount"] = None
        missing_fields.append("amount")

    # 7. device_id (session telemetry / client metadata)
    raw_device = (
        order.get("device_id")
        or order.get("client_metadata_id")
        or app_session.get("device_id")
        or metadata.get("device_id")
    )
    if raw_device and str(raw_device).strip():
        transaction["device_id"] = str(raw_device).strip()
    else:
        transaction["device_id"] = None
        missing_fields.append("device_id")

    # 8. geo_region (shipping administrative area or session geo)
    raw_geo = (
        shipping_addr.get("admin_area_1")
        or order.get("geo_region")
        or app_session.get("geo_region")
        or metadata.get("geo_region")
    )
    if raw_geo and str(raw_geo).strip():
        transaction["geo_region"] = str(raw_geo).strip()
    else:
        transaction["geo_region"] = None
        missing_fields.append("geo_region")

    # 9. payment_method
    raw_pm = order.get("payment_source") or order.get("payment_method")
    if isinstance(raw_pm, dict):
        # e.g., {"paypal": {}} or {"card": {}}
        keys = list(raw_pm.keys())
        raw_pm = keys[0] if keys else None

    if raw_pm and str(raw_pm).strip():
        pm_clean = str(raw_pm).strip().lower()
        transaction["payment_method"] = _PAYMENT_METHOD_MAP.get(pm_clean, pm_clean)
    else:
        transaction["payment_method"] = None
        missing_fields.append("payment_method")

    # 10. status
    raw_status = order.get("status")
    if raw_status and str(raw_status).strip():
        status_clean = str(raw_status).strip().lower()
        transaction["status"] = _STATUS_MAP.get(status_clean, status_clean)
    else:
        transaction["status"] = None
        missing_fields.append("status")

    # 11. account_created
    raw_acct = (
        payer.get("account_created")
        or payer.get("create_time")
        or order.get("account_created")
    )
    if raw_acct and str(raw_acct).strip():
        transaction["account_created"] = str(raw_acct).strip()
    else:
        transaction["account_created"] = None
        missing_fields.append("account_created")

    # Calculate feature completeness
    total_fields = len(TARGET_FIELDS)
    completeness = round((total_fields - len(missing_fields)) / total_fields, 4)

    result = {
        "transaction": transaction,
        "feature_completeness": completeness,
        "missing_fields": sorted(missing_fields),
    }

    if prior_txns is not None:
        result["prior_transactions"] = prior_txns

    return result

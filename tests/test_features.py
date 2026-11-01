"""Unit tests for feature builder determinism and dictionary compliance."""

import datetime
from pathlib import Path

import yaml

from features.builder import MODEL_INPUT_NAMES, FeatureBuilder


def get_sample_order_fixture():
    order = {
        "id": "ord_det_001",
        "customer_id": "cust_det_001",
        "address_id": "addr_det_001",
        "channel": "cod",
        "order_value": 1450.0,
        "item_count": 2,
        "category_risk": 0.28,
        "checkout_speed_sec": 35.0,
        "order_time": datetime.datetime(2026, 3, 15, 12, 0, 0, tzinfo=datetime.UTC),
    }
    customer = {
        "id": "cust_det_001",
        "phone": "9876543210",
        "created_at": datetime.datetime(2026, 1, 10, 0, 0, 0, tzinfo=datetime.UTC),
    }
    address = {
        "id": "addr_det_001",
        "line1": "42 MG Road",
        "completeness": 1.0,
        "base_rto_rate": 0.22,
        "normalized_hash": "hash_addr_mg_road",
    }
    device = {
        "id": "dev_det_001",
        "device_hash": "hash_dev_samsung",
    }
    historical_orders = [
        {
            "order_id": "ord_hist_001",
            "customer_id": "cust_det_001",
            "address_id": "addr_det_001",
            "channel": "cod",
            "order_value": 1200.0,
            "order_time": datetime.datetime(2026, 2, 1, 10, 0, 0, tzinfo=datetime.UTC),
            "outcome_time": datetime.datetime(
                2026, 2, 5, 14, 0, 0, tzinfo=datetime.UTC
            ),
            "y": 0,
        },
        {
            "order_id": "ord_hist_002",
            "customer_id": "cust_det_001",
            "address_id": "addr_det_001",
            "channel": "cod",
            "order_value": 900.0,
            "order_time": datetime.datetime(2026, 2, 20, 11, 0, 0, tzinfo=datetime.UTC),
            "outcome_time": datetime.datetime(
                2026, 2, 24, 16, 0, 0, tzinfo=datetime.UTC
            ),
            "y": 1,
        },
    ]
    return order, customer, address, device, historical_orders


def test_feature_builder_determinism():
    """Verify same order_id and as_of produce an identical feature vector across repeated calls."""
    order, customer, address, device, history = get_sample_order_fixture()
    as_of = order["order_time"]

    builder = FeatureBuilder()
    res1 = builder.build_from_records(
        order=order,
        customer=customer,
        address=address,
        device=device,
        historical_orders=history,
        as_of=as_of,
    )

    res2 = builder.build_from_records(
        order=order,
        customer=customer,
        address=address,
        device=device,
        historical_orders=history,
        as_of=as_of,
    )

    assert res1.model_vector == res2.model_vector
    assert res1.feature_snapshot == res2.feature_snapshot
    assert len(res1.model_vector) == 18
    assert len(res1.feature_snapshot) == 31


def test_feature_builder_matches_frozen_dictionary():
    """Verify model vector keys exactly match the 18 model_input: true features in dictionary.yaml."""
    dict_path = Path("features/dictionary.yaml")
    with open(dict_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    expected_inputs = set()
    all_dict_features = set()
    for grp in [
        "order_payment",
        "customer_history",
        "address_geo",
        "velocity_spike",
        "abuse_ring",
    ]:
        for feat in data.get(grp, []):
            all_dict_features.add(feat["name"])
            if feat.get("model_input") is True:
                expected_inputs.add(feat["name"])

    assert len(expected_inputs) == 18
    assert set(MODEL_INPUT_NAMES) == expected_inputs

    order, customer, address, device, history = get_sample_order_fixture()
    builder = FeatureBuilder()
    res = builder.build_from_records(
        order=order,
        customer=customer,
        address=address,
        device=device,
        historical_orders=history,
    )

    assert set(res.model_vector.keys()) == expected_inputs
    assert set(res.feature_snapshot.keys()) == all_dict_features


def test_paypal_order_channel_handling():
    """Verify channel specific feature values for PayPal orders."""
    order, customer, address, device, history = get_sample_order_fixture()
    order["channel"] = "paypal"

    builder = FeatureBuilder()
    res = builder.build_from_records(
        order=order,
        customer=customer,
        address=address,
        device=device,
        historical_orders=history,
    )

    assert res.model_vector["channel"] == "paypal"
    assert res.model_vector["is_cod"] == 0
    assert res.feature_snapshot["payment_authorized"] == 1
    assert res.feature_snapshot["payment_captured"] == 1

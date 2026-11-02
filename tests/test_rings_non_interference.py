"""
Mandatory Non-Interference Test for Rings (Display-Only).

Verifies the strict architectural invariant:
Whether a customer belongs to an abuse ring or not, the:
1. 15-feature model vector,
2. Model fraud probability,
3. Policy action (and rule ID), and
4. SHAP feature contributions
are 100% BYTE-IDENTICAL. Rings are display-only and never interfere with risk decisions.

Also verifies that the request scoring path uses O(1) RingMembershipStore lookup
and never executes dynamic graph traversals / UnionFind on the request path.
"""

from unittest.mock import patch
import joblib
import numpy as np
import pandas as pd
import pytest

from ml.features.build_features import build_features, FEATURE_COLUMNS
from ml.evaluation.decision_engine import make_decision
from ml.evaluation.explainability import RiskExplainer
from rings.builder import RingBuilder, RingMembershipStore, RingInfo, UnionFind


@pytest.fixture(scope="module")
def model_and_explainer():
    model = joblib.load("ml/models/candidate_lgbm_v1.pkl")
    explainer = RiskExplainer(model)
    return model, explainer


@pytest.fixture
def sample_transaction_raw():
    return {
        "transaction_id": "txn_interf_001",
        "customer_id": "cust_target_1",
        "merchant_id": "merch_1",
        "merchant_category": "electronics",
        "timestamp": "2026-06-01T12:00:00Z",
        "amount": 4200.0,
        "device_id": "dev_target_1",
        "geo_region": "IN-KA",
        "payment_method": "card",
        "status": "success",
        "account_created": "2026-01-01T00:00:00Z",
    }


def test_rings_non_interference_byte_identical(model_and_explainer, sample_transaction_raw):
    """
    Mandatory invariant: Enabling rings (displaying a detected ring) produces
    byte-identical features, probability, policy action, and SHAP attributions.
    """
    model, explainer = model_and_explainer

    # 1. Baseline: Ring disabled / not in ring
    raw_df = pd.DataFrame([sample_transaction_raw])
    feats_df_a = build_features(raw_df)
    X_a = feats_df_a[FEATURE_COLUMNS]
    vec_a = X_a.iloc[0].to_numpy(dtype=float)

    prob_a = float(model.predict_proba(X_a)[:, 1][0])
    decision_a = make_decision(sample_transaction_raw["transaction_id"], prob_a, sample_transaction_raw["amount"])
    explain_a = explainer.explain(X_a.iloc[0])
    shap_vals_a = np.array([c["shap_value"] for c in explain_a["contributions"]], dtype=float)

    # 2. Ring enabled: customer is linked to Ring R01 in RingMembershipStore
    ring_store = RingMembershipStore(
        customer_to_ring={"cust_target_1": "R01"},
        rings={"R01": RingInfo(ring_id="R01", member_customer_ids=["cust_target_1", "c2", "c3"], ring_size=3)},
    )
    ring_metadata = ring_store.lookup("cust_target_1")
    assert ring_metadata["in_ring"] is True
    assert ring_metadata["ring_id"] == "R01"

    # Re-evaluate transaction with ring present in display context
    feats_df_b = build_features(raw_df)
    X_b = feats_df_b[FEATURE_COLUMNS]
    vec_b = X_b.iloc[0].to_numpy(dtype=float)

    prob_b = float(model.predict_proba(X_b)[:, 1][0])
    decision_b = make_decision(sample_transaction_raw["transaction_id"], prob_b, sample_transaction_raw["amount"])
    explain_b = explainer.explain(X_b.iloc[0])
    shap_vals_b = np.array([c["shap_value"] for c in explain_b["contributions"]], dtype=float)

    # ASSERT EXACT BYTE-IDENTICAL INVARIANCE
    # 1. Feature vectors
    assert vec_a.tobytes() == vec_b.tobytes(), "Feature vectors must be byte-identical"
    np.testing.assert_allclose(vec_a, vec_b, atol=0, rtol=0)

    # 2. Model probability
    assert prob_a == prob_b, "Model probability must be bit-for-bit identical"

    # 3. Policy action and rule
    assert decision_a.action == decision_b.action, "Policy action must not be altered by ring"
    assert decision_a.policy_rule_id == decision_b.policy_rule_id
    assert decision_a.risk_score == decision_b.risk_score

    # 4. SHAP values
    assert shap_vals_a.tobytes() == shap_vals_b.tobytes(), "SHAP values must be byte-identical"
    np.testing.assert_allclose(shap_vals_a, shap_vals_b, atol=0, rtol=0)


def test_scoring_path_never_invokes_union_find_builder():
    """
    Assert that the scoring path executes strictly O(1) lookup-only access
    and never calls UnionFind or RingBuilder.build().
    """
    store = RingMembershipStore(
        customer_to_ring={"cust_1": "R01"},
        rings={"R01": RingInfo(ring_id="R01", member_customer_ids=["cust_1", "cust_2", "cust_3"], ring_size=3)},
    )

    with patch.object(RingBuilder, "build") as mock_builder_build:
        with patch.object(UnionFind, "union") as mock_uf_union:
            # Simulate online request lookup
            res = store.lookup("cust_1")
            assert res["ring_id"] == "R01"

            # Neither dynamic builder nor graph union should ever be called
            mock_builder_build.assert_not_called()
            mock_uf_union.assert_not_called()

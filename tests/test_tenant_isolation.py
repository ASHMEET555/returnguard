"""
Phase E-2 Tenant Isolation Test Suite.

Verifies:
1. Customer ID collisions across merchants: A's history for cust_1 does not change
   B's score for cust_1 (identical feature vectors and probability).
2. A request under key A containing prior transactions tagged to merchant B is rejected with 400.
3. Audit rows written under merchant A carry merchant_id A only; B's audit count is unchanged.
4. Reading a decision made under A by ID using key B returns 404 (never 403).
5. Single-merchant score contract remains completely unchanged.
6. Migration adding merchant_id runs twice on SQLite idempotently without error.
"""

import datetime
import hashlib
import json
import secrets
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

from api.main import app
from db.migrations import run_migrations
from db.models import APIKey, AuditScoreEvent, Merchant
from db.session import SessionLocal, engine


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database schema is up-to-date."""
    run_migrations(engine)
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture
def client():
    return TestClient(app)


def helper_create_merchant_and_key(merchant_id: str, name: str = "Test Key") -> str:
    """Helper to provision a merchant and return a valid plaintext API key."""
    db = SessionLocal()
    try:
        merchant = db.query(Merchant).filter_by(id=merchant_id).first()
        if not merchant:
            merchant = Merchant(
                id=merchant_id,
                name=f"Merchant {merchant_id}",
                email=f"{merchant_id}@example.com",
            )
            db.add(merchant)
            db.flush()

        random_secret = secrets.token_urlsafe(32)
        plain_key = f"rg_live_{random_secret}"
        key_hash = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
        key_id = f"key_{uuid.uuid4().hex[:16]}"

        api_key = APIKey(
            id=key_id,
            merchant_id=merchant_id,
            key_prefix="rg_live_",
            key_hash=key_hash,
            name=name,
            is_active=True,
            created_at=datetime.datetime.now(datetime.UTC),
        )
        db.add(api_key)
        db.commit()
        return plain_key
    finally:
        db.close()


# 1. Customer Collision Isolation Test
def test_1_customer_collision_history_isolation(client):
    """
    Two merchants A and B, both using customer ID 'cust_shared_123'.
    A's prior history for 'cust_shared_123' must NOT alter B's feature vector
    or score for 'cust_shared_123'.
    """
    key_a = helper_create_merchant_and_key("merch_iso_A")
    key_b = helper_create_merchant_and_key("merch_iso_B")

    shared_cust_id = "cust_shared_123"

    # Baseline request for Merchant B: evaluating cust_shared_123 in isolation
    target_payload_b = {
        "order_id": "ord_b_initial",
        "customer_id": shared_cust_id,
        "amount": 2500.0,
        "channel": "paypal",
        "timestamp": "2026-06-15T12:00:00Z",
        "prior_transactions": [],
    }

    resp_b_initial = client.post(
        "/v1/score",
        json=target_payload_b,
        headers={"Authorization": f"Bearer {key_b}"},
    )
    assert resp_b_initial.status_code == 200
    b_data_initial = resp_b_initial.json()

    # Now, Merchant A scores the SAME customer ID with 5 heavy prior transactions
    a_history = [
        {
            "transaction_id": f"tx_a_hist_{i}",
            "customer_id": shared_cust_id,
            "amount": 10000.0 + i * 500,
            "timestamp": f"2026-06-1{i}T10:00:00Z",
        }
        for i in range(5)
    ]
    payload_a = {
        "order_id": "ord_a_heavy",
        "customer_id": shared_cust_id,
        "amount": 15000.0,
        "channel": "paypal",
        "timestamp": "2026-06-15T11:00:00Z",
        "prior_transactions": a_history,
    }
    resp_a = client.post(
        "/v1/score",
        json=payload_a,
        headers={"Authorization": f"Bearer {key_a}"},
    )
    assert resp_a.status_code == 200

    # Now, re-evaluate Merchant B's transaction for the same customer ID
    resp_b_subsequent = client.post(
        "/v1/score",
        json=target_payload_b,
        headers={"Authorization": f"Bearer {key_b}"},
    )
    assert resp_b_subsequent.status_code == 200
    b_data_subsequent = resp_b_subsequent.json()

    # Assert 100% mathematical and contract identity between Merchant B's evaluations
    assert b_data_initial["risk_score"] == b_data_subsequent["risk_score"], (
        "Merchant B's risk score must be completely unaffected by Merchant A's data"
    )
    assert b_data_initial["risk_score_100"] == b_data_subsequent["risk_score_100"]
    assert b_data_initial["tier"] == b_data_subsequent["tier"]
    assert b_data_initial["policy_action"] == b_data_subsequent["policy_action"]
    assert b_data_initial["rule_hits"] == b_data_subsequent["rule_hits"]


# 2. Foreign prior transactions rejected with 400
def test_2_prior_transactions_tagged_to_other_merchant_rejected_with_400(client):
    """
    A request under key A containing prior transactions tagged to merchant B
    is rejected with HTTP 400 (Phase E-2 Design choice: reject with 400).
    """
    key_a = helper_create_merchant_and_key("merch_tenant_A")
    _ = helper_create_merchant_and_key("merch_tenant_B")

    payload_with_foreign_history = {
        "order_id": "ord_tenant_a_001",
        "amount": 1200.0,
        "channel": "paypal",
        "prior_transactions": [
            {
                "transaction_id": "tx_legit_1",
                "amount": 800.0,
                "merchant_id": "merch_tenant_A",  # valid
            },
            {
                "transaction_id": "tx_foreign_2",
                "amount": 950.0,
                "merchant_id": "merch_tenant_B",  # FOREIGN!
            },
        ],
    }

    response = client.post(
        "/v1/score",
        json=payload_with_foreign_history,
        headers={"Authorization": f"Bearer {key_a}"},
    )

    assert response.status_code == 400, "Must reject foreign prior_transactions with 400"
    assert "does not match authenticated merchant" in response.json()["detail"]


# 3. Audit rows isolation
def test_3_audit_rows_isolation_across_tenants(client):
    """
    Audit rows written under A carry merchant_id A only; B's audit count is unchanged.
    """
    key_a = helper_create_merchant_and_key("merch_aud_A")
    key_b = helper_create_merchant_and_key("merch_aud_B")

    db = SessionLocal()
    try:
        # Pre-count for Merchant B
        b_count_before = (
            db.query(AuditScoreEvent)
            .filter(AuditScoreEvent.merchant_id == "merch_aud_B")
            .count()
        )

        # Execute 3 scores under Merchant A
        for i in range(3):
            client.post(
                "/v1/score",
                json={"order_id": f"ord_a_seq_{i}", "amount": 1000.0 + i * 100},
                headers={"Authorization": f"Bearer {key_a}"},
            )

        # Post-count for Merchant B
        b_count_after = (
            db.query(AuditScoreEvent)
            .filter(AuditScoreEvent.merchant_id == "merch_aud_B")
            .count()
        )
        assert b_count_after == b_count_before, "Merchant B's audit count must be completely unchanged"

        # Check Merchant A's rows
        a_rows = (
            db.query(AuditScoreEvent)
            .filter(AuditScoreEvent.merchant_id == "merch_aud_A")
            .all()
        )
        assert len(a_rows) >= 3
        for r in a_rows:
            assert r.merchant_id == "merch_aud_A"
    finally:
        db.close()


# 4. Cross-tenant decision read returns 404
def test_4_cross_tenant_decision_read_returns_404(client):
    """
    Reading a decision made under A by ID using key B returns 404 (NEVER 403).
    """
    key_a = helper_create_merchant_and_key("merch_reader_A")
    key_b = helper_create_merchant_and_key("merch_reader_B")

    # Merchant A creates a decision
    score_resp = client.post(
        "/v1/score",
        json={"order_id": "ord_reader_test", "amount": 3000.0},
        headers={"Authorization": f"Bearer {key_a}"},
    )
    assert score_resp.status_code == 200
    decision_id = score_resp.json()["decision_id"]
    assert decision_id is not None

    # Merchant A reads its own decision -> 200 OK
    read_a = client.get(
        f"/v1/decisions/{decision_id}",
        headers={"Authorization": f"Bearer {key_a}"},
    )
    assert read_a.status_code == 200
    assert read_a.json()["order_id"] == "ord_reader_test"
    assert read_a.json()["decision_id"] == decision_id

    # Merchant B attempts to read Merchant A's decision -> 404 NOT FOUND (never 403)
    read_b = client.get(
        f"/v1/decisions/{decision_id}",
        headers={"Authorization": f"Bearer {key_b}"},
    )
    assert read_b.status_code == 404, "Cross-tenant resource lookup must return 404, not 403"
    assert read_b.json()["detail"] == "Decision not found"


# 5. Single-merchant score contract unchanged
def test_5_single_merchant_score_contract_unchanged(client):
    """
    Single-merchant score contract adherence against 02-architecture.md Section G.
    """
    key = helper_create_merchant_and_key("merch_contract_check")

    payload = {
        "order_id": "ord_contract_verify",
        "amount": 4200.0,
        "channel": "paypal",
        "features": {
            "amount": 4200.0,
            "velocity_5min": 0,
            "velocity_30min": 1,
            "velocity_60min": 1,
            "prior_txn_count": 3,
        },
    }

    response = client.post(
        "/v1/score",
        json=payload,
        headers={"Authorization": f"Bearer {key}"},
    )
    assert response.status_code == 200
    data = response.json()

    required_keys = [
        "order_id",
        "channel",
        "risk_score",
        "risk_score_100",
        "tier",
        "policy_rule",
        "policy_action",
        "severity",
        "suggested_action",
        "reason_codes",
        "rule_hits",
        "ring_id",
        "model_version",
        "dataset",
        "threshold",
        "model_status",
        "feature_completeness",
        "explanation_status",
        "shadow",
    ]
    for k in required_keys:
        assert k in data, f"Missing required contract field: {k}"

    assert data["order_id"] == "ord_contract_verify"
    assert data["channel"] == "paypal"
    assert data["shadow"] is True
    assert data["threshold"] == 0.40


# 6. Migration runs twice idempotently on SQLite
def test_6_migration_runs_twice_idempotently_on_sqlite():
    """
    Migration adding merchant_id runs twice on SQLite without error.
    """
    test_engine = create_engine("sqlite:///:memory:")
    run1 = run_migrations(test_engine)
    assert run1 is True

    run2 = run_migrations(test_engine)
    assert run2 is True
    test_engine.dispose()

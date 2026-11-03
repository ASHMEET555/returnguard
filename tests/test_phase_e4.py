"""Comprehensive tests for Phase E-4 hardening and verification.

Verifies:
1. Requests over rate limit return 429 with Retry-After; requests under it succeed.
2. Rate limit is per key: Merchant A's exhausted budget does not affect Merchant B.
3. Unauthenticated requests do not consume the budget.
4. Audit reconstruction for own decision: returns complete trace, SHAP, snapshot, and relay events.
5. Audit reconstruction for another merchant's decision: 404 Not Found.
6. Audit reconstruction writes no rows (read-only invariant).
7. FeatureBuilder without merchant_id raises TypeError.
8. Removed /score alias returns 404.
9. Shadow mode default: returns shadow=True and performs no financial action.
10. No code path in ReturnGuard imports or calls a PayPal endpoint (grep-style verification).
11. Migration runs twice on SQLite without error.
"""

import datetime
import hashlib
import json
import os
import re
import secrets
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from auth.ratelimit import get_rate_limiter
from db.migrations import run_migrations
from db.models import APIKey, AuditScoreEvent, Merchant, PaymentEvent
from db.session import SessionLocal, engine, init_db
from features.builder import FeatureBuilder


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()


@pytest.fixture
def db_session():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def client():
    return TestClient(app)


def create_test_merchant_and_key(db, merchant_id: str) -> str:
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
    api_key = APIKey(
        id=f"key_{uuid.uuid4().hex[:16]}",
        merchant_id=merchant_id,
        key_prefix="rg_live_",
        key_hash=key_hash,
        name=f"Key for {merchant_id}",
        is_active=True,
    )
    db.add(api_key)
    db.commit()
    return plain_key


# 1. Requests over rate limit return 429 with Retry-After; requests under it succeed
def test_1_rate_limit_enforced_with_retry_after(client, db_session, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_MINUTE", "5")
    get_rate_limiter().reset()

    mid = f"merch_rl_{uuid.uuid4().hex[:8]}"
    key = create_test_merchant_and_key(db_session, mid)
    headers = {"Authorization": f"Bearer {key}"}

    payload = {
        "order_id": f"ord_rl_{uuid.uuid4().hex[:8]}",
        "amount": 50.0,
        "channel": "paypal",
    }

    # First 5 succeed
    for i in range(5):
        resp = client.post("/v1/score", json=payload, headers=headers)
        assert resp.status_code == 200, f"Request {i+1} should succeed under budget"

    # 6th request must exceed rate limit
    resp_overflow = client.post("/v1/score", json=payload, headers=headers)
    assert resp_overflow.status_code == 429
    assert "Retry-After" in resp_overflow.headers
    retry_after = int(resp_overflow.headers["Retry-After"])
    assert retry_after > 0
    assert "Rate limit exceeded" in resp_overflow.json()["detail"]


# 2. Rate limit is per key: Merchant A's exhausted budget does not affect Merchant B
def test_2_rate_limit_isolated_per_key(client, db_session, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_MINUTE", "3")
    get_rate_limiter().reset()

    mid_a = f"merch_a_{uuid.uuid4().hex[:8]}"
    mid_b = f"merch_b_{uuid.uuid4().hex[:8]}"
    key_a = create_test_merchant_and_key(db_session, mid_a)
    key_b = create_test_merchant_and_key(db_session, mid_b)

    payload_a = {"order_id": "ord_a", "amount": 25.0, "channel": "paypal"}
    payload_b = {"order_id": "ord_b", "amount": 25.0, "channel": "paypal"}

    # Exhaust Key A's budget
    for _ in range(3):
        res = client.post("/v1/score", json=payload_a, headers={"Authorization": f"Bearer {key_a}"})
        assert res.status_code == 200
    res_a_over = client.post("/v1/score", json=payload_a, headers={"Authorization": f"Bearer {key_a}"})
    assert res_a_over.status_code == 429

    # Merchant B with key_b must still succeed
    res_b = client.post("/v1/score", json=payload_b, headers={"Authorization": f"Bearer {key_b}"})
    assert res_b.status_code == 200


# 3. Unauthenticated requests do not consume the budget
def test_3_unauthenticated_requests_do_not_consume_budget(client, db_session, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_MINUTE", "2")
    get_rate_limiter().reset()

    mid = f"merch_unauth_{uuid.uuid4().hex[:8]}"
    key = create_test_merchant_and_key(db_session, mid)

    payload = {"order_id": "ord_unauth_test", "amount": 30.0, "channel": "paypal"}

    # Bombard with unauthenticated requests
    for _ in range(10):
        res = client.post("/v1/score", json=payload)
        assert res.status_code == 401

    # Valid key still has its full budget available
    resp1 = client.post("/v1/score", json=payload, headers={"Authorization": f"Bearer {key}"})
    assert resp1.status_code == 200
    resp2 = client.post("/v1/score", json=payload, headers={"Authorization": f"Bearer {key}"})
    assert resp2.status_code == 200


# 4. Audit reconstruction for own decision returns all required fields
from db.models import Customer, Address, Device, Order

def test_4_audit_reconstruction_own_decision(client, db_session, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_MINUTE", "100")
    get_rate_limiter().reset()

    mid = f"merch_audit_{uuid.uuid4().hex[:8]}"
    key = create_test_merchant_and_key(db_session, mid)
    headers = {"Authorization": f"Bearer {key}"}

    ord_id = f"ord_aud_{uuid.uuid4().hex[:8]}"

    # Seed order for this merchant so relay event can link to it
    c = Customer(id=f"c_{uuid.uuid4().hex[:8]}", merchant_id=mid, email="c@ex.com", phone="+15551234567")
    a = Address(id=f"a_{uuid.uuid4().hex[:8]}", merchant_id=mid, customer_id=c.id, line1="1 Main St", city="City", state="CA", pincode="90001")
    d = Device(id=f"d_{uuid.uuid4().hex[:8]}", merchant_id=mid, customer_id=c.id, device_hash="dhash_1")
    o = Order(id=ord_id, merchant_id=mid, customer_id=c.id, address_id=a.id, device_id=d.id, channel="paypal", order_value=250.0, category="retail", order_time=datetime.datetime.now(datetime.UTC))
    db_session.add_all([c, a, d, o])
    db_session.commit()

    # Score a transaction to generate decision
    score_payload = {
        "order_id": ord_id,
        "amount": 250.0,
        "channel": "paypal",
    }
    score_resp = client.post("/v1/score", json=score_payload, headers=headers)
    assert score_resp.status_code == 200
    decision_id = score_resp.json()["decision_id"]

    # Ingest a relay event linked to this order
    relay_payload = {
        "event_id": f"WH-AUD-{uuid.uuid4()}",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "order_reference": ord_id,
        "summary": "Capture completed",
    }
    relay_resp = client.post("/v1/transactions/events", json=relay_payload, headers=headers)
    assert relay_resp.status_code == 200

    # Call audit reconstruction endpoint
    audit_resp = client.get(f"/v1/decisions/{decision_id}/audit", headers=headers)
    assert audit_resp.status_code == 200
    body = audit_resp.json()
    assert body["status"] == "success"
    data = body["data"]

    # Verify decision record
    assert data["decision"]["decision_id"] == decision_id
    assert data["decision"]["order_id"] == ord_id
    assert data["decision"]["merchant_id"] == mid

    # Verify policy trace
    assert "policy_rule" in data["policy_trace"]
    assert "policy_action" in data["policy_trace"]
    assert "tier" in data["policy_trace"]
    assert "threshold" in data["policy_trace"]

    # Verify SHAP top-K, rule hits, feature snapshot
    assert isinstance(data["shap_top_k"], list)
    assert isinstance(data["rule_hits"], list)
    assert isinstance(data["feature_snapshot"], dict)

    # Verify linked relay events
    assert len(data["relay_events"]) >= 1
    assert data["relay_events"][0]["event_id"] == relay_payload["event_id"]


# 5. Audit reconstruction for another merchant's decision returns 404
def test_5_audit_reconstruction_foreign_decision_returns_404(client, db_session, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_MINUTE", "100")
    get_rate_limiter().reset()

    mid_a = f"merch_own_{uuid.uuid4().hex[:8]}"
    mid_b = f"merch_foreign_{uuid.uuid4().hex[:8]}"
    key_a = create_test_merchant_and_key(db_session, mid_a)
    key_b = create_test_merchant_and_key(db_session, mid_b)

    # Score with Merchant A
    score_resp = client.post(
        "/v1/score",
        json={"order_id": "ord_cross", "amount": 100.0, "channel": "paypal"},
        headers={"Authorization": f"Bearer {key_a}"},
    )
    decision_id = score_resp.json()["decision_id"]

    # Request with Merchant B's key -> 404 (never 403)
    resp = client.get(f"/v1/decisions/{decision_id}/audit", headers={"Authorization": f"Bearer {key_b}"})
    assert resp.status_code == 404


# 6. Audit reconstruction writes no rows (row counts unchanged)
def test_6_audit_reconstruction_is_strictly_read_only(client, db_session, monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_MINUTE", "100")
    get_rate_limiter().reset()

    mid = f"merch_ro_{uuid.uuid4().hex[:8]}"
    key = create_test_merchant_and_key(db_session, mid)
    headers = {"Authorization": f"Bearer {key}"}

    score_resp = client.post(
        "/v1/score",
        json={"order_id": "ord_ro", "amount": 120.0, "channel": "paypal"},
        headers=headers,
    )
    decision_id = score_resp.json()["decision_id"]

    # Record row counts before
    count_audit_before = db_session.query(AuditScoreEvent).count()
    count_pe_before = db_session.query(PaymentEvent).count()

    # Reconstruct audit multiple times
    for _ in range(3):
        res = client.get(f"/v1/decisions/{decision_id}/audit", headers=headers)
        assert res.status_code == 200

    # Record row counts after
    count_audit_after = db_session.query(AuditScoreEvent).count()
    count_pe_after = db_session.query(PaymentEvent).count()

    assert count_audit_after == count_audit_before
    assert count_pe_after == count_pe_before


# 7. FeatureBuilder without merchant_id raises TypeError
def test_7_feature_builder_without_merchant_id_raises_typeerror():
    with pytest.raises(TypeError) as exc_info:
        FeatureBuilder()  # type: ignore
    assert "merchant_id" in str(exc_info.value)


# 8. Removed /score alias returns 404
def test_8_removed_score_alias_returns_404(client):
    resp = client.post("/score", json={"order_id": "ord_alias", "amount": 50.0})
    assert resp.status_code == 404


# 9. Shadow mode default: with no environment override, a BLOCK-producing score performs no money action and returns shadow true
def test_9_shadow_mode_default_and_no_money_action(client, db_session, monkeypatch):
    monkeypatch.delenv("SHADOW_MODE", raising=False)
    monkeypatch.setenv("RATE_LIMIT_PER_MINUTE", "100")
    get_rate_limiter().reset()

    mid = f"merch_shadow_{uuid.uuid4().hex[:8]}"
    key = create_test_merchant_and_key(db_session, mid)

    # Submit transaction with extreme amount designed to hit review / fallback
    payload = {
        "order_id": f"ord_blk_{uuid.uuid4().hex[:8]}",
        "amount": 9999999.0,
        "channel": "paypal",
    }

    resp = client.post("/v1/score", json=payload, headers={"Authorization": f"Bearer {key}"})
    assert resp.status_code == 200
    data = resp.json()

    assert data["shadow"] is True
    # In ReturnGuard, high risk routes to step up or human review; never declines or moves money
    assert data["suggested_action"] in ("step_up_verify", "allow", "monitor")


# 10. No code path in ReturnGuard imports or calls a PayPal endpoint
def test_10_no_paypal_sdk_or_endpoint_calls_in_source():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    source_dirs = ["api", "auth", "backend", "db", "features", "ml", "payments", "services", "scripts"]

    forbidden_patterns = [
        re.compile(r"api-m\.paypal\.com", re.IGNORECASE),
        re.compile(r"api-m\.sandbox\.paypal\.com", re.IGNORECASE),
        re.compile(r"import paypalrestsdk", re.IGNORECASE),
        re.compile(r"from paypalrestsdk", re.IGNORECASE),
    ]

    violations = []
    for sdir in source_dirs:
        dir_path = os.path.join(root_dir, sdir)
        if not os.path.exists(dir_path):
            continue
        for dirpath, _, filenames in os.walk(dir_path):
            for fname in filenames:
                if fname.endswith(".py"):
                    fpath = os.path.join(dirpath, fname)
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    for pattern in forbidden_patterns:
                        if pattern.search(content):
                            violations.append(f"{fpath}: matched {pattern.pattern}")

    assert len(violations) == 0, f"Found forbidden PayPal endpoint calls or SDK imports: {violations}"


# 11. Migration runs twice on SQLite without error
def test_11_migration_runs_twice_without_error():
    run1 = run_migrations(target_engine=engine)
    assert run1 is True
    run2 = run_migrations(target_engine=engine)
    assert run2 is True

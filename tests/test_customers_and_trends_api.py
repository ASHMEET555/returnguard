"""Tests for tenant-scoped customer and risk trends API endpoints."""

import datetime
from fastapi.testclient import TestClient
import pytest

from api.main import app
from db.models import AuditScoreEvent, Customer, Merchant
from db.session import SessionLocal, init_db


@pytest.fixture
def client_with_session():
    init_db()
    db = SessionLocal()
    client = TestClient(app)
    try:
        yield client, db
    finally:
        db.close()


def test_customers_endpoint_tenant_isolation(client_with_session):
    client, db = client_with_session

    m1 = Merchant(id="m_tenant_1", name="Merchant 1", email="m1@example.com")
    m2 = Merchant(id="m_tenant_2", name="Merchant 2", email="m2@example.com")
    db.merge(m1)
    db.merge(m2)
    db.commit()

    c1 = Customer(id="cust_t1", merchant_id="m_tenant_1", email="cust1@example.com", phone="+919876543210")
    c2 = Customer(id="cust_t2", merchant_id="m_tenant_2", email="cust2@example.com", phone="+919876543211")
    db.merge(c1)
    db.merge(c2)
    db.commit()

    from auth.embed_tokens import AuthContext, require_read_or_review_auth

    def auth_tenant_1():
        return AuthContext(tenant_id="m_tenant_1", scopes=["read", "review"], auth_mode="embed_token")

    app.dependency_overrides[require_read_or_review_auth] = auth_tenant_1

    res = client.get("/v1/customers")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["customer_id"] == "cust_t1"
    # Verify PII masking
    assert "***" in data["items"][0]["email"]
    assert "***" in data["items"][0]["phone"]

    # Customer 2 should return 404 under tenant 1 scope
    res_detail = client.get("/v1/customers/cust_t2")
    assert res_detail.status_code == 404

    # Customer 1 profile
    res_c1 = client.get("/v1/customers/cust_t1")
    assert res_c1.status_code == 200
    c1_data = res_c1.json()
    assert c1_data["customer_id"] == "cust_t1"
    assert c1_data["total_orders"] == 0

    app.dependency_overrides.pop(require_read_or_review_auth, None)


def test_risk_trends_endpoint(client_with_session):
    client, db = client_with_session

    m = Merchant(id="m_trends_test", name="Trends Merchant", email="trends@example.com")
    db.merge(m)
    db.commit()

    # Create dummy orders for customer foreign keys
    from db.models import Order
    o1 = Order(id="ord_t1", merchant_id="m_trends_test", customer_id="cust_t1", address_id="a1", device_id="d1", channel="paypal", order_value=100.0, category="electronics", order_time=datetime.datetime(2026, 11, 1, 10, 0, 0))
    o2 = Order(id="ord_t2", merchant_id="m_trends_test", customer_id="cust_t1", address_id="a1", device_id="d1", channel="cod", order_value=200.0, category="apparel", order_time=datetime.datetime(2026, 11, 2, 11, 0, 0))
    db.merge(o1)
    db.merge(o2)
    db.commit()

    e1 = AuditScoreEvent(
        id="evt_t1",
        decision_id="dec_t1",
        order_id="ord_t1",
        merchant_id="m_trends_test",
        risk_score=0.10,
        policy_action="ALLOW",
        channel="paypal",
        reason_codes_json="[]",
        rule_hits_json="[]",
        created_at=datetime.datetime(2026, 11, 1, 10, 0, 0),
    )
    e2 = AuditScoreEvent(
        id="evt_t2",
        decision_id="dec_t2",
        order_id="ord_t2",
        merchant_id="m_trends_test",
        risk_score=0.85,
        policy_action="BLOCK",
        channel="cod",
        reason_codes_json="[]",
        rule_hits_json="[]",
        created_at=datetime.datetime(2026, 11, 2, 11, 0, 0),
    )
    db.merge(e1)
    db.merge(e2)
    db.commit()

    from auth.embed_tokens import AuthContext, require_read_or_review_auth

    def auth_trends():
        return AuthContext(tenant_id="m_trends_test", scopes=["read", "review"], auth_mode="embed_token")

    app.dependency_overrides[require_read_or_review_auth] = auth_trends

    res = client.get("/v1/analytics/risk-trends")
    assert res.status_code == 200
    data = res.json()
    assert data["tenant_id"] == "m_trends_test"
    assert data["score_distribution"]["low_0_15"] == 1
    assert data["score_distribution"]["crit_80_100"] == 1
    assert data["channel_breakdown"]["paypal"] == 1
    assert data["channel_breakdown"]["cod"] == 1
    assert len(data["daily_trends"]) == 2

    app.dependency_overrides.pop(require_read_or_review_auth, None)

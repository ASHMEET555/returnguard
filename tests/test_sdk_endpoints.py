"""Tests for SDK Read Endpoints (Decisions pagination, Reviews queue)."""

import datetime
import hashlib
import os
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from auth.embed_tokens import EMBED_SIGNING_KEY_ENV
from db.models import APIKey, AuditScoreEvent, Merchant
from db.session import SessionLocal

TEST_KEY_RAW = "rg_live_test_sdk_read_key_999"
CALC_HASH = hashlib.sha256(TEST_KEY_RAW.encode("utf-8")).hexdigest()
MERCHANT_ID = "merch_sdk_read_test"
VALID_32B_KEY = "super_secure_embed_signing_key_at_least_32_bytes_long!"


@pytest.fixture(autouse=True)
def setup_sdk_tenant():
    db = SessionLocal()
    m = db.query(Merchant).filter(Merchant.id == MERCHANT_ID).first()
    if not m:
        m = Merchant(id=MERCHANT_ID, name="SDK Test Merchant", email="sdk@test.com")
        db.add(m)

    k = db.query(APIKey).filter(APIKey.merchant_id == MERCHANT_ID).first()
    if not k:
        k = APIKey(
            id=str(uuid.uuid4()),
            merchant_id=MERCHANT_ID,
            key_prefix="rg_live_test",
            key_hash=CALC_HASH,
            name="SDK Read Test Key",
            is_active=True,
        )
        db.add(k)

    db.commit()
    db.close()
    os.environ[EMBED_SIGNING_KEY_ENV] = VALID_32B_KEY
    yield
    os.environ.pop(EMBED_SIGNING_KEY_ENV, None)


def test_decisions_list_cursor_pagination():
    client = TestClient(app)
    # Create 3 decisions
    dec_ids = []
    for i in range(3):
        resp = client.post(
            "/v1/score",
            headers={"Authorization": f"Bearer {TEST_KEY_RAW}"},
            json={"order_id": f"ord_page_{i}_{uuid.uuid4().hex[:6]}", "amount": 1000.0 + i * 100},
        )
        assert resp.status_code == 200
        dec_ids.append(resp.json()["decision_id"])

    # Page with limit 2
    page1 = client.get(
        "/v1/decisions?limit=2",
        headers={"Authorization": f"Bearer {TEST_KEY_RAW}"},
    )
    assert page1.status_code == 200
    p1_data = page1.json()
    assert len(p1_data["items"]) == 2
    assert p1_data["next_cursor"] is not None

    # Fetch page 2 using cursor
    cursor = p1_data["next_cursor"]
    page2 = client.get(
        f"/v1/decisions?limit=2&cursor={cursor}",
        headers={"Authorization": f"Bearer {TEST_KEY_RAW}"},
    )
    assert page2.status_code == 200
    p2_data = page2.json()
    assert len(p2_data["items"]) >= 1


def test_reviews_list_and_submission():
    client = TestClient(app)
    # Score a transaction
    score_resp = client.post(
        "/v1/score",
        headers={"Authorization": f"Bearer {TEST_KEY_RAW}"},
        json={"order_id": f"ord_rev_{uuid.uuid4().hex[:6]}", "amount": 8000.0},
    )
    assert score_resp.status_code == 200
    decision_id = score_resp.json()["decision_id"]

    # List reviews
    rev_list = client.get(
        "/v1/reviews?limit=10",
        headers={"Authorization": f"Bearer {TEST_KEY_RAW}"},
    )
    assert rev_list.status_code == 200
    assert "items" in rev_list.json()

    # Submit review
    submit_resp = client.post(
        "/v1/reviews",
        headers={"Authorization": f"Bearer {TEST_KEY_RAW}"},
        json={
            "decision_id": decision_id,
            "action": "approve",
            "notes": "Verified legitimate customer purchase via phone call",
        },
    )
    assert submit_resp.status_code == 200
    s_data = submit_resp.json()
    assert s_data["decision_id"] == decision_id
    assert s_data["action"] == "approve"
    assert s_data["status"] == "resolved"

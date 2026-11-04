"""Tests verifying GET /v1/models/performance matches documented metrics exactly."""

import datetime
import os
import pytest
import jwt
from fastapi.testclient import TestClient

from api.main import app
from auth.embed_tokens import EMBED_SIGNING_KEY_ENV, EMBED_TOKEN_AUDIENCE

SIGNING_KEY = "super_secure_embed_signing_key_at_least_32_bytes_long!"


@pytest.fixture(autouse=True)
def setup_signing_env():
    os.environ[EMBED_SIGNING_KEY_ENV] = SIGNING_KEY
    yield
    os.environ.pop(EMBED_SIGNING_KEY_ENV, None)


def test_model_performance_matches_documented_metrics():
    now = datetime.datetime.now(datetime.timezone.utc)
    claims = {
        "tid": "merch_doc_verify",
        "sub": "user_test",
        "aud": EMBED_TOKEN_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + 600),
    }
    token = jwt.encode(claims, SIGNING_KEY, algorithm="HS256")

    client = TestClient(app)
    resp = client.get("/v1/models/performance", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()

    # Synthetic: 01-brief.md / README.md / reports/holdout_metrics.json
    syn = data["synthetic"]
    assert syn["dataset_name"] == "synthetic"
    assert syn["auc_roc"] == 0.9684
    assert syn["auc_pr"] == 0.9009
    assert syn["precision"] == 0.7847
    assert syn["recall"] == 0.8818
    assert syn["f1_score"] == 0.8304
    assert syn["threshold"] == 0.40
    assert syn["sample_count"] == 35949
    assert syn["reproduction_status"] == "REPRODUCED"

    # IEEE-CIS: 01-brief.md / README.md / reports/phase_c/c1_reproduction.md
    ieee = data["ieee_cis"]
    assert ieee["dataset_name"] == "ieee_cis"
    assert ieee["auc_roc"] == 0.7712
    assert ieee["auc_pr"] == 0.5186
    assert ieee["precision"] == 0.0631
    assert ieee["recall"] == 0.7980
    assert ieee["f1_score"] == 0.1171
    assert ieee["threshold"] == 0.35
    assert ieee["sample_count"] == 118108
    assert ieee["reproduction_status"] == "REPORTED_UNVERIFIED"

    # Honest limits note present
    assert "honest_limits_note" in data
    assert "high-recall filter" in data["honest_limits_note"]
    assert "not be presented as a precise blocker" in data["honest_limits_note"]

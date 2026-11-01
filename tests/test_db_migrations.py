"""Idempotency and schema tests for database migrations across SQLite and PostgreSQL."""

import os
import tempfile
import pytest
from sqlalchemy import create_engine, inspect
from db.migrations import run_migrations
from db.models import AuditScoreEvent, Order, Merchant, Customer, Payment


def test_sqlite_migration_idempotent():
    """Verify that migrations run twice on SQLite without error and all columns exist."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    try:
        engine = create_engine(f"sqlite:///{db_path}")

        # First run: should create tables
        res1 = run_migrations(target_engine=engine)
        assert res1 is True

        # Second run: should execute idempotently with zero error
        res2 = run_migrations(target_engine=engine)
        assert res2 is True

        # Verify columns on audit_score_events
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        assert "audit_score_events" in tables
        assert "orders" in tables
        assert "payments" in tables

        col_names = {c["name"] for c in inspector.get_columns("audit_score_events")}
        expected_cols = {
            "id",
            "decision_id",
            "order_id",
            "channel",
            "risk_score",
            "tier",
            "policy_rule",
            "policy_action",
            "severity",
            "suggested_action",
            "model_version",
            "threshold",
            "model_status",
            "feature_completeness",
            "explanation_status",
            "feature_snapshot_json",
            "shadow",
            "created_at",
        }
        missing = expected_cols - col_names
        assert not missing, f"Missing columns in audit_score_events: {missing}"
    finally:
        engine.dispose()
        if os.path.exists(db_path):
            os.remove(db_path)


def test_postgres_migration_or_unverified():
    """Verify PostgreSQL migration idempotency if DATABASE_URL is set, else skip with UNVERIFIED."""
    db_url = os.environ.get("DATABASE_URL")
    if not db_url or not db_url.startswith("postgres"):
        pytest.skip("PostgreSQL not configured in DATABASE_URL; marked UNVERIFIED")

    engine = create_engine(db_url)
    try:
        # First migration
        res1 = run_migrations(target_engine=engine)
        assert res1 is True

        # Second migration (idempotency check)
        res2 = run_migrations(target_engine=engine)
        assert res2 is True

        inspector = inspect(engine)
        assert "audit_score_events" in inspector.get_table_names()
    finally:
        engine.dispose()

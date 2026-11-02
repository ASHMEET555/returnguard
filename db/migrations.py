"""Idempotent database migration and schema synchronization utility."""

import os
from sqlalchemy import inspect, text
from db.session import Base, engine as default_engine

def run_migrations(target_engine=None):
    """
    Run database migrations idempotently.
    Safe to execute multiple times against SQLite and PostgreSQL without error.
    """
    eng = target_engine or default_engine
    inspector = inspect(eng)

    # 1. Create all registered tables if they do not exist
    import db.models  # ensure models are imported
    Base.metadata.create_all(bind=eng)

    # 2. Check for missing columns on existing tables (schema evolution)
    with eng.connect() as conn:
        # Check audit_score_events table
        if "audit_score_events" in inspector.get_table_names():
            columns = {col["name"] for col in inspector.get_columns("audit_score_events")}

            needed_cols = [
                ("decision_id", "VARCHAR(64)"),
                ("tier", "VARCHAR(32) DEFAULT 'LOW'"),
                ("policy_rule", "VARCHAR(64) DEFAULT 'ALLOW_NORMAL'"),
                ("policy_action", "VARCHAR(64) DEFAULT 'ALLOW'"),
                ("threshold", "NUMERIC(5, 4) DEFAULT 0.40"),
                ("model_status", "VARCHAR(32) DEFAULT 'loaded'"),
                ("feature_completeness", "NUMERIC(5, 4) DEFAULT 1.0"),
                ("explanation_status", "VARCHAR(32) DEFAULT 'available'"),
                ("feature_snapshot_json", "TEXT"),
            ]

            for col_name, col_type in needed_cols:
                if col_name not in columns:
                    try:
                        conn.execute(text(f"ALTER TABLE audit_score_events ADD COLUMN {col_name} {col_type};"))
                        conn.commit()
                    except Exception as e:
                        # Idempotent: ignore if already exists
                        pass

    return True

if __name__ == "__main__":
    run_migrations()
    print("Migrations executed idempotently.")

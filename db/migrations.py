"""Idempotent database migration and schema synchronization utility."""

import datetime
from sqlalchemy import inspect, text
from db.session import Base, engine as default_engine

LEGACY_MERCHANT_ID = "merch_legacy"


def run_migrations(target_engine=None):
    """
    Run database migrations idempotently.
    Safe to execute multiple times against SQLite and PostgreSQL without error.
    - Creates missing registered tables.
    - Adds missing columns to existing tables (schema evolution).
    - Adds indexed merchant_id to all merchant-data tables.
    - Backfills legacy null merchant_id rows to 'merch_legacy'.
    """
    eng = target_engine or default_engine
    inspector = inspect(eng)

    # 1. Create all registered tables if they do not exist
    import db.models  # ensure models are imported
    Base.metadata.create_all(bind=eng)

    # Re-inspect table names after create_all
    inspector = inspect(eng)
    existing_tables = set(inspector.get_table_names())

    backfill_counts = {}

    # 2. Check for missing columns on existing tables (schema evolution)
    with eng.connect() as conn:
        # Check audit_score_events table columns
        if "audit_score_events" in existing_tables:
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
                ("merchant_id", "VARCHAR(64)"),
            ]

            for col_name, col_type in needed_cols:
                if col_name not in columns:
                    try:
                        conn.execute(text(f"ALTER TABLE audit_score_events ADD COLUMN {col_name} {col_type};"))
                        conn.commit()
                    except Exception:
                        pass

        # 3. Add merchant_id to all merchant-data tables that may lack it
        merchant_tables = [
            "addresses",
            "devices",
            "payments",
            "shipments",
            "return_events",
            "refunds",
            "payment_events",
            "disputes",
            "evidence_packs",
            "evidence_submissions",
        ]

        for tbl in merchant_tables:
            if tbl in existing_tables:
                col_names = {col["name"] for col in inspector.get_columns(tbl)}
                if "merchant_id" not in col_names:
                    try:
                        conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN merchant_id VARCHAR(64);"))
                        conn.commit()
                    except Exception:
                        pass

        # 3b. Scope payment_events uniqueness to (merchant_id, event_id) and add order_reference
        if "payment_events" in existing_tables:
            pe_cols = {col["name"] for col in inspector.get_columns("payment_events")}
            if "order_reference" not in pe_cols:
                try:
                    conn.execute(text("ALTER TABLE payment_events ADD COLUMN order_reference VARCHAR(64);"))
                    conn.commit()
                except Exception:
                    pass

            pe_indexes = inspector.get_indexes("payment_events")
            single_event_id_unique = any(
                idx.get("unique") and idx.get("column_names") == ["event_id"]
                for idx in pe_indexes
            )
            has_composite_unique = any(
                idx.get("unique") and set(idx.get("column_names") or []) == {"merchant_id", "event_id"}
                for idx in pe_indexes
            )

            if single_event_id_unique or not has_composite_unique:
                try:
                    conn.execute(text("DROP INDEX IF EXISTS ix_payment_events_event_id;"))
                    conn.commit()
                except Exception:
                    pass

                try:
                    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_events_merchant_event ON payment_events (merchant_id, event_id);"))
                    conn.commit()
                except Exception:
                    pass

                try:
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_payment_events_event_id ON payment_events (event_id);"))
                    conn.commit()
                except Exception:
                    pass

                try:
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_payment_events_order_reference ON payment_events (order_reference);"))
                    conn.commit()
                except Exception:
                    pass

        # 4. Backfill existing rows with NULL merchant_id to 'merch_legacy' if any exist
        # Check if any table has rows where merchant_id IS NULL
        has_null_rows = False
        all_scoped_tables = merchant_tables + ["audit_score_events", "customers", "orders"]

        for tbl in all_scoped_tables:
            if tbl in existing_tables:
                try:
                    res = conn.execute(text(f"SELECT COUNT(*) FROM {tbl} WHERE merchant_id IS NULL")).scalar()
                    if res and res > 0:
                        backfill_counts[tbl] = res
                        has_null_rows = True
                except Exception:
                    pass

        if has_null_rows:
            # Ensure legacy merchant row exists
            try:
                # Portable insert if not exists
                merch_exists = conn.execute(
                    text("SELECT id FROM merchants WHERE id = :mid"),
                    {"mid": LEGACY_MERCHANT_ID},
                ).first()
                if not merch_exists:
                    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
                    conn.execute(
                        text(
                            "INSERT INTO merchants (id, name, email, created_at) "
                            "VALUES (:id, :name, :email, :created_at)"
                        ),
                        {
                            "id": LEGACY_MERCHANT_ID,
                            "name": "Legacy Migration Merchant",
                            "email": "legacy@merchant.internal",
                            "created_at": now_str,
                        },
                    )
                    conn.commit()

                # Backfill nulls
                for tbl in backfill_counts:
                    conn.execute(
                        text(f"UPDATE {tbl} SET merchant_id = :mid WHERE merchant_id IS NULL"),
                        {"mid": LEGACY_MERCHANT_ID},
                    )
                    conn.commit()
            except Exception:
                pass

    return True


if __name__ == "__main__":
    run_migrations()
    print("Migrations executed idempotently.")

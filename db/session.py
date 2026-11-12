"""SQLAlchemy session and engine management for ReturnGuard."""

import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or not DATABASE_URL.strip():
    # Fallback to local SQLite file for local development/testing without live Postgres
    DATABASE_URL = "sqlite:///./returnguard.db"

# Handle sqlite check_same_thread and timeout requirement
is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False, "timeout": 30} if is_sqlite else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

def migrate_sqlite_schema(conn):
    """Safe idempotent column migrations for existing SQLite databases."""
    try:
        # Check audit_score_events
        cols = [c[1] for c in conn.exec_driver_sql("PRAGMA table_info(audit_score_events)").fetchall()]
        if cols and "order_summary_json" not in cols:
            conn.exec_driver_sql("ALTER TABLE audit_score_events ADD COLUMN order_summary_json TEXT")

        # Check payments
        cols = [c[1] for c in conn.exec_driver_sql("PRAGMA table_info(payments)").fetchall()]
        if cols and "refunded_amount" not in cols:
            conn.exec_driver_sql("ALTER TABLE payments ADD COLUMN refunded_amount NUMERIC(12, 2) DEFAULT 0.0 NOT NULL")

        # Check refunds
        cols = [c[1] for c in conn.exec_driver_sql("PRAGMA table_info(refunds)").fetchall()]
        if cols:
            if "order_id" not in cols:
                conn.exec_driver_sql("ALTER TABLE refunds ADD COLUMN order_id VARCHAR(64)")
            if "error_reason" not in cols:
                conn.exec_driver_sql("ALTER TABLE refunds ADD COLUMN error_reason VARCHAR(255)")
            if "reconciled_at" not in cols:
                conn.exec_driver_sql("ALTER TABLE refunds ADD COLUMN reconciled_at DATETIME")

        # Check merchant_audits
        cols = [c[1] for c in conn.exec_driver_sql("PRAGMA table_info(merchant_audits)").fetchall()]
        if cols:
            if "operation_id" not in cols:
                conn.exec_driver_sql("ALTER TABLE merchant_audits ADD COLUMN operation_id VARCHAR(128)")
            if "event_id" not in cols:
                conn.exec_driver_sql("ALTER TABLE merchant_audits ADD COLUMN event_id VARCHAR(128)")

        # Check disputes nullability
        disp_info = conn.exec_driver_sql("PRAGMA table_info(disputes)").fetchall()
        disp_notnull = {c[1]: c[3] for c in disp_info}
        if disp_notnull.get("payment_id") == 1 or disp_notnull.get("reason") == 1:
            conn.exec_driver_sql("PRAGMA foreign_keys = OFF")
            conn.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS disputes__mig (
                    id VARCHAR(64) NOT NULL PRIMARY KEY,
                    merchant_id VARCHAR(64) REFERENCES merchants (id),
                    external_dispute_id VARCHAR(128),
                    transaction_id VARCHAR(64) REFERENCES orders (id),
                    payment_id VARCHAR(64) REFERENCES payments (id),
                    reason_code VARCHAR(128),
                    reason VARCHAR(128),
                    status VARCHAR(64) NOT NULL,
                    amount NUMERIC(12, 2) NOT NULL,
                    currency VARCHAR(3) NOT NULL,
                    opened_at DATETIME,
                    received_at DATETIME,
                    created_at DATETIME NOT NULL,
                    evidences_requested_json TEXT,
                    dispute_life_cycle_stage VARCHAR(64),
                    paypal_dispute_id VARCHAR(128)
                )
            """)
            conn.exec_driver_sql("""
                INSERT INTO disputes__mig (
                    id, merchant_id, external_dispute_id, transaction_id, payment_id,
                    reason_code, reason, status, amount, currency, opened_at,
                    received_at, created_at, evidences_requested_json,
                    dispute_life_cycle_stage, paypal_dispute_id
                )
                SELECT
                    id, merchant_id, external_dispute_id, transaction_id, payment_id,
                    reason_code, reason, status, amount, currency, opened_at,
                    received_at, created_at, evidences_requested_json,
                    dispute_life_cycle_stage, paypal_dispute_id
                FROM disputes
            """)
            conn.exec_driver_sql("DROP TABLE disputes")
            conn.exec_driver_sql("ALTER TABLE disputes__mig RENAME TO disputes")
            conn.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS uq_disputes_merchant_external_id ON disputes (merchant_id, external_dispute_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_disputes_merchant_id ON disputes (merchant_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_disputes_payment_id ON disputes (payment_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_disputes_transaction_id ON disputes (transaction_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_disputes_external_dispute_id ON disputes (external_dispute_id)")
            conn.exec_driver_sql("PRAGMA foreign_keys = ON")

        # Check refunds nullability
        ref_info = conn.exec_driver_sql("PRAGMA table_info(refunds)").fetchall()
        ref_notnull = {c[1]: c[3] for c in ref_info}
        if ref_notnull.get("payment_id") == 1:
            conn.exec_driver_sql("PRAGMA foreign_keys = OFF")
            conn.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS refunds__mig (
                    id VARCHAR(64) NOT NULL PRIMARY KEY,
                    merchant_id VARCHAR(64) REFERENCES merchants (id),
                    payment_id VARCHAR(64) REFERENCES payments (id),
                    order_id VARCHAR(64) REFERENCES orders (id),
                    amount NUMERIC(12, 2) NOT NULL,
                    currency VARCHAR(3) NOT NULL,
                    status VARCHAR(32) NOT NULL,
                    error_reason VARCHAR(255),
                    paypal_refund_id VARCHAR(128),
                    reconciled_at DATETIME,
                    created_at DATETIME NOT NULL
                )
            """)
            conn.exec_driver_sql("""
                INSERT INTO refunds__mig (
                    id, merchant_id, payment_id, order_id, amount,
                    currency, status, error_reason, paypal_refund_id,
                    reconciled_at, created_at
                )
                SELECT
                    id, merchant_id, payment_id, order_id, amount,
                    currency, status, error_reason, paypal_refund_id,
                    reconciled_at, created_at
                FROM refunds
            """)
            conn.exec_driver_sql("DROP TABLE refunds")
            conn.exec_driver_sql("ALTER TABLE refunds__mig RENAME TO refunds")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_refunds_merchant_id ON refunds (merchant_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_refunds_payment_id ON refunds (payment_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_refunds_order_id ON refunds (order_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_refunds_paypal_refund_id ON refunds (paypal_refund_id)")
            conn.exec_driver_sql("PRAGMA foreign_keys = ON")

        # Check evidence_packs schema
        ep_info = conn.exec_driver_sql("PRAGMA table_info(evidence_packs)").fetchall()
        ep_notnull = {c[1]: c[3] for c in ep_info}
        if ep_notnull.get("dispute_id") == 1 or "pack_json" not in ep_notnull:
            conn.exec_driver_sql("PRAGMA foreign_keys = OFF")
            conn.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS evidence_packs__mig (
                    id VARCHAR(64) NOT NULL PRIMARY KEY,
                    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants (id),
                    investigation_id VARCHAR(64) NOT NULL REFERENCES investigations (id),
                    version INTEGER DEFAULT 1 NOT NULL,
                    pack_hash VARCHAR(64) NOT NULL,
                    pack_json JSON NOT NULL,
                    pack_md TEXT NOT NULL,
                    created_at DATETIME NOT NULL
                )
            """)
            conn.exec_driver_sql("DROP TABLE evidence_packs")
            conn.exec_driver_sql("ALTER TABLE evidence_packs__mig RENAME TO evidence_packs")
            conn.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS uq_evidence_packs_investigation_version ON evidence_packs (investigation_id, version)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_evidence_packs_merchant_id ON evidence_packs (merchant_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_evidence_packs_investigation_id ON evidence_packs (investigation_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_evidence_packs_pack_hash ON evidence_packs (pack_hash)")
            conn.exec_driver_sql("PRAGMA foreign_keys = ON")
    except Exception as e:
        print(f"Notice: SQLite schema migration check: {e}")


if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode = WAL;")
        cursor.execute("PRAGMA synchronous = NORMAL;")
        cursor.execute("PRAGMA busy_timeout = 30000;")
        cursor.close()


def acquire_immediate_lock(db: Session):
    """Acquires a RESERVED lock immediately on SQLite for write operations.
    
    Prevents reader-to-writer lock escalation deadlocks while preserving
    concurrent non-blocking WAL reads for authentication and dashboard lookups.
    """
    if is_sqlite:
        try:
            db.connection().exec_driver_sql("BEGIN IMMEDIATE")
        except Exception:
            # If transaction is already active, ignore redundant begin
            pass

# Run migration check immediately on startup
if is_sqlite:
    with engine.connect() as _c:
        migrate_sqlite_schema(_c)
        _c.commit()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency helper yielding database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables registered with declarative Base."""
    # Import models so all tables are registered before create_all
    import db.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database tables initialized successfully.")

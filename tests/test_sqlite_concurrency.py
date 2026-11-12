"""SQLite Concurrency & WAL Lifecycle Test Suite (Phase 1).

Validates:
1. SQLite connection PRAGMA configuration:
   - journal_mode = WAL
   - synchronous = NORMAL (1)
   - busy_timeout = 30000 ms
2. acquire_immediate_lock behavior:
   - Explicitly executes BEGIN IMMEDIATE to acquire RESERVED lock at transaction start.
3. Non-blocking WAL reads during concurrent writes:
   - An independent connection reading data is not blocked by a concurrently open write transaction.
4. Serialized write contention:
   - Two concurrent connections attempting write transactions serialize properly via busy_timeout.
"""

import sqlite3
import time
import pytest
from sqlalchemy import text
from db.session import engine, SessionLocal, acquire_immediate_lock, is_sqlite


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def test_sqlite_pragma_configuration(db):
    """Verify that all connections are configured with WAL, NORMAL sync, and 30s busy timeout."""
    if not is_sqlite:
        pytest.skip("Test specifically verifies SQLite PRAGMAs")

    conn = db.connection()
    # 1. journal_mode == wal
    jm = conn.exec_driver_sql("PRAGMA journal_mode;").scalar()
    assert str(jm).lower() == "wal"

    # 2. synchronous == 1 (NORMAL)
    sync = conn.exec_driver_sql("PRAGMA synchronous;").scalar()
    assert sync in (1, "NORMAL", "1")

    # 3. busy_timeout >= 30000
    timeout = conn.exec_driver_sql("PRAGMA busy_timeout;").scalar()
    assert int(timeout) >= 30000


def test_acquire_immediate_lock_reserves_lock(db):
    """acquire_immediate_lock executes BEGIN IMMEDIATE without error."""
    if not is_sqlite:
        pytest.skip("Test specifically verifies SQLite locking")

    # Acquire RESERVED write lock
    acquire_immediate_lock(db)

    # Subsequent statement succeeds inside the reserved transaction
    val = db.connection().exec_driver_sql("SELECT 1;").scalar()
    assert val == 1
    db.rollback()


def test_wal_mode_allows_concurrent_readers_during_uncommitted_write():
    """WAL invariant: readers never block writers and writers never block readers."""
    if not is_sqlite:
        pytest.skip("Test specifically verifies SQLite WAL non-blocking readers")

    # Raw sqlite3 connection 1 (Writer)
    con_writer = sqlite3.connect("returnguard.db", timeout=30)
    con_writer.execute("PRAGMA journal_mode = WAL;")
    con_writer.execute("PRAGMA busy_timeout = 30000;")

    # Raw sqlite3 connection 2 (Reader)
    con_reader = sqlite3.connect("returnguard.db", timeout=30)
    con_reader.execute("PRAGMA busy_timeout = 30000;")

    try:
        # Writer begins immediate write transaction
        con_writer.execute("BEGIN IMMEDIATE;")
        # Writer inserts temporary row or updates
        con_writer.execute("CREATE TABLE IF NOT EXISTS _test_wal_probe (id INT PRIMARY KEY, val TEXT);")
        con_writer.execute("INSERT OR REPLACE INTO _test_wal_probe VALUES (1, 'in-flight');")

        # Reader performs query on an existing table without blocking
        t_start = time.perf_counter()
        count = con_reader.execute("SELECT count(*) FROM merchants;").fetchone()[0]
        duration = time.perf_counter() - t_start

        # Query completed almost instantaneously without waiting for writer
        assert duration < 1.0
        assert isinstance(count, int)

        # Commit writer
        con_writer.commit()
    finally:
        con_writer.close()
        con_reader.close()


def test_concurrent_write_serialization_and_lock_timeout():
    """Verify that conflicting BEGIN IMMEDIATE calls serialize or respect timeout."""
    if not is_sqlite:
        pytest.skip("Test specifically verifies SQLite write contention")

    # Connection 1 with short timeout for probe
    con1 = sqlite3.connect("returnguard.db", timeout=5)
    con2 = sqlite3.connect("returnguard.db", timeout=0.2)  # 200ms timeout

    try:
        con1.execute("BEGIN IMMEDIATE;")

        # Connection 2 attempts immediate write lock and times out after 200ms
        with pytest.raises(sqlite3.OperationalError) as exc_info:
            con2.execute("BEGIN IMMEDIATE;")
        assert "locked" in str(exc_info.value).lower()

        con1.rollback()
    finally:
        con1.close()
        con2.close()

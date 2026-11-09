"""Tests for Step I0: Phase I database migrations, indexes, constraints, and tenancy."""

import pytest
from sqlalchemy import inspect, create_engine, text
from sqlalchemy.orm import sessionmaker

from db.session import Base
from db.models import (
    Merchant,
    Dispute,
    DisputeDocument,
    Investigation,
    InvestigationFinding,
    LLMRun,
    EvidencePack,
    EvidenceApproval,
    SubmissionResult,
)
from db.migrations import run_migrations


@pytest.fixture
def test_db_engine():
    """In-memory SQLite engine for migration tests."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
    yield engine
    engine.dispose()


def test_migrations_are_idempotent(test_db_engine):
    """Running migrations multiple times must succeed without error."""
    assert run_migrations(test_db_engine) is True
    assert run_migrations(test_db_engine) is True


def test_all_phase_i_tables_have_merchant_id_and_leading_index(test_db_engine):
    """Every Phase I table must carry merchant_id and have an index on or starting with merchant_id."""
    inspector = inspect(test_db_engine)
    phase_i_tables = [
        "disputes",
        "dispute_documents",
        "investigations",
        "investigation_findings",
        "llm_runs",
        "evidence_packs",
        "evidence_approvals",
        "submission_results",
    ]

    for tbl in phase_i_tables:
        columns = {c["name"] for c in inspector.get_columns(tbl)}
        assert "merchant_id" in columns, f"Table {tbl} is missing merchant_id"

        indexes = inspector.get_indexes(tbl)
        has_merchant_index = any(
            idx["column_names"] and idx["column_names"][0] == "merchant_id"
            for idx in indexes
        )
        assert (
            has_merchant_index
        ), f"Table {tbl} must have an index starting with merchant_id"


def test_unique_constraints_hold(test_db_engine):
    """Check unique constraints on disputes, submission_results, and evidence_packs."""
    Session = sessionmaker(bind=test_db_engine)
    db = Session()

    # Seed merchant
    m = Merchant(id="m_test_i0", name="Test I0", email="test@i0.com")
    db.add(m)
    db.commit()

    # 1. Dispute uniqueness on (merchant_id, external_dispute_id)
    d1 = Dispute(
        id="disp_1",
        merchant_id="m_test_i0",
        external_dispute_id="ext_disp_1",
        reason_code="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
        status="OPEN",
        amount=100.0,
        currency="USD",
    )
    db.add(d1)
    db.commit()

    d2_duplicate = Dispute(
        id="disp_2",
        merchant_id="m_test_i0",
        external_dispute_id="ext_disp_1",
        reason_code="OTHER",
        status="OPEN",
        amount=50.0,
        currency="USD",
    )
    db.add(d2_duplicate)
    with pytest.raises(Exception):
        db.commit()
    db.rollback()

    # 2. SubmissionResult uniqueness on submission_key
    inv = Investigation(
        id="inv_1",
        merchant_id="m_test_i0",
        dispute_id="disp_1",
        status="OPEN",
    )
    db.add(inv)
    db.commit()

    sr1 = SubmissionResult(
        id="sr_1",
        merchant_id="m_test_i0",
        investigation_id="inv_1",
        submission_key="sub_key_unique_1",
        pack_hash="hash_1",
        status="SUBMITTED",
    )
    db.add(sr1)
    db.commit()

    sr2_duplicate = SubmissionResult(
        id="sr_2",
        merchant_id="m_test_i0",
        investigation_id="inv_1",
        submission_key="sub_key_unique_1",
        pack_hash="hash_1",
        status="SUBMITTED",
    )
    db.add(sr2_duplicate)
    with pytest.raises(Exception):
        db.commit()
    db.rollback()

    # 3. EvidencePack uniqueness on (investigation_id, version)
    ep1 = EvidencePack(
        id="ep_1",
        merchant_id="m_test_i0",
        investigation_id="inv_1",
        version=1,
        pack_hash="hash_p1",
        pack_json={},
        pack_md="# Pack v1",
    )
    db.add(ep1)
    db.commit()

    ep2_duplicate = EvidencePack(
        id="ep_2",
        merchant_id="m_test_i0",
        investigation_id="inv_1",
        version=1,
        pack_hash="hash_p2",
        pack_json={},
        pack_md="# Pack v2",
    )
    db.add(ep2_duplicate)
    with pytest.raises(Exception):
        db.commit()
    db.rollback()

    db.close()

"""Tests for Step I2: Point-In-Time Case Builder & Deterministic Findings."""

import datetime
import hashlib
import uuid
import pytest
from sqlalchemy.orm import sessionmaker

from db.models import (
    Address,
    Customer,
    Device,
    Dispute,
    DisputeDocument,
    Merchant,
    Order,
    Payment,
    Refund,
    Shipment,
)
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import SessionLocal
from disputes.case_builder import build_case_file
from disputes.findings import compute_findings


@pytest.fixture
def repo_and_merchant():
    db = SessionLocal()
    mid = f"m_i2_{uuid.uuid4().hex[:8]}"
    merchant = Merchant(id=mid, name="Merchant I2", email="i2@example.com")
    db.add(merchant)
    db.commit()

    repo = TenantScopedRepository(db, mid)
    yield repo, db, mid
    db.close()


def test_deterministic_findings_all_fire(repo_and_merchant):
    """Test scenario where all 7 findings fire against a seeded dispute."""
    repo, db, mid = repo_and_merchant

    # 1. Customer, Address, Device
    cid = f"c_{uuid.uuid4().hex[:8]}"
    aid = f"a_{uuid.uuid4().hex[:8]}"
    did = f"d_{uuid.uuid4().hex[:8]}"
    c = Customer(id=cid, merchant_id=mid, email="buyer@ex.com", phone="+15550001111")
    a = Address(
        id=aid,
        merchant_id=mid,
        customer_id=cid,
        line1="123 Oak St",
        city="San Jose",
        state="CA",
        pincode="95131",
    )
    d = Device(id=did, merchant_id=mid, customer_id=cid, device_hash="dhash_i2")
    db.add_all([c, a, d])

    # Shared address with a 2nd customer
    c2 = Customer(
        id=f"c2_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        email="buyer2@ex.com",
        phone="+15550002222",
    )
    db.add(c2)
    db.commit()

    base_time = datetime.datetime(2026, 11, 1, 12, 0, 0, tzinfo=datetime.timezone.utc)

    # Order by 2nd customer to same address (triggers F-ADDRESS-SHARED)
    o_shared = Order(
        id=f"ord_shared_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=c2.id,
        address_id=aid,
        device_id=did,
        order_time=base_time - datetime.timedelta(days=10),
        channel="paypal",
        order_value=50.0,
        currency="USD",
        category="retail",
    )
    db.add(o_shared)

    # 3 prior orders within 24 hours (triggers F-VELOCITY-PRIOR)
    t_velo1 = base_time - datetime.timedelta(days=5, hours=2)
    t_velo2 = base_time - datetime.timedelta(days=5, hours=1)
    t_velo3 = base_time - datetime.timedelta(days=5)

    o_v1 = Order(
        id=f"ord_v1_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id=aid,
        device_id=did,
        order_time=t_velo1,
        channel="paypal",
        order_value=100.0,
        category="retail",
    )
    o_v2 = Order(
        id=f"ord_v2_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id=aid,
        device_id=did,
        order_time=t_velo2,
        channel="paypal",
        order_value=110.0,
        category="retail",
    )
    o_v3 = Order(
        id=f"ord_v3_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id=aid,
        device_id=did,
        order_time=t_velo3,
        channel="paypal",
        order_value=120.0,
        category="retail",
    )
    db.add_all([o_v1, o_v2, o_v3])

    # Prior order delivered then refunded (triggers F-DELIVERED-THEN-REFUND)
    o_del = Order(
        id=f"ord_del_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id=aid,
        device_id=did,
        order_time=base_time - datetime.timedelta(days=20),
        channel="paypal",
        order_value=200.0,
        category="retail",
    )
    db.add(o_del)
    db.commit()

    shipment = Shipment(
        id=f"ship_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        order_id=o_del.id,
        carrier="UPS",
        tracking_number="1Z9999999999999999",
        status="delivered",
    )
    p_del = Payment(
        id=f"pay_del_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        order_id=o_del.id,
        channel="paypal",
        amount=200.0,
        currency="USD",
        status="completed",
    )
    db.add_all([shipment, p_del])
    db.commit()

    r1 = Refund(
        id=f"ref_1_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        payment_id=p_del.id,
        amount=200.0,
        currency="USD",
        status="completed",
        created_at=base_time - datetime.timedelta(days=19),
    )
    # 2 more refunds to exceed threshold > 2 (triggers F-REFUND-COUNT)
    r2 = Refund(
        id=f"ref_2_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        payment_id=p_del.id,
        amount=10.0,
        currency="USD",
        status="completed",
        created_at=base_time - datetime.timedelta(days=15),
    )
    r3 = Refund(
        id=f"ref_3_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        payment_id=p_del.id,
        amount=15.0,
        currency="USD",
        status="completed",
        created_at=base_time - datetime.timedelta(days=12),
    )
    db.add_all([r1, r2, r3])

    # Prior dispute on o_v1 (triggers F-PRIOR-DISPUTES)
    prev_disp = Dispute(
        id=f"disp_prev_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        external_dispute_id="PP-D-PREV-01",
        transaction_id=o_v1.id,
        reason_code="UNAUTHORISED",
        status="UNDER_REVIEW",
        amount=100.0,
        currency="USD",
        opened_at=base_time - datetime.timedelta(days=4),
        received_at=base_time - datetime.timedelta(days=4),
    )
    db.add(prev_disp)

    # Undisputed prior order o_v2 (triggers F-ADDRESS-MATCH-PRIOR)
    # Target transaction being disputed
    target_order = Order(
        id=f"ord_target_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id=aid,
        device_id=did,
        order_time=base_time,
        channel="paypal",
        order_value=350.0,
        currency="USD",
        category="electronics",
    )
    db.add(target_order)
    db.commit()

    # The current dispute (INR reason, missing PROOF_OF_DELIVERY triggers F-EVIDENCE-MISSING)
    current_disp = Dispute(
        id=f"disp_curr_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        external_dispute_id="PP-D-CURR-01",
        transaction_id=target_order.id,
        reason_code="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
        status="OPEN",
        amount=350.0,
        currency="USD",
        opened_at=base_time + datetime.timedelta(hours=1),
        received_at=base_time + datetime.timedelta(hours=1),
    )
    db.add(current_disp)
    db.commit()

    # Build case and compute findings
    case_file = build_case_file(repo, current_disp.id)
    findings = compute_findings(case_file)

    finding_codes = {f.finding_code for f in findings}
    assert "F-REFUND-COUNT" in finding_codes
    assert "F-DELIVERED-THEN-REFUND" in finding_codes
    assert "F-ADDRESS-MATCH-PRIOR" in finding_codes
    assert "F-ADDRESS-SHARED" in finding_codes
    assert "F-VELOCITY-PRIOR" in finding_codes
    assert "F-PRIOR-DISPUTES" in finding_codes
    assert "F-EVIDENCE-MISSING" in finding_codes

    # Verify all alias_refs use sanitized aliases and do not leak real IDs
    for f in findings:
        for ref in f.alias_refs:
            assert not ref.startswith("m_")
            assert not ref.startswith("ord_")
            assert not ref.startswith("ref_")
            assert not ref.startswith("disp_prev_")


def test_clean_control_case_no_adversarial_findings(repo_and_merchant):
    """Test clean customer dispute triggers only F-EVIDENCE-MISSING, no fraud findings."""
    repo, db, mid = repo_and_merchant

    cid = f"c_clean_{uuid.uuid4().hex[:8]}"
    aid = f"a_clean_{uuid.uuid4().hex[:8]}"
    did = f"d_clean_{uuid.uuid4().hex[:8]}"
    c = Customer(id=cid, merchant_id=mid, email="clean@ex.com", phone="+15559990000")
    a = Address(
        id=aid,
        merchant_id=mid,
        customer_id=cid,
        line1="456 Elm St",
        city="San Jose",
        state="CA",
        pincode="95131",
    )
    d = Device(id=did, merchant_id=mid, customer_id=cid, device_hash="dhash_clean")
    db.add_all([c, a, d])

    t0 = datetime.datetime(2026, 11, 1, 10, 0, 0, tzinfo=datetime.timezone.utc)
    o = Order(
        id=f"ord_clean_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id=aid,
        device_id=did,
        order_time=t0,
        channel="paypal",
        order_value=50.0,
        category="retail",
    )
    db.add(o)
    db.commit()

    disp = Dispute(
        id=f"disp_clean_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        external_dispute_id="PP-D-CLEAN",
        transaction_id=o.id,
        reason_code="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
        status="OPEN",
        amount=50.0,
        currency="USD",
        opened_at=t0 + datetime.timedelta(hours=2),
        received_at=t0 + datetime.timedelta(hours=2),
    )
    db.add(disp)
    db.commit()

    case_file = build_case_file(repo, disp.id)
    findings = compute_findings(case_file)

    codes = [f.finding_code for f in findings]
    assert "F-REFUND-COUNT" not in codes
    assert "F-DELIVERED-THEN-REFUND" not in codes
    assert "F-ADDRESS-SHARED" not in codes
    assert "F-VELOCITY-PRIOR" not in codes
    assert "F-PRIOR-DISPUTES" not in codes


def test_pit_leakage_future_events_do_not_alter_case_file(repo_and_merchant):
    """Point-in-time leakage test: adding future rows does not change case_hash or findings."""
    repo, db, mid = repo_and_merchant

    cid = f"c_pit_{uuid.uuid4().hex[:8]}"
    aid = f"a_pit_{uuid.uuid4().hex[:8]}"
    did = f"d_pit_{uuid.uuid4().hex[:8]}"
    c = Customer(id=cid, merchant_id=mid, email="pit@ex.com", phone="+15558887777")
    a = Address(
        id=aid,
        merchant_id=mid,
        customer_id=cid,
        line1="789 Pine St",
        city="San Jose",
        state="CA",
        pincode="95131",
    )
    d = Device(id=did, merchant_id=mid, customer_id=cid, device_hash="dhash_pit")
    db.add_all([c, a, d])

    t_order = datetime.datetime(2026, 11, 1, 10, 0, 0, tzinfo=datetime.timezone.utc)
    o = Order(
        id=f"ord_pit_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id=aid,
        device_id=did,
        order_time=t_order,
        channel="paypal",
        order_value=80.0,
        category="retail",
    )
    db.add(o)
    db.commit()

    disp = Dispute(
        id=f"disp_pit_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        external_dispute_id="PP-D-PIT",
        transaction_id=o.id,
        reason_code="UNAUTHORISED",
        status="OPEN",
        amount=80.0,
        currency="USD",
        opened_at=t_order + datetime.timedelta(hours=2),
        received_at=t_order + datetime.timedelta(hours=2),
    )
    db.add(disp)
    db.commit()

    # Snapshot 1
    case_1 = build_case_file(repo, disp.id)
    findings_1 = compute_findings(case_1)

    # Add future order (placed AFTER t_order)
    future_order = Order(
        id=f"ord_future_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id=aid,
        device_id=did,
        order_time=t_order + datetime.timedelta(days=2),
        channel="paypal",
        order_value=999.0,
        category="retail",
    )
    db.add(future_order)
    db.commit()

    # Snapshot 2 must be byte-identical
    case_2 = build_case_file(repo, disp.id)
    findings_2 = compute_findings(case_2)

    assert case_1.case_hash == case_2.case_hash
    assert len(findings_1) == len(findings_2)
    assert [f.finding_code for f in findings_1] == [f.finding_code for f in findings_2]


def test_alias_round_trip_private_mapping(repo_and_merchant):
    """Test private alias mapper accurately resolves aliases back to real IDs."""
    repo, db, mid = repo_and_merchant

    cid = f"c_rt_{uuid.uuid4().hex[:8]}"
    aid = f"a_rt_{uuid.uuid4().hex[:8]}"
    did = f"d_rt_{uuid.uuid4().hex[:8]}"
    c = Customer(id=cid, merchant_id=mid, email="rt@ex.com", phone="+15554443333")
    a = Address(
        id=aid,
        merchant_id=mid,
        customer_id=cid,
        line1="101 Maple St",
        city="San Jose",
        state="CA",
        pincode="95131",
    )
    d = Device(id=did, merchant_id=mid, customer_id=cid, device_hash="dhash_rt")
    db.add_all([c, a, d])

    t = datetime.datetime(2026, 11, 1, 10, 0, 0, tzinfo=datetime.timezone.utc)
    o = Order(
        id=f"ord_rt_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        customer_id=cid,
        address_id=aid,
        device_id=did,
        order_time=t,
        channel="paypal",
        order_value=150.0,
        category="retail",
    )
    db.add(o)
    db.commit()

    disp = Dispute(
        id=f"disp_rt_{uuid.uuid4().hex[:8]}",
        merchant_id=mid,
        external_dispute_id="PP-D-RT",
        transaction_id=o.id,
        reason_code="DEFAULT",
        status="OPEN",
        amount=150.0,
        currency="USD",
        opened_at=t + datetime.timedelta(hours=1),
        received_at=t + datetime.timedelta(hours=1),
    )
    db.add(disp)
    db.commit()

    case = build_case_file(repo, disp.id)

    # Check that T1 resolves back to target order ID
    assert case.private_alias_map.get("T1") == o.id
    assert case.private_alias_map.get(case.dispute_alias) == disp.id

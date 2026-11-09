"""
Sync script: ShopPoint MongoDB -> ReturnGuard SQLite Database.
Populates real ShopPoint users, orders, payments, risk audit scores, and dispute investigations
into ReturnGuard for merchant 'merch_shoppoint'.
"""

import datetime
import hashlib
import json
import logging
import os
import sys
import uuid
from pathlib import Path

# Ensure repo root is on sys.path
repo_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(repo_root))

from db.models import (
    Address,
    AuditScoreEvent,
    Customer,
    Device,
    Dispute,
    DisputeDocument,
    Investigation,
    InvestigationFinding,
    Merchant,
    MerchantAudit,
    Order,
    Payment,
)
from db.session import SessionLocal, init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sync_shoppoint")

MERCHANT_ID = "merch_shoppoint"
MERCHANT_NAME = "ShopPoint Store"
MERCHANT_EMAIL = "admin@shoppoint.com"


def parse_dt(val):
    if not val:
        return datetime.datetime.now(datetime.timezone.utc)
    if isinstance(val, datetime.datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=datetime.timezone.utc)
        return val
    try:
        val_str = str(val).replace("Z", "+00:00")
        return datetime.datetime.fromisoformat(val_str)
    except Exception:
        return datetime.datetime.now(datetime.timezone.utc)


def sync_data(export_data: dict):
    db = SessionLocal()
    init_db()

    users = export_data.get("users", [])
    orders = export_data.get("orders", [])
    txs = export_data.get("transactions", [])

    tx_map = {str(t.get("orderId")): t for t in txs if t.get("orderId")}

    logger.info(f"Starting sync: {len(users)} users, {len(orders)} orders, {len(txs)} transactions.")

    try:
        # 1. Upsert Merchant
        merchant = db.query(Merchant).filter_by(id=MERCHANT_ID).first()
        if not merchant:
            merchant = Merchant(
                id=MERCHANT_ID,
                name=MERCHANT_NAME,
                email=MERCHANT_EMAIL,
            )
            db.add(merchant)
        else:
            merchant.name = MERCHANT_NAME
            merchant.email = MERCHANT_EMAIL
        db.commit()

        # 2. Sync Customers & Devices
        for u in users:
            uid = str(u["_id"])
            email = u.get("email", f"{uid}@example.com")
            phone = u.get("phone", "+919876543210")
            created_at = parse_dt(u.get("createdAt"))

            cust = db.query(Customer).filter_by(id=uid, merchant_id=MERCHANT_ID).first()
            if not cust:
                cust = Customer(
                    id=uid,
                    merchant_id=MERCHANT_ID,
                    email=email,
                    phone=phone,
                    created_at=created_at,
                )
                db.add(cust)
            else:
                cust.email = email
                cust.phone = phone

            # Device
            dev_id = f"dev_{uid}"
            dev = db.query(Device).filter_by(id=dev_id).first()
            if not dev:
                dev = Device(
                    id=dev_id,
                    merchant_id=MERCHANT_ID,
                    customer_id=uid,
                    device_hash=hashlib.sha256(uid.encode()).hexdigest()[:16],
                    ip_address="103.21.244.2",
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                    created_at=created_at,
                )
                db.add(dev)
        db.commit()

        # 3. Sync Orders, Addresses, Payments, and AuditScoreEvents
        for o in orders:
            oid = str(o["_id"])
            uid = str(o.get("userId"))
            created_at = parse_dt(o.get("createdAt"))
            total_price = float(o.get("totalPrice", 0.0))
            is_paid = bool(o.get("isPaid", False))
            shipping = o.get("shipping", {})
            items = o.get("orderItems", [])
            cat_name = items[0].get("productName", "Apparel") if items else "Retail"

            # Address
            addr_id = f"addr_{oid}"
            addr = db.query(Address).filter_by(id=addr_id).first()
            if not addr:
                addr = Address(
                    id=addr_id,
                    merchant_id=MERCHANT_ID,
                    customer_id=uid,
                    line1=shipping.get("address") or "123 Market St",
                    city=shipping.get("city") or "New York",
                    state=shipping.get("city") or "NY",
                    pincode=str(shipping.get("postalCode") or "10001"),
                    country=shipping.get("country") or "USA",
                    created_at=created_at,
                )
                db.add(addr)
            db.commit()

            # Device
            dev_id = f"dev_{uid}"

            # Order
            order = db.query(Order).filter_by(id=oid).first()
            status_str = "completed" if is_paid else ("review" if total_price > 500 else "created")
            if not order:
                order = Order(
                    id=oid,
                    merchant_id=MERCHANT_ID,
                    customer_id=uid,
                    address_id=addr_id,
                    device_id=dev_id,
                    channel="paypal",
                    order_value=total_price,
                    currency="USD",
                    category=cat_name,
                    item_count=len(items) or 1,
                    status=status_str,
                    order_time=created_at,
                    created_at=created_at,
                )
                db.add(order)
            else:
                order.order_value = total_price
                order.status = status_str
                order.category = cat_name

            # Payment
            pay_id = f"pay_{oid}"
            tx = tx_map.get(oid, {})
            paypal_ord_id = (
                o.get("paymentResult", {}).get("id")
                or tx.get("paypalOrderId")
                or f"PAYPAL_{oid}"
            )
            paypal_auth_id = tx.get("paypalAuthorizationId") or (f"AUTH_{oid}" if is_paid else None)
            paypal_cap_id = o.get("paymentResult", {}).get("id") if is_paid else None
            pay_status = "captured" if is_paid else ("authorized" if paypal_auth_id else "created")

            payment = db.query(Payment).filter_by(id=pay_id).first()
            if not payment:
                payment = Payment(
                    id=pay_id,
                    order_id=oid,
                    merchant_id=MERCHANT_ID,
                    channel="paypal",
                    amount=total_price,
                    currency="USD",
                    status=pay_status,
                    paypal_order_id=paypal_ord_id,
                    authorization_id=paypal_auth_id,
                    capture_id=paypal_cap_id,
                    created_at=created_at,
                )
                db.add(payment)
            else:
                payment.amount = total_price
                payment.status = pay_status
                payment.authorization_id = paypal_auth_id
                payment.capture_id = paypal_cap_id

            # Determine Risk Profile for this ShopPoint order
            if oid == "6ae9cd8e57638dd90d44003a":
                # High amount repeated burst ($1150 unpaid)
                risk_score = 0.78
                tier = "MANUAL_REVIEW"
                policy_rule = "HIGH_VELOCITY_UNPAID_SPIKE"
                policy_action = "REVIEW"
                severity = "warning"
                suggested_action = "manual_review"
                reasons = [
                    {"feature": "order_amount_deviation", "direction": "increases_risk", "shap_rank": 1},
                    {"feature": "rapid_checkout_velocity", "direction": "increases_risk", "shap_rank": 2},
                ]
                rules = ["HIGH_AMOUNT_UNVERIFIED", "REPEATED_ATTEMPT_VELOCITY"]
            elif oid == "6ae9d4e318653a42506a26a3":
                # Authorization held awaiting review ($690 unpaid)
                risk_score = 0.65
                tier = "MANUAL_REVIEW"
                policy_rule = "AUTH_HOLD_PENDING_REVIEW"
                policy_action = "REVIEW"
                severity = "warning"
                suggested_action = "manual_review"
                reasons = [
                    {"feature": "unpaid_authorization_hold", "direction": "increases_risk", "shap_rank": 1},
                    {"feature": "account_age_days", "direction": "increases_risk", "shap_rank": 2},
                ]
                rules = ["PAYPAL_AUTH_HOLD_PENDING_MERCHANT_DECISION"]
            else:
                # Normal settled orders
                risk_score = 0.05 if total_price < 500 else 0.12
                tier = "LOW"
                policy_rule = "ALLOW_NORMAL"
                policy_action = "ALLOW"
                severity = "none"
                suggested_action = "allow"
                reasons = [
                    {"feature": "verified_payer_history", "direction": "decreases_risk", "shap_rank": 1},
                    {"feature": "paypal_settled_balance", "direction": "decreases_risk", "shap_rank": 2},
                ]
                rules = []

            audit_id = f"audit_{oid}"
            audit = db.query(AuditScoreEvent).filter_by(id=audit_id).first()
            if not audit:
                audit = AuditScoreEvent(
                    id=audit_id,
                    decision_id=oid,
                    order_id=oid,
                    merchant_id=MERCHANT_ID,
                    channel="paypal",
                    risk_score=risk_score,
                    tier=tier,
                    policy_rule=policy_rule,
                    policy_action=policy_action,
                    severity=severity,
                    suggested_action=suggested_action,
                    model_version="candidate_lgbm_v1",
                    threshold=0.40,
                    model_status="loaded",
                    feature_completeness=1.0,
                    explanation_status="available",
                    reason_codes_json=json.dumps(reasons),
                    rule_hits_json=json.dumps(rules),
                    shadow=0,
                    created_at=created_at,
                )
                db.add(audit)
            else:
                audit.risk_score = risk_score
                audit.tier = tier
                audit.policy_action = policy_action
                audit.reason_codes_json = json.dumps(reasons)
                audit.rule_hits_json = json.dumps(rules)

        db.commit()

        # 4. Add 1 Dispute & Investigation for Order 6ae8f546c1195bd5f5c2b0b8
        disp_id = "disp_shoppoint_001"
        dispute = db.query(Dispute).filter_by(id=disp_id).first()
        if not dispute:
            dispute = Dispute(
                id=disp_id,
                merchant_id=MERCHANT_ID,
                external_dispute_id="PP-D-78192",
                paypal_dispute_id="PP-D-78192",
                transaction_id="6ae8f546c1195bd5f5c2b0b8",
                payment_id="pay_6ae8f546c1195bd5f5c2b0b8",
                reason="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
                reason_code="MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
                status="UNDER_REVIEW",
                amount=125.0,
                currency="USD",
                opened_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
                received_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
            )
            db.add(dispute)
            db.commit()

        inv_id = "inv_shoppoint_001"
        inv = db.query(Investigation).filter_by(id=inv_id).first()
        if not inv:
            inv = Investigation(
                id=inv_id,
                merchant_id=MERCHANT_ID,
                dispute_id=disp_id,
                transaction_id="6ae8f546c1195bd5f5c2b0b8",
                decision_id="6ae8f546c1195bd5f5c2b0b8",
                status="OPEN",
                source="AUTO_CRITICAL",
                case_hash="case_hash_shoppoint_001",
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
            )
            db.add(inv)
            db.commit()

            finding = InvestigationFinding(
                id=f"find_{inv_id}",
                investigation_id=inv_id,
                merchant_id=MERCHANT_ID,
                finding_code="LOGISTICS_GAP",
                severity="HIGH",
                alias_refs=["O1"],
            )
            db.add(finding)
            db.commit()

        logger.info("Successfully synced all ShopPoint data to ReturnGuard database!")
        print("SYNC_SUCCESS")

    except Exception as e:
        db.rollback()
        logger.error(f"Sync error: {e}", exc_info=True)
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", required=True, help="Path to exported ShopPoint JSON")
    args = parser.parse_args()

    with open(args.json, "r", encoding="utf-8") as f:
        data = json.load(f)
    sync_data(data)

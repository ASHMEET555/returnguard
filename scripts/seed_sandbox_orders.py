"""
Phase D Sandbox Order Seeder.

Reads adapted PayPal Orders v2 JSON (from scripts/seed_adapter.py) and seeds them
into ReturnGuard database with full entity relationships (Merchant, Customer, Address,
Device, Order, Payment, and AuditScoreEvent).

Usage:
    python scripts/seed_sandbox_orders.py --count 25
"""

import argparse
import datetime
import json
import logging
import sys
import uuid
from pathlib import Path

# Ensure repo root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db.models import (
    Address,
    AuditScoreEvent,
    Customer,
    Device,
    Merchant,
    Order,
    Payment,
)
from db.session import SessionLocal, init_db
from services.score import get_scoring_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def seed_orders_from_file(seed_file: Path, count: int = 25) -> int:
    """Read adapted PayPal orders JSON and persist into the database."""
    if not seed_file.exists():
        raise FileNotFoundError(f"Seed file not found: {seed_file}. Run scripts/seed_adapter.py first.")

    with open(seed_file, "r", encoding="utf-8") as f:
        orders_data = json.load(f)

    db = SessionLocal()
    init_db()

    seeded_count = 0
    try:
        for idx, item in enumerate(orders_data[:count]):
            order_id = item.get("id") or f"ORD-SANDBOX-{uuid.uuid4().hex[:8]}"

            # Check if order already exists
            existing = db.query(Order).filter_by(id=order_id).first()
            if existing:
                continue

            purchase_unit = item.get("purchase_units", [{}])[0]
            amount_val = float(purchase_unit.get("amount", {}).get("value", 100.0))
            currency = purchase_unit.get("amount", {}).get("currency_code", "USD")
            payee = purchase_unit.get("payee", {})
            merchant_id = payee.get("merchant_id", "merch_sandbox_1")
            category = payee.get("merchant_category", "electronics")

            payer = item.get("payer", {})
            customer_id = payer.get("payer_id", f"cust_sandbox_{idx}")

            shipping_addr = purchase_unit.get("shipping", {}).get("address", {})
            state = shipping_addr.get("admin_area_1", "CA")
            country = shipping_addr.get("country_code", "US")

            device_id = item.get("app_session", {}).get("device_id", f"dev_sandbox_{idx}")

            # 1. Upsert Merchant
            merchant = db.query(Merchant).filter_by(id=merchant_id).first()
            if not merchant:
                merchant = Merchant(
                    id=merchant_id,
                    name=f"Merchant {merchant_id}",
                    email=f"{merchant_id}@example.com",
                )
                db.add(merchant)

            # 2. Upsert Customer
            customer = db.query(Customer).filter_by(id=customer_id).first()
            if not customer:
                customer = Customer(
                    id=customer_id,
                    merchant_id=merchant_id,
                    email=f"{customer_id}@example.com",
                    phone=f"+1555{idx:07d}",
                )
                db.add(customer)

            # 3. Create Address
            address_id = f"addr_{order_id}"
            address = db.query(Address).filter_by(id=address_id).first()
            if not address:
                address = Address(
                    id=address_id,
                    customer_id=customer_id,
                    line1="123 Sandbox Way",
                    city="San Jose",
                    state=state,
                    pincode="95131",
                    country=country,
                )
                db.add(address)

            # 4. Create Device
            device = db.query(Device).filter_by(id=device_id).first()
            if not device:
                device = Device(
                    id=device_id,
                    customer_id=customer_id,
                    device_hash=f"hash_{device_id}",
                    ip_address="192.168.1.1",
                )
                db.add(device)

            db.commit()

            # 5. Create Order
            now_dt = datetime.datetime.now(datetime.UTC)
            order = Order(
                id=order_id,
                merchant_id=merchant_id,
                customer_id=customer_id,
                address_id=address_id,
                device_id=device_id,
                channel="paypal",
                order_value=amount_val,
                currency=currency,
                category=category,
                status="authorized",
                order_time=now_dt,
            )
            db.add(order)

            # 6. Create Payment
            payment_id = f"PAY-{order_id}"
            payment = Payment(
                id=payment_id,
                order_id=order_id,
                channel="paypal",
                amount=amount_val,
                currency=currency,
                status="authorized",
                paypal_order_id=order_id,
                authorization_id=f"AUTH-{order_id}",
            )
            db.add(payment)

            # 7. Evaluate ReturnGuard Risk & Record AuditScoreEvent
            eval_payload = {
                "order_id": order_id,
                "amount": amount_val,
                "channel": "paypal",
                "customer_id": customer_id,
                "device_id": device_id,
                "geo_region": state,
                "status": "authorized",
            }
            try:
                scoring_svc = get_scoring_service()
                decision = scoring_svc.score(eval_payload)
                audit_event = AuditScoreEvent(
                    id=str(uuid.uuid4()),
                    order_id=order_id,
                    model_version=decision.get("model_version", "candidate_lgbm_v1"),
                    risk_score=decision.get("risk_score", 0.0),
                    tier=decision.get("tier", "LOW"),
                    suggested_action=decision.get("suggested_action", "allow"),
                    reason_codes_json=json.dumps(decision.get("reason_codes", [])),
                    feature_snapshot_json=json.dumps(decision.get("feature_snapshot", {})),
                )
                db.add(audit_event)
            except Exception as eval_err:
                logger.warning(f"Could not score sandbox order {order_id}: {eval_err}")

            db.commit()
            seeded_count += 1

        logger.info(f"Successfully seeded {seeded_count} sandbox orders into the database.")
        return seeded_count

    except Exception as exc:
        db.rollback()
        logger.error(f"Seeding failed: {exc}")
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed sandbox orders from adapter JSON file.")
    parser.add_argument(
        "--file",
        type=Path,
        default=Path("data/sandbox_orders_seed.json"),
        help="Path to adapted sandbox orders JSON file.",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=25,
        help="Number of sandbox orders to seed.",
    )
    args = parser.parse_args()

    seed_orders_from_file(args.file, count=args.count)

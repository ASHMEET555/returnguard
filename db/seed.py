"""Database initialization and automatic seed loader for ReturnGuard."""

import datetime
import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session

from db.models import (
    Address,
    APIKey,
    AuditScoreEvent,
    Customer,
    Device,
    Dispute,
    Investigation,
    Merchant,
    Order,
    Payment,
)
from db.session import SessionLocal, init_db

logger = logging.getLogger("returnguard.db.seed")


def parse_dt(v):
    if not v:
        return None
    if isinstance(v, datetime.datetime):
        return v
    try:
        return datetime.datetime.fromisoformat(str(v))
    except Exception:
        return datetime.datetime.now(datetime.timezone.utc)


def _filter_fields(model_cls, raw_dict: dict) -> dict:
    """Filters dictionary to only contain valid columns for model, converting datetime fields."""
    cols = {c.name: c for c in model_cls.__table__.columns}
    filtered = {}
    for k, v in raw_dict.items():
        if k in cols:
            col_type_str = str(cols[k].type).upper()
            if "DATETIME" in col_type_str or "TIMESTAMP" in col_type_str:
                filtered[k] = parse_dt(v)
            else:
                filtered[k] = v
    return filtered


def seed_default_data(db: Session) -> bool:
    """Seed default ShopPoint dataset if database has no decisions for merch_shoppoint."""
    try:
        # Check if audit events already exist
        existing_count = (
            db.query(AuditScoreEvent)
            .filter(AuditScoreEvent.merchant_id == "merch_shoppoint")
            .count()
        )
        if existing_count > 0:
            logger.info("ShopPoint dataset already present; skipping seed.")
            return False

        seed_file = Path(__file__).resolve().parent.parent / "data" / "seed_shoppoint.json"
        if not seed_file.exists():
            logger.warning("Seed file %s not found; skipping default seed.", seed_file)
            return False

        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Map entity collections to their models
        model_mapping = [
            ("merchants", Merchant),
            ("customers", Customer),
            ("addresses", Address),
            ("devices", Device),
            ("orders", Order),
            ("payments", Payment),
            ("audit_score_events", AuditScoreEvent),
            ("disputes", Dispute),
            ("investigations", Investigation),
            ("api_keys", APIKey),
        ]

        for key, model_cls in model_mapping:
            items = data.get(key, [])
            for item in items:
                item_id = item.get("id")
                if item_id and not db.query(model_cls).filter_by(id=item_id).first():
                    fields = _filter_fields(model_cls, item)
                    db.add(model_cls(**fields))
            db.commit()

        logger.info("Default ShopPoint dataset seeded successfully!")
        return True
    except Exception as e:
        db.rollback()
        logger.error("Error seeding default data: %s", e, exc_info=True)
        return False


def init_and_seed_db():
    """Initializes tables and populates default data."""
    init_db()
    db = SessionLocal()
    try:
        seed_default_data(db)
    finally:
        db.close()

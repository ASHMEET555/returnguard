"""
Feature builder wrapper for ReturnGuard.

Computes the verified 15-feature model vector strictly point-in-time (as-of timestamp),
formats deterministic canonical feature_snapshot_json, and writes to audit schema.
"""

from dataclasses import asdict, dataclass
import datetime
import json
from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd

from ml.features.build_features import build_features, FEATURE_COLUMNS
from db.models import AuditScoreEvent, Order


@dataclass(frozen=True)
class FeatureResult:
    """Immutable container for built feature outputs."""
    order_id: str
    as_of: str
    features: Dict[str, float]
    feature_vector: List[float]
    feature_snapshot_json: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _normalize_dt(val: Any) -> pd.Timestamp:
    """Normalize timestamp to tz-naive UTC representation for Pandas compatibility."""
    dt = pd.to_datetime(val)
    if hasattr(dt, "tz") and dt.tz is not None:
        return dt.tz_convert("UTC").tz_localize(None)
    return dt


class FeatureBuilder:
    """Builds point-in-time features strictly as-of an evaluation timestamp."""

    def __init__(self, db_session: Any = None):
        self.session = db_session

    def build(
        self,
        order_id: str,
        as_of: Optional[Union[str, datetime.datetime]] = None,
        order_record: Optional[Dict[str, Any]] = None,
        prior_records: Optional[List[Dict[str, Any]]] = None,
        db_session: Any = None,
    ) -> FeatureResult:
        """
        Builds the 15-feature vector strictly as-of `as_of` and serializes
        deterministic feature_snapshot_json.

        Parameters
        ----------
        order_id : str
            Order or transaction identifier.
        as_of : str or datetime, optional
            Point-in-time cutoff timestamp. If None, uses order timestamp or current UTC.
        order_record : dict, optional
            Raw transaction fields for this order.
        prior_records : list of dict, optional
            Historical transaction records for the customer.
        db_session : Session, optional
            SQLAlchemy session to write feature_snapshot_json to audit_score_events.

        Returns
        -------
        FeatureResult
            Dataclass containing feature vector and canonical snapshot JSON.
        """
        session = db_session or self.session

        # 1. Resolve cutoff timestamp
        if as_of is None:
            if order_record and order_record.get("timestamp"):
                as_of_dt = _normalize_dt(order_record["timestamp"])
            else:
                as_of_dt = _normalize_dt(datetime.datetime.now(datetime.timezone.utc))
        else:
            as_of_dt = _normalize_dt(as_of)

        as_of_str = as_of_dt.isoformat()

        # 2. Assemble records for feature building
        if order_record is not None:
            target_row = dict(order_record)
            target_row["transaction_id"] = order_id
            target_row["timestamp"] = _normalize_dt(target_row.get("timestamp", as_of_dt))
            target_row["account_created"] = _normalize_dt(target_row.get("account_created", as_of_dt))

            rows = []
            if prior_records:
                for r in prior_records:
                    r_clean = dict(r)
                    r_clean["timestamp"] = _normalize_dt(r_clean["timestamp"])
                    r_clean["account_created"] = _normalize_dt(r_clean.get("account_created", target_row["account_created"]))
                    # Strictly filter records <= as_of
                    if r_clean["timestamp"] <= as_of_dt and r_clean.get("transaction_id") != order_id:
                        rows.append(r_clean)

            rows.append(target_row)
            df = pd.DataFrame(rows)
            feats_df = build_features(df)
            match = feats_df[feats_df["transaction_id"] == order_id]
            if len(match) == 0:
                raise ValueError(f"Could not compute features for order_id {order_id}")
            feature_row = match[FEATURE_COLUMNS].iloc[0]
        elif session is not None:
            # Query from DB if available
            order_obj = session.query(Order).filter(Order.id == order_id).first()
            if not order_obj:
                raise ValueError(f"Order {order_id} not found in database")
            # Build minimal frame from Order
            row = {
                "transaction_id": order_obj.id,
                "customer_id": order_obj.customer_id,
                "merchant_id": order_obj.merchant_id,
                "merchant_category": order_obj.category,
                "timestamp": _normalize_dt(order_obj.order_time),
                "amount": float(order_obj.order_value),
                "device_id": order_obj.device_id,
                "geo_region": "DEFAULT",
                "payment_method": "card",
                "status": "success",
                "account_created": _normalize_dt(order_obj.created_at),
            }
            feats_df = build_features(pd.DataFrame([row]))
            feature_row = feats_df[FEATURE_COLUMNS].iloc[0]
        else:
            # Fallback cold-start synthesis for stand-alone order_id
            row = {
                "transaction_id": order_id,
                "customer_id": f"cust_{order_id}",
                "merchant_id": "merch_1",
                "merchant_category": "retail",
                "timestamp": as_of_dt,
                "amount": 1000.0,
                "device_id": f"dev_{order_id}",
                "geo_region": "IN-KA",
                "payment_method": "card",
                "status": "success",
                "account_created": as_of_dt,
            }
            feats_df = build_features(pd.DataFrame([row]))
            feature_row = feats_df[FEATURE_COLUMNS].iloc[0]

        # 3. Canonical feature dictionary and vector
        feature_dict: Dict[str, float] = {}
        feature_vector: List[float] = []
        for col in sorted(FEATURE_COLUMNS):
            val = float(feature_row[col])
            feature_dict[col] = round(val, 6)

        for col in FEATURE_COLUMNS:
            feature_vector.append(round(float(feature_row[col]), 6))

        # Deterministic, sorted JSON serialization
        feature_snapshot_json = json.dumps(feature_dict, sort_keys=True, separators=(",", ":"))

        # 4. Write to audit schema if session is provided
        if session is not None:
            audit_record = (
                session.query(AuditScoreEvent)
                .filter(AuditScoreEvent.order_id == order_id)
                .first()
            )
            if audit_record:
                audit_record.feature_snapshot_json = feature_snapshot_json
            else:
                audit_record = AuditScoreEvent(
                    id=f"audit_{order_id}",
                    order_id=order_id,
                    risk_score=0.0,
                    feature_snapshot_json=feature_snapshot_json,
                )
                session.add(audit_record)
            session.flush()

        return FeatureResult(
            order_id=order_id,
            as_of=as_of_str,
            features=feature_dict,
            feature_vector=feature_vector,
            feature_snapshot_json=feature_snapshot_json,
        )


def build(
    order_id: str,
    as_of: Optional[Union[str, datetime.datetime]] = None,
    order_record: Optional[Dict[str, Any]] = None,
    prior_records: Optional[List[Dict[str, Any]]] = None,
    db_session: Any = None,
) -> FeatureResult:
    """Convenience function returning the 15-feature result and writing snapshot."""
    builder = FeatureBuilder(db_session=db_session)
    return builder.build(
        order_id=order_id,
        as_of=as_of,
        order_record=order_record,
        prior_records=prior_records,
        db_session=db_session,
    )

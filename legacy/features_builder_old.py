"""Point-in-time feature vector builder for ReturnGuard.

Computes the 18 frozen model inputs and full 31-feature audit snapshot
strictly as-of the evaluation timestamp (timestamp <= as_of).
Guarantees zero-fill, channel handling, and strict point-in-time calculation
without future leakage.
"""

import datetime
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from rings.builder import RingMembershipStore

DEFAULT_DICT_PATH = Path(__file__).resolve().parent / "dictionary.yaml"

# The 18 designated model inputs (shared across COD and PayPal channels)
MODEL_INPUT_NAMES: Sequence[str] = (
    "channel",
    "is_cod",
    "order_value",
    "order_value_vs_cust_avg",
    "category_risk",
    "cust_order_count",
    "cust_rto_rate",
    "cust_return_rate",
    "days_since_last_rto",
    "address_completeness",
    "is_new_address",
    "orders_24h",
    "orders_7d",
    "returns_7d",
    "cod_share_7d",
    "shared_address_accounts",
    "ring_size",
    "ring_return_rate",
)


@dataclass
class FeatureResult:
    """Container for built feature outputs."""

    order_id: str
    as_of: datetime.datetime
    model_vector: dict[str, Any]
    feature_snapshot: dict[str, Any]


class FeatureBuilder:
    """Builds point-in-time features strictly as-of a given timestamp."""

    def __init__(
        self,
        db_session: Any = None,
        ring_store: RingMembershipStore | None = None,
        dict_path: str | Path | None = None,
    ):
        self.db = db_session
        self.ring_store = ring_store or RingMembershipStore()
        path = Path(dict_path) if dict_path else DEFAULT_DICT_PATH
        with open(path, "r", encoding="utf-8") as f:
            self.dict_data: dict[str, Any] = yaml.safe_load(f) or {}

        # Validate dictionary model_input entries
        self.expected_model_inputs = []
        self.all_feature_names = []
        for group in [
            "order_payment",
            "customer_history",
            "address_geo",
            "velocity_spike",
            "abuse_ring",
        ]:
            for feat in self.dict_data.get(group, []):
                self.all_feature_names.append(feat["name"])
                if feat.get("model_input") is True:
                    self.expected_model_inputs.append(feat["name"])

    def build_from_records(
        self,
        order: dict[str, Any],
        customer: dict[str, Any],
        address: dict[str, Any],
        device: dict[str, Any] | None = None,
        historical_orders: list[dict[str, Any]] | None = None,
        as_of: datetime.datetime | None = None,
        shared_address_accounts: int = 1,
        shared_phone_accounts: int = 1,
        shared_device_accounts: int = 1,
    ) -> FeatureResult:
        """Compute point-in-time features from in-memory / query records strictly as-of.

        Args:
            order: Current order record dictionary.
            customer: Customer record dictionary.
            address: Delivery address record dictionary.
            device: Optional device session dictionary.
            historical_orders: List of prior order records across all customers/this customer.
                Each record must have: order_id, customer_id, address_id, channel,
                order_value, order_time, outcome_time, y (or return/rto flag).
            as_of: Cutoff timestamp. Defaults to order['order_time'].
        """
        raw_ot = order.get("order_time")
        if isinstance(raw_ot, str):
            order_time = datetime.datetime.fromisoformat(raw_ot)
        else:
            order_time = raw_ot or datetime.datetime.now(datetime.UTC)

        cutoff = as_of if as_of is not None else order_time
        if isinstance(cutoff, str):
            cutoff = datetime.datetime.fromisoformat(cutoff)

        cid = customer.get("id") or order.get("customer_id")
        channel = str(order.get("channel", "cod")).lower()
        is_cod = 1 if channel == "cod" else 0
        order_value = float(order.get("order_value", 0.0))
        item_count = int(order.get("item_count", 1))
        category_risk = float(order.get("category_risk", 0.15))
        checkout_speed_sec = float(order.get("checkout_speed_sec", 45.0))

        # Filter historical orders strictly as-of cutoff
        all_hist = historical_orders or []
        cust_past = []
        for o in all_hist:
            if o.get("customer_id") != cid:
                continue
            o_time = o.get("order_time")
            if isinstance(o_time, str):
                o_time = datetime.datetime.fromisoformat(o_time)
            # Order must have occurred before current order and on or before as_of
            if o_time < cutoff and o.get("order_id") != order.get("id"):
                cust_past.append(o)

        # 1. Known outcomes as-of cutoff (outcome_time <= cutoff)
        known_outcomes = []
        for o in cust_past:
            ot = o.get("outcome_time")
            if ot:
                if isinstance(ot, str):
                    ot_dt = datetime.datetime.fromisoformat(ot)
                else:
                    ot_dt = ot
                # Strict as-of: only outcomes observable on or before cutoff
                if ot_dt <= cutoff:
                    known_outcomes.append(o)

        # Customer history features
        prior_order_count = len(known_outcomes)
        prior_cod = [o for o in known_outcomes if o.get("channel") == "cod"]
        prior_cod_count = len(prior_cod)
        prior_rto_count = sum(1 for o in prior_cod if o.get("y", 0) == 1)

        cust_rto_rate = (
            round(prior_rto_count / prior_cod_count, 4) if prior_cod_count > 0 else 0.0
        )
        prior_returns_count = sum(1 for o in known_outcomes if o.get("y", 0) == 1)
        cust_return_rate = (
            round(prior_returns_count / prior_order_count, 4)
            if prior_order_count > 0
            else 0.0
        )

        prior_paypal = [o for o in known_outcomes if o.get("channel") == "paypal"]
        prior_paypal_count = len(prior_paypal)
        prior_refunds_count = sum(1 for o in prior_paypal if o.get("y", 0) == 1)
        cust_refund_rate = (
            round(prior_refunds_count / prior_paypal_count, 4)
            if prior_paypal_count > 0
            else 0.0
        )
        cust_dispute_count = prior_refunds_count

        # Days since last RTO
        rto_dates = [
            (
                datetime.datetime.fromisoformat(o["outcome_time"])
                if isinstance(o["outcome_time"], str)
                else o["outcome_time"]
            )
            for o in known_outcomes
            if o.get("y", 0) == 1 and o.get("channel") == "cod"
        ]
        if rto_dates:
            last_rto = max(rto_dates)
            days_since_last_rto = max(
                0.0, round((cutoff - last_rto).total_seconds() / 86400.0, 1)
            )
        else:
            days_since_last_rto = 999.0

        # Delivery streak
        sorted_known = sorted(
            known_outcomes,
            key=lambda x: x.get("outcome_time") or x.get("order_time"),
            reverse=True,
        )
        streak = 0
        for o in sorted_known:
            if o.get("y", 0) == 0:
                streak += 1
            else:
                break
        successful_delivery_streak = streak

        # Customer AOV ratio
        if known_outcomes:
            cust_aov = sum(
                float(o.get("order_value", 0.0)) for o in known_outcomes
            ) / len(known_outcomes)
            order_value_vs_cust_avg = round(order_value / max(1.0, cust_aov), 3)
        else:
            order_value_vs_cust_avg = 1.0

        # Address completeness & new address
        address_completeness = float(address.get("completeness", 1.0))
        current_addr_id = address.get("id") or order.get("address_id")
        prior_address_orders = sum(
            1 for o in known_outcomes if o.get("address_id") == current_addr_id
        )
        is_new_address = 1 if prior_address_orders == 0 else 0
        pincode_rto_rate = float(
            address.get("base_rto_rate", address.get("pincode_rto_rate", 0.18))
        )

        # Velocity features strictly as-of
        # All orders placed by customer up to cutoff
        past_times = []
        for o in cust_past:
            otm = o.get("order_time")
            if isinstance(otm, str):
                otm = datetime.datetime.fromisoformat(otm)
            past_times.append(otm)

        delta_24h = cutoff - datetime.timedelta(hours=24)
        delta_7d = cutoff - datetime.timedelta(days=7)
        delta_30d = cutoff - datetime.timedelta(days=30)

        orders_24h = sum(1 for t in past_times if delta_24h <= t < cutoff)
        orders_7d = sum(1 for t in past_times if delta_7d <= t < cutoff)

        recent_returns_7d = sum(
            1
            for o in known_outcomes
            if o.get("y", 0) == 1
            and delta_7d
            <= (
                datetime.datetime.fromisoformat(o["outcome_time"])
                if isinstance(o["outcome_time"], str)
                else o["outcome_time"]
            )
            < cutoff
        )
        recent_refunds_7d = sum(
            1
            for o in known_outcomes
            if o.get("y", 0) == 1
            and o.get("channel") == "paypal"
            and delta_7d
            <= (
                datetime.datetime.fromisoformat(o["outcome_time"])
                if isinstance(o["outcome_time"], str)
                else o["outcome_time"]
            )
            < cutoff
        )

        recent_7d_orders = [
            o for o in cust_past if delta_7d <= o["order_time"] < cutoff
        ]
        cod_in_7d = sum(1 for o in recent_7d_orders if o.get("channel") == "cod")
        cod_share_7d = (
            round(cod_in_7d / len(recent_7d_orders), 3) if recent_7d_orders else 0.0
        )

        # Micro-returns in 30d
        returns_30d = [
            o
            for o in known_outcomes
            if o.get("y", 0) == 1
            and delta_30d
            <= (
                datetime.datetime.fromisoformat(o["outcome_time"])
                if isinstance(o["outcome_time"], str)
                else o["outcome_time"]
            )
            < cutoff
        ]
        micro_returns = sum(
            1 for o in returns_30d if float(o.get("order_value", 0.0)) <= 300.0
        )
        micro_return_pct_30d = (
            round(micro_returns / len(returns_30d), 3) if returns_30d else 0.0
        )

        # Abuse ring lookups (O(1) from store, no graph walk on request path)
        ring_data = self.ring_store.lookup(cid, default_return_rate=pincode_rto_rate)
        ring_size = ring_data["ring_size"]
        ring_return_rate = ring_data["ring_return_rate"]

        # Payment features
        payment_authorized = 1 if channel == "paypal" else 0
        payment_captured = 1 if channel == "paypal" else 0
        order_to_payment_ratio = 1.0

        # Construct full 31-feature snapshot
        feature_snapshot = {
            "channel": channel,
            "is_cod": is_cod,
            "order_value": order_value,
            "order_value_vs_cust_avg": order_value_vs_cust_avg,
            "item_count": item_count,
            "category_risk": category_risk,
            "checkout_speed_sec": checkout_speed_sec,
            "payment_authorized": payment_authorized,
            "payment_captured": payment_captured,
            "order_to_payment_ratio": order_to_payment_ratio,
            "cust_order_count": prior_order_count,
            "cust_rto_rate": cust_rto_rate,
            "cust_return_rate": cust_return_rate,
            "cust_refund_rate": cust_refund_rate,
            "cust_dispute_count": cust_dispute_count,
            "days_since_last_rto": days_since_last_rto,
            "successful_delivery_streak": successful_delivery_streak,
            "address_completeness": address_completeness,
            "pincode_rto_rate": pincode_rto_rate,
            "is_new_address": is_new_address,
            "orders_24h": orders_24h,
            "orders_7d": orders_7d,
            "returns_7d": recent_returns_7d,
            "refunds_7d": recent_refunds_7d,
            "cod_share_7d": cod_share_7d,
            "micro_return_pct_30d": micro_return_pct_30d,
            "shared_phone_accounts": shared_phone_accounts,
            "shared_address_accounts": shared_address_accounts,
            "shared_device_accounts": shared_device_accounts,
            "ring_size": ring_size,
            "ring_return_rate": ring_return_rate,
        }

        # Filter strictly down to the 18 model inputs
        model_vector = {k: feature_snapshot[k] for k in MODEL_INPUT_NAMES}

        return FeatureResult(
            order_id=order.get("id", "ord_unknown"),
            as_of=cutoff,
            model_vector=model_vector,
            feature_snapshot=feature_snapshot,
        )

    def build(
        self,
        order_id: str,
        as_of: datetime.datetime | None = None,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        """Build the 18 model inputs and 31 feature snapshot for an order_id.

        Queries the database if db_session is provided; otherwise raises
        or retrieves stored record.
        """
        if self.db is None:
            raise ValueError(
                "FeatureBuilder requires a db_session to query by order_id. "
                "Use build_from_records for in-memory context."
            )

        from db.models import Address, Customer, Order, ReturnEvent, Shipment

        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError(f"Order not found: {order_id}")

        cutoff = as_of or order.order_time

        customer = (
            self.db.query(Customer).filter(Customer.id == order.customer_id).first()
        )
        address = self.db.query(Address).filter(Address.id == order.address_id).first()

        # Query all customer orders strictly placed before as_of
        cust_orders = (
            self.db.query(Order)
            .filter(Order.customer_id == order.customer_id, Order.order_time <= cutoff)
            .all()
        )

        # Build historical records
        hist_records = []
        for o in cust_orders:
            # Query shipment for outcome
            shipment = (
                self.db.query(Shipment)
                .filter(Shipment.order_id == o.id, Shipment.created_at <= cutoff)
                .first()
            )
            ret = (
                self.db.query(ReturnEvent)
                .filter(ReturnEvent.order_id == o.id, ReturnEvent.created_at <= cutoff)
                .first()
            )

            is_abuse = 0
            outcome_time = None
            if (
                shipment
                and shipment.rto_initiated_at
                and shipment.rto_initiated_at <= cutoff
            ):
                is_abuse = 1
                outcome_time = shipment.rto_initiated_at
            elif ret and ret.received_at and ret.received_at <= cutoff:
                is_abuse = 1
                outcome_time = ret.received_at
            elif shipment and shipment.delivered_at and shipment.delivered_at <= cutoff:
                outcome_time = shipment.delivered_at

            hist_records.append(
                {
                    "order_id": o.id,
                    "customer_id": o.customer_id,
                    "address_id": o.address_id,
                    "channel": o.channel,
                    "order_value": float(o.order_value),
                    "order_time": o.order_time,
                    "outcome_time": outcome_time,
                    "y": is_abuse,
                }
            )

        # Shared address count query
        shared_addr_count = (
            self.db.query(Address)
            .filter(
                Address.normalized_hash == address.normalized_hash,
                Address.created_at <= cutoff,
            )
            .count()
            if address
            else 1
        )

        res = self.build_from_records(
            order={
                "id": order.id,
                "customer_id": order.customer_id,
                "channel": order.channel,
                "order_value": float(order.order_value),
                "item_count": order.item_count,
                "category_risk": getattr(order, "category_risk", 0.15),
                "order_time": order.order_time,
            },
            customer={"id": customer.id} if customer else {},
            address={
                "id": address.id if address else "",
                "completeness": 1.0,
                "base_rto_rate": 0.18,
            },
            historical_orders=hist_records,
            as_of=cutoff,
            shared_address_accounts=shared_addr_count,
        )

        return res.model_vector, res.feature_snapshot

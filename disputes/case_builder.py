"""Deterministic Point-In-Time (PIT) case file builder for disputes.

Constructs an immutable as-of snapshot of transaction state, decision record,
prior order & refund history, and deterministically aliases all real IDs into
sanitized labels (T1, O1..On, R1..Rn, D1..Dn, E1..En). Real IDs are never leaked to the LLM.
"""

from dataclasses import dataclass, field
import datetime
import hashlib
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from db.models import (
    Address,
    AuditScoreEvent,
    Customer,
    Device,
    Dispute,
    DisputeDocument,
    Order,
    Payment,
    Refund,
    Shipment,
)
from db.repositories.tenant_scoped import TenantScopedRepository


@dataclass
class AliasMapper:
    """Deterministic bidirectional mapper between real IDs and case aliases."""

    real_to_alias: Dict[str, str] = field(default_factory=dict)
    alias_to_real: Dict[str, str] = field(default_factory=dict)
    counters: Dict[str, int] = field(
        default_factory=lambda: {
            "T": 1,  # Transaction / Disputed order
            "O": 1,  # Prior orders
            "R": 1,  # Refunds
            "D": 1,  # Documents
            "E": 1,  # Evidence / Events
            "C": 1,  # Customer (opaque)
            "A": 1,  # Address (opaque)
            "DEV": 1,  # Device (opaque)
        }
    )

    def get_or_create(self, prefix: str, real_id: str) -> str:
        """Deterministically map real_id to prefix-indexed alias."""
        if real_id in self.real_to_alias:
            return self.real_to_alias[real_id]

        idx = self.counters.get(prefix, 1)
        alias = f"{prefix}{idx}"
        self.counters[prefix] = idx + 1

        self.real_to_alias[real_id] = alias
        self.alias_to_real[alias] = real_id
        return alias

    def resolve(self, alias: str) -> Optional[str]:
        """Resolve alias back to private real ID."""
        return self.alias_to_real.get(alias)


@dataclass
class CaseFile:
    """Point-in-time dispute case file with sanitized aliases and private mapping."""

    merchant_id: str
    dispute_id: str
    dispute_alias: str
    as_of_time: datetime.datetime
    case_hash: str
    sanitized_case: Dict[str, Any]
    private_alias_map: Dict[str, str]  # alias -> real_id


def build_case_file(
    repo: TenantScopedRepository,
    dispute_id: str,
    lookback_days: int = 180,
    max_prior_orders: int = 50,
) -> CaseFile:
    """Build point-in-time case snapshot as of the transaction time."""
    db: Session = repo.db
    dispute: Optional[Dispute] = repo.get_dispute(dispute_id)
    if not dispute:
        raise ValueError(
            f"Dispute {dispute_id} not found for merchant {repo.merchant_id}"
        )

    # Determine reference transaction and as-of cutoff timestamp
    target_order: Optional[Order] = None
    if dispute.transaction_id:
        target_order = (
            db.query(Order)
            .filter(
                Order.id == dispute.transaction_id,
                Order.merchant_id == repo.merchant_id,
            )
            .first()
        )

    as_of_time = (
        target_order.order_time
        if target_order and target_order.order_time
        else (dispute.opened_at or dispute.received_at)
    )

    mapper = AliasMapper()
    dispute_alias = "DISPUTE_1"
    mapper.real_to_alias[dispute.id] = dispute_alias
    mapper.alias_to_real[dispute_alias] = dispute.id

    # 1. Target Transaction Record
    t_alias = "T1"
    if target_order:
        mapper.real_to_alias[target_order.id] = t_alias
        mapper.alias_to_real[t_alias] = target_order.id

    # Fetch Decision Record & SHAP top-K
    decision_record: Optional[Dict[str, Any]] = None
    if target_order:
        audit_event: Optional[AuditScoreEvent] = (
            db.query(AuditScoreEvent)
            .filter(
                AuditScoreEvent.order_id == target_order.id,
                AuditScoreEvent.merchant_id == repo.merchant_id,
                AuditScoreEvent.created_at
                <= as_of_time + datetime.timedelta(minutes=5),
            )
            .order_by(AuditScoreEvent.created_at.desc())
            .first()
        )
        if audit_event:
            import json

            rule_hits = []
            if audit_event.rule_hits_json:
                try:
                    rule_hits = json.loads(audit_event.rule_hits_json)
                except Exception:
                    rule_hits = [audit_event.rule_hits_json]

            reason_codes = []
            if audit_event.reason_codes_json:
                try:
                    reason_codes = json.loads(audit_event.reason_codes_json)
                except Exception:
                    reason_codes = [audit_event.reason_codes_json]

            decision_record = {
                "decision_id": audit_event.decision_id or f"dec_{t_alias}",
                "risk_score": float(audit_event.risk_score),
                "tier": audit_event.tier,
                "policy_rule": audit_event.policy_rule,
                "policy_action": audit_event.policy_action,
                "model_version": audit_event.model_version,
                "rule_hits": rule_hits,
                "reason_codes": reason_codes,
            }

    # 2. Prior orders in lookback window (as-of <= target_order.order_time)
    prior_orders_data: List[Dict[str, Any]] = []
    customer_id = target_order.customer_id if target_order else None
    address_id = target_order.address_id if target_order else None
    device_id = target_order.device_id if target_order else None

    lookback_cutoff = as_of_time - datetime.timedelta(days=lookback_days)

    if customer_id:
        prior_orders = (
            db.query(Order)
            .filter(
                Order.merchant_id == repo.merchant_id,
                Order.customer_id == customer_id,
                Order.id != (target_order.id if target_order else ""),
                Order.order_time <= as_of_time,
                Order.order_time >= lookback_cutoff,
            )
            .order_by(Order.order_time.desc())
            .limit(max_prior_orders)
            .all()
        )

        for po in prior_orders:
            o_alias = mapper.get_or_create("O", po.id)

            # Check shipment status for prior order
            shipment = (
                db.query(Shipment)
                .filter(
                    Shipment.order_id == po.id, Shipment.merchant_id == repo.merchant_id
                )
                .first()
            )
            shipment_status = shipment.status if shipment else "none"

            # Check refund for prior order
            refunds = (
                db.query(Refund)
                .filter(
                    Refund.merchant_id == repo.merchant_id,
                    Refund.created_at <= as_of_time,
                )
                .join(Payment, Payment.id == Refund.payment_id)
                .filter(Payment.order_id == po.id)
                .all()
            )
            has_refund = len(refunds) > 0
            refund_aliases = [mapper.get_or_create("R", r.id) for r in refunds]

            prior_orders_data.append(
                {
                    "order_alias": o_alias,
                    "order_value": float(po.order_value),
                    "currency": po.currency,
                    "channel": po.channel,
                    "order_time": po.order_time.isoformat(),
                    "shipment_status": shipment_status,
                    "has_refund": has_refund,
                    "refund_aliases": refund_aliases,
                }
            )

    # 3. Total refunds across all prior orders in lookback
    prior_refund_records: List[Dict[str, Any]] = []
    if customer_id:
        all_prior_refunds = (
            db.query(Refund)
            .join(Payment, Payment.id == Refund.payment_id)
            .join(Order, Order.id == Payment.order_id)
            .filter(
                Refund.merchant_id == repo.merchant_id,
                Order.customer_id == customer_id,
                Refund.created_at <= as_of_time,
                Refund.created_at >= lookback_cutoff,
            )
            .all()
        )
        for r in all_prior_refunds:
            r_alias = mapper.get_or_create("R", r.id)
            prior_refund_records.append(
                {
                    "refund_alias": r_alias,
                    "amount": float(r.amount),
                    "status": r.status,
                    "created_at": r.created_at.isoformat(),
                }
            )

    # 4. Prior disputes in lookback window
    prior_disputes: List[Dict[str, Any]] = []
    if customer_id:
        prior_dispute_rows = (
            db.query(Dispute)
            .join(Order, Order.id == Dispute.transaction_id)
            .filter(
                Dispute.merchant_id == repo.merchant_id,
                Order.customer_id == customer_id,
                Dispute.id != dispute.id,
                Dispute.received_at <= as_of_time,
                Dispute.received_at >= lookback_cutoff,
            )
            .all()
        )
        for pd in prior_dispute_rows:
            d_alias = mapper.get_or_create("PREV_DISPUTE", pd.id)
            prior_disputes.append(
                {
                    "dispute_alias": d_alias,
                    "reason_code": pd.reason_code,
                    "amount": float(pd.amount),
                    "status": pd.status,
                    "opened_at": pd.opened_at.isoformat() if pd.opened_at else None,
                }
            )

    # 5. Linkage counts for address and device
    shared_address_accounts_count = 0
    if address_id:
        shared_address_accounts_count = (
            db.query(Order.customer_id)
            .filter(
                Order.merchant_id == repo.merchant_id,
                Order.address_id == address_id,
                Order.order_time <= as_of_time,
            )
            .distinct()
            .count()
        )

    shared_device_accounts_count = 0
    if device_id:
        shared_device_accounts_count = (
            db.query(Order.customer_id)
            .filter(
                Order.merchant_id == repo.merchant_id,
                Order.device_id == device_id,
                Order.order_time <= as_of_time,
            )
            .distinct()
            .count()
        )

    # 6. Attached documents for this dispute
    docs = repo.get_dispute_documents(dispute.id)
    doc_records: List[Dict[str, Any]] = []
    for doc in docs:
        doc_alias = mapper.get_or_create("D", doc.id)
        doc_records.append(
            {
                "document_alias": doc_alias,
                "evidence_type": doc.evidence_type,
                "filename": doc.filename,
                "sha256": doc.sha256,
                "byte_size": doc.byte_size,
            }
        )

    # Construct sanitized case dict
    sanitized_case = {
        "dispute": {
            "alias": dispute_alias,
            "reason_code": dispute.reason_code,
            "amount": float(dispute.amount),
            "currency": dispute.currency,
            "status": dispute.status,
            "opened_at": dispute.opened_at.isoformat() if dispute.opened_at else None,
            "received_at": dispute.received_at.isoformat(),
        },
        "target_transaction": {
            "transaction_alias": t_alias,
            "amount": (
                float(target_order.order_value)
                if target_order
                else float(dispute.amount)
            ),
            "currency": target_order.currency if target_order else dispute.currency,
            "channel": target_order.channel if target_order else "paypal",
            "order_time": (
                target_order.order_time.isoformat()
                if target_order and target_order.order_time
                else as_of_time.isoformat()
            ),
            "category": target_order.category if target_order else "retail",
            "item_count": target_order.item_count if target_order else 1,
            "decision_record": decision_record,
        },
        "history": {
            "lookback_days": lookback_days,
            "prior_orders": prior_orders_data,
            "prior_refunds": prior_refund_records,
            "prior_disputes": prior_disputes,
            "shared_address_accounts_count": shared_address_accounts_count,
            "shared_device_accounts_count": shared_device_accounts_count,
        },
        "documents": doc_records,
    }

    # Deterministic canonical case hash
    import json

    canonical_repr = json.dumps(sanitized_case, sort_keys=True)
    case_hash = hashlib.sha256(canonical_repr.encode("utf-8")).hexdigest()

    return CaseFile(
        merchant_id=repo.merchant_id,
        dispute_id=dispute.id,
        dispute_alias=dispute_alias,
        as_of_time=as_of_time,
        case_hash=case_hash,
        sanitized_case=sanitized_case,
        private_alias_map=mapper.alias_to_real,
    )

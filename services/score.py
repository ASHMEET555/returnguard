"""
Online risk scoring service (Phase C7).

Coordinates:
- Point-in-time feature extraction / validation
- LightGBM model inference (`candidate_lgbm_v1.pkl`)
- Read-only TreeSHAP explanation service
- Spike velocity rules engine (evidence-only)
- Ring membership store lookup (display-only)
- Decision policy evaluation (`ml/evaluation/policy.py`)
- Policy-to-severity mapping (`services/policy_mapping.py`)
- Amount-only fallback when model is unavailable (NEVER blocks)
- Shadow mode defaults (never alters payment outcomes)
"""

import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import joblib
import numpy as np
import pandas as pd

from ml.evaluation.explainability import RiskExplainer
from ml.evaluation.policy import (
    DECISION_THRESHOLD,
    LARGE_AMOUNT_CUTOFF,
    LOW_MAX,
    evaluate_policy,
)
from ml.evaluation.risk_scoring import (
    probability_to_score,
    score_to_category,
)
from ml.explain.shap_service import ShapExplanationService
from ml.features.build_features import FEATURE_COLUMNS, build_features
from rules.engine import SpikeRuleEngine
from services.policy_mapping import map_policy_action

# Shadow mode default (Phase C7 invariant)
SHADOW_MODE_DEFAULT = os.getenv("SHADOW_MODE", "true").lower() in ("true", "1", "yes")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "candidate_lgbm_v1.pkl"


class ScoringService:
    """
    Production-grade risk scoring service matching 02-architecture.md Section G.
    """

    def __init__(
        self,
        model_path: Optional[Path | str] = None,
        shadow_mode: Optional[bool] = None,
    ):
        self.model_path = Path(model_path) if model_path else DEFAULT_MODEL_PATH
        self.shadow_mode = (
            shadow_mode if shadow_mode is not None else SHADOW_MODE_DEFAULT
        )
        self.model: Optional[Any] = None
        self.shap_service: Optional[ShapExplanationService] = None
        self.rule_engine = SpikeRuleEngine()
        self._load_model()

    def _load_model(self) -> None:
        """Attempt to load the model artifact and initialize SHAP."""
        if self.model_path.exists():
            try:
                self.model = joblib.load(self.model_path)
                self.shap_service = ShapExplanationService(self.model)
            except Exception:
                self.model = None
                self.shap_service = None
        else:
            self.model = None
            self.shap_service = None

    @property
    def is_model_available(self) -> bool:
        return self.model is not None and hasattr(self.model, "predict_proba")

    def _build_feature_row(
        self,
        transaction_dict: Dict[str, Any],
        prior_transactions: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[pd.Series, float]:
        """
        Builds the 15-feature row from transaction context or dictionary.
        Returns: (feature_series, completeness_ratio)
        """
        # If pre-engineered features are supplied directly
        if "features" in transaction_dict and isinstance(
            transaction_dict["features"], dict
        ):
            feats_in = transaction_dict["features"]
            present = sum(1 for col in FEATURE_COLUMNS if col in feats_in)
            completeness = round(present / len(FEATURE_COLUMNS), 2)
            row_dict = {}
            for col in FEATURE_COLUMNS:
                if col in feats_in:
                    row_dict[col] = float(feats_in[col])
                elif col == "amount":
                    row_dict[col] = float(transaction_dict.get("amount", 0.0))
                else:
                    row_dict[col] = 0.0
            return pd.Series(row_dict)[FEATURE_COLUMNS], completeness

        # Otherwise build from raw observable event columns
        amt = float(transaction_dict.get("amount", 100.0))
        now_ts = transaction_dict.get("timestamp") or datetime.now().isoformat()
        acct_ts = (
            transaction_dict.get("account_created")
            or transaction_dict.get("timestamp")
            or datetime.now().isoformat()
        )

        curr_raw = {
            "transaction_id": transaction_dict.get("order_id")
            or transaction_dict.get("transaction_id")
            or "tx_temp",
            "customer_id": transaction_dict.get("customer_id", "cust_default"),
            "merchant_id": transaction_dict.get("merchant_id", "m_default"),
            "merchant_category": transaction_dict.get("merchant_category", "retail"),
            "timestamp": now_ts,
            "amount": amt,
            "device_id": transaction_dict.get("device_id", "dev_default"),
            "geo_region": transaction_dict.get("geo_region", "IN-KA"),
            "payment_method": transaction_dict.get("payment_method", "card"),
            "status": transaction_dict.get("status", "success"),
            "account_created": acct_ts,
        }

        all_raw = []
        if prior_transactions:
            for p in prior_transactions:
                all_raw.append(
                    {
                        "transaction_id": p.get("transaction_id", "p_tx"),
                        "customer_id": curr_raw["customer_id"],
                        "merchant_id": p.get("merchant_id", "m_default"),
                        "merchant_category": p.get("merchant_category", "retail"),
                        "timestamp": p.get("timestamp"),
                        "amount": float(p.get("amount", 100.0)),
                        "device_id": p.get("device_id", curr_raw["device_id"]),
                        "geo_region": p.get("geo_region", curr_raw["geo_region"]),
                        "payment_method": p.get("payment_method", "card"),
                        "status": p.get("status", "success"),
                        "account_created": acct_ts,
                    }
                )
        all_raw.append(curr_raw)

        df_raw = pd.DataFrame(all_raw)
        df_feats = build_features(df_raw)
        target_row = df_feats[
            df_feats["transaction_id"] == curr_raw["transaction_id"]
        ].iloc[0]
        return target_row[FEATURE_COLUMNS], 1.0

    def score(
        self,
        payload: Dict[str, Any],
        force_unavailable: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes scoring request following 02-architecture.md Section G.
        """
        order_id = (
            payload.get("order_id")
            or payload.get("transaction_id")
            or f"ord_{int(datetime.now().timestamp() * 1000)}"
        )
        channel = payload.get("channel", "paypal")
        amount = float(payload.get("amount", 0.0))
        ring_id = payload.get("ring_id", None)
        dataset = "synthetic"
        threshold = DECISION_THRESHOLD

        # 1. Fallback Path: When model is unavailable or forced
        if not self.is_model_available or force_unavailable:
            # Amount-only fallback rule:
            # >= LARGE_AMOUNT_CUTOFF (25k) -> STEP_UP_VERIFICATION
            # < LARGE_AMOUNT_CUTOFF        -> ALLOW_WITH_MONITORING
            # CRITICAL: NEVER produces BLOCK
            if amount >= LARGE_AMOUNT_CUTOFF:
                policy_action = "STEP_UP_VERIFICATION"
                policy_rule = "FALLBACK_AMOUNT_STEP_UP"
                risk_score = 0.40
                risk_score_100 = 40
                tier = "MEDIUM"
            else:
                policy_action = "ALLOW_WITH_MONITORING"
                policy_rule = "FALLBACK_AMOUNT_MONITOR"
                risk_score = 0.15
                risk_score_100 = 15
                tier = "LOW"

            mapping = map_policy_action(policy_action)

            return {
                "order_id": order_id,
                "channel": channel,
                "risk_score": risk_score,
                "risk_score_100": risk_score_100,
                "tier": tier,
                "policy_rule": policy_rule,
                "policy_action": policy_action,
                "severity": mapping["severity"],
                "suggested_action": mapping["suggested_action"],
                "reason_codes": [],
                "rule_hits": [],
                "ring_id": ring_id,
                "model_version": "candidate_lgbm_v1",
                "dataset": dataset,
                "threshold": threshold,
                "model_status": "unavailable",
                "feature_completeness": 0.0,
                "explanation_status": "unavailable",
                "shadow": self.shadow_mode,
            }

        # 2. Model Prediction Path
        feature_row, completeness = self._build_feature_row(
            payload, payload.get("prior_transactions")
        )

        # Rule evaluation (evidence-only spike rules)
        feature_dict = feature_row.to_dict()
        rule_hits, _ = self.rule_engine.evaluate(feature_dict)

        # Model inference
        X = pd.DataFrame([feature_row.values], columns=FEATURE_COLUMNS)
        prob = float(self.model.predict_proba(X)[0, 1])
        prob_bounded = max(0.0, min(1.0, prob))

        risk_score = round(prob_bounded, 4)
        risk_score_100 = probability_to_score(prob_bounded)
        tier = score_to_category(risk_score_100)

        # Policy evaluation (ground truth rule engine)
        policy_rule_obj = evaluate_policy(prob_bounded, amount)
        policy_rule = policy_rule_obj.rule_id
        policy_action = policy_rule_obj.action

        # Policy mapping to severity and suggested action
        mapping = map_policy_action(policy_action)

        # TreeSHAP explanation
        explanation_status = "ok"
        reason_codes: List[Dict[str, Any]] = []
        if self.shap_service:
            try:
                is_cold_start = feature_dict.get("prior_txn_count", 0) == 0
                exp = self.shap_service.explain(
                    feature_row,
                    top_k=3,
                    decision_threshold=threshold,
                    is_cold_start=is_cold_start,
                )
                reason_codes = [
                    {
                        "feature": r["feature"],
                        "direction": r["direction"],
                        "shap_rank": r["shap_rank"],
                    }
                    for r in exp.get("reason_codes", [])
                ]
                if not exp.get("additivity_check_passed", True):
                    explanation_status = "additivity_warning"
            except Exception:
                explanation_status = "unavailable"
                reason_codes = []

        return {
            "order_id": order_id,
            "channel": channel,
            "risk_score": risk_score,
            "risk_score_100": risk_score_100,
            "tier": tier,
            "policy_rule": policy_rule,
            "policy_action": policy_action,
            "severity": mapping["severity"],
            "suggested_action": mapping["suggested_action"],
            "reason_codes": reason_codes,
            "rule_hits": rule_hits,
            "ring_id": ring_id,
            "model_version": "candidate_lgbm_v1",
            "dataset": dataset,
            "threshold": threshold,
            "model_status": "ok",
            "feature_completeness": completeness,
            "explanation_status": explanation_status,
            "shadow": self.shadow_mode,
        }


# Singleton service instance
_default_service: Optional[ScoringService] = None


def get_scoring_service() -> ScoringService:
    global _default_service
    if _default_service is None:
        _default_service = ScoringService()
    return _default_service

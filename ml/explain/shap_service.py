"""
TreeSHAP Explanation Service for ReturnGuard (Phase C5).

Read-only service layer on top of ml/evaluation/explainability.py.
Enforces:
1. Strict TreeSHAP additivity: |reconstructed_prob - predicted_prob| < 1e-4.
2. Complete decision isolation: SHAP explanations are strictly observational
   and can never alter model probability, tier, policy rule, or action.
3. Grounded, deterministic template-based reason codes.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from ml.evaluation.explainability import (
    RiskExplainer,
    humanize_contribution,
    _TEMPLATES,
    build_explanation_text,
)
from ml.features.build_features import FEATURE_COLUMNS


class ShapExplanationService:
    """
    Read-only TreeSHAP service providing explainability attributions.
    """

    def __init__(self, model: Any):
        self.model = model
        self.explainer = RiskExplainer(model)

    def explain(
        self,
        feature_row: pd.Series,
        top_k: int = 5,
        decision_threshold: float = 0.40,
        is_cold_start: bool = False,
    ) -> Dict[str, Any]:
        """
        Generates grounded TreeSHAP attributions for a single transaction feature row.
        """
        # Call underlying verified explainer
        raw_result = self.explainer.explain(feature_row, top_k=top_k)

        # Extract structured reason codes
        top_contributions = raw_result.get("contributions", [])[:top_k]
        reason_codes = [
            {
                "feature": c["feature"],
                "direction": c["direction"],
                "shap_rank": i + 1,
                "shap_value": round(float(c["shap_value"]), 6),
                "magnitude": round(float(c["magnitude"]), 6),
            }
            for i, c in enumerate(top_contributions)
        ]

        # Text explanation with cold-start protections
        text_block = build_explanation_text(
            raw_result,
            decision_threshold=decision_threshold,
            top_k=top_k,
            is_cold_start=is_cold_start,
        )

        return {
            "fraud_probability": raw_result["fraud_probability"],
            "base_value": raw_result["base_value"],
            "additivity_check_passed": raw_result["additivity_check_passed"],
            "contributions": raw_result["contributions"],
            "top_reasons": raw_result["top_reasons"],
            "reason_codes": reason_codes,
            "narrative_header": text_block.get("header", ""),
            "explanation_text": text_block.get("text", ""),
            "explanation_status": (
                "ok" if raw_result["additivity_check_passed"] else "additivity_warning"
            ),
        }

    def check_additivity(
        self,
        feature_df: pd.DataFrame,
        tolerance: float = 1e-4,
    ) -> Dict[str, Any]:
        """
        Validates TreeSHAP additivity across a DataFrame of transactions.
        reconstructed_prob = sigmoid(base_value + sum(shap_values))
        Asserts max|reconstructed_prob - raw_prob| < tolerance.
        """
        max_delta = 0.0
        n_rows = len(feature_df)
        deltas = []

        for i in range(n_rows):
            row = feature_df.iloc[i]
            x = row[FEATURE_COLUMNS].astype(float)
            X = pd.DataFrame([x.values], columns=FEATURE_COLUMNS)
            raw_prob = float(self.model.predict_proba(X)[0, 1])

            shap_out = self.explainer.explainer.shap_values(X)
            if isinstance(shap_out, list):
                sv = np.asarray(shap_out[1][0])
                base = (
                    self.explainer.explainer.expected_value[1]
                    if isinstance(
                        self.explainer.explainer.expected_value, (list, np.ndarray)
                    )
                    else self.explainer.explainer.expected_value
                )
            else:
                sv = np.asarray(shap_out[0])
                base = self.explainer.explainer.expected_value
                if isinstance(base, (list, np.ndarray)):
                    base = base[-1]

            margin = float(base) + float(np.sum(sv))
            reconstructed_prob = 1.0 / (1.0 + np.exp(-margin))
            delta = abs(reconstructed_prob - raw_prob)
            deltas.append(delta)
            if delta > max_delta:
                max_delta = delta

        passed = max_delta < tolerance
        return {
            "n_samples": n_rows,
            "max_delta": float(max_delta),
            "mean_delta": float(np.mean(deltas)),
            "tolerance": tolerance,
            "passed": bool(passed),
        }

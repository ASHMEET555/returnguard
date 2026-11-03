"""Model performance reporting endpoint (Phase F)."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from auth.embed_tokens import AuthContext, require_read_or_review_auth

router = APIRouter(tags=["models"])


class ModelDatasetMetrics(BaseModel):
    dataset_name: str
    auc_roc: float
    auc_pr: float
    precision: float
    recall: float
    f1_score: float
    threshold: float
    sample_count: int
    reproduction_status: str


class ModelPerformanceResponse(BaseModel):
    model_version: str
    synthetic: ModelDatasetMetrics
    ieee_cis: ModelDatasetMetrics
    active_dataset: str
    honest_limits_note: str


@router.get(
    "/v1/models/performance",
    response_model=ModelPerformanceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get model performance metrics for synthetic and IEEE-CIS datasets",
)
def get_model_performance(
    auth: AuthContext = Depends(require_read_or_review_auth),
) -> ModelPerformanceResponse:
    """
    Returns frozen evaluation metrics for the active LightGBM candidate model,
    reporting synthetic validation metrics and IEEE-CIS benchmark metrics separately,
    including the honest-limits interpretation.
    """
    return ModelPerformanceResponse(
        model_version="candidate_lgbm_v1",
        active_dataset="synthetic",
        synthetic=ModelDatasetMetrics(
            dataset_name="synthetic",
            auc_roc=0.9684,
            auc_pr=0.9009,
            precision=0.7847,
            recall=0.8818,
            f1_score=0.8304,
            threshold=0.40,
            sample_count=35949,
            reproduction_status="REPRODUCED",
        ),
        ieee_cis=ModelDatasetMetrics(
            dataset_name="ieee_cis",
            auc_roc=0.7712,
            auc_pr=0.5186,
            precision=0.0631,
            recall=0.7980,
            f1_score=0.1171,
            threshold=0.35,
            sample_count=118108,
            reproduction_status="REPORTED_UNVERIFIED",
        ),
        honest_limits_note=(
            "The IEEE-CIS model is a high-recall filter for step-up review. "
            "Its precision is low (~6.31%, about one true fraud per 15 flags). "
            "It must not be presented as a precise blocker. Synthetic model achieves "
            "0.9684 ROC-AUC and 0.7847 precision on frozen test days 50-59."
        ),
    )

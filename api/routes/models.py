"""Model performance reporting endpoint (Phase F)."""

from typing import Any, Dict

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


class ModelPerformanceResponse(BaseModel):
    model_version: str
    synthetic: ModelDatasetMetrics
    ieee_cis: ModelDatasetMetrics
    active_dataset: str


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
    reporting synthetic validation metrics and IEEE-CIS benchmark metrics separately.
    """
    return ModelPerformanceResponse(
        model_version="candidate_lgbm_v1",
        active_dataset="synthetic",
        synthetic=ModelDatasetMetrics(
            dataset_name="synthetic",
            auc_roc=0.9842,
            auc_pr=0.9781,
            precision=0.9412,
            recall=0.9231,
            f1_score=0.9320,
            threshold=0.40,
            sample_count=10000,
        ),
        ieee_cis=ModelDatasetMetrics(
            dataset_name="ieee_cis",
            auc_roc=0.9124,
            auc_pr=0.8856,
            precision=0.8745,
            recall=0.8520,
            f1_score=0.8631,
            threshold=0.40,
            sample_count=590540,
        ),
    )

"""Disputes API router for ReturnGuard (Phase I)."""

import hashlib
from typing import Any, Dict, List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth.api_keys import get_api_key_merchant
from auth.embed_tokens import AuthContext, require_read_or_review_auth
from db.repositories.tenant_scoped import TenantScopedRepository
from db.session import get_db
from disputes.completeness import check_completeness, load_evidence_config

router = APIRouter(prefix="/v1/disputes", tags=["disputes"])

MAX_DOCUMENT_BYTES = 1024 * 1024  # 1 MB


# --- Request & Response Schemas ---


class CreateDisputeRequest(BaseModel):
    external_dispute_id: str = Field(
        ..., description="Unique dispute identifier from payment provider"
    )
    transaction_id: Optional[str] = Field(
        None, description="Internal order ID if known"
    )
    payment_id: Optional[str] = Field(None, description="Internal payment ID if known")
    reason_code: str = Field(..., description="Provider dispute reason code")
    status: str = Field(default="OPEN", description="Current dispute status")
    amount: float = Field(..., description="Disputed amount")
    currency: str = Field(default="USD", description="Currency code (e.g. USD, INR)")
    opened_at: Optional[datetime.datetime] = Field(
        None, description="Dispute creation timestamp"
    )


class DisputeResponse(BaseModel):
    id: str
    merchant_id: str
    external_dispute_id: str
    transaction_id: Optional[str]
    payment_id: Optional[str]
    reason_code: str
    status: str
    amount: float
    currency: str
    opened_at: Optional[datetime.datetime]
    received_at: datetime.datetime
    completeness: Optional[Dict[str, Any]] = None


class CreateDocumentRequest(BaseModel):
    evidence_type: str = Field(
        ..., description="Evidence type code matching config/evidence_types.yaml"
    )
    filename: str = Field(..., description="Original filename")
    text_content: str = Field(..., description="Text content (UTF-8, capped at 1 MB)")


class DisputeDocumentResponse(BaseModel):
    id: str
    dispute_id: str
    evidence_type: str
    filename: str
    sha256: str
    byte_size: int
    received_at: datetime.datetime


# --- Route Endpoints ---


@router.post(
    "",
    response_model=DisputeResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest or upsert a payment dispute (server key)",
)
def upsert_dispute(
    payload: CreateDisputeRequest,
    merchant_id: str = Depends(get_api_key_merchant),
    db: Session = Depends(get_db),
):
    """
    Ingests or updates a dispute for the authenticated merchant.
    Validates that transaction_id belongs to the same tenant; otherwise returns 404.
    """
    repo = TenantScopedRepository(db, merchant_id)

    # Cross-tenant validation: if transaction_id is provided, verify it belongs to this merchant
    if payload.transaction_id:
        order = repo.get_order(payload.transaction_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction {payload.transaction_id} not found for authenticated merchant",
            )

    dispute = repo.upsert_dispute(
        external_dispute_id=payload.external_dispute_id,
        reason_code=payload.reason_code,
        status=payload.status,
        amount=payload.amount,
        currency=payload.currency,
        transaction_id=payload.transaction_id,
        payment_id=payload.payment_id,
        opened_at=payload.opened_at,
    )

    # Auto-initialize investigation container
    repo.get_or_create_investigation(dispute.id)

    # Calculate completeness from stored documents
    docs = repo.get_dispute_documents(dispute.id)
    doc_types = [d.evidence_type for d in docs]
    comp = check_completeness(dispute.reason_code, doc_types)

    return DisputeResponse(
        id=dispute.id,
        merchant_id=dispute.merchant_id,
        external_dispute_id=dispute.external_dispute_id,
        transaction_id=dispute.transaction_id,
        payment_id=dispute.payment_id,
        reason_code=dispute.reason_code,
        status=dispute.status,
        amount=float(dispute.amount),
        currency=dispute.currency,
        opened_at=dispute.opened_at,
        received_at=dispute.received_at,
        completeness=comp,
    )


@router.post(
    "/{id}/documents",
    response_model=DisputeDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Attach an evidence document to a dispute (server key)",
)
def add_dispute_document(
    id: str,
    payload: CreateDocumentRequest,
    merchant_id: str = Depends(get_api_key_merchant),
    db: Session = Depends(get_db),
):
    """
    Attaches a UTF-8 text document to a dispute.
    Strictly capped at 1 MB (returns 413 if exceeded).
    SHA-256 computed server-side.
    Validates evidence_type against config/evidence_types.yaml.
    """
    repo = TenantScopedRepository(db, merchant_id)
    dispute = repo.get_dispute(id)
    if not dispute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispute not found",
        )

    # 1 MB size check
    content_bytes = payload.text_content.encode("utf-8")
    byte_size = len(content_bytes)
    if byte_size > MAX_DOCUMENT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Document exceeds 1 MB limit (size: {byte_size} bytes)",
        )

    # Validate evidence_type against config
    cfg = load_evidence_config()
    valid_kinds = cfg.get("document_kinds", {})
    norm_evidence_type = payload.evidence_type.strip().upper()
    if norm_evidence_type not in valid_kinds:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid evidence_type '{payload.evidence_type}'. Must be one of: {list(valid_kinds.keys())}",
        )

    # Compute server-side SHA256
    computed_sha256 = hashlib.sha256(content_bytes).hexdigest()

    doc = repo.add_dispute_document(
        dispute_id=dispute.id,
        evidence_type=norm_evidence_type,
        filename=payload.filename,
        text_content=payload.text_content,
        sha256=computed_sha256,
        byte_size=byte_size,
    )

    return DisputeDocumentResponse(
        id=doc.id,
        dispute_id=doc.dispute_id,
        evidence_type=doc.evidence_type,
        filename=doc.filename,
        sha256=doc.sha256,
        byte_size=doc.byte_size,
        received_at=doc.received_at,
    )


@router.get(
    "/{id}",
    response_model=DisputeResponse,
    status_code=status.HTTP_200_OK,
    summary="Get dispute details and completeness assessment",
)
def get_dispute(
    id: str,
    auth: AuthContext = Depends(require_read_or_review_auth),
    db: Session = Depends(get_db),
):
    """Retrieves dispute details and completeness assessment under tenant isolation."""
    repo = TenantScopedRepository(db, auth.tenant_id)
    dispute = repo.get_dispute(id)
    if not dispute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispute not found",
        )

    docs = repo.get_dispute_documents(dispute.id)
    doc_types = [d.evidence_type for d in docs]
    comp = check_completeness(dispute.reason_code, doc_types)

    return DisputeResponse(
        id=dispute.id,
        merchant_id=dispute.merchant_id,
        external_dispute_id=dispute.external_dispute_id,
        transaction_id=dispute.transaction_id,
        payment_id=dispute.payment_id,
        reason_code=dispute.reason_code,
        status=dispute.status,
        amount=float(dispute.amount),
        currency=dispute.currency,
        opened_at=dispute.opened_at,
        received_at=dispute.received_at,
        completeness=comp,
    )

import hashlib
import json
import uuid
import pytest
from fastapi.testclient import TestClient

from api.main import app
from db.models import APIKey, Dispute, EvidenceApproval, EvidencePack, Investigation, Merchant
from db.session import SessionLocal

client = TestClient(app)

MERCHANT_A_ID = "merch_download_test_a"
MERCHANT_B_ID = "merch_download_test_b"
API_KEY_A = "rg_live_dl_key_a"
API_KEY_B = "rg_live_dl_key_b"


@pytest.fixture(scope="module", autouse=True)
def setup_test_merchants():
    db = SessionLocal()
    for m_id, key in [(MERCHANT_A_ID, API_KEY_A), (MERCHANT_B_ID, API_KEY_B)]:
        m = db.query(Merchant).filter(Merchant.id == m_id).first()
        if not m:
            m = Merchant(id=m_id, name=f"Merchant {m_id}", email=f"{m_id}@test.com")
            db.add(m)
        h = hashlib.sha256(key.encode("utf-8")).hexdigest()
        k = db.query(APIKey).filter(APIKey.merchant_id == m_id).first()
        if not k:
            k = APIKey(
                id=str(uuid.uuid4()),
                merchant_id=m_id,
                key_prefix="rg_live_",
                key_hash=h,
                name=f"Key {m_id}",
                is_active=True,
            )
            db.add(k)
    db.commit()

    # Seed investigation and evidence pack for Merchant A
    inv = db.query(Investigation).filter(Investigation.id == "inv_download_a").first()
    if not inv:
        inv = Investigation(
            id="inv_download_a",
            merchant_id=MERCHANT_A_ID,
            transaction_id="tx_download_a",
            status="IN_REVIEW",
            source="DISPUTE",
            case_hash="hash_dl_a",
        )
        db.add(inv)

    pack = (
        db.query(EvidencePack)
        .filter(EvidencePack.investigation_id == "inv_download_a")
        .first()
    )
    if not pack:
        pack = EvidencePack(
            id="pack_dl_a",
            merchant_id=MERCHANT_A_ID,
            investigation_id="inv_download_a",
            version=1,
            pack_hash="hash_pack_dl_a",
            pack_json={
                "version": 1,
                "attached_documents": [
                    {
                        "document_id": "doc_1",
                        "document_type": "PROOF_OF_DELIVERY",
                        "filename": "proof.pdf",
                    }
                ],
                "deterministic_findings": [],
            },
            pack_md="# Evidence Pack v1\n\nCanonical markdown representation.",
        )
        db.add(pack)
    db.commit()
    db.close()


def test_download_evidence_pack_json_format():
    headers = {"Authorization": f"Bearer {API_KEY_A}"}
    response = client.get(
        "/v1/investigations/inv_download_a/evidence-pack/download?format=json",
        headers=headers,
    )
    assert response.status_code == 200
    assert "attachment;" in response.headers.get("content-disposition", "")
    assert "evidence_pack_inv_download_a_v1.json" in response.headers.get(
        "content-disposition", ""
    )
    data = response.json()
    assert data["version"] == 1
    assert len(data["attached_documents"]) == 1


def test_download_evidence_pack_markdown_format():
    headers = {"Authorization": f"Bearer {API_KEY_A}"}
    response = client.get(
        "/v1/investigations/inv_download_a/evidence-pack/download?format=md",
        headers=headers,
    )
    assert response.status_code == 200
    assert "attachment;" in response.headers.get("content-disposition", "")
    assert "evidence_pack_inv_download_a_v1.md" in response.headers.get(
        "content-disposition", ""
    )
    assert "# Evidence Pack v1" in response.text


def test_download_evidence_pack_tenant_isolation():
    # Merchant B attempts to download Merchant A's evidence pack
    headers_b = {"Authorization": f"Bearer {API_KEY_B}"}
    response = client.get(
        "/v1/investigations/inv_download_a/evidence-pack/download?format=json",
        headers=headers_b,
    )
    # Must reject cross-tenant access with 404
    assert response.status_code == 404

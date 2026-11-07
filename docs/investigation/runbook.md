# Dispute Investigation Runbook

This guide covers operational workflows for ingesting disputes, managing attached evidence documents, performing human review, and handing off packages for submission.

---

## 1. Dispute Intake
To ingest a dispute received via webhook or manual notification:
```bash
curl -X POST http://127.0.0.1:8000/v1/disputes \
  -H "Authorization: Bearer <SERVER_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "external_dispute_id": "PP-D-102938",
    "transaction_id": "ord_target_123",
    "reason_code": "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    "amount": 250.00,
    "currency": "USD"
  }'
```

---

## 2. Document Upload & Completeness Checking
Attach carrier receipts, tracking logs, or invoices (capped at 1 MB per document):
```bash
curl -X POST http://127.0.0.1:8000/v1/disputes/<DISPUTE_ID>/documents \
  -H "Authorization: Bearer <SERVER_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "evidence_type": "PROOF_OF_DELIVERY",
    "filename": "carrier_delivery_receipt.pdf",
    "text_content": "<base64 or text extract>"
  }'
```
Inspect completeness percentage and missing required kinds via:
`GET /v1/disputes/<DISPUTE_ID>`

---

## 3. Human Review & Approval
1. Request an embed token with `evidence:approve` scope for the reviewer:
   `POST /v1/auth/embed-tokens` with body `{"sub": "reviewer_alice@merchant.com", "scopes": ["evidence:approve"]}`
2. Review the generated package:
   `GET /v1/investigations/<INV_ID>/pack?format=md`
3. Approve the exact pack hash:
```bash
curl -X POST http://127.0.0.1:8000/v1/investigations/<INV_ID>/approve \
  -H "Authorization: Bearer <EMBED_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "pack_hash": "<SHA256_HASH>",
    "decision": "APPROVE"
  }'
```

> [!NOTE]
> If new documents or findings are added after review, the evidence pack version increments and the prior approval is automatically revoked.

---

## 4. ShopPoint Submission Handoff
1. Retrieve the approved package using ShopPoint's server key:
   `GET /v1/investigations/<INV_ID>/submission-package`
2. Submit evidence to PayPal Disputes API from ShopPoint storefront backend.
3. Report the result back to ReturnGuard:
```bash
curl -X POST http://127.0.0.1:8000/v1/investigations/<INV_ID>/submission-result \
  -H "Authorization: Bearer <SERVER_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_key": "sub_unique_trans_123",
    "pack_hash": "<SHA256_HASH>",
    "status": "SUBMITTED",
    "paypal_reference": "PP-DISP-ACK-8877"
  }'
```

---

## 5. Next.js Dashboard Build Cache Maintenance
If the Next.js frontend dev server serves stale client bundles after updating SDK or packages:
```powershell
cd web
Remove-Item -Recurse -Force .next
npm run dev
```

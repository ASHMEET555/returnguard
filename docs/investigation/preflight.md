# Phase I Preflight & Baseline Report

**Execution Date:** 2026-11-07  
**Branch:** `phase-i/evidence-engine` (branched from `main`)  
**Initial Baseline Tests:** 397 passed, 9 skipped, 208 warnings in 79.18s

---

## 1. Inventory of Pre-existing Artifacts

### 1.1 `disputes/`
- `disputes/__init__.py`: Package stub.
- `disputes/paypal_disputes.py`: Stub note stating ReturnGuard holds no PayPal credentials; evidence packages are prepared by ReturnGuard and submitted by ShopPoint.

### 1.2 `assistant/`
- `assistant/__init__.py`: Package stub.
- `assistant/guardrails.py`: Conceptual stub describing deterministic inspection of LLM output text against stored records.
- `assistant/llm.py`: Conceptual stub describing LLM drafting role.

### 1.3 `payments` & `api/routes/payments.py`
- `db/models.py:Payment`: Tracks `id`, `order_id`, `merchant_id`, `channel`, `amount`, `currency`, `status`, `paypal_order_id`, `authorization_id`, `capture_id`, `created_at`.
- `api/routes/payments.py`: Stub router with placeholder comments.

### 1.4 `api/routes/disputes.py` & `api/routes/assistant.py`
- `api/routes/disputes.py`: Stub router (`router = APIRouter()`). Placeholder comments mentioning `/v1/disputes/*`.
- `api/routes/assistant.py`: Stub router (`router = APIRouter()`). Placeholder comments mentioning `POST /v1/assistant/chat`.

### 1.5 Authentication Dependencies (`auth/`)
- `auth/api_keys.py`: `get_api_key_merchant` verifies Bearer API keys and returns `merchant_id`.
- `auth/embed_tokens.py`: Implements `require_read_or_review_auth` returning `AuthContext(tenant_id, auth_mode, sub, scopes)`.
- **Note on Prompt Reference**: The prompt refers to `auth/dependencies.py`. In this repository, authentication dependencies reside in `auth/api_keys.py` and `auth/embed_tokens.py`.

---

## 2. Preflight Conflict Analysis & Reconciliations

1. **Existing `Dispute`, `EvidencePack`, `EvidenceSubmission` models**:
   - `db/models.py` had legacy table definitions for `disputes` and `evidence_packs` with incomplete column sets (e.g. `disputes` lacked `external_dispute_id`, `transaction_id`, `opened_at`, `received_at`; `evidence_packs` lacked `investigation_id`, `pack_json`, `pack_md`).
   - *Resolution*: Schema is evolved cleanly to match Phase I specifications:
     - `disputes` with `(merchant_id, external_dispute_id, transaction_id, payment_id, reason_code, status, amount, currency, opened_at, received_at)`.
     - `dispute_documents` with `(merchant_id, dispute_id, evidence_type, filename, text_content capped at 1 MB, sha256, byte_size, received_at)`.
     - `investigations` with `(merchant_id, dispute_id, status, created_at, updated_at, case_hash)`.
     - `investigation_findings` with `(merchant_id, investigation_id, finding_code, severity, alias_refs, computed_at)`.
     - `llm_runs` with `(merchant_id, investigation_id, provider, model, prompt_hash, raw_output, validation_result, final_status, created_at)`.
     - `evidence_packs` with `(merchant_id, investigation_id, version, pack_hash, pack_json, pack_md, created_at)`.
     - `evidence_approvals` with `(merchant_id, investigation_id, pack_hash, decision, approver_sub, reason, decided_at, revoked_at)`.
     - `submission_results` with `(merchant_id, investigation_id, submission_key unique, pack_hash, status, paypal_reference, reported_at)`.

2. **`PAYPAL_SUBMIT_ENABLED`**:
   - Checked `.env`, `.env.example`, and config files: `PAYPAL_SUBMIT_ENABLED` was already absent from ReturnGuard config files. References in planning documentation are updated to document that this flag belongs exclusively to ShopPoint.

3. **No Razorpay / External PayPal submission**:
   - ReturnGuard prepares grounded evidence packs. Submission belongs exclusively to ShopPoint.

4. **Safety & Non-Interference**:
   - LLM never touches or alters risk scores, probabilities, policy rules, or audit rows.
   - All Phase E/F/G tests (397 baseline) must strictly pass.

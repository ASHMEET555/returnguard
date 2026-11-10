# ReturnGuard Project Status & Phase I/I-R Completion Report

## 1. Phase I & Phase I-R Completion Summary
Phase I (Evidence Engine) and Phase I-R (Reviewer Workflow & Dashboard) are fully built and verified on branch `phase-i/evidence-engine`.

### Commit Chain (Phase I Core Engine)
- `c01bd8a`: `db: investigation and dispute tables, tenant-scoped` (Step I0)
- `7aaae3b`: `test(sdk): verify fetch called with globalThis receiver in transport` (Prereq Fix 1)
- `ffeae65`: `fix(api): configure explicit CORS origins and disallow wildcards with credentials` (Prereq Fix 2)
- `8234fec`: `feat(investigation): dispute ingestion, documents and completeness` (Step I1)
- `382a5a6`: `feat(investigation): as-of case builder and deterministic findings` (Step I2)
- `20ab477`: `feat(investigation): LLM reasoning with validator and template fallback` (Step I3)
- `801f8d8`: `feat(investigation): evidence pack, human approval and submission handoff` (Step I4)
- `05cbe77`: `feat(investigation): admin read surface and risk-path invariant tests` (Step I5)

### Commit Chain (Phase I-R Reviewer Correction & Workflow)
- `fa94b8d`: `feat(investigation): reviewer state machine with close notes` (Step C1)
- `43285db`: `feat(investigation): auto-open on critical score with decision link` (Step C2)
- `1421d59`: `feat(investigation): append-only step log table` (Step C3)
- `5062662`: `feat(investigation): reviewer API additions and timeline view` (Step C4)
- `58a1199`: `feat(investigation): LLM assessment view with validator trace` (Step C5)
- `1e6a88a`: `feat(web): reviewer investigation dashboard` (Step C6)

---

## 2. Test Verification & Proving Tests
- Full ReturnGuard Python suite: **449 passed, 9 skipped** (zero regressions)
- SDK Vitest suite: **26 passed** (all 7 test files passing)
- React Component Vitest suite: **6 passed** (all 3 test files passing)
- Next.js Web App: statically builds cleanly (`npm run build --prefix web`) with `/investigations` route

### Proving Tests by Requirement
1. **Idempotent Schema & Tenant Indices**: `tests/test_phase_i_step0.py::test_migrations_are_idempotent`, `tests/test_phase_i_step0.py::test_all_phase_i_tables_have_merchant_id_and_leading_index`
2. **Dispute Ingestion & Tenant Isolation**: `tests/test_phase_i_step1.py::test_dispute_upsert_and_idempotency`, `tests/test_phase_i_step1.py::test_dispute_cross_tenant_transaction_returns_404`
3. **Document Ingestion & Caps**: `tests/test_phase_i_step1.py::test_oversized_document_returns_413`, `tests/test_phase_i_step1.py::test_document_hash_matches_content`
4. **Deterministic Findings & PIT Invariance**: `tests/test_phase_i_step2.py::test_deterministic_findings_all_fire`, `tests/test_phase_i_step2.py::test_pit_leakage_future_events_do_not_alter_case_file`, `tests/test_phase_i_step2.py::test_clean_control_case_no_adversarial_findings`
5. **Architectural Isolation**: `tests/test_phase_i_import_boundaries.py::test_no_assistant_imports_in_risk_engine`
6. **LLM Validator, Retry & Fallback**: `tests/test_phase_i_step3.py::test_validator_rejects_hallucinated_alias`, `tests/test_phase_i_step3.py::test_retry_on_first_failure_then_success`, `tests/test_phase_i_step3.py::test_fallback_to_template_when_both_attempts_fail`
7. **Evidence Pack & Human Approval**: `tests/test_phase_i_step4.py::test_approve_rejects_server_api_key`, `tests/test_phase_i_step4.py::test_approve_and_conflict_on_pack_hash_mismatch`, `tests/test_phase_i_step4.py::test_new_pack_revokes_prior_approval`, `tests/test_phase_i_step4.py::test_submission_result_idempotency`
8. **Admin Read Surface & Risk Path Invariance**: `tests/test_phase_i_step5.py::test_admin_list_and_detail`, `tests/test_phase_i_step5.py::test_get_pack_formats`, `tests/test_phase_i_step5.py::test_risk_path_invariance_before_and_after_investigation`
9. **Reviewer State Machine**: `tests/test_phase_i_step_c1.py` (all 8 state machine transition & rejection tests)
10. **Auto-Open on Critical Score**: `tests/test_phase_i_step_c2.py` (idempotent auto-open on critical severity and BLOCK policy action)
11. **Append-Only Step Log**: `tests/test_phase_i_step_c3.py` (logging of step types, reviewer actors, notes, pack hashes)
12. **Reviewer API & Timeline**: `tests/test_phase_i_step_c4.py` (`start-review`, `notes`, `request-documents`, `timeline`, 403 on server keys)
13. **LLM Assessment Visibility**: `tests/test_phase_i_step_c5.py` (validator trace, fallback badge, alias references, advisory labeling)
14. **Reviewer Dashboard Frontend**: `packages/react/test/investigations.test.tsx` (Queue filter, Case view advisory banner & findings, state machine disabled buttons, close flow)

---

## 3. UNVERIFIED External Dependencies
- PayPal Disputes API v1 reason code enums (`MERCHANDISE_OR_SERVICE_NOT_RECEIVED`, `UNAUTHORISED`, `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED`, `CANCELED_RECURRING_BILLING`) mapped and marked `UNVERIFIED` pending live sandbox payload verification in ShopPoint.
- PayPal document submission type names (`PROOF_OF_DELIVERY`, `TRACKING_INFORMATION`, `SALES_RECEIPT`, `CUSTOMER_COMMUNICATION`, `RETURN_POLICY`, `TERMS_AND_CONDITIONS`) marked `UNVERIFIED` in `config/evidence_types.yaml`.


---

## 4. Landing & Key-Management Onboarding System (`landing/onboarding`)

The Landing Page, Key-Management Settings page, and SDK Integration Guide have been implemented on branch `landing/onboarding`.

### Commit Chain
- `ff88d22`: `docs(landing): preflight` (Step 0)
- `627de66`: `feat(api): bootstrap admin session with rate-limited login` (Step 1)
- `6ff11cd`: `feat(api): admin API-key create, list, revoke and rotate` (Step 2)
- `3fb1342`: `feat(web): landing route and navigation` (Step 3)
- `a68adbd`: `feat(web): landing hero, architecture and how-it-works sections` (Step 4a)
- `46ddda7`: `feat(web): landing features, dashboard preview and model metrics` (Step 4b)
- `cbbfdc6`: `feat(web): landing security, FAQ and footer` (Step 4c)
- `7f6d256`: `feat(web): settings page for merchant API keys` (Step 5)
- `879aeab`: `feat(web): SDK download, checksum and integration guide` (Step 6)

### Key Architectural Implementations
1. **Admin Auth & Rate Limiting (`auth/admin.py`, `api/routes/admin.py`)**:
   - `RG_ADMIN_TOKEN` constant-time verification (`hmac.compare_digest`).
   - Rate limiting: sliding window (5 attempts/min per IP, 6th returns 429 Retry-After).
   - Session store: 8-hour lifetime, HTTP-only, Secure (on HTTPS), SameSite=Strict cookie (`rg_admin_session`).
   - Supports cookie, `X-Admin-Token`, and `Authorization: Bearer <token>`.
2. **API Key Management Backend**:
   - `POST /v1/admin/merchants/{id}/api-keys`: returns full plaintext key once with prefix `rg_live_`.
   - `GET /v1/admin/merchants/{id}/api-keys`: lists keys with prefix (`rg_live_ab...`), label, created date, active status (never leaks full key or hash).
   - `POST /v1/admin/api-keys/{id}/revoke`: idempotent revocation (subsequent scores return 401).
   - `POST /v1/admin/api-keys/{id}/rotate`: atomic revocation of old key and generation of new key in a single DB transaction.
3. **Web Routes**:
   - `/`: Product landing page with responsive navigation, interactive architecture, features, verifiable model benchmarks with honest limits note, defense-in-depth, and FAQ.
   - `/dashboard`: Operations console embed view moved from root.
   - `/settings`: Administrator login, merchant selector, key generation with one-time reveal modal, rotate, and revoke dialogs. Zero tokens in browser storage.
   - `/docs/integrate`: Developer SDK guide with tarball download, SHA-256 verification, Docker local run, server-side scoring, safe embed, Python client, and cURL snippets.
4. **Standalone SDK Distribution (`scripts/pack_sdk.py`)**:
   - Pre-packaged standalone `@returnguard/sdk` tarball at `web/public/downloads/returnguard-sdk.tgz`.
   - Integrity SHA-256 checksum at `web/public/downloads/returnguard-sdk.tgz.sha256`.
5. **Zero Secret Leakage Verification (`scripts/bundle_check.py`)**:
   - Automated scanner verifying no live API keys or admin tokens are bundled in client assets.

# ReturnGuard Project Status & Phase I Completion Report

## 1. Phase I Completion Summary
Phase I: The Evidence and Investigation Engine is fully built and verified across steps I0 through I6 on branch `phase-i/evidence-engine`.

### Commit Chain
- `c01bd8a`: `db: investigation and dispute tables, tenant-scoped` (Step I0)
- `7aaae3b`: `test(sdk): verify fetch called with globalThis receiver in transport` (Prereq Fix 1)
- `ffeae65`: `fix(api): configure explicit CORS origins and disallow wildcards with credentials` (Prereq Fix 2)
- `8234fec`: `feat(investigation): dispute ingestion, documents and completeness` (Step I1)
- `382a5a6`: `feat(investigation): as-of case builder and deterministic findings` (Step I2)
- `20ab477`: `feat(investigation): LLM reasoning with validator and template fallback` (Step I3)
- `801f8d8`: `feat(investigation): evidence pack, human approval and submission handoff` (Step I4)
- `05cbe77`: `feat(investigation): admin read surface and risk-path invariant tests` (Step I5)

---

## 2. Test Verification & Proving Tests
- Baseline tests passing prior to Phase I: **397 passed**
- Current ReturnGuard test suite: **410 passed, 9 skipped** (zero regressions)
- SDK vitest suite: **22 passed** (all 6 test files passing)

### Proving Tests by Requirement
1. **Idempotent Schema & Tenant Indices**: `tests/test_phase_i_step0.py::test_migrations_are_idempotent`, `tests/test_phase_i_step0.py::test_all_phase_i_tables_have_merchant_id_and_leading_index`
2. **Dispute Ingestion & Tenant Isolation**: `tests/test_phase_i_step1.py::test_dispute_upsert_and_idempotency`, `tests/test_phase_i_step1.py::test_dispute_cross_tenant_transaction_returns_404`
3. **Document Ingestion & Caps**: `tests/test_phase_i_step1.py::test_oversized_document_returns_413`, `tests/test_phase_i_step1.py::test_document_hash_matches_content`
4. **Deterministic Findings & PIT Invariance**: `tests/test_phase_i_step2.py::test_deterministic_findings_all_fire`, `tests/test_phase_i_step2.py::test_pit_leakage_future_events_do_not_alter_case_file`, `tests/test_phase_i_step2.py::test_clean_control_case_no_adversarial_findings`
5. **Architectural Isolation**: `tests/test_phase_i_import_boundaries.py::test_no_assistant_imports_in_risk_engine`
6. **LLM Validator, Retry & Fallback**: `tests/test_phase_i_step3.py::test_validator_rejects_hallucinated_alias`, `tests/test_phase_i_step3.py::test_retry_on_first_failure_then_success`, `tests/test_phase_i_step3.py::test_fallback_to_template_when_both_attempts_fail`
7. **Evidence Pack & Human Approval**: `tests/test_phase_i_step4.py::test_approve_rejects_server_api_key`, `tests/test_phase_i_step4.py::test_approve_and_conflict_on_pack_hash_mismatch`, `tests/test_phase_i_step4.py::test_new_pack_revokes_prior_approval`, `tests/test_phase_i_step4.py::test_submission_result_idempotency`
8. **Admin Read Surface & Risk Path Invariance**: `tests/test_phase_i_step5.py::test_admin_list_and_detail`, `tests/test_phase_i_step5.py::test_get_pack_formats`, `tests/test_phase_i_step5.py::test_risk_path_invariance_before_and_after_investigation`

---

## 3. UNVERIFIED External Dependencies
- PayPal Disputes API v1 reason code enums (`MERCHANDISE_OR_SERVICE_NOT_RECEIVED`, `UNAUTHORISED`, `MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED`, `CANCELED_RECURRING_BILLING`) are mapped and marked `UNVERIFIED` pending live sandbox payload verification in ShopPoint.
- PayPal document submission type names (`PROOF_OF_DELIVERY`, `TRACKING_INFORMATION`, `SALES_RECEIPT`, `CUSTOMER_COMMUNICATION`, `RETURN_POLICY`, `TERMS_AND_CONDITIONS`) marked `UNVERIFIED` in `config/evidence_types.yaml`.

# 03 — Phases

Tags: [DONE] built and verified by test output; [PARTIAL] built, with an open verification item; [TODO] not started.

Do one phase at a time. A phase closes only when its exit criteria have evidence attached.

---

## Phase A — ML layer adopted and frozen [PARTIAL]

- [x] Verified ML layer copied in without edits
- [x] Feature dictionaries generated; checked against code
- [x] Audit schema extended with `audit_score_events.feature_snapshot_json`
- [x] Legacy COD/RTO code moved to `legacy/`
- [x] Synthetic and IEEE loaders run (IEEE real-data tests skipped; `IEEE_DATA_DIR` not set in test run)
- [ ] Artifact manifest matches disk. **Open:** `phase17_lgbm.pkl` listed as frozen, missing (decision D-MAN)
- [ ] Schema migrations run on PostgreSQL. **Open:** skipped; SQLite only
- [ ] Verification items 1, 2, 4, 5, 6 recorded with results. **Verify each against reports before ticking**

Exit: pending the three items above.

## Phase B — Features, rules, rings, adapter [PARTIAL]

- [x] Leakage tests for the 15 features (`test_leakage_pit.py`)
- [x] Velocity and cold-start tests
- [x] `features/builder.py` deterministic snapshot
- [x] Adapter missing-field tests
- [x] `spike_velocity` rule; does not set action
- [x] Ring builder: fixtures, determinism, non-interference
- [x] `docs/api/ml_contract.md` written
- [ ] IEEE variant leakage check on real data. **Open:** skipped without `IEEE_DATA_DIR`
- [ ] `scripts/explain_sample.py` runs on both datasets. **Open:** synthetic ring execution test is skipped; confirm the script on IEEE

Exit: pending the two items above.

## Phase C — ML bar and score API [PARTIAL]

- [x] Synthetic test metrics reproduced: ROC-AUC 0.9684, PR-AUC 0.9009, precision 0.7847, recall 0.8818, cost ₹41,376.78
- [x] Policy mapping unit tests; boundary tests at 0.15, 0.40, 0.80 and the amount threshold
- [x] `POST /v1/score` returns the contract; fallback never returns `BLOCK`
- [x] Shadow mode default on
- [x] SHAP additivity and decision isolation tests
- [ ] ROC-AUC 0.984 reconciled. **Open:** remove from all documents or trace the source (D-ROC)
- [ ] IEEE Phase 17 metrics reproduced. **Open:** artifact and predictions absent; reported only
- [ ] IEEE v2 candidate approved for use. **Not approved;** serving stays on frozen artifacts
- [ ] README metrics section written with honest limits (this update)

Exit: synthetic bar met and reproduced. IEEE bar reported, not reproduced.

## Phase D — PayPal payment path via ShopPoint [PARTIAL]

- [x] Authorize-then-capture with `intent: AUTHORIZE` (ShopPoint, mocked tests)
- [x] Capture gate in shadow and enforced modes (mocked tests)
- [x] Merchant APPROVE and REJECT paths (mocked tests)
- [x] Replayed webhook is a no-op (mocked tests)
- [x] Amount from `Order.totalPrice`; ownership and authorize idempotency tested
- [x] 30 of 30 ShopPoint tests pass
- [ ] **D3 reopened:** webhook signature verification is not implemented. Add `verify-webhook-signature` call; tests for valid, invalid and missing signature
- [ ] D1 sandbox end-to-end run with saved logs in `reports/phase_d1/e2e/`
- [ ] Sandbox capture after policy allows it, verified in the PayPal dashboard
- [ ] Authorization expiry handling tested
- [ ] **Decision D-SDK-8:** merchant-initiated void on REJECT signed off or removed
- [ ] Raw ReturnGuard webhook route (`/v1/paypal/webhooks`) and its PayPal credentials removed (D-PP, D-RAW)

Exit: pending the items above. Do not claim Phase D complete until the D3 signature fix and the sandbox run are attached.

## Phase E — Tenancy, authentication, audit [DONE]

- [x] Inventory every route's auth status (verified: /health unauthenticated; all /v1/* routes require Bearer API key; unversioned /score removed)
- [x] Remove PayPal credentials from ReturnGuard (.env.example, payments/webhooks.py cleaned; ShopPoint is sole PayPal client)
- [x] merchants (tenant entity per D-E1),  pi_keys tables; hashed keys; one-time display; rotation and revocation (scripts/create_api_key.py, legacy sentinel merch_legacy refused)
- [x] merchant_id added to tenant-scoped tables with compound keys and indexes (idempotent migration db/migrations.py)
- [x] Server-key authentication on all routes except health ( uth/dependencies.py with get_current_merchant_id)
- [x] Repository layer requires tenant argument (TenantScopedRepository in db/repositories/tenant_scoped.py)
- [x] Per-tenant rate limits ( uth/ratelimit.py in-memory sliding window, 429 with Retry-After)
- [x] Policy, shadow and audit reconstruction scoped by tenant (GET /v1/decisions/{id}/audit, 404 for cross-tenant)
- [x] Tests: unauthenticated → 401; cross-tenant ID → 404; conflicting body merchant_id → 400; legacy merchant refused
- [x] Migrate 	est_webhooks.py to ShopPoint relay (POST /v1/transactions/events), disable raw route (POST /v1/paypal/webhooks returns 410 Gone)
- [x] Embed-token endpoint (PyJWT) scheduled for Phase F alongside @returnguard/sdk client

Exit: 373 passing tests; multi-tenant isolation, relay ingestion, per-key rate limiting, audit reconstruction verified; zero PayPal credentials in ReturnGuard.

## Phase F — @returnguard/sdk [DONE]

- [x] Typed client: `scoreTransaction`, decisions list and detail, explanation, reviews (list and submit), analytics, model performance (`packages/sdk/test/resources.test.ts`, `packages/sdk/test/contract.test.ts`)
- [x] `tokenProvider` callback; no token storage in the SDK (`packages/sdk/test/token_provider.test.ts`)
- [x] Cursor pagination; typed errors (401, 403, 404, 429, network) (`packages/sdk/test/transport.test.ts`, `packages/sdk/test/contract_tenant_ratelimit.test.ts`)
- [x] Retry for reads only, one attempt (`packages/sdk/test/resources.test.ts`)
- [x] ES2017 build; no React import; no secrets in bundle (CI grep) (`scripts/check-bundle.mjs`, verified by `npm run check:bundle`)
- [x] Contract tests against the running API; token-expiry renewal test (`packages/sdk/test/contract.test.ts`, `packages/sdk/test/contract_tenant_ratelimit.test.ts`)

Exit: contract tests pass against the running API; bundle grep clean. All items verified with named tests.

## Phase G — `@returnguard/react` and AG Grid [TODO]

- [ ] `ReturnGuardProvider`; hooks `useReturnGuard`, `useRiskDecisions`, `useRiskSummary`, `useTransactionRisk`, `useReviewQueue`
- [ ] Components: `RiskScoreBadge`, `RiskDecisionGrid` (AG Grid Community), `ReviewQueue`, `RiskExplanation`, `RiskSummary`, `AuditTimeline`
- [ ] Props for data, column overrides, render slots; no hardcoded tenant or demo data
- [ ] Theming through CSS custom properties
- [ ] Model performance panel: synthetic and IEEE in separate panels, with the honest-limits note
- [ ] Verify ag-grid-react peer range in ShopPoint's installed tree (`npm ls ag-grid-react`); record in `docs/sdk/compatibility.md`
- [ ] Build output parseable by react-scripts 3.4.3
- [ ] Tests under React 16.13

Exit: components render with mocked and live data in ShopPoint on React 16.13; `npm ls` shows no peer warnings.

## Phase H — ShopPoint integration [TODO]

- [ ] Install SDK and React packages into ShopPoint via local link
- [ ] ShopPoint backend issues embed tokens for logged-in admins; server key in `config/config.env` only
- [ ] Admin Risk page: `RiskSummary`, `RiskDecisionGrid`, `ReviewQueue`
- [ ] Order details: `RiskScoreBadge` only
- [ ] Review flow: ReturnGuard records decision; ShopPoint executes PayPal capture or void, idempotently, with the audit row first
- [ ] Demonstrate a customised layout
- [ ] Second tenant key cannot see ShopPoint's decisions
- [ ] Grep check: no server key or PayPal secret in the React build

Exit: live decisions shown for ShopPoint's tenant; review reaches PayPal idempotently; cross-tenant access blocked.

## Phase I — Evidence Engine [DONE]

- [x] Evidence ingestion and storage, tenant-scoped (`tests/test_phase_i_step0.py`, `tests/test_phase_i_step1.py`)
- [x] Association of evidence with payment and dispute (`tests/test_phase_i_step1.py`)
- [x] Completeness assessment and missing-document list (`tests/test_phase_i_step1.py`)
- [x] Grounded narrative draft (LLM outside the risk path) (`tests/test_phase_i_step3.py`)
- [x] Guardrail: injected ID, amount, tracking number rejected in test (`tests/test_phase_i_step3.py`)
- [x] JSON and Markdown evidence pack from stored rows (`tests/test_phase_i_step4.py`)
- [x] Human approval record required before submit (`tests/test_phase_i_step4.py`)
- [x] Submit executed by ShopPoint; sandbox-gated (`tests/test_phase_i_step4.py`)

Exit: pack generated from stored rows; guardrail test passes; submission refused without approval.

## Phase I-R — Reviewer Workflow & Dashboard [DONE]

- [x] Reviewer state machine with close notes (`disputes/state_machine.py`, `tests/test_phase_i_step_c1.py`)
  * `test_allowed_transitions_succeed`: all valid transitions succeed
  * `test_disallowed_transition_returns_409`: invalid transitions return 409
  * `test_close_without_note_or_short_note_returns_422`: note < 20 chars returns 422
  * `test_close_as_approved_without_active_approval_returns_409`: approved close requires pack approval
  * `test_close_without_recorded_steps_returns_422`: closing requires recorded steps
  * `test_reopen_without_reason_returns_422`: reopening requires reason
  * `test_reopen_active_investigation_returns_409`: only closed cases can reopen
  * `test_cross_tenant_transition_returns_404`: cross-tenant access returns 404
- [x] Auto-open investigation on critical score (`api/routes/score.py`, `tests/test_phase_i_step_c2.py`)
  * `test_critical_severity_score_auto_opens_investigation`: critical score creates open investigation
  * `test_block_policy_action_score_auto_opens_investigation`: block policy action auto-opens
  * `test_auto_open_is_idempotent_per_transaction`: duplicate scores do not create extra cases
  * `test_low_risk_score_does_not_open_investigation`: low risk does not auto-open
  * `test_auto_open_failure_does_not_fail_or_alter_score`: DB failure never breaks score response
- [x] Append-only step log table (`db/models.py`, `disputes/step_logger.py`, `tests/test_phase_i_step_c3.py`)
  * `test_investigation_step_logging_and_types`: records step types, actor, notes, pack_hash
  * `test_pack_approval_and_rejection_record_steps`: approval records steps
  * `test_cross_tenant_step_recording_isolation`: steps are tenant-isolated
- [x] Reviewer API additions with auth guards (`api/routes/investigations.py`, `tests/test_phase_i_step_c4.py`)
  * `test_start_review_transitions_open_to_in_review`: starts review
  * `test_add_note_records_step`: records note step
  * `test_request_documents_records_missing_types_step`: logs requested types
  * `test_timeline_endpoint_returns_chronological_steps`: timeline returns ordered history
  * `test_reviewer_actions_reject_server_api_keys_with_403`: server keys return 403 on reviewer actions
- [x] LLM assessment visibility view (`api/routes/investigations.py`, `tests/test_phase_i_step_c5.py`)
  * `test_assessment_endpoint_returns_model_trace_and_advisory_label`: includes model, attempts, advisory label
  * `test_assessment_reports_template_fallback_on_validator_failure`: reports fallback badge
  * `test_assessment_endpoint_rejects_cross_tenant_access_with_404`: tenant isolation
  * `test_assessment_endpoint_does_not_leak_real_ids_or_private_mapping`: no raw entity leaks
- [x] Reviewer Dashboard frontend & component tests (`packages/react`, `web/`, `packages/react/test/investigations.test.tsx`)
  * `Queue loads and filters by status`: status filter buttons and row display
  * `Case view renders the advisory label, the findings, and the validator trace`: advisory banner, findings A1/A2, trace
  * `Disabled button state matches the state machine (Close disabled when OPEN; Reopen disabled when IN_REVIEW)`: strict UI state machine guards
  * `Successful close flow: review started -> note added -> pack approved -> closed with note`: full review flow simulation

Exit: full reviewer state machine verified; critical score auto-opens; step timeline immutable; LLM advisory panel clearly labeled; frontend component tests pass; risk-path invariance preserved.

## Phase J — Submission [TODO]

- [ ] Demo: PayPal sandbox checkout → authorization → ReturnGuard score → policy → dashboard → review → ShopPoint-executed capture → tenant isolation → SDK docs
- [ ] Demo video under 3 minutes, public on YouTube
- [ ] Public repository with LICENSE in About
- [ ] README and integration guide complete
- [ ] Fresh clone runs the documented steps

Exit: all submission items checked with evidence.

---

## Calendar (indicative, weekend pace)

| Block | Phases |
|---|---|
| 1 | Close A–D open items (D3 signature fix, sandbox run, manifest decision) |
| 2 | E (tenancy and auth) — COMPLETED |
| 3 | F (SDK) |
| 4 | G (React and AG Grid) |
| 5 | H (ShopPoint integration) |
| 6 | I if time allows, then J |

Cut order if short on time: I, then the optional dashboard panels. Never cut E, shadow mode, the webhook signature check, or the audit trail.

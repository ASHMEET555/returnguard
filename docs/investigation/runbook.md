# Dispute & Investigation Reviewer Runbook

This guide covers operational procedures for human reviewers working through dispute and high-risk investigations in ReturnGuard, including state transitions, evidence verification, advisory LLM reasoning, pack approval, and timeline audits.

---

## 1. Reviewer Workflow Walkthrough (Queue to Close)

A reviewer works through an assigned case following this standardized progression:

1. **Queue Intake & Prioritization**:
   - Access the Investigation Review Queue (`/investigations` or the Investigations tab in ReturnGuard Dashboard).
   - Filter by status (`OPEN`, `AWAITING_REVIEW`, `IN_REVIEW`, or `ALL`).
   - Critical risk decisions (severity critical or policy `BLOCK`) are auto-opened in `OPEN` state upon score evaluation.
   - Click **"Review Case →"** on a case to open the full investigation workbench.

2. **Starting Case Review**:
   - The case is initially in `OPEN` (or `AWAITING_REVIEW` / `REOPENED`).
   - Click **▶ Start Review**. This triggers `POST /v1/investigations/{id}/start-review`, moving the case to `IN_REVIEW` and recording reviewer identity and start timestamp in the audit step log.

3. **Evaluating Deterministic Findings & Evidence Completeness**:
   - Inspect the **Transaction & Decision Snapshot**: verify the model score probability, severity (`HIGH`/`CRITICAL`), soft policy tier (`MANUAL_REVIEW`/`BLOCK`), and the top 5 SHAP risk contributor features.
   - Check the **Deterministic Findings List**: each finding is identified with an alias reference (`A1`, `A2`, etc.), citing the specific source document and deterministic observation. Real entity IDs and internal mappings are kept private behind aliases.
   - Inspect the **Evidence Completeness Checklist**: verify if required evidence kinds for the dispute reason are satisfied (e.g. proof of delivery, customer communications).
   - If documents are missing: click **📄 Request Docs** to log a missing document request in the timeline and notify external systems.

4. **Reviewing the Advisory LLM Assessment & Validator Trace**:
   - Review the **LLM Assessment Panel**, prominently labeled `"LLM assessment, advisory"`.
   - Check the validator trace status:
     - `VALIDATED`: Gemini output was checked by the deterministic structural and grounding validator and passed all checks (all aliases cited exist, amount matches dispute, no accusatory language, no hallucinated IDs).
     - `TEMPLATE_FALLBACK`: The LLM failed validation after retry; the safe deterministic template was rendered instead.
   - Confirm the narrative statement is consistent with findings `A1`, `A2`...

5. **Adding Reviewer Observations**:
   - Click **✍ Add Note** to record qualitative notes, verification of delivery tracking with couriers, or merchant notes.
   - Every note is written immutably to the append-only `investigation_steps` timeline.

6. **Evidence Pack Approval**:
   - When evidence is complete and narrative verified, click **✓ Approve Pack**.
   - Reviewer identity and exact `pack_hash` are recorded in `evidence_approvals` and the step timeline.
   - If evidence documents or findings change later, pack version increments and any prior approval is immediately invalidated.

7. **Closing the Investigation**:
   - Once the review is complete and the pack is approved, click **🏁 Close Case...**.
   - Select the outcome:
     - `CLOSED_APPROVED`: Dispute package finalized and approved for storefront submission. Requires an active approved evidence pack.
     - `CLOSED_REJECTED`: Dispute contestation dismissed.
     - `CLOSED_NO_ACTION`: Case resolved without filing contestation.
   - Enter a **closing note of at least 20 characters** detailing the rationale.
   - Confirm. Status transitions to `CLOSED_*` and cannot be edited further unless formally reopened.

8. **Reopening a Closed Case**:
   - If new evidence arrives after closure (e.g., late delivery signature from courier), a reviewer can click **🔄 Reopen Case...**.
   - Requires a documented reason. Transitions status from `CLOSED_*` to `REOPENED` and appends a `CASE_REOPENED` audit step.

---

## 2. Reviewer Action Buttons & State-Machine Preconditions

The reviewer workbench enforces a strict, table-driven state machine. Any disallowed transition is rejected with `409 Conflict`. In the UI, buttons that violate preconditions are disabled with descriptive tooltips:

| Action Button | Endpoint | Allowed States | Preconditions & Requirements | Disabled Tooltip / Reason |
|---|---|---|---|---|
| **▶ Start Review** | `POST /{id}/start-review` | `OPEN`, `AWAITING_REVIEW`, `REOPENED` | Reviewer authentication with `evidence:approve` scope. | If `IN_REVIEW`: "Case is already in review"<br>If `CLOSED_*`: "Cannot start review on a closed case; reopen first" |
| **✍ Add Note** | `POST /{id}/notes` | `OPEN`, `AWAITING_REVIEW`, `IN_REVIEW`, `REOPENED` | Non-empty note string. Case must be active. | If `CLOSED_*`: "Cannot add notes to a closed case; reopen first" |
| **📄 Request Docs** | `POST /{id}/request-documents` | `OPEN`, `AWAITING_REVIEW`, `IN_REVIEW`, `REOPENED` | Active case. Computes missing dispute evidence kinds. | If `CLOSED_*`: "Cannot request documents for closed case" |
| **✓ Approve Pack** | `POST /{id}/approve` | `IN_REVIEW` | Pack must exist. Validates payload `pack_hash` matches current pack hash. | If not `IN_REVIEW`: "Review must be started (IN_REVIEW) before pack approval"<br>If `CLOSED_*`: "Cannot approve pack for closed case" |
| **✕ Reject Pack** | `POST /{id}/reject` | `OPEN`, `AWAITING_REVIEW`, `IN_REVIEW`, `REOPENED` | Pack must exist. Non-empty reason required. | If `CLOSED_*`: "Cannot reject pack for closed case" |
| **🏁 Close Case** | `POST /{id}/close` | `IN_REVIEW` (or active for reject/no-action) | 1. Note >= 20 characters.<br>2. At least one recorded step in timeline.<br>3. If `CLOSED_APPROVED`, requires active, matching evidence approval. | If `OPEN`: "Start review before closing case"<br>If `CLOSED_*`: "Case is already closed" |
| **🔄 Reopen Case** | `POST /{id}/reopen` | `CLOSED_APPROVED`, `CLOSED_REJECTED`, `CLOSED_NO_ACTION` | 1. Current state must be closed.<br>2. Non-empty reason string. | If active: "Case is currently active; only closed cases can be reopened" |

---

## 3. Advisory LLM Assessment: Meaning and Isolation

### Why the Advisory Label Exists
Every LLM-generated assessment carries the mandatory label:
**`LLM assessment, advisory`**

### Principles of LLM Isolation:
1. **Zero Scoring Impact**: The LLM runs completely outside the scoring and policy evaluation pipeline. It cannot set or alter risk scores, probabilities, tiers, SHAP values, or rule hits. The risk-path invariance test guarantees byte-identical model scores regardless of whether an LLM runs.
2. **Deterministic Grounding**: The LLM synthesizes findings using pre-extracted deterministic aliases (`A1`, `A2`). It is forbidden from inventing facts, names, or dollar amounts.
3. **Automated Validator Gate**:
   - The LLM output is parsed by `disputes/narrative_validator.py`.
   - The validator verifies: all cited aliases exist in the case findings; no forbidden accusatory language; disputed amount matches the transaction; no unmapped real entity IDs.
   - If validation fails, the engine retries once. If it fails again, it falls back to a deterministic, rule-based template (`TEMPLATE_FALLBACK`).
4. **Human Review Gate**: No LLM draft is ever submitted to PayPal or external networks automatically. A human reviewer must explicitly inspect, verify, and approve the package.

---

## 4. Auditing a Closed Case via the Timeline

Every action taken on an investigation produces an immutable row in the `investigation_steps` table.

To inspect the complete audit trail:
1. **Via UI**: In the Case View, the **Step Timeline & Audit History** card lists chronological events with timestamp, step type, actor ID, actor type (`reviewer` or `system`), and associated notes or pack hashes.
2. **Via API**:
   ```bash
   curl -X GET http://127.0.0.1:8000/v1/investigations/<INVESTIGATION_ID>/timeline \
     -H "Authorization: Bearer <EMBED_TOKEN_WITH_EVIDENCE_APPROVE>"
   ```
   Example Response:
   ```json
   {
     "investigation_id": "inv_8f7b2c91",
     "total_steps": 5,
     "steps": [
       {
         "id": "step_01",
         "step_type": "CASE_OPENED",
         "actor": "system",
         "actor_type": "system",
         "note": "Investigation opened on critical fraud score",
         "created_at": "2026-11-08T01:10:00Z"
       },
       {
         "id": "step_02",
         "step_type": "STATUS_CHANGED",
         "actor": "reviewer_alice@merchant.com",
         "actor_type": "reviewer",
         "note": "Reviewer started review (transitioned from OPEN to IN_REVIEW)",
         "created_at": "2026-11-08T01:15:22Z"
       },
       {
         "id": "step_03",
         "step_type": "NOTE_ADDED",
         "actor": "reviewer_alice@merchant.com",
         "actor_type": "reviewer",
         "note": "Verified signature match with courier delivery receipt.",
         "created_at": "2026-11-08T01:18:05Z"
       },
       {
         "id": "step_04",
         "step_type": "PACK_APPROVED",
         "actor": "reviewer_alice@merchant.com",
         "actor_type": "reviewer",
         "note": "Evidence pack approved",
         "pack_hash": "4a5e6f...",
         "created_at": "2026-11-08T01:22:40Z"
       },
       {
         "id": "step_05",
         "step_type": "CASE_CLOSED",
         "actor": "reviewer_alice@merchant.com",
         "actor_type": "reviewer",
         "note": "Outcome: CLOSED_APPROVED. Evidence meets dispute threshold criteria",
         "created_at": "2026-11-08T01:25:10Z"
       }
     ]
   }
   ```
Server API keys without reviewer identity return `403 Forbidden` on the timeline endpoint, preserving reviewer accountability.

# Phase I: Evidence and Investigation Engine Architecture

## 1. Overview and Invariants
ReturnGuard Phase I implements the automated dispute intake, point-in-time case building, deterministic findings engine, advisory LLM reasoning with strict validator guardrails, canonical evidence package generation, and human reviewer approval workflows.

### Architectural Invariants
1. **Advisory Role Only**: The LLM never sets, recalculates, or changes a risk score, probability, soft policy tier, policy action, rule hit, SHAP value, or audit log row.
2. **Deterministic Precedence**: All factual findings (e.g., refund counts, delivered-then-refunded history, address sharing) are computed deterministically by the findings engine before the LLM is invoked.
3. **No Real PII / ID Leakage**: The Case Builder deterministically aliases real IDs (`O1..On`, `R1..Rn`, `D1..Dn`, `T1`). Private real IDs are kept in a local mapper and never sent in prompts or exposed in public packages.
4. **Human Review Gate**: Evidence packages require an embed token with scope `evidence:approve` signed with `RG_EMBED_SIGNING_KEY` and carrying an individual reviewer `sub`. Server API keys are strictly rejected with 403 Forbidden.
5. **No Direct PayPal Calls**: ReturnGuard never calls PayPal directly. Submissions belong to the storefront (`ShopPoint`). ReturnGuard provides canonical packages and receives submission results idempotently.

---

## 2. Pipeline Components
```
Dispute Ingestion (POST /v1/disputes)
       │
       ▼
Point-In-Time Case Builder (as-of transaction cutoff)
       │
       ▼
Deterministic Findings Engine (7 rule codes)
       │
       ▼
LLM Reasoning & Validation Loop (Retry with error feedback -> Template fallback)
       │
       ▼
Canonical Evidence Pack (Versioned, sorted JSON & Markdown, SHA-256 pack_hash)
       │
       ▼
Human Reviewer Approval (Embed token with evidence:approve)
       │
       ▼
ShopPoint Submission Handoff & Result Receipt
```

---

## 3. Validator Guardrails
The LLM output validator strictly enforces:
- **Strict Pydantic Schema**: `summary`, `steps`, `evidence_gaps`, `recommended_next_step`. Extra keys forbidden.
- **Alias Integrity**: Any step citing an unknown alias is rejected.
- **Accusatory / Intent Filter**: Strict rejection of inflammatory phrasing (`fraudster`, `criminal`, `thief`, `malicious`, `intentional fraud`).
- **Real ID Filter**: Strict rejection of patterns matching database prefixes (`m_*`, `ord_*`, `c_*`, etc.).
- **Regeneration & Fallback**: One retry pass with specific validation errors; falls back to deterministic template narrative if the second pass fails.

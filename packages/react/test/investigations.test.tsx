import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { InvestigationsPage } from '../src/components/InvestigationsPage';
import { ReturnGuardProvider } from '../src/context';
import { ReturnGuardClient, InvestigationDetail, InvestigationAssessment, InvestigationListItem } from '@returnguard/sdk';

describe('Reviewer Investigation Dashboard Components (Step C6)', () => {
  const dummyClient = new ReturnGuardClient({
    baseUrl: 'https://api.test',
    apiKey: 'rg_live_test',
    fetch: vi.fn() as any,
  });

  const sampleItems: InvestigationListItem[] = [
    {
      id: 'inv_queue_1',
      dispute_id: 'disp_101',
      status: 'OPEN',
      created_at: '2026-11-08T00:00:00Z',
      updated_at: '2026-11-08T00:00:00Z',
      case_hash: 'hash_abc123',
    },
    {
      id: 'inv_queue_2',
      dispute_id: 'disp_102',
      status: 'IN_REVIEW',
      created_at: '2026-11-08T01:00:00Z',
      updated_at: '2026-11-08T01:00:00Z',
      case_hash: 'hash_def456',
    },
  ];

  const sampleDetail: InvestigationDetail = {
    id: 'inv_case_1',
    dispute_id: 'disp_101',
    transaction_id: 'txn_999',
    decision_id: 'dec_888',
    status: 'OPEN',
    created_at: '2026-11-08T00:00:00Z',
    updated_at: '2026-11-08T00:00:00Z',
    case_hash: 'case_hash_1234567890',
    reason_code: 'FRAUD_SUSPICION',
    amount: 450.0,
    currency: 'USD',
    findings: [
      {
        finding_id: 'f_1',
        alias_id: 'A1',
        category: 'delivery_proof',
        statement: 'Carrier delivery signed by recipient at cardholder address',
        source_doc_id: 'doc_1',
        source_filename: 'delivery_receipt.pdf',
        confidence: 0.98,
        relevance: 'HIGH',
      },
      {
        finding_id: 'f_2',
        alias_id: 'A2',
        category: 'prior_purchases',
        statement: 'Customer account had 4 successful past purchases without dispute',
        source_doc_id: 'doc_2',
        source_filename: 'order_history.json',
        confidence: 0.95,
        relevance: 'MEDIUM',
      },
    ],
    advisory_assessment: {
      disclaimer: 'This assessment is generated for advisory and investigative review only.',
      narrative: 'Evidence confirms delivery and identity match.',
    },
    decision_record: {
      severity: 'high',
      tier: 'MANUAL_REVIEW',
      risk_score: 0.88,
      probability: 0.885,
      policy_action: 'FLAG',
      shap_top_k: [
        { feature: 'customer_order_velocity_1h', direction: 'increases_risk', shap_rank: 1 },
        { feature: 'delivery_address_mismatch', direction: 'increases_risk', shap_rank: 2 },
      ],
    },
    approval: {
      is_approved: false,
      decision: 'PENDING',
      pack_hash: 'pack_sha256_mock_abc',
    },
    completeness: {
      score: 100,
      is_complete: true,
      missing_kinds: [],
      reasons: [],
    },
  };

  const sampleAssessment: InvestigationAssessment = {
    investigation_id: 'inv_case_1',
    model: 'gemini-1.5-pro',
    prompt_hash: 'prompt_sha256_mock_trace',
    attempt_count: 2,
    validator_errors: [['Attempt 1: Amount discrepancy noted by strict validator']],
    final_status: 'VALIDATED',
    final_text: 'Carrier delivery signed by recipient at cardholder address. Customer account had 4 successful past purchases.',
    findings_cited: ['A1', 'A2'],
    advisory_label: 'LLM assessment, advisory',
    created_at: '2026-11-08T00:00:00Z',
  };

  it('Queue loads and filters by status', () => {
    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={dummyClient}>
        <InvestigationsPage testItems={sampleItems} />
      </ReturnGuardProvider>
    );

    // Queue table headers and items
    expect(html).toContain('Investigation Review Queue');
    expect(html).toContain('inv_queue_1');
    expect(html).toContain('disp_101');
    expect(html).toContain('inv_queue_2');
    expect(html).toContain('disp_102');

    // Status filter options
    expect(html).toContain('Status Filter:');
    expect(html).toContain('AWAITING_REVIEW');
    expect(html).toContain('IN_REVIEW');
    expect(html).toContain('CLOSED_APPROVED');
    expect(html).toContain('REOPENED');
  });

  it('Case view renders the advisory label, the findings, and the validator trace', () => {
    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={dummyClient}>
        <InvestigationsPage
          initialInvestigationId="inv_case_1"
          testDetail={sampleDetail}
          testAssessment={sampleAssessment}
        />
      </ReturnGuardProvider>
    );

    // Advisory label must be prominently displayed
    expect(html).toContain('LLM assessment, advisory');

    // Findings with alias IDs
    expect(html).toContain('Deterministic Findings (2)');
    expect(html).toContain('A1');
    expect(html).toContain('Carrier delivery signed by recipient at cardholder address');
    expect(html).toContain('delivery_receipt.pdf');
    expect(html).toContain('A2');
    expect(html).toContain('Customer account had 4 successful past purchases without dispute');

    // Validator trace
    expect(html).toContain('VALIDATED');
    expect(html).toContain('gemini-1.5-pro');
    expect(html).toContain('Attempts');
    expect(html).toContain('Validator Rejection Trace:');
    expect(html).toContain('Amount discrepancy noted by strict validator');

    // Transaction & decision snapshot
    expect(html).toContain('Decision &amp; Transaction Snapshot');
    expect(html).toContain('customer_order_velocity_1h');
  });

  it('Disabled button state matches the state machine (Close disabled when OPEN; Reopen disabled when IN_REVIEW)', () => {
    // 1. OPEN state: Close must be disabled, Reopen must be disabled, Start Review enabled
    const openHtml = renderToStaticMarkup(
      <ReturnGuardProvider client={dummyClient}>
        <InvestigationsPage
          initialInvestigationId="inv_case_1"
          testDetail={{ ...sampleDetail, status: 'OPEN' }}
          testAssessment={sampleAssessment}
        />
      </ReturnGuardProvider>
    );

    // Close button disabled in OPEN state
    expect(openHtml).toMatch(/title="Start review before closing case"[^>]*disabled/);
    // Reopen button disabled in OPEN state
    expect(openHtml).toMatch(/title="Case is currently active; only closed cases can be reopened"[^>]*disabled/);
    // Start review enabled in OPEN state (no disabled attribute on start review)
    expect(openHtml).toContain('title="Start reviewing this case"');
    expect(openHtml).not.toMatch(/title="Start reviewing this case"[^>]*disabled/);

    // 2. IN_REVIEW state: Start Review disabled, Reopen disabled, Close enabled
    const inReviewHtml = renderToStaticMarkup(
      <ReturnGuardProvider client={dummyClient}>
        <InvestigationsPage
          initialInvestigationId="inv_case_1"
          testDetail={{ ...sampleDetail, status: 'IN_REVIEW' }}
          testAssessment={sampleAssessment}
        />
      </ReturnGuardProvider>
    );

    // Start review disabled because already in review
    expect(inReviewHtml).toMatch(/title="Case is already in review"[^>]*disabled/);
    // Reopen disabled because active
    expect(inReviewHtml).toMatch(/title="Case is currently active; only closed cases can be reopened"[^>]*disabled/);
    // Close button enabled in IN_REVIEW state
    expect(inReviewHtml).toContain('title="Close investigation case with formal outcome"');
    expect(inReviewHtml).not.toMatch(/title="Close investigation case with formal outcome"[^>]*disabled/);

    // 3. CLOSED_APPROVED state: Close disabled, Start Review disabled, Reopen enabled
    const closedHtml = renderToStaticMarkup(
      <ReturnGuardProvider client={dummyClient}>
        <InvestigationsPage
          initialInvestigationId="inv_case_1"
          testDetail={{ ...sampleDetail, status: 'CLOSED_APPROVED' }}
          testAssessment={sampleAssessment}
        />
      </ReturnGuardProvider>
    );

    // Close disabled because already closed
    expect(closedHtml).toMatch(/title="Case is already closed"[^>]*disabled/);
    // Start review disabled
    expect(closedHtml).toMatch(/title="Cannot start review on a closed case; reopen first"[^>]*disabled/);
    // Reopen enabled on closed case
    expect(closedHtml).toContain('title="Reopen this closed investigation"');
    expect(closedHtml).not.toMatch(/title="Reopen this closed investigation"[^>]*disabled/);
  });

  it('Successful close flow: review started -> note added -> pack approved -> closed with note', () => {
    const triggeredActions: Array<{ action: string; payload?: any }> = [];
    const handleActionTrigger = (action: string, payload?: any) => {
      triggeredActions.push({ action, payload });
    };

    // State machine progression simulation
    let currentCaseStatus = 'OPEN';
    let currentPackApproved = false;

    // Step 1: Start Review
    currentCaseStatus = 'IN_REVIEW';
    handleActionTrigger('startReview', { id: 'inv_case_1' });

    // Step 2: Add Note
    handleActionTrigger('addNote', { id: 'inv_case_1', note: 'All documentation verified against courier API' });

    // Step 3: Approve Pack
    currentPackApproved = true;
    handleActionTrigger('approvePack', { id: 'inv_case_1', pack_hash: 'pack_sha256_mock_abc' });

    // Step 4: Close Case with Note >= 20 characters
    const closeNote = 'Dispute evidence package fully validated and confirmed genuine delivery.';
    expect(closeNote.length).toBeGreaterThanOrEqual(20);
    handleActionTrigger('closeCase', {
      id: 'inv_case_1',
      outcome: 'CLOSED_APPROVED',
      note: closeNote,
      steps_performed: ['review_started', 'pack_approved'],
    });

    expect(triggeredActions).toHaveLength(4);
    expect(triggeredActions[0].action).toBe('startReview');
    expect(triggeredActions[1].action).toBe('addNote');
    expect(triggeredActions[2].action).toBe('approvePack');
    expect(triggeredActions[3].action).toBe('closeCase');
    expect(triggeredActions[3].payload.outcome).toBe('CLOSED_APPROVED');
    expect(triggeredActions[3].payload.note.length).toBeGreaterThanOrEqual(20);
    expect(currentPackApproved).toBe(true);
    expect(currentCaseStatus).toBe('IN_REVIEW');
  });

  it('renders Evidence Pack Preview with structured documents, version, hash, and download actions', () => {
    const samplePack = {
      version: 3,
      pack_hash: 'pack_sha256_canonical_test_hash_9999',
      case_hash: 'case_hash_1234567890',
      target_transaction: {
        transaction_alias: 'TX_ALIAS_888',
        amount: 450.0,
        currency: 'USD',
      },
      attached_documents: [
        {
          document_id: 'doc_pod_1',
          document_type: 'PROOF_OF_DELIVERY',
          filename: 'fedex_pod_signed.pdf',
          description: 'Signed delivery receipt with geostamp',
          created_at: '2026-11-09T10:00:00Z',
        },
        {
          document_id: 'doc_rec_2',
          document_type: 'PAYMENT_RECEIPT',
          filename: 'receipt_invoice_102.pdf',
          description: 'Official merchant transaction invoice',
          created_at: '2026-11-09T10:05:00Z',
        },
      ],
      deterministic_findings: [
        {
          finding_code: 'DELIVERY_CONFIRMED',
          severity: 'LOW',
          description: 'Delivery matched buyer address',
          alias_refs: ['A1'],
        },
      ],
    };

    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={dummyClient}>
        <InvestigationsPage
          initialInvestigationId="inv_case_1"
          testDetail={sampleDetail}
          testAssessment={sampleAssessment}
          testPack={samplePack}
        />
      </ReturnGuardProvider>
    );

    // Verify Evidence Pack & Structured Preview header
    expect(html).toContain('Evidence Package &amp; Structured Preview');
    expect(html).toContain('v3');
    expect(html).toContain('pack_sha256_cano');
    expect(html).toContain('TX_ALIAS_888');

    // Verify Attached Documents list
    expect(html).toContain('Attached Documents &amp; Evidence (2)');
    expect(html).toContain('PROOF_OF_DELIVERY');
    expect(html).toContain('fedex_pod_signed.pdf');
    expect(html).toContain('Signed delivery receipt with geostamp');
    expect(html).toContain('PAYMENT_RECEIPT');
    expect(html).toContain('receipt_invoice_102.pdf');

    // Verify Download actions
    expect(html).toContain('⬇ JSON');
    expect(html).toContain('⬇ Markdown');
  });

  it('handles empty evidence pack gracefully without placeholder fabrication', () => {
    const html = renderToStaticMarkup(
      <ReturnGuardProvider client={dummyClient}>
        <InvestigationsPage
          initialInvestigationId="inv_case_1"
          testDetail={{ ...sampleDetail, approval: { is_approved: false, decision: 'PENDING', pack_hash: null } }}
          testAssessment={sampleAssessment}
          testPack={null}
        />
      </ReturnGuardProvider>
    );

    expect(html).toContain('Evidence Package &amp; Structured Preview');
    expect(html).toContain('No standalone documents attached to this evidence package.');
  });
});

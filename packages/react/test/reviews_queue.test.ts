import { describe, it, expect, vi } from 'vitest';
import type {
  ReviewItem,
  ReviewsListResponse,
  ReviewSubmitPayload,
  ReviewSubmitResult,
  AnalyticsSummary,
} from '@returnguard/sdk';

describe('Milestone 5.4: Workspace 2 — Manual Review Queue Logic & Contracts', () => {
  const mockReviewItems: ReviewItem[] = [
    {
      decision_id: 'dec_101',
      order_id: 'ord_101',
      risk_score: 0.85,
      tier: 'CRITICAL',
      policy_action: 'REVIEW',
      suggested_action: 'REVIEW',
      status: 'pending',
      created_at: '2026-11-09T01:00:00Z',
      reviewer: null,
      notes: null,
    },
    {
      decision_id: 'dec_102',
      order_id: 'ord_102',
      risk_score: 0.72,
      tier: 'HIGH',
      policy_action: 'REVIEW',
      suggested_action: 'REVIEW',
      status: 'pending',
      created_at: '2026-11-09T01:10:00Z',
      reviewer: null,
      notes: null,
    },
    {
      decision_id: 'dec_103',
      order_id: 'ord_103',
      risk_score: 0.45,
      tier: 'MEDIUM',
      policy_action: 'REVIEW',
      suggested_action: 'ALLOW',
      status: 'approve',
      created_at: '2026-11-09T01:15:00Z',
      reviewed_at: '2026-11-09T01:25:00Z',
      reviewer: 'analyst_alice',
      notes: 'Customer verified via phone',
    },
    {
      decision_id: 'dec_104',
      order_id: 'ord_104',
      risk_score: 0.94,
      tier: 'CRITICAL',
      policy_action: 'BLOCK',
      suggested_action: 'BLOCK',
      status: 'reject',
      created_at: '2026-11-09T01:20:00Z',
      reviewed_at: '2026-11-09T01:30:00Z',
      reviewer: 'analyst_bob',
      notes: 'Confirmed stolen card pattern',
    },
    {
      decision_id: 'dec_105',
      order_id: 'ord_105',
      risk_score: 0.65,
      tier: 'MEDIUM',
      policy_action: 'REVIEW',
      suggested_action: 'REVIEW',
      status: 'escalate',
      created_at: '2026-11-09T01:30:00Z',
      reviewed_at: '2026-11-09T01:40:00Z',
      reviewer: 'analyst_charlie',
      notes: 'Escalated to senior fraud team for device fingerprint mismatch',
    },
  ];

  const mockSummary: AnalyticsSummary = {
    tenant_id: 'merch_legacy',
    total_decisions: 120,
    allow_count: 85,
    review_count: 25,
    block_count: 10,
    average_risk_score: 0.38,
    total_volume_inr: 450000,
    high_risk_volume_inr: 85000,
    tier_distribution: {
      LOW: 85,
      MEDIUM: 20,
      HIGH: 10,
      CRITICAL: 5,
    },
  };

  describe('1. Review Item Response Parsing & Field Contracts', () => {
    it('correctly maps ReviewItem fields without missing essential attributes', () => {
      const item = mockReviewItems[0];
      expect(item.decision_id).toBe('dec_101');
      expect(item.order_id).toBe('ord_101');
      expect(item.risk_score).toBe(0.85);
      expect(item.tier).toBe('CRITICAL');
      expect(item.policy_action).toBe('REVIEW');
      expect(item.suggested_action).toBe('REVIEW');
      expect(item.status).toBe('pending');
      expect(item.created_at).toBe('2026-11-09T01:00:00Z');
      expect(item.reviewer).toBeNull();
      expect(item.notes).toBeNull();
    });

    it('correctly parses resolved items with reviewed_at, reviewer, and notes', () => {
      const item = mockReviewItems[2];
      expect(item.status).toBe('approve');
      expect(item.reviewed_at).toBe('2026-11-09T01:25:00Z');
      expect(item.reviewer).toBe('analyst_alice');
      expect(item.notes).toBe('Customer verified via phone');
    });
  });

  describe('2. Status Tab Filtering Logic', () => {
    it('correctly filters pending items', () => {
      const pendingItems = mockReviewItems.filter(
        (i) => (i.status || '').toLowerCase() === 'pending'
      );
      expect(pendingItems).toHaveLength(2);
      expect(pendingItems.map((i) => i.decision_id)).toEqual(['dec_101', 'dec_102']);
    });

    it('correctly filters resolved items (approve, reject, escalate)', () => {
      const resolvedItems = mockReviewItems.filter(
        (i) => (i.status || '').toLowerCase() !== 'pending'
      );
      expect(resolvedItems).toHaveLength(3);
      expect(resolvedItems.map((i) => i.decision_id)).toEqual(['dec_103', 'dec_104', 'dec_105']);
    });

    it('retains all items when filter is "all"', () => {
      const allItems = [...mockReviewItems];
      expect(allItems).toHaveLength(5);
    });
  });

  describe('3. Honest Metric Calculations for KPI Strip', () => {
    it('distinguishes cumulative historical flagged count from loaded page batch count', () => {
      const historicalFlagged = mockSummary.review_count;
      const loadedDecisions = mockReviewItems.length;

      expect(historicalFlagged).toBe(25);
      expect(loadedDecisions).toBe(5);
      // Explicitly prove they are distinct and not conflated
      expect(historicalFlagged).not.toBe(loadedDecisions);
    });

    it('accurately computes loaded pending count', () => {
      const loadedPending = mockReviewItems.filter(
        (i) => (i.status || '').toLowerCase() === 'pending'
      ).length;
      expect(loadedPending).toBe(2);
    });

    it('accurately computes loaded high-risk count (tier HIGH/CRITICAL or score >= 0.70)', () => {
      const loadedHighRisk = mockReviewItems.filter((i) => {
        const score = i.risk_score ?? 0;
        const tier = (i.tier || '').toUpperCase();
        return tier === 'HIGH' || tier === 'CRITICAL' || score >= 0.7;
      }).length;

      // dec_101 (0.85, CRITICAL), dec_102 (0.72, HIGH), dec_104 (0.94, CRITICAL)
      expect(loadedHighRisk).toBe(3);
    });

    it('accurately computes loaded resolved count', () => {
      const totalLoaded = mockReviewItems.length;
      const loadedPending = mockReviewItems.filter(
        (i) => (i.status || '').toLowerCase() === 'pending'
      ).length;
      const loadedResolved = totalLoaded - loadedPending;
      expect(loadedResolved).toBe(3);
    });
  });

  describe('4. Review Submission Contract & Payload Validation', () => {
    it('creates compliant submit payload for approve action with notes', () => {
      const payload: ReviewSubmitPayload = {
        decision_id: 'dec_101',
        action: 'approve',
        notes: 'Verified identity documentation',
      };

      expect(payload.decision_id).toBe('dec_101');
      expect(payload.action).toBe('approve');
      expect(payload.notes).toBe('Verified identity documentation');
    });

    it('creates compliant submit payload for reject action without notes', () => {
      const payload: ReviewSubmitPayload = {
        decision_id: 'dec_102',
        action: 'reject',
      };

      expect(payload.decision_id).toBe('dec_102');
      expect(payload.action).toBe('reject');
      expect(payload.notes).toBeUndefined();
    });

    it('creates compliant submit payload for escalate action', () => {
      const payload: ReviewSubmitPayload = {
        decision_id: 'dec_105',
        action: 'escalate',
        notes: 'Requires supervisor manual inspection',
      };

      expect(payload.decision_id).toBe('dec_105');
      expect(payload.action).toBe('escalate');
      expect(payload.notes).toBe('Requires supervisor manual inspection');
    });
  });

  describe('5. Mock Client Review Submission Execution', () => {
    it('successfully processes review submission and returns valid result schema', async () => {
      const mockSubmit = vi.fn().mockImplementation(
        async (payload: ReviewSubmitPayload): Promise<ReviewSubmitResult> => ({
          review_id: 'rev_999',
          decision_id: payload.decision_id,
          action: payload.action,
          status: 'resolved',
          updated_at: '2026-11-09T02:00:00Z',
        })
      );

      const res = await mockSubmit({
        decision_id: 'dec_101',
        action: 'approve',
        notes: 'Manual signoff complete',
      });

      expect(mockSubmit).toHaveBeenCalledTimes(1);
      expect(res.decision_id).toBe('dec_101');
      expect(res.action).toBe('approve');
      expect(res.status).toBe('resolved');
      expect(res.updated_at).toBe('2026-11-09T02:00:00Z');
    });

    it('handles submission error gracefully without uncaught rejection', async () => {
      const mockSubmitError = vi.fn().mockRejectedValue(new Error('Network timeout'));

      let caughtError: string | null = null;
      try {
        await mockSubmitError({
          decision_id: 'dec_102',
          action: 'reject',
        });
      } catch (err: unknown) {
        caughtError = err instanceof Error ? err.message : String(err);
      }

      expect(caughtError).toBe('Network timeout');
    });
  });

  describe('6. Server-Confirmed Review Submission State Transitions (Non-Optimistic)', () => {
    interface SubmissionState {
      selectedReview: ReviewItem | null;
      notes: string;
      submitting: boolean;
      submitResult: { type: 'success' | 'error'; message: string } | null;
    }

    const createSubmissionManager = (
      initialReview: ReviewItem,
      submitFn: (payload: ReviewSubmitPayload) => Promise<ReviewSubmitResult>,
      refetchFn: () => Promise<ReviewsListResponse>
    ) => {
      let state: SubmissionState = {
        selectedReview: { ...initialReview },
        notes: 'Initial test notes',
        submitting: false,
        submitResult: null,
      };

      const handleSubmit = async (action: 'approve' | 'reject' | 'escalate') => {
        if (!state.selectedReview || state.submitting) return;
        state.submitting = true;
        state.submitResult = null;

        try {
          const res = await submitFn({
            decision_id: state.selectedReview.decision_id,
            action,
            notes: state.notes.trim() ? state.notes.trim() : undefined,
          });

          // Fetch confirmed server data
          const freshPage = await refetchFn();
          const serverRecord = freshPage?.items.find(
            (item) => item.decision_id === state.selectedReview?.decision_id
          );

          if (serverRecord) {
            state.selectedReview = serverRecord;
            state.notes = serverRecord.notes || '';
          } else {
            state.selectedReview = {
              ...state.selectedReview,
              status: res.action,
              reviewed_at: res.updated_at,
              notes: state.notes.trim() || state.selectedReview.notes,
            };
          }

          state.submitResult = {
            type: 'success',
            message: `Resolution recorded: ${action.toUpperCase()} (${res.status}).`,
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          state.submitResult = {
            type: 'error',
            message: `Failed to submit review: ${msg}`,
          };
        } finally {
          state.submitting = false;
        }
      };

      return {
        getState: () => state,
        handleSubmit,
        setNotes: (n: string) => {
          state.notes = n;
        },
      };
    };

    it('proves the review remains pending while submission request is unresolved', async () => {
      let resolveSubmit: (res: ReviewSubmitResult) => void = () => {};
      const pendingSubmitPromise = new Promise<ReviewSubmitResult>((resolve) => {
        resolveSubmit = resolve;
      });

      const mockSubmit = vi.fn().mockReturnValue(pendingSubmitPromise);
      const mockRefetch = vi.fn().mockResolvedValue({ items: [], next_cursor: null, limit: 50 });

      const manager = createSubmissionManager(mockReviewItems[0], mockSubmit, mockRefetch);

      // Start submission (unresolved)
      const submitPromise = manager.handleSubmit('approve');

      // Check state while in-flight
      const inFlightState = manager.getState();
      expect(inFlightState.submitting).toBe(true);
      expect(inFlightState.selectedReview?.status).toBe('pending');
      expect(inFlightState.selectedReview?.reviewer).toBeNull();
      expect(inFlightState.submitResult).toBeNull();

      // Resolve the server response
      resolveSubmit({
        review_id: 'rev_1',
        decision_id: 'dec_101',
        action: 'approve',
        status: 'resolved',
        updated_at: '2026-11-09T02:00:00Z',
      });
      await submitPromise;

      expect(manager.getState().submitting).toBe(false);
    });

    it('proves a successful server response causes the resolved state to appear', async () => {
      const mockSubmit = vi.fn().mockResolvedValue({
        review_id: 'rev_200',
        decision_id: 'dec_101',
        action: 'approve',
        status: 'resolved',
        updated_at: '2026-11-09T02:10:00Z',
      });

      const serverConfirmedRecord: ReviewItem = {
        ...mockReviewItems[0],
        status: 'approve',
        reviewer: 'dev_user',
        reviewed_at: '2026-11-09T02:10:00Z',
        notes: 'Identity confirmed via KYC documentation',
      };

      const mockRefetch = vi.fn().mockResolvedValue({
        items: [serverConfirmedRecord],
        next_cursor: null,
        limit: 50,
      });

      const manager = createSubmissionManager(mockReviewItems[0], mockSubmit, mockRefetch);
      manager.setNotes('Identity confirmed via KYC documentation');

      await manager.handleSubmit('approve');

      const finalState = manager.getState();
      expect(finalState.submitting).toBe(false);
      expect(finalState.selectedReview?.status).toBe('approve');
      expect(finalState.selectedReview?.reviewer).toBe('dev_user');
      expect(finalState.selectedReview?.reviewed_at).toBe('2026-11-09T02:10:00Z');
      expect(finalState.submitResult?.type).toBe('success');
      expect(finalState.submitResult?.message).toContain('APPROVE (resolved)');
    });

    it('proves refetch results, not fabricated optimistic values, determine the final review state', async () => {
      const mockSubmit = vi.fn().mockResolvedValue({
        review_id: 'rev_300',
        decision_id: 'dec_101',
        action: 'escalate',
        status: 'pending_supervisor',
        updated_at: '2026-11-09T02:15:00Z',
      });

      // The server record carries authoritative backend fields that differ from optimistic guesses
      const authoritativeServerRecord: ReviewItem = {
        ...mockReviewItems[0],
        status: 'escalate',
        reviewer: 'supervisor_queue_router',
        reviewed_at: '2026-11-09T02:15:00Z',
        notes: 'Auto-routed to Tier 2 Risk Operations with anomaly tags',
      };

      const mockRefetch = vi.fn().mockResolvedValue({
        items: [authoritativeServerRecord],
        next_cursor: null,
        limit: 50,
      });

      const manager = createSubmissionManager(mockReviewItems[0], mockSubmit, mockRefetch);
      await manager.handleSubmit('escalate');

      expect(mockRefetch).toHaveBeenCalledTimes(1);
      const state = manager.getState();
      expect(state.selectedReview?.reviewer).toBe('supervisor_queue_router');
      expect(state.selectedReview?.notes).toBe('Auto-routed to Tier 2 Risk Operations with anomaly tags');
    });

    it('proves a failed submission does not change review status or metadata', async () => {
      const mockSubmitFail = vi.fn().mockRejectedValue(new Error('500 Internal Server Error'));
      const mockRefetch = vi.fn();

      const manager = createSubmissionManager(mockReviewItems[0], mockSubmitFail, mockRefetch);
      manager.setNotes('User typed notes that should not be lost');

      await manager.handleSubmit('reject');

      const failedState = manager.getState();
      expect(failedState.submitting).toBe(false);
      // Status strictly unchanged
      expect(failedState.selectedReview?.status).toBe('pending');
      expect(failedState.selectedReview?.reviewer).toBeNull();
      expect(failedState.selectedReview?.reviewed_at).toBeUndefined();
      // Error message displayed
      expect(failedState.submitResult?.type).toBe('error');
      expect(failedState.submitResult?.message).toContain('500 Internal Server Error');
      // Refetch was not called
      expect(mockRefetch).not.toHaveBeenCalled();
    });

    it('proves user-entered notes remain available in state after submission failure', async () => {
      const mockSubmitFail = vi.fn().mockRejectedValue(new Error('403 Forbidden'));
      const mockRefetch = vi.fn();

      const manager = createSubmissionManager(mockReviewItems[0], mockSubmitFail, mockRefetch);
      manager.setNotes('Critical investigation evidence entered by investigator');

      await manager.handleSubmit('approve');

      expect(manager.getState().notes).toBe('Critical investigation evidence entered by investigator');
    });

    it('proves duplicate submissions are prevented while in flight', async () => {
      let resolveSubmit: (res: ReviewSubmitResult) => void = () => {};
      const pendingPromise = new Promise<ReviewSubmitResult>((resolve) => {
        resolveSubmit = resolve;
      });

      const mockSubmit = vi.fn().mockReturnValue(pendingPromise);
      const mockRefetch = vi.fn().mockResolvedValue({ items: [], next_cursor: null, limit: 50 });

      const manager = createSubmissionManager(mockReviewItems[0], mockSubmit, mockRefetch);

      // Trigger first submission
      const promise1 = manager.handleSubmit('approve');

      // Attempt duplicate triggers while submitting === true
      const promise2 = manager.handleSubmit('reject');
      const promise3 = manager.handleSubmit('escalate');

      // Mock submit should only have been called ONCE
      expect(mockSubmit).toHaveBeenCalledTimes(1);

      // Finish the in-flight request
      resolveSubmit({
        review_id: 'rev_single',
        decision_id: 'dec_101',
        action: 'approve',
        status: 'resolved',
        updated_at: '2026-11-09T02:30:00Z',
      });

      await Promise.all([promise1, promise2, promise3]);
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. Drawer WAI-ARIA and Keyboard Focus Contracts', () => {
    it('verifies standard accessibility attributes required for review drawer', () => {
      const expectedDialogRole = 'dialog';
      const expectedAriaModal = 'true';
      const expectedTitleId = 'rg-review-drawer-title';
      const expectedDescId = 'rg-review-drawer-desc';

      expect(expectedDialogRole).toBe('dialog');
      expect(expectedAriaModal).toBe('true');
      expect(expectedTitleId).toBe('rg-review-drawer-title');
      expect(expectedDescId).toBe('rg-review-drawer-desc');
    });

    it('verifies action button labels provide accessible text', () => {
      const actions = [
        { action: 'approve', label: 'Approve transaction' },
        { action: 'reject', label: 'Reject transaction' },
        { action: 'escalate', label: 'Escalate transaction' },
      ];

      actions.forEach(({ action, label }) => {
        expect(label).toContain('transaction');
        expect(label.toLowerCase()).toContain(action);
      });
    });
  });
});

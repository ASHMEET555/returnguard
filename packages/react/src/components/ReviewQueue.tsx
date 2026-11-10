import React, { useState } from 'react';
import { useReviewQueue } from '../hooks';
import { RiskBadge } from './RiskBadge';
import { RefreshIcon, CheckCircleIcon } from './icons';

export interface ReviewItem {
  id?: string;
  decision_id: string;
  order_id?: string;
  channel?: string;
  risk_score: number;
  tier?: string;
  policy_action?: string;
  status?: string;
  rule_hits?: string[];
  created_at?: string;
  notes?: string;
  amount?: number;
  customer_id?: string;
}

export interface ReviewQueueProps {
  items?: ReviewItem[];
  loading?: boolean;
  onApprove?: (decisionId: string, notes?: string) => Promise<void> | void;
  onReject?: (decisionId: string, notes?: string) => Promise<void> | void;
  onSelectDecision?: (decisionId: string) => void;
  onRefresh?: () => void;
  title?: string;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  items: propItems,
  loading: propLoading,
  onApprove: propApprove,
  onReject: propReject,
  onSelectDecision,
  onRefresh: propRefresh,
  title = 'Payment Authorization & Review Queue',
}) => {
  const queueHook = useReviewQueue();
  const reviews = propItems ?? (queueHook.reviews as ReviewItem[]);
  const loading = propLoading ?? (propItems ? false : queueHook.loading);
  const handleRefresh = propRefresh ?? queueHook.refetch;

  const [activeItem, setActiveItem] = useState<ReviewItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenAction = (item: ReviewItem, type: 'APPROVE' | 'REJECT') => {
    setActiveItem(item);
    setActionType(type);
    setReviewNotes('');
    setNotification(null);
  };

  const handleCloseModal = () => {
    setActiveItem(null);
    setActionType(null);
    setReviewNotes('');
  };

  const handleExecuteAction = async () => {
    if (!activeItem || !actionType) return;
    setSubmitting(true);
    try {
      if (actionType === 'APPROVE') {
        if (propApprove) {
          await propApprove(activeItem.decision_id, reviewNotes);
        } else {
          await queueHook.approve(activeItem.decision_id, reviewNotes);
        }
      } else {
        if (propReject) {
          await propReject(activeItem.decision_id, reviewNotes);
        } else {
          await queueHook.reject(activeItem.decision_id, reviewNotes);
        }
      }
      setNotification({
        type: 'success',
        message: `Decision for ${activeItem.order_id || activeItem.decision_id} successfully ${
          actionType === 'APPROVE' ? 'APPROVED (Payment Captured)' : 'REJECTED (Authorization Voided)'
        }.`,
      });
      handleCloseModal();
      if (handleRefresh) await handleRefresh();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit review decision',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rg-card" style={{ padding: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--rg-text-primary)' }}>
              {title}
            </h4>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 12,
                background: 'var(--rg-bg-tertiary)',
                color: 'var(--rg-text-secondary)',
              }}
            >
              {reviews.length} pending
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--rg-text-secondary)' }}>
            Transactions held by risk policies awaiting merchant authorization decisions.
          </p>
        </div>

        {handleRefresh && (
          <button
            type="button"
            className="rg-btn rg-btn-secondary"
            onClick={handleRefresh}
            style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Refresh review queue"
          >
            <RefreshIcon size={12} />
            <span>Sync Queue</span>
          </button>
        )}
      </div>

      {notification && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            marginBottom: 14,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: notification.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--rg-text-muted)' }}>
          Loading review queue...
        </div>
      ) : reviews.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'var(--rg-bg-secondary)',
            borderRadius: 8,
            border: '1px dashed var(--rg-border-primary)',
          }}
        >
          <div style={{ color: '#10b981', marginBottom: 8 }}>
            <CheckCircleIcon size={32} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rg-text-primary)' }}>
            Review Queue Clear
          </div>
          <div style={{ fontSize: 12, color: 'var(--rg-text-secondary)', marginTop: 4 }}>
            All incoming payment transactions have been evaluated and cleared.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--rg-border-primary)',
                  color: 'var(--rg-text-secondary)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '10px 12px' }}>Order Reference</th>
                <th style={{ padding: '10px 12px' }}>Risk Score</th>
                <th style={{ padding: '10px 12px' }}>Policy Hold Trigger</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((item) => {
                const ruleHits = item.rule_hits || [];
                return (
                  <tr
                    key={item.decision_id || item.id}
                    style={{
                      borderBottom: '1px solid var(--rg-border-primary)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'var(--rg-text-primary)',
                          cursor: onSelectDecision ? 'pointer' : 'default',
                        }}
                        onClick={() => onSelectDecision && onSelectDecision(item.decision_id)}
                      >
                        {item.order_id || item.decision_id}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>
                        Channel: {item.channel || 'paypal'}
                      </div>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <RiskBadge score={item.risk_score} tier={item.tier} />
                    </td>

                    <td style={{ padding: '12px' }}>
                      {ruleHits.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {ruleHits.map((rule, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'rgba(245, 158, 11, 0.12)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {rule}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--rg-text-muted)', fontSize: 12 }}>
                          {item.policy_action || 'AUTH_HOLD_PENDING_REVIEW'}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b',
                        }}
                      >
                        HELD_FOR_REVIEW
                      </span>
                    </td>

                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="rg-btn"
                          onClick={() => handleOpenAction(item, 'APPROVE')}
                          style={{
                            fontSize: 12,
                            padding: '4px 10px',
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rg-btn"
                          onClick={() => handleOpenAction(item, 'REJECT')}
                          style={{
                            fontSize: 12,
                            padding: '4px 10px',
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {activeItem && actionType && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleCloseModal}
        >
          <div
            className="rg-card"
            style={{
              width: '90%',
              maxWidth: 480,
              padding: 24,
              background: 'var(--rg-bg-primary, #0f172a)',
              borderRadius: 8,
              border: '1px solid var(--rg-border-primary, #334155)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: 0, fontSize: 17, color: 'var(--rg-text-primary)' }}>
              Confirm {actionType === 'APPROVE' ? 'Approval & Payment Capture' : 'Rejection & Payment Void'}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--rg-text-secondary)', marginTop: 8 }}>
              {actionType === 'APPROVE'
                ? `Approving will release the authorization hold on Order ${activeItem.order_id || activeItem.decision_id} and execute PayPal payment capture.`
                : `Rejecting will void the PayPal authorization hold on Order ${activeItem.order_id || activeItem.decision_id} and mark the order cancelled.`}
            </p>

            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--rg-text-secondary)', display: 'block' }}>
                Review Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add audit reason for merchant record..."
                rows={3}
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: 8,
                  fontSize: 13,
                  borderRadius: 6,
                  border: '1px solid var(--rg-border-primary)',
                  background: 'var(--rg-bg-secondary)',
                  color: 'var(--rg-text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="rg-btn rg-btn-secondary"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rg-btn"
                onClick={handleExecuteAction}
                disabled={submitting}
                style={{
                  background: actionType === 'APPROVE' ? '#10b981' : '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Processing...' : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

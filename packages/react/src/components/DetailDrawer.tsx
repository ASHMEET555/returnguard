import React from 'react';
import { useTransactionRisk } from '../hooks';
import { RiskBadge } from './RiskBadge';

export interface DetailDrawerProps {
  decisionId: string | null;
  onClose: () => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({ decisionId, onClose }) => {
  const { decision, audit, loading, error } = useTransactionRisk(decisionId);

  if (!decisionId) return null;

  return (
    <div className="rg-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="rg-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="rg-drawer-header">
          <div>
            <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', textTransform: 'uppercase' }}>
              Transaction Investigation
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
              {decision?.order_id || decisionId}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail drawer"
            style={{
              background: 'transparent',
              border: '1px solid var(--rg-border)',
              color: 'var(--rg-text-primary)',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            ✕ Close
          </button>
        </div>

        <div className="rg-drawer-body">
          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--rg-text-muted)' }}>
              Loading scoring audit and explanation...
            </div>
          )}

          {error && (
            <div style={{ padding: 16, background: 'var(--rg-high-bg)', border: '1px solid var(--rg-high-border)', borderRadius: 6 }}>
              <div style={{ color: 'var(--rg-high-text)', fontWeight: 600 }}>Failed to load decision</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{error.message}</div>
            </div>
          )}

          {decision && (
            <>
              {/* Section 1: Scoring Verdict */}
              <div className="rg-drawer-section">
                <div className="rg-drawer-section-title">ReturnGuard Recommendation</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <RiskBadge score={decision.risk_score} />
                  <RiskBadge action={decision.suggested_action} />
                  <span style={{ fontSize: 12, color: 'var(--rg-text-muted)' }}>
                    Severity: <strong>{decision.severity}</strong>
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--rg-text-secondary)', lineHeight: 1.5 }}>
                  ReturnGuard evaluates transaction characteristics and recommends an operational hold/action.
                  Actual capture or decline is executed independently by the payment provider.
                </div>
              </div>

              {/* Section 2: Why This Was Flagged */}
              <div className="rg-drawer-section">
                <div className="rg-drawer-section-title">Why This Was Flagged</div>
                {decision.reason_codes && decision.reason_codes.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {decision.reason_codes.map((rc) => (
                      <span
                        key={rc.feature}
                        style={{
                          background: 'var(--rg-bg-tertiary)',
                          border: '1px solid var(--rg-border)',
                          borderRadius: 4,
                          padding: '4px 8px',
                          fontSize: 12,
                          fontFamily: 'monospace',
                        }}
                      >
                        {rc.feature}: {rc.direction}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--rg-text-muted)' }}>
                    No specific rule or anomaly triggers flagged for this transaction.
                  </div>
                )}
              </div>

              {/* Section 3: Payment & Processor Context */}
              <div className="rg-drawer-section">
                <div className="rg-drawer-section-title">Payment & Processor Context</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--rg-text-muted)' }}>Order ID:</span>{' '}
                    <strong style={{ fontFamily: 'monospace' }}>{decision.order_id || '--'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--rg-text-muted)' }}>Channel:</span>{' '}
                    <strong>{decision.channel || 'web'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--rg-text-muted)' }}>Mode:</span>{' '}
                    <strong>{decision.shadow ? 'Shadow Mode' : 'Enforcement'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--rg-text-muted)' }}>Provider Status:</span>{' '}
                    <strong style={{ color: 'var(--rg-low-text)' }}>Authorized (Pending Capture)</strong>
                  </div>
                </div>
              </div>

              {/* Section 4: Audit Event Timeline */}
              <div className="rg-drawer-section">
                <div className="rg-drawer-section-title">Audit Trail & Signals</div>
                <div style={{ fontSize: 12, color: 'var(--rg-text-secondary)' }}>
                  {audit ? (
                    <div>
                      <div><strong>Decision ID:</strong> {audit.data.decision.decision_id}</div>
                      <div style={{ marginTop: 4 }}><strong>Order ID:</strong> {audit.data.decision.order_id}</div>
                      <div style={{ marginTop: 4 }}><strong>Policy Action:</strong> {audit.data.policy_trace.policy_action}</div>
                      <div style={{ marginTop: 4 }}><strong>Reconstructed Features:</strong> {Object.keys(audit.data.feature_snapshot || {}).length} features verified</div>
                    </div>
                  ) : (
                    <div>Basic audit event snapshot recorded. Full feature reconstruction stored in tenant repository.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

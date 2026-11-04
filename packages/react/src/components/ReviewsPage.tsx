import React from 'react';
import { useReviews } from '../hooks';
import { RiskBadge } from './RiskBadge';

export const ReviewsPage: React.FC = () => {
  const { items, loading, error, refetch } = useReviews(50);

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>Alerts, Manual Reviews & Activity</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
            Operational queues for high-risk and flagged payments requiring human evaluation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          style={{ background: 'var(--rg-bg-card)', color: 'var(--rg-text-primary)', border: '1px solid var(--rg-border)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}
        >
          ↻ Refresh Queue
        </button>
      </div>

      {loading && <div style={{ color: 'var(--rg-text-muted)' }}>Loading review queue...</div>}
      {error && <div style={{ color: 'var(--rg-high-text)' }}>Failed to load review items: {error.message}</div>}

      <div className="rg-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--rg-bg-tertiary)', borderBottom: '1px solid var(--rg-border)', color: 'var(--rg-text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>Decision ID / Order</th>
              <th style={{ padding: '12px 16px' }}>Risk Score</th>
              <th style={{ padding: '12px 16px' }}>Recommended Action</th>
              <th style={{ padding: '12px 16px' }}>Review Status</th>
              <th style={{ padding: '12px 16px' }}>Queued At</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--rg-text-muted)' }}>
                  No manual reviews currently pending. All flagged transactions cleared.
                </td>
              </tr>
            ) : (
              items.map((rev) => (
                <tr key={rev.decision_id} style={{ borderBottom: '1px solid var(--rg-border-subtle)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{rev.order_id}</div>
                    <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{rev.decision_id}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><RiskBadge score={rev.risk_score} /></td>
                  <td style={{ padding: '12px 16px' }}><RiskBadge action={rev.suggested_action} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: rev.status === 'pending' ? 'var(--rg-med-text)' : 'var(--rg-low-text)' }}>
                      ● {rev.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--rg-text-muted)' }}>
                    {new Date(rev.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'var(--rg-bg-card)', border: '1px solid var(--rg-border)', borderRadius: 6, fontSize: 12, color: 'var(--rg-text-muted)' }}>
        🛡️ Formal dispute evidence packs, AI investigation narratives, and case assignments belong to Phase I.
      </div>
    </div>
  );
};

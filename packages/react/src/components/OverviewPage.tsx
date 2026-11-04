import React from 'react';
import { useRiskSummary } from '../hooks';
import { RiskBadge } from './RiskBadge';

export const OverviewPage: React.FC = () => {
  const { data, loading, error, refetch } = useRiskSummary();

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--rg-text-muted)' }}>
        Loading risk operations summary...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, background: 'var(--rg-high-bg)', border: '1px solid var(--rg-high-border)', borderRadius: 8 }}>
        <h4 style={{ margin: '0 0 8px 0', color: 'var(--rg-high-text)' }}>Failed to load risk summary</h4>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          style={{
            marginTop: 12,
            padding: '6px 12px',
            background: 'var(--rg-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = data ?? {
    tenant_id: 'default',
    total_decisions: 0,
    allow_count: 0,
    review_count: 0,
    block_count: 0,
    average_risk_score: 0,
    total_volume_inr: 0,
    high_risk_volume_inr: 0,
    tier_distribution: {},
  };

  const flaggedCount = (summary.review_count || 0) + (summary.block_count || 0);
  const flaggedPct = summary.total_decisions > 0
    ? ((flaggedCount / summary.total_decisions) * 100).toFixed(1)
    : '0.0';

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>Risk Operations Overview</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
          Portfolio risk posture, policy distributions, and live transaction indicators.
        </p>
      </div>

      <div className="rg-kpi-grid">
        <div className="rg-card">
          <div className="rg-card-title">
            <span>Transactions Scored</span>
            <span>💳</span>
          </div>
          <div className="rg-card-value">{summary.total_decisions.toLocaleString()}</div>
          <div className="rg-card-subtitle">Lifetime scored payments</div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">
            <span>Flagged Transactions</span>
            <span>⚠️</span>
          </div>
          <div className="rg-card-value">{flaggedCount.toLocaleString()}</div>
          <div className="rg-card-subtitle">{flaggedPct}% flag rate</div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">
            <span>High Risk / Block Action</span>
            <span>🚨</span>
          </div>
          <div className="rg-card-value">{summary.block_count.toLocaleString()}</div>
          <div className="rg-card-subtitle">Recommended hold/stop</div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">
            <span>Average Risk Score</span>
            <span>📈</span>
          </div>
          <div className="rg-card-value">{(summary.average_risk_score * 100).toFixed(0)}</div>
          <div className="rg-card-subtitle">Portfolio scale (0 - 100)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <div className="rg-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600 }}>Policy Action Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <RiskBadge action="ALLOW" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{summary.allow_count.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <RiskBadge action="REVIEW" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{summary.review_count.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <RiskBadge action="BLOCK" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{summary.block_count.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="rg-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600 }}>Scoring System Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--rg-text-secondary)' }}>Engine Status</span>
              <span style={{ color: 'var(--rg-low-text)', fontWeight: 600 }}>● Operational</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--rg-text-secondary)' }}>Shadow Mode</span>
              <span style={{ fontWeight: 600 }}>Active (Default)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--rg-text-secondary)' }}>Serving Model</span>
              <span style={{ fontFamily: 'monospace' }}>candidate_lgbm_v1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

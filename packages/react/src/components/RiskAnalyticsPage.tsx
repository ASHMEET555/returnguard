import React from 'react';
import { useRiskTrends } from '../hooks';

export const RiskAnalyticsPage: React.FC = () => {
  const { data, loading, error, refetch } = useRiskTrends();

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--rg-text-muted)' }}>Loading risk analytics & trends...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 16, background: 'var(--rg-high-bg)', border: '1px solid var(--rg-high-border)', borderRadius: 6 }}>
        <div style={{ color: 'var(--rg-high-text)', fontWeight: 600 }}>Failed to load risk analytics</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>{error.message}</div>
        <button type="button" onClick={() => refetch()} style={{ marginTop: 10, padding: '4px 10px', background: 'var(--rg-accent)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  const trends = data?.daily_trends || [];
  const scoreDist = data?.score_distribution || { low_0_15: 0, med_15_40: 0, high_40_80: 0, crit_80_100: 0 };
  const channels = data?.channel_breakdown || { paypal: 0, cod: 0, other: 0 };
  const disputes = data?.dispute_analytics || { total_disputes: 0, disputed_amount: 0, currency: 'INR', dispute_rate_pct: 0 };

  const totalScores = scoreDist.low_0_15 + scoreDist.med_15_40 + scoreDist.high_40_80 + scoreDist.crit_80_100;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>Risk Analytics & Portfolio Exposure</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
          Portfolio risk score distributions, channel breakdown, and time-series scoring volumes.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="rg-kpi-grid">
        <div className="rg-card">
          <div className="rg-card-title"><span>Low Risk (&lt; 0.15)</span><span>🟢</span></div>
          <div className="rg-card-value">{scoreDist.low_0_15.toLocaleString()}</div>
          <div className="rg-card-subtitle">{totalScores ? ((scoreDist.low_0_15 / totalScores) * 100).toFixed(1) : 0}% of portfolio</div>
        </div>
        <div className="rg-card">
          <div className="rg-card-title"><span>Medium Risk (0.15 - 0.40)</span><span>🟡</span></div>
          <div className="rg-card-value">{scoreDist.med_15_40.toLocaleString()}</div>
          <div className="rg-card-subtitle">{totalScores ? ((scoreDist.med_15_40 / totalScores) * 100).toFixed(1) : 0}% of portfolio</div>
        </div>
        <div className="rg-card">
          <div className="rg-card-title"><span>High Risk (0.40 - 0.80)</span><span>🟠</span></div>
          <div className="rg-card-value">{scoreDist.high_40_80.toLocaleString()}</div>
          <div className="rg-card-subtitle">{totalScores ? ((scoreDist.high_40_80 / totalScores) * 100).toFixed(1) : 0}% of portfolio</div>
        </div>
        <div className="rg-card">
          <div className="rg-card-title"><span>Critical Risk (&gt; 0.80)</span><span>🔴</span></div>
          <div className="rg-card-value">{scoreDist.crit_80_100.toLocaleString()}</div>
          <div className="rg-card-subtitle">{totalScores ? ((scoreDist.crit_80_100 / totalScores) * 100).toFixed(1) : 0}% of portfolio</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {/* Risk Score Distribution Histogram */}
        <div className="rg-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600 }}>Risk Score Band Histogram</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: '0.00 - 0.15 (ALLOW)', count: scoreDist.low_0_15, color: 'var(--rg-low-text)' },
              { label: '0.15 - 0.40 (MONITOR)', count: scoreDist.med_15_40, color: 'var(--rg-med-text)' },
              { label: '0.40 - 0.80 (REVIEW)', count: scoreDist.high_40_80, color: 'var(--rg-high-text)' },
              { label: '0.80 - 1.00 (BLOCK)', count: scoreDist.crit_80_100, color: 'var(--rg-crit-text)' },
            ].map((band) => {
              const pct = totalScores > 0 ? (band.count / totalScores) * 100 : 0;
              return (
                <div key={band.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{band.label}</span>
                    <strong>{band.count} ({pct.toFixed(1)}%)</strong>
                  </div>
                  <div style={{ height: 8, background: 'var(--rg-bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: band.color, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="rg-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600 }}>Payment Channel Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>PayPal Orders</span>
              <strong style={{ fontSize: 14 }}>{channels.paypal.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Cash on Delivery (COD)</span>
              <strong style={{ fontSize: 14 }}>{channels.cod.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Other Integrations</span>
              <strong style={{ fontSize: 14 }}>{channels.other.toLocaleString()}</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--rg-border-subtle)', paddingTop: 10, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--rg-text-muted)' }}>
                <span>Total Recorded Disputes</span>
                <span>{disputes.total_disputes} ({disputes.dispute_rate_pct}% dispute rate)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Volume Trends Table */}
      <div className="rg-card" style={{ marginTop: 16 }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600 }}>Daily Transaction & Flagging Trends</h3>
        {trends.length === 0 ? (
          <div style={{ color: 'var(--rg-text-muted)', fontSize: 13 }}>No daily scoring events recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--rg-border)', color: 'var(--rg-text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Date</th>
                  <th style={{ padding: '8px 12px' }}>Total Scored</th>
                  <th style={{ padding: '8px 12px' }}>Flagged</th>
                  <th style={{ padding: '8px 12px' }}>Blocked</th>
                  <th style={{ padding: '8px 12px' }}>Flag Rate</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((t) => (
                  <tr key={t.date} style={{ borderBottom: '1px solid var(--rg-border-subtle)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{t.date}</td>
                    <td style={{ padding: '8px 12px' }}>{t.total_scored}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--rg-med-text)' }}>{t.flagged}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--rg-high-text)' }}>{t.blocked}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {t.total_scored > 0 ? ((t.flagged / t.total_scored) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

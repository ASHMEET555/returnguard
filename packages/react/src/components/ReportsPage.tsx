import React from 'react';
import { useRiskSummary, useRiskDecisions } from '../hooks';

export const ReportsPage: React.FC = () => {
  const { data: summary } = useRiskSummary();
  const { items: decisions } = useRiskDecisions(50);

  const exportCSV = () => {
    if (!decisions.length) return;
    const headers = ['Order ID', 'Channel', 'Risk Score', 'Suggested Action', 'Tier', 'Severity', 'Created At'];
    const rows = decisions.map((d) => [
      d.order_id,
      d.channel,
      d.risk_score,
      d.suggested_action,
      d.tier,
      d.severity,
      d.model_version,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `returnguard_risk_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>Operational Reports & Audit Exports</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
            Exportable CSV datasets, compliance audit snapshots, and risk summary reports.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          style={{ background: 'var(--rg-accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          📥 Export Decisions CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div className="rg-card">
          <h3 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 600 }}>Decisions Audit Dataset</h3>
          <p style={{ fontSize: 13, color: 'var(--rg-text-secondary)', lineHeight: 1.5 }}>
            Export the currently loaded {decisions.length} scored decisions with policy recommendations, risk tiers, and channel metadata.
          </p>
          <div style={{ fontSize: 12, color: 'var(--rg-text-muted)', marginTop: 12 }}>
            Format: RFC-4180 CSV | PII-safe
          </div>
        </div>

        <div className="rg-card">
          <h3 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 600 }}>Tenant Risk Position Summary</h3>
          <p style={{ fontSize: 13, color: 'var(--rg-text-secondary)', lineHeight: 1.5 }}>
            Summary of lifetime scored volume: {summary?.total_decisions || 0} total evaluated decisions, {summary?.block_count || 0} critical blocks recommended.
          </p>
          <div style={{ fontSize: 12, color: 'var(--rg-text-muted)', marginTop: 12 }}>
            Scope: Tenant-Isolated (`{summary?.tenant_id || 'active'}`)
          </div>
        </div>
      </div>
    </div>
  );
};

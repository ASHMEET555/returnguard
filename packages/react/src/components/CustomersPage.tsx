import React from 'react';
import { useRiskDecisions } from '../hooks';
import { RiskBadge } from './RiskBadge';

export const CustomersPage: React.FC = () => {
  const { items, loading, error } = useRiskDecisions(100);

  // Group scored decisions by customer/order reference
  const customerMap = React.useMemo(() => {
    const map = new Map<string, { count: number; maxScore: number; channel: string }>();
    for (const item of items) {
      const custId = item.order_id ? `cust_${item.order_id.slice(-6)}` : `cust_anon_${(item.decision_id || '000000').slice(0, 6)}`;
      const existing = map.get(custId) || { count: 0, maxScore: 0, channel: item.channel || 'web' };
      existing.count += 1;
      existing.maxScore = Math.max(existing.maxScore, item.risk_score || 0);
      map.set(custId, existing);
    }
    return Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats }));
  }, [items]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Customer Directory (Partial In-Memory Sample)</h2>
          <span style={{ fontSize: 11, background: 'var(--rg-med-bg)', color: 'var(--rg-med-text)', border: '1px solid var(--rg-med-border)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
            PARTIAL VIEW
          </span>
        </div>
        <p style={{ margin: '6px 0 0 0', fontSize: 13, color: 'var(--rg-text-secondary)' }}>
          Sample derived exclusively from the last 100 loaded decisions in this session. This is <strong>not</strong> a complete or lifetime customer history. Dedicated backend customer entities are planned for Phase G Milestone 2 / Phase I.
        </p>
      </div>

      {loading && <div style={{ color: 'var(--rg-text-muted)' }}>Loading customers...</div>}
      {error && <div style={{ color: 'var(--rg-high-text)' }}>Failed to load customers: {error.message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {customerMap.map((cust) => (
          <div key={cust.id} className="rg-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{cust.id}</span>
              <RiskBadge score={cust.maxScore} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--rg-text-muted)' }}>
              Scored in Loaded Page: <strong>{cust.count}</strong>
            </div>
            <div style={{ fontSize: 12, color: 'var(--rg-text-muted)' }}>
              Channel: <strong>{cust.channel}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

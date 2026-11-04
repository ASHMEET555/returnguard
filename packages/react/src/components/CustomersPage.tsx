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
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>Customer Directory (Foundation)</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
          Scoped customer risk entities derived from scored transactions and order references.
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
              Scored Transactions: <strong>{cust.count}</strong>
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

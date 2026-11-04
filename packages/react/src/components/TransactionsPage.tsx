import React, { useState } from 'react';
import { useRiskDecisions } from '../hooks';
import { TransactionsGrid } from './TransactionsGrid';
import { DetailDrawer } from './DetailDrawer';

export const TransactionsPage: React.FC = () => {
  const { items, loading, error, hasMore, nextPage, refetch } = useRiskDecisions(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>Transaction Risk Explorer</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
            Search, filter, and inspect scored payments and policy actions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'var(--rg-bg-card)',
              color: 'var(--rg-text-primary)',
              border: '1px solid var(--rg-border)',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 13,
              width: 220,
            }}
          />
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              background: 'var(--rg-bg-card)',
              color: 'var(--rg-text-primary)',
              border: '1px solid var(--rg-border)',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: 'var(--rg-high-bg)', border: '1px solid var(--rg-high-border)', borderRadius: 6 }}>
          <span style={{ color: 'var(--rg-high-text)', fontSize: 13 }}>Failed to load transactions: {error.message}</span>
        </div>
      )}

      <TransactionsGrid
        items={items}
        loading={loading}
        quickFilterText={searchTerm}
        onRowClick={(id) => setSelectedId(id)}
      />

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--rg-text-muted)' }}>
          Showing {items.length} records in current page
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={nextPage}
            disabled={loading}
            style={{
              background: 'var(--rg-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Load Next Page →
          </button>
        )}
      </div>

      <DetailDrawer decisionId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
};

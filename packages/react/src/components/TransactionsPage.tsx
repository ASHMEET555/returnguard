import React, { useState } from 'react';
import { useRiskDecisions } from '../hooks';
import { TransactionsGrid } from './TransactionsGrid';
import { DetailDrawer } from './DetailDrawer';
import { RefreshIcon, SearchIcon, ChevronRightIcon } from './icons';

export const TransactionsPage: React.FC = () => {
  const { items, loading, error, hasMore, nextPage, refetch } = useRiskDecisions(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Transaction Risk Explorer
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
            Search, filter, and inspect scored payments and policy actions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="rg-search-input-wrap">
            <SearchIcon size={14} aria-hidden="true" className="rg-search-icon" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rg-search-input"
              aria-label="Search transactions"
            />
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="rg-btn-secondary"
            aria-label="Refresh transactions"
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', fontSize: 13 }}
          >
            <RefreshIcon size={14} aria-hidden="true" className={loading ? 'rg-spin' : ''} />
            <span>Refresh</span>
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
            className="rg-btn-primary"
            aria-label="Load next page"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', fontSize: 13 }}
          >
            <span>Load Next Page</span>
            <ChevronRightIcon size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      <DetailDrawer decisionId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
};

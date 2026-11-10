import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, RowClickedEvent } from 'ag-grid-community';
import type { ScoreResult } from '@returnguard/sdk';
import { RiskBadge } from './RiskBadge';
import { useReturnGuard } from '../context';

export interface TransactionsGridProps {
  items: ScoreResult[];
  loading?: boolean;
  onRowClick?: (id: string) => void;
  quickFilterText?: string;
}

export const TransactionsGrid: React.FC<TransactionsGridProps> = ({
  items,
  loading = false,
  onRowClick,
  quickFilterText = '',
}) => {
  const { theme } = useReturnGuard();
  const gridThemeClass = theme === 'light' ? 'ag-theme-alpine' : 'ag-theme-alpine-dark';

  const columnDefs = useMemo<ColDef<ScoreResult>[]>(
    () => [
      {
        field: 'order_id',
        headerName: 'Order ID',
        minWidth: 190,
        flex: 1.3,
        pinned: 'left',
        cellRenderer: (params: { value: string }) => (
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--rg-text-primary)' }}>
            {params.value || '--'}
          </span>
        ),
      },
      {
        field: 'channel',
        headerName: 'Channel',
        minWidth: 100,
        flex: 0.8,
        cellRenderer: (params: { value: string }) => (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: 4,
              background: 'var(--rg-bg-tertiary)',
              color: 'var(--rg-text-secondary)',
            }}
          >
            {params.value || 'web'}
          </span>
        ),
      },
      {
        field: 'risk_score',
        headerName: 'Risk Score',
        minWidth: 130,
        flex: 1,
        cellRenderer: (params: { value: number }) => <RiskBadge score={params.value} />,
        sort: 'desc',
      },
      {
        field: 'suggested_action',
        headerName: 'Policy Action',
        minWidth: 160,
        flex: 1.2,
        cellRenderer: (params: { value: string }) => <RiskBadge action={params.value} />,
      },
      {
        field: 'severity',
        headerName: 'Severity',
        minWidth: 110,
        flex: 0.9,
        cellRenderer: (params: { value: string }) => <RiskBadge severity={params.value} />,
      },
      {
        headerName: 'Payment Status',
        minWidth: 180,
        flex: 1.3,
        valueGetter: () => 'Not Integrated (Provider Owned)',
        cellRenderer: () => (
          <span style={{ fontSize: 12, color: 'var(--rg-text-muted)', fontStyle: 'italic' }}>
            Provider Owned (ShopPoint)
          </span>
        ),
      },
      {
        field: 'model_version',
        headerName: 'Model',
        minWidth: 140,
        flex: 1,
        cellRenderer: (params: { value: string }) => (
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--rg-text-muted)' }}>
            {params.value || 'candidate_lgbm_v1'}
          </span>
        ),
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
    }),
    []
  );

  const handleRowClicked = (event: RowClickedEvent<ScoreResult>) => {
    const id = event.data?.decision_id || event.data?.order_id;
    if (id && onRowClick) {
      onRowClick(id);
    }
  };

  return (
    <div
      className={`rg-transactions-grid-wrap ${gridThemeClass}`}
      style={{
        height: 'calc(100vh - 240px)',
        minHeight: 520,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid var(--rg-border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <AgGridReact<ScoreResult>
        theme="legacy"
        rowData={items}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        loading={loading}
        quickFilterText={quickFilterText}
        rowSelection={{
          mode: 'singleRow',
          checkboxes: false,
          enableClickSelection: true,
        }}
        rowHeight={44}
        headerHeight={40}
        animateRows={true}
        onRowClicked={handleRowClicked}
      />
    </div>
  );
};

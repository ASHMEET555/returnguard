import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, RowClickedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import type { ScoreResult } from '@returnguard/sdk';
import { RiskBadge } from './RiskBadge';

// Register standard community modules for AG Grid v33+
ModuleRegistry.registerModules([AllCommunityModule]);

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
  const columnDefs = useMemo<ColDef<ScoreResult>[]>(
    () => [
      {
        field: 'order_id',
        headerName: 'Order ID',
        minWidth: 160,
        pinned: 'left',
        cellRenderer: (params: { value: string }) => (
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{params.value || '--'}</span>
        ),
      },
      {
        field: 'channel',
        headerName: 'Channel',
        width: 110,
      },
      {
        field: 'risk_score',
        headerName: 'Risk Score',
        width: 140,
        cellRenderer: (params: { value: number }) => <RiskBadge score={params.value} />,
        sort: 'desc',
      },
      {
        field: 'suggested_action',
        headerName: 'ReturnGuard Policy',
        width: 180,
        cellRenderer: (params: { value: string }) => <RiskBadge action={params.value} />,
      },
      {
        field: 'tier',
        headerName: 'Tier',
        width: 110,
        cellRenderer: (params: { value: string }) => <RiskBadge severity={params.value} />,
      },
      {
        field: 'severity',
        headerName: 'Severity',
        width: 110,
        cellRenderer: (params: { value: string }) => <RiskBadge severity={params.value} />,
      },
      {
        headerName: 'Payment Status',
        width: 150,
        valueGetter: () => 'Not Integrated (Provider Owned)',
        cellRenderer: () => (
          <span style={{ fontSize: 12, color: 'var(--rg-text-muted)', fontStyle: 'italic' }}>
            Provider Owned (ShopPoint)
          </span>
        ),
      },
      {
        field: 'model_version',
        headerName: 'Model Version',
        minWidth: 150,
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
      className="ag-theme-alpine-dark"
      style={{
        height: 520,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid var(--rg-border)',
      }}
    >
      <AgGridReact<ScoreResult>
        rowData={items}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        loading={loading}
        quickFilterText={quickFilterText}
        rowSelection={{ mode: 'singleRow' }}
        onRowClicked={handleRowClicked}
      />
    </div>
  );
};

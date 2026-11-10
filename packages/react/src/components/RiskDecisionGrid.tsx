import React, { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, RowClickedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import type { ScoreResult } from '@returnguard/sdk';
import { RiskBadge } from './RiskBadge';
import { useReturnGuard } from '../context';
import { useRiskDecisions } from '../hooks';
import { SearchIcon, RefreshIcon } from './icons';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface RiskDecisionGridProps {
  items?: ScoreResult[];
  loading?: boolean;
  columns?: ColDef<ScoreResult>[];
  pageSize?: number;
  height?: string | number;
  quickFilter?: boolean;
  onRowClick?: (id: string, decision: ScoreResult) => void;
  onRefresh?: () => void;
  title?: string;
}

export const RiskDecisionGrid: React.FC<RiskDecisionGridProps> = ({
  items: propItems,
  loading: propLoading,
  columns: customColumns,
  pageSize = 25,
  height = 460,
  quickFilter = true,
  onRowClick,
  onRefresh: propRefresh,
  title = 'Risk Decisions',
}) => {
  const { theme } = useReturnGuard();
  const [filterText, setFilterText] = useState('');
  const decisionsHook = useRiskDecisions(pageSize);

  const items = propItems ?? decisionsHook.items ?? [];
  const loading = propLoading ?? (propItems ? false : decisionsHook.loading);
  const handleRefresh = propRefresh ?? decisionsHook.refetch;

  const gridThemeClass = theme === 'light' ? 'ag-theme-alpine' : 'ag-theme-alpine-dark';

  const defaultColumns = useMemo<ColDef<ScoreResult>[]>(
    () => [
      {
        field: 'order_id',
        headerName: 'Order Reference',
        minWidth: 180,
        flex: 1.2,
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
        minWidth: 150,
        flex: 1.1,
        cellRenderer: (params: { value: string }) => <RiskBadge action={params.value} />,
      },
      {
        field: 'severity',
        headerName: 'Severity',
        minWidth: 110,
        flex: 0.8,
        cellRenderer: (params: { value: string }) => <RiskBadge severity={params.value} />,
      },
      {
        field: 'model_version',
        headerName: 'Model Version',
        minWidth: 150,
        flex: 1,
        cellRenderer: (params: { value: string }) => (
          <span style={{ fontSize: 12, color: 'var(--rg-text-secondary)' }}>
            {params.value || 'candidate_lgbm_v1'}
          </span>
        ),
      },
    ],
    []
  );

  const columnDefs = customColumns || defaultColumns;

  return (
    <div className="rg-card" style={{ padding: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--rg-text-primary)' }}>
            {title}
          </h4>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 12,
              background: 'var(--rg-bg-tertiary)',
              color: 'var(--rg-text-secondary)',
            }}
          >
            {items.length} records
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {quickFilter && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 9,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--rg-text-muted)',
                  pointerEvents: 'none',
                }}
              >
                <SearchIcon size={13} />
              </span>
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter decisions..."
                style={{
                  fontSize: 12,
                  padding: '5px 10px 5px 28px',
                  borderRadius: 6,
                  border: '1px solid var(--rg-border-primary, #334155)',
                  background: 'var(--rg-bg-secondary, #1e293b)',
                  color: 'var(--rg-text-primary)',
                  outline: 'none',
                  width: 170,
                }}
              />
            </div>
          )}

          {handleRefresh && (
            <button
              type="button"
              className="rg-btn rg-btn-secondary"
              onClick={handleRefresh}
              style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
              title="Refresh decisions grid"
            >
              <RefreshIcon size={12} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      <div className={gridThemeClass} style={{ height, width: '100%', borderRadius: 6, overflow: 'hidden' }}>
        <AgGridReact<ScoreResult>
          rowData={items}
          columnDefs={columnDefs}
          quickFilterText={filterText}
          loading={loading}
          pagination={true}
          paginationPageSize={pageSize}
          rowSelection={{ mode: 'singleRow' }}
          onRowClicked={(event: RowClickedEvent<ScoreResult>) => {
            if (event.data && onRowClick) {
              const id = event.data.decision_id || event.data.order_id || '';
              onRowClick(id, event.data);
            }
          }}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
        />
      </div>
    </div>
  );
};

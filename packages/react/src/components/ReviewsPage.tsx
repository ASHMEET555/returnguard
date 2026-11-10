import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip,
} from 'recharts';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, RowClickedEvent } from 'ag-grid-community';

import type { ReviewItem } from '@returnguard/sdk';
import { useReviews, useRiskSummary } from '../hooks';
import { useReturnGuard } from '../context';
import { RiskBadge } from './RiskBadge';
import {
  RefreshIcon,
  SearchIcon,
  CloseIcon,
  ShieldIcon,
  AlertTriangleIcon,
  InfoIcon,
} from './icons';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  CHART_COLORS,
  CHART_CSS_VARS,
  calculatePercentage,
} from './charts';

export const ReviewsPage: React.FC = () => {
  const { client, theme } = useReturnGuard();
  const { items, loading, error, refetch } = useReviews(50);
  const { data: summary } = useRiskSummary();

  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [quickFilterText, setQuickFilterText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Drawer accessibility refs
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Filter items based on status tab
  const filteredItems = useMemo(() => {
    let list = items;
    if (statusFilter === 'pending') {
      list = list.filter((item) => (item.status || '').toLowerCase() === 'pending');
    } else if (statusFilter === 'resolved') {
      list = list.filter((item) => (item.status || '').toLowerCase() !== 'pending');
    }
    return list;
  }, [items, statusFilter]);

  // Derived metrics with honest labeling
  const totalHistoricalFlagged = summary?.review_count ?? 0;
  const loadedDecisions = items.length;
  const loadedPending = useMemo(
    () => items.filter((item) => (item.status || '').toLowerCase() === 'pending').length,
    [items]
  );
  const loadedHighRisk = useMemo(
    () =>
      items.filter((item) => {
        const score = item.risk_score ?? 0;
        const tier = (item.tier || '').toUpperCase();
        return tier === 'HIGH' || tier === 'CRITICAL' || score >= 0.7;
      }).length,
    [items]
  );
  const loadedResolved = loadedDecisions - loadedPending;

  const loadedApproved = useMemo(
    () => items.filter((item) => (item.status || '').toLowerCase() === 'approved').length,
    [items]
  );
  const loadedRejected = useMemo(
    () => items.filter((item) => (item.status || '').toLowerCase() === 'rejected').length,
    [items]
  );
  const loadedEscalated = useMemo(
    () => items.filter((item) => (item.status || '').toLowerCase() === 'escalated').length,
    [items]
  );

  const reviewStatusData = useMemo(() => {
    return [
      {
        status: 'Pending',
        count: loadedPending,
        pct: calculatePercentage(loadedPending, loadedDecisions),
        color: CHART_COLORS.review,
      },
      {
        status: 'Approved',
        count: loadedApproved,
        pct: calculatePercentage(loadedApproved, loadedDecisions),
        color: CHART_COLORS.allow,
      },
      {
        status: 'Rejected',
        count: loadedRejected,
        pct: calculatePercentage(loadedRejected, loadedDecisions),
        color: CHART_COLORS.block,
      },
      {
        status: 'Escalated',
        count: loadedEscalated,
        pct: calculatePercentage(loadedEscalated, loadedDecisions),
        color: CHART_COLORS.accent,
      },
    ];
  }, [loadedPending, loadedApproved, loadedRejected, loadedEscalated, loadedDecisions]);

  // AG Grid column definitions
  const columnDefs = useMemo<ColDef<ReviewItem>[]>(
    () => [
      {
        field: 'order_id',
        headerName: 'Order / Decision ID',
        minWidth: 220,
        flex: 1.4,
        pinned: 'left',
        cellRenderer: (params: { data?: ReviewItem }) => (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
              lineHeight: 1.35,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--rg-font-mono, monospace)',
                fontWeight: 600,
                color: 'var(--rg-text-primary)',
              }}
            >
              {params.data?.order_id || '--'}
            </span>
            <span
              style={{
                fontFamily: 'var(--rg-font-mono, monospace)',
                fontSize: 11,
                color: 'var(--rg-text-muted)',
                marginTop: 2,
              }}
            >
              {params.data?.decision_id || '--'}
            </span>
          </div>
        ),
      },
      {
        field: 'created_at',
        headerName: 'Queued At',
        minWidth: 160,
        flex: 1.1,
        cellRenderer: (params: { value?: string }) => (
          <span
            style={{
              fontSize: 12,
              color: 'var(--rg-text-secondary)',
              fontFamily: 'var(--rg-font-mono, monospace)',
            }}
          >
            {params.value ? new Date(params.value).toLocaleString() : '--'}
          </span>
        ),
      },
      {
        field: 'risk_score',
        headerName: 'Risk Score',
        minWidth: 120,
        flex: 0.9,
        sort: 'desc',
        cellRenderer: (params: { value?: number }) => (
          <RiskBadge score={params.value ?? 0} />
        ),
      },
      {
        field: 'suggested_action',
        headerName: 'Suggested Action',
        minWidth: 140,
        flex: 1.1,
        cellRenderer: (params: { value?: string; data?: ReviewItem }) => (
          <RiskBadge action={params.value || params.data?.policy_action || 'REVIEW'} />
        ),
      },
      {
        field: 'tier',
        headerName: 'Risk Tier',
        minWidth: 110,
        flex: 0.8,
        cellRenderer: (params: { value?: string }) => (
          <RiskBadge severity={params.value || 'MEDIUM'} />
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 130,
        flex: 0.9,
        cellRenderer: (params: { value?: string }) => {
          const status = (params.value || 'pending').toLowerCase();
          const isPending = status === 'pending';
          const isApprove = status === 'approve' || status === 'approved';
          const isReject = status === 'reject' || status === 'rejected';

          const color = isPending
            ? 'var(--rg-med-text)'
            : isApprove
            ? 'var(--rg-low-text)'
            : isReject
            ? 'var(--rg-high-text)'
            : 'var(--rg-accent, #6366f1)';
          const bg = isPending
            ? 'var(--rg-med-bg)'
            : isApprove
            ? 'var(--rg-low-bg)'
            : isReject
            ? 'var(--rg-high-bg)'
            : 'rgba(99, 102, 241, 0.1)';
          const border = isPending
            ? 'var(--rg-med-border)'
            : isApprove
            ? 'var(--rg-low-border)'
            : isReject
            ? 'var(--rg-high-border)'
            : 'rgba(99, 102, 241, 0.3)';

          return (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '2px 8px',
                borderRadius: 4,
                background: bg,
                color,
                border: `1px solid ${border}`,
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: color,
                }}
              />
              {status}
            </span>
          );
        },
      },
      {
        field: 'reviewer',
        headerName: 'Reviewer',
        minWidth: 120,
        flex: 0.9,
        cellRenderer: (params: { value?: string | null }) => (
          <span
            style={{
              fontSize: 12,
              color: params.value ? 'var(--rg-text-primary)' : 'var(--rg-text-muted)',
            }}
          >
            {params.value || 'Unassigned'}
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

  const gridThemeClass = theme === 'light' ? 'ag-theme-alpine' : 'ag-theme-alpine-dark';

  // Handle drawer open / focus capture
  useEffect(() => {
    if (selectedReview) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedReview]);

  // Restore focus safely on unmount or close
  const restoreFocus = useCallback(() => {
    const el = previousActiveElementRef.current;
    if (el && typeof el.focus === 'function' && document.contains(el)) {
      el.focus();
    }
  }, []);

  const handleCloseDrawer = useCallback(() => {
    restoreFocus();
    setSelectedReview(null);
    setSubmitResult(null);
  }, [restoreFocus]);

  // Focus trap and ESC key listener for modal drawer
  useEffect(() => {
    if (!selectedReview) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseDrawer();
        return;
      }

      if (e.key === 'Tab') {
        const container = drawerRef.current;
        if (!container) return;

        const focusable = container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReview, handleCloseDrawer]);

  const handleRowClicked = (event: RowClickedEvent<ReviewItem>) => {
    if (event.data) {
      setSelectedReview(event.data);
      setNotes(event.data.notes || '');
      setSubmitResult(null);
    }
  };

  const handleSubmitAction = async (action: 'approve' | 'reject' | 'escalate') => {
    if (!selectedReview || submitting) return;
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await client.reviews.submit({
        decision_id: selectedReview.decision_id,
        action,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      // Strict server-confirmed flow: refetch queue from server
      const freshPage = await refetch();
      const serverRecord = freshPage?.items.find(
        (item) => item.decision_id === selectedReview.decision_id
      );

      if (serverRecord) {
        setSelectedReview(serverRecord);
        setNotes(serverRecord.notes || '');
      } else {
        // Fallback using confirmed response fields only
        setSelectedReview({
          ...selectedReview,
          status: res.action,
          reviewed_at: res.updated_at,
          notes: notes.trim() || selectedReview.notes,
        });
      }

      setSubmitResult({
        type: 'success',
        message: `Resolution recorded: ${action.toUpperCase()} (${res.status}).`,
      });
    } catch (err: unknown) {
      // On failure: keep selectedReview completely unchanged, preserve user's typed notes, show actionable error
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitResult({
        type: 'error',
        message: `Failed to submit review: ${msg}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <header className="rg-reviews-header">
        <div className="rg-reviews-title-group">
          <h2 className="rg-reviews-title">Alerts &amp; Manual Reviews</h2>
          <p className="rg-reviews-subtitle">
            Operational queue for high-risk and flagged payments requiring human evaluation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rg-reviews-refresh-btn"
          aria-label="Refresh review queue"
        >
          <RefreshIcon size={14} aria-hidden="true" />
          <span>Refresh Queue</span>
        </button>
      </header>

      {/* Honest Top KPI Strip */}
      <section className="rg-kpi-grid rg-metrics-grid" aria-label="Review Queue Metrics">
        <div className="rg-card" data-testid="kpi-total-flagged">
          <div className="rg-card-title">Total Flagged (Historical)</div>
          <div className="rg-card-value">{totalHistoricalFlagged.toLocaleString()}</div>
          <div className="rg-card-subtitle">Cumulative decisions flagged by policy</div>
        </div>

        <div className="rg-card" data-testid="kpi-loaded-decisions">
          <div className="rg-card-title">Loaded Batch</div>
          <div className="rg-card-value">{loadedDecisions} / 50</div>
          <div className="rg-card-subtitle">Current page sample (single fetch)</div>
        </div>

        <div className="rg-card" data-testid="kpi-loaded-pending">
          <div className="rg-card-title">Loaded Pending</div>
          <div className="rg-card-value" style={{ color: loadedPending > 0 ? 'var(--rg-med-text)' : 'var(--rg-text-primary)' }}>
            {loadedPending}
          </div>
          <div className="rg-card-subtitle">Awaiting human review in loaded batch</div>
        </div>

        <div className="rg-card" data-testid="kpi-loaded-high-risk">
          <div className="rg-card-title">Loaded High-Risk</div>
          <div className="rg-card-value" style={{ color: loadedHighRisk > 0 ? 'var(--rg-high-text)' : 'var(--rg-text-primary)' }}>
            {loadedHighRisk}
          </div>
          <div className="rg-card-subtitle">Score ≥ 0.70 or HIGH/CRIT tier</div>
        </div>
      </section>

      {/* Secondary Loaded Batch Status Overview */}
      <div style={{ marginBottom: 16 }}>
        <ChartContainer
          title="Loaded Batch Review Status"
          subtitle={`Operational resolution state for the active batch sample (${loadedDecisions} / 50 loaded decisions)`}
          height={180}
          empty={loadedDecisions === 0}
          emptyTitle="No decisions in loaded queue"
          emptyMessage={`Review queue is empty for the current filter. Cumulative flagged decisions: ${totalHistoricalFlagged}`}
          ariaLabel={`Review queue loaded status: Pending ${loadedPending}, Approved ${loadedApproved}, Rejected ${loadedRejected}, Escalated ${loadedEscalated}`}
          ariaDescription="Operational distribution of review items in current batch."
        >
          <ResponsiveContainer width="100%" height={95}>
            <BarChart
              layout="vertical"
              data={reviewStatusData}
              margin={{ top: 4, right: 24, left: 16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_CSS_VARS.grid} horizontal={false} />
              <XAxis type="number" stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="status" stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} axisLine={false} width={65} />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(val, _name, item) => [
                      `${Number(val)} items (${item.payload?.pct.toFixed(1)}% of loaded batch)`,
                      item.payload?.status,
                    ]}
                  />
                }
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {reviewStatusData.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ChartLegend
            items={reviewStatusData.map((d) => ({
              id: d.status,
              value: d.status,
              count: d.count,
              percentage: d.pct,
              color: d.color,
              formattedValue: `${d.count} (${d.pct.toFixed(1)}%)`,
            }))}
            showValues
            showPercentages
            align="center"
          />
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--rg-text-muted)', lineHeight: 1.4 }}>
            * Note: Status metrics reflect the currently loaded batch sample only, not tenant-wide totals. SLA and queue aging charts are omitted due to absence of backend SLA telemetry.
          </div>
        </ChartContainer>
      </div>

      {/* Toolbar: Search & Status Filters */}
      <div className="rg-reviews-toolbar">
        <div className="rg-reviews-search-group">
          <SearchIcon size={14} className="rg-reviews-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="rg-reviews-search-input"
            placeholder="Search by order or decision ID..."
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            aria-label="Search review items"
          />
        </div>

        <div className="rg-reviews-filter-group" role="tablist" aria-label="Review status filters">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'all'}
            className={`rg-reviews-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({loadedDecisions})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'pending'}
            className={`rg-reviews-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending ({loadedPending})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'resolved'}
            className={`rg-reviews-filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved ({loadedResolved})
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="rg-loading-state" role="status" aria-live="polite">
          Loading review queue...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rg-error-state" role="alert" style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600 }}>Failed to load review items</h4>
          <p style={{ margin: '0 0 10px 0', fontSize: 13 }}>{error.message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rg-retry-btn"
          >
            <RefreshIcon size={14} aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="rg-empty-state" role="status">
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--rg-text-primary)' }}>
            No manual reviews currently pending.
          </p>
          <span style={{ fontSize: 13, color: 'var(--rg-text-muted)' }}>
            All flagged transactions have been cleared or no items matched the queue criteria.
          </span>
        </div>
      )}

      {/* AG Grid Community Table */}
      <div
        className={gridThemeClass}
        style={{
          height: 520,
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid var(--rg-border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <AgGridReact<ReviewItem>
          theme="legacy"
          rowData={filteredItems}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loading={loading}
          quickFilterText={quickFilterText}
          rowSelection={{
            mode: 'singleRow',
            checkboxes: false,
            enableClickSelection: true,
          }}
          rowHeight={48}
          headerHeight={40}
          animateRows={true}
          onRowClicked={handleRowClicked}
        />
      </div>

      {/* Accessible Detail & Action Drawer */}
      {selectedReview && (
        <div
          className="rg-drawer-overlay"
          onClick={handleCloseDrawer}
          aria-hidden="false"
        >
          <aside
            ref={drawerRef}
            className="rg-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rg-review-drawer-title"
            aria-describedby="rg-review-drawer-desc"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="rg-drawer-header">
              <div className="rg-drawer-header-info">
                <span id="rg-review-drawer-desc" className="rg-drawer-subtitle">
                  Manual Review Investigation
                </span>
                <h2 id="rg-review-drawer-title" className="rg-drawer-title">
                  {selectedReview.order_id}
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="rg-drawer-close-btn"
                onClick={handleCloseDrawer}
                aria-label="Close review details"
              >
                <CloseIcon size={14} aria-hidden="true" />
                <span>Close</span>
              </button>
            </header>

            {/* Scrollable Body */}
            <div className="rg-drawer-body">
              {/* Verdict Section */}
              <section className="rg-drawer-section">
                <div className="rg-drawer-section-title">Risk Verdict &amp; Recommendation</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <RiskBadge score={selectedReview.risk_score} />
                  <RiskBadge action={selectedReview.suggested_action || selectedReview.policy_action} />
                  <RiskBadge severity={selectedReview.tier} />
                </div>
              </section>

              {/* Context Section */}
              <section className="rg-drawer-section">
                <div className="rg-drawer-section-title">Review Context</div>
                <div className="rg-context-grid">
                  <div className="rg-context-item">
                    <span className="rg-context-label">Decision ID</span>
                    <span
                      className="rg-context-value"
                      style={{ fontFamily: 'var(--rg-font-mono, monospace)', fontSize: 12 }}
                    >
                      {selectedReview.decision_id}
                    </span>
                  </div>
                  <div className="rg-context-item">
                    <span className="rg-context-label">Order ID</span>
                    <span
                      className="rg-context-value"
                      style={{ fontFamily: 'var(--rg-font-mono, monospace)', fontSize: 12 }}
                    >
                      {selectedReview.order_id}
                    </span>
                  </div>
                  <div className="rg-context-item">
                    <span className="rg-context-label">Queued Timestamp</span>
                    <span className="rg-context-value">
                      {new Date(selectedReview.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="rg-context-item">
                    <span className="rg-context-label">Current Status</span>
                    <span
                      className="rg-context-value"
                      style={{ fontWeight: 600, textTransform: 'uppercase' }}
                    >
                      {selectedReview.status}
                    </span>
                  </div>
                  <div className="rg-context-item">
                    <span className="rg-context-label">Assigned Reviewer</span>
                    <span className="rg-context-value">
                      {selectedReview.reviewer || 'Unassigned'}
                    </span>
                  </div>
                  {selectedReview.reviewed_at && (
                    <div className="rg-context-item">
                      <span className="rg-context-label">Resolved At</span>
                      <span className="rg-context-value">
                        {new Date(selectedReview.reviewed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Recorded Notes if present */}
              {selectedReview.notes && (
                <section className="rg-drawer-section">
                  <div className="rg-drawer-section-title">Recorded Review Notes</div>
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--rg-bg-tertiary)',
                      border: '1px solid var(--rg-border-subtle)',
                      borderRadius: 'var(--rg-radius-md)',
                      fontSize: 13,
                      color: 'var(--rg-text-secondary)',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{selectedReview.notes}&rdquo;
                  </div>
                </section>
              )}

              {/* Submit Resolution Section */}
              <section className="rg-drawer-section">
                <div className="rg-drawer-section-title">Submit Review Resolution</div>
                <p
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: 12,
                    color: 'var(--rg-text-muted)',
                    lineHeight: 1.4,
                  }}
                >
                  Approve, reject, or escalate this flagged transaction. Submitting records an audit action in ReturnGuard.
                </p>

                {submitting && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      color: 'var(--rg-text-muted)',
                      marginBottom: 10,
                    }}
                    role="status"
                    aria-live="polite"
                  >
                    <span
                      className="rg-loading-spinner"
                      aria-hidden="true"
                      style={{ width: 14, height: 14 }}
                    />
                    <span>Submitting resolution to server...</span>
                  </div>
                )}

                {submitResult && (
                  <div
                    className={
                      submitResult.type === 'success'
                        ? 'rg-review-alert-success'
                        : 'rg-review-alert-error'
                    }
                    style={{ marginBottom: 12 }}
                    role={submitResult.type === 'success' ? 'status' : 'alert'}
                  >
                    {submitResult.message}
                  </div>
                )}

                <div className="rg-review-actions-panel">
                  <label
                    htmlFor="rg-review-notes-input"
                    style={{ fontSize: 12, fontWeight: 500, color: 'var(--rg-text-secondary)' }}
                  >
                    Reviewer Notes / Justification:
                  </label>
                  <textarea
                    id="rg-review-notes-input"
                    className="rg-review-textarea"
                    placeholder="Enter investigation rationale or justification notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={submitting}
                  />

                  <div className="rg-review-btn-row">
                    <button
                      type="button"
                      className="rg-btn-approve"
                      disabled={submitting}
                      onClick={() => handleSubmitAction('approve')}
                      aria-label="Approve transaction"
                    >
                      <ShieldIcon size={14} aria-hidden="true" />
                      <span>{submitting ? 'Submitting...' : 'Approve'}</span>
                    </button>
                    <button
                      type="button"
                      className="rg-btn-reject"
                      disabled={submitting}
                      onClick={() => handleSubmitAction('reject')}
                      aria-label="Reject transaction"
                    >
                      <AlertTriangleIcon size={14} aria-hidden="true" />
                      <span>{submitting ? 'Submitting...' : 'Reject'}</span>
                    </button>
                    <button
                      type="button"
                      className="rg-btn-escalate"
                      disabled={submitting}
                      onClick={() => handleSubmitAction('escalate')}
                      aria-label="Escalate transaction"
                    >
                      <InfoIcon size={14} aria-hidden="true" />
                      <span>{submitting ? 'Submitting...' : 'Escalate'}</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

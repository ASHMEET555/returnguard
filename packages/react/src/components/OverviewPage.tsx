import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useRiskSummary } from '../hooks';
import {
  TransactionsIcon,
  AlertTriangleIcon,
  ShieldIcon,
  AnalyticsIcon,
  RefreshIcon,
} from './icons';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  CHART_COLORS,
  calculatePercentage,
} from './charts';

export const OverviewPage: React.FC = () => {
  const { data, loading, error, refetch } = useRiskSummary();

  const summary = data ?? {
    tenant_id: 'default',
    total_decisions: 0,
    allow_count: 0,
    review_count: 0,
    block_count: 0,
    average_risk_score: 0,
    total_volume_inr: 0,
    high_risk_volume_inr: 0,
    tier_distribution: {},
  };

  const allowCount = summary.allow_count || 0;
  const reviewCount = summary.review_count || 0;
  const blockCount = summary.block_count || 0;
  const totalDecisions = summary.total_decisions || (allowCount + reviewCount + blockCount);
  const flaggedCount = reviewCount + blockCount;
  const flaggedPct = totalDecisions > 0
    ? ((flaggedCount / totalDecisions) * 100).toFixed(1)
    : '0.0';

  const allowPctNum = totalDecisions > 0 ? (allowCount / totalDecisions) * 100 : 0;
  const reviewPctNum = totalDecisions > 0 ? (reviewCount / totalDecisions) * 100 : 0;
  const blockPctNum = totalDecisions > 0 ? (blockCount / totalDecisions) * 100 : 0;

  const allowPct = allowPctNum.toFixed(1);
  const reviewPct = reviewPctNum.toFixed(1);
  const blockPct = blockPctNum.toFixed(1);

  // All 3 decision categories for legend and calculations (Must be before any early return)
  const allCategories = useMemo(
    () => [
      {
        id: 'ALLOW',
        name: 'ALLOW',
        value: allowCount,
        count: allowCount,
        percentage: allowPctNum,
        color: CHART_COLORS.allow,
        dotClass: 'rg-risk-dot-low',
        textVar: 'var(--rg-low-text)',
      },
      {
        id: 'REVIEW',
        name: 'REVIEW',
        value: reviewCount,
        count: reviewCount,
        percentage: reviewPctNum,
        color: CHART_COLORS.review,
        dotClass: 'rg-risk-dot-medium',
        textVar: 'var(--rg-med-text)',
      },
      {
        id: 'BLOCK',
        name: 'BLOCK',
        value: blockCount,
        count: blockCount,
        percentage: blockPctNum,
        color: CHART_COLORS.block,
        dotClass: 'rg-risk-dot-high',
        textVar: 'var(--rg-high-text)',
      },
    ],
    [allowCount, reviewCount, blockCount, allowPctNum, reviewPctNum, blockPctNum]
  );

  // Filter out 0-value slices for the SVG Pie to prevent zero-angle rendering glitches
  const pieData = useMemo(() => allCategories.filter((cat) => cat.value > 0), [allCategories]);

  // Legend retains ALL categories including zero-count categories
  const legendItems = useMemo(
    () =>
      allCategories.map((cat) => ({
        id: cat.id,
        value: cat.name,
        count: cat.count,
        percentage: Number(cat.percentage.toFixed(1)),
        color: cat.color,
        formattedValue: `${cat.count.toLocaleString()} (${cat.percentage.toFixed(1)}%)`,
      })),
    [allCategories]
  );

  if (loading) {
    return (
      <div className="rg-loading-state" role="status" aria-live="polite">
        Loading risk operations summary...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rg-error-state" role="alert">
        <h4>Failed to load risk summary</h4>
        <p>{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rg-retry-btn"
        >
          <RefreshIcon size={14} aria-hidden="true" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Risk Operations Overview
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)', lineHeight: 1.5 }}>
          Portfolio risk posture, policy distributions, and live transaction indicators.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="rg-kpi-grid">
        <div className="rg-card">
          <div className="rg-card-title">
            <span>Transactions Scored</span>
            <span className="rg-kpi-icon-wrap" aria-hidden="true">
              <TransactionsIcon size={16} />
            </span>
          </div>
          <div className="rg-card-value">{summary.total_decisions.toLocaleString()}</div>
          <div className="rg-card-subtitle">Lifetime scored payments</div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">
            <span>Flagged Transactions</span>
            <span className="rg-kpi-icon-wrap rg-kpi-icon-warning" aria-hidden="true">
              <AlertTriangleIcon size={16} />
            </span>
          </div>
          <div className="rg-card-value">{flaggedCount.toLocaleString()}</div>
          <div className="rg-card-subtitle">{flaggedPct}% flag rate</div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">
            <span>High Risk / Block Action</span>
            <span className="rg-kpi-icon-wrap rg-kpi-icon-danger" aria-hidden="true">
              <ShieldIcon size={16} />
            </span>
          </div>
          <div className="rg-card-value">{summary.block_count.toLocaleString()}</div>
          <div className="rg-card-subtitle">Recommended hold/stop</div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">
            <span>Average Risk Score</span>
            <span className="rg-kpi-icon-wrap rg-kpi-icon-accent" aria-hidden="true">
              <AnalyticsIcon size={16} />
            </span>
          </div>
          <div className="rg-card-value">{(summary.average_risk_score * 100).toFixed(0)}</div>
          <div className="rg-card-subtitle">Portfolio scale (0 - 100)</div>
        </div>
      </div>

      {/* Secondary Policy Breakdown & System Health Grid */}
      <div className="rg-analytical-grid">
        {/* Recharts Policy Action Donut Chart */}
        <ChartContainer
          title="Policy Action Distribution"
          subtitle="Real-time policy decisions applied to evaluated transactions"
          height={320}
          empty={totalDecisions === 0}
          emptyTitle="No decisions evaluated"
          emptyMessage="No evaluated transactions recorded for this tenant."
          ariaLabel={`Policy distribution donut chart: ${totalDecisions} decisions`}
          ariaDescription={`ALLOW: ${allowCount} (${allowPct}%), REVIEW: ${reviewCount} (${reviewPct}%), BLOCK: ${blockCount} (${blockPct}%)`}
        >
          <div className="rg-donut-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={pieData.length > 1 ? 3 : 0}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} stroke="var(--rg-bg-card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(val, name) => [
                        `${Number(val).toLocaleString()} (${calculatePercentage(Number(val), totalDecisions)}%)`,
                        name,
                      ]}
                    />
                  }
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Summary Label */}
            <div className="rg-donut-center" aria-hidden="true">
              <span className="rg-donut-center-val">{totalDecisions.toLocaleString()}</span>
              <span className="rg-donut-center-label">Decisions</span>
            </div>
          </div>

          {/* Accessible Legend Retaining Zero-Count Categories */}
          <ChartLegend items={legendItems} showValues showPercentages align="center" />
        </ChartContainer>

        {/* Scoring System Health Card */}
        <div className="rg-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600 }}>Scoring System Health</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--rg-text-muted)' }}>
              Operational parameters and real-time execution status
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--rg-border-subtle)',
                }}
              >
                <span style={{ color: 'var(--rg-text-secondary)' }}>Engine Status</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--rg-low-text)',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <span className="rg-risk-dot rg-risk-dot-low" aria-hidden="true" />
                  <span>Operational</span>
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--rg-border-subtle)',
                }}
              >
                <span style={{ color: 'var(--rg-text-secondary)' }}>Execution Mode</span>
                <span className="rg-meta-tag" style={{ fontWeight: 500 }}>
                  Active (Shadow Mode)
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--rg-border-subtle)',
                }}
              >
                <span style={{ color: 'var(--rg-text-secondary)' }}>Serving Model</span>
                <span className="rg-meta-tag rg-font-mono" style={{ fontSize: 11 }}>
                  candidate_lgbm_v1
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--rg-border-subtle)',
                }}
              >
                <span style={{ color: 'var(--rg-text-secondary)' }}>Tenant Scope</span>
                <span className="rg-font-mono" style={{ fontSize: 12, color: 'var(--rg-text-primary)' }}>
                  {summary.tenant_id}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Summary Footnote Table */}
          <table className="rg-reports-stat-table" style={{ marginTop: 16 }} aria-label="Policy recommendations breakdown">
            <tbody>
              {allCategories.map((cat) => (
                <tr key={cat.id}>
                  <td className="rg-reports-stat-label">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span className={`rg-risk-dot ${cat.dotClass}`} />
                      <span>{cat.name} Decisions</span>
                    </span>
                  </td>
                  <td className="rg-reports-stat-value" style={{ color: cat.textVar }}>
                    {cat.count.toLocaleString()} ({cat.percentage.toFixed(1)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

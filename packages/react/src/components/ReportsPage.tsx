import React, { useState, useMemo } from 'react';
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
import { useRiskSummary, useRiskTrends, useRiskDecisions } from '../hooks';
import type { ScoreResult, AnalyticsSummary, RiskTrendsResponse, DisputeAnalytics } from '@returnguard/sdk';
import {
  DownloadIcon,
  RefreshIcon,
  InfoIcon,
  ShieldIcon,
  AlertTriangleIcon,
  LockIcon,
} from './icons';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  CHART_COLORS,
  CHART_CSS_VARS,
} from './charts';

/**
 * Sanitizes a single CSV field value per RFC 4180 standards and applies
 * spreadsheet formula injection defense (CWE-1236) without corrupting legitimate numbers.
 */
export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Preserve finite numbers directly without formula neutralization
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  let str = String(value);

  // Formula injection defense:
  // If string starts with =, +, -, or @ and is NOT a valid finite number,
  // prepend a single quote (') to force spreadsheet software to treat it as a literal string.
  if (/^[=\+\-@]/.test(str)) {
    const isNumeric = !Number.isNaN(Number(str)) && str.trim() !== '';
    if (!isNumeric) {
      str = `'${str}`;
    }
  }

  // RFC 4180 quoting: quote if contains comma, quote, newline, or prepended single quote
  if (/[",\r\n]/.test(str) || str.startsWith("'")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export const EXPORTED_CSV_COLUMNS = [
  'Decision ID',
  'Order ID',
  'Channel',
  'Risk Score',
  'Risk Score (0-100)',
  'Risk Tier',
  'Policy Action',
  'Suggested Action',
  'Policy Rule',
  'Severity',
  'Model Version',
  'Model Status',
] as const;

/**
 * Generates an RFC 4180 compliant CSV string for the loaded decision records.
 * Explicitly bound to the loaded batch (single page, max 50).
 */
export function generateDecisionsCsv(decisions: ScoreResult[]): string {
  const headerRow = EXPORTED_CSV_COLUMNS.map(sanitizeCsvField).join(',');
  if (!decisions || decisions.length === 0) {
    return headerRow + '\r\n';
  }

  const rows = decisions.map((d) =>
    [
      sanitizeCsvField(d.decision_id || '--'),
      sanitizeCsvField(d.order_id || '--'),
      sanitizeCsvField(d.channel || 'web'),
      sanitizeCsvField(d.risk_score),
      sanitizeCsvField(d.risk_score_100),
      sanitizeCsvField(d.tier || 'LOW'),
      sanitizeCsvField(d.policy_action || 'ALLOW'),
      sanitizeCsvField(d.suggested_action || 'ALLOW'),
      sanitizeCsvField(d.policy_rule || 'ALLOW_NORMAL'),
      sanitizeCsvField(d.severity || 'allow'),
      sanitizeCsvField(d.model_version || 'candidate_lgbm_v1'),
      sanitizeCsvField(d.model_status || 'loaded'),
    ].join(',')
  );

  return [headerRow, ...rows].join('\r\n') + '\r\n';
}

/**
 * Triggers a client-side browser download for generated CSV content
 * and safely revokes the generated object URL.
 */
export function triggerCsvDownload(csvContent: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export interface ExportPipelineStage {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  description: string;
}

export const EXPORT_PIPELINE_STAGES: ExportPipelineStage[] = [
  {
    id: 'ingestion',
    step: 1,
    title: 'Loaded Decisions',
    subtitle: 'Batch Ingestion',
    description: 'Active client batch (max 50 loaded records)',
  },
  {
    id: 'sanitization',
    step: 2,
    title: 'PII Sanitization',
    subtitle: 'Privacy Boundary',
    description: 'Filters customer names, emails, phones & addresses',
  },
  {
    id: 'formula_defense',
    step: 3,
    title: 'CWE-1236 Defense',
    subtitle: 'Formula Neutralization',
    description: 'Neutralizes =, +, -, @ prefixes; preserves signed numbers',
  },
  {
    id: 'rfc4180_csv',
    step: 4,
    title: 'RFC 4180 CSV',
    subtitle: 'Client Serialization',
    description: 'CRLF stream & instant browser Blob URL download',
  },
];

export interface PolicyDistributionResult {
  allow: { count: number; pct: number };
  review: { count: number; pct: number };
  stepUp: { count: number; pct: number };
  block: { count: number; pct: number };
  total: number;
  isEmpty: boolean;
  accessibleLabel: string;
}

/**
 * Calculates policy distribution counts and percentages safely.
 */
export function calculatePolicyDistribution(
  trends?: RiskTrendsResponse | null,
  summary?: AnalyticsSummary | null
): PolicyDistributionResult {
  const allowCount = trends?.policy_breakdown?.ALLOW ?? summary?.allow_count ?? 0;
  const reviewCount =
    (trends?.policy_breakdown?.REVIEW ?? 0) +
    (trends?.policy_breakdown?.MANUAL_REVIEW ?? 0) ||
    (summary?.review_count ?? 0);
  const stepUpCount = trends?.policy_breakdown?.STEP_UP_VERIFICATION ?? 0;
  const blockCount = trends?.policy_breakdown?.BLOCK ?? summary?.block_count ?? 0;

  const total = allowCount + reviewCount + stepUpCount + blockCount;
  const isEmpty = total === 0;

  const allowPct = isEmpty ? 0 : (allowCount / total) * 100;
  const reviewPct = isEmpty ? 0 : (reviewCount / total) * 100;
  const stepUpPct = isEmpty ? 0 : (stepUpCount / total) * 100;
  const blockPct = isEmpty ? 0 : (blockCount / total) * 100;

  const accessibleLabel = isEmpty
    ? 'Policy decision distribution: No decisions evaluated'
    : `Policy decision distribution: ALLOW ${allowCount} (${allowPct.toFixed(1)}%), REVIEW ${reviewCount} (${reviewPct.toFixed(1)}%), STEP-UP ${stepUpCount} (${stepUpPct.toFixed(1)}%), BLOCK ${blockCount} (${blockPct.toFixed(1)}%)`;

  return {
    allow: { count: allowCount, pct: allowPct },
    review: { count: reviewCount, pct: reviewPct },
    stepUp: { count: stepUpCount, pct: stepUpPct },
    block: { count: blockCount, pct: blockPct },
    total,
    isEmpty,
    accessibleLabel,
  };
}

export interface DisputeMeterResult {
  ratePct: number;
  totalDisputes: number;
  disputedAmount: number;
  currency: string;
  warningThresholdPct: number;
  criticalThresholdPct: number;
  scaleMaxPct: number;
  clampedPositionPct: number;
  warningMarkerPct: number;
  criticalMarkerPct: number;
  isExceedingCritical: boolean;
  isZeroDisputes: boolean;
  statusMessage: string;
  accessibleLabel: string;
}

/**
 * Computes processor dispute compliance meter coordinates and reference thresholds.
 */
export function calculateDisputeMeter(
  disputeAnalytics?: DisputeAnalytics | null
): DisputeMeterResult {
  const ratePct = disputeAnalytics?.dispute_rate_pct ?? 0;
  const totalDisputes = disputeAnalytics?.total_disputes ?? 0;
  const disputedAmount = disputeAnalytics?.disputed_amount ?? 0;
  const currency = disputeAnalytics?.currency || 'INR';

  const warningThresholdPct = 0.65;
  const criticalThresholdPct = 0.90;
  const scaleMaxPct = Math.max(1.20, ratePct > 0.90 ? ratePct * 1.15 : 1.20);

  const clampedPositionPct = Math.min(100, Math.max(0, (ratePct / scaleMaxPct) * 100));
  const warningMarkerPct = (warningThresholdPct / scaleMaxPct) * 100;
  const criticalMarkerPct = (criticalThresholdPct / scaleMaxPct) * 100;
  const isExceedingCritical = ratePct > criticalThresholdPct;
  const isZeroDisputes = totalDisputes === 0;

  let statusMessage = '';
  if (isZeroDisputes) {
    statusMessage = 'Clean Processor Status (0 disputes recorded)';
  } else if (isExceedingCritical) {
    statusMessage = `Exceeds 0.90% Reference Level (${ratePct.toFixed(2)}%)`;
  } else if (ratePct >= warningThresholdPct) {
    statusMessage = `Elevated Dispute Activity (${ratePct.toFixed(2)}%)`;
  } else {
    statusMessage = `Nominal Dispute Activity (${ratePct.toFixed(2)}%)`;
  }

  const accessibleLabel = `Processor dispute rate: ${ratePct.toFixed(2)}% (${totalDisputes} recorded disputes) against reference thresholds of 0.65% early warning and 0.90% critical`;

  return {
    ratePct,
    totalDisputes,
    disputedAmount,
    currency,
    warningThresholdPct,
    criticalThresholdPct,
    scaleMaxPct,
    clampedPositionPct,
    warningMarkerPct,
    criticalMarkerPct,
    isExceedingCritical,
    isZeroDisputes,
    statusMessage,
    accessibleLabel,
  };
}

export const ReportsPage: React.FC = () => {
  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useRiskSummary();

  const {
    data: trends,
    loading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends,
  } = useRiskTrends();

  const {
    items: decisions,
    loading: decisionsLoading,
    error: decisionsError,
    refetch: refetchDecisions,
  } = useRiskDecisions(50);

  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleRefreshAll = () => {
    refetchSummary();
    refetchTrends();
    refetchDecisions();
  };

  const handleExport = () => {
    if (!decisions.length) return;
    const csvData = generateDecisionsCsv(decisions);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `returnguard_decisions_batch_${dateStr}.csv`;
    triggerCsvDownload(csvData, filename);

    setExportNotice(`Exported ${decisions.length} loaded records to ${filename}.`);
    setTimeout(() => {
      setExportNotice(null);
    }, 6000);
  };

  // Honest metric derivations
  const totalDecisions = summary?.total_decisions ?? 0;
  const allowCount = summary?.allow_count ?? 0;
  const allowSharePct = totalDecisions > 0 ? (allowCount / totalDecisions) * 100 : 0;

  // Dispute analytics from verified API
  const disputeAnalytics = trends?.dispute_analytics;
  const totalDisputes = disputeAnalytics?.total_disputes ?? 0;
  const disputedAmount = disputeAnalytics?.disputed_amount ?? 0;
  const disputeCurrency = disputeAnalytics?.currency || 'INR';
  const disputeRatePct = disputeAnalytics?.dispute_rate_pct ?? 0;

  // Monetary volume from tenant order aggregation
  const totalVolumeInr = summary?.total_volume_inr ?? 0;
  const tierDist = summary?.tier_distribution ?? {};
  const isOverallLoading = summaryLoading || trendsLoading || decisionsLoading;

  // Visualizations calculations
  const policyDist = calculatePolicyDistribution(trends, summary);
  const disputeMeter = calculateDisputeMeter(disputeAnalytics);

  // Structured policy distribution chart data retaining zero-count categories
  const policyChartData = useMemo(
    () => [
      {
        action: 'ALLOW',
        label: 'ALLOW',
        count: policyDist.allow.count,
        pct: policyDist.allow.pct,
        color: CHART_COLORS.allow,
      },
      {
        action: 'REVIEW',
        label: 'REVIEW',
        count: policyDist.review.count,
        pct: policyDist.review.pct,
        color: CHART_COLORS.review,
      },
      {
        action: 'STEP-UP',
        label: 'STEP-UP',
        count: policyDist.stepUp.count,
        pct: policyDist.stepUp.pct,
        color: CHART_COLORS.accent,
      },
      {
        action: 'BLOCK',
        label: 'BLOCK',
        count: policyDist.block.count,
        pct: policyDist.block.pct,
        color: CHART_COLORS.block,
      },
    ],
    [policyDist]
  );

  return (
    <div>
      {/* Header */}
      <header className="rg-reports-header">
        <div className="rg-reports-title-group">
          <h2 className="rg-reports-title">Operational Reports &amp; Audit Exports</h2>
          <p className="rg-reports-subtitle">
            Exportable decision datasets, policy governance metrics, and processor dispute analytics.
          </p>
        </div>
        <div className="rg-reports-header-actions">
          <button
            type="button"
            onClick={handleRefreshAll}
            className="rg-reports-refresh-btn"
            aria-label="Refresh reports data"
          >
            <RefreshIcon size={14} aria-hidden="true" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rg-reports-download-btn"
            disabled={decisions.length === 0 || decisionsLoading}
            aria-label="Export loaded decisions CSV"
          >
            <DownloadIcon size={14} aria-hidden="true" />
            <span>Export Loaded Decisions ({decisions.length})</span>
          </button>
        </div>
      </header>

      {/* Section 1: Honest Top KPI Strip */}
      <section className="rg-kpi-grid rg-metrics-grid" aria-label="Operational Governance Metrics">
        <div className="rg-card" data-testid="kpi-total-decisions">
          <div className="rg-card-title">Total Evaluated Decisions (Historical)</div>
          <div className="rg-card-value">
            {summaryLoading ? '—' : totalDecisions.toLocaleString()}
          </div>
          <div className="rg-card-subtitle">Cumulative lifetime decisions scored</div>
        </div>

        <div className="rg-card" data-testid="kpi-allow-share">
          <div className="rg-card-title">ALLOW Decision Share</div>
          <div className="rg-card-value" style={{ color: 'var(--rg-low-text)' }}>
            {summaryLoading ? '—' : totalDecisions > 0 ? `${allowSharePct.toFixed(1)}%` : '—'}
          </div>
          <div className="rg-card-subtitle">
            {summaryLoading
              ? '—'
              : `${allowCount.toLocaleString()} of ${totalDecisions.toLocaleString()} decisions`}
          </div>
        </div>

        <div className="rg-card" data-testid="kpi-total-disputes">
          <div className="rg-card-title">Recorded Disputes</div>
          <div className="rg-card-value">
            {trendsLoading ? '—' : totalDisputes.toLocaleString()}
          </div>
          <div className="rg-card-subtitle">
            {trendsLoading ? '—' : `Dispute rate: ${disputeRatePct.toFixed(2)}%`}
          </div>
        </div>

        <div className="rg-card" data-testid="kpi-disputed-volume">
          <div className="rg-card-title">Disputed Volume</div>
          <div
            className="rg-card-value"
            style={{ color: disputedAmount > 0 ? 'var(--rg-high-text)' : 'var(--rg-text-primary)' }}
          >
            {trendsLoading
              ? '—'
              : `${disputeCurrency} ${disputedAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </div>
          <div className="rg-card-subtitle">Aggregate merchant dispute exposure</div>
        </div>
      </section>

      {/* Loading state indicator */}
      {isOverallLoading && (
        <div className="rg-loading-state" role="status" aria-live="polite">
          Loading operational report metrics...
        </div>
      )}

      {/* Error state */}
      {(summaryError || trendsError || decisionsError) && (
        <div className="rg-error-state" role="alert" style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600 }}>
            Failed to load reports data
          </h4>
          <p style={{ margin: '0 0 10px 0', fontSize: 13 }}>
            {summaryError?.message || trendsError?.message || decisionsError?.message}
          </p>
          <button type="button" onClick={handleRefreshAll} className="rg-retry-btn">
            <RefreshIcon size={14} aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Section 2: Full-Width Primary Export Center Hero */}
      <section className="rg-reports-hero-card" aria-label="Decisions Export Center">
        <div className="rg-reports-card-header">
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600 }}>
              Decisions Audit Dataset Export Center
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
              Export the currently loaded page of risk decisions for offline compliance, fraud audits, and model governance.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="rg-reports-badge rg-reports-badge-accent">
              Single Batch (Max 50 Records)
            </span>
            <span className="rg-reports-badge">
              RFC 4180 / CWE-1236 Protected
            </span>
          </div>
        </div>

        {exportNotice && (
          <div className="rg-review-alert-success" role="status">
            {exportNotice}
          </div>
        )}

        {/* Visualization C: 4-Stage Export Governance Pipeline */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rg-text-secondary)', marginBottom: 8 }}>
            Export Governance &amp; PII-Scrubbing Pipeline:
          </div>
          <div
            className="rg-reports-pipeline-flow"
            role="region"
            aria-label="Export data governance and sanitization pipeline"
          >
            {EXPORT_PIPELINE_STAGES.map((st) => (
              <div key={st.id} className="rg-reports-pipeline-node">
                <div className="rg-reports-pipeline-node-header">
                  <span className="rg-reports-pipeline-step-badge">{st.step}</span>
                  <span className="rg-reports-pipeline-node-subtitle">{st.subtitle}</span>
                </div>
                <h4 className="rg-reports-pipeline-node-title">{st.title}</h4>
                <p className="rg-reports-pipeline-node-desc">
                  {st.id === 'ingestion'
                    ? `${decisions.length} / 50 records loaded (single page limit)`
                    : st.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 12 Attribute Schema Chips */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rg-text-secondary)', marginBottom: 6 }}>
            Exported Dataset Schema (12 Attributes):
          </div>
          <div className="rg-reports-columns-wrap">
            {EXPORTED_CSV_COLUMNS.map((col) => (
              <span key={col} className="rg-reports-column-chip">
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Privacy Assurance Box */}
        <div className="rg-reports-privacy-box">
          <LockIcon size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>
            <strong>Privacy Assurance:</strong> Export is strictly non-PII. Customer names, emails, phones, and physical addresses are excluded.
          </span>
        </div>

        {/* Download Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--rg-text-muted)' }}>
            Current batch: <strong>{decisions.length} / 50</strong> loaded decisions available for export.
          </span>
          <button
            type="button"
            onClick={handleExport}
            className="rg-reports-download-btn"
            disabled={decisions.length === 0 || decisionsLoading}
          >
            <DownloadIcon size={14} aria-hidden="true" />
            <span>Download CSV ({decisions.length} Records)</span>
          </button>
        </div>
      </section>

      {/* Section 3: Two-Column Analytical Governance Grid */}
      <div className="rg-reports-analytical-grid">
        {/* Card A: Policy Action Governance */}
        <section className="rg-card" aria-label="Policy Action Governance">
          <div className="rg-reports-card-header">
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 600 }}>
                Policy Action Governance
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--rg-text-muted)' }}>
                Distribution of risk engine policy actions across all evaluated decisions.
              </p>
            </div>
            <span className="rg-reports-badge">Policy Engine</span>
          </div>

          {/* Visualization A: Policy Action Recharts Bar Visualization */}
          <div style={{ marginBottom: 16 }}>
            <ChartContainer
              title="Policy Decision Distribution"
              subtitle="Evaluated policy action share across lifetime transactions"
              height={250}
              loading={trendsLoading || summaryLoading}
              empty={policyDist.isEmpty}
              emptyTitle="No evaluated decisions"
              emptyMessage="Policy recommendations will populate as transactions are scored."
              ariaLabel={policyDist.accessibleLabel}
              ariaDescription="Distribution across ALLOW, REVIEW, STEP-UP, and BLOCK recommendations."
            >
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={policyChartData} margin={{ top: 12, right: 16, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_CSS_VARS.grid} vertical={false} />
                  <XAxis dataKey="label" stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} />
                  <YAxis stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    content={
                      <ChartTooltip
                        formatter={(val, _name, item) => [
                          `${Number(val).toLocaleString()} decisions (${item.payload?.pct.toFixed(1)}%)`,
                          item.payload?.action,
                        ]}
                      />
                    }
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {policyChartData.map((entry) => (
                      <Cell key={entry.action} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend
                items={policyChartData.map((d) => ({
                  id: d.action,
                  value: d.action,
                  count: d.count,
                  percentage: d.pct,
                  color: d.color,
                  formattedValue: `${d.count.toLocaleString()} (${d.pct.toFixed(1)}%)`,
                }))}
                showValues
                showPercentages
                align="center"
              />
            </ChartContainer>
          </div>

          <table className="rg-reports-stat-table" aria-label="Policy recommendations breakdown">
            <tbody>
              <tr>
                <td className="rg-reports-stat-label">ALLOW Recommendations</td>
                <td className="rg-reports-stat-value" style={{ color: 'var(--rg-low-text)' }}>
                  {policyDist.allow.count.toLocaleString()} ({policyDist.allow.pct.toFixed(1)}%)
                </td>
              </tr>
              <tr>
                <td className="rg-reports-stat-label">REVIEW Recommendations</td>
                <td className="rg-reports-stat-value" style={{ color: 'var(--rg-med-text)' }}>
                  {policyDist.review.count.toLocaleString()} ({policyDist.review.pct.toFixed(1)}%)
                </td>
              </tr>
              <tr>
                <td className="rg-reports-stat-label">STEP-UP VERIFICATION</td>
                <td className="rg-reports-stat-value" style={{ color: 'var(--rg-accent)' }}>
                  {policyDist.stepUp.count.toLocaleString()} ({policyDist.stepUp.pct.toFixed(1)}%)
                </td>
              </tr>
              <tr>
                <td className="rg-reports-stat-label">BLOCK Recommendations</td>
                <td className="rg-reports-stat-value" style={{ color: 'var(--rg-high-text)' }}>
                  {policyDist.block.count.toLocaleString()} ({policyDist.block.pct.toFixed(1)}%)
                </td>
              </tr>
              <tr>
                <td className="rg-reports-stat-label">Critical Tier (CRITICAL)</td>
                <td className="rg-reports-stat-value">
                  {(tierDist.CRITICAL || 0).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="rg-reports-stat-label">High Risk Tier (HIGH)</td>
                <td className="rg-reports-stat-value">
                  {(tierDist.HIGH || 0).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="rg-reports-stat-label">Average Risk Score</td>
                <td className="rg-reports-stat-value">
                  {(summary?.average_risk_score ?? 0).toFixed(4)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="rg-reports-notice-box">
            <InfoIcon size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Policy decisions reflect ReturnGuard fraud evaluations. They represent risk recommendations and do not imply payment authorization or bank settlement.
            </span>
          </div>
        </section>

        {/* Card B: Dispute & Processor Analytics */}
        <section className="rg-card" aria-label="Dispute &amp; Chargeback Analytics">
          <div className="rg-reports-card-header">
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 600 }}>
                Dispute &amp; Chargeback Analytics
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--rg-text-muted)' }}>
                Aggregated dispute records received from merchant processor webhooks.
              </p>
            </div>
            <span className="rg-reports-badge">Gateway Relay</span>
          </div>

          {/* Visualization B: Processor Dispute Compliance Range Meter */}
          <div className="rg-reports-meter-container">
            <div className="rg-reports-meter-status">
              <span style={{ fontWeight: 600, color: 'var(--rg-text-secondary)' }}>
                Dispute Rate Exposure
              </span>
              <span
                style={{
                  fontFamily: 'var(--rg-font-mono)',
                  fontSize: 11,
                  color: disputeMeter.isZeroDisputes
                    ? 'var(--rg-low-text)'
                    : disputeMeter.isExceedingCritical
                    ? 'var(--rg-high-text)'
                    : 'var(--rg-text-primary)',
                }}
              >
                {disputeMeter.statusMessage}
              </span>
            </div>

            <div
              className="rg-reports-meter-track"
              role="img"
              aria-label={disputeMeter.accessibleLabel}
            >
              {/* Early Warning Reference line (0.65%) */}
              <div
                className="rg-reports-meter-threshold rg-reports-meter-threshold-warning"
                style={{ left: `${disputeMeter.warningMarkerPct}%` }}
                title="Early Warning Reference Threshold (0.65%)"
              />
              {/* Critical Reference line (0.90%) */}
              <div
                className="rg-reports-meter-threshold rg-reports-meter-threshold-critical"
                style={{ left: `${disputeMeter.criticalMarkerPct}%` }}
                title="Excessive Dispute Reference Threshold (0.90%)"
              />
              {/* Active dispute rate marker */}
              <div
                className="rg-reports-meter-marker"
                style={{ left: `${disputeMeter.clampedPositionPct}%` }}
                title={`Active Dispute Rate: ${disputeMeter.ratePct.toFixed(2)}%`}
              />
            </div>

            <div className="rg-reports-meter-labels" aria-hidden="true">
              <span>0.00%</span>
              <span style={{ color: 'var(--rg-med-text)' }}>0.65% (Warning Ref)</span>
              <span style={{ color: 'var(--rg-high-text)' }}>0.90% (Critical Ref)</span>
              <span>{disputeMeter.scaleMaxPct.toFixed(2)}%</span>
            </div>
          </div>

          <table className="rg-reports-stat-table" aria-label="Dispute analytics breakdown">
            <tbody>
              <tr>
                <td className="rg-reports-stat-label">Total Disputes Recorded</td>
                <td className="rg-reports-stat-value">
                  {disputeMeter.totalDisputes.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="rg-reports-stat-label">Total Disputed Amount</td>
                <td
                  className="rg-reports-stat-value"
                  style={{ color: disputeMeter.disputedAmount > 0 ? 'var(--rg-high-text)' : 'inherit' }}
                >
                  {disputeMeter.currency} {disputeMeter.disputedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td className="rg-reports-stat-label">Dispute Rate</td>
                <td className="rg-reports-stat-value">
                  {disputeMeter.ratePct.toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="rg-reports-stat-label">Processor Currency</td>
                <td className="rg-reports-stat-value">
                  {disputeMeter.currency}
                </td>
              </tr>
              <tr>
                <td className="rg-reports-stat-label">Monitoring Status</td>
                <td
                  className="rg-reports-stat-value"
                  style={{
                    color: disputeMeter.isZeroDisputes
                      ? 'var(--rg-low-text)'
                      : disputeMeter.isExceedingCritical
                      ? 'var(--rg-high-text)'
                      : 'var(--rg-med-text)',
                  }}
                >
                  {disputeMeter.isZeroDisputes
                    ? 'Clean Processor Status'
                    : disputeMeter.isExceedingCritical
                    ? 'Exceeds Reference Ceiling'
                    : 'Within Reference Limits'}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="rg-reports-notice-box">
            <AlertTriangleIcon size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Dispute records are populated via processor webhooks. Reference levels (0.65% early warning, 0.90% critical) reflect standard payment network dispute monitoring program thresholds. Historical time-series trend is omitted due to zero recorded disputes and absence of multi-period dispute telemetry.
            </span>
          </div>
        </section>
      </div>

      {/* Section 4: Subtle Tenant Scope & Domain Governance Footer */}
      <section className="rg-reports-footer-card" aria-label="Domain &amp; Volume Governance">
        <div className="rg-reports-card-header">
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600 }}>
              Domain &amp; Volume Governance
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--rg-text-muted)' }}>
              Tenant data partitioning and evaluated monetary volume disclosure.
            </p>
          </div>
          <span className="rg-reports-badge">Tenant Isolated</span>
        </div>

        <table className="rg-reports-stat-table" aria-label="Evaluated volume and domain boundaries">
          <tbody>
            <tr>
              <td className="rg-reports-stat-label">Cumulative Evaluated Order Volume</td>
              <td className="rg-reports-stat-value">
                INR {totalVolumeInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td className="rg-reports-stat-label">Tenant Scope</td>
              <td className="rg-reports-stat-value" style={{ fontFamily: 'var(--rg-font-mono)' }}>
                {summary?.tenant_id || 'merch_legacy'}
              </td>
            </tr>
            <tr>
              <td className="rg-reports-stat-label">Serving Model</td>
              <td className="rg-reports-stat-value" style={{ fontFamily: 'var(--rg-font-mono)' }}>
                candidate_lgbm_v1
              </td>
            </tr>
            <tr>
              <td className="rg-reports-stat-label">Model Verification Mode</td>
              <td className="rg-reports-stat-value">
                Active (Shadow Mode)
              </td>
            </tr>
          </tbody>
        </table>

        <div className="rg-reports-notice-box">
          <ShieldIcon size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Evaluated volume is aggregated from order records within the tenant partition. Individual risk score events store feature snapshots and ML reason codes rather than raw payment credentials.
          </span>
        </div>
      </section>
    </div>
  );
};

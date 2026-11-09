import React, { useMemo } from 'react';
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
import { useRiskTrends, useRiskSummary } from '../hooks';
import { RefreshIcon } from './icons';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  CHART_COLORS,
  CHART_CSS_VARS,
  calculatePercentage,
  formatMetricValue,
} from './charts';

export const RiskAnalyticsPage: React.FC = () => {
  const { data: trendsData, loading: trendsLoading, error: trendsError, refetch: refetchTrends } = useRiskTrends();
  const { data: summaryData, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useRiskSummary();

  const loading = trendsLoading || summaryLoading;
  const error = trendsError || summaryError;

  const handleRefetch = () => {
    refetchTrends();
    refetchSummary();
  };

  const trends = trendsData?.daily_trends || [];
  const scoreDist = trendsData?.score_distribution || { low_0_15: 0, med_15_40: 0, high_40_80: 0, crit_80_100: 0 };
  const channels = trendsData?.channel_breakdown || { paypal: 0, cod: 0, other: 0 };
  const disputes = trendsData?.dispute_analytics || { total_disputes: 0, disputed_amount: 0, currency: 'INR', dispute_rate_pct: 0 };
  const tierDist = summaryData?.tier_distribution || {};

  const totalScores = scoreDist.low_0_15 + scoreDist.med_15_40 + scoreDist.high_40_80 + scoreDist.crit_80_100;
  const totalChannels = (channels.paypal || 0) + (channels.cod || 0) + (channels.other || 0);

  // 1. Histogram data mapping (4 score bands) - Top-level hook
  const histogramData = useMemo(
    () => [
      {
        band: '0.00 – 0.15',
        tier: 'Low Risk',
        count: scoreDist.low_0_15,
        pct: calculatePercentage(scoreDist.low_0_15, totalScores),
        color: CHART_COLORS.allow,
        dotClass: 'rg-risk-dot-low',
      },
      {
        band: '0.15 – 0.40',
        tier: 'Medium Risk',
        count: scoreDist.med_15_40,
        pct: calculatePercentage(scoreDist.med_15_40, totalScores),
        color: CHART_COLORS.review,
        dotClass: 'rg-risk-dot-medium',
      },
      {
        band: '0.40 – 0.80',
        tier: 'High Risk',
        count: scoreDist.high_40_80,
        pct: calculatePercentage(scoreDist.high_40_80, totalScores),
        color: CHART_COLORS.block,
        dotClass: 'rg-risk-dot-high',
      },
      {
        band: '0.80 – 1.00',
        tier: 'Critical Risk',
        count: scoreDist.crit_80_100,
        pct: calculatePercentage(scoreDist.crit_80_100, totalScores),
        color: CHART_COLORS.critical,
        dotClass: 'rg-risk-dot-critical',
      },
    ],
    [scoreDist, totalScores]
  );

  // 2. Channel comparison data mapping - Top-level hook
  const channelData = useMemo(
    () => [
      {
        channel: 'PayPal',
        count: channels.paypal || 0,
        pct: calculatePercentage(channels.paypal || 0, totalChannels),
        color: CHART_COLORS.paypal,
      },
      {
        channel: 'COD',
        count: channels.cod || 0,
        pct: calculatePercentage(channels.cod || 0, totalChannels),
        color: CHART_COLORS.cod,
      },
      {
        channel: 'Other',
        count: channels.other || 0,
        pct: calculatePercentage(channels.other || 0, totalChannels),
        color: CHART_COLORS.other,
      },
    ],
    [channels, totalChannels]
  );

  // 3. Backend Policy Tier Distribution mapping - Top-level hook
  const tierData = useMemo(() => {
    const totalTiers = Object.values(tierDist).reduce((sum, v) => sum + (v || 0), 0) || totalScores;
    return [
      {
        tier: 'LOW',
        label: 'Low Tier',
        count: tierDist['LOW'] || 0,
        pct: calculatePercentage(tierDist['LOW'] || 0, totalTiers),
        color: CHART_COLORS.allow,
      },
      {
        tier: 'MEDIUM',
        label: 'Medium Tier',
        count: tierDist['MEDIUM'] || 0,
        pct: calculatePercentage(tierDist['MEDIUM'] || 0, totalTiers),
        color: CHART_COLORS.review,
      },
      {
        tier: 'HIGH',
        label: 'High Tier',
        count: tierDist['HIGH'] || 0,
        pct: calculatePercentage(tierDist['HIGH'] || 0, totalTiers),
        color: CHART_COLORS.block,
      },
      {
        tier: 'CRITICAL',
        label: 'Critical Tier',
        count: tierDist['CRITICAL'] || 0,
        pct: calculatePercentage(tierDist['CRITICAL'] || 0, totalTiers),
        color: CHART_COLORS.critical,
      },
    ];
  }, [tierDist, totalScores]);

  // 4. Daily Activity mapping
  const isSingleDate = trends.length === 1;

  if (loading) {
    return (
      <div className="rg-loading-state" role="status" aria-live="polite">
        Loading risk analytics & trends...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rg-error-state" role="alert">
        <h4>Failed to load risk analytics</h4>
        <p>{error.message}</p>
        <button
          type="button"
          onClick={handleRefetch}
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
          Risk Analytics & Portfolio Exposure
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)', lineHeight: 1.5 }}>
          Portfolio risk score distributions, channel breakdown, and time-series scoring volumes.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="rg-kpi-grid">
        <div className="rg-card">
          <div className="rg-card-title">
            <span>Low Risk (&lt; 0.15)</span>
            <span className="rg-risk-dot rg-risk-dot-low" aria-hidden="true" />
          </div>
          <div className="rg-card-value">{scoreDist.low_0_15.toLocaleString()}</div>
          <div className="rg-card-subtitle">
            {totalScores > 0 ? ((scoreDist.low_0_15 / totalScores) * 100).toFixed(1) : '0.0'}% of portfolio
          </div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">
            <span>Medium Risk (0.15 - 0.40)</span>
            <span className="rg-risk-dot rg-risk-dot-medium" aria-hidden="true" />
          </div>
          <div className="rg-card-value">{scoreDist.med_15_40.toLocaleString()}</div>
          <div className="rg-card-subtitle">
            {totalScores > 0 ? ((scoreDist.med_15_40 / totalScores) * 100).toFixed(1) : '0.0'}% of portfolio
          </div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">
            <span>High Risk (0.40 - 0.80)</span>
            <span className="rg-risk-dot rg-risk-dot-high" aria-hidden="true" />
          </div>
          <div className="rg-card-value">{scoreDist.high_40_80.toLocaleString()}</div>
          <div className="rg-card-subtitle">
            {totalScores > 0 ? ((scoreDist.high_40_80 / totalScores) * 100).toFixed(1) : '0.0'}% of portfolio
          </div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">
            <span>Critical Risk (&gt; 0.80)</span>
            <span className="rg-risk-dot rg-risk-dot-critical" aria-hidden="true" />
          </div>
          <div className="rg-card-value">{scoreDist.crit_80_100.toLocaleString()}</div>
          <div className="rg-card-subtitle">
            {totalScores > 0 ? ((scoreDist.crit_80_100 / totalScores) * 100).toFixed(1) : '0.0'}% of portfolio
          </div>
        </div>
      </div>

      {/* Row 1: Histogram & Channel Breakdown */}
      <div className="rg-analytical-grid">
        {/* Recharts Risk Score Histogram */}
        <ChartContainer
          title="Risk Score Distribution Histogram"
          subtitle="Calibrated model score exposure across decision bands"
          height={320}
          empty={totalScores === 0}
          emptyTitle="No score events"
          emptyMessage="No risk evaluations recorded for this tenant."
          ariaLabel="Risk score histogram across 4 bands"
          ariaDescription={`Low: ${scoreDist.low_0_15}, Med: ${scoreDist.med_15_40}, High: ${scoreDist.high_40_80}, Crit: ${scoreDist.crit_80_100}`}
        >
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={histogramData} margin={{ top: 12, right: 12, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_CSS_VARS.grid} vertical={false} />
              <XAxis
                dataKey="band"
                stroke={CHART_CSS_VARS.axis}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: CHART_CSS_VARS.grid }}
              />
              <YAxis
                stroke={CHART_CSS_VARS.axis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(val, _name, item) => [
                      `${Number(val).toLocaleString()} decisions (${item.payload?.pct}%) — ${item.payload?.tier}`,
                      item.payload?.band,
                    ]}
                  />
                }
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {histogramData.map((entry) => (
                  <Cell key={entry.band} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ChartLegend
            items={histogramData.map((d) => ({
              id: d.band,
              value: `${d.band} (${d.tier})`,
              count: d.count,
              percentage: d.pct,
              color: d.color,
              formattedValue: `${d.count.toLocaleString()} (${d.pct}%)`,
            }))}
            showValues
            showPercentages
            align="center"
          />
        </ChartContainer>

        {/* Recharts Channel Breakdown & Dispute Analytics */}
        <ChartContainer
          title="Payment Channel Distribution"
          subtitle="Transaction volume distribution and recorded dispute metrics"
          height={320}
          empty={totalChannels === 0}
          emptyTitle="No channel data"
          emptyMessage="No channel volume recorded."
          ariaLabel="Payment channel distribution chart"
        >
          <ResponsiveContainer width="100%" height={170}>
            <BarChart
              data={channelData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_CSS_VARS.grid} horizontal={false} />
              <XAxis
                type="number"
                stroke={CHART_CSS_VARS.axis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="channel"
                stroke={CHART_CSS_VARS.axis}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(val, _name, item) => [
                      `${Number(val).toLocaleString()} orders (${item.payload?.pct}%)`,
                      item.payload?.channel,
                    ]}
                  />
                }
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {channelData.map((entry) => (
                  <Cell key={entry.channel} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Disputes Summary Metrics Pane */}
          <div
            style={{
              borderTop: '1px solid var(--rg-border-subtle)',
              paddingTop: 10,
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--rg-text-secondary)' }}>Recorded Disputes</span>
              <span style={{ fontWeight: 600, color: 'var(--rg-text-primary)', fontFamily: 'var(--rg-font-mono)' }}>
                {disputes.total_disputes.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--rg-text-secondary)' }}>Dispute Exposure Rate</span>
              <span
                style={{
                  fontWeight: 600,
                  fontFamily: 'var(--rg-font-mono)',
                  color: disputes.dispute_rate_pct > 0 ? 'var(--rg-high-text)' : 'var(--rg-low-text)',
                }}
              >
                {disputes.dispute_rate_pct.toFixed(2)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--rg-text-secondary)' }}>Disputed Volume</span>
              <span className="rg-font-mono" style={{ color: 'var(--rg-text-muted)' }}>
                {formatMetricValue(disputes.disputed_amount, 'currency', disputes.currency || 'INR')}
              </span>
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* Row 2: Policy Tier Mapping & Daily Scoring Activity */}
      <div className="rg-analytical-grid">
        {/* Backend Policy Tier Distribution (Complementary to Raw Score Bands) */}
        <div className="rg-card">
          <h3 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600 }}>Backend Policy Tier Mapping</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--rg-text-muted)' }}>
            Enforced policy risk tiers combining ML scores with deterministic fraud rules
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tierData.map((t) => (
              <div key={t.tier} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        backgroundColor: t.color,
                        display: 'inline-block',
                      }}
                      aria-hidden="true"
                    />
                    <span style={{ fontWeight: 500, color: 'var(--rg-text-secondary)' }}>{t.label}</span>
                    <span className="rg-font-mono" style={{ fontSize: 10, color: 'var(--rg-text-muted)' }}>
                      ({t.tier})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--rg-text-muted)' }}>{t.pct}%</span>
                    <strong style={{ minWidth: 28, textAlign: 'right', color: 'var(--rg-text-primary)' }}>
                      {t.count.toLocaleString()}
                    </strong>
                  </div>
                </div>
                <div className="rg-meter-track">
                  <div
                    className="rg-meter-fill"
                    style={{
                      width: `${t.pct}%`,
                      backgroundColor: t.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Activity / Historical Trend Accumulation Chart */}
        <ChartContainer
          title="Daily Scoring Activity"
          subtitle="Time-series scoring activity and daily exception flagging rates"
          height={320}
          empty={trends.length === 0}
          emptyTitle="No daily activity"
          emptyMessage="No time-series scoring events recorded."
          ariaLabel="Daily scoring activity chart"
        >
          {isSingleDate ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <div className="rg-trend-notice" role="status">
                  <span aria-hidden="true">ℹ</span>
                  <span>Historical trend accumulation in progress — 1 day recorded.</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--rg-text-secondary)', marginBottom: 12 }}>
                  Discrete evaluation volume recorded for calendar day{' '}
                  <strong className="rg-font-mono" style={{ color: 'var(--rg-text-primary)' }}>
                    {trends[0].date}
                  </strong>
                  :
                </div>
              </div>

              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={[
                    {
                      date: trends[0].date,
                      'Total Scored': trends[0].total_scored,
                      Flagged: trends[0].flagged,
                      Blocked: trends[0].blocked,
                    },
                  ]}
                  margin={{ top: 8, right: 16, left: -16, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_CSS_VARS.grid} vertical={false} />
                  <XAxis dataKey="date" stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} />
                  <YAxis stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    content={
                      <ChartTooltip
                        formatter={(val, name) => [`${Number(val).toLocaleString()} events`, name]}
                      />
                    }
                  />
                  <Bar dataKey="Total Scored" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="Flagged" fill={CHART_COLORS.review} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="Blocked" fill={CHART_COLORS.block} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>

              <ChartLegend
                items={[
                  { id: 'total', value: 'Total Scored', count: trends[0].total_scored, color: CHART_COLORS.accent },
                  { id: 'flagged', value: 'Flagged for Review', count: trends[0].flagged, color: CHART_COLORS.review },
                  { id: 'blocked', value: 'Blocked', count: trends[0].blocked, color: CHART_COLORS.block },
                ]}
                showValues
                align="center"
              />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={trends} margin={{ top: 12, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_CSS_VARS.grid} vertical={false} />
                <XAxis dataKey="date" stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} />
                <YAxis stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="total_scored" name="Total Scored" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="flagged" name="Flagged" fill={CHART_COLORS.review} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="blocked" name="Blocked" fill={CHART_COLORS.block} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* Daily Volume Trends Table (Preserved for Operational Auditability) */}
      <div className="rg-card">
        <h3 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600 }}>Daily Transaction & Flagging Trends</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--rg-text-muted)' }}>
          Detailed record log of time-series scoring activity and daily exception flagging rates
        </p>

        {trends.length === 0 ? (
          <div style={{ color: 'var(--rg-text-muted)', fontSize: 13, padding: '16px 0' }}>
            No daily scoring events recorded yet.
          </div>
        ) : (
          <div className="rg-table-container">
            <table className="rg-data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Scored</th>
                  <th>Flagged</th>
                  <th>Blocked</th>
                  <th>Flag Rate</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((t) => {
                  const rate = t.total_scored > 0 ? ((t.flagged / t.total_scored) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={t.date}>
                      <td className="rg-font-mono" style={{ fontWeight: 500 }}>{t.date}</td>
                      <td>{t.total_scored.toLocaleString()}</td>
                      <td style={{ color: t.flagged > 0 ? 'var(--rg-med-text)' : 'inherit', fontWeight: t.flagged > 0 ? 600 : 'normal' }}>
                        {t.flagged.toLocaleString()}
                      </td>
                      <td style={{ color: t.blocked > 0 ? 'var(--rg-high-text)' : 'inherit', fontWeight: t.blocked > 0 ? 600 : 'normal' }}>
                        {t.blocked.toLocaleString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{rate}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

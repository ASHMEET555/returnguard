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
import { useRiskTrends } from '../hooks';
import { RefreshIcon, InfoIcon } from './icons';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  CHART_COLORS,
  CHART_CSS_VARS,
} from './charts';

export const PaymentPipelinePage: React.FC = () => {
  const { data, loading, error, refetch } = useRiskTrends();

  const channels = data?.channel_breakdown;
  const disputes = data?.dispute_analytics;

  // Defensive extraction of counts
  const paypalCount = Math.max(0, typeof channels?.paypal === 'number' ? channels.paypal : 0);
  const codCount = Math.max(0, typeof channels?.cod === 'number' ? channels.cod : 0);
  const otherCount = Math.max(0, typeof channels?.other === 'number' ? channels.other : 0);

  const channelSum = paypalCount + codCount + otherCount;

  // Total evaluated decisions: exact sum of all partitioned channel evaluations
  const totalDecisions = channelSum;

  // Safe percentages calculation (guaranteed no division-by-zero or NaN)
  const paypalPct = channelSum > 0 ? (paypalCount / channelSum) * 100 : 0;
  const codPct = channelSum > 0 ? (codCount / channelSum) * 100 : 0;
  const otherPct = channelSum > 0 ? (otherCount / channelSum) * 100 : 0;

  // Structured Recharts channel comparison dataset (top-level hook)
  const channelChartData = useMemo(
    () => [
      {
        channel: 'PayPal',
        label: 'PayPal Channel',
        count: paypalCount,
        pct: paypalPct,
        color: CHART_COLORS.paypal,
      },
      {
        channel: 'COD',
        label: 'Cash on Delivery',
        count: codCount,
        pct: codPct,
        color: CHART_COLORS.cod,
      },
      {
        channel: 'Other',
        label: 'Web & Other Relayed',
        count: otherCount,
        pct: otherPct,
        color: CHART_COLORS.other,
      },
    ],
    [paypalCount, codCount, otherCount, paypalPct, codPct, otherPct]
  );

  // Dispute metrics
  const totalDisputes = Math.max(0, typeof disputes?.total_disputes === 'number' ? disputes.total_disputes : 0);
  const disputedAmount = Math.max(0, typeof disputes?.disputed_amount === 'number' ? disputes.disputed_amount : 0);
  const disputeCurrency = disputes?.currency || 'INR';
  const disputeRatePct = Math.max(0, typeof disputes?.dispute_rate_pct === 'number' ? disputes.dispute_rate_pct : 0);

  return (
    <div className="rg-pipeline-page" data-testid="payment-pipeline-page">
      {/* Workspace Header */}
      <header className="rg-pipeline-header">
        <div className="rg-pipeline-title-group">
          <h2 className="rg-pipeline-title">Payment Pipeline &amp; Processor Lifecycle</h2>
          <p className="rg-pipeline-subtitle">
            ReturnGuard evaluates transaction risk prior to downstream payment execution. Gateways and acquirers independently control payment authorization, capture, and settlement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rg-pipeline-refresh-btn"
          aria-label="Refresh payment pipeline analytics"
        >
          <RefreshIcon size={14} aria-hidden="true" />
          <span>Refresh Analytics</span>
        </button>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="rg-card rg-loading-state" role="status" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--rg-text-secondary)' }}>
            Loading payment pipeline metrics...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          className="rg-card rg-error-state"
          role="alert"
          style={{ padding: 24, marginBottom: 24, borderLeft: '3px solid var(--rg-high-text)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--rg-high-text)' }}>
                Failed to load payment pipeline analytics
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
                {error.message || 'An unexpected error occurred while communicating with the analytics service.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="rg-pipeline-refresh-btn"
              style={{ marginTop: 0 }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Strip */}
      <section className="rg-kpi-grid" aria-label="Pipeline Summary Metrics">
        <div className="rg-card" data-testid="kpi-total-decisions">
          <div className="rg-card-title">Total Evaluated Decisions</div>
          <div className="rg-card-value">
            {loading ? '—' : totalDecisions.toLocaleString()}
          </div>
          <div className="rg-card-subtitle">Scored transactions across all channels</div>
        </div>

        <div className="rg-card" data-testid="kpi-paypal-decisions">
          <div className="rg-card-title">PayPal Channel Decisions</div>
          <div className="rg-card-value">
            {loading ? '—' : paypalCount.toLocaleString()}
          </div>
          <div className="rg-card-subtitle">Scored transactions via PayPal channel</div>
        </div>

        <div className="rg-card" data-testid="kpi-cod-decisions">
          <div className="rg-card-title">COD Channel Decisions</div>
          <div className="rg-card-value">
            {loading ? '—' : codCount.toLocaleString()}
          </div>
          <div className="rg-card-subtitle">Cash-on-Delivery pre-dispatch evaluations</div>
        </div>

        <div className="rg-card" data-testid="kpi-dispute-rate">
          <div className="rg-card-title">Dispute Rate</div>
          <div className="rg-card-value" style={{ color: disputeRatePct > 1 ? 'var(--rg-high-text)' : 'var(--rg-text-primary)' }}>
            {loading ? '—' : `${disputeRatePct.toFixed(2)}%`}
          </div>
          <div className="rg-card-subtitle">
            {loading ? '—' : `${totalDisputes} recorded disputes vs evaluated volume`}
          </div>
        </div>
      </section>

      {/* Domain Architecture Explanation Panel */}
      <section className="rg-card rg-pipeline-lifecycle-card" aria-label="Decoupled Risk & Execution Lifecycle">
        <div className="rg-pipeline-lifecycle-header">
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 600 }}>
              Decoupled Risk &amp; Payment Execution Lifecycle
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--rg-text-muted)' }}>
              Operational separation between ReturnGuard pre-decision evaluation and merchant payment settlement.
            </p>
          </div>
        </div>

        <div className="rg-pipeline-stages-grid">
          <div className="rg-pipeline-stage-card">
            <span className="rg-pipeline-stage-step rg-pipeline-stage-step-accent">Stage 1: Checkout</span>
            <h4 className="rg-pipeline-stage-title">Order Ingestion</h4>
            <p className="rg-pipeline-stage-desc">
              Customer initiates checkout via PayPal, Cash-on-Delivery, or web card gateway.
            </p>
            <div className="rg-pipeline-stage-actor">Actor: Customer &amp; Storefront</div>
          </div>

          <div className="rg-pipeline-stage-card">
            <span className="rg-pipeline-stage-step rg-pipeline-stage-step-emerald">Stage 2: ReturnGuard</span>
            <h4 className="rg-pipeline-stage-title">Pre-Decision Evaluation</h4>
            <p className="rg-pipeline-stage-desc">
              LightGBM ML model and deterministic rules evaluate fraud risk, velocity, and policy recommendations.
            </p>
            <div className="rg-pipeline-stage-actor">Actor: ReturnGuard Risk Engine</div>
          </div>

          <div className="rg-pipeline-stage-card">
            <span className="rg-pipeline-stage-step rg-pipeline-stage-step-amber">Stage 3: Merchant</span>
            <h4 className="rg-pipeline-stage-title">Policy Orchestration</h4>
            <p className="rg-pipeline-stage-desc">
              Merchant reviews policy recommendations (ALLOW, REVIEW, BLOCK, STEP_UP_VERIFICATION) and gates fulfillment.
            </p>
            <div className="rg-pipeline-stage-actor">Actor: Merchant Risk Operations</div>
          </div>

          <div className="rg-pipeline-stage-card">
            <span className="rg-pipeline-stage-step rg-pipeline-stage-step-indigo">Stage 4: Processor</span>
            <h4 className="rg-pipeline-stage-title">Payment Execution</h4>
            <p className="rg-pipeline-stage-desc">
              External payment gateways (PayPal, Stripe) or logistics carriers execute capture, void, settlement, or cash collection.
            </p>
            <div className="rg-pipeline-stage-actor">Actor: Downstream Acquirers &amp; Couriers</div>
          </div>
        </div>

        <div className="rg-pipeline-boundary-notice">
          <InfoIcon size={16} className="rg-pipeline-boundary-icon" aria-hidden="true" />
          <div className="rg-pipeline-boundary-text">
            <strong>Decoupled Architecture Boundary:</strong> ReturnGuard operates exclusively as an intelligent pre-decision risk scoring engine. A policy recommendation of ALLOW indicates a low evaluated risk profile; it does not represent payment authorization, settlement, or gateway capture execution.
          </div>
        </div>
      </section>

      {/* Channel Volume & Dispute Analytics Grid */}
      <div className="rg-pipeline-analytics-grid">
        {/* Channel Decision Distribution Recharts Visualization */}
        <ChartContainer
          title="Channel Decision Distribution"
          subtitle="Proportional transaction volume and evaluation decisions across origin channels"
          height={260}
          loading={loading}
          empty={channelSum === 0}
          emptyTitle="No channel decisions recorded"
          emptyMessage="Evaluations will populate automatically as transactions are scored for this tenant."
          ariaLabel={`Payment channel distribution: PayPal ${paypalCount} (${paypalPct.toFixed(1)}%), COD ${codCount} (${codPct.toFixed(1)}%), Other ${otherCount} (${otherPct.toFixed(1)}%)`}
          ariaDescription="Evaluated transaction breakdown by origin channel."
        >
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={channelChartData} margin={{ top: 12, right: 16, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_CSS_VARS.grid} vertical={false} />
              <XAxis dataKey="channel" stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} />
              <YAxis stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(val, _name, item) => [
                      `${Number(val).toLocaleString()} decisions (${item.payload?.pct.toFixed(1)}%)`,
                      item.payload?.label,
                    ]}
                  />
                }
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {channelChartData.map((entry) => (
                  <Cell key={entry.channel} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ChartLegend
            items={channelChartData.map((d) => ({
              id: d.channel,
              value: d.label,
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

        {/* Dispute & Settlement Analytics Summary */}
        <section className="rg-card" aria-label="Processor Dispute Analytics">
          <h3 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 600 }}>Processor Dispute Analytics</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--rg-text-secondary)' }}>
            Aggregate dispute volume reported from external payment gateway relays.
          </p>

          <div className="rg-dispute-stat-list">
            <div className="rg-dispute-stat-item">
              <span className="rg-dispute-stat-label">Total Recorded Disputes</span>
              <span className={`rg-dispute-stat-value ${totalDisputes > 0 ? 'rg-dispute-stat-value-high' : ''}`}>
                {totalDisputes.toLocaleString()}
              </span>
            </div>

            <div className="rg-dispute-stat-item">
              <span className="rg-dispute-stat-label">Disputed Volume</span>
              <span className="rg-dispute-stat-value">
                {disputeCurrency} {disputedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="rg-dispute-stat-item">
              <span className="rg-dispute-stat-label">Aggregate Dispute Rate</span>
              <span className={`rg-dispute-stat-value ${disputeRatePct > 1 ? 'rg-dispute-stat-value-high' : ''}`}>
                {disputeRatePct.toFixed(2)}%
              </span>
            </div>

            <div className="rg-dispute-stat-item">
              <span className="rg-dispute-stat-label">Currency Standard</span>
              <span className="rg-dispute-stat-value" style={{ fontFamily: 'var(--rg-font-mono)' }}>
                {disputeCurrency} (Tenant Base)
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

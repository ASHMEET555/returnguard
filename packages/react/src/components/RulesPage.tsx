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
import { RiskBadge } from './RiskBadge';
import { LockIcon } from './icons';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  CHART_COLORS,
  CHART_CSS_VARS,
} from './charts';

interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  severity: string;
  action: string;
  threshold: string;
  status: string;
}

export const RulesPage: React.FC = () => {
  // Built from verified rule engine contracts in rules/engine.py, ml/evaluation/policy.py & 01-brief.md
  const rules: RuleDefinition[] = useMemo(
    () => [
      {
        id: 'RULE_VELOCITY_SPIKE',
        name: 'Spike Velocity Rule',
        description: 'Flags transactions when order velocity exceeds 3 orders in 10 minutes or 5 in 1 hour.',
        severity: 'HIGH',
        action: 'STEP_UP_VERIFICATION',
        threshold: 'Velocity > 3.0',
        status: 'ACTIVE',
      },
      {
        id: 'RULE_HIGH_AMOUNT_THRESHOLD',
        name: 'High Transaction Value Hold',
        description: 'Requires manual review when order amount exceeds 80th percentile threshold without established tenure.',
        severity: 'HIGH',
        action: 'REVIEW',
        threshold: 'Amount > ₹15,000 / $250',
        status: 'ACTIVE',
      },
      {
        id: 'RULE_COLD_START_TENURE',
        name: 'Cold-Start New Account Surveillance',
        description: 'Applies monitoring tier to accounts created within the past 48 hours.',
        severity: 'MEDIUM',
        action: 'ALLOW_WITH_MONITORING',
        threshold: 'Account Age < 48h',
        status: 'ACTIVE',
      },
      {
        id: 'RULE_CRITICAL_RISK_BLOCK',
        name: 'Critical ML Score Block Recommendation',
        description: 'Recommends merchant capture hold when ML risk score exceeds 0.80.',
        severity: 'CRITICAL',
        action: 'BLOCK',
        threshold: 'Risk Score >= 0.80',
        status: 'ACTIVE',
      },
      {
        id: 'RULE_ADDRESS_NORMALIZATION_MISMATCH',
        name: 'Cross-State Postal Hash Inconsistency',
        description: 'Detects delivery address alterations differing from historical device location signatures.',
        severity: 'MEDIUM',
        action: 'REVIEW',
        threshold: 'Address Hash Delta > 0',
        status: 'ACTIVE',
      },
    ],
    []
  );

  // Tenant-scoped analytics integration
  const { data: trendsData, loading: trendsLoading } = useRiskTrends();
  const { data: summaryData } = useRiskSummary();

  // Aggregate policy action distribution across all 4 API-supported actions
  const policyStats = useMemo(() => {
    const rawBreakdown = trendsData?.policy_breakdown;
    let allow = 0;
    let review = 0;
    let stepUp = 0;
    let block = 0;

    if (rawBreakdown && Object.keys(rawBreakdown).length > 0) {
      Object.entries(rawBreakdown).forEach(([action, count]) => {
        const act = action.toUpperCase();
        if (act.includes('STEP_UP')) {
          stepUp += count;
        } else if (act.includes('ALLOW')) {
          allow += count;
        } else if (act.includes('BLOCK')) {
          block += count;
        } else if (act.includes('REVIEW')) {
          review += count;
        } else {
          review += count;
        }
      });
    } else if (summaryData) {
      allow = summaryData.allow_count ?? 0;
      review = summaryData.review_count ?? 0;
      block = summaryData.block_count ?? 0;
      stepUp = 0;
    }

    const total = allow + review + stepUp + block;
    return {
      total,
      allow,
      review,
      stepUp,
      block,
      allowPct: total > 0 ? (allow / total) * 100 : 0,
      reviewPct: total > 0 ? (review / total) * 100 : 0,
      stepUpPct: total > 0 ? (stepUp / total) * 100 : 0,
      blockPct: total > 0 ? (block / total) * 100 : 0,
    };
  }, [trendsData, summaryData]);

  // Structured chart data retaining zero-count categories
  const policyChartData = useMemo(
    () => [
      {
        action: 'ALLOW',
        label: 'ALLOW',
        count: policyStats.allow,
        pct: policyStats.allowPct,
        color: CHART_COLORS.allow,
      },
      {
        action: 'REVIEW',
        label: 'REVIEW',
        count: policyStats.review,
        pct: policyStats.reviewPct,
        color: CHART_COLORS.review,
      },
      {
        action: 'STEP_UP_VERIFICATION',
        label: 'STEP-UP',
        count: policyStats.stepUp,
        pct: policyStats.stepUpPct,
        color: CHART_COLORS.accent,
      },
      {
        action: 'BLOCK',
        label: 'BLOCK',
        count: policyStats.block,
        pct: policyStats.blockPct,
        color: CHART_COLORS.block,
      },
    ],
    [policyStats]
  );

  const dailyTrends = trendsData?.daily_trends ?? [];

  return (
    <div>
      {/* Workspace Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Rules & Detection Management
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)', lineHeight: 1.5 }}>
          Active deterministic risk rules, thresholds, and execution actions evaluated alongside the LightGBM model.
        </p>
      </div>

      {/* Top KPI Strip (Configured Rule Counts) */}
      <div className="rg-kpi-grid">
        <div className="rg-card">
          <div className="rg-card-title">Active Rules</div>
          <div className="rg-card-value">5</div>
          <div className="rg-card-subtitle">Configured deterministic rules</div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">Critical Blocking</div>
          <div className="rg-card-value" style={{ color: 'var(--rg-high-text)' }}>1</div>
          <div className="rg-card-subtitle">Threshold &ge; 0.80 probability</div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">Step-Up / Review</div>
          <div className="rg-card-value" style={{ color: 'var(--rg-med-text)' }}>3</div>
          <div className="rg-card-subtitle">Velocity, amount & address rules</div>
        </div>

        <div className="rg-card">
          <div className="rg-card-title">Surveillance Tier</div>
          <div className="rg-card-value" style={{ color: 'var(--rg-low-text)' }}>1</div>
          <div className="rg-card-subtitle">Cold-start account tenure check</div>
        </div>
      </div>

      {/* Analytics & Policy Enforcement Posture */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Policy Action Distribution Recharts Visualization */}
        <ChartContainer
          title="Policy Action Distribution"
          subtitle="Runtime policy evaluation recommendations applied across scored transactions"
          height={260}
          loading={trendsLoading}
          empty={policyStats.total === 0}
          emptyTitle="No policy evaluation events recorded"
          emptyMessage="Evaluations will populate automatically as transactions are scored for the active tenant."
          ariaLabel={`Policy distribution: ${policyStats.allowPct.toFixed(1)}% Allow, ${policyStats.reviewPct.toFixed(1)}% Review, ${policyStats.stepUpPct.toFixed(1)}% Step-Up, ${policyStats.blockPct.toFixed(1)}% Block`}
          ariaDescription="Runtime decision distribution across ALLOW, REVIEW, STEP_UP_VERIFICATION, and BLOCK policy tiers."
        >
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={policyChartData} margin={{ top: 12, right: 16, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_CSS_VARS.grid} vertical={false} />
              <XAxis dataKey="label" stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} />
              <YAxis stroke={CHART_CSS_VARS.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(val, _name, item) => [
                      `${Number(val).toLocaleString()} evaluations (${item.payload?.pct.toFixed(1)}%)`,
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
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--rg-text-muted)', lineHeight: 1.4 }}>
            * Note: Configured rules define deterministic criteria; runtime policy distribution reflects transaction evaluation decisions.
          </div>
        </ChartContainer>

        {/* Daily Policy Enforcement Activity */}
        <div className="rg-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Daily Policy Enforcement</h3>
            <span style={{ fontSize: 11, color: 'var(--rg-text-muted)' }}>
              {dailyTrends.length === 1 ? 'Single Period View' : dailyTrends.length > 1 ? `${dailyTrends.length} Days Activity` : 'Tenant Scope'}
            </span>
          </div>

          {dailyTrends.length === 0 ? (
            <div className="rg-empty-state" role="status" style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--rg-text-primary)' }}>
                No daily enforcement activity recorded.
              </p>
              <span style={{ fontSize: 12, color: 'var(--rg-text-muted)', display: 'block', marginTop: 4 }}>
                Daily enforcement statistics will appear once transaction batches are evaluated.
              </span>
            </div>
          ) : dailyTrends.length === 1 ? (
            <div>
              <div style={{ fontSize: 12, color: 'var(--rg-text-secondary)', marginBottom: 8 }}>
                Evaluation Date: <strong style={{ color: 'var(--rg-text-primary)', fontFamily: 'var(--rg-font-mono)' }}>{dailyTrends[0].date}</strong>
              </div>

              <div className="rg-single-period-grid">
                <div className="rg-single-period-stat">
                  <div className="rg-single-period-val">{dailyTrends[0].total_scored}</div>
                  <div className="rg-single-period-lbl">Total Scored</div>
                </div>
                <div className="rg-single-period-stat">
                  <div className="rg-single-period-val" style={{ color: 'var(--rg-med-text)' }}>{dailyTrends[0].flagged}</div>
                  <div className="rg-single-period-lbl">Flagged / Review</div>
                </div>
                <div className="rg-single-period-stat">
                  <div className="rg-single-period-val" style={{ color: 'var(--rg-high-text)' }}>{dailyTrends[0].blocked}</div>
                  <div className="rg-single-period-lbl">Blocked Outright</div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div
                  className="rg-segmented-bar"
                  style={{ height: 6 }}
                  role="presentation"
                >
                  <div
                    style={{
                      width: `${dailyTrends[0].total_scored > 0 ? ((dailyTrends[0].total_scored - dailyTrends[0].flagged - dailyTrends[0].blocked) / dailyTrends[0].total_scored) * 100 : 100}%`,
                      backgroundColor: 'var(--rg-low-text)',
                    }}
                  />
                  <div
                    style={{
                      width: `${dailyTrends[0].total_scored > 0 ? (dailyTrends[0].flagged / dailyTrends[0].total_scored) * 100 : 0}%`,
                      backgroundColor: 'var(--rg-med-text)',
                    }}
                  />
                  <div
                    style={{
                      width: `${dailyTrends[0].total_scored > 0 ? (dailyTrends[0].blocked / dailyTrends[0].total_scored) * 100 : 0}%`,
                      backgroundColor: 'var(--rg-high-text)',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dailyTrends.slice(0, 4).map((d) => (
                <div key={d.date} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontFamily: 'var(--rg-font-mono)', color: 'var(--rg-text-primary)' }}>{d.date}</span>
                    <span style={{ color: 'var(--rg-text-muted)' }}>
                      {d.total_scored} scored &bull; <span style={{ color: 'var(--rg-med-text)' }}>{d.flagged} flagged</span> &bull; <span style={{ color: 'var(--rg-high-text)' }}>{d.blocked} blocked</span>
                    </span>
                  </div>
                  <div className="rg-meter-track" style={{ height: 6 }}>
                    <div
                      className="rg-meter-fill rg-meter-fill-accent"
                      style={{ width: `${Math.min(100, Math.max(8, ((d.flagged + d.blocked) / Math.max(1, d.total_scored)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Rule Registry Table */}
      <div className="rg-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--rg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active Rule Registry</h3>
            <span style={{ fontSize: 12, color: 'var(--rg-text-secondary)', marginTop: 2, display: 'block' }}>
              Deterministic decision parameters executed in real-time scoring pipeline
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--rg-text-muted)', fontFamily: 'var(--rg-font-mono)' }}>
            5 / 5 ACTIVE
          </span>
        </div>

        <div className="rg-table-container">
          <table className="rg-rules-table" aria-label="Active Deterministic Rule Registry">
            <thead>
              <tr>
                <th scope="col" style={{ width: '38%' }}>Rule Identifier & Description</th>
                <th scope="col" style={{ width: '22%' }}>Evaluation Threshold</th>
                <th scope="col" style={{ width: '12%' }}>Severity</th>
                <th scope="col" style={{ width: '16%' }}>Action Trigger</th>
                <th scope="col" style={{ width: '12%' }}>Engine Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="rg-rule-name">{r.name}</div>
                    <div className="rg-rule-id">{r.id}</div>
                    <div className="rg-rule-desc">{r.description}</div>
                  </td>
                  <td>
                    <span className="rg-rule-threshold">{r.threshold}</span>
                  </td>
                  <td>
                    <RiskBadge severity={r.severity} />
                  </td>
                  <td>
                    <RiskBadge action={r.action} />
                  </td>
                  <td>
                    <span className="rg-status-dot-active">ACTIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security & Immutability Notice (Clean SVG Lock Icon) */}
      <div className="rg-security-notice" role="note">
        <span className="rg-security-notice-icon">
          <LockIcon size={16} aria-hidden="true" />
        </span>
        <span>
          Rule configuration mutations require signed server-key authorization and are immutable via embed tokens.
        </span>
      </div>
    </div>
  );
};

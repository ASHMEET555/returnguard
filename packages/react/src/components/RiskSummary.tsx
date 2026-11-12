import React from 'react';
import { useRiskSummary } from '../hooks';
import { useReturnGuard } from '../context';
import { formatCurrency } from '../utils/currency';
import type { AnalyticsSummary } from '@returnguard/sdk';
import { ShieldIcon, AlertTriangleIcon, TransactionsIcon, AnalyticsIcon, RefreshIcon } from './icons';

export interface RiskSummaryProps {
  data?: AnalyticsSummary;
  loading?: boolean;
  onRefresh?: () => void;
  metrics?: ('total' | 'allow' | 'review' | 'block' | 'avgScore' | 'volume')[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const RiskSummary: React.FC<RiskSummaryProps> = ({
  data: propData,
  loading: propLoading,
  onRefresh: propRefresh,
  metrics = ['total', 'allow', 'review', 'block', 'avgScore', 'volume'],
  title = 'Risk Assessment Summary',
  subtitle = 'Real-time payment authorization & risk metrics for merchant',
  className = '',
}) => {
  const { currency } = useReturnGuard();
  const hookSummary = useRiskSummary();
  const summary = propData ?? hookSummary.data;
  const loading = propLoading ?? (propData ? false : hookSummary.loading);
  const handleRefresh = propRefresh ?? hookSummary.refetch;

  const totalDecisions = summary?.total_decisions || 0;
  const allowCount = summary?.allow_count || 0;
  const reviewCount = summary?.review_count || 0;
  const blockCount = summary?.block_count || 0;
  const avgScore = summary?.average_risk_score !== undefined ? Number(summary.average_risk_score) : 0;
  const totalVolume = summary?.total_volume_inr !== undefined ? Number(summary.total_volume_inr) : 0;

  const allowPct = totalDecisions > 0 ? ((allowCount / totalDecisions) * 100).toFixed(1) : '0.0';
  const reviewPct = totalDecisions > 0 ? ((reviewCount / totalDecisions) * 100).toFixed(1) : '0.0';
  const blockPct = totalDecisions > 0 ? ((blockCount / totalDecisions) * 100).toFixed(1) : '0.0';

  return (
    <div className={`rg-risk-summary-card ${className}`.trim()} style={{ marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--rg-text-primary)' }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--rg-text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {handleRefresh && (
          <button
            type="button"
            className="rg-btn rg-btn-secondary"
            onClick={handleRefresh}
            style={{ fontSize: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Refresh metrics"
          >
            <RefreshIcon size={12} />
            <span>Sync</span>
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {metrics.includes('total') && (
          <div className="rg-stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="rg-stat-label">Total Evaluated</span>
              <TransactionsIcon size={16} />
            </div>
            <div className="rg-stat-value" style={{ fontSize: 24, marginTop: 8 }}>
              {loading ? '--' : totalDecisions}
            </div>
            <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', marginTop: 4 }}>
              Scored transactions
            </div>
          </div>
        )}

        {metrics.includes('allow') && (
          <div className="rg-stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="rg-stat-label">Allow Rate</span>
              <ShieldIcon size={16} />
            </div>
            <div className="rg-stat-value" style={{ fontSize: 24, marginTop: 8, color: 'var(--rg-low-text, #10b981)' }}>
              {loading ? '--' : `${allowPct}%`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', marginTop: 4 }}>
              {loading ? '--' : `${allowCount} allowed`}
            </div>
          </div>
        )}

        {metrics.includes('review') && (
          <div className="rg-stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="rg-stat-label">Review Hold</span>
              <AlertTriangleIcon size={16} />
            </div>
            <div className="rg-stat-value" style={{ fontSize: 24, marginTop: 8, color: 'var(--rg-med-text, #f59e0b)' }}>
              {loading ? '--' : `${reviewPct}%`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', marginTop: 4 }}>
              {loading ? '--' : `${reviewCount} pending review`}
            </div>
          </div>
        )}

        {metrics.includes('block') && (
          <div className="rg-stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="rg-stat-label">Blocked</span>
              <AlertTriangleIcon size={16} />
            </div>
            <div className="rg-stat-value" style={{ fontSize: 24, marginTop: 8, color: 'var(--rg-high-text, #ef4444)' }}>
              {loading ? '--' : `${blockPct}%`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', marginTop: 4 }}>
              {loading ? '--' : `${blockCount} rejected`}
            </div>
          </div>
        )}

        {metrics.includes('avgScore') && (
          <div className="rg-stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="rg-stat-label">Avg Risk Score</span>
              <AnalyticsIcon size={16} />
            </div>
            <div className="rg-stat-value" style={{ fontSize: 24, marginTop: 8 }}>
              {loading ? '--' : Math.round(avgScore * 100)}
              <span style={{ fontSize: 13, color: 'var(--rg-text-muted)' }}> / 100</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', marginTop: 4 }}>
              Model candidate_lgbm_v1
            </div>
          </div>
        )}

        {metrics.includes('volume') && (
          <div className="rg-stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="rg-stat-label">Scored Volume</span>
              <TransactionsIcon size={16} />
            </div>
            <div className="rg-stat-value" style={{ fontSize: 24, marginTop: 8 }}>
              {loading ? '--' : formatCurrency(totalVolume, currency)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--rg-text-muted)', marginTop: 4 }}>
              Authorized volume
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

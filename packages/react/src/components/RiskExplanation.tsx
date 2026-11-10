import React from 'react';
import type { ScoreResult } from '@returnguard/sdk';
import { useTransactionRisk } from '../hooks';
import { RiskBadge } from './RiskBadge';

export interface RiskExplanationProps {
  decisionId?: string;
  decision?: ScoreResult;
  loading?: boolean;
  className?: string;
  title?: string;
}

export const RiskExplanation: React.FC<RiskExplanationProps> = ({
  decisionId,
  decision: propDecision,
  loading: propLoading,
  className = '',
  title = 'Risk Assessment & Explanation',
}) => {
  const hookResult = useTransactionRisk(decisionId || '');
  const decision = propDecision ?? hookResult.decision;
  const loading = propLoading ?? (propDecision ? false : hookResult.loading);

  if (loading) {
    return (
      <div className={`rg-card ${className}`.trim()} style={{ padding: 20, textAlign: 'center', color: 'var(--rg-text-muted)' }}>
        Loading risk explanation...
      </div>
    );
  }

  if (!decision) {
    return (
      <div className={`rg-card ${className}`.trim()} style={{ padding: 20, textAlign: 'center', color: 'var(--rg-text-secondary)' }}>
        Select a transaction or provide a decision ID to view explainability details.
      </div>
    );
  }

  const scoreNum = Number(decision.risk_score || 0);
  const scorePct = Math.round(scoreNum * 100);
  const reasonCodes = decision.reason_codes || [];
  const ruleHits = decision.rule_hits || [];

  const riskIncreasingReasons = reasonCodes.filter(
    (rc) => rc.direction === 'increases_risk' || rc.direction === 'high'
  );
  const riskDecreasingReasons = reasonCodes.filter(
    (rc) => rc.direction === 'decreases_risk' || rc.direction === 'low'
  );

  return (
    <div className={`rg-card ${className}`.trim()} style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--rg-text-primary)' }}>
            {title}
          </h4>
          <span style={{ fontSize: 12, color: 'var(--rg-text-secondary)', fontFamily: 'monospace' }}>
            Decision: {decision.decision_id || decision.order_id}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <RiskBadge score={decision.risk_score} />
          <RiskBadge action={decision.suggested_action} />
        </div>
      </div>

      {/* Summary Banner */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 6,
          background: 'var(--rg-bg-secondary, #1e293b)',
          border: '1px solid var(--rg-border-primary, #334155)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: 'var(--rg-text-secondary)', textTransform: 'uppercase' }}>
            Evaluated Risk Score
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--rg-text-primary)', marginTop: 2 }}>
            {scorePct} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--rg-text-muted)' }}>/ 100</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--rg-text-secondary)', textTransform: 'uppercase' }}>
            Suggested Policy Action
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rg-text-primary)', marginTop: 4 }}>
            {decision.suggested_action || 'review'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--rg-text-secondary)', textTransform: 'uppercase' }}>
            Model Engine
          </div>
          <div style={{ fontSize: 13, color: 'var(--rg-text-secondary)', fontFamily: 'monospace', marginTop: 4 }}>
            {decision.model_version || 'candidate_lgbm_v1'}
          </div>
        </div>
      </div>

      {/* Triggered Policy Rules */}
      {ruleHits.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rg-text-secondary)', marginBottom: 6 }}>
            Rule Triggers & Safeguards
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ruleHits.map((rule, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontFamily: 'monospace',
                }}
              >
                ● {rule}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SHAP Explainability Waterfall */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rg-text-secondary)', marginBottom: 8 }}>
          Feature Attribution (SHAP Analysis)
        </div>

        {reasonCodes.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--rg-text-muted)' }}>
            No prominent feature deviations identified for this transaction.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {riskIncreasingReasons.map((rc, idx) => (
              <div
                key={`inc-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: 4,
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>▲</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--rg-text-primary)' }}>
                    {rc.feature}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                  Increases Risk (Rank #{rc.shap_rank || idx + 1})
                </span>
              </div>
            ))}

            {riskDecreasingReasons.map((rc, idx) => (
              <div
                key={`dec-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>▼</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--rg-text-primary)' }}>
                    {rc.feature}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                  Decreases Risk (Rank #{rc.shap_rank || idx + 1})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

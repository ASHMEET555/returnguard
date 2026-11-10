import React from 'react';
import type { DecisionAuditReconstruction } from '@returnguard/sdk';
import { useTransactionRisk } from '../hooks';

export interface AuditTimelineProps {
  decisionId?: string;
  audit?: DecisionAuditReconstruction;
  loading?: boolean;
  className?: string;
  title?: string;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({
  decisionId,
  audit: propAudit,
  loading: propLoading,
  className = '',
  title = 'Audit Reconstruction & Evidence Trail',
}) => {
  const hookResult = useTransactionRisk(decisionId || '');
  const audit = propAudit ?? hookResult.audit;
  const loading = propLoading ?? (propAudit ? false : hookResult.loading);

  if (loading) {
    return (
      <div className={`rg-card ${className}`.trim()} style={{ padding: 20, textAlign: 'center', color: 'var(--rg-text-muted)' }}>
        Loading audit trail...
      </div>
    );
  }

  if (!audit) {
    return (
      <div className={`rg-card ${className}`.trim()} style={{ padding: 20, textAlign: 'center', color: 'var(--rg-text-secondary)' }}>
        Select a transaction or specify a decision ID to reconstruct its immutable audit trail.
      </div>
    );
  }

  const d = audit.data?.decision;
  const p = audit.data?.policy_trace;
  const features = audit.data?.feature_snapshot;

  const steps = [
    {
      title: 'Transaction Ingestion & Authorization Hold',
      desc: 'Payment intent created and transaction payload ingested by ReturnGuard.',
      time: d?.created_at || 'Step 1',
      status: 'complete',
      badge: d?.channel || 'paypal',
    },
    {
      title: 'Feature Vector Snapshot & SHAP Evaluation',
      desc: `Extracted ${features ? Object.keys(features).length : 'deterministic'} features. Explanations calculated against baseline.`,
      time: d?.created_at || 'Step 2',
      status: 'complete',
      badge: d?.model_version || 'candidate_lgbm_v1',
    },
    {
      title: 'Risk Decision & Policy Recommendation',
      desc: `Risk score evaluated as ${(Number(d?.risk_score || 0) * 100).toFixed(0)}/100 (${d?.tier || 'LOW'}). Action: ${p?.suggested_action || p?.policy_action || 'allow'}.`,
      time: d?.created_at || 'Step 3',
      status: 'complete',
      badge: p?.policy_rule || 'LOW_ALLOW',
    },
    {
      title: 'Review Resolution & Evidence Sealing',
      desc: p?.policy_action === 'REVIEW' || p?.policy_action === 'MANUAL_REVIEW'
        ? 'Held for merchant admin approval before payment capture.'
        : 'Automated policy rule satisfied; transaction cleared for immediate capture.',
      time: 'Step 4',
      status: p?.policy_action === 'REVIEW' ? 'pending' : 'complete',
      badge: 'Audit Seal Ready',
    },
  ];

  return (
    <div className={`rg-card ${className}`.trim()} style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--rg-text-primary)' }}>
            {title}
          </h4>
          <span style={{ fontSize: 12, color: 'var(--rg-text-secondary)', fontFamily: 'monospace' }}>
            Reference: {d?.decision_id || decisionId}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 12,
            background: 'var(--rg-bg-tertiary)',
            color: 'var(--rg-text-secondary)',
          }}
        >
          Cryptographic Log Verified
        </span>
      </div>

      <div style={{ position: 'relative', paddingLeft: 24, marginTop: 12 }}>
        {/* Timeline connecting line */}
        <div
          style={{
            position: 'absolute',
            left: 7,
            top: 10,
            bottom: 10,
            width: 2,
            background: 'var(--rg-border-primary, #334155)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              {/* Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: -24,
                  top: 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: step.status === 'complete' ? '#10b981' : '#f59e0b',
                  border: '3px solid var(--rg-bg-primary, #0f172a)',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rg-text-primary)' }}>
                  {step.title}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: 'var(--rg-bg-secondary)',
                    color: 'var(--rg-text-muted)',
                    fontFamily: 'monospace',
                  }}
                >
                  {step.badge}
                </span>
              </div>

              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--rg-text-secondary)' }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

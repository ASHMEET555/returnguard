import React from 'react';
import { RiskBadge } from './RiskBadge';

export const RulesPage: React.FC = () => {
  // Built from verified rule engine contracts in rules/engine.py & 01-brief.md
  const rules = [
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
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>Rules & Detection Management</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--rg-text-secondary)' }}>
          Active deterministic risk rules, thresholds, and execution actions evaluated alongside the LightGBM model.
        </p>
      </div>

      <div className="rg-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--rg-bg-tertiary)', borderBottom: '1px solid var(--rg-border)', color: 'var(--rg-text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>Rule Identifier & Name</th>
              <th style={{ padding: '12px 16px' }}>Evaluation Threshold</th>
              <th style={{ padding: '12px 16px' }}>Severity</th>
              <th style={{ padding: '12px 16px' }}>Action Trigger</th>
              <th style={{ padding: '12px 16px' }}>Engine Status</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--rg-border-subtle)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--rg-text-muted)', marginTop: 2 }}>{r.id}</div>
                  <div style={{ fontSize: 12, color: 'var(--rg-text-secondary)', marginTop: 4 }}>{r.description}</div>
                </td>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12 }}>{r.threshold}</td>
                <td style={{ padding: '14px 16px' }}><RiskBadge severity={r.severity} /></td>
                <td style={{ padding: '14px 16px' }}><RiskBadge action={r.action} /></td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: 12, color: 'var(--rg-low-text)', fontWeight: 600 }}>● {r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'var(--rg-bg-card)', border: '1px solid var(--rg-border)', borderRadius: 6, fontSize: 12, color: 'var(--rg-text-muted)' }}>
        ℹ️ Rule configuration mutations require signed server-key authorization and are immutable via embed tokens.
      </div>
    </div>
  );
};

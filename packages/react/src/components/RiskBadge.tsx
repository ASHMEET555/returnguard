import React from 'react';

export interface BadgeProps {
  score?: number;
  severity?: string;
  action?: string;
  className?: string;
}

export const RiskBadge: React.FC<BadgeProps> = ({ score, severity, action, className = '' }) => {
  let variant = 'neutral';
  let label = 'UNKNOWN';

  if (typeof score === 'number') {
    if (score < 0.15) {
      variant = 'low';
      label = `LOW (${(score * 100).toFixed(0)})`;
    } else if (score < 0.40) {
      variant = 'medium';
      label = `MEDIUM (${(score * 100).toFixed(0)})`;
    } else if (score < 0.80) {
      variant = 'high';
      label = `HIGH (${(score * 100).toFixed(0)})`;
    } else {
      variant = 'critical';
      label = `CRITICAL (${(score * 100).toFixed(0)})`;
    }
  } else if (severity) {
    const sev = severity.toUpperCase();
    if (sev === 'LOW') variant = 'low';
    else if (sev === 'MEDIUM') variant = 'medium';
    else if (sev === 'HIGH') variant = 'high';
    else if (sev === 'CRITICAL') variant = 'critical';
    label = sev;
  } else if (action) {
    const act = action.toUpperCase();
    if (act.includes('ALLOW')) variant = 'low';
    else if (act.includes('MONITOR') || act.includes('STEP_UP')) variant = 'medium';
    else if (act.includes('REVIEW')) variant = 'high';
    else if (act.includes('BLOCK')) variant = 'critical';
    label = act.replace(/_/g, ' ');
  }

  return (
    <span className={`rg-badge rg-badge-${variant} ${className}`}>
      {label}
    </span>
  );
};

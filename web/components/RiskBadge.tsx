import React from 'react';
import type { Severity } from '../lib/types';

interface RiskBadgeProps {
  severity: Severity;
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ severity, score }) => {
  const label = score !== undefined ? `${severity} (${score.toFixed(2)})` : severity;

  return (
    <span
      data-severity={severity}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '12px',
      }}
    >
      {label}
    </span>
  );
};

export default RiskBadge;

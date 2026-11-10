import React from 'react';
import { RiskBadge, RiskBadgeProps } from './RiskBadge';

export interface RiskScoreBadgeProps extends RiskBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export const RiskScoreBadge: React.FC<RiskScoreBadgeProps> = ({
  score,
  tier,
  action,
  severity,
  size = 'md',
  className = '',
}) => {
  const sizeClass = size === 'sm' ? 'rg-badge-sm' : size === 'lg' ? 'rg-badge-lg' : '';

  return (
    <span className={`rg-score-badge-wrap ${sizeClass} ${className}`.trim()}>
      <RiskBadge score={score} tier={tier} action={action} severity={severity} />
    </span>
  );
};

import React from 'react';
import type { Severity } from '../lib/types';
import styles from './RiskBadge.module.css';

interface RiskBadgeProps {
  severity: Severity;
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ severity, score }) => {
  return (
    <span className={styles.badge} data-severity={severity}>
      <span className={styles.dot} aria-hidden="true" />
      <span>{severity}</span>
      {score !== undefined && (
        <span className={styles.score}>({score.toFixed(2)})</span>
      )}
    </span>
  );
};

export default RiskBadge;

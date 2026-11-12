import React from 'react';
import type { ScoreResponse } from '../lib/types';
import { RiskBadge } from './RiskBadge';
import styles from './DetailDrawer.module.css';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data?: ScoreResponse | null;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Investigation Detail">
        <div className={styles.header}>
          <h3 className={styles.title}>Investigation Detail</h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕ Close
          </button>
        </div>

        <div className={styles.section}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <span className={styles.label}>Order ID</span>
              <span className={styles.valueMono}>{data.order_id}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Channel</span>
              <span className={styles.value}>{data.channel.toUpperCase()}</span>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <span className={styles.label}>Severity & Score</span>
              <div>
                <RiskBadge severity={data.severity} score={data.risk_score} />
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Suggested Action</span>
              <span className={styles.value}>{data.suggested_action}</span>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Ring ID</span>
            <span className={styles.valueMono}>{data.ring_id ?? 'None Detected'}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Model Version</span>
            <span className={styles.valueMono}>{data.model_version}</span>
          </div>

          <div className={styles.listCard}>
            <div className={styles.listTitle}>Reason Codes</div>
            {data.reason_codes && data.reason_codes.length > 0 ? (
              <ul className={styles.list}>
                {data.reason_codes.map((rc) => (
                  <li key={rc} className={styles.listItem}>
                    {rc}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.label}>None recorded</span>
            )}
          </div>

          <div className={styles.listCard}>
            <div className={styles.listTitle}>Rule Hits</div>
            {data.rule_hits && data.rule_hits.length > 0 ? (
              <ul className={styles.list}>
                {data.rule_hits.map((rule) => (
                  <li key={rule} className={styles.listItem}>
                    {rule}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.label}>No rule triggers</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default DetailDrawer;

import React from 'react';
import type { ScoreResponse } from '../lib/types';

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
    <aside
      className="detail-drawer"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: '420px',
        height: '100%',
        backgroundColor: '#fff',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
        padding: '24px',
        overflowY: 'auto',
        zIndex: 1000,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={{ float: 'right', cursor: 'pointer' }}
      >
        Close
      </button>
      <h3>Investigation Detail</h3>
      <p>
        <strong>Order ID:</strong> {data.order_id}
      </p>
      <p>
        <strong>Channel:</strong> {data.channel}
      </p>
      <p>
        <strong>Risk Score:</strong> {data.risk_score}
      </p>
      <p>
        <strong>Severity:</strong> {data.severity}
      </p>
      <p>
        <strong>Suggested Action:</strong> {data.suggested_action}
      </p>
      <p>
        <strong>Ring ID:</strong> {data.ring_id ?? 'None'}
      </p>
      <div>
        <strong>Reason Codes:</strong>
        <ul>
          {data.reason_codes.map((rc) => (
            <li key={rc}>{rc}</li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Rule Hits:</strong>
        <ul>
          {data.rule_hits.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default DetailDrawer;

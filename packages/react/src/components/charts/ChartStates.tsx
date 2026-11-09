import React from 'react';

export interface ChartEmptyStateProps {
  title?: string;
  message?: string;
  height?: number | string;
  className?: string;
}

export const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({
  title = 'No Data Available',
  message = 'There is no recorded data to display for this metric.',
  height = '100%',
  className = '',
}) => {
  return (
    <div
      className={`rg-chart-state rg-chart-state-empty ${className}`}
      style={{ height }}
      role="status"
      aria-label={`${title}: ${message}`}
    >
      <div className="rg-chart-state-icon-wrap" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
          <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
          <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
          <line x1="2" y1="20" x2="22" y2="20" strokeLinecap="round" />
        </svg>
      </div>
      <div className="rg-chart-state-title">{title}</div>
      <div className="rg-chart-state-desc">{message}</div>
    </div>
  );
};

export interface ChartLoadingStateProps {
  message?: string;
  height?: number | string;
  className?: string;
}

export const ChartLoadingState: React.FC<ChartLoadingStateProps> = ({
  message = 'Loading analytics data...',
  height = '100%',
  className = '',
}) => {
  return (
    <div
      className={`rg-chart-state rg-chart-state-loading ${className}`}
      style={{ height }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="rg-chart-skeleton-wrap" aria-hidden="true">
        <div className="rg-chart-skeleton-bar" style={{ height: '40%' }} />
        <div className="rg-chart-skeleton-bar" style={{ height: '80%' }} />
        <div className="rg-chart-skeleton-bar" style={{ height: '60%' }} />
        <div className="rg-chart-skeleton-bar" style={{ height: '100%' }} />
        <div className="rg-chart-skeleton-bar" style={{ height: '70%' }} />
      </div>
      <div className="rg-chart-state-desc">{message}</div>
    </div>
  );
};

export interface ChartErrorStateProps {
  title?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  height?: number | string;
  className?: string;
}

export const ChartErrorState: React.FC<ChartErrorStateProps> = ({
  title = 'Failed to Load Chart',
  error,
  onRetry,
  height = '100%',
  className = '',
}) => {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'An error occurred while loading chart data.';

  return (
    <div
      className={`rg-chart-state rg-chart-state-error ${className}`}
      style={{ height }}
      role="alert"
    >
      <div className="rg-chart-state-icon-wrap rg-chart-state-icon-error" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
        </svg>
      </div>
      <div className="rg-chart-state-title">{title}</div>
      <div className="rg-chart-state-desc">{errorMessage}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rg-btn rg-btn-secondary rg-chart-retry-btn"
        >
          Retry
        </button>
      )}
    </div>
  );
};

import React from 'react';
import { ChartEmptyState, ChartLoadingState, ChartErrorState } from './ChartStates';

export interface ChartContainerProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  height?: number | string;
  minHeight?: number | string;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  loadingMessage?: string;
  error?: Error | string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  ariaLabel?: string;
  ariaDescription?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  title,
  subtitle,
  height = 240,
  minHeight,
  className = '',
  style,
  loading = false,
  loadingMessage,
  error = null,
  empty = false,
  emptyTitle,
  emptyMessage,
  onRetry,
  action,
  ariaLabel,
  ariaDescription,
}) => {
  const containerHeight = typeof height === 'number' ? `${height}px` : height;
  const containerMinHeight = minHeight ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight) : undefined;

  const hasHeader = Boolean(title || subtitle || action);

  return (
    <div
      className={`rg-chart-container ${className}`}
      style={style}
      role="region"
      aria-label={ariaLabel || title || 'Analytics Chart'}
      aria-description={ariaDescription || subtitle}
    >
      {hasHeader && (
        <div className="rg-chart-header">
          <div className="rg-chart-header-text">
            {title && <h3 className="rg-chart-title">{title}</h3>}
            {subtitle && <p className="rg-chart-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="rg-chart-header-action">{action}</div>}
        </div>
      )}

      <div
        className="rg-chart-canvas-wrap"
        style={{
          height: containerHeight,
          minHeight: containerMinHeight,
          position: 'relative',
          width: '100%',
          minWidth: 0,
        }}
      >
        {loading ? (
          <ChartLoadingState message={loadingMessage} height="100%" />
        ) : error ? (
          <ChartErrorState error={error} onRetry={onRetry} height="100%" />
        ) : empty ? (
          <ChartEmptyState title={emptyTitle} message={emptyMessage} height="100%" />
        ) : (
          children
        )}
      </div>
    </div>
  );
};

(ChartContainer as any).defaultProps = {
  height: 240,
  loading: false,
  empty: false,
};


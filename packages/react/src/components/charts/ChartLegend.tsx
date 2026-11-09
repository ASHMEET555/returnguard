import React from 'react';

export interface ChartLegendItem {
  value?: string | number;
  id?: string;
  type?: string;
  color?: string;
  inactive?: boolean;
  count?: number;
  percentage?: number;
  formattedValue?: string;
}

export interface ChartLegendProps {
  payload?: ChartLegendItem[];
  items?: ChartLegendItem[];
  showValues?: boolean;
  showPercentages?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({
  payload,
  items,
  showValues = false,
  showPercentages = false,
  align = 'center',
  className = '',
}) => {
  const legendItems = items || payload || [];

  if (legendItems.length === 0) {
    return null;
  }

  const justifyClass =
    align === 'left'
      ? 'rg-chart-legend-left'
      : align === 'right'
      ? 'rg-chart-legend-right'
      : 'rg-chart-legend-center';

  return (
    <div className={`rg-chart-legend ${justifyClass} ${className}`} role="list">
      {legendItems.map((item, index) => {
        const key = item.id || `${item.value}-${index}`;
        const swatchColor = item.color || 'var(--rg-accent)';
        const label = item.value ?? `Series ${index + 1}`;

        let detail: string | null = null;
        if (item.formattedValue) {
          detail = item.formattedValue;
        } else if (showValues && item.count !== undefined) {
          if (showPercentages && item.percentage !== undefined) {
            detail = `${item.count} (${item.percentage}%)`;
          } else {
            detail = `${item.count}`;
          }
        } else if (showPercentages && item.percentage !== undefined) {
          detail = `${item.percentage}%`;
        }

        return (
          <div
            key={key}
            className={`rg-chart-legend-item ${item.inactive ? 'rg-chart-legend-inactive' : ''}`}
            role="listitem"
          >
            <span
              className="rg-chart-legend-dot"
              style={{ backgroundColor: swatchColor }}
              aria-hidden="true"
            />
            <span className="rg-chart-legend-label">{label}</span>
            {detail !== null && (
              <span className="rg-chart-legend-value">{detail}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

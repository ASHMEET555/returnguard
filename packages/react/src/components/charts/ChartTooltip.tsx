import React from 'react';
import { formatMetricValue } from './chartTheme';

export interface ChartTooltipPayloadItem {
  name?: string;
  value?: any;
  color?: string;
  fill?: string;
  stroke?: string;
  unit?: string;
  dataKey?: string | number;
  payload?: any;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string | number;
  formatter?: (value: any, name: string, item: ChartTooltipPayloadItem, index: number) => React.ReactNode;
  labelFormatter?: (label: any) => React.ReactNode;
  valuePrefix?: string;
  valueSuffix?: string;
  showTotal?: boolean;
  totalLabel?: string;
  className?: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  valuePrefix = '',
  valueSuffix = '',
  showTotal = false,
  totalLabel = 'Total',
  className = '',
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formattedLabel = labelFormatter ? labelFormatter(label) : label;

  let totalValue = 0;
  if (showTotal) {
    for (const item of payload) {
      if (typeof item.value === 'number' && Number.isFinite(item.value)) {
        totalValue += item.value;
      }
    }
  }

  return (
    <div className={`rg-chart-tooltip ${className}`} role="tooltip">
      {formattedLabel !== undefined && formattedLabel !== null && formattedLabel !== '' && (
        <div className="rg-chart-tooltip-header">{formattedLabel}</div>
      )}
      <div className="rg-chart-tooltip-body">
        {payload.map((item, index) => {
          const swatchColor = item.color || item.fill || 'var(--rg-accent)';
          const name = item.name || String(item.dataKey || `Item ${index + 1}`);

          let displayVal: React.ReactNode;
          if (formatter) {
            displayVal = formatter(item.value, name, item, index);
          } else if (typeof item.value === 'number') {
            displayVal = `${valuePrefix}${formatMetricValue(item.value, 'count')}${item.unit || valueSuffix}`;
          } else {
            displayVal = item.value ?? '—';
          }

          return (
            <div key={`${name}-${index}`} className="rg-chart-tooltip-row">
              <span
                className="rg-chart-tooltip-swatch"
                style={{ backgroundColor: swatchColor }}
                aria-hidden="true"
              />
              <span className="rg-chart-tooltip-name">{name}</span>
              <span className="rg-chart-tooltip-value">{displayVal}</span>
            </div>
          );
        })}

        {showTotal && payload.length > 1 && (
          <div className="rg-chart-tooltip-row rg-chart-tooltip-total">
            <span className="rg-chart-tooltip-name">{totalLabel}</span>
            <span className="rg-chart-tooltip-value">
              {valuePrefix}{formatMetricValue(totalValue, 'count')}{valueSuffix}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

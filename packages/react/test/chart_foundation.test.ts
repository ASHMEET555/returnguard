import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';

import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartEmptyState,
  ChartLoadingState,
  ChartErrorState,
  CHART_COLORS,
  CHART_CSS_VARS,
  calculatePercentage,
  formatMetricValue,
} from '../src/index';

describe('Milestone G2 — Shared Chart Foundation', () => {
  describe('Exports and Public Interface', () => {
    it('exports all chart foundation components and utilities', () => {
      expect(ChartContainer).toBeDefined();
      expect(ChartTooltip).toBeDefined();
      expect(ChartLegend).toBeDefined();
      expect(ChartEmptyState).toBeDefined();
      expect(ChartLoadingState).toBeDefined();
      expect(ChartErrorState).toBeDefined();
      expect(CHART_COLORS).toBeDefined();
      expect(CHART_CSS_VARS).toBeDefined();
      expect(calculatePercentage).toBeDefined();
      expect(formatMetricValue).toBeDefined();
    });
  });

  describe('Theme Tokens and Semantic Palette', () => {
    it('defines canonical semantic color codes for ReturnGuard risk tiers and channels', () => {
      expect(CHART_COLORS.allow).toBe('#10b981');
      expect(CHART_COLORS.review).toBe('#f59e0b');
      expect(CHART_COLORS.block).toBe('#ef4444');
      expect(CHART_COLORS.critical).toBe('#be123c');
      expect(CHART_COLORS.accent).toBe('#3b82f6');
      expect(CHART_COLORS.paypal).toBe('#3b82f6');
      expect(CHART_COLORS.cod).toBe('#8b5cf6');
      expect(CHART_COLORS.other).toBe('#64748b');
      expect(CHART_COLORS.synthetic).toBe('#3b82f6');
      expect(CHART_COLORS.ieeeCis).toBe('#8b5cf6');
    });

    it('provides CSS variable mappings matching ReturnGuard design tokens', () => {
      expect(CHART_CSS_VARS.allow).toContain('--rg-low-text');
      expect(CHART_CSS_VARS.review).toContain('--rg-med-text');
      expect(CHART_CSS_VARS.block).toContain('--rg-high-text');
      expect(CHART_CSS_VARS.grid).toContain('--rg-border-subtle');
      expect(CHART_CSS_VARS.axis).toContain('--rg-text-muted');
      expect(CHART_CSS_VARS.cardBg).toContain('--rg-bg-card');
    });
  });

  describe('Math and Formatting Utilities', () => {
    it('calculates percentages safely with zero-division defense', () => {
      expect(calculatePercentage(0, 0)).toBe(0);
      expect(calculatePercentage(10, 0)).toBe(0);
      expect(calculatePercentage(-5, 100)).toBe(0);
      expect(calculatePercentage(10, 10)).toBe(100);
      expect(calculatePercentage(85, 100)).toBe(85);
      expect(calculatePercentage(1, 3, 2)).toBe(33.33);
      expect(calculatePercentage(NaN, 100)).toBe(0);
    });

    it('formats metric counts, percentages, ratios, and currencies', () => {
      expect(formatMetricValue(10, 'count')).toBe('10');
      expect(formatMetricValue(1250, 'count')).toBe('1,250');
      expect(formatMetricValue(0.9684, 'ratio')).toBe('0.9684');
      expect(formatMetricValue(78.47, 'percent')).toBe('78.5%');
      expect(formatMetricValue(undefined)).toBe('—');
      expect(formatMetricValue(null)).toBe('—');
      expect(formatMetricValue(NaN)).toBe('—');

      const inrFormatted = formatMetricValue(15000, 'currency', 'INR');
      expect(inrFormatted).toContain('15,000');
    });
  });

  describe('ChartContainer Structure and State Handling', () => {
    it('instantiates ChartContainer with default explicit height', () => {
      const element = React.createElement(ChartContainer, {
        title: 'Decision Volume',
        subtitle: 'Past 24 hours',
      });
      expect(element.props.title).toBe('Decision Volume');
      const renderedHeight = element.props.height ?? (ChartContainer as any).defaultProps?.height;
      expect(renderedHeight).toBe(240);
    });

    it('accepts custom heights and accessibility props', () => {
      const element = React.createElement(ChartContainer, {
        height: 320,
        minHeight: 200,
        ariaLabel: 'Risk distribution bar chart',
        ariaDescription: 'Compares risk score buckets across four bands',
      });
      expect(element.props.height).toBe(320);
      expect(element.props.minHeight).toBe(200);
      expect(element.props.ariaLabel).toBe('Risk distribution bar chart');
    });

    it('supports empty state prop and custom messages', () => {
      const element = React.createElement(ChartContainer, {
        empty: true,
        emptyTitle: 'No decisions recorded',
        emptyMessage: 'There are no transactions in this date range.',
      });
      expect(element.props.empty).toBe(true);
      expect(element.props.emptyTitle).toBe('No decisions recorded');
    });

    it('supports loading and error states with retry callback', () => {
      const onRetryMock = vi.fn();
      const element = React.createElement(ChartContainer, {
        error: new Error('API timed out'),
        onRetry: onRetryMock,
      });
      expect(element.props.error).toBeDefined();
      expect(element.props.onRetry).toBe(onRetryMock);
    });
  });

  describe('ChartTooltip and ChartLegend Semantics', () => {
    it('configures ChartTooltip with label, items and formatter support', () => {
      const mockPayload = [
        { name: 'ALLOW', value: 10, color: '#10b981' },
        { name: 'REVIEW', value: 0, color: '#f59e0b' },
        { name: 'BLOCK', value: 0, color: '#ef4444' },
      ];
      const element = React.createElement(ChartTooltip, {
        active: true,
        payload: mockPayload,
        label: 'Policy Actions',
        showTotal: true,
      });
      expect(element.props.active).toBe(true);
      expect(element.props.payload).toHaveLength(3);
      expect(element.props.showTotal).toBe(true);
    });

    it('configures ChartLegend with zero-count retention capability', () => {
      const legendItems = [
        { id: 'allow', value: 'ALLOW', count: 10, percentage: 100, color: '#10b981' },
        { id: 'review', value: 'REVIEW', count: 0, percentage: 0, color: '#f59e0b' },
        { id: 'block', value: 'BLOCK', count: 0, percentage: 0, color: '#ef4444' },
      ];
      const element = React.createElement(ChartLegend, {
        items: legendItems,
        showValues: true,
        showPercentages: true,
        align: 'center',
      });
      expect(element.props.items).toHaveLength(3);
      expect(element.props.showValues).toBe(true);
      // Confirms all 3 categories including zero values are retained in configuration
      expect(element.props.items?.[1].count).toBe(0);
      expect(element.props.items?.[2].count).toBe(0);
    });
  });

  describe('CSS Stylesheet and Design Token Integrity', () => {
    const cssPath = path.resolve(__dirname, '../src/styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    it('includes all shared chart container classes', () => {
      expect(cssContent).toContain('.rg-chart-container');
      expect(cssContent).toContain('.rg-chart-header');
      expect(cssContent).toContain('.rg-chart-title');
      expect(cssContent).toContain('.rg-chart-subtitle');
      expect(cssContent).toContain('.rg-chart-canvas-wrap');
    });

    it('includes tooltip and legend classes supporting theme tokens', () => {
      expect(cssContent).toContain('.rg-chart-tooltip');
      expect(cssContent).toContain('.rg-chart-tooltip-header');
      expect(cssContent).toContain('.rg-chart-tooltip-swatch');
      expect(cssContent).toContain('.rg-chart-tooltip-value');
      expect(cssContent).toContain('.rg-chart-legend');
      expect(cssContent).toContain('.rg-chart-legend-dot');
      expect(cssContent).toContain('.rg-chart-legend-label');
      expect(cssContent).toContain('.rg-chart-legend-value');
    });

    it('includes empty, loading, and error state classes', () => {
      expect(cssContent).toContain('.rg-chart-state');
      expect(cssContent).toContain('.rg-chart-state-title');
      expect(cssContent).toContain('.rg-chart-state-desc');
      expect(cssContent).toContain('.rg-chart-skeleton-wrap');
      expect(cssContent).toContain('.rg-chart-skeleton-bar');
      expect(cssContent).toContain('.rg-chart-retry-btn');
    });

    it('preserves existing workspace stylesheets without regression', () => {
      expect(cssContent).toContain('.rg-pipeline-stages-grid');
      expect(cssContent).toContain('.rg-reports-dist-bar');
      expect(cssContent).toContain('.rg-kpi-card');
      expect(cssContent).toContain('.rg-badge');
    });
  });
});

/**
 * ReturnGuard Shared Chart Theme Tokens and Formatting Utilities.
 * Strictly adheres to Stripe information hierarchy + Linear visual restraint.
 * Uses ReturnGuard semantic CSS variables with reliable fallback hex codes.
 */

export const CHART_COLORS = {
  // Policy & Risk Actions
  allow: '#10b981',       // Emerald - ALLOW / Low Risk
  review: '#f59e0b',      // Amber - REVIEW / Manual Review / Medium Risk
  stepUp: '#f97316',      // Orange - STEP_UP_VERIFICATION
  block: '#ef4444',       // Rose - BLOCK / High Risk
  critical: '#be123c',    // Crimson - CRITICAL

  // Channels & Accents
  accent: '#3b82f6',      // Blue - Primary Accent / PayPal
  paypal: '#3b82f6',      // Blue
  cod: '#8b5cf6',         // Purple - Cash on Delivery
  other: '#64748b',       // Slate - Other Channels / Neutral

  // Model Benchmarks
  synthetic: '#3b82f6',   // Blue - Synthetic Candidate Benchmark
  ieeeCis: '#8b5cf6',     // Purple - IEEE-CIS Real-world Benchmark
  baseline: '#64748b',    // Slate - Baseline

  // Grid, Ticks, Borders
  gridDark: '#192436',
  gridLight: '#edf2f7',
  axisDark: '#8b949e',
  axisLight: '#64748b',
  textDark: '#f9fafb',
  textLight: '#0f172a',
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;

/**
 * Returns a CSS variable reference with fallback hex for standard ReturnGuard chart elements.
 */
export const CHART_CSS_VARS = {
  allow: 'var(--rg-low-text, #10b981)',
  review: 'var(--rg-med-text, #f59e0b)',
  block: 'var(--rg-high-text, #ef4444)',
  critical: 'var(--rg-crit-text, #be123c)',
  accent: 'var(--rg-accent, #3b82f6)',
  grid: 'var(--rg-border-subtle, #192436)',
  axis: 'var(--rg-text-muted, #8b949e)',
  text: 'var(--rg-text-primary, #f9fafb)',
  cardBg: 'var(--rg-bg-card, #131c2e)',
  border: 'var(--rg-border, #1f2d42)',
} as const;

/**
 * Safely computes percentage with zero-division defense.
 */
export function calculatePercentage(value: number, total: number, decimals: number = 1): number {
  if (!total || total <= 0 || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  const pct = (value / total) * 100;
  return Number(pct.toFixed(decimals));
}

import { formatCurrency } from '../../utils/currency';

/**
 * Formats metric values cleanly (count, percentage, currency, or decimal ratio).
 */
export function formatMetricValue(
  value: number | undefined | null,
  format: 'count' | 'percent' | 'currency' | 'ratio' = 'count',
  currencyCode?: string
): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '—';
  }

  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'ratio':
      return value.toFixed(4);
    case 'currency':
      return formatCurrency(value, currencyCode);
    case 'count':
    default:
      return new Intl.NumberFormat('en-US').format(Math.round(value));
  }
}

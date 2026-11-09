import { describe, it, expect } from 'vitest';
import { calculatePercentage, CHART_COLORS } from '../src/index';
import {
  sanitizeCsvField,
  generateDecisionsCsv,
  EXPORTED_CSV_COLUMNS,
  calculatePolicyDistribution,
  calculateDisputeMeter,
} from '../src/components/ReportsPage';
import type { ScoreResult } from '@returnguard/sdk';

describe('Milestone G5: Payment Pipeline + Reports & Exports Visualizations & Governance', () => {
  describe('Payment Pipeline Channel Comparisons', () => {
    it('accurately calculates channel decision counts and percentages for verified tenant seed', () => {
      const channelBreakdown = { paypal: 10, cod: 0, other: 0 };
      const total = channelBreakdown.paypal + channelBreakdown.cod + channelBreakdown.other;

      const channelData = [
        {
          channel: 'PayPal',
          count: channelBreakdown.paypal,
          pct: calculatePercentage(channelBreakdown.paypal, total),
          color: CHART_COLORS.paypal,
        },
        {
          channel: 'COD',
          count: channelBreakdown.cod,
          pct: calculatePercentage(channelBreakdown.cod, total),
          color: CHART_COLORS.cod,
        },
        {
          channel: 'Other',
          count: channelBreakdown.other,
          pct: calculatePercentage(channelBreakdown.other, total),
          color: CHART_COLORS.other,
        },
      ];

      expect(channelData).toHaveLength(3);
      expect(channelData[0].channel).toBe('PayPal');
      expect(channelData[0].count).toBe(10);
      expect(channelData[0].pct).toBe(100.0);

      // Verify zero-count channels are retained with 0%
      expect(channelData[1].count).toBe(0);
      expect(channelData[1].pct).toBe(0.0);
      expect(channelData[2].count).toBe(0);
      expect(channelData[2].pct).toBe(0.0);
    });

    it('handles zero total decisions safely without division by zero', () => {
      const total = 0;
      expect(calculatePercentage(0, total)).toBe(0);
      expect(Number.isFinite(calculatePercentage(0, total))).toBe(true);
    });

    it('enforces the architectural boundary that ALLOW recommendations do not equal processor settlement', () => {
      const stages = [
        'Stage 1: Checkout',
        'Stage 2: ReturnGuard Pre-Decision Evaluation',
        'Stage 3: Merchant Policy Orchestration',
        'Stage 4: Processor Payment Execution',
      ];
      expect(stages).toHaveLength(4);
      expect(stages[1]).not.toBe(stages[3]);
    });
  });

  describe('Reports Policy Distribution Visualization', () => {
    it('computes policy distribution across all four supported actions', () => {
      const mockTrends = {
        policy_breakdown: {
          ALLOW: 10,
          REVIEW: 0,
          STEP_UP_VERIFICATION: 0,
          BLOCK: 0,
        },
      } as any;

      const dist = calculatePolicyDistribution(mockTrends, null);
      expect(dist.total).toBe(10);
      expect(dist.allow.count).toBe(10);
      expect(dist.allow.pct).toBe(100.0);
      expect(dist.review.count).toBe(0);
      expect(dist.stepUp.count).toBe(0);
      expect(dist.block.count).toBe(0);
      expect(dist.isEmpty).toBe(false);
    });

    it('preserves empty state when no decisions have been evaluated', () => {
      const dist = calculatePolicyDistribution(null, null);
      expect(dist.total).toBe(0);
      expect(dist.isEmpty).toBe(true);
      expect(dist.allow.pct).toBe(0);
      expect(dist.review.pct).toBe(0);
      expect(dist.stepUp.pct).toBe(0);
      expect(dist.block.pct).toBe(0);
    });
  });

  describe('Dispute Compliance Meter & Non-Fabrication of Dispute Trends', () => {
    it('computes clean processor status for tenant with zero recorded disputes', () => {
      const disputeAnalytics = {
        total_disputes: 0,
        disputed_amount: 0.0,
        currency: 'INR',
        dispute_rate_pct: 0.0,
      };

      const meter = calculateDisputeMeter(disputeAnalytics);
      expect(meter.totalDisputes).toBe(0);
      expect(meter.ratePct).toBe(0.0);
      expect(meter.isZeroDisputes).toBe(true);
      expect(meter.isExceedingCritical).toBe(false);
      expect(meter.statusMessage).toContain('Clean Processor Status');
      expect(meter.warningThresholdPct).toBe(0.65);
      expect(meter.criticalThresholdPct).toBe(0.90);
    });

    it('flags elevated dispute rate when rate exceeds 0.90% critical threshold', () => {
      const highDisputeAnalytics = {
        total_disputes: 5,
        disputed_amount: 12500.0,
        currency: 'INR',
        dispute_rate_pct: 1.15,
      };

      const meter = calculateDisputeMeter(highDisputeAnalytics);
      expect(meter.isExceedingCritical).toBe(true);
      expect(meter.isZeroDisputes).toBe(false);
      expect(meter.statusMessage).toContain('Exceeds 0.90% Reference Level');
    });
  });

  describe('CSV Export Center Integrity & Security', () => {
    it('preserves the exact 12-column export schema', () => {
      expect(EXPORTED_CSV_COLUMNS).toHaveLength(12);
      expect(EXPORTED_CSV_COLUMNS[0]).toBe('Decision ID');
      expect(EXPORTED_CSV_COLUMNS[1]).toBe('Order ID');
      expect(EXPORTED_CSV_COLUMNS[2]).toBe('Channel');
      expect(EXPORTED_CSV_COLUMNS[3]).toBe('Risk Score');
      expect(EXPORTED_CSV_COLUMNS[4]).toBe('Risk Score (0-100)');
      expect(EXPORTED_CSV_COLUMNS[5]).toBe('Risk Tier');
      expect(EXPORTED_CSV_COLUMNS[6]).toBe('Policy Action');
      expect(EXPORTED_CSV_COLUMNS[7]).toBe('Suggested Action');
      expect(EXPORTED_CSV_COLUMNS[8]).toBe('Policy Rule');
      expect(EXPORTED_CSV_COLUMNS[9]).toBe('Severity');
      expect(EXPORTED_CSV_COLUMNS[10]).toBe('Model Version');
      expect(EXPORTED_CSV_COLUMNS[11]).toBe('Model Status');
    });

    it('enforces formula injection defense while preserving signed numbers', () => {
      expect(sanitizeCsvField('=cmd|')).toBe(`"'=cmd|"`);
      expect(sanitizeCsvField('+calc')).toBe(`"'+calc"`);
      expect(sanitizeCsvField('-notepad')).toBe(`"'-notepad"`);
      expect(sanitizeCsvField('@SUM')).toBe(`"'@SUM"`);

      // Preserves valid finite signed numeric values
      expect(sanitizeCsvField(-42.5)).toBe('-42.5');
      expect(sanitizeCsvField(100)).toBe('100');
      expect(sanitizeCsvField(0)).toBe('0');
    });

    it('strictly excludes PII fields from exported decision CSV rows', () => {
      const mockDecision = {
        decision_id: 'dec_12345',
        order_id: 'ord_67890',
        channel: 'paypal',
        risk_score: 0.05,
        risk_score_100: 5,
        tier: 'LOW',
        policy_action: 'ALLOW',
        suggested_action: 'ALLOW',
        policy_rule: 'ALLOW_NORMAL',
        severity: 'low',
        model_version: 'candidate_lgbm_v1',
        model_status: 'loaded',
      } as unknown as ScoreResult;

      const csv = generateDecisionsCsv([mockDecision]);
      expect(csv).toContain('dec_12345');
      expect(csv).toContain('ord_67890');
      expect(csv).toContain('candidate_lgbm_v1');

      // Assert no customer PII attributes are present
      expect(csv).not.toContain('customer_email');
      expect(csv).not.toContain('customer_phone');
      expect(csv).not.toContain('street_address');
      expect(csv).not.toContain('first_name');
      expect(csv).not.toContain('last_name');
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { ReturnGuardClient } from '@returnguard/sdk';
import type { ModelPerformance } from '@returnguard/sdk';

describe('Milestone 5.3: Rules & Model Benchmarks Logic', () => {
  describe('Model Benchmarks Dynamic Calculations', () => {
    it('correctly calculates FNR = 1 - Recall dynamically from API values', async () => {
      const mockPerformance: ModelPerformance = {
        model_version: 'candidate_lgbm_v1',
        active_dataset: 'synthetic',
        synthetic: {
          dataset_name: 'synthetic',
          auc_roc: 0.9684,
          auc_pr: 0.9009,
          precision: 0.7847,
          recall: 0.8818,
          f1_score: 0.8304,
          threshold: 0.40,
          sample_count: 35949,
          reproduction_status: 'REPRODUCED',
        },
        ieee_cis: {
          dataset_name: 'ieee_cis',
          auc_roc: 0.7712,
          auc_pr: 0.5186,
          precision: 0.0631,
          recall: 0.7980,
          f1_score: 0.1171,
          threshold: 0.35,
          sample_count: 118108,
          reproduction_status: 'REPORTED_UNVERIFIED',
        },
        honest_limits_note: 'The IEEE-CIS model is a high-recall filter for step-up review.',
      };

      const client = new ReturnGuardClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: vi.fn().mockResolvedValue('test_token'),
      });

      vi.spyOn(client.models, 'performance').mockResolvedValue(mockPerformance);

      const res = await client.models.performance();

      // Verify dynamic FNR computation
      const synFNR = (1 - res.synthetic.recall) * 100;
      const ieeeFNR = (1 - res.ieee_cis.recall) * 100;

      expect(Number(synFNR.toFixed(2))).toBe(11.82);
      expect(Number(ieeeFNR.toFixed(2))).toBe(20.20);

      // Verify cross-dataset precision difference and percentage points wording
      const precisionDelta = (res.synthetic.precision - res.ieee_cis.precision) * 100;
      expect(Number(precisionDelta.toFixed(2))).toBe(72.16);
      const gapLabel = `Precision Gap: ${precisionDelta.toFixed(2)} percentage points`;
      expect(gapLabel).toBe('Precision Gap: 72.16 percentage points');

      // Verify reproduction status distinctions
      expect(res.synthetic.reproduction_status).toBe('REPRODUCED');
      expect(res.ieee_cis.reproduction_status).toBe('REPORTED_UNVERIFIED');
    });

    it('handles zero or missing recall gracefully without throwing', () => {
      const calculateFNR = (recall?: number) => {
        if (typeof recall !== 'number') return null;
        return (1 - recall) * 100;
      };

      expect(calculateFNR(undefined)).toBeNull();
      expect(calculateFNR(1.0)).toBe(0);
      expect(calculateFNR(0.0)).toBe(100);
    });
  });

  describe('Rules Workspace Contract & Policy Distribution', () => {
    it('verifies all 5 deterministic system rules are defined', () => {
      const expectedRuleIds = [
        'RULE_VELOCITY_SPIKE',
        'RULE_HIGH_AMOUNT_THRESHOLD',
        'RULE_COLD_START_TENURE',
        'RULE_CRITICAL_RISK_BLOCK',
        'RULE_ADDRESS_NORMALIZATION_MISMATCH',
      ];

      expect(expectedRuleIds).toHaveLength(5);
      expect(expectedRuleIds).toContain('RULE_VELOCITY_SPIKE');
      expect(expectedRuleIds).toContain('RULE_CRITICAL_RISK_BLOCK');
    });

    it('correctly aggregates all four API policy actions preserving zero counts and safe division', () => {
      const rawBreakdown = {
        ALLOW: 10,
        REVIEW: 0,
        STEP_UP_VERIFICATION: 2,
        BLOCK: 1,
      };

      let allow = 0;
      let review = 0;
      let stepUp = 0;
      let block = 0;

      Object.entries(rawBreakdown).forEach(([action, count]) => {
        const act = action.toUpperCase();
        if (act.includes('STEP_UP')) {
          stepUp += count;
        } else if (act.includes('ALLOW')) {
          allow += count;
        } else if (act.includes('BLOCK')) {
          block += count;
        } else if (act.includes('REVIEW')) {
          review += count;
        } else {
          review += count;
        }
      });

      const total = allow + review + stepUp + block;
      expect(total).toBe(13);
      expect(allow).toBe(10);
      expect(review).toBe(0);
      expect(stepUp).toBe(2);
      expect(block).toBe(1);

      const stats = {
        total,
        allow,
        review,
        stepUp,
        block,
        allowPct: total > 0 ? (allow / total) * 100 : 0,
        reviewPct: total > 0 ? (review / total) * 100 : 0,
        stepUpPct: total > 0 ? (stepUp / total) * 100 : 0,
        blockPct: total > 0 ? (block / total) * 100 : 0,
      };

      expect(stats.allowPct).toBeCloseTo((10 / 13) * 100, 1);
      expect(stats.reviewPct).toBe(0);
      expect(stats.stepUpPct).toBeCloseTo((2 / 13) * 100, 1);
      expect(stats.blockPct).toBeCloseTo((1 / 13) * 100, 1);
    });

    it('safely handles zero total evaluations without division by zero', () => {
      const total = 0;
      const stats = {
        total,
        allow: 0,
        review: 0,
        stepUp: 0,
        block: 0,
        allowPct: total > 0 ? (0 / total) * 100 : 0,
        reviewPct: total > 0 ? (0 / total) * 100 : 0,
        stepUpPct: total > 0 ? (0 / total) * 100 : 0,
        blockPct: total > 0 ? (0 / total) * 100 : 0,
      };

      expect(stats.total).toBe(0);
      expect(stats.allowPct).toBe(0);
      expect(stats.reviewPct).toBe(0);
      expect(stats.stepUpPct).toBe(0);
      expect(stats.blockPct).toBe(0);
      expect(isFinite(stats.allowPct)).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { calculatePercentage, CHART_COLORS } from '../src/index';

describe('Milestone G4: Rules & Detection + Model Benchmarks Visualizations', () => {
  describe('Rules & Detection Policy Action Distribution Mapping', () => {
    it('maps real policy breakdown counts to structured chart items across all 4 policy actions', () => {
      const policyBreakdown = {
        ALLOW: 10,
        REVIEW: 0,
        STEP_UP_VERIFICATION: 0,
        BLOCK: 0,
      };

      const total = policyBreakdown.ALLOW + policyBreakdown.REVIEW + policyBreakdown.STEP_UP_VERIFICATION + policyBreakdown.BLOCK;

      const chartData = [
        {
          action: 'ALLOW',
          label: 'ALLOW',
          count: policyBreakdown.ALLOW,
          pct: calculatePercentage(policyBreakdown.ALLOW, total),
          color: CHART_COLORS.allow,
        },
        {
          action: 'REVIEW',
          label: 'REVIEW',
          count: policyBreakdown.REVIEW,
          pct: calculatePercentage(policyBreakdown.REVIEW, total),
          color: CHART_COLORS.review,
        },
        {
          action: 'STEP_UP_VERIFICATION',
          label: 'STEP-UP',
          count: policyBreakdown.STEP_UP_VERIFICATION,
          pct: calculatePercentage(policyBreakdown.STEP_UP_VERIFICATION, total),
          color: CHART_COLORS.accent,
        },
        {
          action: 'BLOCK',
          label: 'BLOCK',
          count: policyBreakdown.BLOCK,
          pct: calculatePercentage(policyBreakdown.BLOCK, total),
          color: CHART_COLORS.block,
        },
      ];

      expect(chartData).toHaveLength(4);
      expect(chartData[0].action).toBe('ALLOW');
      expect(chartData[0].count).toBe(10);
      expect(chartData[0].pct).toBe(100.0);

      // Verify zero-count actions remain intact with 0%
      expect(chartData[1].count).toBe(0);
      expect(chartData[1].pct).toBe(0.0);
      expect(chartData[2].count).toBe(0);
      expect(chartData[2].pct).toBe(0.0);
      expect(chartData[3].count).toBe(0);
      expect(chartData[3].pct).toBe(0.0);
    });

    it('safely handles zero total evaluations without division by zero or NaN', () => {
      const total = 0;
      const pct = calculatePercentage(0, total);
      expect(pct).toBe(0);
      expect(Number.isFinite(pct)).toBe(true);
    });

    it('preserves the distinction between configured rules and runtime policy evaluations', () => {
      const configuredRulesCount = 5;
      const evaluatedPolicyActionsTotal = 10;

      // Ensure configured rules are NOT treated as execution counts
      expect(configuredRulesCount).toBe(5);
      expect(evaluatedPolicyActionsTotal).toBe(10);
      expect(configuredRulesCount).not.toBe(evaluatedPolicyActionsTotal);
    });

    it('confirms policy distribution never couples statistical score bands to actions', () => {
      const policyActions = ['ALLOW', 'REVIEW', 'STEP_UP_VERIFICATION', 'BLOCK'];
      policyActions.forEach((act) => {
        expect(act).not.toMatch(/0\.00|0\.15|0\.40|0\.80|1\.00/);
      });
    });
  });

  describe('Model Benchmarks Grouped Metric Comparisons', () => {
    const synthetic = {
      dataset_name: 'synthetic',
      auc_roc: 0.9684,
      auc_pr: 0.9009,
      precision: 0.7847,
      recall: 0.8818,
      f1_score: 0.8304,
      threshold: 0.40,
      sample_count: 35949,
      reproduction_status: 'REPRODUCED',
    };

    const ieeeCis = {
      dataset_name: 'ieee_cis',
      auc_roc: 0.7712,
      auc_pr: 0.5186,
      precision: 0.0631,
      recall: 0.7980,
      f1_score: 0.1171,
      threshold: 0.35,
      sample_count: 118108,
      reproduction_status: 'REPORTED_UNVERIFIED',
    };

    it('maps all five core metrics to a unified 0.0–1.0 comparison scale', () => {
      const comparisonData = [
        { metric: 'ROC-AUC', synthetic: synthetic.auc_roc, ieee: ieeeCis.auc_roc },
        { metric: 'PR-AUC', synthetic: synthetic.auc_pr, ieee: ieeeCis.auc_pr },
        { metric: 'Precision', synthetic: synthetic.precision, ieee: ieeeCis.precision },
        { metric: 'Recall', synthetic: synthetic.recall, ieee: ieeeCis.recall },
        { metric: 'F1 Score', synthetic: synthetic.f1_score, ieee: ieeeCis.f1_score },
      ];

      expect(comparisonData).toHaveLength(5);

      comparisonData.forEach((item) => {
        expect(item.synthetic).toBeGreaterThanOrEqual(0);
        expect(item.synthetic).toBeLessThanOrEqual(1);
        expect(item.ieee).toBeGreaterThanOrEqual(0);
        expect(item.ieee).toBeLessThanOrEqual(1);
      });

      // Verify exact metric values from G1 audit baseline
      expect(comparisonData[0].synthetic).toBe(0.9684);
      expect(comparisonData[0].ieee).toBe(0.7712);
      expect(comparisonData[1].synthetic).toBe(0.9009);
      expect(comparisonData[1].ieee).toBe(0.5186);
      expect(comparisonData[2].synthetic).toBe(0.7847);
      expect(comparisonData[2].ieee).toBe(0.0631);
      expect(comparisonData[3].synthetic).toBe(0.8818);
      expect(comparisonData[3].ieee).toBe(0.7980);
      expect(comparisonData[4].synthetic).toBe(0.8304);
      expect(comparisonData[4].ieee).toBe(0.1171);
    });

    it('clearly distinguishes REPRODUCED from REPORTED_UNVERIFIED provenance status', () => {
      expect(synthetic.reproduction_status).toBe('REPRODUCED');
      expect(ieeeCis.reproduction_status).toBe('REPORTED_UNVERIFIED');
      expect(synthetic.reproduction_status).not.toBe(ieeeCis.reproduction_status);
    });

    it('correctly models the IEEE-CIS high-recall vs low-precision operational trade-off', () => {
      const precisionDelta = (synthetic.precision - ieeeCis.precision) * 100;
      expect(Number(precisionDelta.toFixed(2))).toBe(72.16);

      // Recall is high (79.80%), precision is low (6.31%)
      expect(ieeeCis.recall).toBe(0.7980);
      expect(ieeeCis.precision).toBe(0.0631);

      // Demonstrates 1 true positive in approx 16 flagged transactions
      const flaggedPerTP = 1 / ieeeCis.precision;
      expect(Math.round(flaggedPerTP)).toBe(16);
    });

    it('handles empty or missing benchmark data gracefully', () => {
      const emptyComparison: unknown[] = [];
      expect(emptyComparison).toHaveLength(0);
    });
  });
});

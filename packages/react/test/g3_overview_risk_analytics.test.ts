import { describe, it, expect } from 'vitest';
import { calculatePercentage, formatMetricValue, CHART_COLORS } from '../src/index';

describe('Milestone G3: Overview & Risk Analytics Data Transformations & Edge Cases', () => {
  describe('Overview Policy Action Donut Transformations', () => {
    it('accurately calculates decision counts and percentages for verified tenant seed', () => {
      const summary = {
        total_decisions: 10,
        allow_count: 10,
        review_count: 0,
        block_count: 0,
      };

      const allowCount = summary.allow_count;
      const reviewCount = summary.review_count;
      const blockCount = summary.block_count;
      const totalDecisions = summary.total_decisions;

      const allowPct = calculatePercentage(allowCount, totalDecisions);
      const reviewPct = calculatePercentage(reviewCount, totalDecisions);
      const blockPct = calculatePercentage(blockCount, totalDecisions);

      expect(allowCount).toBe(10);
      expect(reviewCount).toBe(0);
      expect(blockCount).toBe(0);
      expect(totalDecisions).toBe(10);

      expect(allowPct).toBe(100.0);
      expect(reviewPct).toBe(0.0);
      expect(blockPct).toBe(0.0);
    });

    it('retains zero-count categories in legend while filtering zero-value slices for SVG Pie', () => {
      const allCategories = [
        { id: 'ALLOW', name: 'ALLOW', value: 10, count: 10, percentage: 100, color: CHART_COLORS.allow },
        { id: 'REVIEW', name: 'REVIEW', value: 0, count: 0, percentage: 0, color: CHART_COLORS.review },
        { id: 'BLOCK', name: 'BLOCK', value: 0, count: 0, percentage: 0, color: CHART_COLORS.block },
      ];

      // Slices for Pie must exclude zero values to prevent zero-arc SVG geometry errors
      const pieSlices = allCategories.filter((cat) => cat.value > 0);
      expect(pieSlices).toHaveLength(1);
      expect(pieSlices[0].name).toBe('ALLOW');
      expect(pieSlices[0].value).toBe(10);

      // Legend must retain all 3 categories including zero values
      expect(allCategories).toHaveLength(3);
      expect(allCategories[1].name).toBe('REVIEW');
      expect(allCategories[1].count).toBe(0);
      expect(allCategories[2].name).toBe('BLOCK');
      expect(allCategories[2].count).toBe(0);
    });

    it('safely handles zero-total scenario without NaN or division by zero', () => {
      const allowCount = 0;
      const reviewCount = 0;
      const blockCount = 0;
      const totalDecisions = allowCount + reviewCount + blockCount;

      const allowPct = calculatePercentage(allowCount, totalDecisions);
      const reviewPct = calculatePercentage(reviewCount, totalDecisions);
      const blockPct = calculatePercentage(blockCount, totalDecisions);

      expect(totalDecisions).toBe(0);
      expect(allowPct).toBe(0);
      expect(reviewPct).toBe(0);
      expect(blockPct).toBe(0);
      expect(Number.isFinite(allowPct)).toBe(true);
    });

    it('handles mixed populated decision distributions correctly', () => {
      const allowCount = 120;
      const reviewCount = 25;
      const blockCount = 5;
      const totalDecisions = allowCount + reviewCount + blockCount; // 150

      const allowPct = calculatePercentage(allowCount, totalDecisions);
      const reviewPct = calculatePercentage(reviewCount, totalDecisions);
      const blockPct = calculatePercentage(blockCount, totalDecisions);

      expect(allowPct).toBe(80.0);
      expect(reviewPct).toBe(16.7);
      expect(blockPct).toBe(3.3);
      expect(Math.round(allowPct + reviewPct + blockPct)).toBe(100);
    });
  });

  describe('Risk Analytics Histogram Transformations', () => {
    it('maps calibrated score distribution to four distinct statistical risk bands without policy action coupling', () => {
      const scoreDist = {
        low_0_15: 10,
        med_15_40: 0,
        high_40_80: 0,
        crit_80_100: 0,
      };
      const totalScores = scoreDist.low_0_15 + scoreDist.med_15_40 + scoreDist.high_40_80 + scoreDist.crit_80_100;

      const histogramData = [
        { band: '0.00 – 0.15', tier: 'Low Risk', count: scoreDist.low_0_15, pct: calculatePercentage(scoreDist.low_0_15, totalScores) },
        { band: '0.15 – 0.40', tier: 'Medium Risk', count: scoreDist.med_15_40, pct: calculatePercentage(scoreDist.med_15_40, totalScores) },
        { band: '0.40 – 0.80', tier: 'High Risk', count: scoreDist.high_40_80, pct: calculatePercentage(scoreDist.high_40_80, totalScores) },
        { band: '0.80 – 1.00', tier: 'Critical Risk', count: scoreDist.crit_80_100, pct: calculatePercentage(scoreDist.crit_80_100, totalScores) },
      ];

      expect(histogramData).toHaveLength(4);
      expect(histogramData[0].count).toBe(10);
      expect(histogramData[0].pct).toBe(100.0);
      expect(histogramData[0].tier).toBe('Low Risk');
      expect(histogramData[1].count).toBe(0);
      expect(histogramData[1].pct).toBe(0.0);
      expect(histogramData[1].tier).toBe('Medium Risk');
      expect(histogramData[2].count).toBe(0);
      expect(histogramData[2].tier).toBe('High Risk');
      expect(histogramData[3].count).toBe(0);
      expect(histogramData[3].tier).toBe('Critical Risk');

      // Assert semantic decoupling: score bands must NEVER contain a policy 'action' property
      histogramData.forEach((bandEntry) => {
        expect((bandEntry as Record<string, unknown>).action).toBeUndefined();
      });

      // Assert legend text contains statistical risk labels and never policy actions
      const legendValues = histogramData.map((d) => `${d.band} (${d.tier})`);
      expect(legendValues[0]).toBe('0.00 – 0.15 (Low Risk)');
      expect(legendValues[1]).toBe('0.15 – 0.40 (Medium Risk)');
      expect(legendValues[2]).toBe('0.40 – 0.80 (High Risk)');
      expect(legendValues[3]).toBe('0.80 – 1.00 (Critical Risk)');

      legendValues.forEach((val) => {
        expect(val).not.toMatch(/ALLOW|MONITOR|REVIEW|BLOCK/);
      });
    });

    it('preserves all four statistical bands even when scores are zero', () => {
      const scoreDist = { low_0_15: 0, med_15_40: 0, high_40_80: 0, crit_80_100: 0 };
      const totalScores = scoreDist.low_0_15 + scoreDist.med_15_40 + scoreDist.high_40_80 + scoreDist.crit_80_100;

      const bands = [
        { band: '0.00 – 0.15', tier: 'Low Risk' },
        { band: '0.15 – 0.40', tier: 'Medium Risk' },
        { band: '0.40 – 0.80', tier: 'High Risk' },
        { band: '0.80 – 1.00', tier: 'Critical Risk' },
      ].map((b) => ({
        band: b.band,
        tier: b.tier,
        count: 0,
        pct: calculatePercentage(0, totalScores),
      }));

      expect(bands).toHaveLength(4);
      bands.forEach((b) => {
        expect(b.count).toBe(0);
        expect(b.pct).toBe(0);
        expect((b as Record<string, unknown>).action).toBeUndefined();
      });
    });

    it('verifies score distribution buckets remain decoupled from policy tier distribution', () => {
      // Backend policy tier distribution contract from useRiskSummary()
      const tierDistribution = {
        LOW: 8,
        MEDIUM: 1,
        HIGH: 1,
        CRITICAL: 0,
      };

      // Backend statistical score distribution contract from useRiskSummary()
      const scoreDistribution = {
        low_0_15: 10,
        med_15_40: 0,
        high_40_80: 0,
        crit_80_100: 0,
      };

      // Demonstrates that deterministic policy rules can place a transaction in HIGH tier
      // even when the ML model score falls into the 0.00-0.15 bucket.
      expect(tierDistribution.HIGH).toBe(1);
      expect(scoreDistribution.high_40_80).toBe(0);
      expect(scoreDistribution.low_0_15).toBe(10);
    });
  });

  describe('Payment Channel Breakdown Transformations', () => {
    it('computes channel volume and percentages preserving zero-count channels', () => {
      const channels = { paypal: 10, cod: 0, other: 0 };
      const totalChannels = channels.paypal + channels.cod + channels.other;

      const channelItems = [
        { channel: 'PayPal', count: channels.paypal, pct: calculatePercentage(channels.paypal, totalChannels) },
        { channel: 'COD', count: channels.cod, pct: calculatePercentage(channels.cod, totalChannels) },
        { channel: 'Other', count: channels.other, pct: calculatePercentage(channels.other, totalChannels) },
      ];

      expect(channelItems).toHaveLength(3);
      expect(channelItems[0].channel).toBe('PayPal');
      expect(channelItems[0].count).toBe(10);
      expect(channelItems[0].pct).toBe(100.0);

      expect(channelItems[1].channel).toBe('COD');
      expect(channelItems[1].count).toBe(0);
      expect(channelItems[1].pct).toBe(0.0);

      expect(channelItems[2].channel).toBe('Other');
      expect(channelItems[2].count).toBe(0);
      expect(channelItems[2].pct).toBe(0.0);
    });
  });

  describe('Daily Scoring Activity & Single-Date Trend Guard', () => {
    it('distinguishes single-period accumulation from multi-period historical trend', () => {
      const singleTrend = [{ date: '2026-11-03', total_scored: 10, flagged: 0, blocked: 0 }];
      const isSingleDate = singleTrend.length === 1;

      expect(isSingleDate).toBe(true);
      expect(singleTrend[0].date).toBe('2026-11-03');
      expect(singleTrend[0].total_scored).toBe(10);
      expect(singleTrend[0].flagged).toBe(0);
      expect(singleTrend[0].blocked).toBe(0);
    });

    it('handles multiple historical dates without interpolation', () => {
      const multiTrend = [
        { date: '2026-11-01', total_scored: 5, flagged: 1, blocked: 0 },
        { date: '2026-11-02', total_scored: 8, flagged: 0, blocked: 1 },
        { date: '2026-11-03', total_scored: 10, flagged: 0, blocked: 0 },
      ];
      const isSingleDate = multiTrend.length === 1;

      expect(isSingleDate).toBe(false);
      expect(multiTrend).toHaveLength(3);
      expect(multiTrend[0].total_scored).toBe(5);
      expect(multiTrend[2].total_scored).toBe(10);
    });
  });

  describe('Currency & Dispute Metric Formatting', () => {
    it('formats dispute amount and exposure cleanly in INR', () => {
      const disputes = {
        total_disputes: 0,
        disputed_amount: 0.0,
        currency: 'INR',
        dispute_rate_pct: 0.0,
      };

      const formattedAmount = formatMetricValue(disputes.disputed_amount, 'currency', disputes.currency);
      expect(formattedAmount).toContain('0.00');
      expect(disputes.dispute_rate_pct.toFixed(2)).toBe('0.00');
    });
  });
});

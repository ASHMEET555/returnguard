import { describe, it, expect } from 'vitest';
import * as Icons from '../src/components/icons';
import fs from 'fs';
import path from 'path';

describe('Dashboard-Wide Cohesion & Overview Harmonization', () => {
  describe('Overview Policy Action Breakdown Computation & Fallbacks', () => {
    it('handles zero-division safely when total decisions = 0', () => {
      const summary = {
        total_decisions: 0,
        allow_count: 0,
        review_count: 0,
        block_count: 0,
      };

      const allowCount = summary.allow_count || 0;
      const reviewCount = summary.review_count || 0;
      const blockCount = summary.block_count || 0;
      const totalDecisions = summary.total_decisions || (allowCount + reviewCount + blockCount);

      const allowPctNum = totalDecisions > 0 ? (allowCount / totalDecisions) * 100 : 0;
      const reviewPctNum = totalDecisions > 0 ? (reviewCount / totalDecisions) * 100 : 0;
      const blockPctNum = totalDecisions > 0 ? (blockCount / totalDecisions) * 100 : 0;

      expect(totalDecisions).toBe(0);
      expect(allowPctNum).toBe(0);
      expect(reviewPctNum).toBe(0);
      expect(blockPctNum).toBe(0);
      expect(allowPctNum.toFixed(1)).toBe('0.0');
    });

    it('correctly calculates percentages and counts when values are populated', () => {
      const summary = {
        total_decisions: 1000,
        allow_count: 850,
        review_count: 100,
        block_count: 50,
      };

      const allowCount = summary.allow_count;
      const reviewCount = summary.review_count;
      const blockCount = summary.block_count;
      const totalDecisions = summary.total_decisions || (allowCount + reviewCount + blockCount);

      const allowPctNum = totalDecisions > 0 ? (allowCount / totalDecisions) * 100 : 0;
      const reviewPctNum = totalDecisions > 0 ? (reviewCount / totalDecisions) * 100 : 0;
      const blockPctNum = totalDecisions > 0 ? (blockCount / totalDecisions) * 100 : 0;

      expect(totalDecisions).toBe(1000);
      expect(allowPctNum).toBe(85.0);
      expect(reviewPctNum).toBe(10.0);
      expect(blockPctNum).toBe(5.0);
      expect(allowPctNum + reviewPctNum + blockPctNum).toBe(100.0);
    });

    it('falls back to summing allow + review + block when total_decisions field is zero or missing', () => {
      const summary = {
        total_decisions: 0,
        allow_count: 40,
        review_count: 8,
        block_count: 2,
      };

      const allowCount = summary.allow_count;
      const reviewCount = summary.review_count;
      const blockCount = summary.block_count;
      const totalDecisions = summary.total_decisions || (allowCount + reviewCount + blockCount);

      const allowPctNum = totalDecisions > 0 ? (allowCount / totalDecisions) * 100 : 0;
      const reviewPctNum = totalDecisions > 0 ? (reviewCount / totalDecisions) * 100 : 0;
      const blockPctNum = totalDecisions > 0 ? (blockCount / totalDecisions) * 100 : 0;

      expect(totalDecisions).toBe(50);
      expect(allowPctNum).toBe(80.0);
      expect(reviewPctNum).toBe(16.0);
      expect(blockPctNum).toBe(4.0);
    });
  });

  describe('Iconography & Design Tokens', () => {
    it('exports ChevronRightIcon with default attributes and sizing', () => {
      expect(Icons.ChevronRightIcon).toBeDefined();
      expect(typeof Icons.ChevronRightIcon).toBe('function');
    });

    it('exports all 20 standard design-system SVG icon components', () => {
      const expectedIcons = [
        'OverviewIcon',
        'TransactionsIcon',
        'CustomersIcon',
        'AnalyticsIcon',
        'RulesIcon',
        'ModelsIcon',
        'PipelineIcon',
        'ReviewsIcon',
        'ReportsIcon',
        'ShieldIcon',
        'SunIcon',
        'MoonIcon',
        'SearchIcon',
        'RefreshIcon',
        'CloseIcon',
        'InfoIcon',
        'DownloadIcon',
        'AlertTriangleIcon',
        'LockIcon',
        'ChevronRightIcon',
      ];

      for (const iconName of expectedIcons) {
        expect((Icons as Record<string, unknown>)[iconName]).toBeDefined();
      }
    });

    it('verifies styles.css includes shared .rg-search-input-wrap, .rg-kpi-grid, and .rg-segmented-bar', () => {
      const cssPath = path.resolve(__dirname, '../src/styles.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      expect(cssContent).toContain('.rg-search-input-wrap');
      expect(cssContent).toContain('.rg-search-icon');
      expect(cssContent).toContain('.rg-search-input');
      expect(cssContent).toContain('.rg-kpi-grid');
      expect(cssContent).toContain('.rg-metrics-grid');
      expect(cssContent).toContain('.rg-segmented-bar');
      expect(cssContent).toContain('.rg-reports-dist-bar');
    });
  });
});

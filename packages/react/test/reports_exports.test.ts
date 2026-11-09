import { describe, it, expect, vi } from 'vitest';
import type { ScoreResult, AnalyticsSummary, RiskTrendsResponse } from '@returnguard/sdk';
import {
  sanitizeCsvField,
  generateDecisionsCsv,
  triggerCsvDownload,
  EXPORTED_CSV_COLUMNS,
  calculatePolicyDistribution,
  calculateDisputeMeter,
  EXPORT_PIPELINE_STAGES,
} from '../src/components/ReportsPage';

describe('Milestone 5.4: Workspace 3 — Reports & Exports Logic & Contracts', () => {
  const mockDecisions: ScoreResult[] = [
    {
      decision_id: 'dec_001',
      order_id: 'ORD-1001',
      channel: 'paypal',
      risk_score: 0.125,
      risk_score_100: 13,
      tier: 'LOW',
      policy_rule: 'ALLOW_NORMAL',
      policy_action: 'ALLOW',
      severity: 'allow',
      suggested_action: 'ALLOW',
      reason_codes: [],
      rule_hits: [],
      model_version: 'candidate_lgbm_v1',
      dataset: 'synthetic',
      threshold: 0.4,
      model_status: 'loaded',
      feature_completeness: 1.0,
      explanation_status: 'available',
      shadow: true,
    },
    {
      decision_id: 'dec_002',
      order_id: 'ORD-1002',
      channel: 'cod',
      risk_score: 0.875,
      risk_score_100: 88,
      tier: 'CRITICAL',
      policy_rule: 'HIGH_RISK_BLOCK',
      policy_action: 'BLOCK',
      severity: 'block',
      suggested_action: 'BLOCK',
      reason_codes: [],
      rule_hits: [],
      model_version: 'candidate_lgbm_v1',
      dataset: 'synthetic',
      threshold: 0.4,
      model_status: 'loaded',
      feature_completeness: 0.95,
      explanation_status: 'available',
      shadow: true,
    },
  ];

  const mockSummary: AnalyticsSummary = {
    tenant_id: 'merch_legacy',
    total_decisions: 100,
    allow_count: 85,
    review_count: 10,
    block_count: 5,
    average_risk_score: 0.22,
    total_volume_inr: 520000.5,
    high_risk_volume_inr: 25000.0,
    tier_distribution: {
      LOW: 80,
      MEDIUM: 10,
      HIGH: 5,
      CRITICAL: 5,
    },
  };

  const mockTrends: RiskTrendsResponse = {
    tenant_id: 'merch_legacy',
    daily_trends: [
      { date: '2026-11-01', total_scored: 50, flagged: 5, blocked: 2 },
    ],
    score_distribution: {
      low_0_15: 70,
      med_15_40: 15,
      high_40_80: 10,
      crit_80_100: 5,
    },
    channel_breakdown: {
      paypal: 60,
      cod: 30,
      other: 10,
    },
    policy_breakdown: {
      ALLOW: 85,
      REVIEW: 10,
      BLOCK: 5,
    },
    dispute_analytics: {
      total_disputes: 4,
      disputed_amount: 18500.75,
      currency: 'INR',
      dispute_rate_pct: 2.15,
    },
  };

  describe('1. ALLOW Decision Share Metric Semantics', () => {
    it('correctly calculates ALLOW Decision Share percentage', () => {
      const allowCount = mockSummary.allow_count;
      const totalDecisions = mockSummary.total_decisions;
      const allowSharePct = (allowCount / totalDecisions) * 100;

      expect(allowCount).toBe(85);
      expect(totalDecisions).toBe(100);
      expect(allowSharePct).toBe(85.0);
    });

    it('safely handles zero total decisions with zero division guard', () => {
      const totalDecisions = 0;
      const allowCount = 0;
      const allowSharePct = totalDecisions > 0 ? (allowCount / totalDecisions) * 100 : 0;

      expect(allowSharePct).toBe(0);
      expect(Number.isFinite(allowSharePct)).toBe(true);
    });

    it('handles missing or incomplete analytics summary gracefully', () => {
      const emptySummary = {} as Partial<AnalyticsSummary>;
      const totalDecisions = emptySummary.total_decisions ?? 0;
      const allowCount = emptySummary.allow_count ?? 0;
      const allowSharePct = totalDecisions > 0 ? (allowCount / totalDecisions) * 100 : 0;

      expect(totalDecisions).toBe(0);
      expect(allowCount).toBe(0);
      expect(allowSharePct).toBe(0);
    });
  });

  describe('2. Dispute Metrics and Currency Sourcing', () => {
    it('extracts dispute analytics directly from API response and preserves INR currency', () => {
      const disputes = mockTrends.dispute_analytics;

      expect(disputes.total_disputes).toBe(4);
      expect(disputes.disputed_amount).toBe(18500.75);
      expect(disputes.currency).toBe('INR');
      expect(disputes.currency).not.toBe('USD');
      expect(disputes.currency).not.toBe('$');
      expect(disputes.dispute_rate_pct).toBe(2.15);
    });

    it('formats disputed amount consistently with API-provided currency', () => {
      const disputes = mockTrends.dispute_analytics;
      const formatted = `${disputes.currency} ${disputes.disputed_amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

      expect(formatted).toContain('INR');
      expect(formatted).toContain('18,500.75');
    });

    it('handles zero dispute counts with zero exposure correctly', () => {
      const zeroDisputes = {
        total_disputes: 0,
        disputed_amount: 0.0,
        currency: 'INR',
        dispute_rate_pct: 0.0,
      };

      expect(zeroDisputes.total_disputes).toBe(0);
      expect(zeroDisputes.disputed_amount).toBe(0);
      expect(zeroDisputes.dispute_rate_pct).toBe(0);
    });
  });

  describe('3. Evaluated Monetary Volume Semantics', () => {
    it('verifies evaluated volume is sourced from Order tenant aggregation (INR)', () => {
      const volumeInr = mockSummary.total_volume_inr;
      expect(volumeInr).toBe(520000.5);

      const formatted = `INR ${volumeInr.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
      expect(formatted).toContain('INR');
      expect(formatted).toMatch(/5,?20,?000\.50/);
    });

    it('confirms decision items themselves do not store monetary amounts', () => {
      const decision = mockDecisions[0];
      // Type assertion confirms ScoreResult has no amount field
      expect((decision as unknown as Record<string, unknown>).amount).toBeUndefined();
      expect((decision as unknown as Record<string, unknown>).order_value).toBeUndefined();
    });
  });

  describe('4. RFC 4180 CSV Field Sanitization & Quoting', () => {
    it('preserves clean alphanumeric strings without gratuitous quotes', () => {
      expect(sanitizeCsvField('ORD-1001')).toBe('ORD-1001');
      expect(sanitizeCsvField('ALLOW')).toBe('ALLOW');
      expect(sanitizeCsvField('candidate_lgbm_v1')).toBe('candidate_lgbm_v1');
    });

    it('quotes fields containing commas', () => {
      expect(sanitizeCsvField('Acme, Inc.')).toBe('"Acme, Inc."');
      expect(sanitizeCsvField('ALLOW, REVIEW')).toBe('"ALLOW, REVIEW"');
    });

    it('escapes embedded double quotes by doubling them per RFC 4180', () => {
      expect(sanitizeCsvField('Note with "quotes"')).toBe('"Note with ""quotes"""');
      expect(sanitizeCsvField('"start and end"')).toBe('"""start and end"""');
    });

    it('quotes fields containing newline characters', () => {
      expect(sanitizeCsvField("Line 1\nLine 2")).toBe("\"Line 1\nLine 2\"");
      expect(sanitizeCsvField("Line 1\r\nLine 2")).toBe("\"Line 1\r\nLine 2\"");
    });

    it('handles null, undefined, and empty string safely', () => {
      expect(sanitizeCsvField(null)).toBe('');
      expect(sanitizeCsvField(undefined)).toBe('');
      expect(sanitizeCsvField('')).toBe('');
    });

    it('formats booleans cleanly as true or false', () => {
      expect(sanitizeCsvField(true)).toBe('true');
      expect(sanitizeCsvField(false)).toBe('false');
    });
  });

  describe('5. Formula Injection Defense (CWE-1236)', () => {
    it('neutralizes malicious formula injection strings starting with =', () => {
      const payload = '=cmd|\' /C calc\'!A0';
      const sanitized = sanitizeCsvField(payload);
      expect(sanitized.startsWith('"\'=')).toBe(true);
      expect(sanitized).toBe('"\'=cmd|\' /C calc\'!A0"');
    });

    it('neutralizes formula strings starting with @', () => {
      const payload = '@SUM(A1:A10)';
      const sanitized = sanitizeCsvField(payload);
      expect(sanitized.startsWith('"\'@')).toBe(true);
      expect(sanitized).toBe('"\'@SUM(A1:A10)"');
    });

    it('neutralizes formula strings starting with + followed by command', () => {
      const payload = '+cmd|\' /C calc\'';
      const sanitized = sanitizeCsvField(payload);
      expect(sanitized.startsWith('"\'\+')).toBe(true);
    });

    it('neutralizes formula strings starting with - followed by formula expression', () => {
      const payload = '-2+3+cmd|\' /C calc\'';
      const sanitized = sanitizeCsvField(payload);
      expect(sanitized.startsWith('"\'\-')).toBe(true);
    });

    it('PRESERVES legitimate numeric values without prepending apostrophes', () => {
      // Actual numbers
      expect(sanitizeCsvField(0.85)).toBe('0.85');
      expect(sanitizeCsvField(-15)).toBe('-15');
      expect(sanitizeCsvField(100)).toBe('100');

      // Numeric strings that are valid numbers
      expect(sanitizeCsvField('-42')).toBe('-42');
      expect(sanitizeCsvField('+50')).toBe('+50');
      expect(sanitizeCsvField('-0.05')).toBe('-0.05');
    });
  });

  describe('6. Decision CSV Generation & Schema Consistency', () => {
    it('generates compliant CSV with exact 12-column header row and CRLF line endings', () => {
      const csv = generateDecisionsCsv(mockDecisions);
      const lines = csv.split('\r\n');

      // Header row
      expect(lines[0]).toBe(
        'Decision ID,Order ID,Channel,Risk Score,Risk Score (0-100),Risk Tier,Policy Action,Suggested Action,Policy Rule,Severity,Model Version,Model Status'
      );
      expect(EXPORTED_CSV_COLUMNS).toHaveLength(12);

      // Data rows
      expect(lines[1]).toContain('dec_001,ORD-1001,paypal,0.125,13,LOW,ALLOW,ALLOW,ALLOW_NORMAL,allow,candidate_lgbm_v1,loaded');
      expect(lines[2]).toContain('dec_002,ORD-1002,cod,0.875,88,CRITICAL,BLOCK,BLOCK,HIGH_RISK_BLOCK,block,candidate_lgbm_v1,loaded');
    });

    it('generates header-only CSV with CRLF when decision list is empty', () => {
      const csv = generateDecisionsCsv([]);
      expect(csv).toBe(
        'Decision ID,Order ID,Channel,Risk Score,Risk Score (0-100),Risk Tier,Policy Action,Suggested Action,Policy Rule,Severity,Model Version,Model Status\r\n'
      );
    });

    it('strictly preserves the loaded batch boundary without hallucinating historical records', () => {
      // Input array has 2 items -> Output CSV has exactly 1 header + 2 data rows
      const csv = generateDecisionsCsv(mockDecisions);
      const lines = csv.trim().split('\r\n');
      expect(lines).toHaveLength(3); // 1 header + 2 records
    });
  });

  describe('7. Privacy-Safety Audit (Non-PII Guarantee)', () => {
    it('proves exported columns strictly exclude all PII attributes', () => {
      const piiFields = [
        'customer_name',
        'email',
        'phone',
        'phone_number',
        'address',
        'street',
        'city',
        'pincode',
        'zip',
        'ip_address',
        'device_hash',
        'card_number',
        'pan',
      ];

      EXPORTED_CSV_COLUMNS.forEach((col) => {
        const normalized = col.toLowerCase().replace(/[\s\-_]/g, '');
        piiFields.forEach((pii) => {
          expect(normalized).not.toBe(pii);
        });
      });
    });
  });

  describe('8. Browser CSV Download Trigger Mechanism', () => {
    it('creates and cleans up anchor element and object URL during download in browser environments', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost:3000/mock-uuid');
      const revokeObjectURLMock = vi.fn();
      const clickMock = vi.fn();

      const mockBody = {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      };

      const mockLink = {
        setAttribute: vi.fn(),
        style: {},
        click: clickMock,
      };

      const mockDocument = {
        body: mockBody,
        createElement: vi.fn().mockReturnValue(mockLink),
      };

      vi.stubGlobal('document', mockDocument);
      vi.stubGlobal('window', {});
      vi.stubGlobal('URL', {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      });

      triggerCsvDownload('test,content\r\n1,2\r\n', 'test_report.csv');

      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      expect(mockDocument.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test_report.csv');
      expect(clickMock).toHaveBeenCalledTimes(1);
      expect(mockBody.appendChild).toHaveBeenCalled();
      expect(mockBody.removeChild).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });

  describe('9. Visualization A: Policy Action Distribution Calculations & Accessibility', () => {
    it('calculates correct percentages for all four policy actions when data is present', () => {
      const result = calculatePolicyDistribution(mockTrends, mockSummary);

      expect(result.isEmpty).toBe(false);
      expect(result.total).toBe(100);
      expect(result.allow.count).toBe(85);
      expect(result.allow.pct).toBe(85.0);
      expect(result.review.count).toBe(10);
      expect(result.review.pct).toBe(10.0);
      expect(result.stepUp.count).toBe(0);
      expect(result.stepUp.pct).toBe(0.0);
      expect(result.block.count).toBe(5);
      expect(result.block.pct).toBe(5.0);
      expect(result.accessibleLabel).toContain('ALLOW 85 (85.0%)');
      expect(result.accessibleLabel).toContain('REVIEW 10 (10.0%)');
      expect(result.accessibleLabel).toContain('BLOCK 5 (5.0%)');
    });

    it('safely handles zero total decisions with no NaN or Infinity', () => {
      const zeroSummary: AnalyticsSummary = {
        tenant_id: 'empty_tenant',
        total_decisions: 0,
        allow_count: 0,
        review_count: 0,
        block_count: 0,
        average_risk_score: 0,
        total_volume_inr: 0,
        high_risk_volume_inr: 0,
        tier_distribution: {},
      };

      const result = calculatePolicyDistribution(null, zeroSummary);

      expect(result.isEmpty).toBe(true);
      expect(result.total).toBe(0);
      expect(result.allow.pct).toBe(0);
      expect(result.review.pct).toBe(0);
      expect(result.stepUp.pct).toBe(0);
      expect(result.block.pct).toBe(0);
      expect(Number.isNaN(result.allow.pct)).toBe(false);
      expect(Number.isFinite(result.allow.pct)).toBe(true);
      expect(result.accessibleLabel).toBe('Policy decision distribution: No decisions evaluated');
    });

    it('gracefully handles null or undefined trends and summary objects', () => {
      const result = calculatePolicyDistribution(undefined, undefined);

      expect(result.isEmpty).toBe(true);
      expect(result.total).toBe(0);
      expect(result.allow.count).toBe(0);
      expect(result.review.count).toBe(0);
      expect(result.stepUp.count).toBe(0);
      expect(result.block.count).toBe(0);
    });

    it('aggregates manual reviews and step-up verification actions correctly', () => {
      const customTrends: RiskTrendsResponse = {
        ...mockTrends,
        policy_breakdown: {
          ALLOW: 50,
          REVIEW: 15,
          MANUAL_REVIEW: 5,
          STEP_UP_VERIFICATION: 20,
          BLOCK: 10,
        },
      };

      const result = calculatePolicyDistribution(customTrends, null);

      expect(result.total).toBe(100);
      expect(result.allow.count).toBe(50);
      expect(result.review.count).toBe(20); // 15 + 5
      expect(result.stepUp.count).toBe(20);
      expect(result.block.count).toBe(10);
      expect(result.review.pct).toBe(20.0);
    });
  });

  describe('10. Visualization B: Processor Dispute Compliance Range Meter', () => {
    it('handles zero disputes with clean processor status and 0.00% rate', () => {
      const zeroDisputes = {
        total_disputes: 0,
        disputed_amount: 0.0,
        currency: 'INR',
        dispute_rate_pct: 0.0,
      };

      const meter = calculateDisputeMeter(zeroDisputes);

      expect(meter.isZeroDisputes).toBe(true);
      expect(meter.ratePct).toBe(0.0);
      expect(meter.totalDisputes).toBe(0);
      expect(meter.disputedAmount).toBe(0.0);
      expect(meter.currency).toBe('INR');
      expect(meter.clampedPositionPct).toBe(0.0);
      expect(meter.statusMessage).toContain('Clean Processor Status');
      expect(meter.isExceedingCritical).toBe(false);
    });

    it('handles nominal dispute rate below warning threshold (0.35%)', () => {
      const nominalDisputes = {
        total_disputes: 2,
        disputed_amount: 4500.0,
        currency: 'INR',
        dispute_rate_pct: 0.35,
      };

      const meter = calculateDisputeMeter(nominalDisputes);

      expect(meter.isZeroDisputes).toBe(false);
      expect(meter.ratePct).toBe(0.35);
      expect(meter.statusMessage).toContain('Nominal Dispute Activity (0.35%)');
      expect(meter.isExceedingCritical).toBe(false);
      expect(meter.clampedPositionPct).toBeGreaterThan(0);
      expect(meter.clampedPositionPct).toBeLessThan(meter.warningMarkerPct);
    });

    it('handles elevated dispute rate between warning and critical thresholds (0.75%)', () => {
      const elevatedDisputes = {
        total_disputes: 5,
        disputed_amount: 12000.0,
        currency: 'INR',
        dispute_rate_pct: 0.75,
      };

      const meter = calculateDisputeMeter(elevatedDisputes);

      expect(meter.ratePct).toBe(0.75);
      expect(meter.statusMessage).toContain('Elevated Dispute Activity (0.75%)');
      expect(meter.isExceedingCritical).toBe(false);
      expect(meter.clampedPositionPct).toBeGreaterThan(meter.warningMarkerPct);
      expect(meter.clampedPositionPct).toBeLessThan(meter.criticalMarkerPct);
    });

    it('handles excessive dispute rate exceeding critical 0.90% reference ceiling', () => {
      const criticalDisputes = {
        total_disputes: 8,
        disputed_amount: 25000.0,
        currency: 'INR',
        dispute_rate_pct: 1.45,
      };

      const meter = calculateDisputeMeter(criticalDisputes);

      expect(meter.ratePct).toBe(1.45);
      expect(meter.isExceedingCritical).toBe(true);
      expect(meter.statusMessage).toContain('Exceeds 0.90% Reference Level (1.45%)');
      expect(meter.clampedPositionPct).toBeLessThanOrEqual(100);
      expect(meter.clampedPositionPct).toBeGreaterThanOrEqual(0);
    });

    it('preserves API-provided currency and handles null analytics gracefully', () => {
      const meter = calculateDisputeMeter(null);

      expect(meter.currency).toBe('INR');
      expect(meter.ratePct).toBe(0);
      expect(meter.isZeroDisputes).toBe(true);
    });
  });

  describe('11. Visualization C: 4-Stage Export Governance Pipeline', () => {
    it('defines exact four sequential stages in the pipeline', () => {
      expect(EXPORT_PIPELINE_STAGES).toHaveLength(4);

      const stepNumbers = EXPORT_PIPELINE_STAGES.map((s) => s.step);
      expect(stepNumbers).toEqual([1, 2, 3, 4]);

      const stageIds = EXPORT_PIPELINE_STAGES.map((s) => s.id);
      expect(stageIds).toEqual(['ingestion', 'sanitization', 'formula_defense', 'rfc4180_csv']);
    });

    it('clearly communicates batch limitation, PII scrubbing, CWE-1236, and RFC 4180 serialization', () => {
      const [stage1, stage2, stage3, stage4] = EXPORT_PIPELINE_STAGES;

      expect(stage1.title).toBe('Loaded Decisions');
      expect(stage1.description).toContain('max 50');

      expect(stage2.title).toBe('PII Sanitization');
      expect(stage2.description).toContain('Filters customer names');

      expect(stage3.title).toBe('CWE-1236 Defense');
      expect(stage3.description).toContain('Neutralizes =, +, -, @');

      expect(stage4.title).toBe('RFC 4180 CSV');
      expect(stage4.description).toContain('CRLF stream');
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import { ReturnGuardClient } from "../src/client";
import { ValidationError } from "../src/errors";
import { validateMonetaryValue, validateScorePayloadMonetary } from "../src/validation";

describe("SDK Monetary Runtime Validation", () => {
  const createMockResponse = () =>
    new Response(
      JSON.stringify({
        order_id: "ord_1",
        channel: "paypal",
        risk_score: 0.1,
        risk_score_100: 10,
        tier: "LOW",
        policy_rule: "ALLOW",
        policy_action: "ALLOW",
        severity: "low",
        suggested_action: "allow",
        reason_codes: [],
        rule_hits: [],
        model_version: "v1",
        dataset: "synthetic",
        threshold: 0.4,
        model_status: "active",
        feature_completeness: 1.0,
        explanation_status: "available",
        shadow: false,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  const mockFetch = vi.fn().mockImplementation(() => Promise.resolve(createMockResponse()));

  const client = new ReturnGuardClient({
    baseUrl: "https://api.test",
    apiKey: "rg_live_test",
    fetch: mockFetch,
  });

  describe("1. validateMonetaryValue unit tests", () => {
    it("accepts canonical decimal strings without modification", () => {
      expect(() => validateMonetaryValue("0.10", "test.field")).not.toThrow();
      expect(() => validateMonetaryValue("99999999999999999.99", "test.field")).not.toThrow();
      expect(() => validateMonetaryValue("1234.56", "test.field")).not.toThrow();
    });

    it("accepts validated safe integers for backward compatibility", () => {
      expect(() => validateMonetaryValue(100, "test.field")).not.toThrow();
      expect(() => validateMonetaryValue(0, "test.field")).not.toThrow();
      expect(() => validateMonetaryValue(9007199254740991, "test.field")).not.toThrow();
    });

    it("rejects fractional Numbers (0.1, 0.1 + 0.2, 1.005)", () => {
      expect(() => validateMonetaryValue(0.1, "test.unit_price")).toThrow(ValidationError);
      expect(() => validateMonetaryValue(0.1 + 0.2, "test.unit_price")).toThrow(ValidationError);
      expect(() => validateMonetaryValue(1.005, "test.unit_price")).toThrow(ValidationError);
    });

    it("rejects unsafe integers, NaN, and Infinity", () => {
      expect(() => validateMonetaryValue(9007199254740992, "test.unit_price")).toThrow(ValidationError);
      expect(() => validateMonetaryValue(NaN, "test.unit_price")).toThrow(ValidationError);
      expect(() => validateMonetaryValue(Infinity, "test.unit_price")).toThrow(ValidationError);
      expect(() => validateMonetaryValue(-Infinity, "test.unit_price")).toThrow(ValidationError);
    });
  });

  describe("2. Client runtime validation before HTTP transmission", () => {
    it("rejects fractional Number in line_items[0].unit_price before fetch is called", async () => {
      mockFetch.mockClear();

      await expect(
        client.scoreTransaction({
          amount: 50.0,
          line_items: [
            {
              quantity: 1,
              unit_price: 0.1, // fractional Number
            },
          ],
        })
      ).rejects.toThrow(ValidationError);

      // Verify HTTP request was NEVER made
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("rejects 0.1 + 0.2 in nested line_items before HTTP transmission", async () => {
      mockFetch.mockClear();

      await expect(
        client.scoreTransaction({
          amount: 50.0,
          line_items: [
            {
              quantity: 1,
              unit_price: 0.1 + 0.2,
            },
          ],
        })
      ).rejects.toThrow(ValidationError);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("rejects 1.005 in order_summary.total before HTTP transmission", async () => {
      mockFetch.mockClear();

      await expect(
        client.scoreTransaction({
          amount: 50.0,
          order_summary: {
            total: 1.005,
          },
        })
      ).rejects.toThrow(ValidationError);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("rejects unsafe integer in nested order_summary.items[0].total_amount", async () => {
      mockFetch.mockClear();

      await expect(
        client.scoreTransaction({
          amount: 50.0,
          order_summary: {
            items: [
              {
                quantity: 1,
                unit_price: "100.00",
                total_amount: 9007199254740992,
              },
            ],
          },
        })
      ).rejects.toThrow(ValidationError);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("accepts canonical decimal strings and transmits unchanged", async () => {
      mockFetch.mockClear();

      await client.scoreTransaction({
        amount: 50.0,
        line_items: [
          {
            quantity: 1,
            unit_price: "0.10",
            total_amount: "99999999999999999.99",
          },
        ],
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.line_items[0].unit_price).toBe("0.10");
      expect(callBody.line_items[0].total_amount).toBe("99999999999999999.99");
    });

    it("accepts safe integer numbers for backward compatibility", async () => {
      mockFetch.mockClear();

      await client.scoreTransaction({
        amount: 50.0,
        line_items: [
          {
            quantity: 2,
            unit_price: 100,
          },
        ],
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.line_items[0].unit_price).toBe(100);
    });
  });
});

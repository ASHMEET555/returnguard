import { describe, it, expect, vi } from "vitest";
import { ReturnGuardClient } from "../src/client";
import { RateLimitError, ServerError } from "../src/errors";

describe("Resource Methods and Retry Policy", () => {
  it("scoreTransaction does NOT retry on 500 error", async () => {
    let callCount = 0;
    const fakeFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return new Response(JSON.stringify({ detail: "Internal error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    });

    const client = new ReturnGuardClient({
      baseUrl: "https://api.test",
      apiKey: "rg_live_test",
      fetch: fakeFetch as any,
      retry: { maxRetries: 3, delayMs: 10 },
    });

    await expect(
      client.scoreTransaction({ amount: 500 })
    ).rejects.toThrow(ServerError);

    expect(callCount).toBe(1);
  });

  it("reviews.submit does NOT retry on failure", async () => {
    let callCount = 0;
    const fakeFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return new Response(JSON.stringify({ detail: "Gateway failure" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    });

    const client = new ReturnGuardClient({
      baseUrl: "https://api.test",
      apiKey: "rg_live_test",
      fetch: fakeFetch as any,
      retry: { maxRetries: 3, delayMs: 10 },
    });

    await expect(
      client.reviews.submit({ decision_id: "dec_1", action: "approve" })
    ).rejects.toThrow(ServerError);

    expect(callCount).toBe(1);
  });

  it("GET decisions.get retries once on 500 and succeeds", async () => {
    let callCount = 0;
    const fakeFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({ detail: "Transient error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          order_id: "ord_1",
          channel: "paypal",
          risk_score: 0.1,
          risk_score_100: 10,
          tier: "LOW",
          policy_rule: "ALLOW_NORMAL",
          policy_action: "ALLOW",
          severity: "low",
          suggested_action: "allow",
          reason_codes: [],
          rule_hits: [],
          model_version: "v1",
          dataset: "synthetic",
          threshold: 0.4,
          model_status: "ok",
          feature_completeness: 1.0,
          explanation_status: "ok",
          shadow: false,
          decision_id: "dec_1",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    });

    const client = new ReturnGuardClient({
      baseUrl: "https://api.test",
      apiKey: "rg_live_test",
      fetch: fakeFetch as any,
      retry: { maxRetries: 1, delayMs: 10 },
    });

    const decision = await client.decisions.get("dec_1");
    expect(decision.decision_id).toBe("dec_1");
    expect(callCount).toBe(2);
  });

  it("decisions.listAll traverses cursors with max-pages guard", async () => {
    const pages: Record<string, any> = {
      initial: {
        items: [{ order_id: "ord_1", decision_id: "d1" }],
        next_cursor: "cur_page_2",
        limit: 1,
      },
      cur_page_2: {
        items: [{ order_id: "ord_2", decision_id: "d2" }],
        next_cursor: "cur_page_3",
        limit: 1,
      },
      cur_page_3: {
        items: [{ order_id: "ord_3", decision_id: "d3" }],
        next_cursor: null,
        limit: 1,
      },
    };

    const fakeFetch = vi.fn().mockImplementation(async (urlStr: string) => {
      const url = new URL(urlStr);
      const cursor = url.searchParams.get("cursor");
      const key = cursor || "initial";
      return new Response(JSON.stringify(pages[key]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const client = new ReturnGuardClient({
      baseUrl: "https://api.test",
      apiKey: "rg_live_test",
      fetch: fakeFetch as any,
    });

    // Test normal full pagination
    const all = await client.decisions.listAll({ pageSize: 1 });
    expect(all.length).toBe(3);
    expect(all.map((d) => d.decision_id)).toEqual(["d1", "d2", "d3"]);

    // Test maxPages guard
    const limited = await client.decisions.listAll({ maxPages: 2, pageSize: 1 });
    expect(limited.length).toBe(2);
  });

  it("analytics.summary and models.performance methods call proper GET endpoints", async () => {
    const fakeFetch = vi.fn().mockImplementation(async (urlStr: string) => {
      if (urlStr.includes("/v1/analytics/summary")) {
        return new Response(
          JSON.stringify({
            tenant_id: "t1",
            total_decisions: 5,
            allow_count: 5,
            review_count: 0,
            block_count: 0,
            average_risk_score: 0.05,
            total_volume_inr: 5000,
            high_risk_volume_inr: 0,
            tier_distribution: { LOW: 5 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (urlStr.includes("/v1/models/performance")) {
        return new Response(
          JSON.stringify({
            model_version: "v1",
            active_dataset: "synthetic",
            synthetic: { auc_roc: 0.98 },
            ieee_cis: { auc_roc: 0.91 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("Not found", { status: 404 });
    });

    const client = new ReturnGuardClient({
      baseUrl: "https://api.test",
      apiKey: "rg_live_test",
      fetch: fakeFetch as any,
    });

    const analytics = await client.analytics.summary();
    expect(analytics.tenant_id).toBe("t1");

    const models = await client.models.performance();
    expect(models.synthetic.auc_roc).toBe(0.98);
  });
});

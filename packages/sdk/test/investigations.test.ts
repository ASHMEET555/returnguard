import { describe, it, expect, vi } from "vitest";
import { ReturnGuardClient } from "../src/client";
import { ServerError } from "../src/errors";

describe("Investigation Resource Methods in SDK", () => {
  it("investigations.list calls /v1/investigations with query parameters", async () => {
    let capturedUrl = "";
    const fakeFetch = vi.fn().mockImplementation(async (url: string) => {
      capturedUrl = url;
      return new Response(
        JSON.stringify({
          items: [{ id: "inv_1", status: "OPEN", created_at: "2026-11-08T00:00:00Z" }],
          next_cursor: null,
          has_more: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const client = new ReturnGuardClient({
      baseUrl: "https://api.test",
      apiKey: "rg_live_test",
      fetch: fakeFetch as any,
    });

    const resp = await client.investigations.list({ status: "OPEN", limit: 10 });
    expect(resp.items).toHaveLength(1);
    expect(resp.items[0].id).toBe("inv_1");
    expect(capturedUrl).toContain("/v1/investigations?");
    expect(capturedUrl).toContain("status=OPEN");
    expect(capturedUrl).toContain("limit=10");
  });

  it("investigations.close does NOT retry on server failure", async () => {
    let callCount = 0;
    const fakeFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return new Response(JSON.stringify({ detail: "Database unavailable" }), {
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
      client.investigations.close("inv_1", {
        outcome: "CLOSED_APPROVED",
        note: "Evidence meets dispute threshold criteria",
        steps_performed: ["step_1"],
      })
    ).rejects.toThrow(ServerError);

    expect(callCount).toBe(1);
  });

  it("investigations.getAssessment retrieves assessment and advisory label", async () => {
    const fakeFetch = vi.fn().mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          investigation_id: "inv_1",
          model: "gemini-1.5-pro",
          prompt_hash: "hash_abc",
          attempt_count: 1,
          validator_errors: [],
          final_status: "VALIDATED",
          final_text: "Clear match between transaction and evidence.",
          findings_cited: ["A1"],
          advisory_label: "LLM assessment, advisory",
          created_at: "2026-11-08T00:00:00Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const client = new ReturnGuardClient({
      baseUrl: "https://api.test",
      apiKey: "rg_live_test",
      fetch: fakeFetch as any,
    });

    const assessment = await client.investigations.getAssessment("inv_1");
    expect(assessment.advisory_label).toBe("LLM assessment, advisory");
    expect(assessment.final_status).toBe("VALIDATED");
    expect(assessment.attempt_count).toBe(1);
  });
});

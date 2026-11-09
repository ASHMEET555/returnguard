import { describe, it, expect, vi } from "vitest";
import { Transport } from "../src/transport";
import {
  AuthenticationError,
  AuthorizationError,
  ConfigurationError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "../src/errors";

describe("Transport Core", () => {
  it("requires baseUrl", () => {
    expect(() => new Transport({ baseUrl: "" } as any)).toThrow(ConfigurationError);
  });

  it("requires exactly one of apiKey or tokenProvider", () => {
    expect(() => new Transport({ baseUrl: "https://api.test" })).toThrow(ConfigurationError);
    expect(
      () =>
        new Transport({
          baseUrl: "https://api.test",
          apiKey: "rg_live_test",
          tokenProvider: async () => "token",
        })
    ).toThrow(ConfigurationError);
  });

  it("sets Authorization: Bearer header", async () => {
    let capturedHeaders: HeadersInit | undefined;
    const fakeFetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      capturedHeaders = init.headers;
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const transport = new Transport({
      baseUrl: "https://api.test",
      apiKey: "rg_live_secret123",
      fetch: fakeFetch as any,
    });

    const res = await transport.request<{ status: string }>({
      method: "GET",
      path: "/health",
    });

    expect(res).toEqual({ status: "ok" });
    expect((capturedHeaders as Record<string, string>)["Authorization"]).toBe(
      "Bearer rg_live_secret123"
    );
  });

  it("maps 401, 403, 404, 422, 429 correctly", async () => {
    const errorStatuses = [
      { status: 401, expectedClass: AuthenticationError },
      { status: 403, expectedClass: AuthorizationError },
      { status: 404, expectedClass: NotFoundError },
      { status: 422, expectedClass: ValidationError },
      { status: 429, expectedClass: RateLimitError },
    ];

    for (const { status, expectedClass } of errorStatuses) {
      const fakeFetch = vi.fn().mockImplementation(async () => {
        return new Response(JSON.stringify({ detail: `Error ${status}` }), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      });

      const transport = new Transport({
        baseUrl: "https://api.test",
        apiKey: "rg_live_test",
        fetch: fakeFetch as any,
        retry: { maxRetries: 0 },
      });

      await expect(
        transport.request({
          method: "POST",
          path: "/v1/test",
          body: {},
        })
      ).rejects.toThrow(expectedClass);
    }
  });

  it("handles request timeout", async () => {
    const fakeFetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      return new Promise((_, reject) => {
        init.signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    const transport = new Transport({
      baseUrl: "https://api.test",
      apiKey: "rg_live_test",
      fetch: fakeFetch as any,
      timeoutMs: 50,
      retry: { maxRetries: 0 },
    });

    await expect(
      transport.request({
        method: "GET",
        path: "/slow",
      })
    ).rejects.toThrow(TimeoutError);
  });

  it("refuses apiKey when browser context is detected", () => {
    // Mock browser environment
    (globalThis as any).window = {};
    (globalThis as any).document = {};

    try {
      expect(
        () =>
          new Transport({
            baseUrl: "https://api.test",
            apiKey: "rg_live_secret",
          })
      ).toThrow(ConfigurationError);
    } finally {
      delete (globalThis as any).window;
      delete (globalThis as any).document;
    }
  });

  it("calls fetch with globalThis receiver even when caller context is lost", async () => {
    let capturedThis: any;
    function mockFetch(this: any, _url: any, _init: any) {
      capturedThis = this;
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
    const transport = new Transport({
      baseUrl: "https://api.test",
      apiKey: "rg_live_test",
      fetch: mockFetch as any,
    });
    const res = await transport.request<{ ok: boolean }>({
      method: "GET",
      path: "/unbound-test",
    });
    expect(res).toEqual({ ok: true });
    expect(capturedThis).toBe(globalThis);
  });
});

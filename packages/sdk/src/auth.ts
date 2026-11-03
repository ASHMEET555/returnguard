/**
 * Token Provider & In-Memory Renewal Helper
 */

import { AuthenticationError } from "./errors";

export interface TokenProviderContext {
  forceRefresh?: boolean;
}

export type TokenProvider = (context?: TokenProviderContext) => Promise<string>;

export interface ClientOptions {
  baseUrl: string;
  apiKey?: string;
  tokenProvider?: TokenProvider;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
  retry?: {
    maxRetries?: number;
    delayMs?: number;
  };
}

/**
 * Checks whether current code is executing within a browser context
 * without relying on DOM TypeScript typings.
 */
export function isBrowserContext(): boolean {
  try {
    const g = globalThis as Record<string, unknown>;
    return (
      typeof g.window !== "undefined" &&
      typeof g.document !== "undefined"
    );
  } catch {
    return false;
  }
}

/**
 * Options for creating an in-memory renewing token provider.
 */
export interface CreateRenewingTokenProviderOptions {
  /**
   * Function that fetches a fresh raw JWT embed token from merchant backend.
   */
  fetchToken: () => Promise<string>;
  /**
   * Margin in seconds before exp to refresh proactively (default 30 seconds).
   */
  refreshMarginSeconds?: number;
}

/**
 * Safely parses the unverified payload of a JWT string in pure JS/TS
 * (without external dependencies or DOM atob).
 */
export function parseJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new AuthenticationError("Invalid JWT token format");
  }

  let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }

  try {
    let jsonStr: string;
    if (typeof Buffer !== "undefined") {
      jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    } else if (typeof globalThis.atob === "function") {
      jsonStr = decodeURIComponent(
        Array.prototype.map
          .call(globalThis.atob(base64), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } else {
      throw new Error("No base64 decoder available");
    }
    return JSON.parse(jsonStr);
  } catch (err) {
    throw new AuthenticationError("Failed to decode JWT payload", { cause: err });
  }
}

/**
 * Creates an in-memory caching and renewing token provider.
 * Tokens are kept in-memory ONLY (never stored in localStorage, sessionStorage, or indexedDB).
 */
export function createRenewingTokenProvider(
  options: CreateRenewingTokenProviderOptions
): TokenProvider {
  let cachedToken: string | null = null;
  let cachedExp: number | null = null;
  const margin = options.refreshMarginSeconds ?? 30;

  return async (context?: TokenProviderContext): Promise<string> => {
    const now = Math.floor(Date.now() / 1000);
    const forceRefresh = Boolean(context?.forceRefresh);

    const isExpiredOrClose =
      cachedExp !== null && now >= cachedExp - margin;

    if (!cachedToken || forceRefresh || isExpiredOrClose) {
      const newToken = await options.fetchToken();
      if (!newToken || typeof newToken !== "string") {
        throw new AuthenticationError("fetchToken returned an invalid token");
      }

      cachedToken = newToken;
      try {
        const payload = parseJwtPayload(newToken);
        if (typeof payload.exp === "number") {
          cachedExp = payload.exp;
        } else {
          cachedExp = null;
        }
      } catch {
        // If exp cannot be parsed, treat as non-cached expiry
        cachedExp = null;
      }
    }

    return cachedToken;
  };
}

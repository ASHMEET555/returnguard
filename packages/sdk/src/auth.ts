/**
 * Token Provider & Auth Types
 */

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

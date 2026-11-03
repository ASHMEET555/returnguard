/**
 * HTTP Transport implementation for ReturnGuard SDK
 */

import {
  AuthenticationError,
  AuthorizationError,
  ConfigurationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ReturnGuardError,
  ServerError,
  TimeoutError,
  ValidationError,
} from "./errors";
import { ClientOptions, isBrowserContext } from "./auth";

export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  allowRetry?: boolean;
}

export class Transport {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly tokenProvider?: ClientOptions["tokenProvider"];
  private readonly fetchFn: typeof globalThis.fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: ClientOptions) {
    if (!options.baseUrl) {
      throw new ConfigurationError("baseUrl is required");
    }

    // Auth validation: exactly one of apiKey or tokenProvider
    const hasApiKey = Boolean(options.apiKey);
    const hasTokenProvider = Boolean(options.tokenProvider);

    if (!hasApiKey && !hasTokenProvider) {
      throw new ConfigurationError("Exactly one of apiKey or tokenProvider must be provided");
    }
    if (hasApiKey && hasTokenProvider) {
      throw new ConfigurationError("Cannot provide both apiKey and tokenProvider");
    }

    // Refuse apiKey in browser context to prevent leaking merchant secrets
    if (hasApiKey && isBrowserContext()) {
      throw new ConfigurationError(
        "apiKey is not permitted in browser environments. Use tokenProvider with an embed token instead."
      );
    }

    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.tokenProvider = options.tokenProvider;
    this.fetchFn = options.fetch || globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.maxRetries = options.retry?.maxRetries ?? 1;
    this.retryDelayMs = options.retry?.delayMs ?? 300;
  }

  private async getAuthToken(forceRefresh = false): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }
    if (this.tokenProvider) {
      try {
        const token = await this.tokenProvider({ forceRefresh });
        if (!token) {
          throw new AuthenticationError("tokenProvider returned an empty token");
        }
        return token;
      } catch (err) {
        if (err instanceof ReturnGuardError) {
          throw err;
        }
        throw new AuthenticationError("Failed to obtain authentication token from tokenProvider", {
          cause: err,
        });
      }
    }
    throw new ConfigurationError("No authentication method available");
  }

  public async request<T>(req: RequestOptions): Promise<T> {
    const isGet = req.method === "GET";
    const canRetry = isGet && (req.allowRetry !== false);
    const maxAttempts = canRetry ? 1 + this.maxRetries : 1;

    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        return await this.executeSingle<T>(req, attempt > 1);
      } catch (err) {
        lastError = err;

        // If 401 and using tokenProvider on first attempt, force refresh once
        if (
          err instanceof AuthenticationError &&
          this.tokenProvider &&
          attempt < maxAttempts
        ) {
          try {
            return await this.executeSingle<T>(req, true);
          } catch (retryErr) {
            throw retryErr;
          }
        }

        // Only retry on network errors, 5xx server errors, or 429 if canRetry is true
        const isRetryableStatus =
          err instanceof ServerError ||
          err instanceof RateLimitError ||
          err instanceof NetworkError ||
          err instanceof TimeoutError;

        if (canRetry && isRetryableStatus && attempt < maxAttempts) {
          const delay =
            err instanceof RateLimitError && err.retryAfterSeconds
              ? err.retryAfterSeconds * 1000
              : this.retryDelayMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  }

  private async executeSingle<T>(req: RequestOptions, forceTokenRefresh = false): Promise<T> {
    const token = await this.getAuthToken(forceTokenRefresh);

    // Build URL with query params
    let url = `${this.baseUrl}${req.path.startsWith("/") ? "" : "/"}${req.path}`;
    if (req.query) {
      const sp = new URLSearchParams();
      for (const [key, val] of Object.entries(req.query)) {
        if (val !== undefined && val !== null) {
          sp.append(key, String(val));
        }
      }
      const qs = sp.toString();
      if (qs) {
        url += (url.includes("?") ? "&" : "?") + qs;
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...req.headers,
    };

    let bodyStr: string | undefined;
    if (req.body !== undefined && req.body !== null) {
      headers["Content-Type"] = "application/json";
      bodyStr = JSON.stringify(req.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await this.fetchFn(url, {
        method: req.method,
        headers,
        body: bodyStr,
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        throw new TimeoutError(`Request timed out after ${this.timeoutMs}ms`, { cause: err });
      }
      throw new NetworkError(`Network request failed: ${err.message || String(err)}`, {
        cause: err,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const requestId = res.headers.get("x-request-id") || undefined;
    const retryAfterHeader = res.headers.get("retry-after");
    const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

    if (!res.ok) {
      let errorBody: any;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = { detail: await res.text().catch(() => "Unknown error") };
      }

      const msg =
        (typeof errorBody?.detail === "string" ? errorBody.detail : "") ||
        errorBody?.message ||
        `HTTP ${res.status} ${res.statusText}`;

      const errorDetails = {
        status: res.status,
        code: errorBody?.code,
        requestId,
        retryAfterSeconds,
      };

      switch (res.status) {
        case 400:
        case 422:
          throw new ValidationError(msg, errorDetails);
        case 401:
          throw new AuthenticationError(msg, errorDetails);
        case 403:
          throw new AuthorizationError(msg, errorDetails);
        case 404:
          throw new NotFoundError(msg, errorDetails);
        case 429:
          throw new RateLimitError(msg, errorDetails);
        default:
          if (res.status >= 500) {
            throw new ServerError(msg, errorDetails);
          }
          throw new ReturnGuardError(msg, errorDetails);
      }
    }

    if (res.status === 204) {
      return {} as T;
    }

    try {
      return (await res.json()) as T;
    } catch (err) {
      throw new ServerError("Failed to parse response JSON", { requestId, cause: err });
    }
  }
}

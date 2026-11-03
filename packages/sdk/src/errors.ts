/**
 * ReturnGuard Typed Errors
 */

export interface ReturnGuardErrorDetails {
  status?: number;
  code?: string;
  requestId?: string;
  retryAfterSeconds?: number;
  cause?: unknown;
}

export class ReturnGuardError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly retryAfterSeconds?: number;
  public readonly cause?: unknown;

  constructor(message: string, details?: ReturnGuardErrorDetails) {
    super(message);
    this.name = "ReturnGuardError";
    this.status = details?.status;
    this.code = details?.code;
    this.requestId = details?.requestId;
    this.retryAfterSeconds = details?.retryAfterSeconds;
    this.cause = details?.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigurationError extends ReturnGuardError {
  constructor(message: string, details?: ReturnGuardErrorDetails) {
    super(message, { ...details, code: details?.code || "CONFIGURATION_ERROR" });
    this.name = "ConfigurationError";
  }
}

export class ValidationError extends ReturnGuardError {
  constructor(message: string, details?: ReturnGuardErrorDetails) {
    super(message, { ...details, status: details?.status || 422, code: details?.code || "VALIDATION_ERROR" });
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends ReturnGuardError {
  constructor(message: string, details?: ReturnGuardErrorDetails) {
    super(message, { ...details, status: 401, code: details?.code || "AUTHENTICATION_ERROR" });
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends ReturnGuardError {
  constructor(message: string, details?: ReturnGuardErrorDetails) {
    super(message, { ...details, status: 403, code: details?.code || "AUTHORIZATION_ERROR" });
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends ReturnGuardError {
  constructor(message: string, details?: ReturnGuardErrorDetails) {
    super(message, { ...details, status: 404, code: details?.code || "NOT_FOUND_ERROR" });
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends ReturnGuardError {
  constructor(message: string, details?: ReturnGuardErrorDetails) {
    super(message, { ...details, status: 429, code: details?.code || "RATE_LIMIT_ERROR" });
    this.name = "RateLimitError";
  }
}

export class ServerError extends ReturnGuardError {
  constructor(message: string, details?: ReturnGuardErrorDetails) {
    super(message, { ...details, status: details?.status || 500, code: details?.code || "SERVER_ERROR" });
    this.name = "ServerError";
  }
}

export class NetworkError extends ReturnGuardError {
  constructor(message: string, details?: ReturnGuardErrorDetails) {
    super(message, { ...details, code: details?.code || "NETWORK_ERROR" });
    this.name = "NetworkError";
  }
}

export class TimeoutError extends ReturnGuardError {
  constructor(message: string, details?: ReturnGuardErrorDetails) {
    super(message, { ...details, code: details?.code || "TIMEOUT_ERROR" });
    this.name = "TimeoutError";
  }
}

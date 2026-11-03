/**
 * ReturnGuard TypeScript SDK Entry Point
 */

export const SDK_VERSION = "0.1.0";

export function getVersion(): string {
  return SDK_VERSION;
}

export { ReturnGuardClient } from "./client";
export { Transport } from "./transport";
export * from "./errors";
export * from "./types";
export * from "./auth";

import { ValidationError } from "./errors";
import { ScorePayload } from "./types";

/**
 * Validates a single monetary value according to ReturnGuard's monetary input contract.
 *
 * Requirements:
 * 1. Decimal strings (e.g. "0.10", "99999999999999999.99") are canonical and accepted without precision loss.
 * 2. Safe integer Numbers (e.g. 100, 0, -50) are accepted for backward compatibility.
 * 3. Non-integer Numbers (e.g. 0.1, 0.1 + 0.2, 1.005), unsafe integers (> MAX_SAFE_INTEGER),
 *    NaN, and Infinity are strictly REJECTED with a clear ValidationError.
 */
export function validateMonetaryValue(val: unknown, fieldPath: string): void {
  if (val === undefined || val === null) {
    return;
  }

  if (typeof val === "number") {
    if (isNaN(val) || !isFinite(val)) {
      throw new ValidationError(
        `Invalid monetary value at ${fieldPath}: non-finite Number (${val}) is rejected. Monetary values must be exact decimal strings or safe integers.`
      );
    }
    if (!Number.isSafeInteger(val)) {
      throw new ValidationError(
        `Invalid monetary value at ${fieldPath}: non-integer or unsafe Number (${val}) is rejected to prevent floating-point precision loss. Use exact decimal string (e.g. "0.10") or validated safe integer.`
      );
    }
    return;
  }

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "" || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
      throw new ValidationError(
        `Invalid monetary value at ${fieldPath}: malformed decimal string "${val}".`
      );
    }
    return;
  }

  throw new ValidationError(
    `Invalid monetary value at ${fieldPath}: expected decimal string or safe integer number, got ${typeof val}.`
  );
}

/**
 * Validates all monetary fields in ScorePayload before HTTP transmission.
 */
export function validateScorePayloadMonetary(payload: ScorePayload): void {
  if (!payload || typeof payload !== "object") {
    return;
  }

  // Validate line_items
  if (Array.isArray(payload.line_items)) {
    payload.line_items.forEach((item, idx) => {
      if (item && typeof item === "object") {
        if ("unit_price" in item && item.unit_price !== undefined) {
          validateMonetaryValue(item.unit_price, `line_items[${idx}].unit_price`);
        }
        if ("total_amount" in item && item.total_amount !== undefined) {
          validateMonetaryValue(item.total_amount, `line_items[${idx}].total_amount`);
        }
      }
    });
  }

  // Validate order_summary
  if (payload.order_summary && typeof payload.order_summary === "object") {
    if ("total" in payload.order_summary && payload.order_summary.total !== undefined) {
      validateMonetaryValue(payload.order_summary.total, "order_summary.total");
    }
    if (Array.isArray(payload.order_summary.items)) {
      payload.order_summary.items.forEach((item, idx) => {
        if (item && typeof item === "object") {
          if ("unit_price" in item && item.unit_price !== undefined) {
            validateMonetaryValue(item.unit_price, `order_summary.items[${idx}].unit_price`);
          }
          if ("total_amount" in item && item.total_amount !== undefined) {
            validateMonetaryValue(item.total_amount, `order_summary.items[${idx}].total_amount`);
          }
        }
      });
    }
  }
}

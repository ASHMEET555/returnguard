/**
 * Centralized dynamic currency formatting and exact monetary arithmetic for ReturnGuard.
 * Supports exact decimal presentation for: USD, INR, EUR, GBP, CAD, AUD.
 *
 * Invariants:
 * 1. Never convert arbitrary-length decimal strings into JavaScript Number for formatting or arithmetic.
 * 2. Preserve the integer portion and exact significant digits without IEEE-754 precision distortion.
 * 3. Never assume USD or any other default currency when unspecified.
 * 4. Never infer currency from browser/machine locale.
 * 5. Never silently convert between currencies.
 * 6. Never perform floating-point aggregations across differing currencies.
 * 7. Apply an explicit Half-Up rounding policy for display formatting while keeping intermediate calculations exact.
 */

export const SUPPORTED_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export interface FormatCurrencyOptions {
  /**
   * If true, always appends the ISO currency code (e.g. "$120.00 USD").
   */
  showCode?: boolean;
  /**
   * Target fraction digits (defaults to 2 for standard monetary display).
   */
  fractionDigits?: number;
}

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const TEN = BigInt(10);

const CURRENCY_CONFIGS: Record<SupportedCurrency, { symbol: string; locale: string; prefix: string }> = {
  USD: { symbol: '$', locale: 'en-US', prefix: '$' },
  INR: { symbol: '₹', locale: 'en-IN', prefix: '₹' },
  EUR: { symbol: '€', locale: 'de-DE', prefix: '€' },
  GBP: { symbol: '£', locale: 'en-GB', prefix: '£' },
  CAD: { symbol: 'CA$', locale: 'en-CA', prefix: 'CA$' },
  AUD: { symbol: 'A$', locale: 'en-AU', prefix: 'A$' },
};

/**
 * Validates if a currency code is one of the 6 supported currencies.
 */
export function isSupportedCurrency(currency: unknown): currency is SupportedCurrency {
  if (typeof currency !== 'string') return false;
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase().trim() as SupportedCurrency);
}

/**
 * Returns the recognized symbol or prefix for a currency code.
 * Returns null if the currency is not supported or not specified.
 */
export function getCurrencySymbol(currency: string | null | undefined): string | null {
  if (!currency || !isSupportedCurrency(currency)) return null;
  return CURRENCY_CONFIGS[currency.toUpperCase().trim() as SupportedCurrency].prefix;
}

export interface ExactDecimal {
  /** Signed unscaled integer representing all digits */
  digits: bigint;
  /** Number of fractional decimal places */
  scale: number;
}

/**
 * Strictly parses an arbitrary string, number, or bigint into an ExactDecimal.
 *
 * Invariants & Contract:
 * 1. Monetary decimal strings (e.g. "0.10", "1234.56") are the canonical representation.
 * 2. Non-integer JavaScript Numbers (e.g. 0.1, 0.1 + 0.2, 1.005) are REJECTED (returns null)
 *    to prevent IEEE-754 floating-point inaccuracies from silently corrupting exact arithmetic.
 * 3. Unsafe integer Numbers (e.g. 9007199254740992, NaN, Infinity) are REJECTED (returns null).
 * 4. Validated safe integer Numbers (e.g. 100, 0) are accepted temporarily for backward compatibility.
 * 5. Quantity may accept validated safe integer Numbers or decimal strings.
 * 6. Rejected values are NEVER converted into strings to claim precision was preserved.
 */
export function parseMonetaryDecimal(value: string | number | bigint | null | undefined): ExactDecimal | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'bigint') {
    return { digits: value, scale: 0 };
  }

  if (typeof value === 'number') {
    // Strictly reject non-integers (0.1, 1.005, float arithmetic) and unsafe integers (> MAX_SAFE_INTEGER, NaN, Infinity)
    if (!Number.isSafeInteger(value)) {
      return null;
    }
    // Accept validated safe integers for backward compatibility; normalize negative zero (-0)
    const intVal = Object.is(value, -0) ? 0 : value;
    return { digits: BigInt(intVal), scale: 0 };
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  // Strict regex: optional single sign, digits, optional decimal point
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    return null;
  }

  const isNegative = trimmed.startsWith('-');
  const unsigned = trimmed.replace(/^[+-]/, '');

  if (unsigned === '' || unsigned === '.') {
    return null;
  }

  let intPart: string;
  let fracPart: string;

  if (unsigned.includes('.')) {
    const parts = unsigned.split('.');
    intPart = parts[0] || '0';
    fracPart = parts[1] || '';
  } else {
    intPart = unsigned;
    fracPart = '';
  }

  // Remove leading zeros in integer part, keeping single '0'
  intPart = intPart.replace(/^0+(?=\d)/, '');
  if (intPart === '') intPart = '0';

  const scale = fracPart.length;
  const combined = intPart + fracPart;
  const rawBig = BigInt(combined);
  const digits = isNegative ? -rawBig : rawBig;

  return { digits, scale };
}

/**
 * Converts an ExactDecimal to a canonical decimal string without scientific notation.
 */
export function decimalToString(decimal: ExactDecimal): string {
  const { digits, scale } = decimal;
  const isNegative = digits < ZERO;
  const absDigits = isNegative ? -digits : digits;
  let str = absDigits.toString();

  if (scale === 0) {
    return (isNegative ? '-' : '') + str;
  }

  if (str.length <= scale) {
    str = str.padStart(scale + 1, '0');
  }

  const intPart = str.slice(0, str.length - scale);
  const fracPart = str.slice(str.length - scale);

  return (isNegative ? '-' : '') + intPart + '.' + fracPart;
}

/**
 * Exact monetary addition: A + B without floating-point error.
 * Preserves exact scale: max(scaleA, scaleB).
 */
export function addMonetaryAmounts(
  a: string | number | bigint,
  b: string | number | bigint
): string {
  const decA = parseMonetaryDecimal(a);
  const decB = parseMonetaryDecimal(b);

  if (!decA || !decB) {
    throw new Error(`Invalid monetary amount in addMonetaryAmounts: a=${a}, b=${b}`);
  }

  const maxScale = Math.max(decA.scale, decB.scale);
  const scaleDiffA = BigInt(maxScale - decA.scale);
  const scaleDiffB = BigInt(maxScale - decB.scale);

  const scaledA = decA.digits * (TEN ** scaleDiffA);
  const scaledB = decB.digits * (TEN ** scaleDiffB);

  const sumDigits = scaledA + scaledB;
  return decimalToString({ digits: sumDigits, scale: maxScale });
}

/**
 * Exact monetary multiplication: Amount * Quantity without floating-point error.
 * Scale is exact sum of scaleAmount + scaleQuantity.
 */
export function multiplyMonetaryAmount(
  amount: string | number | bigint,
  quantity: string | number | bigint
): string {
  const decAmount = parseMonetaryDecimal(amount);
  const decQty = parseMonetaryDecimal(quantity);

  if (!decAmount || !decQty) {
    throw new Error(`Invalid monetary amount in multiplyMonetaryAmount: amount=${amount}, qty=${quantity}`);
  }

  const prodDigits = decAmount.digits * decQty.digits;
  const prodScale = decAmount.scale + decQty.scale;

  return decimalToString({ digits: prodDigits, scale: prodScale });
}

/**
 * Exact monetary summation of an array of amounts.
 */
export function sumMonetaryAmounts(amounts: (string | number | bigint)[]): string {
  if (amounts.length === 0) return '0.00';
  let total = '0.00';
  for (const amt of amounts) {
    total = addMonetaryAmounts(total, amt);
  }
  return total;
}

/**
 * Compares two monetary amounts: returns -1 if a < b, 0 if a == b, 1 if a > b.
 */
export function compareMonetaryAmounts(
  a: string | number | bigint,
  b: string | number | bigint
): number {
  const decA = parseMonetaryDecimal(a);
  const decB = parseMonetaryDecimal(b);

  if (!decA || !decB) {
    throw new Error(`Invalid monetary amount in compareMonetaryAmounts: a=${a}, b=${b}`);
  }

  const maxScale = Math.max(decA.scale, decB.scale);
  const scaledA = decA.digits * (TEN ** BigInt(maxScale - decA.scale));
  const scaledB = decB.digits * (TEN ** BigInt(maxScale - decB.scale));

  if (scaledA < scaledB) return -1;
  if (scaledA > scaledB) return 1;
  return 0;
}

/**
 * Inserts standard thousands separators (commas) into an integer string without converting to Number.
 */
function addThousandsSeparators(intStr: string): string {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats a monetary amount and explicit currency code without floating-point distortion.
 *
 * Guarantees:
 * 1. Decimal strings are parsed with arbitrary precision BigInt; never converted to IEEE-754 Number.
 * 2. Integer digits are preserved completely (no precision cap at Number.MAX_SAFE_INTEGER).
 * 3. Applies an explicit Half-Up rounding policy to the configured target fractionDigits (default 2).
 * 4. Never defaults to USD or infers currency from browser locale.
 * 5. Rejects malformed numeric strings safely with '--'.
 *
 * @param amount - Exact decimal string, number, or bigint
 * @param currency - Explicit ISO currency code
 * @param options - Formatting configuration (showCode, fractionDigits)
 */
export function formatCurrency(
  amount: number | string | bigint | null | undefined,
  currency: string | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  const parsed = parseMonetaryDecimal(amount);
  if (!parsed) {
    return '--';
  }

  const targetDigits = options.fractionDigits ?? 2;
  const isNegative = parsed.digits < ZERO;
  const absDigits = isNegative ? -parsed.digits : parsed.digits;

  let roundedDigits: bigint;

  // Apply explicit Half-Up rounding policy to targetDigits
  if (parsed.scale === targetDigits) {
    roundedDigits = absDigits;
  } else if (parsed.scale < targetDigits) {
    const diff = BigInt(targetDigits - parsed.scale);
    roundedDigits = absDigits * (TEN ** diff);
  } else {
    const diff = BigInt(parsed.scale - targetDigits);
    const factor = TEN ** diff;
    const quotient = absDigits / factor;
    const remainder = absDigits % factor;
    const half = factor / TWO;

    // Half-Up: if remainder >= half, round magnitude up by 1
    if (remainder >= half) {
      roundedDigits = quotient + ONE;
    } else {
      roundedDigits = quotient;
    }
  }

  // Construct integer and fractional strings
  let rawStr = roundedDigits.toString();
  let intPart: string;
  let fracPart: string;

  if (targetDigits > 0) {
    if (rawStr.length <= targetDigits) {
      rawStr = rawStr.padStart(targetDigits + 1, '0');
    }
    intPart = rawStr.slice(0, rawStr.length - targetDigits);
    fracPart = rawStr.slice(rawStr.length - targetDigits);
  } else {
    intPart = rawStr;
    fracPart = '';
  }

  const formattedInt = addThousandsSeparators(intPart);
  const formattedDecimal = targetDigits > 0 ? `${formattedInt}.${fracPart}` : formattedInt;

  // Sign: 0 magnitude never has negative sign
  const sign = (isNegative && roundedDigits !== ZERO) ? '-' : '';

  // Currency validation and output assembly
  if (!currency || typeof currency !== 'string' || currency.trim() === '') {
    return `${sign}${formattedDecimal} (CURRENCY NOT SPECIFIED)`;
  }

  const normalizedCode = currency.toUpperCase().trim();

  if (!isSupportedCurrency(normalizedCode)) {
    return `${sign}${formattedDecimal} ${normalizedCode}`;
  }

  const config = CURRENCY_CONFIGS[normalizedCode];
  const symbolPart = config.prefix;

  if (options.showCode) {
    return `${sign}${symbolPart}${formattedDecimal} ${normalizedCode}`;
  }

  return `${sign}${symbolPart}${formattedDecimal}`;
}

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  isSupportedCurrency,
  getCurrencySymbol,
  SUPPORTED_CURRENCIES,
  addMonetaryAmounts,
  multiplyMonetaryAmount,
  sumMonetaryAmounts,
  compareMonetaryAmounts,
  parseMonetaryDecimal,
} from '../src/utils/currency';

describe('Centralized Dynamic Currency Formatter & Exact Monetary Arithmetic', () => {
  describe('1. Supported Currency Codes & Symbols', () => {
    it('supports all 6 required currencies with correct symbols and formatting', () => {
      expect(formatCurrency('1234.56', 'USD')).toBe('$1,234.56');
      expect(formatCurrency('1234.56', 'INR')).toBe('₹1,234.56');
      expect(formatCurrency('1234.56', 'EUR')).toBe('€1,234.56');
      expect(formatCurrency('1234.56', 'GBP')).toBe('£1,234.56');
      expect(formatCurrency('1234.56', 'CAD')).toBe('CA$1,234.56');
      expect(formatCurrency('1234.56', 'AUD')).toBe('A$1,234.56');
    });

    it('validates supported currencies correctly', () => {
      SUPPORTED_CURRENCIES.forEach((c) => {
        expect(isSupportedCurrency(c)).toBe(true);
        expect(isSupportedCurrency(c.toLowerCase())).toBe(true);
      });
      expect(isSupportedCurrency('CHF')).toBe(false);
      expect(isSupportedCurrency('')).toBe(false);
      expect(isSupportedCurrency(null)).toBe(false);
    });

    it('retrieves currency symbols for supported codes', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('INR')).toBe('₹');
      expect(getCurrencySymbol('CAD')).toBe('CA$');
      expect(getCurrencySymbol('AUD')).toBe('A$');
      expect(getCurrencySymbol('XYZ')).toBe(null);
    });

    it('supports showCode option to disambiguate dollar currencies', () => {
      expect(formatCurrency(50.0, 'USD', { showCode: true })).toBe('$50.00 USD');
      expect(formatCurrency(50.0, 'CAD', { showCode: true })).toBe('CA$50.00 CAD');
      expect(formatCurrency(50.0, 'AUD', { showCode: true })).toBe('A$50.00 AUD');
    });
  });

  describe('2. Exact Formatting Precision & Boundaries', () => {
    it('formats boundary fractional amounts "0.10" and "0.01" accurately', () => {
      expect(formatCurrency('0.10', 'USD')).toBe('$0.10');
      expect(formatCurrency('0.01', 'USD')).toBe('$0.01');
      expect(formatCurrency('0.10', 'EUR')).toBe('€0.10');
      expect(formatCurrency('0.01', 'INR')).toBe('₹0.01');
    });

    it('formats large monetary string "999999999999.99" preserving integer separators and decimals', () => {
      expect(formatCurrency('999999999999.99', 'USD')).toBe('$999,999,999,999.99');
      expect(formatCurrency('999999999999.99', 'GBP')).toBe('£999,999,999,999.99');
    });

    it('preserves values exceeding Number.MAX_SAFE_INTEGER without precision loss', () => {
      // 99,999,999,999,999,999.99 has 17 integer digits (exceeds 9,007,199,254,740,991)
      const huge = '99999999999999999.99';
      expect(formatCurrency(huge, 'USD')).toBe('$99,999,999,999,999,999.99');
    });

    it('handles negative monetary values correctly', () => {
      expect(formatCurrency('-50.25', 'EUR')).toBe('-€50.25');
      expect(formatCurrency('-1200.00', 'CAD')).toBe('-CA$1,200.00');
      expect(formatCurrency('-50.25', 'USD')).toBe('-$50.25');
      expect(formatCurrency(-50, 'USD')).toBe('-$50.00');
    });

    it('handles negative zero gracefully without showing negative sign', () => {
      expect(formatCurrency('-0.00', 'USD')).toBe('$0.00');
      expect(formatCurrency('-0.000', 'USD')).toBe('$0.00');
      expect(formatCurrency(-0, 'USD')).toBe('$0.00');
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });

    it('handles excess fractional digits per explicit Half-Up rounding policy', () => {
      // Default: rounds half away from zero to 2 decimal places
      expect(formatCurrency('123456789.123', 'USD')).toBe('$123,456,789.12');
      expect(formatCurrency('123456789.125', 'USD')).toBe('$123,456,789.13');
      expect(formatCurrency('123456789.129', 'USD')).toBe('$123,456,789.13');

      // Explicit fractionDigits overrides
      expect(formatCurrency('123456789.123', 'USD', { fractionDigits: 3 })).toBe('$123,456,789.123');
      expect(formatCurrency('123456789.123', 'USD', { fractionDigits: 0 })).toBe('$123,456,789');
    });

    it('rejects malformed decimal strings safely with "--"', () => {
      expect(formatCurrency('abc', 'USD')).toBe('--');
      expect(formatCurrency('12.34.56', 'USD')).toBe('--');
      expect(formatCurrency('--10', 'USD')).toBe('--');
      expect(formatCurrency('12e5', 'USD')).toBe('--');
      expect(formatCurrency('', 'USD')).toBe('--');
      expect(formatCurrency('   ', 'USD')).toBe('--');
      expect(formatCurrency(null, 'USD')).toBe('--');
      expect(formatCurrency(undefined, 'USD')).toBe('--');
      expect(formatCurrency(NaN, 'USD')).toBe('--');
      expect(formatCurrency(Infinity, 'USD')).toBe('--');
      expect(formatCurrency(-Infinity, 'USD')).toBe('--');
    });

    it('enforces strict monetary input contract: accepts strings and safe integers, rejects non-integer numbers', () => {
      // 1. "0.10" — accepted
      expect(formatCurrency('0.10', 'USD')).toBe('$0.10');
      expect(parseMonetaryDecimal('0.10')).toEqual({ digits: BigInt(10), scale: 2 });

      // 2. "0.30" — accepted
      expect(formatCurrency('0.30', 'USD')).toBe('$0.30');
      expect(parseMonetaryDecimal('0.30')).toEqual({ digits: BigInt(30), scale: 2 });

      // 3. 0.1 — rejected as a monetary Number
      expect(formatCurrency(0.1, 'USD')).toBe('--');
      expect(parseMonetaryDecimal(0.1)).toBe(null);

      // 4. 0.1 + 0.2 — rejected
      expect(formatCurrency(0.1 + 0.2, 'USD')).toBe('--');
      expect(parseMonetaryDecimal(0.1 + 0.2)).toBe(null);

      // 5. 1.005 — rejected
      expect(formatCurrency(1.005, 'USD')).toBe('--');
      expect(parseMonetaryDecimal(1.005)).toBe(null);

      // 6. 100 — accepted as a safe integer compatibility input
      expect(formatCurrency(100, 'USD')).toBe('$100.00');
      expect(parseMonetaryDecimal(100)).toEqual({ digits: BigInt(100), scale: 0 });

      // 7. 9007199254740992 — rejected
      expect(formatCurrency(9007199254740992, 'USD')).toBe('--');
      expect(parseMonetaryDecimal(9007199254740992)).toBe(null);
      expect(formatCurrency(-9007199254740992, 'USD')).toBe('--');
      expect(parseMonetaryDecimal(-9007199254740992)).toBe(null);

      // 8. NaN and Infinity — rejected
      expect(formatCurrency(NaN, 'USD')).toBe('--');
      expect(parseMonetaryDecimal(NaN)).toBe(null);
      expect(formatCurrency(Infinity, 'USD')).toBe('--');
      expect(parseMonetaryDecimal(Infinity)).toBe(null);
      expect(formatCurrency(-Infinity, 'USD')).toBe('--');
      expect(parseMonetaryDecimal(-Infinity)).toBe(null);

      // Safe integer boundary: MAX_SAFE_INTEGER is accepted
      expect(formatCurrency(9007199254740991, 'USD')).toBe('$9,007,199,254,740,991.00');
      expect(parseMonetaryDecimal(9007199254740991)).toEqual({ digits: BigInt(9007199254740991), scale: 0 });
    });

    it('rejects implicit USD assumptions when currency is missing or empty', () => {
      expect(formatCurrency('100.00', null)).toBe('100.00 (CURRENCY NOT SPECIFIED)');
      expect(formatCurrency('100.00', undefined)).toBe('100.00 (CURRENCY NOT SPECIFIED)');
      expect(formatCurrency('100.00', '')).toBe('100.00 (CURRENCY NOT SPECIFIED)');
      expect(formatCurrency('100.00', '   ')).toBe('100.00 (CURRENCY NOT SPECIFIED)');
      // Invariant: '$' must never appear if currency was not specified
      expect(formatCurrency('100.00', null)).not.toContain('$');
    });

    it('handles unsupported currencies gracefully by appending raw code', () => {
      expect(formatCurrency('450.00', 'JPY')).toBe('450.00 JPY');
      expect(formatCurrency('120.00', 'XYZ')).toBe('120.00 XYZ');
      expect(formatCurrency('10.50', 'BRL')).toBe('10.50 BRL');
    });
  });

  describe('3. Exact Monetary Arithmetic', () => {
    it('accurately computes 0.10 + 0.20 = 0.30 without floating point drift', () => {
      const sum = addMonetaryAmounts('0.10', '0.20');
      expect(sum).toBe('0.30');
      // Format the exact sum
      expect(formatCurrency(sum, 'USD')).toBe('$0.30');
    });

    it('accurately computes 0.10 * 3 = 0.30 without floating point drift', () => {
      const product = multiplyMonetaryAmount('0.10', '3');
      expect(product).toBe('0.30');
      expect(formatCurrency(product, 'EUR')).toBe('€0.30');

      // Also works when quantity is a number
      expect(multiplyMonetaryAmount('0.10', 3)).toBe('0.30');
    });

    it('computes large quantity * unit price calculations with exact precision', () => {
      // 999,999,999,999.99 * 1000 = 999,999,999,999,990.00
      const total = multiplyMonetaryAmount('999999999999.99', '1000');
      expect(total).toBe('999999999999990.00');
      expect(formatCurrency(total, 'USD')).toBe('$999,999,999,999,990.00');
    });

    it('computes calculations exceeding Number.MAX_SAFE_INTEGER exactly', () => {
      // 10,000,000,000,000.00 * 50,000 = 500,000,000,000,000,000.00
      const hugeTotal = multiplyMonetaryAmount('10000000000000.00', '50000');
      expect(hugeTotal).toBe('500000000000000000.00');
      expect(formatCurrency(hugeTotal, 'USD')).toBe('$500,000,000,000,000,000.00');
    });

    it('handles negative monetary arithmetic correctly', () => {
      expect(addMonetaryAmounts('-50.00', '20.00')).toBe('-30.00');
      expect(addMonetaryAmounts('20.00', '-50.00')).toBe('-30.00');
      expect(multiplyMonetaryAmount('-25.50', '2')).toBe('-51.00');
    });

    it('sums array of monetary amounts exactly', () => {
      const items = ['0.10', '0.20', '0.30', '0.40'];
      expect(sumMonetaryAmounts(items)).toBe('1.00');
      expect(sumMonetaryAmounts([])).toBe('0.00');
    });

    it('compares monetary amounts correctly', () => {
      expect(compareMonetaryAmounts('0.10', '0.20')).toBe(-1);
      expect(compareMonetaryAmounts('0.20', '0.10')).toBe(1);
      expect(compareMonetaryAmounts('0.10', '0.10')).toBe(0);
      expect(compareMonetaryAmounts('0.1', '0.10')).toBe(0);
      expect(compareMonetaryAmounts('-5.00', '1.00')).toBe(-1);
    });

    it('throws descriptive error on malformed inputs to arithmetic operations', () => {
      expect(() => addMonetaryAmounts('abc', '10.00')).toThrow(/Invalid monetary amount/);
      expect(() => multiplyMonetaryAmount('10.00', 'xyz')).toThrow(/Invalid monetary amount/);
    });
  });
});

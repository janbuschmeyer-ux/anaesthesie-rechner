import { describe, expect, it } from 'vitest';
import { parseDecimalInput } from '../../src/domain/parser';

describe('parseDecimalInput', () => {
  it.each([
    ['0,5', '0.5'],
    ['0.5', '0.5'],
    ['  12  ', '12'],
    ['0', '0']
  ])('parst %s zentral', (raw, expected) => {
    const result = parseDecimalInput(raw, { allowZero: true });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.normalized).toBe(expected);
      expect(result.value.toString()).toBe(expected);
    }
  });

  it.each([
    ['', 'REQUIRED'],
    ['-1', 'NEGATIVE_NOT_ALLOWED'],
    ['+1', 'INVALID_NUMBER'],
    ['.5', 'INVALID_NUMBER'],
    [',5', 'INVALID_NUMBER'],
    ['1,2.3', 'INVALID_NUMBER'],
    ['1e3', 'INVALID_NUMBER'],
    ['NaN', 'INVALID_NUMBER'],
    ['Infinity', 'INVALID_NUMBER'],
    ['1 000', 'INVALID_NUMBER']
  ])('weist %s mit %s ab', (raw, code) => {
    const result = parseDecimalInput(raw, { allowZero: true });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.code).toBe(code);
  });

  it('behandelt Null abhängig von der Formel', () => {
    const invalid = parseDecimalInput('0');
    expect(invalid.valid).toBe(false);
    if (!invalid.valid) expect(invalid.error.code).toBe('ZERO_NOT_ALLOWED');
    expect(parseDecimalInput('0', { allowZero: true }).valid).toBe(true);
  });

  it('begrenzt signifikante Stellen und Eingabelänge', () => {
    const tooPrecise = parseDecimalInput('1234567890123456789012345678901', { allowZero: true });
    expect(tooPrecise.valid).toBe(false);
    if (!tooPrecise.valid) expect(tooPrecise.error.code).toBe('NUMBER_TOO_LONG');

    const tooLong = parseDecimalInput(`0.${'0'.repeat(81)}1`, { allowZero: true });
    expect(tooLong.valid).toBe(false);
    if (!tooLong.valid) expect(tooLong.error.code).toBe('INVALID_NUMBER');
  });
});

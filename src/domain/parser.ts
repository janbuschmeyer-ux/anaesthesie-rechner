import { decimal, type DecimalValue } from './decimal';

export type InputErrorCode =
  | 'REQUIRED'
  | 'INVALID_NUMBER'
  | 'NEGATIVE_NOT_ALLOWED'
  | 'ZERO_NOT_ALLOWED'
  | 'NUMBER_TOO_LONG';

export interface InputError {
  readonly code: InputErrorCode;
  readonly message: string;
}

export type ParseResult =
  | { readonly valid: true; readonly value: DecimalValue; readonly normalized: string }
  | { readonly valid: false; readonly error: InputError };

export interface ParseOptions {
  readonly allowZero?: boolean;
}

const plainDecimalPattern = /^\d+(?:[.,]\d+)?$/;

export function parseDecimalInput(raw: string, options: ParseOptions = {}): ParseResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: { code: 'REQUIRED', message: 'Bitte einen Wert eingeben.' } };
  }
  if (trimmed.startsWith('-')) {
    return {
      valid: false,
      error: { code: 'NEGATIVE_NOT_ALLOWED', message: 'Negative Werte sind nicht zulässig.' }
    };
  }
  if (trimmed.length > 80 || !plainDecimalPattern.test(trimmed)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_NUMBER',
        message: 'Bitte eine Zahl wie 0,5 oder 0.5 ohne Tausendertrennzeichen eingeben.'
      }
    };
  }

  const normalized = trimmed.replace(',', '.');
  const significantDigits = normalized.replace('.', '').replace(/^0+/, '').length;
  if (significantDigits > 30) {
    return {
      valid: false,
      error: { code: 'NUMBER_TOO_LONG', message: 'Bitte höchstens 30 signifikante Stellen eingeben.' }
    };
  }

  const value = decimal(normalized);
  if (!options.allowZero && value.isZero()) {
    return {
      valid: false,
      error: { code: 'ZERO_NOT_ALLOWED', message: 'Bitte einen Wert größer als 0 eingeben.' }
    };
  }

  return { valid: true, value, normalized };
}

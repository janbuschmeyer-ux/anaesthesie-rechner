import type { DecimalValue } from './decimal';
import { formatDecimal, internalDecimal } from './format';
import { getUnit, type AnyUnitId } from './units';

export type CalculationErrorCode =
  | 'NEGATIVE_NOT_ALLOWED'
  | 'ZERO_NOT_ALLOWED'
  | 'INCOMPATIBLE_UNIT'
  | 'DIVISION_BY_ZERO'
  | 'TARGET_EXCEEDS_SOURCE'
  | 'SOURCE_VOLUME_EXCEEDS_FINAL'
  | 'UNSUPPORTED_PERCENT_TYPE';

export interface CalculationError {
  readonly code: CalculationErrorCode;
  readonly field?: string;
  readonly message: string;
}

export type WarningCode = 'PREFIX_FACTOR_1000' | 'MG_UG_CONFLICT' | 'EXTREME_MAGNITUDE';

export interface CalculationWarning {
  readonly code: WarningCode;
  readonly message: string;
}

export interface NormalizedInput {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

export interface EnteredInput {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

export interface CalculationOutput {
  readonly label: string;
  readonly value: DecimalValue;
  readonly resultUnit: AnyUnitId;
  readonly unroundedValue: string;
  readonly displayValue: string;
  readonly rounded: boolean;
}

export interface CalculationSuccess {
  readonly valid: true;
  readonly validationStatus: 'valid';
  readonly enteredInputs: readonly EnteredInput[];
  readonly normalizedInputs: readonly NormalizedInput[];
  readonly outputs: readonly CalculationOutput[];
  readonly formula: string;
  readonly substitution: string;
  readonly steps: readonly string[];
  readonly warnings: readonly CalculationWarning[];
}

export interface CalculationFailure {
  readonly valid: false;
  readonly validationStatus: 'invalid';
  readonly errors: readonly CalculationError[];
  readonly warnings: readonly CalculationWarning[];
}

export type CalculationResult = CalculationSuccess | CalculationFailure;

export function failure(error: CalculationError): CalculationFailure {
  return { valid: false, validationStatus: 'invalid', errors: [error], warnings: [] };
}

export function output(label: string, value: DecimalValue, resultUnit: AnyUnitId): CalculationOutput {
  const formatted = formatDecimal(value);
  return {
    label,
    value,
    resultUnit,
    unroundedValue: internalDecimal(value),
    displayValue: formatted.display,
    rounded: formatted.rounded
  };
}

function hasSpread(values: readonly number[]): boolean {
  return values.length > 1 && Math.max(...values) - Math.min(...values) >= 3;
}

export function unitWarnings(units: readonly AnyUnitId[]): CalculationWarning[] {
  const definitions = units.map(getUnit);
  const massPowers = definitions.flatMap((item) => (item.massPower === undefined ? [] : [item.massPower]));
  const volumePowers = definitions.flatMap((item) => (item.volumePower === undefined ? [] : [item.volumePower]));
  const weightPowers = definitions.flatMap((item) => (item.weightPower === undefined ? [] : [item.weightPower]));
  const warnings: CalculationWarning[] = [];

  if (hasSpread(massPowers) || hasSpread(volumePowers) || hasSpread(weightPowers)) {
    warnings.push({
      code: 'PREFIX_FACTOR_1000',
      message: 'Bei dieser Berechnung findet eine Umrechnung um den Faktor 1.000 oder ein Vielfaches statt. Bitte Eingabewert und Einheit besonders sorgfältig prüfen.'
    });
  }
  if (massPowers.includes(-3) && massPowers.includes(-6)) {
    warnings.push({
      code: 'MG_UG_CONFLICT',
      message: 'In dieser Berechnung werden mg und µg gemeinsam verwendet. Bitte Eingabewert und Einheit besonders sorgfältig prüfen.'
    });
  }
  return warnings;
}

export function addMagnitudeWarnings(
  warnings: readonly CalculationWarning[],
  outputs: readonly CalculationOutput[]
): CalculationWarning[] {
  const extreme = outputs.some(({ value }) =>
    !value.isZero() && (value.abs().lt('0.001') || value.abs().gte('1000000'))
  );
  return extreme
    ? [
        ...warnings,
        {
          code: 'EXTREME_MAGNITUDE',
          message: 'Das mathematische Ergebnis ist sehr groß oder sehr klein. Bitte Eingaben, Dezimaltrennzeichen und Einheiten prüfen.'
        }
      ]
    : [...warnings];
}

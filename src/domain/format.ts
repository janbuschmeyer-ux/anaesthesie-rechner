import { decimal, type DecimalValue } from './decimal';

export interface FormattedDecimal {
  readonly display: string;
  readonly rounded: boolean;
}

function localize(value: string): string {
  return value.replace('.', ',');
}

export function internalDecimal(value: DecimalValue): string {
  return value.toSignificantDigits(40).toString();
}

export function formatDecimal(value: DecimalValue): FormattedDecimal {
  if (value.isZero()) return { display: '0', rounded: false };

  const roundedValue = value.toSignificantDigits(8);
  const absolute = roundedValue.abs();
  const rounded = !roundedValue.equals(value);

  if (absolute.lt(decimal('0.000000001')) || absolute.gte(decimal('1000000000'))) {
    const [mantissa = '0', exponent = '0'] = roundedValue.toExponential(7).split('e');
    const cleanMantissa = mantissa.replace(/(?:\.0+|(?:(\.[0-9]*?)0+))$/, '$1');
    const cleanExponent = exponent.replace('+', '').replace(/^(-?)0+/, '$1');
    return { display: `${localize(cleanMantissa)} × 10^${cleanExponent || '0'}`, rounded };
  }

  let fixed = roundedValue.toFixed();
  if (fixed.includes('.')) {
    fixed = fixed.replace(/0+$/, '').replace(/\.$/, '');
  }
  return { display: localize(fixed), rounded };
}

export function formatForPath(value: DecimalValue): string {
  const fixed = value.toFixed();
  return localize(fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed);
}

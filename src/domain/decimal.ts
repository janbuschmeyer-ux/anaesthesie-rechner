import Decimal from 'decimal.js';

export const CalculatorDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -40,
  toExpPos: 40
});

export type DecimalValue = Decimal;

export function decimal(value: Decimal.Value): DecimalValue {
  return new CalculatorDecimal(value);
}

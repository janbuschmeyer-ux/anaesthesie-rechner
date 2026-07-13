import { describe, expect, it } from 'vitest';
import { decimal } from '../../src/domain/decimal';
import { formatDecimal, formatForPath, internalDecimal } from '../../src/domain/format';
import { addMagnitudeWarnings, output, unitWarnings } from '../../src/domain/result';

describe('deutsche Ergebnisformatierung', () => {
  it.each([
    ['0', '0', false],
    ['5.0', '5', false],
    ['0.5', '0,5', false],
    ['1.234567891', '1,2345679', true],
    ['0.0000000001', '1 × 10^-10', false],
    ['1000000000', '1 × 10^9', false]
  ] as const)('formatiert %s', (raw, display, rounded) => {
    expect(formatDecimal(decimal(raw))).toEqual({ display, rounded });
  });

  it('formatiert Rechenwege und hält den internen Wert getrennt', () => {
    const third = decimal(1).div(3);
    expect(formatForPath(decimal('12.5000'))).toBe('12,5');
    expect(internalDecimal(third)).toMatch(/^0\.333/);
  });
});

describe('Warnungen', () => {
  it('erkennt Faktor 1.000 und mg/µg', () => {
    const warnings = unitWarnings(['mg', 'ug_per_mL', 'mL']);
    expect(warnings.map(({ code }) => code)).toEqual(['PREFIX_FACTOR_1000', 'MG_UG_CONFLICT']);
  });

  it('warnt auch bei Volumen- und Gewichtssprüngen', () => {
    expect(unitWarnings(['L', 'mL']).some(({ code }) => code === 'PREFIX_FACTOR_1000')).toBe(true);
    expect(unitWarnings(['kg_body', 'g_body']).some(({ code }) => code === 'PREFIX_FACTOR_1000')).toBe(true);
    expect(unitWarnings(['mg', 'mg_per_mL']).length).toBe(0);
  });

  it('kennzeichnet sehr kleine und sehr große Ergebnisse', () => {
    const small = output('Klein', decimal('0.0009'), 'mg');
    const large = output('Groß', decimal('1000000'), 'mg');
    expect(addMagnitudeWarnings([], [small]).at(-1)?.code).toBe('EXTREME_MAGNITUDE');
    expect(addMagnitudeWarnings([], [large]).at(-1)?.code).toBe('EXTREME_MAGNITUDE');
    expect(addMagnitudeWarnings([], [output('Normal', decimal(1), 'mg')])).toEqual([]);
  });
});

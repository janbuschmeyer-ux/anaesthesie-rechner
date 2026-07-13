import { describe, expect, it } from 'vitest';
import { decimal } from '../../src/domain/decimal';
import {
  UNIT_DEFINITIONS,
  convert,
  fromBase,
  getUnit,
  isUnitOfKind,
  quantity,
  sameDimension,
  substanceFamily,
  toBase,
  unitSymbol
} from '../../src/domain/units';

describe('Einheitensystem', () => {
  it.each([
    ['g', 'mg', '1', '1000'],
    ['mg', 'ug', '1', '1000'],
    ['ug', 'mg', '1000', '1'],
    ['ug', 'ng', '1', '1000'],
    ['L', 'mL', '1', '1000'],
    ['mL', 'uL', '1', '1000'],
    ['kg_body', 'g_body', '1', '1000'],
    ['g_per_L', 'mg_per_mL', '1', '1'],
    ['mg_per_mL', 'ug_per_mL', '1', '1000'],
    ['mg_per_L', 'ug_per_L', '1', '1000'],
    ['mg_per_h', 'ug_per_h', '1', '1000'],
    ['mg_per_kg_h', 'ug_per_kg_h', '1', '1000']
  ] as const)('konvertiert %s nach %s', (from, to, value, expected) => {
    expect(convert(decimal(value), from, to).toString()).toBe(expected);
  });

  it('normalisiert jede Unit vorwärts und rückwärts ohne Verlust', () => {
    for (const [id] of UNIT_DEFINITIONS) {
      const value = decimal('7.25');
      expect(fromBase(toBase(value, id), id).equals(value)).toBe(true);
    }
  });

  it('lehnt inkompatible Dimensionen ab', () => {
    expect(sameDimension('mg', 'mL')).toBe(false);
    expect(() => convert(decimal(1), 'mg', 'mL')).toThrow('Incompatible dimensions');
  });

  it('liefert Definitionen, Symbole, Typprüfungen und Substanzfamilien', () => {
    expect(getUnit('ug').kind).toBe('mass');
    expect(unitSymbol('ug')).toBe('µg');
    expect(isUnitOfKind('mL', 'volume')).toBe(true);
    expect(isUnitOfKind('mL', 'mass')).toBe(false);
    expect(substanceFamily('mg_per_mL')).toBe('mass');
    expect(substanceFamily('IU_per_mL')).toBe('activity');
    expect(substanceFamily('mL')).toBeUndefined();
    expect(quantity<'mass'>(decimal(2), 'mg')).toEqual({ value: decimal(2), unit: 'mg' });
    expect(() => getUnit('unknown' as never)).toThrow('Unknown unit');
  });
});

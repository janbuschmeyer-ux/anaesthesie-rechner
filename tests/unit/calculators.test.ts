import { describe, expect, it } from 'vitest';
import {
  calculateConcentration,
  calculateContainedAmount,
  calculateDilution,
  calculatePumpRateForward,
  calculatePumpRateReverse,
  calculateRequiredVolume,
  calculateWeightDose,
  calculateWeightVolumePercent
} from '../../src/domain/calculators';
import { decimal } from '../../src/domain/decimal';
import { quantity } from '../../src/domain/units';

function expectOutput(result: ReturnType<typeof calculateConcentration>, index: number, expected: string): void {
  expect(result.valid).toBe(true);
  if (result.valid) {
    expect(result.outputs[index]?.value.toString()).toBe(expected);
    expect(result.outputs[index]?.resultUnit).toBeTruthy();
    expect(result.formula.length).toBeGreaterThan(0);
    expect(result.substitution.length).toBeGreaterThan(0);
    expect(result.enteredInputs.length).toBeGreaterThan(0);
    expect(result.normalizedInputs.length).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
  }
}

describe('Konzentration, Volumen und Wirkstoffmenge', () => {
  it('berechnet 12 mg in 3 mL als 4 mg/mL', () => {
    const result = calculateConcentration({
      substance: 'mass',
      amount: quantity<'mass'>(decimal(12), 'mg'),
      volume: quantity<'volume'>(decimal(3), 'mL'),
      outputUnit: 'mg_per_mL'
    });
    expectOutput(result, 0, '4');
  });

  it('berechnet IE-Konzentrationen ohne Massenumrechnung', () => {
    const result = calculateConcentration({
      substance: 'activity',
      amount: quantity<'activity'>(decimal(100), 'IU'),
      volume: quantity<'volume'>(decimal(20), 'mL'),
      outputUnit: 'IU_per_mL'
    });
    expectOutput(result, 0, '5');
  });

  it('berechnet benötigtes Volumen für Masse und IE', () => {
    const mass = calculateRequiredVolume({
      substance: 'mass',
      amount: quantity<'mass'>(decimal(2), 'mg'),
      concentration: quantity<'massConcentration'>(decimal('0.5'), 'mg_per_mL'),
      outputUnit: 'mL'
    });
    expectOutput(mass, 0, '4');

    const activity = calculateRequiredVolume({
      substance: 'activity',
      amount: quantity<'activity'>(decimal(20), 'IU'),
      concentration: quantity<'activityConcentration'>(decimal(5), 'IU_per_mL'),
      outputUnit: 'mL'
    });
    expectOutput(activity, 0, '4');
  });

  it('berechnet enthaltene Menge für Masse und IE', () => {
    const mass = calculateContainedAmount({
      substance: 'mass',
      concentration: quantity<'massConcentration'>(decimal(25), 'ug_per_mL'),
      volume: quantity<'volume'>(decimal(4), 'mL'),
      outputUnit: 'ug'
    });
    expectOutput(mass, 0, '100');

    const activity = calculateContainedAmount({
      substance: 'activity',
      concentration: quantity<'activityConcentration'>(decimal(5), 'IU_per_mL'),
      volume: quantity<'volume'>(decimal(4), 'mL'),
      outputUnit: 'IU'
    });
    expectOutput(activity, 0, '20');
  });

  it('erlaubt mathematische Null-Zähler', () => {
    const result = calculateConcentration({
      substance: 'mass',
      amount: quantity<'mass'>(decimal(0), 'mg'),
      volume: quantity<'volume'>(decimal(3), 'mL'),
      outputUnit: 'mg_per_mL'
    });
    expectOutput(result, 0, '0');
  });
});

describe('Verdünnung', () => {
  it('berechnet 10 mL Ausgangslösung plus 40 mL Verdünnungsvolumen', () => {
    const result = calculateDilution({
      substance: 'mass',
      sourceConcentration: quantity<'massConcentration'>(decimal(10), 'mg_per_mL'),
      targetConcentration: quantity<'massConcentration'>(decimal(2), 'mg_per_mL'),
      finalVolume: quantity<'volume'>(decimal(50), 'mL'),
      outputUnit: 'mL'
    });
    expectOutput(result, 0, '10');
    expectOutput(result, 1, '40');
  });

  it('unterstützt IE-Verdünnungen', () => {
    const result = calculateDilution({
      substance: 'activity',
      sourceConcentration: quantity<'activityConcentration'>(decimal(100), 'IU_per_mL'),
      targetConcentration: quantity<'activityConcentration'>(decimal(25), 'IU_per_mL'),
      finalVolume: quantity<'volume'>(decimal(20), 'mL'),
      outputUnit: 'mL'
    });
    expectOutput(result, 0, '5');
    expectOutput(result, 1, '15');
  });

  it('erlaubt gleiche Konzentrationen mit 0 mL Verdünnungsvolumen', () => {
    const result = calculateDilution({
      substance: 'mass',
      sourceConcentration: quantity<'massConcentration'>(decimal(2), 'mg_per_mL'),
      targetConcentration: quantity<'massConcentration'>(decimal(2), 'mg_per_mL'),
      finalVolume: quantity<'volume'>(decimal(5), 'mL'),
      outputUnit: 'mL'
    });
    expectOutput(result, 0, '5');
    expectOutput(result, 1, '0');
  });

  it('weist eine höhere Zielkonzentration ab', () => {
    const result = calculateDilution({
      substance: 'mass',
      sourceConcentration: quantity<'massConcentration'>(decimal(2), 'mg_per_mL'),
      targetConcentration: quantity<'massConcentration'>(decimal(3), 'mg_per_mL'),
      finalVolume: quantity<'volume'>(decimal(5), 'mL'),
      outputUnit: 'mL'
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors[0]?.code).toBe('TARGET_EXCEEDS_SOURCE');
  });
});

describe('Gewichtsbezogene Dosis', () => {
  it('berechnet Gesamtmenge und Volumen', () => {
    const result = calculateWeightDose({
      weight: quantity<'bodyWeight'>(decimal(8), 'kg_body'),
      dose: quantity<'massDosePerWeight'>(decimal(3), 'mg_per_kg'),
      concentration: quantity<'massConcentration'>(decimal(6), 'mg_per_mL'),
      amountOutputUnit: 'mg',
      volumeOutputUnit: 'mL'
    });
    expectOutput(result, 0, '24');
    expectOutput(result, 1, '4');
  });

  it('konvertiert Körpergewicht in g und Dosis in µg/kg', () => {
    const result = calculateWeightDose({
      weight: quantity<'bodyWeight'>(decimal(8000), 'g_body'),
      dose: quantity<'massDosePerWeight'>(decimal(3000), 'ug_per_kg'),
      concentration: quantity<'massConcentration'>(decimal(6), 'mg_per_mL'),
      amountOutputUnit: 'mg',
      volumeOutputUnit: 'mL'
    });
    expectOutput(result, 0, '24');
    expectOutput(result, 1, '4');
  });
});

describe('Infusions- und Perfusorraten', () => {
  it('berechnet µg/kg/min vorwärts und konsistent rückwärts', () => {
    const forward = calculatePumpRateForward({
      rateType: 'massWeight',
      rate: quantity<'massWeightRate'>(decimal('0.2'), 'ug_per_kg_min'),
      weight: quantity<'bodyWeight'>(decimal(50), 'kg_body'),
      concentration: quantity<'massConcentration'>(decimal(20), 'ug_per_mL')
    });
    expectOutput(forward, 0, '30');

    const reverse = calculatePumpRateReverse({
      rateType: 'massWeight',
      pumpRate: quantity<'volumeRate'>(decimal(30), 'mL_per_h'),
      concentration: quantity<'massConcentration'>(decimal(20), 'ug_per_mL'),
      weight: quantity<'bodyWeight'>(decimal(50), 'kg_body'),
      outputUnit: 'ug_per_kg_min'
    });
    expectOutput(reverse, 0, '0.2');
  });

  it('berechnet absolute Masseraten vorwärts und rückwärts', () => {
    const forward = calculatePumpRateForward({
      rateType: 'massAbsolute',
      rate: quantity<'massAbsoluteRate'>(decimal(6), 'mg_per_h'),
      concentration: quantity<'massConcentration'>(decimal(2), 'mg_per_mL')
    });
    expectOutput(forward, 0, '3');
    const reverse = calculatePumpRateReverse({
      rateType: 'massAbsolute',
      pumpRate: quantity<'volumeRate'>(decimal(3), 'mL_per_h'),
      concentration: quantity<'massConcentration'>(decimal(2), 'mg_per_mL'),
      outputUnit: 'mg_per_h'
    });
    expectOutput(reverse, 0, '6');
  });

  it('berechnet IE/kg/h vorwärts und rückwärts', () => {
    const forward = calculatePumpRateForward({
      rateType: 'activityWeight',
      rate: quantity<'activityWeightRate'>(decimal(4), 'IU_per_kg_h'),
      weight: quantity<'bodyWeight'>(decimal(25), 'kg_body'),
      concentration: quantity<'activityConcentration'>(decimal(50), 'IU_per_mL')
    });
    expectOutput(forward, 0, '2');
    const reverse = calculatePumpRateReverse({
      rateType: 'activityWeight',
      pumpRate: quantity<'volumeRate'>(decimal(2), 'mL_per_h'),
      concentration: quantity<'activityConcentration'>(decimal(50), 'IU_per_mL'),
      weight: quantity<'bodyWeight'>(decimal(25), 'kg_body'),
      outputUnit: 'IU_per_kg_h'
    });
    expectOutput(reverse, 0, '4');
  });

  it('berechnet absolute IE/h-Raten', () => {
    const forward = calculatePumpRateForward({
      rateType: 'activityAbsolute',
      rate: quantity<'activityAbsoluteRate'>(decimal(100), 'IU_per_h'),
      concentration: quantity<'activityConcentration'>(decimal(50), 'IU_per_mL')
    });
    expectOutput(forward, 0, '2');
    const reverse = calculatePumpRateReverse({
      rateType: 'activityAbsolute',
      pumpRate: quantity<'volumeRate'>(decimal(2), 'mL_per_h'),
      concentration: quantity<'activityConcentration'>(decimal(50), 'IU_per_mL'),
      outputUnit: 'IU_per_h'
    });
    expectOutput(reverse, 0, '100');
  });
});

describe('% w/v', () => {
  it('rechnet 2 % w/v in 20 mg/mL um', () => {
    expectOutput(calculateWeightVolumePercent(decimal(2), 'w/v'), 0, '20');
  });

  it.each(['v/v', 'w/w'] as const)('weist %s ab', (type) => {
    const result = calculateWeightVolumePercent(decimal(2), type);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors[0]?.code).toBe('UNSUPPORTED_PERCENT_TYPE');
  });
});

describe('Fehlerfälle und Grenzwerte', () => {
  it('weist negative Werte und Null-Nenner ab', () => {
    const negative = calculateConcentration({
      substance: 'mass',
      amount: quantity<'mass'>(decimal(-1), 'mg'),
      volume: quantity<'volume'>(decimal(1), 'mL'),
      outputUnit: 'mg_per_mL'
    });
    expect(negative.valid).toBe(false);
    if (!negative.valid) expect(negative.errors[0]?.code).toBe('NEGATIVE_NOT_ALLOWED');

    const zero = calculateRequiredVolume({
      substance: 'mass',
      amount: quantity<'mass'>(decimal(1), 'mg'),
      concentration: quantity<'massConcentration'>(decimal(0), 'mg_per_mL'),
      outputUnit: 'mL'
    });
    expect(zero.valid).toBe(false);
    if (!zero.valid) expect(zero.errors[0]?.code).toBe('ZERO_NOT_ALLOWED');
  });

  it('verarbeitet sehr kleine und sehr große Werte', () => {
    const small = calculateConcentration({
      substance: 'mass',
      amount: quantity<'mass'>(decimal('0.000000000001'), 'mg'),
      volume: quantity<'volume'>(decimal(1), 'L'),
      outputUnit: 'mg_per_L'
    });
    expectOutput(small, 0, '0.000000000001');
    if (small.valid) expect(small.warnings.some(({ code }) => code === 'EXTREME_MAGNITUDE')).toBe(true);

    const large = calculateConcentration({
      substance: 'mass',
      amount: quantity<'mass'>(decimal('1000000000000'), 'mg'),
      volume: quantity<'volume'>(decimal(1), 'mL'),
      outputUnit: 'mg_per_mL'
    });
    expectOutput(large, 0, '1000000000000');
  });

  it('liefert eine Faktor-1.000- und mg/µg-Warnung', () => {
    const result = calculateRequiredVolume({
      substance: 'mass',
      amount: quantity<'mass'>(decimal(1), 'mg'),
      concentration: quantity<'massConcentration'>(decimal(100), 'ug_per_mL'),
      outputUnit: 'mL'
    });
    expectOutput(result, 0, '10');
    if (result.valid) {
      expect(result.warnings.map(({ code }) => code)).toContain('PREFIX_FACTOR_1000');
      expect(result.warnings.map(({ code }) => code)).toContain('MG_UG_CONFLICT');
    }
  });

  it('prüft Null-Nenner und inkompatible Konzentrationseinheiten in allen Grundrechnern', () => {
    const zeroVolume = calculateConcentration({
      substance: 'mass',
      amount: quantity<'mass'>(decimal(1), 'mg'),
      volume: quantity<'volume'>(decimal(0), 'mL'),
      outputUnit: 'mg_per_mL'
    });
    expect(zeroVolume.valid).toBe(false);

    const wrongConcentration = calculateConcentration({
      substance: 'mass',
      amount: quantity<'activity'>(decimal(1), 'IU'),
      volume: quantity<'volume'>(decimal(1), 'mL'),
      outputUnit: 'mg_per_mL'
    } as unknown as Parameters<typeof calculateConcentration>[0]);
    expect(wrongConcentration.valid).toBe(false);
    if (!wrongConcentration.valid) expect(wrongConcentration.errors[0]?.code).toBe('INCOMPATIBLE_UNIT');

    const negativeDesired = calculateRequiredVolume({
      substance: 'mass',
      amount: quantity<'mass'>(decimal(-1), 'mg'),
      concentration: quantity<'massConcentration'>(decimal(1), 'mg_per_mL'),
      outputUnit: 'mL'
    });
    expect(negativeDesired.valid).toBe(false);

    const wrongRequired = calculateRequiredVolume({
      substance: 'mass',
      amount: quantity<'mass'>(decimal(1), 'mg'),
      concentration: quantity<'activityConcentration'>(decimal(1), 'IU_per_mL'),
      outputUnit: 'mL'
    } as unknown as Parameters<typeof calculateRequiredVolume>[0]);
    expect(wrongRequired.valid).toBe(false);

    const negativeContained = calculateContainedAmount({
      substance: 'mass',
      concentration: quantity<'massConcentration'>(decimal(-1), 'mg_per_mL'),
      volume: quantity<'volume'>(decimal(1), 'mL'),
      outputUnit: 'mg'
    });
    expect(negativeContained.valid).toBe(false);
    const negativeContainedVolume = calculateContainedAmount({
      substance: 'mass',
      concentration: quantity<'massConcentration'>(decimal(1), 'mg_per_mL'),
      volume: quantity<'volume'>(decimal(-1), 'mL'),
      outputUnit: 'mg'
    });
    expect(negativeContainedVolume.valid).toBe(false);
    const wrongContained = calculateContainedAmount({
      substance: 'mass',
      concentration: quantity<'activityConcentration'>(decimal(1), 'IU_per_mL'),
      volume: quantity<'volume'>(decimal(1), 'mL'),
      outputUnit: 'mg'
    } as unknown as Parameters<typeof calculateContainedAmount>[0]);
    expect(wrongContained.valid).toBe(false);
  });

  it('prüft alle Verdünnungs-Nenner und meldet beide ungültigen Beziehungen', () => {
    const base = {
      substance: 'mass' as const,
      sourceConcentration: quantity<'massConcentration'>(decimal(10), 'mg_per_mL'),
      targetConcentration: quantity<'massConcentration'>(decimal(2), 'mg_per_mL'),
      finalVolume: quantity<'volume'>(decimal(10), 'mL'),
      outputUnit: 'mL' as const
    };
    expect(calculateDilution({ ...base, sourceConcentration: quantity<'massConcentration'>(decimal(0), 'mg_per_mL') }).valid).toBe(false);
    expect(calculateDilution({ ...base, targetConcentration: quantity<'massConcentration'>(decimal(0), 'mg_per_mL') }).valid).toBe(false);
    expect(calculateDilution({ ...base, finalVolume: quantity<'volume'>(decimal(0), 'mL') }).valid).toBe(false);
    const invalid = calculateDilution({ ...base, targetConcentration: quantity<'massConcentration'>(decimal(20), 'mg_per_mL') });
    expect(invalid.valid).toBe(false);
    if (!invalid.valid) expect(invalid.errors.map(({ code }) => code)).toEqual(['TARGET_EXCEEDS_SOURCE', 'SOURCE_VOLUME_EXCEEDS_FINAL']);
    const incompatible = calculateDilution({
      ...base,
      targetConcentration: quantity<'activityConcentration'>(decimal(2), 'IU_per_mL')
    } as unknown as Parameters<typeof calculateDilution>[0]);
    expect(incompatible.valid).toBe(false);
  });

  it('prüft Gewicht, Dosis und Konzentration einzeln', () => {
    const base = {
      weight: quantity<'bodyWeight'>(decimal(10), 'kg_body'),
      dose: quantity<'massDosePerWeight'>(decimal(2), 'mg_per_kg'),
      concentration: quantity<'massConcentration'>(decimal(5), 'mg_per_mL'),
      amountOutputUnit: 'mg' as const,
      volumeOutputUnit: 'mL' as const
    };
    expect(calculateWeightDose({ ...base, weight: quantity<'bodyWeight'>(decimal(0), 'kg_body') }).valid).toBe(false);
    expect(calculateWeightDose({ ...base, dose: quantity<'massDosePerWeight'>(decimal(-1), 'mg_per_kg') }).valid).toBe(false);
    expect(calculateWeightDose({ ...base, concentration: quantity<'massConcentration'>(decimal(0), 'mg_per_mL') }).valid).toBe(false);
  });

  it('prüft Vorwärts- und Rückwärtsraten gegen negative und fehlende Werte', () => {
    const forwardNegative = calculatePumpRateForward({
      rateType: 'massAbsolute',
      rate: quantity<'massAbsoluteRate'>(decimal(-1), 'mg_per_h'),
      concentration: quantity<'massConcentration'>(decimal(1), 'mg_per_mL')
    });
    expect(forwardNegative.valid).toBe(false);
    const forwardZeroConcentration = calculatePumpRateForward({
      rateType: 'massAbsolute',
      rate: quantity<'massAbsoluteRate'>(decimal(1), 'mg_per_h'),
      concentration: quantity<'massConcentration'>(decimal(0), 'mg_per_mL')
    });
    expect(forwardZeroConcentration.valid).toBe(false);
    const forwardZeroWeight = calculatePumpRateForward({
      rateType: 'massWeight',
      rate: quantity<'massWeightRate'>(decimal(1), 'mg_per_kg_h'),
      concentration: quantity<'massConcentration'>(decimal(1), 'mg_per_mL'),
      weight: quantity<'bodyWeight'>(decimal(0), 'kg_body')
    });
    expect(forwardZeroWeight.valid).toBe(false);
    const forwardMissingWeight = calculatePumpRateForward({
      rateType: 'massWeight',
      rate: quantity<'massWeightRate'>(decimal(1), 'mg_per_kg_h'),
      concentration: quantity<'massConcentration'>(decimal(1), 'mg_per_mL')
    } as unknown as Parameters<typeof calculatePumpRateForward>[0]);
    expect(forwardMissingWeight.valid).toBe(false);

    const reverseNegative = calculatePumpRateReverse({
      rateType: 'massAbsolute',
      pumpRate: quantity<'volumeRate'>(decimal(-1), 'mL_per_h'),
      concentration: quantity<'massConcentration'>(decimal(1), 'mg_per_mL'),
      outputUnit: 'mg_per_h'
    });
    expect(reverseNegative.valid).toBe(false);
    const reverseZeroConcentration = calculatePumpRateReverse({
      rateType: 'massAbsolute',
      pumpRate: quantity<'volumeRate'>(decimal(1), 'mL_per_h'),
      concentration: quantity<'massConcentration'>(decimal(0), 'mg_per_mL'),
      outputUnit: 'mg_per_h'
    });
    expect(reverseZeroConcentration.valid).toBe(false);
    const reverseZeroWeight = calculatePumpRateReverse({
      rateType: 'massWeight',
      pumpRate: quantity<'volumeRate'>(decimal(1), 'mL_per_h'),
      concentration: quantity<'massConcentration'>(decimal(1), 'mg_per_mL'),
      weight: quantity<'bodyWeight'>(decimal(0), 'kg_body'),
      outputUnit: 'mg_per_kg_h'
    });
    expect(reverseZeroWeight.valid).toBe(false);
    const reverseMissingWeight = calculatePumpRateReverse({
      rateType: 'massWeight',
      pumpRate: quantity<'volumeRate'>(decimal(1), 'mL_per_h'),
      concentration: quantity<'massConcentration'>(decimal(1), 'mg_per_mL'),
      outputUnit: 'mg_per_kg_h'
    } as unknown as Parameters<typeof calculatePumpRateReverse>[0]);
    expect(reverseMissingWeight.valid).toBe(false);
  });

  it('weist negative Prozentwerte ab', () => {
    const result = calculateWeightVolumePercent(decimal(-1), 'w/v');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors[0]?.code).toBe('NEGATIVE_NOT_ALLOWED');
  });
});

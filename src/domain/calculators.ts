import type { DecimalValue } from './decimal';
import { decimal } from './decimal';
import { formatForPath } from './format';
import {
  addMagnitudeWarnings,
  failure,
  output,
  unitWarnings,
  type CalculationError,
  type CalculationOutput,
  type CalculationResult,
  type CalculationSuccess,
  type EnteredInput,
  type NormalizedInput
} from './result';
import {
  fromBase,
  substanceFamily,
  toBase,
  unitSymbol,
  type AnyUnitId,
  type Quantity,
  type UnitId
} from './units';

type MassConcentrationInput = {
  readonly substance: 'mass';
  readonly amount: Quantity<'mass'>;
  readonly volume: Quantity<'volume'>;
  readonly outputUnit: UnitId<'massConcentration'>;
};

type ActivityConcentrationInput = {
  readonly substance: 'activity';
  readonly amount: Quantity<'activity'>;
  readonly volume: Quantity<'volume'>;
  readonly outputUnit: UnitId<'activityConcentration'>;
};

export type ConcentrationInput = MassConcentrationInput | ActivityConcentrationInput;

type RequiredVolumeInput =
  | {
      readonly substance: 'mass';
      readonly amount: Quantity<'mass'>;
      readonly concentration: Quantity<'massConcentration'>;
      readonly outputUnit: UnitId<'volume'>;
    }
  | {
      readonly substance: 'activity';
      readonly amount: Quantity<'activity'>;
      readonly concentration: Quantity<'activityConcentration'>;
      readonly outputUnit: UnitId<'volume'>;
    };

type ContainedAmountInput =
  | {
      readonly substance: 'mass';
      readonly concentration: Quantity<'massConcentration'>;
      readonly volume: Quantity<'volume'>;
      readonly outputUnit: UnitId<'mass'>;
    }
  | {
      readonly substance: 'activity';
      readonly concentration: Quantity<'activityConcentration'>;
      readonly volume: Quantity<'volume'>;
      readonly outputUnit: UnitId<'activity'>;
    };

type DilutionInput =
  | {
      readonly substance: 'mass';
      readonly sourceConcentration: Quantity<'massConcentration'>;
      readonly targetConcentration: Quantity<'massConcentration'>;
      readonly finalVolume: Quantity<'volume'>;
      readonly outputUnit: UnitId<'volume'>;
    }
  | {
      readonly substance: 'activity';
      readonly sourceConcentration: Quantity<'activityConcentration'>;
      readonly targetConcentration: Quantity<'activityConcentration'>;
      readonly finalVolume: Quantity<'volume'>;
      readonly outputUnit: UnitId<'volume'>;
    };

export interface WeightDoseInput {
  readonly weight: Quantity<'bodyWeight'>;
  readonly dose: Quantity<'massDosePerWeight'>;
  readonly concentration: Quantity<'massConcentration'>;
  readonly amountOutputUnit: UnitId<'mass'>;
  readonly volumeOutputUnit: UnitId<'volume'>;
}

export type PumpRateForwardInput =
  | {
      readonly rateType: 'massAbsolute';
      readonly rate: Quantity<'massAbsoluteRate'>;
      readonly concentration: Quantity<'massConcentration'>;
    }
  | {
      readonly rateType: 'massWeight';
      readonly rate: Quantity<'massWeightRate'>;
      readonly concentration: Quantity<'massConcentration'>;
      readonly weight: Quantity<'bodyWeight'>;
    }
  | {
      readonly rateType: 'activityAbsolute';
      readonly rate: Quantity<'activityAbsoluteRate'>;
      readonly concentration: Quantity<'activityConcentration'>;
    }
  | {
      readonly rateType: 'activityWeight';
      readonly rate: Quantity<'activityWeightRate'>;
      readonly concentration: Quantity<'activityConcentration'>;
      readonly weight: Quantity<'bodyWeight'>;
    };

export type PumpRateReverseInput =
  | {
      readonly rateType: 'massAbsolute';
      readonly pumpRate: Quantity<'volumeRate'>;
      readonly concentration: Quantity<'massConcentration'>;
      readonly outputUnit: UnitId<'massAbsoluteRate'>;
    }
  | {
      readonly rateType: 'massWeight';
      readonly pumpRate: Quantity<'volumeRate'>;
      readonly concentration: Quantity<'massConcentration'>;
      readonly weight: Quantity<'bodyWeight'>;
      readonly outputUnit: UnitId<'massWeightRate'>;
    }
  | {
      readonly rateType: 'activityAbsolute';
      readonly pumpRate: Quantity<'volumeRate'>;
      readonly concentration: Quantity<'activityConcentration'>;
      readonly outputUnit: UnitId<'activityAbsoluteRate'>;
    }
  | {
      readonly rateType: 'activityWeight';
      readonly pumpRate: Quantity<'volumeRate'>;
      readonly concentration: Quantity<'activityConcentration'>;
      readonly weight: Quantity<'bodyWeight'>;
      readonly outputUnit: UnitId<'activityWeightRate'>;
    };

function number(value: DecimalValue): string {
  return formatForPath(value);
}

function entered(label: string, value: DecimalValue, unit: AnyUnitId): EnteredInput {
  return { label, value: number(value), unit: unitSymbol(unit) };
}

function normalized(label: string, value: DecimalValue, unit: string): NormalizedInput {
  return { label, value: number(value), unit };
}

function buildSuccess(options: {
  enteredInputs: readonly EnteredInput[];
  normalizedInputs: readonly NormalizedInput[];
  outputs: readonly CalculationOutput[];
  formula: string;
  substitution: string;
  steps: readonly string[];
  units: readonly AnyUnitId[];
}): CalculationSuccess {
  return {
    valid: true,
    validationStatus: 'valid',
    enteredInputs: options.enteredInputs,
    normalizedInputs: options.normalizedInputs,
    outputs: options.outputs,
    formula: options.formula,
    substitution: options.substitution,
    steps: options.steps,
    warnings: addMagnitudeWarnings(unitWarnings(options.units), options.outputs)
  };
}

function invalid(field: string, message: string, code: CalculationError['code']): CalculationResult {
  return failure({ field, message, code });
}

function requireNonNegative(value: DecimalValue, field: string): CalculationResult | undefined {
  if (value.isNegative()) return invalid(field, 'Negative Werte sind nicht zulässig.', 'NEGATIVE_NOT_ALLOWED');
  return undefined;
}

function requirePositive(value: DecimalValue, field: string): CalculationResult | undefined {
  const negative = requireNonNegative(value, field);
  if (negative) return negative;
  if (value.isZero()) return invalid(field, 'Bitte einen Wert größer als 0 eingeben.', 'ZERO_NOT_ALLOWED');
  return undefined;
}

function incompatible(field = 'units'): CalculationResult {
  return invalid(
    field,
    'Diese Einheiten können in dieser Berechnung nicht miteinander kombiniert werden.',
    'INCOMPATIBLE_UNIT'
  );
}

export function calculateConcentration(input: ConcentrationInput): CalculationResult {
  const amountError = requireNonNegative(input.amount.value, 'amount');
  if (amountError) return amountError;
  const volumeError = requirePositive(input.volume.value, 'volume');
  if (volumeError) return volumeError;
  if (substanceFamily(input.amount.unit) !== input.substance || substanceFamily(input.outputUnit) !== input.substance) {
    return incompatible();
  }

  const amountBase = toBase(input.amount.value, input.amount.unit);
  const volumeBase = toBase(input.volume.value, input.volume.unit);
  const concentrationBase = amountBase.div(volumeBase);
  const result = fromBase(concentrationBase, input.outputUnit);
  const baseAmountUnit = input.substance === 'mass' ? 'g' : 'IE';
  const baseConcentrationUnit = input.substance === 'mass' ? 'g/L' : 'IE/L';
  const resultOutput = output('Konzentration', result, input.outputUnit);

  return buildSuccess({
    enteredInputs: [entered('Wirkstoffmenge', input.amount.value, input.amount.unit), entered('Gesamtvolumen', input.volume.value, input.volume.unit)],
    normalizedInputs: [normalized('Wirkstoffmenge', amountBase, baseAmountUnit), normalized('Gesamtvolumen', volumeBase, 'L')],
    outputs: [resultOutput],
    formula: 'Konzentration = Wirkstoffmenge ÷ Gesamtvolumen',
    substitution: `${number(amountBase)} ${baseAmountUnit} ÷ ${number(volumeBase)} L = ${number(concentrationBase)} ${baseConcentrationUnit}`,
    steps: [
      `${number(input.amount.value)} ${unitSymbol(input.amount.unit)} = ${number(amountBase)} ${baseAmountUnit}`,
      `${number(input.volume.value)} ${unitSymbol(input.volume.unit)} = ${number(volumeBase)} L`,
      `${number(concentrationBase)} ${baseConcentrationUnit} = ${resultOutput.displayValue} ${unitSymbol(input.outputUnit)}`
    ],
    units: [input.amount.unit, input.volume.unit, input.outputUnit]
  });
}

export function calculateRequiredVolume(input: RequiredVolumeInput): CalculationResult {
  const amountError = requireNonNegative(input.amount.value, 'amount');
  if (amountError) return amountError;
  const concentrationError = requirePositive(input.concentration.value, 'concentration');
  if (concentrationError) return concentrationError;
  if (substanceFamily(input.amount.unit) !== input.substance || substanceFamily(input.concentration.unit) !== input.substance) {
    return incompatible();
  }

  const amountBase = toBase(input.amount.value, input.amount.unit);
  const concentrationBase = toBase(input.concentration.value, input.concentration.unit);
  const volumeBase = amountBase.div(concentrationBase);
  const result = fromBase(volumeBase, input.outputUnit);
  const baseAmountUnit = input.substance === 'mass' ? 'g' : 'IE';
  const baseConcentrationUnit = input.substance === 'mass' ? 'g/L' : 'IE/L';
  const resultOutput = output('Benötigtes Volumen', result, input.outputUnit);

  return buildSuccess({
    enteredInputs: [entered('Gewünschte Wirkstoffmenge', input.amount.value, input.amount.unit), entered('Vorhandene Konzentration', input.concentration.value, input.concentration.unit)],
    normalizedInputs: [normalized('Wirkstoffmenge', amountBase, baseAmountUnit), normalized('Konzentration', concentrationBase, baseConcentrationUnit)],
    outputs: [resultOutput],
    formula: 'Volumen = Wirkstoffmenge ÷ Konzentration',
    substitution: `${number(amountBase)} ${baseAmountUnit} ÷ ${number(concentrationBase)} ${baseConcentrationUnit} = ${number(volumeBase)} L`,
    steps: [`${number(volumeBase)} L = ${resultOutput.displayValue} ${unitSymbol(input.outputUnit)}`],
    units: [input.amount.unit, input.concentration.unit, input.outputUnit]
  });
}

export function calculateContainedAmount(input: ContainedAmountInput): CalculationResult {
  const concentrationError = requireNonNegative(input.concentration.value, 'concentration');
  if (concentrationError) return concentrationError;
  const volumeError = requireNonNegative(input.volume.value, 'volume');
  if (volumeError) return volumeError;
  if (substanceFamily(input.concentration.unit) !== input.substance || substanceFamily(input.outputUnit) !== input.substance) {
    return incompatible();
  }

  const concentrationBase = toBase(input.concentration.value, input.concentration.unit);
  const volumeBase = toBase(input.volume.value, input.volume.unit);
  const amountBase = concentrationBase.times(volumeBase);
  const result = fromBase(amountBase, input.outputUnit);
  const baseAmountUnit = input.substance === 'mass' ? 'g' : 'IE';
  const baseConcentrationUnit = input.substance === 'mass' ? 'g/L' : 'IE/L';
  const resultOutput = output('Enthaltene Wirkstoffmenge', result, input.outputUnit);

  return buildSuccess({
    enteredInputs: [entered('Konzentration', input.concentration.value, input.concentration.unit), entered('Verwendetes Volumen', input.volume.value, input.volume.unit)],
    normalizedInputs: [normalized('Konzentration', concentrationBase, baseConcentrationUnit), normalized('Volumen', volumeBase, 'L')],
    outputs: [resultOutput],
    formula: 'Wirkstoffmenge = Konzentration × Volumen',
    substitution: `${number(concentrationBase)} ${baseConcentrationUnit} × ${number(volumeBase)} L = ${number(amountBase)} ${baseAmountUnit}`,
    steps: [`${number(amountBase)} ${baseAmountUnit} = ${resultOutput.displayValue} ${unitSymbol(input.outputUnit)}`],
    units: [input.concentration.unit, input.volume.unit, input.outputUnit]
  });
}

export function calculateDilution(input: DilutionInput): CalculationResult {
  const c1Error = requirePositive(input.sourceConcentration.value, 'sourceConcentration');
  if (c1Error) return c1Error;
  const c2Error = requirePositive(input.targetConcentration.value, 'targetConcentration');
  if (c2Error) return c2Error;
  const volumeError = requirePositive(input.finalVolume.value, 'finalVolume');
  if (volumeError) return volumeError;
  if (substanceFamily(input.sourceConcentration.unit) !== input.substance || substanceFamily(input.targetConcentration.unit) !== input.substance) {
    return incompatible();
  }

  const c1Base = toBase(input.sourceConcentration.value, input.sourceConcentration.unit);
  const c2Base = toBase(input.targetConcentration.value, input.targetConcentration.unit);
  const finalVolumeBase = toBase(input.finalVolume.value, input.finalVolume.unit);
  const sourceVolumeBase = c2Base.times(finalVolumeBase).div(c1Base);
  if (c2Base.gt(c1Base)) {
    return {
      valid: false,
      validationStatus: 'invalid',
      warnings: [],
      errors: [
        {
          field: 'targetConcentration',
          message: 'Die Zielkonzentration darf bei einer Verdünnung nicht größer als die Ausgangskonzentration sein.',
          code: 'TARGET_EXCEEDS_SOURCE'
        },
        {
          field: 'finalVolume',
          message: 'Das daraus berechnete Volumen der Ausgangslösung wäre größer als das Endvolumen.',
          code: 'SOURCE_VOLUME_EXCEEDS_FINAL'
        }
      ]
    };
  }

  const diluentBase = finalVolumeBase.minus(sourceVolumeBase);
  const sourceResult = output('Volumen der Ausgangslösung', fromBase(sourceVolumeBase, input.outputUnit), input.outputUnit);
  const diluentResult = output('Hinzuzufügendes Verdünnungsvolumen', fromBase(diluentBase, input.outputUnit), input.outputUnit);
  const baseConcentrationUnit = input.substance === 'mass' ? 'g/L' : 'IE/L';

  return buildSuccess({
    enteredInputs: [
      entered('Ausgangskonzentration C1', input.sourceConcentration.value, input.sourceConcentration.unit),
      entered('Zielkonzentration C2', input.targetConcentration.value, input.targetConcentration.unit),
      entered('Endvolumen V2', input.finalVolume.value, input.finalVolume.unit)
    ],
    normalizedInputs: [
      normalized('C1', c1Base, baseConcentrationUnit),
      normalized('C2', c2Base, baseConcentrationUnit),
      normalized('V2', finalVolumeBase, 'L')
    ],
    outputs: [sourceResult, diluentResult],
    formula: 'V1 = C2 × V2 ÷ C1; Verdünnungsvolumen = V2 − V1',
    substitution: `V1 = ${number(c2Base)} × ${number(finalVolumeBase)} ÷ ${number(c1Base)} = ${number(sourceVolumeBase)} L`,
    steps: [
      `V1 = ${sourceResult.displayValue} ${unitSymbol(input.outputUnit)}`,
      `${number(finalVolumeBase)} L − ${number(sourceVolumeBase)} L = ${number(diluentBase)} L`,
      `Verdünnungsvolumen = ${diluentResult.displayValue} ${unitSymbol(input.outputUnit)}`
    ],
    units: [input.sourceConcentration.unit, input.targetConcentration.unit, input.finalVolume.unit, input.outputUnit]
  });
}

export function calculateWeightDose(input: WeightDoseInput): CalculationResult {
  const weightError = requirePositive(input.weight.value, 'weight');
  if (weightError) return weightError;
  const doseError = requireNonNegative(input.dose.value, 'dose');
  if (doseError) return doseError;
  const concentrationError = requirePositive(input.concentration.value, 'concentration');
  if (concentrationError) return concentrationError;

  const weightBase = toBase(input.weight.value, input.weight.unit);
  const doseBase = toBase(input.dose.value, input.dose.unit);
  const concentrationBase = toBase(input.concentration.value, input.concentration.unit);
  const amountBase = weightBase.times(doseBase);
  const volumeBase = amountBase.div(concentrationBase);
  const amountResult = output('Rechnerische Gesamtwirkstoffmenge', fromBase(amountBase, input.amountOutputUnit), input.amountOutputUnit);
  const volumeResult = output('Rechnerisches Volumen', fromBase(volumeBase, input.volumeOutputUnit), input.volumeOutputUnit);

  return buildSuccess({
    enteredInputs: [entered('Körpergewicht', input.weight.value, input.weight.unit), entered('Vorgegebene Dosis', input.dose.value, input.dose.unit), entered('Vorhandene Konzentration', input.concentration.value, input.concentration.unit)],
    normalizedInputs: [normalized('Körpergewicht', weightBase, 'kg'), normalized('Dosis', doseBase, 'g/kg'), normalized('Konzentration', concentrationBase, 'g/L')],
    outputs: [amountResult, volumeResult],
    formula: 'Gesamtwirkstoffmenge = Körpergewicht × Dosis pro kg; Volumen = Gesamtwirkstoffmenge ÷ Konzentration',
    substitution: `${number(weightBase)} kg × ${number(doseBase)} g/kg = ${number(amountBase)} g; ${number(amountBase)} g ÷ ${number(concentrationBase)} g/L = ${number(volumeBase)} L`,
    steps: [
      `Gesamtwirkstoffmenge = ${amountResult.displayValue} ${unitSymbol(input.amountOutputUnit)}`,
      `Volumen = ${volumeResult.displayValue} ${unitSymbol(input.volumeOutputUnit)}`
    ],
    units: [input.weight.unit, input.dose.unit, input.concentration.unit, input.amountOutputUnit, input.volumeOutputUnit]
  });
}

function isWeightRate(type: PumpRateForwardInput['rateType'] | PumpRateReverseInput['rateType']): boolean {
  return type === 'massWeight' || type === 'activityWeight';
}

export function calculatePumpRateForward(input: PumpRateForwardInput): CalculationResult {
  const rateError = requireNonNegative(input.rate.value, 'rate');
  if (rateError) return rateError;
  const concentrationError = requirePositive(input.concentration.value, 'concentration');
  if (concentrationError) return concentrationError;

  const rateBase = toBase(input.rate.value, input.rate.unit);
  const concentrationBase = toBase(input.concentration.value, input.concentration.unit);
  let absoluteRateBase = rateBase;
  let weightBase: DecimalValue | undefined;
  if (isWeightRate(input.rateType)) {
    if (!('weight' in input)) return incompatible('weight');
    const weightError = requirePositive(input.weight.value, 'weight');
    if (weightError) return weightError;
    weightBase = toBase(input.weight.value, input.weight.unit);
    absoluteRateBase = rateBase.times(weightBase);
  }
  const volumeRateBase = absoluteRateBase.div(concentrationBase);
  const pumpRate = fromBase(volumeRateBase, 'mL_per_h');
  const resultOutput = output('Pumpenrate', pumpRate, 'mL_per_h');
  const massFamily = input.rateType.startsWith('mass');
  const rateBaseUnit = massFamily ? (isWeightRate(input.rateType) ? 'g/kg/h' : 'g/h') : isWeightRate(input.rateType) ? 'IE/kg/h' : 'IE/h';
  const absoluteRateUnit = massFamily ? 'g/h' : 'IE/h';
  const concentrationUnit = massFamily ? 'g/L' : 'IE/L';
  const enteredInputs: EnteredInput[] = [
    entered('Vorgegebene Rate', input.rate.value, input.rate.unit),
    ...('weight' in input ? [entered('Körpergewicht', input.weight.value, input.weight.unit)] : []),
    entered('Konzentration', input.concentration.value, input.concentration.unit)
  ];
  const normalizedInputs: NormalizedInput[] = [
    normalized('Rate', rateBase, rateBaseUnit),
    ...(weightBase ? [normalized('Körpergewicht', weightBase, 'kg')] : []),
    normalized('Konzentration', concentrationBase, concentrationUnit)
  ];

  return buildSuccess({
    enteredInputs,
    normalizedInputs,
    outputs: [resultOutput],
    formula: isWeightRate(input.rateType)
      ? 'Pumpenrate = Rate pro kg × Körpergewicht ÷ Konzentration'
      : 'Pumpenrate = absolute Rate ÷ Konzentration',
    substitution: `${number(absoluteRateBase)} ${absoluteRateUnit} ÷ ${number(concentrationBase)} ${concentrationUnit} = ${number(volumeRateBase)} L/h`,
    steps: [
      ...(weightBase ? [`${number(rateBase)} ${rateBaseUnit} × ${number(weightBase)} kg = ${number(absoluteRateBase)} ${absoluteRateUnit}`] : []),
      `${number(volumeRateBase)} L/h = ${resultOutput.displayValue} mL/h`
    ],
    units: [input.rate.unit, input.concentration.unit, ...('weight' in input ? [input.weight.unit] : []), 'mL_per_h']
  });
}

export function calculatePumpRateReverse(input: PumpRateReverseInput): CalculationResult {
  const pumpError = requireNonNegative(input.pumpRate.value, 'pumpRate');
  if (pumpError) return pumpError;
  const concentrationError = requirePositive(input.concentration.value, 'concentration');
  if (concentrationError) return concentrationError;

  const volumeRateBase = toBase(input.pumpRate.value, input.pumpRate.unit);
  const concentrationBase = toBase(input.concentration.value, input.concentration.unit);
  const absoluteRateBase = volumeRateBase.times(concentrationBase);
  let targetRateBase = absoluteRateBase;
  let weightBase: DecimalValue | undefined;
  if (isWeightRate(input.rateType)) {
    if (!('weight' in input)) return incompatible('weight');
    const weightError = requirePositive(input.weight.value, 'weight');
    if (weightError) return weightError;
    weightBase = toBase(input.weight.value, input.weight.unit);
    targetRateBase = absoluteRateBase.div(weightBase);
  }

  const result = fromBase(targetRateBase, input.outputUnit);
  const resultOutput = output('Rechnerisch resultierende Rate', result, input.outputUnit);
  const massFamily = input.rateType.startsWith('mass');
  const absoluteRateUnit = massFamily ? 'g/h' : 'IE/h';
  const targetBaseUnit = massFamily ? (isWeightRate(input.rateType) ? 'g/kg/h' : 'g/h') : isWeightRate(input.rateType) ? 'IE/kg/h' : 'IE/h';
  const concentrationUnit = massFamily ? 'g/L' : 'IE/L';

  return buildSuccess({
    enteredInputs: [
      entered('Pumpenrate', input.pumpRate.value, input.pumpRate.unit),
      entered('Konzentration', input.concentration.value, input.concentration.unit),
      ...('weight' in input ? [entered('Körpergewicht', input.weight.value, input.weight.unit)] : [])
    ],
    normalizedInputs: [
      normalized('Pumpenrate', volumeRateBase, 'L/h'),
      normalized('Konzentration', concentrationBase, concentrationUnit),
      ...(weightBase ? [normalized('Körpergewicht', weightBase, 'kg')] : [])
    ],
    outputs: [resultOutput],
    formula: isWeightRate(input.rateType)
      ? 'Rate pro kg = Pumpenrate × Konzentration ÷ Körpergewicht'
      : 'Absolute Rate = Pumpenrate × Konzentration',
    substitution: weightBase
      ? `${number(volumeRateBase)} L/h × ${number(concentrationBase)} ${concentrationUnit} ÷ ${number(weightBase)} kg = ${number(targetRateBase)} ${targetBaseUnit}`
      : `${number(volumeRateBase)} L/h × ${number(concentrationBase)} ${concentrationUnit} = ${number(absoluteRateBase)} ${absoluteRateUnit}`,
    steps: [`${number(targetRateBase)} ${targetBaseUnit} = ${resultOutput.displayValue} ${unitSymbol(input.outputUnit)}`],
    units: [input.pumpRate.unit, input.concentration.unit, ...('weight' in input ? [input.weight.unit] : []), input.outputUnit]
  });
}

export function calculateWeightVolumePercent(percent: DecimalValue, type: 'w/v' | 'v/v' | 'w/w'): CalculationResult {
  const percentError = requireNonNegative(percent, 'percent');
  if (percentError) return percentError;
  if (type !== 'w/v') {
    return invalid(
      'percentType',
      'Nur % w/v kann ohne weitere stoffbezogene Angaben in mg/mL umgerechnet werden.',
      'UNSUPPORTED_PERCENT_TYPE'
    );
  }
  const concentration = percent.times(decimal(10));
  const resultOutput = output('Konzentration', concentration, 'mg_per_mL');
  return buildSuccess({
    enteredInputs: [{ label: 'Prozentangabe', value: number(percent), unit: '% w/v' }],
    normalizedInputs: [{ label: 'Gewicht pro Volumen', value: number(percent), unit: 'g/100 mL' }],
    outputs: [resultOutput],
    formula: '1 % w/v = 1 g/100 mL = 10 mg/mL',
    substitution: `${number(percent)} × 10 mg/mL = ${number(concentration)} mg/mL`,
    steps: [`${number(percent)} g/100 mL = ${number(percent.times(1000))} mg/100 mL`, `${number(percent.times(1000))} mg ÷ 100 mL = ${resultOutput.displayValue} mg/mL`],
    units: ['mg_per_mL']
  });
}

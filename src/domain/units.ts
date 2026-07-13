import { decimal, type DecimalValue } from './decimal';

export interface UnitByKind {
  mass: 'g' | 'mg' | 'ug' | 'ng';
  activity: 'IU';
  volume: 'L' | 'mL' | 'uL';
  time: 'h' | 'min' | 's';
  bodyWeight: 'kg_body' | 'g_body';
  massConcentration: 'g_per_L' | 'mg_per_mL' | 'mg_per_L' | 'ug_per_mL' | 'ug_per_L' | 'ng_per_mL';
  activityConcentration: 'IU_per_mL';
  massDosePerWeight: 'mg_per_kg' | 'ug_per_kg';
  massAbsoluteRate: 'mg_per_h' | 'ug_per_h' | 'ug_per_min';
  massWeightRate: 'mg_per_kg_h' | 'ug_per_kg_h' | 'ug_per_kg_min';
  activityAbsoluteRate: 'IU_per_h';
  activityWeightRate: 'IU_per_kg_h';
  volumeRate: 'mL_per_h';
}

export type UnitKind = keyof UnitByKind;
export type UnitId<K extends UnitKind = UnitKind> = UnitByKind[K];
export type AnyUnitId = UnitByKind[UnitKind];

export interface Quantity<K extends UnitKind> {
  readonly value: DecimalValue;
  readonly unit: UnitId<K>;
}

export interface DimensionVector {
  readonly mass: number;
  readonly activity: number;
  readonly volume: number;
  readonly time: number;
  readonly bodyWeight: number;
}

interface UnitScale {
  readonly multiplier: string;
}

export interface UnitDefinition {
  readonly id: AnyUnitId;
  readonly kind: UnitKind;
  readonly symbol: string;
  readonly dimension: DimensionVector;
  readonly scale: UnitScale;
  readonly massPower?: number;
  readonly volumePower?: number;
  readonly weightPower?: number;
}

const dimension = (
  mass: number,
  activity: number,
  volume: number,
  time: number,
  bodyWeight: number
): DimensionVector => ({ mass, activity, volume, time, bodyWeight });

const definitions: readonly UnitDefinition[] = [
  { id: 'g', kind: 'mass', symbol: 'g', dimension: dimension(1, 0, 0, 0, 0), scale: { multiplier: '1' }, massPower: 0 },
  { id: 'mg', kind: 'mass', symbol: 'mg', dimension: dimension(1, 0, 0, 0, 0), scale: { multiplier: '0.001' }, massPower: -3 },
  { id: 'ug', kind: 'mass', symbol: 'µg', dimension: dimension(1, 0, 0, 0, 0), scale: { multiplier: '0.000001' }, massPower: -6 },
  { id: 'ng', kind: 'mass', symbol: 'ng', dimension: dimension(1, 0, 0, 0, 0), scale: { multiplier: '0.000000001' }, massPower: -9 },
  { id: 'IU', kind: 'activity', symbol: 'IE', dimension: dimension(0, 1, 0, 0, 0), scale: { multiplier: '1' } },
  { id: 'L', kind: 'volume', symbol: 'L', dimension: dimension(0, 0, 1, 0, 0), scale: { multiplier: '1' }, volumePower: 0 },
  { id: 'mL', kind: 'volume', symbol: 'mL', dimension: dimension(0, 0, 1, 0, 0), scale: { multiplier: '0.001' }, volumePower: -3 },
  { id: 'uL', kind: 'volume', symbol: 'µL', dimension: dimension(0, 0, 1, 0, 0), scale: { multiplier: '0.000001' }, volumePower: -6 },
  { id: 'h', kind: 'time', symbol: 'h', dimension: dimension(0, 0, 0, 1, 0), scale: { multiplier: '3600' } },
  { id: 'min', kind: 'time', symbol: 'min', dimension: dimension(0, 0, 0, 1, 0), scale: { multiplier: '60' } },
  { id: 's', kind: 'time', symbol: 's', dimension: dimension(0, 0, 0, 1, 0), scale: { multiplier: '1' } },
  { id: 'kg_body', kind: 'bodyWeight', symbol: 'kg', dimension: dimension(0, 0, 0, 0, 1), scale: { multiplier: '1' }, weightPower: 0 },
  { id: 'g_body', kind: 'bodyWeight', symbol: 'g', dimension: dimension(0, 0, 0, 0, 1), scale: { multiplier: '0.001' }, weightPower: -3 },
  { id: 'g_per_L', kind: 'massConcentration', symbol: 'g/L', dimension: dimension(1, 0, -1, 0, 0), scale: { multiplier: '1' }, massPower: 0, volumePower: 0 },
  { id: 'mg_per_mL', kind: 'massConcentration', symbol: 'mg/mL', dimension: dimension(1, 0, -1, 0, 0), scale: { multiplier: '1' }, massPower: -3, volumePower: -3 },
  { id: 'mg_per_L', kind: 'massConcentration', symbol: 'mg/L', dimension: dimension(1, 0, -1, 0, 0), scale: { multiplier: '0.001' }, massPower: -3, volumePower: 0 },
  { id: 'ug_per_mL', kind: 'massConcentration', symbol: 'µg/mL', dimension: dimension(1, 0, -1, 0, 0), scale: { multiplier: '0.001' }, massPower: -6, volumePower: -3 },
  { id: 'ug_per_L', kind: 'massConcentration', symbol: 'µg/L', dimension: dimension(1, 0, -1, 0, 0), scale: { multiplier: '0.000001' }, massPower: -6, volumePower: 0 },
  { id: 'ng_per_mL', kind: 'massConcentration', symbol: 'ng/mL', dimension: dimension(1, 0, -1, 0, 0), scale: { multiplier: '0.000001' }, massPower: -9, volumePower: -3 },
  { id: 'IU_per_mL', kind: 'activityConcentration', symbol: 'IE/mL', dimension: dimension(0, 1, -1, 0, 0), scale: { multiplier: '1000' }, volumePower: -3 },
  { id: 'mg_per_kg', kind: 'massDosePerWeight', symbol: 'mg/kg', dimension: dimension(1, 0, 0, 0, -1), scale: { multiplier: '0.001' }, massPower: -3, weightPower: 0 },
  { id: 'ug_per_kg', kind: 'massDosePerWeight', symbol: 'µg/kg', dimension: dimension(1, 0, 0, 0, -1), scale: { multiplier: '0.000001' }, massPower: -6, weightPower: 0 },
  { id: 'mg_per_h', kind: 'massAbsoluteRate', symbol: 'mg/h', dimension: dimension(1, 0, 0, -1, 0), scale: { multiplier: '0.001' }, massPower: -3 },
  { id: 'ug_per_h', kind: 'massAbsoluteRate', symbol: 'µg/h', dimension: dimension(1, 0, 0, -1, 0), scale: { multiplier: '0.000001' }, massPower: -6 },
  { id: 'ug_per_min', kind: 'massAbsoluteRate', symbol: 'µg/min', dimension: dimension(1, 0, 0, -1, 0), scale: { multiplier: '0.00006' }, massPower: -6 },
  { id: 'mg_per_kg_h', kind: 'massWeightRate', symbol: 'mg/kg/h', dimension: dimension(1, 0, 0, -1, -1), scale: { multiplier: '0.001' }, massPower: -3, weightPower: 0 },
  { id: 'ug_per_kg_h', kind: 'massWeightRate', symbol: 'µg/kg/h', dimension: dimension(1, 0, 0, -1, -1), scale: { multiplier: '0.000001' }, massPower: -6, weightPower: 0 },
  { id: 'ug_per_kg_min', kind: 'massWeightRate', symbol: 'µg/kg/min', dimension: dimension(1, 0, 0, -1, -1), scale: { multiplier: '0.00006' }, massPower: -6, weightPower: 0 },
  { id: 'IU_per_h', kind: 'activityAbsoluteRate', symbol: 'IE/h', dimension: dimension(0, 1, 0, -1, 0), scale: { multiplier: '1' } },
  { id: 'IU_per_kg_h', kind: 'activityWeightRate', symbol: 'IE/kg/h', dimension: dimension(0, 1, 0, -1, -1), scale: { multiplier: '1' }, weightPower: 0 },
  { id: 'mL_per_h', kind: 'volumeRate', symbol: 'mL/h', dimension: dimension(0, 0, 1, -1, 0), scale: { multiplier: '0.001' }, volumePower: -3 }
] as const;

export const UNIT_DEFINITIONS: ReadonlyMap<AnyUnitId, UnitDefinition> = new Map(
  definitions.map((definition) => [definition.id, definition])
);

export function getUnit(id: AnyUnitId): UnitDefinition {
  const definition = UNIT_DEFINITIONS.get(id);
  if (!definition) {
    throw new Error(`Unknown unit: ${id}`);
  }
  return definition;
}

export function isUnitOfKind<K extends UnitKind>(id: string, kind: K): id is UnitId<K> {
  const definition = UNIT_DEFINITIONS.get(id as AnyUnitId);
  return definition?.kind === kind;
}

export function unitSymbol(id: AnyUnitId): string {
  return getUnit(id).symbol;
}

function scaleFactor(definition: UnitDefinition): DecimalValue {
  return decimal(definition.scale.multiplier);
}

export function toBase(value: DecimalValue, unit: AnyUnitId): DecimalValue {
  return value.times(scaleFactor(getUnit(unit)));
}

export function fromBase(value: DecimalValue, unit: AnyUnitId): DecimalValue {
  return value.div(scaleFactor(getUnit(unit)));
}

export function sameDimension(left: AnyUnitId, right: AnyUnitId): boolean {
  const a = getUnit(left).dimension;
  const b = getUnit(right).dimension;
  return a.mass === b.mass && a.activity === b.activity && a.volume === b.volume && a.time === b.time && a.bodyWeight === b.bodyWeight;
}

export function convert(value: DecimalValue, from: AnyUnitId, to: AnyUnitId): DecimalValue {
  if (!sameDimension(from, to)) {
    throw new Error(`Incompatible dimensions: ${from} and ${to}`);
  }
  return fromBase(toBase(value, from), to);
}

export function quantity<K extends UnitKind>(value: DecimalValue, unit: UnitId<K>): Quantity<K> {
  return { value, unit };
}

export function substanceFamily(unit: AnyUnitId): 'mass' | 'activity' | undefined {
  const vector = getUnit(unit).dimension;
  if (vector.mass !== 0 && vector.activity === 0) return 'mass';
  if (vector.activity !== 0 && vector.mass === 0) return 'activity';
  return undefined;
}

import { builderSteps, classOptions } from '../../data/srd-5.2.1-it/catalog'
import {
  type AbilityBonuses,
  type AbilityKey,
  type AbilityValues,
  type BuilderStep,
} from '../../types/character'

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const
export const LEVEL_ONE_PROFICIENCY_BONUS = 2

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(score: number): string {
  const modifier = abilityModifier(score)
  return modifier >= 0 ? `+${modifier}` : String(modifier)
}

export function assignStandardValue(
  current: AbilityValues,
  ability: AbilityKey,
  value: number | null,
): AbilityValues {
  if (value !== null && !STANDARD_ARRAY.includes(value as (typeof STANDARD_ARRAY)[number])) {
    throw new Error('Il valore non appartiene alla serie standard.')
  }
  if (
    value !== null &&
    Object.entries(current).some(([key, assigned]) => key !== ability && assigned === value)
  ) {
    throw new Error('Ogni valore della serie standard può essere assegnato una sola volta.')
  }
  return { ...current, [ability]: value }
}

export function applyBackgroundBonuses(
  base: AbilityValues,
  backgroundBonuses: AbilityBonuses,
): Record<AbilityKey, number | null> {
  return {
    strength: addBonus(base.strength, backgroundBonuses.strength),
    dexterity: addBonus(base.dexterity, backgroundBonuses.dexterity),
    constitution: addBonus(base.constitution, backgroundBonuses.constitution),
    intelligence: addBonus(base.intelligence, backgroundBonuses.intelligence),
    wisdom: addBonus(base.wisdom, backgroundBonuses.wisdom),
    charisma: addBonus(base.charisma, backgroundBonuses.charisma),
  }
}

export function availableStandardValues(current: AbilityValues, ability: AbilityKey): number[] {
  const assignedElsewhere = new Set(
    Object.entries(current)
      .filter(([key]) => key !== ability)
      .map(([, value]) => value)
      .filter((value): value is number => value !== null),
  )
  return STANDARD_ARRAY.filter((value) => !assignedElsewhere.has(value))
}

export function hasCompleteStandardArray(values: AbilityValues): boolean {
  const assigned = Object.values(values)
  return assigned.every((value): value is number => value !== null) &&
    [...assigned].sort((a, b) => b - a).join(',') === STANDARD_ARRAY.join(',')
}

export function classHasLevelOneSpells(classId: string): boolean {
  return classOptions.find((option) => option.id === classId)?.hasLevelOneSpells ?? false
}

export function visibleBuilderSteps(classId: string): BuilderStep[] {
  return classHasLevelOneSpells(classId)
    ? builderSteps
    : builderSteps.filter((step) => step.id !== 'spells')
}

function addBonus(base: number | null, bonus: number): number | null {
  return base === null ? null : base + bonus
}

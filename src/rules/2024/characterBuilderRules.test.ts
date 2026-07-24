import { describe, expect, it } from 'vitest'
import { speciesOptions } from '../../data/srd-5.2.1-it/catalog'
import { emptyAbilityBonuses, emptyAbilityValues } from '../../types/character'
import {
  abilityModifier,
  applyBackgroundBonuses,
  assignStandardValue,
  formatModifier,
  hasCompleteStandardArray,
  visibleBuilderSteps,
} from './characterBuilderRules'

describe('regole tecniche del builder 2024', () => {
  it('assegna ogni valore della serie standard una sola volta', () => {
    const first = assignStandardValue(emptyAbilityValues, 'strength', 15)
    expect(() => assignStandardValue(first, 'dexterity', 15)).toThrow(/una sola volta/)

    const complete = {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    }
    expect(hasCompleteStandardArray(complete)).toBe(true)
  })

  it('calcola correttamente i modificatori', () => {
    expect(abilityModifier(8)).toBe(-1)
    expect(abilityModifier(10)).toBe(0)
    expect(abilityModifier(15)).toBe(2)
    expect(formatModifier(15)).toBe('+2')
  })

  it('applica gli aumenti provenienti dal Background', () => {
    const base = { ...emptyAbilityValues, strength: 15, wisdom: 13 }
    const bonuses = { ...emptyAbilityBonuses, strength: 2, wisdom: 1 }

    expect(applyBackgroundBonuses(base, bonuses)).toMatchObject({ strength: 17, wisdom: 14 })
  })

  it('non prevede aumenti delle caratteristiche provenienti dalla Specie', () => {
    expect(speciesOptions.every((species) => !('abilityBonuses' in species))).toBe(true)
    expect(applyBackgroundBonuses({ ...emptyAbilityValues, strength: 15 }, emptyAbilityBonuses).strength).toBe(15)
  })

  it('mostra Incantesimi soltanto per classi che li possiedono al livello 1', () => {
    expect(visibleBuilderSteps('fighter').some((step) => step.id === 'spells')).toBe(false)
    expect(visibleBuilderSteps('wizard').some((step) => step.id === 'spells')).toBe(true)
  })
})

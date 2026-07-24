import { describe, expect, it } from 'vitest'
import { createEmptyAbilityGeneration, type PointCostConfiguration } from '../../types/character'
import {
  buildCumulativeCostTable,
  calculateDroppedDie,
  calculateRemainingPoints,
  calculateRollTotal,
  calculateScoreCost,
  calculateTotalPointCost,
  createPhysicalRollGroup,
  officialPointCostConfiguration,
  parsePointCostConfigurationJson,
  rollAbilityGroup,
  rollSixAbilityGroups,
  validateAbilityAssignments,
  validatePhysicalDice,
  validatePointCostConfiguration,
} from './abilityGenerationRules'

describe('generazione delle caratteristiche 2024', () => {
  it('considera valida la serie standard solo se ogni valore è usato una volta', () => {
    const generation = createEmptyAbilityGeneration()
    generation.standardArrayAssignments = {
      strength: 15, dexterity: 14, constitution: 13,
      intelligence: 12, wisdom: 10, charisma: 8,
    }
    expect(validateAbilityAssignments(generation)).toEqual([])
    generation.standardArrayAssignments.charisma = 10
    expect(validateAbilityAssignments(generation)).not.toEqual([])
  })

  it('tira 4d6 e scarta il dado più basso', () => {
    const values = [0, 0.2, 0.5, 0.999]
    const group = rollAbilityGroup(() => values.shift() ?? 0, '2026-01-01T00:00:00.000Z', 'roll-1')
    expect(group.dice).toEqual([1, 2, 4, 6])
    expect(group.droppedDieIndex).toBe(0)
    expect(group.total).toBe(12)
  })

  it('gestisce dadi minimi uguali scartandone uno solo', () => {
    expect(calculateDroppedDie([2, 2, 5, 6])).toBe(0)
    expect(calculateRollTotal([2, 2, 5, 6])).toBe(13)
  })

  it('genera sei gruppi indipendenti', () => {
    expect(rollSixAbilityGroups(() => 0.5, '2026-01-01T00:00:00.000Z')).toHaveLength(6)
  })

  it('valida i dadi fisici tra 1 e 6 e ne calcola il totale', () => {
    expect(validatePhysicalDice([1, 3, 5, 6])).toEqual([])
    expect(validatePhysicalDice([0, 3, 5, 7])).toHaveLength(2)
    expect(createPhysicalRollGroup([1, 3, 5, 6]).total).toBe(14)
  })
})

describe('acquisto con punti 2024', () => {
  const official = officialPointCostConfiguration()

  it('usa i costi ufficiali da 8 a 15', () => {
    expect(buildCumulativeCostTable(official)).toEqual({ 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 })
    expect(calculateScoreCost(14, official) - calculateScoreCost(13, official)).toBe(2)
    expect(calculateScoreCost(15, official) - calculateScoreCost(14, official)).toBe(2)
  })

  it('calcola 27 punti per 15, 15, 15, 8, 8, 8', () => {
    const scores = { strength: 15, dexterity: 15, constitution: 15, intelligence: 8, wisdom: 8, charisma: 8 }
    expect(calculateTotalPointCost(scores, official)).toBe(27)
    expect(calculateRemainingPoints(scores, official)).toBe(0)
  })

  it('rileva il superamento del budget', () => {
    const generation = createEmptyAbilityGeneration()
    generation.method = 'point-cost'
    generation.pointCost.scores = { strength: 15, dexterity: 15, constitution: 15, intelligence: 15, wisdom: 8, charisma: 8 }
    expect(validateAbilityAssignments(generation)[0]).toMatch(/supera il budget/)
  })

  it('converte costi incrementali personalizzati in cumulativi', () => {
    const custom: PointCostConfiguration = {
      mode: 'custom', budget: 20, minScore: 10, maxScore: 13,
      stepCosts: { '10-11': 2, '11-12': 3, '12-13': 4 }, allowUnspentPoints: true,
    }
    expect(buildCumulativeCostTable(custom)).toEqual({ 10: 0, 11: 2, 12: 5, 13: 9 })
    expect(validatePointCostConfiguration(custom)).toEqual([])
  })

  it('rifiuta passaggi mancanti, costi negativi e non interi', () => {
    const invalid: PointCostConfiguration = {
      mode: 'custom', budget: 20, minScore: 8, maxScore: 11,
      stepCosts: { '8-9': 1, '9-10': -1.5 }, allowUnspentPoints: true,
    }
    expect(validatePointCostConfiguration(invalid).join(' ')).toMatch(/non negativo|Manca/)
  })

  it('ripristina una copia della configurazione ufficiale', () => {
    const restored = officialPointCostConfiguration()
    restored.stepCosts['8-9'] = 99
    expect(officialPointCostConfiguration().stepCosts['8-9']).toBe(1)
  })

  it('rifiuta JSON personalizzato non valido', () => {
    expect(() => parsePointCostConfigurationJson('{non-json')).toThrow(/JSON valido/)
    expect(() => parsePointCostConfigurationJson(JSON.stringify({ budget: -1 }))).toThrow()
  })
})

import {
  OFFICIAL_POINT_COST_CONFIGURATION,
  type AbilityGeneration,
  type AbilityKey,
  type AbilityValues,
  type DiceRollGroup,
  type PointCostConfiguration,
} from '../../types/character'

export type RandomUnitGenerator = () => number

export function secureRandomUnit(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const value = new Uint32Array(1)
    crypto.getRandomValues(value)
    return value[0] / 0x1_0000_0000
  }
  return Math.random()
}

export function calculateDroppedDie(dice: readonly number[]): number {
  if (dice.length !== 4) throw new Error('Un gruppo deve contenere esattamente quattro dadi.')
  return dice.reduce((lowestIndex, die, index) => die < dice[lowestIndex] ? index : lowestIndex, 0)
}

export function calculateRollTotal(dice: readonly number[], droppedDieIndex = calculateDroppedDie(dice)): number {
  if (dice.length !== 4 || droppedDieIndex < 0 || droppedDieIndex > 3) {
    throw new Error('Il gruppo di dadi non è valido.')
  }
  return dice.reduce((total, die, index) => total + (index === droppedDieIndex ? 0 : die), 0)
}

export function validatePhysicalDice(dice: readonly number[]): string[] {
  const errors: string[] = []
  if (dice.length !== 4) errors.push('Inserisci esattamente quattro dadi.')
  dice.forEach((die, index) => {
    if (!Number.isInteger(die) || die < 1 || die > 6) errors.push(`Il dado ${index + 1} deve essere un intero da 1 a 6.`)
  })
  return errors
}

export function rollAbilityGroup(
  random: RandomUnitGenerator = secureRandomUnit,
  now = new Date().toISOString(),
  id = createRollId(),
): DiceRollGroup {
  const dice = Array.from({ length: 4 }, () => Math.floor(clampRandom(random()) * 6) + 1) as [number, number, number, number]
  const droppedDieIndex = calculateDroppedDie(dice)
  return {
    id,
    dice,
    droppedDieIndex,
    total: calculateRollTotal(dice, droppedDieIndex),
    source: 'generated',
    createdAt: now,
  }
}

export function rollSixAbilityGroups(random: RandomUnitGenerator = secureRandomUnit, now = new Date().toISOString()): DiceRollGroup[] {
  return Array.from({ length: 6 }, (_, index) => rollAbilityGroup(random, now, `roll-${now}-${index + 1}`))
}

export function createPhysicalRollGroup(
  dice: [number, number, number, number],
  now = new Date().toISOString(),
  id = createRollId(),
): DiceRollGroup {
  const errors = validatePhysicalDice(dice)
  if (errors.length) throw new Error(errors[0])
  const droppedDieIndex = calculateDroppedDie(dice)
  return { id, dice, droppedDieIndex, total: calculateRollTotal(dice, droppedDieIndex), source: 'physical', createdAt: now }
}

export function buildCumulativeCostTable(configuration: Pick<PointCostConfiguration, 'minScore' | 'maxScore' | 'stepCosts'>): Record<number, number> {
  const errors = validatePointCostConfiguration({
    ...configuration,
    mode: 'custom',
    budget: 1,
    allowUnspentPoints: true,
  })
  if (errors.length) throw new Error(errors[0])
  const table: Record<number, number> = { [configuration.minScore]: 0 }
  for (let score = configuration.minScore; score < configuration.maxScore; score += 1) {
    table[score + 1] = table[score] + configuration.stepCosts[`${score}-${score + 1}`]
  }
  return table
}

export function calculateScoreCost(score: number, configuration: PointCostConfiguration): number {
  if (!Number.isInteger(score) || score < configuration.minScore || score > configuration.maxScore) {
    throw new Error(`Il valore deve essere compreso tra ${configuration.minScore} e ${configuration.maxScore}.`)
  }
  return buildCumulativeCostTable(configuration)[score]
}

export function calculateTotalPointCost(scores: Record<AbilityKey, number>, configuration: PointCostConfiguration): number {
  return (Object.values(scores) as number[]).reduce((total, score) => total + calculateScoreCost(score, configuration), 0)
}

export function calculateRemainingPoints(scores: Record<AbilityKey, number>, configuration: PointCostConfiguration): number {
  return configuration.budget - calculateTotalPointCost(scores, configuration)
}

export function validatePointCostConfiguration(configuration: PointCostConfiguration): string[] {
  const errors: string[] = []
  if (!Number.isInteger(configuration.budget) || configuration.budget <= 0 || configuration.budget > 1000) {
    errors.push('Il budget deve essere un intero positivo non superiore a 1000.')
  }
  if (!Number.isInteger(configuration.minScore) || !Number.isInteger(configuration.maxScore)) {
    errors.push('I valori minimo e massimo devono essere interi.')
    return errors
  }
  if (configuration.minScore >= configuration.maxScore) errors.push('Il valore minimo deve essere inferiore al massimo.')
  if (configuration.minScore < 1 || configuration.maxScore > 30 || configuration.maxScore - configuration.minScore > 20) {
    errors.push('L’intervallo deve restare tra 1 e 30 e non può superare 20 passaggi.')
  }
  for (let score = configuration.minScore; score < configuration.maxScore; score += 1) {
    const key = `${score}-${score + 1}`
    const cost = configuration.stepCosts[key]
    if (cost === undefined) errors.push(`Manca il costo del passaggio ${key}.`)
    else if (!Number.isInteger(cost) || cost < 0) errors.push(`Il costo del passaggio ${key} deve essere un intero non negativo.`)
  }
  return errors
}

export function officialPointCostConfiguration(): PointCostConfiguration {
  return {
    ...OFFICIAL_POINT_COST_CONFIGURATION,
    stepCosts: { ...OFFICIAL_POINT_COST_CONFIGURATION.stepCosts },
  }
}

export function parsePointCostConfigurationJson(json: string): PointCostConfiguration {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Il file non contiene JSON valido.')
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('La configurazione deve essere un oggetto JSON.')
  }
  const candidate = { ...(parsed as PointCostConfiguration), mode: 'custom' as const }
  const errors = validatePointCostConfiguration(candidate)
  if (errors.length) throw new Error(errors.join(' '))
  return candidate
}

export function validateAbilityAssignments(generation: AbilityGeneration): string[] {
  if (generation.method === 'standard-array') {
    const values = Object.values(generation.standardArrayAssignments)
    return values.length === 6 && new Set(values).size === 6 && [15, 14, 13, 12, 10, 8].every((value) => values.includes(value))
      ? [] : ['Assegna una sola volta ciascun valore della serie standard.']
  }
  if (generation.method === 'random-roll') {
    if (generation.diceRolls.length !== 6) return ['Genera esattamente sei gruppi di dadi.']
    const assignments = generation.diceRolls.map((roll) => roll.assignedAbility).filter(Boolean)
    return assignments.length === 6 && new Set(assignments).size === 6 ? [] : ['Assegna ogni tiro a una caratteristica diversa.']
  }
  const configurationErrors = validatePointCostConfiguration(generation.pointCost.configuration)
  if (configurationErrors.length) return configurationErrors
  const remaining = calculateRemainingPoints(generation.pointCost.scores, generation.pointCost.configuration)
  if (remaining < 0) return ['Il costo totale supera il budget disponibile.']
  if (!generation.pointCost.configuration.allowUnspentPoints && remaining !== 0) return ['La configurazione richiede di spendere tutti i punti.']
  return []
}

export function generationToAbilityValues(generation: AbilityGeneration): AbilityValues {
  if (generation.method === 'standard-array') {
    return abilityRecordToValues(generation.standardArrayAssignments)
  }
  if (generation.method === 'random-roll') {
    const assignments: Partial<Record<AbilityKey, number>> = {}
    generation.diceRolls.forEach((roll) => {
      if (roll.assignedAbility) assignments[roll.assignedAbility] = roll.total
    })
    return abilityRecordToValues(assignments)
  }
  return { ...generation.pointCost.scores }
}

export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

function abilityRecordToValues(values: Partial<Record<AbilityKey, number>>): AbilityValues {
  return {
    strength: values.strength ?? null,
    dexterity: values.dexterity ?? null,
    constitution: values.constitution ?? null,
    intelligence: values.intelligence ?? null,
    wisdom: values.wisdom ?? null,
    charisma: values.charisma ?? null,
  }
}

function clampRandom(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Il generatore casuale ha restituito un valore non valido.')
  return Math.min(Math.max(value, 0), 0.9999999999999999)
}

function createRollId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `roll-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

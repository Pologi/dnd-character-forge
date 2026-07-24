import type { Character } from '../../types/character'
import type {
  AdvancementSnapshot,
  ClassLevelProgression,
  HitPointMethod,
  SupportedLevel,
} from '../../types/advancement'
import { createUniqueId } from '../../types/character'

export const XP_THRESHOLDS: Record<SupportedLevel, number> = {
  1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500,
  6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
}

export function proficiencyBonusForLevel(level: number): number {
  if (level < 1 || level > 10) throw new Error('Il livello supportato deve essere compreso tra 1 e 10.')
  if (level >= 9) return 4
  if (level >= 5) return 3
  return 2
}

export function levelForExperience(experience: number): SupportedLevel {
  const safe = Math.max(0, experience)
  return ([10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as SupportedLevel[])
    .find((level) => safe >= XP_THRESHOLDS[level]) ?? 1
}

export function experienceProgress(level: SupportedLevel, experience: number) {
  if (level === 10) return { current: experience, threshold: 64000, next: null, missing: 0, percent: 100 }
  const start = XP_THRESHOLDS[level]
  const next = XP_THRESHOLDS[(level + 1) as SupportedLevel]
  const current = Math.max(start, experience)
  return {
    current,
    threshold: start,
    next,
    missing: Math.max(0, next - experience),
    percent: Math.max(0, Math.min(100, ((current - start) / (next - start)) * 100)),
  }
}

export function abilityModifier(score: number | null): number {
  return Math.floor(((score ?? 10) - 10) / 2)
}

export function validateProgression(progression: ClassLevelProgression, expectedClassId: string, expectedLevel: number): string[] {
  const errors: string[] = []
  if (!progression.complete) errors.push('Il livello è marcato come incompleto.')
  if (progression.classId !== expectedClassId) errors.push('La progressione appartiene a una classe diversa.')
  if (progression.level !== expectedLevel) errors.push('Il livello della progressione non corrisponde.')
  if (progression.proficiencyBonus !== proficiencyBonusForLevel(expectedLevel)) errors.push('Il bonus di competenza non è coerente.')
  if (!progression.source.sourceTitle || !progression.source.sourcePage) errors.push('Fonte o pagina ufficiale mancante.')
  if (progression.fixedHitPointValue < 1) errors.push('Valore fisso dei punti ferita mancante.')
  if (progression.requiredChoices.some((choice) => choice.required && (choice.count < 1 || choice.optionIds.length < choice.count))) {
    errors.push('Una scelta obbligatoria non contiene opzioni sufficienti.')
  }
  return errors
}

export function missingRequiredChoices(progression: ClassLevelProgression, choices: Record<string, string[]>): string[] {
  return progression.requiredChoices
    .filter((choice) => choice.required && (choices[choice.id]?.length ?? 0) !== choice.count)
    .map((choice) => choice.label)
}

export function hitPointGain(
  progression: ClassLevelProgression,
  hitDie: number,
  constitutionModifier: number,
  method: HitPointMethod,
  rawValue?: number,
) {
  const raw = method === 'fixed' ? progression.fixedHitPointValue : rawValue
  if (!Number.isInteger(raw) || raw === undefined || raw < 1 || (method === 'roll' && raw > hitDie)) {
    throw new Error(`Il risultato deve essere compreso tra 1 e ${hitDie}.`)
  }
  return { rawValue: raw, gained: Math.max(1, raw + constitutionModifier) }
}

export function constitutionRetroactiveAdjustment(previousScore: number, newScore: number, levels: number): number {
  return (abilityModifier(newScore) - abilityModifier(previousScore)) * levels
}

export function derivedStatistics(character: Character) {
  const abilities = Object.fromEntries(Object.entries(character.baseAbilities).map(([key, value]) => [
    key,
    (value ?? 10) + character.backgroundBonuses[key as keyof typeof character.backgroundBonuses],
  ])) as Record<keyof typeof character.baseAbilities, number>
  const proficiencyBonus = proficiencyBonusForLevel(character.level)
  const dexterity = abilityModifier(abilities.dexterity)
  const wisdom = abilityModifier(abilities.wisdom)
  return {
    totalLevel: character.level,
    proficiencyBonus,
    initiative: dexterity,
    passivePerception: 10 + wisdom + (character.classSkillIds.includes('Percezione') ? proficiencyBonus : 0),
    savingThrows: Object.fromEntries(Object.entries(abilities).map(([key, score]) => [key, abilityModifier(score)])),
    spellSaveDifficulty: 8 + proficiencyBonus,
    spellAttackBonus: proficiencyBonus,
    maxHitPoints: character.advancement.maxHitPoints,
  }
}

export interface ApplyAdvancementInput {
  character: Character
  progression: ClassLevelProgression
  classId: string
  hitDie: number
  hitPointMethod: HitPointMethod
  hitPointRawValue?: number
  choices: Record<string, string[]>
  now?: string
}

export function applyAdvancement(input: ApplyAdvancementInput): Character {
  const { character, progression, classId, choices } = input
  const targetLevel = character.level + 1
  if (targetLevel > 10) throw new Error('Il livello totale massimo supportato è 10.')
  const errors = validateProgression(progression, classId, targetLevel)
  const missing = missingRequiredChoices(progression, choices)
  if (progression.subclassRequired && (choices.subclass?.length ?? 0) !== 1) missing.push('Sottoclasse')
  if (errors.length || missing.length) throw new Error([...errors, ...missing.map((item) => `Scelta mancante: ${item}.`)].join(' '))
  if (!character.advancement.allowMulticlass && classId !== character.classId) throw new Error('La multiclasse è disattivata.')

  const previousSnapshot = snapshot(character)
  const constitution = (character.baseAbilities.constitution ?? 10) + character.backgroundBonuses.constitution
  const constitutionModifier = abilityModifier(constitution)
  const hp = hitPointGain(progression, input.hitDie, constitutionModifier, input.hitPointMethod, input.hitPointRawValue)
  const next = structuredClone(character)
  next.level = targetLevel as SupportedLevel
  if (next.requestedLevel > 1 && next.level <= next.requestedLevel) {
    next.advancement.experiencePoints = Math.max(next.advancement.experiencePoints, XP_THRESHOLDS[next.level])
  }
  const classEntry = next.advancement.classLevels.find((entry) => entry.classId === classId)
  if (classEntry) classEntry.level = (classEntry.level + 1) as SupportedLevel
  else next.advancement.classLevels.push({ classId, level: 1 })
  next.advancement.maxHitPoints += hp.gained
  next.advancement.currentHitPoints += hp.gained
  next.advancement.hitPointHistory.push({
    characterLevel: next.level, classId, hitDie: input.hitDie, method: input.hitPointMethod,
    rawValue: hp.rawValue, constitutionModifier, gained: hp.gained, retroactiveAdjustment: 0,
  })
  const appliedAbilityChanges: Partial<Record<keyof typeof next.baseAbilities, number>> = {}
  for (const choice of progression.requiredChoices) {
    for (const selected of choices[choice.id] ?? []) {
      const effect = choice.effects?.[selected]
      if (!effect) continue
      if (effect.featId && !next.advancement.featIds.includes(effect.featId)) next.advancement.featIds.push(effect.featId)
      for (const [ability, amount] of Object.entries(effect.abilityChanges ?? {})) {
        const key = ability as keyof typeof next.baseAbilities
        const current = next.baseAbilities[key] ?? 10
        const updated = current + (amount ?? 0)
        if (updated > 20) throw new Error(`Il punteggio di ${ability} supererebbe il limite consentito.`)
        next.baseAbilities[key] = updated
        appliedAbilityChanges[key] = (appliedAbilityChanges[key] ?? 0) + (amount ?? 0)
      }
      for (const [resourceId, amount] of Object.entries(effect.resourceChanges ?? {})) {
        next.advancement.resources[resourceId] = (next.advancement.resources[resourceId] ?? 0) + amount
      }
    }
  }
  if (choices.subclass?.[0]) next.advancement.subclassIds[classId] = choices.subclass[0]
  const newConstitution = (next.baseAbilities.constitution ?? 10) + next.backgroundBonuses.constitution
  const retroactiveHitPoints = constitutionRetroactiveAdjustment(constitution, newConstitution, next.level)
  if (retroactiveHitPoints !== 0) {
    next.advancement.maxHitPoints = Math.max(1, next.advancement.maxHitPoints + retroactiveHitPoints)
    next.advancement.hitPointHistory.at(-1)!.retroactiveAdjustment = retroactiveHitPoints
  }
  for (const resource of progression.resourceChanges) next.advancement.resources[resource.id] = resource.maximum
  if (progression.spellcastingProgression) {
    const selectedSpells = progression.spellcastingProgression.choices.flatMap((choice) => choices[choice.id] ?? [])
    next.advancement.spellIds = [...new Set([...next.advancement.spellIds, ...progression.spellcastingProgression.automaticSpellIds, ...selectedSpells])]
  }
  next.updatedAt = input.now ?? new Date().toISOString()
  const nextSnapshot = snapshot(next)
  next.advancement.history.push({
    id: createUniqueId(), previousLevel: character.level, newLevel: next.level, advancedClassId: classId,
    previousExperience: character.advancement.experiencePoints, newExperience: next.advancement.experiencePoints,
    date: next.updatedAt, hitPointsGained: hp.gained, grantedFeatureIds: [...progression.grantedFeatureIds],
    choices: structuredClone(choices), spellsAdded: next.advancement.spellIds.filter((id) => !character.advancement.spellIds.includes(id)),
    spellsRemoved: [], abilityChanges: appliedAbilityChanges, resourceChanges: Object.fromEntries(progression.resourceChanges.map((item) => [item.id, item.maximum])),
    source: progression.source, previousSnapshot, nextSnapshot,
  })
  return next
}

export function undoLastAdvancement(character: Character): Character {
  const last = character.advancement.history.at(-1)
  if (!last) throw new Error('Non esiste un avanzamento da annullare.')
  const restored = structuredClone(character)
  applySnapshot(restored, last.previousSnapshot)
  restored.advancement.history.pop()
  restored.updatedAt = new Date().toISOString()
  return restored
}

export function addExperience(character: Character, amount: number, note = ''): Character {
  if (!Number.isFinite(amount) || amount === 0) throw new Error('Inserisci una variazione XP diversa da zero.')
  const next = structuredClone(character)
  const previousTotal = next.advancement.experiencePoints
  next.advancement.experiencePoints = Math.max(0, previousTotal + Math.trunc(amount))
  next.advancement.experienceHistory.push({
    id: createUniqueId(), amount: next.advancement.experiencePoints - previousTotal,
    previousTotal, newTotal: next.advancement.experiencePoints, date: new Date().toISOString(), note,
  })
  next.updatedAt = new Date().toISOString()
  return next
}

function snapshot(character: Character): AdvancementSnapshot {
  return {
    level: character.level, experiencePoints: character.advancement.experiencePoints,
    classLevels: structuredClone(character.advancement.classLevels), baseAbilities: { ...character.baseAbilities },
    maxHitPoints: character.advancement.maxHitPoints, currentHitPoints: character.advancement.currentHitPoints,
    hitPointHistory: structuredClone(character.advancement.hitPointHistory),
    subclassIds: { ...character.advancement.subclassIds }, featIds: [...character.advancement.featIds],
    spellIds: [...character.advancement.spellIds], resources: { ...character.advancement.resources },
  }
}

function applySnapshot(character: Character, value: AdvancementSnapshot) {
  character.level = value.level
  character.baseAbilities = { ...value.baseAbilities }
  character.advancement.experiencePoints = value.experiencePoints
  character.advancement.classLevels = structuredClone(value.classLevels)
  character.advancement.maxHitPoints = value.maxHitPoints
  character.advancement.currentHitPoints = value.currentHitPoints
  character.advancement.hitPointHistory = structuredClone(value.hitPointHistory)
  character.advancement.subclassIds = { ...value.subclassIds }
  character.advancement.featIds = [...value.featIds]
  character.advancement.spellIds = [...value.spellIds]
  character.advancement.resources = { ...value.resources }
}

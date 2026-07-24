import {
  CHARACTER_SCHEMA_VERSION,
  RULESET_ID,
  createEmptyAbilityGeneration,
  createInitialAdvancement,
  createUniqueId,
  type AbilityBonuses,
  type AbilityValues,
  type Character,
  type CharacterDraft,
} from '../types/character'
import { classOptions } from '../data/srd-5.2.1-it/catalog'
import type { CharacterAdvancement } from '../types/advancement'

export const CHARACTERS_STORAGE_KEY = 'dnd-character-forge.characters.v5'
export const DRAFT_STORAGE_KEY = 'dnd-character-forge.draft.v5'
const LEGACY_CHARACTERS_STORAGE_KEYS = ['dnd-character-forge.characters.v4', 'dnd-character-forge.characters.v3', 'dnd-character-forge.characters.v2']
const LEGACY_DRAFT_STORAGE_KEYS = ['dnd-character-forge.draft.v4', 'dnd-character-forge.draft.v3', 'dnd-character-forge.draft.v2']

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function browserStorage(): StorageAdapter | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function isChoiceRecord(value: unknown): value is Record<string, string[]> {
  return isRecord(value) && Object.values(value).every(isStringArray)
}

function isAbilityGeneration(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (!['standard-array', 'random-roll', 'point-cost'].includes(String(value.method))) return false
  if (!isRecord(value.standardArrayAssignments) || !Array.isArray(value.diceRolls) || !isRecord(value.pointCost)) return false
  const pointCost = value.pointCost
  return isRecord(pointCost.configuration) && isRecord(pointCost.scores) && typeof pointCost.spentPoints === 'number'
}

function isValidDate(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value))
}

const abilityKeys = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const

function isAbilityValues(value: unknown): value is AbilityValues {
  return isRecord(value) && abilityKeys.every((key) => value[key] === null || typeof value[key] === 'number')
}

function isAbilityBonuses(value: unknown): value is AbilityBonuses {
  return isRecord(value) && abilityKeys.every((key) => typeof value[key] === 'number')
}

const textFields = [
  'name',
  'playerName',
  'initialIdea',
  'inspirationId',
  'classId',
  'backgroundId',
  'speciesId',
  'appearance',
  'personality',
  'ideal',
  'bond',
  'flaw',
  'backstory',
  'alignment',
  'officialBookSpeciesNotes',
] as const

const arrayFields = [
  'languages',
  'classChoices',
  'classSkillIds',
  'equipmentChoiceIds',
  'spellChoiceIds',
] as const

function hasCharacterFields(value: Record<string, unknown>): boolean {
  return (
    Number.isInteger(value.level) && Number(value.level) >= 1 && Number(value.level) <= 10 &&
    Number.isInteger(value.requestedLevel) && Number(value.requestedLevel) >= 1 && Number(value.requestedLevel) <= 10 &&
    value.ruleset === RULESET_ID &&
    textFields.every((field) => isString(value[field])) &&
    arrayFields.every((field) => isStringArray(value[field])) &&
    isAbilityValues(value.baseAbilities) &&
    isAbilityBonuses(value.backgroundBonuses) &&
    isAbilityGeneration(value.abilityGeneration) &&
    isChoiceRecord(value.classOptionSelections) &&
    isChoiceRecord(value.speciesOptionSelections) &&
    typeof value.officialBookSpeciesConfirmed === 'boolean' &&
    isCharacterAdvancement(value.advancement)
  )
}

function isCharacterAdvancement(value: unknown): value is CharacterAdvancement {
  return isRecord(value)
    && ['experience', 'milestone'].includes(String(value.mode))
    && typeof value.experiencePoints === 'number'
    && Array.isArray(value.experienceHistory)
    && Array.isArray(value.classLevels)
    && Array.isArray(value.hitPointHistory)
    && typeof value.maxHitPoints === 'number'
    && typeof value.currentHitPoints === 'number'
    && isRecord(value.subclassIds)
    && isStringArray(value.featIds)
    && isStringArray(value.spellIds)
    && isRecord(value.resources)
    && Array.isArray(value.history)
    && typeof value.allowMulticlass === 'boolean'
}

export function isCharacter(value: unknown): value is Character {
  return (
    isRecord(value) &&
    value.status === 'complete' &&
    value.schemaVersion === CHARACTER_SCHEMA_VERSION &&
    isString(value.id) &&
    value.id.length > 0 &&
    isValidDate(value.createdAt) &&
    isValidDate(value.updatedAt) &&
    hasCharacterFields(value) &&
    isString(value.name) &&
    value.name.trim().length > 0
  )
}

export function isCharacterDraft(value: unknown): value is CharacterDraft {
  return (
    isRecord(value) &&
    value.status === 'draft' &&
    value.schemaVersion === CHARACTER_SCHEMA_VERSION &&
    isString(value.id) &&
    value.id.length > 0 &&
    isValidDate(value.createdAt) &&
    isValidDate(value.updatedAt) &&
    hasCharacterFields(value)
  )
}

function readJson(storage: StorageAdapter | null, key: string): unknown {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

export function getCharacters(storage: StorageAdapter | null = browserStorage()): Character[] {
  const current = readJson(storage, CHARACTERS_STORAGE_KEY)
  if (Array.isArray(current)) return current.map(migrateStoredCharacter).filter(isCharacter)
  for (const key of LEGACY_CHARACTERS_STORAGE_KEYS) {
    const legacy = readJson(storage, key)
    if (Array.isArray(legacy)) return legacy.map(migrateStoredCharacter).filter(isCharacter)
  }
  return []
}

export function saveCharacter(
  draft: CharacterDraft,
  storage: StorageAdapter | null = browserStorage(),
): Character {
  if (!draft.name.trim()) throw new Error('Il nome del personaggio è obbligatorio.')

  const character: Character = {
    ...draft,
    name: draft.name.trim(),
    baseAbilities: { ...draft.baseAbilities },
    backgroundBonuses: { ...draft.backgroundBonuses },
    abilityGeneration: structuredClone(draft.abilityGeneration),
    languages: [...draft.languages],
    classChoices: [...draft.classChoices],
    classSkillIds: [...draft.classSkillIds],
    classOptionSelections: structuredClone(draft.classOptionSelections),
    speciesOptionSelections: structuredClone(draft.speciesOptionSelections),
    equipmentChoiceIds: [...draft.equipmentChoiceIds],
    spellChoiceIds: [...draft.spellChoiceIds],
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    ruleset: RULESET_ID,
    level: 1,
    advancement: normalizeAdvancement(draft.advancement, draft.classId, draft.baseAbilities, draft.backgroundBonuses),
    status: 'complete',
    updatedAt: new Date().toISOString(),
  }

  if (storage) {
    const characters = getCharacters(storage)
    const existingIndex = characters.findIndex((item) => item.id === character.id)
    if (existingIndex >= 0) characters[existingIndex] = character
    else characters.push(character)
    writeCharacters(storage, characters, 'salvare')
  }
  return character
}

export function deleteCharacter(
  id: string,
  storage: StorageAdapter | null = browserStorage(),
): Character[] {
  const characters = getCharacters(storage).filter((character) => character.id !== id)
  if (storage) writeCharacters(storage, characters, 'eliminare')
  return characters
}

export function duplicateCharacter(
  id: string,
  storage: StorageAdapter | null = browserStorage(),
): Character {
  const source = getCharacters(storage).find((character) => character.id === id)
  if (!source) throw new Error('Personaggio non trovato.')

  const now = new Date().toISOString()
  const copy: Character = {
    ...source,
    id: createUniqueId(),
    name: `${source.name} Copia`,
    baseAbilities: { ...source.baseAbilities },
    backgroundBonuses: { ...source.backgroundBonuses },
    abilityGeneration: structuredClone(source.abilityGeneration),
    languages: [...source.languages],
    classChoices: [...source.classChoices],
    classSkillIds: [...source.classSkillIds],
    classOptionSelections: structuredClone(source.classOptionSelections),
    speciesOptionSelections: structuredClone(source.speciesOptionSelections),
    equipmentChoiceIds: [...source.equipmentChoiceIds],
    spellChoiceIds: [...source.spellChoiceIds],
    advancement: structuredClone(source.advancement),
    createdAt: now,
    updatedAt: now,
  }
  if (storage) writeCharacters(storage, [...getCharacters(storage), copy], 'duplicare')
  return copy
}

export function exportCharacter(character: Character): string {
  return JSON.stringify({ ...character, officialBookSpeciesNotes: '' }, null, 2)
}

export function importCharacter(
  json: string,
  storage: StorageAdapter | null = browserStorage(),
): Character {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Il file non contiene un JSON valido.')
  }
  const migrated = migrateStoredCharacter(parsed)
  if (!isCharacter(migrated)) {
    throw new Error('Il file non contiene un personaggio D&D 5e 2024 valido o usa uno schema non supportato.')
  }

  const now = new Date().toISOString()
  const imported: Character = {
    ...migrated,
    id: createUniqueId(),
    baseAbilities: { ...migrated.baseAbilities },
    backgroundBonuses: { ...migrated.backgroundBonuses },
    abilityGeneration: structuredClone(migrated.abilityGeneration),
    languages: [...migrated.languages],
    classChoices: [...migrated.classChoices],
    classSkillIds: [...migrated.classSkillIds],
    classOptionSelections: structuredClone(migrated.classOptionSelections),
    speciesOptionSelections: structuredClone(migrated.speciesOptionSelections),
    equipmentChoiceIds: [...migrated.equipmentChoiceIds],
    spellChoiceIds: [...migrated.spellChoiceIds],
    advancement: structuredClone(migrated.advancement),
    createdAt: now,
    updatedAt: now,
  }
  if (storage) writeCharacters(storage, [...getCharacters(storage), imported], 'importare')
  return imported
}

export function getDraft(storage: StorageAdapter | null = browserStorage()): CharacterDraft | null {
  const current = migrateStoredDraft(readJson(storage, DRAFT_STORAGE_KEY))
  if (isCharacterDraft(current)) return current
  for (const key of LEGACY_DRAFT_STORAGE_KEYS) {
    const migrated = migrateStoredDraft(readJson(storage, key))
    if (isCharacterDraft(migrated)) return migrated
  }
  return null
}

export function saveDraft(
  draft: CharacterDraft,
  storage: StorageAdapter | null = browserStorage(),
): void {
  if (!storage) return
  try {
    storage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        ...draft,
        ruleset: RULESET_ID,
        level: draft.level,
        advancement: structuredClone(draft.advancement),
        baseAbilities: { ...draft.baseAbilities },
        backgroundBonuses: { ...draft.backgroundBonuses },
        abilityGeneration: structuredClone(draft.abilityGeneration),
        updatedAt: new Date().toISOString(),
      }),
    )
    LEGACY_DRAFT_STORAGE_KEYS.forEach((key) => storage.removeItem(key))
  } catch {
    // La bozza non deve bloccare l'interfaccia se lo spazio locale non è disponibile.
  }
}

export function migrateStoredDraft(value: unknown): unknown {
  if (!isRecord(value)) return value
  if (isAbilityGeneration(value.abilityGeneration) && value.schemaVersion === CHARACTER_SCHEMA_VERSION && isCharacterAdvancement(value.advancement)) return value
  if (!isAbilityValues(value.baseAbilities)) return value
  const generation = createEmptyAbilityGeneration()
  for (const key of abilityKeys) {
    const score = value.baseAbilities[key]
    if (typeof score === 'number') generation.standardArrayAssignments[key] = score
  }
  return {
    ...value,
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    abilityGeneration: generation,
    classSkillIds: isStringArray(value.classSkillIds) ? value.classSkillIds : [],
    classOptionSelections: isChoiceRecord(value.classOptionSelections) ? value.classOptionSelections : {},
    speciesOptionSelections: isChoiceRecord(value.speciesOptionSelections) ? value.speciesOptionSelections : {},
    officialBookSpeciesConfirmed: typeof value.officialBookSpeciesConfirmed === 'boolean' ? value.officialBookSpeciesConfirmed : false,
    officialBookSpeciesNotes: isString(value.officialBookSpeciesNotes) ? value.officialBookSpeciesNotes : '',
    level: Number.isInteger(value.level) && Number(value.level) >= 1 && Number(value.level) <= 10 ? value.level : 1,
    requestedLevel: Number.isInteger(value.requestedLevel) && Number(value.requestedLevel) >= 1 && Number(value.requestedLevel) <= 10 ? value.requestedLevel : 1,
    advancement: normalizeAdvancement(value.advancement, isString(value.classId) ? value.classId : '', value.baseAbilities, isAbilityBonuses(value.backgroundBonuses) ? value.backgroundBonuses : {
      strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0,
    }),
  }
}

export function replaceCharacter(character: Character, storage: StorageAdapter | null = browserStorage()): Character {
  if (!isCharacter(character)) throw new Error('Il personaggio aggiornato non è valido.')
  if (storage) {
    const characters = getCharacters(storage)
    const index = characters.findIndex((item) => item.id === character.id)
    if (index < 0) throw new Error('Personaggio non trovato.')
    characters[index] = structuredClone(character)
    writeCharacters(storage, characters, 'aggiornare')
  }
  return character
}

function normalizeAdvancement(
  value: unknown,
  classId: string,
  baseAbilities: AbilityValues,
  bonuses: AbilityBonuses,
): CharacterAdvancement {
  if (isCharacterAdvancement(value)) return structuredClone(value)
  const advancement = createInitialAdvancement(classId)
  const characterClass = classOptions.find((item) => item.id === classId)
  const constitution = (baseAbilities.constitution ?? 10) + bonuses.constitution
  const constitutionModifier = Math.floor((constitution - 10) / 2)
  if (characterClass) {
    const maximum = Math.max(1, characterClass.hitDie + constitutionModifier)
    advancement.maxHitPoints = maximum
    advancement.currentHitPoints = maximum
    advancement.hitPointHistory = [{
      characterLevel: 1,
      classId,
      hitDie: characterClass.hitDie,
      method: 'fixed',
      rawValue: characterClass.hitDie,
      constitutionModifier,
      gained: maximum,
      retroactiveAdjustment: 0,
    }]
  }
  return advancement
}

function migrateStoredCharacter(value: unknown): unknown {
  const migrated = migrateStoredDraft(value)
  return isRecord(migrated) ? { ...migrated, status: value && isRecord(value) ? value.status : undefined } : migrated
}

export function clearDraft(storage: StorageAdapter | null = browserStorage()): void {
  if (!storage) return
  try {
    storage.removeItem(DRAFT_STORAGE_KEY)
    LEGACY_DRAFT_STORAGE_KEYS.forEach((key) => storage.removeItem(key))
  } catch {
    // La pulizia della bozza è non critica.
  }
}

function writeCharacters(storage: StorageAdapter, characters: Character[], action: string): void {
  try {
    storage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(characters))
  } catch {
    throw new Error(`Non è stato possibile ${action} il personaggio nel browser.`)
  }
}

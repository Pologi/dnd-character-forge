import type { CharacterAdvancement, SupportedLevel } from './advancement'

export const CHARACTER_SCHEMA_VERSION = 5
export const RULESET_ID = 'srd-5.2.1-it' as const
export const RULESET_LABEL = 'D&D 5e 2024'

export type RulesetId = typeof RULESET_ID
export type CharacterStatus = 'draft' | 'complete'
export type AbilityKey =
  | 'strength' | 'dexterity' | 'constitution'
  | 'intelligence' | 'wisdom' | 'charisma'

export interface RulesSourceReference {
  sourceId: string
  sourceTitle: string
  sourceSection: string
  sourcePage?: number
  license: 'CC-BY-4.0' | 'Proprietario'
  ruleset: string
  isSrdContent: boolean
  requiresOfficialBook: boolean
}

export interface RequiredChoice {
  id: string
  label: string
  count: number
  options: { id: string; label: string; summary?: string }[]
}

export interface RuleDefinition {
  id: string
  nameIt: string
  shortDescription: string
  source: RulesSourceReference
  requiredChoices: RequiredChoice[]
}

export interface CharacterClass extends RuleDefinition {
  role: string
  primaryAbility: AbilityKey
  primaryAbilities: AbilityKey[]
  complexity: 'facile' | 'media' | 'avanzata'
  styles: ('mischia' | 'distanza' | 'magia' | 'supporto' | 'utilità' | 'furtività')[]
  filters: ('facile' | 'marziali' | 'incantatori' | 'supporto' | 'furtività' | 'distanza' | 'mischia')[]
  hasLevelOneSpells: boolean
  icon: string
  hitDie: 6 | 8 | 10 | 12
  levelOneHitPoints: string
  armorProficiencies: string[]
  weaponProficiencies: string[]
  toolProficiencies: string[]
  savingThrows: AbilityKey[]
  skillChoices: string[]
  skillChoiceCount: number
  startingEquipment: { id: string; label: string }[]
  goldAlternative: number
  levelOneFeatures: { id: string; nameIt: string; summary: string; level: 1 }[]
  spellcasting: null | {
    ability: AbilityKey
    cantrips: number
    preparedSpells: number
    levelOneSlots: number
    spellbookSpells?: number
  }
  weaponMasteryCount: number
  howToPlay: string
  strengths: string[]
  considerations: string[]
  suggestions: string[]
}

export interface Background extends RuleDefinition {
  icon: string
}

export interface Species extends RuleDefinition {
  icon: string
  creatureType: 'Umanoide'
  size: string
  speedMeters: number
  darkvisionMeters: number | null
  resistances: string[]
  proficiencies: string[]
  traits: { id: string; nameIt: string; summary: string; level: number }[]
  speciesSpells: { nameIt: string; levelGained: number }[]
  complexity: 'facile' | 'media' | 'avanzata'
  abilityScoreIncreases: never[]
}

export interface AbilityScore {
  id: AbilityKey
  nameIt: string
  icon: string
  simpleDescription: string
  examples: string[]
}

export interface AbilityValues {
  strength: number | null
  dexterity: number | null
  constitution: number | null
  intelligence: number | null
  wisdom: number | null
  charisma: number | null
}

export interface AbilityBonuses {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export type AbilityGenerationMethod = 'standard-array' | 'random-roll' | 'point-cost'
export type PointCostMode = 'official-2024' | 'custom'

export interface DiceRollGroup {
  id: string
  dice: [number, number, number, number]
  droppedDieIndex: number
  total: number
  assignedAbility?: AbilityKey
  source: 'generated' | 'physical'
  createdAt: string
}

export interface PointCostConfiguration {
  mode: PointCostMode
  budget: number
  minScore: number
  maxScore: number
  stepCosts: Record<string, number>
  allowUnspentPoints: boolean
}

export interface AbilityGeneration {
  method: AbilityGenerationMethod
  standardArrayAssignments: Partial<Record<AbilityKey, number>>
  diceRolls: DiceRollGroup[]
  pointCost: {
    configuration: PointCostConfiguration
    scores: Record<AbilityKey, number>
    spentPoints: number
  }
}

export interface EquipmentChoice extends RuleDefinition {
  choiceType: 'starting-package' | 'gold-alternative'
  origin: 'class' | 'background'
  icon: string
}

export interface SpellChoice extends RuleDefinition {
  level: 0 | 1
  category: 'trucco' | 'livello-1'
  icon: string
}

export interface BuilderStep {
  id: 'intro' | 'class' | 'background' | 'species' | 'languages' | 'abilities'
    | 'class-choices' | 'equipment' | 'spells' | 'personality' | 'summary'
  chapter: string
  title: string
  shortDescription: string
  icon: string
  sageGuide: {
    explanation: string
    usefulness: string
    suggestion: string
    ruleLabel: 'Scelta libera' | 'Richiesto dalle regole'
  }
}

export interface CharacterFields {
  name: string
  playerName: string
  initialIdea: string
  inspirationId: string
  level: SupportedLevel
  requestedLevel: SupportedLevel
  ruleset: RulesetId
  classId: string
  backgroundId: string
  speciesId: string
  languages: string[]
  baseAbilities: AbilityValues
  backgroundBonuses: AbilityBonuses
  abilityGeneration: AbilityGeneration
  classChoices: string[]
  classSkillIds: string[]
  classOptionSelections: Record<string, string[]>
  speciesOptionSelections: Record<string, string[]>
  officialBookSpeciesConfirmed: boolean
  officialBookSpeciesNotes: string
  equipmentChoiceIds: string[]
  spellChoiceIds: string[]
  appearance: string
  personality: string
  ideal: string
  bond: string
  flaw: string
  backstory: string
  alignment: string
  advancement: CharacterAdvancement
}

interface CharacterMetadata {
  id: string
  schemaVersion: number
  createdAt: string
  updatedAt: string
}

export interface CharacterDraft extends CharacterMetadata, CharacterFields { status: 'draft' }
export interface Character extends CharacterMetadata, CharacterFields { status: 'complete' }

export const emptyAbilityValues: AbilityValues = {
  strength: null, dexterity: null, constitution: null,
  intelligence: null, wisdom: null, charisma: null,
}

export const emptyAbilityBonuses: AbilityBonuses = {
  strength: 0, dexterity: 0, constitution: 0,
  intelligence: 0, wisdom: 0, charisma: 0,
}

export const OFFICIAL_POINT_COST_CONFIGURATION: PointCostConfiguration = {
  mode: 'official-2024',
  budget: 27,
  minScore: 8,
  maxScore: 15,
  stepCosts: {
    '8-9': 1,
    '9-10': 1,
    '10-11': 1,
    '11-12': 1,
    '12-13': 1,
    '13-14': 2,
    '14-15': 2,
  },
  allowUnspentPoints: true,
}

export function createEmptyAbilityGeneration(): AbilityGeneration {
  return {
    method: 'standard-array',
    standardArrayAssignments: {},
    diceRolls: [],
    pointCost: {
      configuration: {
        ...OFFICIAL_POINT_COST_CONFIGURATION,
        stepCosts: { ...OFFICIAL_POINT_COST_CONFIGURATION.stepCosts },
      },
      scores: {
        strength: 8,
        dexterity: 8,
        constitution: 8,
        intelligence: 8,
        wisdom: 8,
        charisma: 8,
      },
      spentPoints: 0,
    },
  }
}

export function createEmptyDraft(now = new Date().toISOString(), id = createUniqueId()): CharacterDraft {
  return {
    id, schemaVersion: CHARACTER_SCHEMA_VERSION, createdAt: now, updatedAt: now, status: 'draft',
    name: '', playerName: '', initialIdea: '', inspirationId: '', level: 1, requestedLevel: 1, ruleset: RULESET_ID,
    classId: '', backgroundId: '', speciesId: '', languages: [],
    baseAbilities: { ...emptyAbilityValues }, backgroundBonuses: { ...emptyAbilityBonuses },
    abilityGeneration: createEmptyAbilityGeneration(),
    classChoices: [], classSkillIds: [], classOptionSelections: {}, speciesOptionSelections: {},
    officialBookSpeciesConfirmed: false, officialBookSpeciesNotes: '',
    equipmentChoiceIds: [], spellChoiceIds: [], appearance: '', personality: '', ideal: '',
    bond: '', flaw: '', backstory: '', alignment: '',
    advancement: createInitialAdvancement(),
  }
}

export function createInitialAdvancement(classId = ''): CharacterAdvancement {
  return {
    mode: 'milestone',
    experiencePoints: 0,
    experienceHistory: [],
    classLevels: classId ? [{ classId, level: 1 }] : [],
    hitPointHistory: [],
    maxHitPoints: 0,
    currentHitPoints: 0,
    subclassIds: {},
    featIds: [],
    spellIds: [],
    resources: {},
    history: [],
    allowMulticlass: false,
  }
}

export function characterToDraft(character: Character): CharacterDraft {
  return {
    ...character,
    baseAbilities: { ...character.baseAbilities },
    backgroundBonuses: { ...character.backgroundBonuses },
    abilityGeneration: structuredClone(character.abilityGeneration),
    languages: [...character.languages],
    classChoices: [...character.classChoices],
    classSkillIds: [...character.classSkillIds],
    classOptionSelections: structuredClone(character.classOptionSelections),
    speciesOptionSelections: structuredClone(character.speciesOptionSelections),
    equipmentChoiceIds: [...character.equipmentChoiceIds],
    spellChoiceIds: [...character.spellChoiceIds],
    advancement: structuredClone(character.advancement),
    status: 'draft',
    updatedAt: new Date().toISOString(),
  }
}

export function createUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `character-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

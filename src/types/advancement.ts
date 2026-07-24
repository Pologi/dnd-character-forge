import type { AbilityKey, AbilityValues, RulesSourceReference } from './character'

export type SupportedLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type AdvancementMode = 'experience' | 'milestone'
export type HitPointMethod = 'fixed' | 'roll'

export interface ClassLevelEntry {
  classId: string
  level: SupportedLevel
}

export interface HitPointLevelRecord {
  characterLevel: SupportedLevel
  classId: string
  hitDie: number
  method: HitPointMethod
  rawValue: number
  constitutionModifier: number
  gained: number
  retroactiveAdjustment: number
}

export interface ResourceTrackerDefinition {
  id: string
  nameIt: string
  nameEn: string
  maximum: number
  dieSize?: number
  recovery: 'short-rest' | 'long-rest' | 'partial' | 'special'
  source: RulesSourceReference
}

export interface LevelChoiceDefinition {
  id: string
  category: 'subclass' | 'feat' | 'ability-score' | 'proficiency' | 'weapon-mastery'
    | 'spell' | 'resource' | 'equipment' | 'other'
  label: string
  count: number
  optionIds: string[]
  required: boolean
  replacementAllowed?: boolean
  effects?: Record<string, {
    abilityChanges?: Partial<Record<AbilityKey, number>>
    featId?: string
    resourceChanges?: Record<string, number>
  }>
}

export interface SpellcastingLevelProgression {
  strategy: 'prepared' | 'known' | 'spellbook' | 'pact-magic' | 'half-caster' | 'special'
  cantrips: number
  preparedOrKnown: number
  maximumSpellLevel: number
  slots: number[]
  automaticSpellIds: string[]
  choices: LevelChoiceDefinition[]
}

export interface ClassLevelProgression {
  classId: string
  level: SupportedLevel
  proficiencyBonus: number
  fixedHitPointValue: number
  grantedFeatureIds: string[]
  requiredChoices: LevelChoiceDefinition[]
  resourceChanges: ResourceTrackerDefinition[]
  spellcastingProgression?: SpellcastingLevelProgression
  weaponMasteryCount?: number
  subclassRequired?: boolean
  source: RulesSourceReference
  complete: boolean
}

export interface AdvancementSnapshot {
  level: SupportedLevel
  experiencePoints: number
  classLevels: ClassLevelEntry[]
  baseAbilities: AbilityValues
  maxHitPoints: number
  currentHitPoints: number
  hitPointHistory: HitPointLevelRecord[]
  subclassIds: Record<string, string>
  featIds: string[]
  spellIds: string[]
  resources: Record<string, number>
}

export interface AdvancementHistoryEntry {
  id: string
  previousLevel: SupportedLevel
  newLevel: SupportedLevel
  advancedClassId: string
  previousExperience: number
  newExperience: number
  date: string
  hitPointsGained: number
  grantedFeatureIds: string[]
  choices: Record<string, string[]>
  spellsAdded: string[]
  spellsRemoved: string[]
  abilityChanges: Partial<Record<AbilityKey, number>>
  resourceChanges: Record<string, number>
  source: RulesSourceReference
  previousSnapshot: AdvancementSnapshot
  nextSnapshot: AdvancementSnapshot
}

export interface ExperienceChange {
  id: string
  amount: number
  previousTotal: number
  newTotal: number
  date: string
  note: string
}

export interface CharacterAdvancement {
  mode: AdvancementMode
  experiencePoints: number
  experienceHistory: ExperienceChange[]
  classLevels: ClassLevelEntry[]
  hitPointHistory: HitPointLevelRecord[]
  maxHitPoints: number
  currentHitPoints: number
  subclassIds: Record<string, string>
  featIds: string[]
  spellIds: string[]
  resources: Record<string, number>
  history: AdvancementHistoryEntry[]
  allowMulticlass: boolean
}

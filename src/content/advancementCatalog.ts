import type { ContentRegistry } from './contentRegistry'
import type { ClassLevelProgression, SupportedLevel } from '../types/advancement'

export function findClassProgression(
  registry: ContentRegistry,
  classId: string,
  level: SupportedLevel,
): ClassLevelProgression | null {
  const candidates = registry.selectable('progression-table').filter((item) =>
    item.origin === 'private-pack' && item.mechanics.classId === classId)
  for (const candidate of candidates) {
    const levels = Array.isArray(candidate.mechanics.levels) ? candidate.mechanics.levels : []
    const raw = levels.find((entry) => isRecord(entry) && entry.level === level)
    if (!isRecord(raw)) continue
    return {
      classId,
      level,
      proficiencyBonus: numberValue(raw.proficiencyBonus),
      fixedHitPointValue: numberValue(raw.fixedHitPointValue),
      grantedFeatureIds: stringArray(raw.grantedFeatureIds),
      requiredChoices: Array.isArray(raw.requiredChoices) ? raw.requiredChoices as ClassLevelProgression['requiredChoices'] : [],
      resourceChanges: Array.isArray(raw.resourceChanges) ? raw.resourceChanges as ClassLevelProgression['resourceChanges'] : [],
      spellcastingProgression: isRecord(raw.spellcastingProgression)
        ? raw.spellcastingProgression as unknown as ClassLevelProgression['spellcastingProgression']
        : undefined,
      weaponMasteryCount: typeof raw.weaponMasteryCount === 'number' ? raw.weaponMasteryCount : undefined,
      subclassRequired: raw.subclassRequired === true,
      source: {
        sourceId: candidate.privatePackItemId ?? candidate.id,
        sourceTitle: candidate.sourceTitle,
        sourceSection: `${candidate.nameIt}: livello ${level}`,
        sourcePage: candidate.page,
        license: 'Proprietario',
        ruleset: 'dnd-2024',
        isSrdContent: false,
        requiresOfficialBook: true,
      },
      complete: raw.complete === true,
    }
  }
  return null
}

export function unavailableProgressionMessage(className: string, level: number): string {
  return `Avanzamento bloccato: la progressione verificata di ${className} per il livello ${level} non è disponibile nello SRD incorporato. Importa un Pacchetto Manuale Privato completo e validato.`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}
function numberValue(value: unknown): number {
  return typeof value === 'number' ? value : 0
}

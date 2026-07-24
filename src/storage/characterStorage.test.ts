import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyDraft, type CharacterDraft } from '../types/character'
import {
  CHARACTERS_STORAGE_KEY,
  DRAFT_STORAGE_KEY,
  deleteCharacter,
  duplicateCharacter,
  exportCharacter,
  getCharacters,
  getDraft,
  importCharacter,
  saveCharacter,
  saveDraft,
  type StorageAdapter,
} from './characterStorage'

class MemoryStorage implements StorageAdapter {
  private data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }
}

function validDraft(name = 'Lyra'): CharacterDraft {
  return {
    ...createEmptyDraft('2026-01-10T12:00:00.000Z', `id-${name}`),
    name,
    playerName: 'Ada',
    initialIdea: 'Una cartografa delle terre perdute',
    classId: 'fighter',
    backgroundId: 'sage',
    speciesId: 'human',
    languages: ['common', 'elvish'],
    classSkillIds: ['Atletica', 'Percezione'],
    classOptionSelections: {
      'primary-ability': ['strength'],
      'fighting-style': ['style-difesa'],
      'weapon-mastery': ['weapon-spada-lunga', 'weapon-giavellotto', 'weapon-ascia'],
    },
    speciesOptionSelections: {
      size: ['media'],
      'human-skill': ['atletica'],
      'origin-feat': ['allerta'],
    },
    baseAbilities: {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    },
    equipmentChoiceIds: ['a'],
  }
}

describe('characterStorage schema v5', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('salva e recupera una bozza D&D 5e 2024', () => {
    const draft = validDraft()
    saveDraft(draft, storage)

    expect(getDraft(storage)).toMatchObject({
      id: draft.id,
      name: 'Lyra',
      ruleset: 'srd-5.2.1-it',
      status: 'draft',
      classSkillIds: ['Atletica', 'Percezione'],
      classOptionSelections: draft.classOptionSelections,
      speciesOptionSelections: draft.speciesOptionSelections,
    })
  })

  it('salva e legge i personaggi', () => {
    const saved = saveCharacter(validDraft(), storage)
    expect(saved.status).toBe('complete')
    expect(saved.ruleset).toBe('srd-5.2.1-it')
    expect(getCharacters(storage)).toEqual([saved])
  })

  it('duplica ed elimina un personaggio', () => {
    const original = saveCharacter(validDraft(), storage)
    const copy = duplicateCharacter(original.id, storage)
    expect(copy.id).not.toBe(original.id)
    expect(copy.name).toBe('Lyra Copia')

    expect(deleteCharacter(original.id, storage)).toEqual([copy])
  })

  it('esporta e importa un personaggio valido', () => {
    const sourceStorage = new MemoryStorage()
    const source = saveCharacter(validDraft(), sourceStorage)
    const exported = exportCharacter(source)
    const imported = importCharacter(exported, storage)

    expect(JSON.parse(exported)).toEqual({ ...source, officialBookSpeciesNotes: '' })
    expect(imported.id).not.toBe(source.id)
    expect(imported.ruleset).toBe('srd-5.2.1-it')
    expect(getCharacters(storage)).toEqual([imported])
  })

  it('mantiene locali le note dell’Aasimar durante l’esportazione', () => {
    const source = saveCharacter({
      ...validDraft(),
      speciesId: 'aasimar-phb-2024',
      speciesOptionSelections: {},
      officialBookSpeciesConfirmed: true,
      officialBookSpeciesNotes: 'Note dalla mia copia personale',
    }, storage)

    expect(JSON.parse(exportCharacter(source)).officialBookSpeciesNotes).toBe('')
    expect(getCharacters(storage)[0].officialBookSpeciesNotes).toBe('Note dalla mia copia personale')
  })

  it.each([
    ['testo non JSON', 'non-json'],
    ['struttura non valida', JSON.stringify({ name: 'Incompleto' })],
    ['regole non ammesse', JSON.stringify({ ...validDraft(), status: 'complete', ruleset: 'legacy' })],
  ])('rifiuta %s con un errore leggibile', (_case, input) => {
    expect(() => importCharacter(input, storage)).toThrow(/JSON valido|personaggio D&D 5e 2024 valido/)
  })

  it('recupera senza errori da dati corrotti nel localStorage', () => {
    storage.setItem(CHARACTERS_STORAGE_KEY, '{questo non è json')
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ status: 'draft', name: 42 }))

    expect(getCharacters(storage)).toEqual([])
    expect(getDraft(storage)).toBeNull()
  })

  it.each(['standard-array', 'random-roll', 'point-cost'] as const)('salva e ripristina il metodo %s', (method) => {
    const draft = validDraft()
    draft.abilityGeneration.method = method
    if (method === 'random-roll') {
      draft.abilityGeneration.diceRolls = [{
        id: 'roll-1', dice: [6, 5, 4, 1], droppedDieIndex: 3, total: 15,
        assignedAbility: 'strength', source: 'physical', createdAt: '2026-01-10T12:00:00.000Z',
      }]
    }
    if (method === 'point-cost') draft.abilityGeneration.pointCost.scores.strength = 15
    saveDraft(draft, storage)
    expect(getDraft(storage)?.abilityGeneration).toEqual(draft.abilityGeneration)
  })

  it('migra una bozza v3 conservando le caratteristiche assegnate', () => {
    const draft = validDraft()
    const { abilityGeneration: _removed, ...legacy } = draft
    storage.setItem('dnd-character-forge.draft.v3', JSON.stringify({ ...legacy, schemaVersion: 3 }))
    const migrated = getDraft(storage)
    expect(migrated?.schemaVersion).toBe(5)
    expect(migrated?.advancement.history).toEqual([])
    expect(migrated?.abilityGeneration.method).toBe('standard-array')
    expect(migrated?.abilityGeneration.standardArrayAssignments.strength).toBe(15)
  })
})

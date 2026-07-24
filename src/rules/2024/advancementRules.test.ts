import { describe, expect, it } from 'vitest'
import { createEmptyDraft, type Character } from '../../types/character'
import type { ClassLevelProgression, SupportedLevel } from '../../types/advancement'
import { saveCharacter } from '../../storage/characterStorage'
import {
  XP_THRESHOLDS,
  addExperience,
  applyAdvancement,
  constitutionRetroactiveAdjustment,
  derivedStatistics,
  hitPointGain,
  levelForExperience,
  proficiencyBonusForLevel,
  undoLastAdvancement,
  validateProgression,
} from './advancementRules'

describe('regole di avanzamento 1–10', () => {
  it('usa le soglie XP ufficiali e non aumenta automaticamente il livello', () => {
    expect(Object.values(XP_THRESHOLDS)).toEqual([0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000])
    expect(levelForExperience(6500)).toBe(5)
    const next = addExperience(character(), 6500)
    expect(next.level).toBe(1)
    expect(next.advancement.experiencePoints).toBe(6500)
  })

  it.each([
    [1, 2], [4, 2], [5, 3], [8, 3], [9, 4], [10, 4],
  ])('calcola il bonus di competenza al livello %s', (level, expected) => {
    expect(proficiencyBonusForLevel(level)).toBe(expected)
  })

  it('applica atomicamente un avanzamento singolo con PF fissi e cronologia', () => {
    const before = character()
    const next = advance(before, progression(2))
    expect(next.level).toBe(2)
    expect(next.advancement.maxHitPoints).toBe(before.advancement.maxHitPoints + 8)
    expect(next.advancement.history).toHaveLength(1)
    expect(before.level).toBe(1)
  })

  it('esegue avanzamenti multipli soltanto in sequenza', () => {
    const level2 = advance(character(), progression(2))
    const level3 = advance(level2, progression(3))
    expect(level3.level).toBe(3)
    expect(level3.advancement.history.map((entry) => entry.newLevel)).toEqual([2, 3])
    expect(() => advance(character(), progression(3))).toThrow(/livello della progressione/)
  })

  it('calcola PF con valore fisso e tiro, applicando il minimo 1', () => {
    expect(hitPointGain(progression(2), 10, 2, 'fixed')).toEqual({ rawValue: 6, gained: 8 })
    expect(hitPointGain(progression(2), 10, 2, 'roll', 7)).toEqual({ rawValue: 7, gained: 9 })
    expect(hitPointGain(progression(2), 10, -5, 'roll', 1).gained).toBe(1)
    expect(() => hitPointGain(progression(2), 10, 0, 'roll', 11)).toThrow()
  })

  it('calcola il ricalcolo retroattivo della Costituzione', () => {
    expect(constitutionRetroactiveAdjustment(17, 18, 8)).toBe(8)
    expect(constitutionRetroactiveAdjustment(18, 16, 8)).toBe(-8)
  })

  it('blocca sottoclasse, talento o altra scelta obbligatoria mancante', () => {
    const data = progression(2, [{
      id: 'subclass', category: 'subclass', label: 'Sottoclasse', count: 1,
      optionIds: ['champion'], required: true,
    }])
    expect(() => advance(character(), data)).toThrow(/Scelta mancante/)
    expect(advance(character(), data, { subclass: ['champion'] }).level).toBe(2)
  })

  it('applica sottoclasse, talento e aumento di caratteristica dai dati strutturati', () => {
    const data = progression(2, [{
      id: 'advancement', category: 'feat', label: 'Talento', count: 1,
      optionIds: ['feat:test'], required: true,
      effects: { 'feat:test': { featId: 'feat:test', abilityChanges: { constitution: 2 } } },
    }])
    data.subclassRequired = true
    const next = advance(character(), data, { advancement: ['feat:test'], subclass: ['subclass:test'] })
    expect(next.advancement.subclassIds.fighter).toBe('subclass:test')
    expect(next.advancement.featIds).toContain('feat:test')
    expect(next.baseAbilities.constitution).toBe(16)
    expect(next.advancement.hitPointHistory.at(-1)?.retroactiveAdjustment).toBe(2)
  })

  it('applica risorse e incantesimi provenienti dalla progressione', () => {
    const data = progression(2)
    data.resourceChanges = [{
      id: 'test-resource', nameIt: 'Risorsa test', nameEn: 'Test Resource',
      maximum: 3, recovery: 'long-rest', source: source(),
    }]
    data.spellcastingProgression = {
      strategy: 'prepared', cantrips: 2, preparedOrKnown: 3, maximumSpellLevel: 1,
      slots: [2], automaticSpellIds: ['spell:auto'], choices: [],
    }
    const next = advance(character(), data)
    expect(next.advancement.resources['test-resource']).toBe(3)
    expect(next.advancement.spellIds).toContain('spell:auto')
  })

  it('annulla esattamente l’ultimo livello tramite snapshot', () => {
    const original = character()
    const advanced = advance(original, progression(2))
    const restored = undoLastAdvancement(advanced)
    expect(restored.level).toBe(original.level)
    expect(restored.advancement.maxHitPoints).toBe(original.advancement.maxHitPoints)
    expect(restored.advancement.history).toHaveLength(0)
  })

  it('non applica modifiche parziali quando la progressione è invalida', () => {
    const original = character()
    const invalid = progression(2)
    invalid.complete = false
    expect(() => advance(original, invalid)).toThrow()
    expect(original.level).toBe(1)
    expect(original.advancement.history).toHaveLength(0)
  })

  it('blocca multiclasse disattivata e livello massimo 10', () => {
    expect(() => applyAdvancement({
      character: character(), progression: { ...progression(2), classId: 'wizard' },
      classId: 'wizard', hitDie: 6, hitPointMethod: 'fixed', choices: {},
    })).toThrow(/multiclasse/)
    const maximum = character()
    maximum.level = 10
    expect(() => advance(maximum, progression(10))).toThrow(/massimo/)
  })

  it('ricalcola statistiche derivate e competenza', () => {
    const value = character()
    value.baseAbilities.dexterity = 14
    value.baseAbilities.wisdom = 16
    value.classSkillIds = ['Percezione']
    expect(derivedStatistics(value)).toMatchObject({ initiative: 2, passivePerception: 15, proficiencyBonus: 2 })
  })

  it('rifiuta progressioni senza fonte, pagina o dati completi', () => {
    const invalid = progression(2)
    invalid.source.sourcePage = undefined
    expect(validateProgression(invalid, 'fighter', 2)).toContain('Fonte o pagina ufficiale mancante.')
  })
})

function character(): Character {
  const draft = createEmptyDraft('2026-07-24T10:00:00.000Z', 'test-character')
  draft.name = 'Aria'
  draft.classId = 'fighter'
  draft.baseAbilities.constitution = 14
  return saveCharacter(draft, null)
}

function progression(level: SupportedLevel, requiredChoices: ClassLevelProgression['requiredChoices'] = []): ClassLevelProgression {
  return {
    classId: 'fighter', level, proficiencyBonus: proficiencyBonusForLevel(level),
    fixedHitPointValue: 6, grantedFeatureIds: [`fixture:feature-${level}`], requiredChoices,
    resourceChanges: [], source: source(), complete: true,
  }
}

function source() {
  return {
    sourceId: 'fixture', sourceTitle: 'Fixture di test', sourceSection: 'Progressione',
    sourcePage: 1, license: 'CC-BY-4.0' as const, ruleset: 'test',
    isSrdContent: true, requiresOfficialBook: false,
  }
}

function advance(value: Character, data: ClassLevelProgression, choices: Record<string, string[]> = {}) {
  return applyAdvancement({
    character: value, progression: data, classId: 'fighter', hitDie: 10,
    hitPointMethod: 'fixed', choices, now: '2026-07-24T11:00:00.000Z',
  })
}

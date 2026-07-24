import { describe, expect, it } from 'vitest'
import { PHB_AASIMAR_PRESENTATION, classOptions, speciesOptions } from './catalog'
import { ContentRegistry } from '../../content/contentRegistry'
import { findClassProgression } from '../../content/advancementCatalog'

describe('catalogo ufficiale SRD 5.2.1 italiano', () => {
  it('contiene esattamente le 12 classi base e non l’Artificiere', () => {
    expect(classOptions.map((item) => item.nameIt)).toEqual([
      'Barbaro', 'Bardo', 'Chierico', 'Druido', 'Guerriero', 'Ladro',
      'Mago', 'Monaco', 'Paladino', 'Ranger', 'Stregone', 'Warlock',
    ])
    expect(classOptions.some((item) => item.nameIt === 'Artificiere')).toBe(false)
  })

  it('mostra nove specie SRD più Aasimar non SRD', () => {
    expect(speciesOptions).toHaveLength(9)
    expect([...speciesOptions.map((item) => item.nameIt), PHB_AASIMAR_PRESENTATION.nameIt]).toHaveLength(10)
    expect(speciesOptions.every((item) => item.source.isSrdContent)).toBe(true)
    expect(PHB_AASIMAR_PRESENTATION.source).toMatchObject({
      sourceId: 'phb-2024',
      isSrdContent: false,
      requiresOfficialBook: true,
    })
  })

  it('non assegna aumenti di caratteristica dalle specie', () => {
    expect(speciesOptions.every((item) => item.abilityScoreIncreases.length === 0)).toBe(true)
  })

  it('fornisce dado vita, tiri salvezza, abilità e fonte per ogni classe', () => {
    for (const item of classOptions) {
      expect([6, 8, 10, 12]).toContain(item.hitDie)
      expect(item.savingThrows).toHaveLength(2)
      expect(item.skillChoiceCount).toBeGreaterThan(0)
      expect(item.skillChoices.length).toBeGreaterThanOrEqual(item.skillChoiceCount)
      expect(item.source).toMatchObject({
        sourceId: 'srd-5.2.1-it',
        license: 'CC-BY-4.0',
        isSrdContent: true,
      })
      expect(item.source.sourcePage).toBeTypeOf('number')
    }
  })

  it('mostra Incantesimi solo per le classi che li hanno al livello 1', () => {
    const casters = classOptions.filter((item) => item.hasLevelOneSpells).map((item) => item.nameIt)
    expect(casters).toEqual(['Bardo', 'Chierico', 'Druido', 'Mago', 'Paladino', 'Ranger', 'Stregone', 'Warlock'])
    expect(classOptions.filter((item) => !item.hasLevelOneSpells).map((item) => item.nameIt))
      .toEqual(['Barbaro', 'Guerriero', 'Ladro', 'Monaco'])
  })

  it('modella le scelte obbligatorie di lignaggio e non contiene dati demo', () => {
    expect(speciesOptions.find((item) => item.id === 'dragonborn')?.requiredChoices.some((choice) => choice.id === 'draconic-ancestry')).toBe(true)
    expect(speciesOptions.find((item) => item.id === 'elf')?.requiredChoices.some((choice) => choice.id === 'elven-lineage')).toBe(true)
    expect(speciesOptions.find((item) => item.id === 'gnome')?.requiredChoices.some((choice) => choice.id === 'gnomish-lineage')).toBe(true)
    expect(speciesOptions.find((item) => item.id === 'goliath')?.requiredChoices.some((choice) => choice.id === 'giant-ancestry')).toBe(true)
    expect(speciesOptions.find((item) => item.id === 'tiefling')?.requiredChoices.some((choice) => choice.id === 'fiendish-legacy')).toBe(true)
    expect([...classOptions, ...speciesOptions].map((item) => `${item.id} ${item.nameIt} ${item.shortDescription}`).join(' ')).not.toMatch(/demo|dimostrativ/i)
  })

  it('non dichiara disponibili progressioni 2–10 non presenti nel catalogo SRD', () => {
    const registry = new ContentRegistry()
    for (const characterClass of classOptions) {
      for (let level = 2; level <= 10; level += 1) {
        expect(findClassProgression(registry, characterClass.id, level as 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)).toBeNull()
      }
    }
  })
})

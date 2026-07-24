import { beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { ContentRegistry } from './contentRegistry'
import { validatePrivatePack } from './privatePackSchema'
import {
  IndexedDbPrivatePackStore,
  checkStoredPackIntegrity,
  importPrivatePack,
} from './privatePackStorage'
import type { PrivateContentPack } from '../types/privateContent'

describe('pacchetto manuale privato', () => {
  const store = new IndexedDbPrivatePackStore()

  beforeEach(async () => {
    await store.remove()
  })

  it('importa, persiste e rimuove un pacchetto valido senza richieste di rete', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const imported = await importPrivatePack(JSON.stringify(validPack()), store)
    expect(imported.pack.format).toBe('phb-2024-private-pack')
    expect((await checkStoredPackIntegrity(store))?.pack.packId).toBe('manuale-privato-test')
    expect(fetchSpy).not.toHaveBeenCalled()

    await store.remove()
    expect(await store.get()).toBeNull()
    fetchSpy.mockRestore()
  })

  it('rifiuta pacchetti non validi e schema non supportato', () => {
    const invalid = validPack()
    invalid.items[0].officialNameEn = ''
    expect(validatePrivatePack(invalid).valid).toBe(false)

    const unsupported = { ...validPack(), schemaVersion: 99 }
    expect(validatePrivatePack(unsupported).issues.some((issue) => issue.code === 'unsupported-schema')).toBe(true)
  })

  it('rileva ID duplicati e non attiva contenuti incompleti', () => {
    const duplicate = validPack()
    duplicate.items.push(structuredClone(duplicate.items[0]))
    expect(validatePrivatePack(duplicate).issues.some((issue) => issue.code === 'duplicate-id')).toBe(true)

    const incomplete = validPack()
    incomplete.items[0].active = false
    incomplete.items[0].verificationStatus = 'incomplete'
    const registry = new ContentRegistry({
      pack: incomplete,
      importedAt: new Date().toISOString(),
      validation: validatePrivatePack(incomplete),
    })
    expect(registry.hasPrivateContent('species', 'aasimar-phb-2024')).toBe(false)
  })

  it('unisce SRD e contenuti privati senza sovrascrivere i conflitti', () => {
    const pack = validPack()
    const registry = new ContentRegistry({
      pack,
      importedAt: new Date().toISOString(),
      validation: validatePrivatePack(pack),
    })
    expect(registry.find('class', 'fighter')?.origin).toBe('srd-5.2.1-it')
    expect(registry.hasPrivateContent('species', 'aasimar-phb-2024')).toBe(true)
    expect(registry.builderSpecies().some((item) => item.id === 'aasimar-phb-2024')).toBe(true)

    pack.items[0].id = 'human'
    pack.items[0].mechanics.builderData = { ...pack.items[0].mechanics.builderData as object, id: 'human' }
    const conflictRegistry = new ContentRegistry({
      pack,
      importedAt: new Date().toISOString(),
      validation: validatePrivatePack(pack),
    })
    expect(conflictRegistry.conflicts()).toHaveLength(1)
    expect(conflictRegistry.find('species', 'human')?.origin).toBe('srd-5.2.1-it')
  })

  it('mantiene l’opzione bloccata senza pacchetto e la abilita dopo l’importazione', () => {
    expect(new ContentRegistry().hasPrivateContent('species', 'aasimar-phb-2024')).toBe(false)
    const pack = validPack()
    const installed = new ContentRegistry({
      pack,
      importedAt: new Date().toISOString(),
      validation: validatePrivatePack(pack),
    })
    expect(installed.hasPrivateContent('species', 'aasimar-phb-2024')).toBe(true)
  })
})

export function validPack(): PrivateContentPack {
  const source = {
    sourceId: 'phb-2024',
    sourceTitle: 'Manuale del Giocatore 2024',
    sourceSection: 'Specie: Aasimar',
    sourcePage: 186,
    license: 'Proprietario' as const,
    ruleset: 'dnd-2024',
    isSrdContent: false,
    requiresOfficialBook: true,
  }
  return {
    format: 'phb-2024-private-pack',
    schemaVersion: 1,
    packId: 'manuale-privato-test',
    title: 'Manuale privato di test',
    importedFrom: 'user-owned-manual',
    createdAt: '2026-07-24T10:00:00.000Z',
    items: [{
      id: 'aasimar-phb-2024',
      category: 'species',
      officialNameIt: 'Aasimar',
      officialNameEn: 'Aasimar',
      source: { manual: 'Manuale del Giocatore 2024', edition: '2024', italianPage: 186, englishPage: 189 },
      mechanics: {
        builderData: {
          id: 'aasimar-phb-2024',
          nameIt: 'Aasimar',
          shortDescription: 'Descrizione privata verificata.',
          source,
          requiredChoices: [],
          icon: '✧',
          creatureType: 'Umanoide',
          size: 'Media o Piccola',
          speedMeters: 9,
          darkvisionMeters: 18,
          resistances: [],
          proficiencies: [],
          traits: [],
          speciesSpells: [],
          complexity: 'media',
          abilityScoreIncreases: [],
        },
      },
      shortExplanation: 'Definizione strutturata privata.',
      verificationStatus: 'verified',
      verifiedAt: '2026-07-24T10:00:00.000Z',
      active: true,
    }],
  }
}

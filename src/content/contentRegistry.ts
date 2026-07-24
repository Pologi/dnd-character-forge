import { backgroundOptions, classOptions, speciesOptions } from '../data/srd-5.2.1-it/catalog'
import type {
  ContentConflict,
  ContentRegistrySnapshot,
  PrivateContentCategory,
  RegistryContentItem,
  StoredPrivatePack,
} from '../types/privateContent'
import type { Background, CharacterClass, Species } from '../types/character'

const classEnglish: Record<string, string> = {
  barbarian: 'Barbarian', bard: 'Bard', cleric: 'Cleric', druid: 'Druid',
  fighter: 'Fighter', rogue: 'Rogue', wizard: 'Wizard', monk: 'Monk',
  paladin: 'Paladin', ranger: 'Ranger', sorcerer: 'Sorcerer', warlock: 'Warlock',
}
const speciesEnglish: Record<string, string> = {
  dragonborn: 'Dragonborn', dwarf: 'Dwarf', elf: 'Elf', gnome: 'Gnome', goliath: 'Goliath',
  halfling: 'Halfling', human: 'Human', orc: 'Orc', tiefling: 'Tiefling',
}
const backgroundEnglish: Record<string, string> = {
  acolyte: 'Acolyte', criminal: 'Criminal', sage: 'Sage', soldier: 'Soldier',
}
const featureEnglish: Record<string, string> = {
  rage: 'Rage',
  'unarmored-defense': 'Unarmored Defense',
  'weapon-mastery': 'Weapon Mastery',
  spellcasting: 'Spellcasting',
  'bardic-inspiration': 'Bardic Inspiration',
  'divine-order': 'Divine Order',
  druidic: 'Druidic',
  'primal-order': 'Primal Order',
  'fighting-style': 'Fighting Style',
  'second-wind': 'Second Wind',
  expertise: 'Expertise',
  'sneak-attack': 'Sneak Attack',
  'thieves-cant': 'Thieves’ Cant',
  'ritual-adept': 'Ritual Adept',
  'arcane-recovery': 'Arcane Recovery',
  'martial-arts': 'Martial Arts',
  'lay-on-hands': 'Lay On Hands',
  'favored-enemy': 'Favored Enemy',
  'innate-sorcery': 'Innate Sorcery',
  'eldritch-invocations': 'Eldritch Invocations',
  'pact-magic': 'Pact Magic',
}

export class ContentRegistry {
  private readonly snapshot: ContentRegistrySnapshot

  constructor(privatePack: StoredPrivatePack | null = null) {
    this.snapshot = buildSnapshot(privatePack)
  }

  all(): RegistryContentItem[] {
    return [...this.snapshot.items]
  }

  byCategory(category: PrivateContentCategory): RegistryContentItem[] {
    return this.snapshot.items.filter((item) => item.category === category)
  }

  selectable(category: PrivateContentCategory): RegistryContentItem[] {
    return this.byCategory(category).filter((item) => item.selectable)
  }

  find(category: PrivateContentCategory, id: string): RegistryContentItem | undefined {
    return this.byCategory(category).find((item) => item.id === id)
  }

  conflicts(): ContentConflict[] {
    return [...this.snapshot.conflicts]
  }

  incomplete(): RegistryContentItem[] {
    return [...this.snapshot.incomplete]
  }

  hasPrivateContent(category: PrivateContentCategory, id: string): boolean {
    return this.snapshot.items.some((item) => item.category === category && item.id === id && item.origin === 'private-pack' && item.selectable)
  }

  builderClasses(): CharacterClass[] {
    return [...classOptions, ...this.privateBuilderItems<CharacterClass>('class')]
  }

  builderSpecies(): Species[] {
    return [...speciesOptions, ...this.privateBuilderItems<Species>('species')]
  }

  builderBackgrounds(): Background[] {
    return [...backgroundOptions, ...this.privateBuilderItems<Background>('background')]
  }

  private privateBuilderItems<T>(category: 'class' | 'species' | 'background'): T[] {
    return this.selectable(category)
      .filter((item) => item.origin === 'private-pack')
      .map((item) => item.mechanics.builderData)
      .filter((value): value is T => typeof value === 'object' && value !== null)
  }
}

function buildSnapshot(stored: StoredPrivatePack | null): ContentRegistrySnapshot {
  const official = officialItems()
  const items = [...official]
  const conflicts: ContentConflict[] = []
  if (stored) {
    for (const privateItem of stored.pack.items) {
      const identityIndex = items.findIndex((item) => item.category === privateItem.category && item.id === privateItem.id)
      if (identityIndex >= 0) {
        conflicts.push({
          category: privateItem.category,
          id: privateItem.id,
          message: `Il contenuto privato "${privateItem.id}" entra in conflitto con un contenuto già registrato e non è stato applicato.`,
        })
        continue
      }
      const extension = privateItem.extendsSrdId
        ? official.find((item) => item.category === privateItem.category && item.id === privateItem.extendsSrdId)
        : undefined
      const hasBuilderData = !['class', 'species', 'background'].includes(privateItem.category)
        || isBuilderDefinition(privateItem.mechanics.builderData)
      items.push({
        id: privateItem.id,
        category: privateItem.category,
        nameIt: privateItem.officialNameIt,
        nameEn: privateItem.officialNameEn,
        sourceTitle: privateItem.source.manual,
        page: privateItem.source.italianPage,
        edition: privateItem.source.edition,
        origin: 'private-pack',
        verificationStatus: privateItem.verificationStatus,
        mechanics: extension ? { ...extension.mechanics, ...privateItem.mechanics } : structuredClone(privateItem.mechanics),
        selectable: privateItem.active && privateItem.verificationStatus === 'verified' && hasBuilderData,
        privatePackItemId: privateItem.id,
      })
    }
  }
  return { items, conflicts, incomplete: items.filter((item) => !item.selectable) }
}

function isBuilderDefinition(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
    && typeof (value as Record<string, unknown>).id === 'string'
    && typeof (value as Record<string, unknown>).nameIt === 'string'
    && typeof (value as Record<string, unknown>).source === 'object'
    && Array.isArray((value as Record<string, unknown>).requiredChoices)
}

function officialItems(): RegistryContentItem[] {
  const classes = classOptions.map((item): RegistryContentItem => ({
    id: item.id, category: 'class', nameIt: item.nameIt, nameEn: classEnglish[item.id],
    sourceTitle: item.source.sourceTitle, page: item.source.sourcePage, edition: '2024',
    origin: 'srd-5.2.1-it', verificationStatus: 'verified', mechanics: structuredClone(item) as unknown as Record<string, unknown>, selectable: true,
  }))
  const species = speciesOptions.map((item): RegistryContentItem => ({
    id: item.id, category: 'species', nameIt: item.nameIt, nameEn: speciesEnglish[item.id],
    sourceTitle: item.source.sourceTitle, page: item.source.sourcePage, edition: '2024',
    origin: 'srd-5.2.1-it', verificationStatus: 'verified', mechanics: structuredClone(item) as unknown as Record<string, unknown>, selectable: true,
  }))
  const backgrounds = backgroundOptions.map((item): RegistryContentItem => ({
    id: item.id, category: 'background', nameIt: item.nameIt, nameEn: backgroundEnglish[item.id],
    sourceTitle: item.source.sourceTitle, page: item.source.sourcePage, edition: '2024',
    origin: 'srd-5.2.1-it', verificationStatus: 'verified', mechanics: structuredClone(item) as unknown as Record<string, unknown>, selectable: true,
  }))
  const features = classOptions.flatMap((characterClass) => characterClass.levelOneFeatures.map((feature): RegistryContentItem => ({
    id: `${characterClass.id}:${feature.id}`, category: 'feature', nameIt: feature.nameIt,
    nameEn: featureEnglish[feature.id], sourceTitle: characterClass.source.sourceTitle, page: characterClass.source.sourcePage,
    edition: '2024', origin: 'srd-5.2.1-it', verificationStatus: 'verified',
    mechanics: { ...feature, classId: characterClass.id }, selectable: true,
  })))
  return [...classes, ...species, ...backgrounds, ...features]
}

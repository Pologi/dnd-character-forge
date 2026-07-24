import type { RegistryContentItem } from '../types/privateContent'

export type OfficialTermReference = Omit<RegistryContentItem, 'category'> & { category: string }

const terms = [
  ['class', 'Classe', 'Class'],
  ['subclass', 'Sottoclasse', 'Subclass'],
  ['species', 'Specie', 'Species'],
  ['background', 'Background', 'Background'],
  ['feat', 'Talento', 'Feat'],
  ['spell', 'Incantesimo', 'Spell'],
  ['feature', 'Capacità', 'Feature'],
  ['ability', 'Caratteristica', 'Ability'],
  ['skill', 'Abilità', 'Skill'],
  ['proficiency', 'Competenza', 'Proficiency'],
  ['weapon', 'Arma', 'Weapon'],
  ['armor', 'Armatura', 'Armor'],
  ['tool', 'Strumento', 'Tool'],
  ['language', 'Linguaggio', 'Language'],
  ['weapon-mastery', 'Maestria delle Armi', 'Weapon Mastery'],
  ['weapon-property', 'Proprietà', 'Property'],
  ['condition', 'Condizione', 'Condition'],
] as const

export const officialTermCatalog: OfficialTermReference[] = terms.map(([category, nameIt, nameEn]) => ({
  id: `term:${category}`,
  category,
  nameIt,
  nameEn,
  sourceTitle: 'SRD 5.2.1',
  edition: '2024',
  origin: 'srd-5.2.1-it',
  verificationStatus: 'verified',
  mechanics: {},
  selectable: false,
}))

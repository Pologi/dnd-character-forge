export const PRIVATE_PACK_FORMAT = 'phb-2024-private-pack' as const
export const PRIVATE_PACK_SCHEMA_VERSION = 1

export const PRIVATE_CONTENT_CATEGORIES = [
  'class', 'subclass', 'species', 'background', 'feat', 'spell', 'feature',
  'weapon', 'armor', 'equipment', 'tool', 'language', 'weapon-property',
  'weapon-mastery', 'progression-table', 'required-choice',
  'resource', 'subclass-progression', 'multiclass-rule',
] as const

export type PrivateContentCategory = (typeof PRIVATE_CONTENT_CATEGORIES)[number]
export type VerificationStatus = 'verified' | 'transcribed' | 'incomplete' | 'unverified'

export interface PrivateContentSource {
  manual: string
  edition: '2024'
  italianPage: number
  englishPage?: number
}

export interface PrivateContentItem {
  id: string
  category: PrivateContentCategory
  officialNameIt: string
  officialNameEn: string
  source: PrivateContentSource
  mechanics: Record<string, unknown>
  shortExplanation?: string
  verificationStatus: VerificationStatus
  verifiedAt: string
  active: boolean
  extendsSrdId?: string
}

export interface PrivateContentPack {
  format: typeof PRIVATE_PACK_FORMAT
  schemaVersion: typeof PRIVATE_PACK_SCHEMA_VERSION
  packId: string
  title: string
  importedFrom: 'user-owned-manual'
  createdAt: string
  items: PrivateContentItem[]
}

export interface PackValidationIssue {
  code: string
  message: string
  itemId?: string
  severity: 'error' | 'warning'
}

export interface PackValidationResult {
  valid: boolean
  issues: PackValidationIssue[]
  counts: Record<PrivateContentCategory, number>
}

export interface StoredPrivatePack {
  pack: PrivateContentPack
  importedAt: string
  validation: PackValidationResult
}

export type ContentOrigin = 'srd-5.2.1-it' | 'srd-5.2.1-en' | 'private-pack'

export interface RegistryContentItem {
  id: string
  category: PrivateContentCategory
  nameIt: string
  nameEn: string
  sourceTitle: string
  page?: number
  edition: string
  origin: ContentOrigin
  verificationStatus: VerificationStatus
  mechanics: Record<string, unknown>
  selectable: boolean
  privatePackItemId?: string
}

export interface ContentConflict {
  category: PrivateContentCategory
  id: string
  message: string
}

export interface ContentRegistrySnapshot {
  items: RegistryContentItem[]
  conflicts: ContentConflict[]
  incomplete: RegistryContentItem[]
}

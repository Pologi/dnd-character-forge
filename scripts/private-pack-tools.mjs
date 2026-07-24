import { readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

export const PRIVATE_ROOT = resolve('private-content/phb-2024')
export const OUTPUT_FILE = resolve('private-content/phb-2024.private-pack.json')
export const CLASS_IDS = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'rogue', 'wizard', 'monk', 'paladin', 'ranger', 'sorcerer', 'warlock']
export const EDITOR_BUILD_MARKER = 'PRIVATE_PACK_EDITOR_DEVELOPMENT_ONLY'

const allowedCategories = new Set([
  'class', 'subclass', 'species', 'background', 'feat', 'spell', 'feature',
  'weapon', 'armor', 'equipment', 'tool', 'language', 'weapon-property',
  'weapon-mastery', 'progression-table', 'required-choice', 'resource',
  'subclass-progression', 'multiclass-rule',
])
const placeholder = /\b(?:placeholder|segnaposto|todo|tbd|da definire)\b/i

export function parseDelimited(text, delimiter = ',') {
  const rows = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim()).map((line) => splitRow(line, delimiter))
  if (rows.length < 2) return []
  const headers = rows[0].map((value) => value.trim())
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, parseCell(values[index] ?? '')])))
}

export function parseImport(text, format) {
  if (format === 'json') {
    const value = JSON.parse(text)
    return Array.isArray(value) ? value : [value]
  }
  return parseDelimited(text, format === 'tsv' ? '\t' : ',')
}

export function analyzeItems(items, existing = []) {
  const issues = []
  const identities = new Set()
  const namesIt = new Map()
  const namesEn = new Map()
  const allIds = new Set([...existing, ...items].filter(record).map((item) => `${item.category}:${item.id}`))
  items.forEach((item, index) => {
    if (!record(item)) { issues.push(issue('invalid-item', index)); return }
    const identity = `${item.category}:${item.id}`
    if (!text(item.id)) issues.push(issue('missing-id', index))
    if (!allowedCategories.has(item.category)) issues.push(issue('invalid-category', index))
    if (identities.has(identity)) issues.push(issue('duplicate-id', index))
    identities.add(identity)
    checkDuplicateName(namesIt, item.officialNameIt, index, 'duplicate-name-it', issues)
    checkDuplicateName(namesEn, item.officialNameEn, index, 'duplicate-name-en', issues)
    if (!text(item.officialNameIt)) issues.push(issue('missing-name-it', index))
    if (!text(item.officialNameEn)) issues.push(issue('missing-name-en', index))
    if (!record(item.source) || item.source.manual !== 'Manuale del Giocatore 2024'
      || !Number.isInteger(item.source.italianPage) || item.source.italianPage < 1 || !text(item.source.section)) issues.push(issue('invalid-source', index))
    if (!record(item.mechanics) || Object.keys(item.mechanics).length === 0) issues.push(issue('missing-mechanics', index))
    if (!validDate(item.verifiedAt)) issues.push(issue('invalid-verification-date', index))
    if (item.verificationStatus === 'verified' && (!record(item.source) || !item.source.italianPage || !text(item.officialNameEn) || !record(item.mechanics))) {
      issues.push(issue('cannot-verify', index))
    }
    if (placeholder.test(JSON.stringify(item))) issues.push(issue('placeholder', index))
    for (const reference of references(item)) if (!allIds.has(reference) && !reference.startsWith('srd:')) issues.push(issue('unresolved-reference', index, reference))
    validateSpecialized(item, index, issues)
  })
  return {
    valid: issues.length === 0,
    issues,
    recognizedFields: [...new Set(items.filter(record).flatMap((item) => Object.keys(item)))],
    missingFields: requiredFields.filter((field) => items.some((item) => !fieldValue(item, field))),
    replacements: items.filter((item) => existing.some((current) => current.category === item.category && current.id === item.id)).map((item) => `${item.category}:${item.id}`),
  }
}

export function coverageReport(items) {
  const verified = items.filter((item) => item.verificationStatus === 'verified')
  const tables = items.filter((item) => item.category === 'progression-table')
  const classCoverage = Object.fromEntries(CLASS_IDS.map((classId) => {
    const table = tables.find((item) => item.mechanics?.classId === classId)
    const levels = Array.isArray(table?.mechanics?.levels) ? table.mechanics.levels : []
    return [classId, Array.from({ length: 10 }, (_, index) => {
      const row = levels.find((level) => level?.level === index + 1)
      if (!row) return 'missing'
      if (row.complete === true && row.verificationStatus === 'verified') return 'ready'
      if (row.verificationStatus === 'verified') return 'verified'
      if (row.verificationStatus === 'transcribed') return 'transcribed'
      return 'incomplete'
    })]
  }))
  const counts = {}
  for (const category of allowedCategories) counts[category] = items.filter((item) => item.category === category).length
  return {
    classCoverage,
    completeClasses: Object.values(classCoverage).filter((levels) => levels.every((status) => status === 'ready')).length,
    completeSubclasses: items.filter((item) => item.category === 'subclass-progression' && item.mechanics?.completeThroughLevel10 === true && item.verificationStatus === 'verified').length,
    counts,
    verified: verified.length,
    incomplete: items.length - verified.length,
    unresolvedReferences: analyzeItems(items).issues.filter((entry) => entry.code === 'unresolved-reference').length,
  }
}

export async function readPrivateSource(root = PRIVATE_ROOT) {
  const files = await walk(root)
  const metadataPath = files.find((path) => relative(root, path).replaceAll('\\', '/') === 'metadata.json')
  if (!metadataPath) throw new Error('metadata.json mancante.')
  const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
  const items = []
  for (const file of files.filter((path) => path !== metadataPath && path.endsWith('.json'))) {
    const value = JSON.parse(await readFile(file, 'utf8'))
    if (Array.isArray(value)) items.push(...value)
    else items.push(value)
  }
  return { metadata, items }
}

export async function buildPrivatePack(root = PRIVATE_ROOT, output = OUTPUT_FILE) {
  const { metadata, items } = await readPrivateSource(root)
  const analysis = analyzeItems(items)
  if (!analysis.valid) throw new Error(`Generazione bloccata: ${analysis.issues.length} errori.`)
  const pack = {
    format: 'phb-2024-private-pack', schemaVersion: 1,
    packId: metadata.packId, title: metadata.title,
    importedFrom: 'user-owned-manual', createdAt: new Date().toISOString(), items,
  }
  await writeFile(output, `${JSON.stringify(pack, null, 2)}\n`, 'utf8')
  return { output, coverage: coverageReport(items), itemCount: items.length }
}

function validateSpecialized(item, index, issues) {
  if (item.category === 'progression-table') {
    const levels = item.mechanics?.levels
    if (!Array.isArray(levels) || levels.length < 10 || levels.slice(0, 10).some((row, rowIndex) => row?.level !== rowIndex + 1)) issues.push(issue('invalid-class-progression', index))
  }
  if (item.category === 'subclass' && (!text(item.mechanics?.classId) || !CLASS_IDS.includes(item.mechanics.classId))) issues.push(issue('missing-subclass-class', index))
  if (item.category === 'spell') {
    const required = ['level', 'school', 'castingTime', 'range', 'components', 'duration', 'concentration', 'ritual', 'classListIds', 'description']
    if (required.some((key) => item.mechanics?.[key] === undefined || item.mechanics?.[key] === '')) issues.push(issue('incomplete-spell', index))
  }
}
function references(item) {
  const result = []
  const keys = ['featureIds', 'grantedFeatureIds', 'spellIds', 'automaticSpellIds', 'optionIds']
  const visit = (value) => {
    if (Array.isArray(value)) value.forEach(visit)
    else if (record(value)) for (const [key, nested] of Object.entries(value)) {
      if (keys.includes(key) && Array.isArray(nested)) result.push(...nested.filter((entry) => typeof entry === 'string'))
      else visit(nested)
    }
  }
  visit(item.mechanics)
  return result
}
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  }))
  return nested.flat()
}
function splitRow(line, delimiter) {
  const values = []; let value = ''; let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1 } else quoted = !quoted
    } else if (char === delimiter && !quoted) { values.push(value); value = '' } else value += char
  }
  values.push(value); return values
}
function parseCell(value) {
  const trimmed = value.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed)
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try { return JSON.parse(trimmed) } catch { return trimmed }
  }
  return trimmed
}
function checkDuplicateName(map, value, index, code, issues) {
  if (!text(value)) return
  const key = value.trim().toLocaleLowerCase()
  if (map.has(key)) issues.push(issue(code, index))
  else map.set(key, index)
}
function issue(code, index, reference) { return { code, index, reference } }
function fieldValue(item, path) { return path.split('.').reduce((value, key) => value?.[key], item) }
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function text(value) { return typeof value === 'string' && value.trim().length > 0 }
function validDate(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)) }
const requiredFields = ['id', 'officialNameIt', 'officialNameEn', 'category', 'source.manual', 'source.italianPage', 'source.section', 'mechanics', 'verifiedAt', 'verificationStatus']

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (invokedDirectly) {
  const command = process.argv[2]
  try {
    if (command === 'build') {
      const result = await buildPrivatePack()
      process.stdout.write(`Pacchetto generato: ${result.itemCount} elementi. Classi complete: ${result.coverage.completeClasses}/12.\n`)
    } else {
      let items = []
      try {
        items = (await readPrivateSource()).items
      } catch {
        // Un archivio non ancora creato equivale a copertura zero.
      }
      const report = coverageReport(items)
      process.stdout.write(`Copertura: classi ${report.completeClasses}/12; sottoclassi ${report.completeSubclasses}; verificati ${report.verified}; incompleti ${report.incomplete}; riferimenti mancanti ${report.unresolvedReferences}.\n`)
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Operazione non riuscita.'}\n`)
    process.exitCode = 1
  }
}

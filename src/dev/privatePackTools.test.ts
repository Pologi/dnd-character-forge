import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  analyzeItems,
  buildPrivatePack,
  coverageReport,
  parseImport,
} from '../../scripts/private-pack-tools.mjs'
import { forbiddenProductionText } from '../../scripts/check-dist-private-content.mjs'

const temporaryDirectories: string[] = []
afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

describe('strumenti locali del Pacchetto Manuale', () => {
  it('rende disponibile il modulo editor nell’ambiente di sviluppo', async () => {
    expect(import.meta.env.DEV).toBe(true)
    expect((await import('./PrivatePackEditor')).default).toBeTypeOf('function')
  })

  it('riconosce una classe incompleta e una copertura completa 1–10', () => {
    expect(coverageReport([]).completeClasses).toBe(0)
    const table = progression()
    expect(coverageReport([table]).classCoverage.fighter).toHaveLength(10)
    expect(coverageReport([table]).completeClasses).toBe(1)
  })

  it('blocca riferimenti alle capacità non risolti', () => {
    const item = base('progression-table')
    item.mechanics = { classId: 'fighter', levels: levels().map((level) => ({ ...level, grantedFeatureIds: ['feature:missing'] })) }
    expect(analyzeItems([item]).issues.some((issue) => issue.code === 'unresolved-reference')).toBe(true)
  })

  it('rifiuta una sottoclasse collegata a una classe sconosciuta', () => {
    const item = base('subclass')
    item.mechanics = { classId: 'unknown-class' }
    expect(analyzeItems([item]).issues.some((issue) => issue.code === 'missing-subclass-class')).toBe(true)
  })

  it('rifiuta incantesimi incompleti e nomi duplicati italiani o inglesi', () => {
    const first = base('spell')
    const second = { ...base('spell'), id: 'second', officialNameIt: first.officialNameIt, officialNameEn: first.officialNameEn }
    expect(analyzeItems([first]).issues.some((issue) => issue.code === 'incomplete-spell')).toBe(true)
    const codes = analyzeItems([first, second]).issues.map((issue) => issue.code)
    expect(codes).toContain('duplicate-name-it')
    expect(codes).toContain('duplicate-name-en')
  })

  it('importa JSON, CSV e TSV senza applicare automaticamente i dati', () => {
    expect(parseImport('[{"id":"one"}]', 'json')).toEqual([{ id: 'one' }])
    expect(parseImport('id,officialNameIt\none,Uno', 'csv')).toEqual([{ id: 'one', officialNameIt: 'Uno' }])
    expect(parseImport('id\tofficialNameIt\none\tUno', 'tsv')).toEqual([{ id: 'one', officialNameIt: 'Uno' }])
  })

  it('blocca placeholder e pagina mancante', () => {
    const item = base('language')
    item.source = { manual: 'Manuale del Giocatore 2024', edition: '2024', italianPage: '', section: 'Sezione' }
    item.mechanics = { description: 'TODO' }
    const codes = analyzeItems([item]).issues.map((issue) => issue.code)
    expect(codes).toContain('invalid-source')
    expect(codes).toContain('placeholder')
  })

  it('genera il pacchetto fuori da src e produce il rapporto di copertura', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dnd-private-pack-'))
    temporaryDirectories.push(root)
    await mkdir(join(root, 'mappings'))
    await writeFile(join(root, 'metadata.json'), JSON.stringify({ packId: 'fixture-pack', title: 'Fixture' }))
    await writeFile(join(root, 'mappings', 'language.json'), JSON.stringify(base('language')))
    const output = join(root, '..', `${root.split(/[\\/]/).at(-1)}.private-pack.json`)
    const result = await buildPrivatePack(root, output)
    temporaryDirectories.push(output)
    expect(result.itemCount).toBe(1)
    expect(JSON.parse(await readFile(output, 'utf8')).format).toBe('phb-2024-private-pack')
  })

  it('blocca marker e route dell’editor nella produzione', () => {
    expect(forbiddenProductionText('PRIVATE_PACK_EDITOR_DEVELOPMENT_ONLY')).toBe(true)
    expect(forbiddenProductionText('Editor Pacchetto Manuale')).toBe(true)
    expect(forbiddenProductionText('D&D Character Forge')).toBe(false)
  })
})

function base(category: string): Record<string, any> {
  return {
    id: `${category}:fixture`, category,
    officialNameIt: 'Elemento di prova', officialNameEn: 'Fixture Element',
    source: { manual: 'Manuale del Giocatore 2024', edition: '2024', italianPage: 1, section: 'Fixture' },
    mechanics: { description: 'Dato strutturato di prova' },
    verifiedAt: '2026-07-24T00:00:00.000Z', verificationStatus: 'verified',
  }
}
function levels() {
  return Array.from({ length: 10 }, (_, index) => ({
    level: index + 1, complete: true, verificationStatus: 'verified',
    proficiencyBonus: index < 4 ? 2 : index < 8 ? 3 : 4,
    fixedHitPointValue: 1, grantedFeatureIds: [], requiredChoices: [], resourceChanges: [],
  }))
}
function progression() {
  const item = base('progression-table')
  item.mechanics = { classId: 'fighter', levels: levels() }
  return item
}

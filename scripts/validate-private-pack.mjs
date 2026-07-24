import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const format = 'phb-2024-private-pack'
const schemaVersion = 1
const categories = new Set([
  'class', 'subclass', 'species', 'background', 'feat', 'spell', 'feature',
  'weapon', 'armor', 'equipment', 'tool', 'language', 'weapon-property',
  'weapon-mastery', 'progression-table', 'required-choice',
])
const placeholder = /\b(?:placeholder|segnaposto|todo|tbd|da definire)\b/i

const paths = process.argv.slice(2)
const files = paths.length > 0 ? paths.map(resolve) : await discover(resolve('.'))
let failures = 0
for (const file of files) {
  try {
    const pack = JSON.parse(await readFile(file, 'utf8'))
    const errors = validate(pack)
    if (errors.length > 0) {
      failures += 1
      process.stderr.write(`Pacchetto privato non valido (${errors.length} errori): ${errors.join('; ')}\n`)
    }
  } catch {
    failures += 1
    process.stderr.write('Pacchetto privato illeggibile o non JSON.\n')
  }
}
if (failures > 0) process.exitCode = 1
else process.stdout.write(`Validazione pacchetti privati completata (${files.length} file).\n`)

function validate(pack) {
  const errors = []
  if (!record(pack) || pack.format !== format) return ['formato non valido']
  if (pack.schemaVersion !== schemaVersion) errors.push('schema non supportato')
  if (!text(pack.packId) || !text(pack.title) || pack.importedFrom !== 'user-owned-manual' || !validDate(pack.createdAt)) errors.push('metadati pacchetto non validi')
  if (!Array.isArray(pack.items)) return [...errors, 'items non è un elenco']
  const ids = new Set()
  const classes = new Set(pack.items.filter((x) => x?.category === 'class').map((x) => x.id))
  const features = new Set(pack.items.filter((x) => x?.category === 'feature').map((x) => x.id))
  const tables = new Set(pack.items.filter((x) => x?.category === 'progression-table').map((x) => x.id))
  for (const item of pack.items) {
    if (!record(item) || !categories.has(item.category)) { errors.push('categoria non ammessa'); continue }
    const identity = `${item.category}:${item.id}`
    if (!text(item.id) || ids.has(identity)) errors.push('ID assente o duplicato')
    ids.add(identity)
    if (!text(item.officialNameIt) || !text(item.officialNameEn)) errors.push('nome ufficiale mancante')
    if (!record(item.source) || !text(item.source.manual) || item.source.edition !== '2024'
      || !Number.isInteger(item.source.italianPage) || item.source.italianPage < 1) errors.push('fonte o pagina non valida')
    if (!record(item.mechanics) || Object.keys(item.mechanics).length === 0) errors.push('meccaniche mancanti')
    if (!['verified', 'transcribed', 'incomplete', 'unverified'].includes(item.verificationStatus)
      || !validDate(item.verifiedAt) || typeof item.active !== 'boolean') errors.push('verifica non valida')
    if (item.active === true && item.verificationStatus !== 'verified') errors.push('contenuto attivo non verificato')
    if (placeholder.test(JSON.stringify(item))) errors.push('placeholder non ammesso')
    if (item.category === 'species' && ['abilityScoreIncreases', 'abilityBonuses', 'abilityScoreBonus'].some((key) => item.mechanics?.[key] !== undefined)) errors.push('bonus di caratteristica nella specie')
    if (item.category === 'subclass' && !classes.has(item.mechanics?.classId) && !item.extendsSrdId) errors.push('riferimento classe assente')
    if (item.category === 'class') {
      if (!validBuilderData(item.mechanics?.builderData, 'class')) errors.push('dati builder classe incompleti')
      if (!Array.isArray(item.mechanics?.featureIds) || item.mechanics.featureIds.some((id) => !features.has(id))) errors.push('riferimento capacità assente')
      if (!tables.has(item.mechanics?.progressionTableId)) errors.push('progressione assente')
    }
    if ((item.category === 'species' || item.category === 'background')
      && !validBuilderData(item.mechanics?.builderData, item.category)) errors.push('dati builder incompleti')
    if (item.category === 'feat' && !Array.isArray(item.mechanics?.prerequisites)) errors.push('prerequisiti mancanti')
    if (item.category === 'progression-table' && (!Array.isArray(item.mechanics?.levels) || item.mechanics.levels.length !== 20
      || item.mechanics.levels.some((level, index) => level?.level !== index + 1))) errors.push('progressione livelli non valida')
    if (item.category === 'progression-table' && Array.isArray(item.mechanics?.levels)
      && item.mechanics.levels.slice(0, 10).some((level) => level?.complete !== true
        || typeof level?.proficiencyBonus !== 'number' || typeof level?.fixedHitPointValue !== 'number'
        || !Array.isArray(level?.grantedFeatureIds) || !Array.isArray(level?.requiredChoices)
        || !Array.isArray(level?.resourceChanges))) errors.push('livello 1–10 incompleto')
    if (item.category === 'spell' && (!Array.isArray(item.mechanics?.listIds)
      || item.mechanics.listIds.some((id) => !id.startsWith('srd:') && !classes.has(id)))) errors.push('lista incantesimi assente')
  }
  return [...new Set(errors)]
}

async function discover(root) {
  const found = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue
    const path = resolve(root, entry.name)
    if (entry.isDirectory()) found.push(...await discover(path))
    else if (entry.name.endsWith('.private-pack.json') || entry.name.endsWith('.manual-pack.json')) found.push(path)
  }
  return found
}

function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function text(value) { return typeof value === 'string' && value.trim().length > 0 }
function validDate(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)) }
function validBuilderData(value, category) {
  if (!record(value) || !text(value.id) || !text(value.nameIt) || !text(value.shortDescription)
    || !text(value.icon) || !record(value.source) || !Array.isArray(value.requiredChoices)) return false
  if (category === 'background') return true
  if (category === 'species') return typeof value.speedMeters === 'number' && text(value.size)
    && text(value.creatureType) && Array.isArray(value.traits) && Array.isArray(value.speciesSpells)
    && Array.isArray(value.resistances) && Array.isArray(value.proficiencies)
    && Array.isArray(value.abilityScoreIncreases) && value.abilityScoreIncreases.length === 0
  return typeof value.hitDie === 'number' && text(value.role) && text(value.levelOneHitPoints)
    && typeof value.skillChoiceCount === 'number' && typeof value.goldAlternative === 'number'
    && typeof value.weaponMasteryCount === 'number' && Array.isArray(value.levelOneFeatures)
    && Array.isArray(value.startingEquipment) && Array.isArray(value.primaryAbilities)
}

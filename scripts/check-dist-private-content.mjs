import { readFile, readdir } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const forbiddenPrivatePath = (path) => {
  const normalized = path.replaceAll('\\', '/').toLowerCase()
  return normalized.split('/').includes('private-content')
    || normalized.endsWith('.private-pack.json')
    || normalized.endsWith('.manual-pack.json')
}
export const forbiddenProductionText = (text) =>
  text.includes('PRIVATE_PACK_EDITOR_DEVELOPMENT_ONLY')
  || text.includes('Editor Pacchetto Manuale')

export async function assertDistIsPrivateContentFree(distPath) {
  const entries = await walk(distPath)
  const forbidden = entries.filter((entry) => forbiddenPrivatePath(relative(distPath, entry)))
  if (forbidden.length > 0) throw new Error(`Build bloccata: trovati ${forbidden.length} file privati in dist.`)
  const textFiles = entries.filter((entry) => /\.(?:html|js|css|json)$/i.test(entry))
  for (const file of textFiles) {
    if (forbiddenProductionText(await readFile(file, 'utf8'))) throw new Error('Build bloccata: l’editor privato di sviluppo è presente in dist.')
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  }))
  return nested.flat()
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  await assertDistIsPrivateContentFree(resolve('dist'))
  process.stdout.write('Controllo build: nessun file di pacchetto privato in dist.\n')
}

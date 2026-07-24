import { useRef, useState } from 'react'
import { PRIVATE_CONTENT_CATEGORIES, type PrivateContentCategory } from '../types/privateContent'
import { useContentRegistry } from '../content/ContentRegistryContext'
import { exportPrivatePackConfiguration } from '../content/privatePackStorage'
import { officialTermCatalog } from '../content/officialTermCatalog'
import { OfficialTermHelp } from './OfficialTermHelp'

const countRows: [string, PrivateContentCategory[]][] = [
  ['Classi', ['class']],
  ['Sottoclassi', ['subclass']],
  ['Specie', ['species']],
  ['Background', ['background']],
  ['Talenti', ['feat']],
  ['Incantesimi', ['spell']],
  ['Oggetti', ['weapon', 'armor', 'equipment', 'tool']],
]

export function ContentManualsPage() {
  const { registry, storedPack, hasArchivedPack, loading, message, importPack, checkIntegrity, removePack } = useContentRegistry()
  const picker = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const chooseFile = () => picker.current?.click()
  const onFile = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      await importPack(await file.text())
    } catch {
      // Il provider espone soltanto messaggi di validazione, mai il contenuto privato.
    } finally {
      setBusy(false)
      if (picker.current) picker.current.value = ''
    }
  }
  const remove = async () => {
    if (!window.confirm('Rimuovere completamente il pacchetto privato da questo browser?')) return
    setBusy(true)
    try {
      await removePack()
    } finally {
      setBusy(false)
    }
  }
  const exportConfiguration = () => {
    if (!storedPack) return
    download('dnd-character-forge-configurazione.json', exportPrivatePackConfiguration(storedPack))
  }

  const conflicts = registry.conflicts()
  const incomplete = registry.incomplete().filter((item) => item.origin === 'private-pack')
  return (
    <section className="content-page section-wrap">
      <div className="section-heading">
        <span className="kicker">Cataloghi locali</span>
        <h1>Contenuti e manuali</h1>
        <p>I contenuti privati restano in IndexedDB su questo dispositivo e non vengono mai inviati in rete.</p>
      </div>

      <div className="manual-status-grid">
        <StatusCard title="SRD 5.2.1 italiano" installed />
        <StatusCard title="SRD 5.2.1 inglese" installed />
        <StatusCard title="Manuale del Giocatore 2024" installed={Boolean(storedPack)} />
      </div>

      <section className="content-panel">
        <h2>Catalogo disponibile</h2>
        <dl className="content-counts">
          {countRows.map(([label, categories]) => (
            <div key={label}><dt>{label}</dt><dd>{categories.reduce((sum, category) => sum + registry.selectable(category).length, 0)}</dd></div>
          ))}
        </dl>
        <p>Ultima importazione: <strong>{storedPack ? new Date(storedPack.importedAt).toLocaleString('it-IT') : 'Nessuna'}</strong></p>
      </section>

      <section className="content-panel">
        <h2>Dizionario dei termini ufficiali</h2>
        <p>Il pulsante ? mostra il termine italiano e inglese senza creare traduzioni sostitutive.</p>
        <div className="official-term-grid">
          {officialTermCatalog.map((term) => (
            <span key={term.id}>{term.nameIt}<OfficialTermHelp item={term} /></span>
          ))}
        </div>
      </section>

      {(message || conflicts.length > 0 || incomplete.length > 0) && (
        <section className="content-panel content-alert" aria-live="polite">
          <h2>Integrità e segnalazioni</h2>
          {message && <p>{message}</p>}
          {conflicts.map((conflict) => <p key={`${conflict.category}:${conflict.id}`}>{conflict.message}</p>)}
          {incomplete.length > 0 && <p>{incomplete.length} contenuti incompleti o non verificati sono stati disattivati.</p>}
        </section>
      )}

      <div className="content-actions">
        <input
          ref={picker}
          className="visually-hidden"
          type="file"
          accept=".json,.private-pack.json,.manual-pack.json,application/json"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <button className="button button-primary" disabled={busy || loading} onClick={chooseFile}>
          {storedPack ? 'Aggiorna pacchetto' : 'Importa pacchetto'}
        </button>
        <button className="button button-ghost" disabled={busy || loading || !storedPack} onClick={() => void checkIntegrity()}>Controlla integrità</button>
        <button className="button button-ghost" disabled={!storedPack} onClick={exportConfiguration}>Esporta soltanto configurazione</button>
        <button className="button button-danger" disabled={busy || !hasArchivedPack} onClick={() => void remove()}>Rimuovi pacchetto</button>
      </div>
      <p className="privacy-note">Non è disponibile alcuna esportazione dei contenuti completi. Categorie supportate: {PRIVATE_CONTENT_CATEGORIES.join(', ')}.</p>
    </section>
  )
}

function StatusCard({ title, installed }: { title: string; installed: boolean }) {
  return <article className="manual-status-card"><span aria-hidden="true">{installed ? '✓' : '◇'}</span><h2>{title}</h2><strong>{installed ? 'Installato' : 'Non installato'}</strong></article>
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

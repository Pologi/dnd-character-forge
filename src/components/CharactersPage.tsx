import { useRef, useState, type ChangeEvent } from 'react'
import {
  deleteCharacter,
  duplicateCharacter,
  exportCharacter,
  importCharacter,
} from '../storage/characterStorage'
import { backgroundOptions, classOptions, speciesOptions } from '../data/srd-5.2.1-it/catalog'
import { RULESET_LABEL, type Character } from '../types/character'

interface CharactersPageProps {
  characters: Character[]
  onCreate: () => void
  onOpen: (character: Character) => void
  onEdit: (character: Character) => void
  onCharactersChange: () => void
}

export function CharactersPage({
  characters,
  onCreate,
  onOpen,
  onEdit,
  onCharactersChange,
}: CharactersPageProps) {
  const importInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const handleDelete = (character: Character) => {
    if (!window.confirm(`Eliminare definitivamente “${character.name}”?`)) return
    try {
      deleteCharacter(character.id)
      onCharactersChange()
      setMessage({ kind: 'success', text: `${character.name} è stato eliminato.` })
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Eliminazione non riuscita.' })
    }
  }

  const handleDuplicate = (character: Character) => {
    try {
      const copy = duplicateCharacter(character.id)
      onCharactersChange()
      setMessage({ kind: 'success', text: `Creata la copia “${copy.name}”.` })
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Duplicazione non riuscita.' })
    }
  }

  const handleExport = (character: Character) => {
    const blob = new Blob([exportCharacter(character)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeFilename(character.name)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setMessage({ kind: 'success', text: `${character.name} è stato esportato.` })
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const imported = importCharacter(await file.text())
      onCharactersChange()
      setMessage({ kind: 'success', text: `“${imported.name}” è stato importato correttamente.` })
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Non è stato possibile importare il file.',
      })
    }
  }

  return (
    <section className="page-section section-wrap">
      <div className="page-heading page-heading-with-actions">
        <div>
          <span className="kicker">La tua compagnia</span>
          <h1>I miei personaggi</h1>
          <p>Qui trovi gli eroi custoditi su questo dispositivo.</p>
        </div>
        <div className="page-actions">
          <button className="button button-ghost" onClick={() => importInput.current?.click()}>
            Importa JSON
          </button>
          <button className="button button-primary" onClick={onCreate}>
            <span aria-hidden="true">＋</span> Crea nuovo personaggio
          </button>
          <input
            ref={importInput}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            aria-label="Importa un personaggio da un file JSON"
          />
        </div>
      </div>

      {message && (
        <div className={`notice notice-${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>
          {message.text}
          <button onClick={() => setMessage(null)} aria-label="Chiudi messaggio">×</button>
        </div>
      )}

      {characters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emblem" aria-hidden="true">♜</div>
          <span className="eyebrow"><span /> Il primo capitolo <span /></span>
          <h2>La tua compagnia attende un eroe</h2>
          <p>
            Non hai ancora creato personaggi. Quando inizierai una nuova storia,
            il suo protagonista apparirà qui.
          </p>
          <button className="button button-primary" onClick={onCreate}>
            <span aria-hidden="true">＋</span> Crea nuovo personaggio
          </button>
        </div>
      ) : (
        <div className="character-grid">
          {characters.map((character) => (
            <article className="character-card" key={character.id}>
              <div className="character-card-top">
                <span className="character-level">Livello {character.level}</span>
                <span className="status-pill">Completo</span>
              </div>
              <div className="character-avatar" aria-hidden="true">
                <span>{character.name.trim().charAt(0).toUpperCase()}</span>
              </div>
              <h2>{character.name}</h2>
              <p className="character-archetype">
                {[
                  speciesOptions.find((option) => option.id === character.speciesId)?.nameIt,
                  classOptions.find((option) => option.id === character.classId)?.nameIt,
                ].filter(Boolean).join(' · ') || 'Eroe da definire'}
              </p>
              <dl className="character-meta">
                <div><dt>Regole</dt><dd>{RULESET_LABEL}</dd></div>
                <div><dt>Giocatore</dt><dd>{character.playerName || '—'}</dd></div>
                <div><dt>Background</dt><dd>{backgroundOptions.find((option) => option.id === character.backgroundId)?.nameIt || '—'}</dd></div>
                <div><dt>Livello</dt><dd>{character.level}</dd></div>
              </dl>
              <div className="character-primary-actions">
                <button className="button button-primary" onClick={() => onOpen(character)}>Apri</button>
                <button className="button button-ghost" onClick={() => onEdit(character)}>Modifica</button>
              </div>
              <div className="character-secondary-actions">
                <button onClick={() => handleDuplicate(character)}>Duplica</button>
                <button onClick={() => handleExport(character)}>Esporta</button>
                <button className="danger-link" onClick={() => handleDelete(character)}>Elimina</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function safeFilename(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return normalized || 'personaggio'
}

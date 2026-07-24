import { lazy, Suspense, useMemo, useState } from 'react'
import { CharacterDetail } from './components/CharacterDetail'
import { CharactersPage } from './components/CharactersPage'
import { CharacterBuilder } from './components/character-builder/CharacterBuilder'
import { ContentManualsPage } from './components/ContentManualsPage'
import { LevelUpWizard } from './components/level-up/LevelUpWizard'
import {
  getCharacters,
  getDraft,
  saveDraft,
} from './storage/characterStorage'
import {
  characterToDraft,
  createEmptyDraft,
  type Character,
  type CharacterDraft,
} from './types/character'
import { SRD_ATTRIBUTION, UNOFFICIAL_NOTICE, classOptions } from './data/srd-5.2.1-it/catalog'

const PrivatePackEditor = import.meta.env.DEV ? lazy(() => import('./dev/PrivatePackEditor')) : null
const PRIVATE_EDITOR_VIEW = import.meta.env.DEV ? 'private-editor' as const : 'development-editor-disabled' as const

type View = 'home' | 'characters' | 'content' | 'create' | 'detail' | 'level-up' | typeof PRIVATE_EDITOR_VIEW

const navItems: { id: 'home' | 'characters' | 'content'; label: string }[] = [
  { id: 'home', label: 'Inizio' },
  { id: 'characters', label: 'I miei personaggi' },
  { id: 'content', label: 'Contenuti e manuali' },
]

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span>D</span>
      <i>20</i>
    </span>
  )
}

function App() {
  const [view, setView] = useState<View>('home')
  const [characters, setCharacters] = useState<Character[]>(() => getCharacters())
  const [wizardDraft, setWizardDraft] = useState<CharacterDraft>(() => createEmptyDraft())
  const [creationDirty, setCreationDirty] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftWasResumed, setDraftWasResumed] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedId) ?? null,
    [characters, selectedId],
  )

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const navigate = (nextView: View) => {
    if (
      view === 'create' &&
      nextView !== 'create' &&
      creationDirty &&
      !window.confirm('Vuoi abbandonare la creazione? La bozza resterà salvata nel browser.')
    ) {
      return
    }
    setCreationDirty(false)
    setView(nextView)
    scrollToTop()
  }

  const startCreation = () => {
    if (view === 'create') return
    const savedDraft = getDraft()
    setWizardDraft(savedDraft ?? createEmptyDraft())
    setDraftWasResumed(savedDraft !== null)
    setCreationDirty(false)
    setView('create')
    scrollToTop()
  }

  const editCharacter = (character: Character) => {
    const draft = characterToDraft(character)
    saveDraft(draft)
    setWizardDraft(draft)
    setDraftWasResumed(false)
    setCreationDirty(false)
    setView('create')
    scrollToTop()
  }

  const refreshCharacters = () => setCharacters(getCharacters())

  const openCharacter = (character: Character) => {
    setSelectedId(character.id)
    setView('detail')
    scrollToTop()
  }

  const handleSaved = (character: Character) => {
    refreshCharacters()
    setSelectedId(character.id)
    setCreationDirty(false)
    setView(character.requestedLevel > 1 ? 'level-up' : 'detail')
    scrollToTop()
  }

  const handleCharacterUpdated = (character: Character) => {
    refreshCharacters()
    setSelectedId(character.id)
    setView(character.level < character.requestedLevel ? 'level-up' : 'detail')
    scrollToTop()
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => navigate('home')} aria-label="Vai alla pagina iniziale">
          <BrandMark />
          <span className="brand-copy">
            <strong>D&amp;D</strong>
            <small>Character Forge</small>
          </span>
        </button>

        <nav className="main-nav" aria-label="Navigazione principale">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? 'nav-link active' : 'nav-link'}
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
          <button className="nav-link" onClick={() => setSourcesOpen(true)}>Fonti e licenze</button>
          {import.meta.env.DEV && PrivatePackEditor && <button className={view === PRIVATE_EDITOR_VIEW ? 'nav-link active' : 'nav-link'} onClick={() => navigate(PRIVATE_EDITOR_VIEW)}>Editor Pacchetto Manuale</button>}
        </nav>

        <button className="button button-small header-action" onClick={startCreation}>
          <span aria-hidden="true">＋</span>
          Crea personaggio
        </button>
      </header>

      <main>
        {view === 'home' && (
          <HomePage onCreate={startCreation} onCharacters={() => navigate('characters')} />
        )}
        {view === 'characters' && (
          <CharactersPage
            characters={characters}
            onCreate={startCreation}
            onOpen={openCharacter}
            onEdit={editCharacter}
            onCharactersChange={refreshCharacters}
          />
        )}
        {view === 'content' && <ContentManualsPage />}
        {view === 'create' && (
          <CharacterBuilder
            key={`${wizardDraft.id}-${draftWasResumed ? 'resumed' : 'new'}`}
            initialDraft={wizardDraft}
            resumed={draftWasResumed}
            onDirtyChange={setCreationDirty}
            onCancel={() => navigate('characters')}
            onSaved={handleSaved}
          />
        )}
        {view === 'detail' && selectedCharacter && (
          <CharacterDetail
            character={selectedCharacter}
            onBack={() => navigate('characters')}
            onEdit={() => editCharacter(selectedCharacter)}
            onAdvance={() => navigate('level-up')}
            onUpdated={handleCharacterUpdated}
          />
        )}
        {view === 'level-up' && selectedCharacter && (() => {
          const characterClass = classOptions.find((item) => item.id === selectedCharacter.classId)
          return characterClass ? <LevelUpWizard
            character={selectedCharacter}
            characterClass={characterClass}
            onCancel={() => navigate('detail')}
            onComplete={handleCharacterUpdated}
          /> : null
        })()}
        {view === PRIVATE_EDITOR_VIEW && PrivatePackEditor && <Suspense fallback={<p className="section-wrap">Apertura dell’editor locale…</p>}><PrivatePackEditor /></Suspense>}
      </main>

      {sourcesOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSourcesOpen(false)}>
          <section className="license-modal" role="dialog" aria-modal="true" aria-labelledby="license-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSourcesOpen(false)} aria-label="Chiudi">×</button>
            <span className="kicker">Trasparenza delle regole</span>
            <h2 id="license-title">Fonti e licenze</h2>
            <p>{SRD_ATTRIBUTION}</p>
            <p><strong>{UNOFFICIAL_NOTICE}</strong></p>
            <p>Le nove specie e le dodici classi con badge SRD usano dati meccanici del SRD 5.2.1 italiano. L’Aasimar è indicato esclusivamente come opzione ufficiale del Manuale del Giocatore 2024: i suoi tratti non sono inclusi nell’app.</p>
            <p><a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">System Reference Document 5.2.1</a> · <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer">Licenza CC BY 4.0</a></p>
          </section>
        </div>
      )}

      <footer className="site-footer">
        <div className="footer-brand">
          <BrandMark />
          <span>D&amp;D Character Forge</span>
        </div>
        <p>La tua storia comincia da un personaggio.</p>
        <span className="footer-note">I dati restano su questo dispositivo</span>
        <button className="footer-license-link" onClick={() => setSourcesOpen(true)}>Fonti e licenze</button>
      </footer>
    </div>
  )
}

function HomePage({ onCreate, onCharacters }: { onCreate: () => void; onCharacters: () => void }) {
  return (
    <>
      <section className="hero">
        <div className="hero-ornament hero-ornament-left" aria-hidden="true">✦</div>
        <div className="hero-ornament hero-ornament-right" aria-hidden="true">✧</div>
        <div className="eyebrow"><span /> Forgiato per l'avventura <span /></div>
        <h1>
          Ogni leggenda inizia
          <em>da un personaggio</em>
        </h1>
        <p className="hero-copy">
          Dai forma al tuo eroe, custodisci le sue origini e preparati a scrivere
          storie che il tuo tavolo ricorderà.
        </p>
        <div className="hero-actions">
          <button className="button button-primary" onClick={onCreate}>
            Crea nuovo personaggio <span aria-hidden="true">→</span>
          </button>
          <button className="button button-ghost" onClick={onCharacters}>
            I miei personaggi
          </button>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span>Scopri la forgia</span>
          <i>⌄</i>
        </div>
      </section>

      <section className="features section-wrap" aria-labelledby="features-title">
        <div className="section-heading">
          <span className="kicker">Il tuo viaggio</span>
          <h2 id="features-title">Dall'idea alla leggenda</h2>
          <p>Uno spazio semplice e curato per dare inizio alla tua prossima avventura.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-number">01</span>
            <div className="feature-icon" aria-hidden="true">✦</div>
            <h3>Immagina</h3>
            <p>Parti da un'idea, un nome o una storia ancora tutta da scoprire.</p>
          </article>
          <article className="feature-card featured">
            <span className="feature-number">02</span>
            <div className="feature-icon" aria-hidden="true">⚒</div>
            <h3>Forgia</h3>
            <p>Segui un percorso guidato e salva i progressi direttamente nel browser.</p>
          </article>
          <article className="feature-card">
            <span className="feature-number">03</span>
            <div className="feature-icon" aria-hidden="true">⌘</div>
            <h3>Avventurati</h3>
            <p>Ritrova i tuoi eroi in un unico luogo, pronti per nuove storie.</p>
          </article>
        </div>
      </section>

      <section className="callout section-wrap">
        <div>
          <span className="kicker">La forgia ti attende</span>
          <h2>Chi diventerai?</h2>
          <p>Il primo passo non richiede che un'idea. Al resto penseremo insieme.</p>
        </div>
        <button className="button button-primary" onClick={onCreate}>
          Inizia la creazione <span aria-hidden="true">→</span>
        </button>
      </section>
    </>
  )
}

export default App

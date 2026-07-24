import { useState } from 'react'

type View = 'home' | 'characters' | 'create'

const navItems: { id: View; label: string }[] = [
  { id: 'home', label: 'Inizio' },
  { id: 'characters', label: 'I miei personaggi' },
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

  const navigate = (nextView: View) => {
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        </nav>

        <button className="button button-small header-action" onClick={() => navigate('create')}>
          <span aria-hidden="true">＋</span>
          Crea personaggio
        </button>
      </header>

      <main>
        {view === 'home' && <HomePage onCreate={() => navigate('create')} onCharacters={() => navigate('characters')} />}
        {view === 'characters' && <CharactersPage onCreate={() => navigate('create')} />}
        {view === 'create' && <CreationPage onBack={() => navigate('home')} />}
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <BrandMark />
          <span>D&amp;D Character Forge</span>
        </div>
        <p>La tua storia comincia da un personaggio.</p>
        <span className="footer-note">Progetto indipendente per avventurieri</span>
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
            <p>Segui un percorso guidato per costruire il cuore del tuo personaggio.</p>
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

function CharactersPage({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="page-section section-wrap">
      <div className="page-heading">
        <span className="kicker">La tua compagnia</span>
        <h1>I miei personaggi</h1>
        <p>Qui troverai gli eroi che avrai forgiato.</p>
      </div>
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
    </section>
  )
}

function CreationPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="page-section creation-section">
      <div className="creation-topbar section-wrap">
        <button className="back-link" onClick={onBack}>
          <span aria-hidden="true">←</span> Torna all'inizio
        </button>
        <span className="step-label">Introduzione</span>
      </div>
      <div className="creation-card">
        <div className="creation-emblem" aria-hidden="true">
          <BrandMark />
        </div>
        <span className="kicker">Creazione guidata</span>
        <h1>È tempo di forgiare il tuo eroe</h1>
        <p className="creation-lead">
          Ti accompagneremo passo dopo passo. Per ora, prepara l'idea da cui
          nascerà il tuo prossimo personaggio.
        </p>
        <div className="creation-preview" aria-label="Fasi previste">
          <div className="preview-item active">
            <span>1</span>
            <div><strong>Il punto di partenza</strong><small>Definisci l'idea del tuo eroe</small></div>
          </div>
          <div className="preview-line" />
          <div className="preview-item muted">
            <span>2</span>
            <div><strong>La tua storia</strong><small>Prossimamente</small></div>
          </div>
          <div className="preview-line" />
          <div className="preview-item muted">
            <span>3</span>
            <div><strong>I dettagli</strong><small>Prossimamente</small></div>
          </div>
        </div>
        <button className="button button-primary button-disabled" disabled>
          La forgia aprirà presto
        </button>
        <small className="no-save-note">Questa anteprima non salva ancora alcun dato.</small>
      </div>
    </section>
  )
}

export default App

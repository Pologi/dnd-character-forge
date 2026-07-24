import {
  abilityDefinitions,
  PHB_AASIMAR_PRESENTATION,
  backgroundOptions,
  classOptions,
  languageOptions,
  speciesOptions,
} from '../data/srd-5.2.1-it/catalog'
import { applyBackgroundBonuses, formatModifier } from '../rules/2024/characterBuilderRules'
import { RULESET_LABEL, type Character } from '../types/character'
import { addExperience, experienceProgress, levelForExperience, undoLastAdvancement } from '../rules/2024/advancementRules'
import { replaceCharacter } from '../storage/characterStorage'
import { useState } from 'react'

interface CharacterDetailProps {
  character: Character
  onBack: () => void
  onEdit: () => void
  onAdvance: () => void
  onUpdated: (character: Character) => void
}

export function CharacterDetail({ character, onBack, onEdit, onAdvance, onUpdated }: CharacterDetailProps) {
  const [xpAmount, setXpAmount] = useState(100)
  const [message, setMessage] = useState('')
  const selectedClass = classOptions.find((option) => option.id === character.classId)
  const background = backgroundOptions.find((option) => option.id === character.backgroundId)
  const species = speciesOptions.find((option) => option.id === character.speciesId)
  const finalAbilities = applyBackgroundBonuses(character.baseAbilities, character.backgroundBonuses)
  const xp = experienceProgress(character.level, character.advancement.experiencePoints)
  const thresholdLevel = levelForExperience(character.advancement.experiencePoints)
  const update = (next: Character) => {
    replaceCharacter(next)
    onUpdated(next)
  }

  return (
    <section className="page-section section-wrap detail-page">
      <div className="detail-toolbar">
        <button className="back-link" onClick={onBack}>← I miei personaggi</button>
        <div className="detail-actions"><button className="button button-ghost" onClick={onEdit}>Modifica</button><button className="button button-primary" onClick={onAdvance}>Passa di livello</button></div>
      </div>
      <div className="detail-hero">
        <span className="kicker">Scheda del personaggio</span>
        <h1>{character.name}</h1>
        <p>Livello {character.level} · {RULESET_LABEL}{character.playerName ? ` · Giocatore: ${character.playerName}` : ''}</p>
      </div>
      <section className="experience-panel">
        <div><span className="kicker">Avanzamento</span><h2>{character.advancement.mode === 'experience' ? `${character.advancement.experiencePoints.toLocaleString('it-IT')} XP` : 'Avanzamento a traguardi'}</h2></div>
        {character.advancement.mode === 'experience' ? <>
          <progress max="100" value={xp.percent}>{xp.percent}%</progress>
          <p>{xp.next ? `${xp.missing.toLocaleString('it-IT')} XP al livello successivo` : 'Livello massimo supportato'}</p>
          <div className="xp-controls"><input aria-label="Variazione punti esperienza" type="number" value={xpAmount} onChange={(event) => setXpAmount(Number(event.target.value))} /><button onClick={() => update(addExperience(character, xpAmount, 'Aggiunta manuale'))}>Aggiungi</button><button onClick={() => update(addExperience(character, -xpAmount, 'Sottrazione manuale'))}>Sottrai</button></div>
          {thresholdLevel > character.level && <p className="notice notice-success">Hai raggiunto la soglia del livello {thresholdLevel}. Il livello aumenterà solo dopo conferma.</p>}
        </> : <p>Gli XP non vengono utilizzati. Il passaggio di livello viene avviato manualmente.</p>}
        <div className="mode-controls">
          <button onClick={() => update({ ...character, advancement: { ...character.advancement, mode: 'experience' } })}>Punti Esperienza</button>
          <button onClick={() => update({ ...character, advancement: { ...character.advancement, mode: 'milestone' } })}>Traguardi</button>
        </div>
        <label className="campaign-setting"><input type="checkbox" checked={character.advancement.allowMulticlass} onChange={(event) => update({
          ...character,
          advancement: { ...character.advancement, allowMulticlass: event.target.checked },
        })} /> Permetti multiclasse <small>Le combinazioni prive di dati ufficiali restano bloccate.</small></label>
        {character.advancement.history.length > 0 && <button className="danger-link" onClick={() => {
          if (!window.confirm('Annullare esattamente l’ultimo avanzamento?')) return
          try { update(undoLastAdvancement(character)) } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Ripristino non riuscito.') }
        }}>Annulla ultimo avanzamento</button>}
        {message && <p role="alert">{message}</p>}
      </section>
      {character.advancement.history.length > 0 && <section className="advancement-history">
        <span className="kicker">Cronologia</span><h2>Avanzamenti del personaggio</h2>
        {[...character.advancement.history].reverse().map((entry) => <details key={entry.id}>
          <summary>Livello {entry.previousLevel} → {entry.newLevel} · {new Date(entry.date).toLocaleDateString('it-IT')}</summary>
          <div className="history-comparison">
            <span>PF massimi <del>{entry.previousSnapshot.maxHitPoints}</del> <strong>{entry.nextSnapshot.maxHitPoints}</strong></span>
            <span>Bonus di competenza <del>+{entry.previousLevel < 5 ? 2 : entry.previousLevel < 9 ? 3 : 4}</del> <strong>+{entry.newLevel < 5 ? 2 : entry.newLevel < 9 ? 3 : 4}</strong></span>
            <span>Capacità: {entry.grantedFeatureIds.join(', ') || 'Nessuna automatica'}</span>
            <span>Fonte: {entry.source.sourceTitle} · p. {entry.source.sourcePage}</span>
          </div>
        </details>)}
      </section>}
      <div className="detail-grid">
        <DetailSection title="Identità">
          <DetailValue label="Classe" value={selectedClass?.nameIt} />
          <DetailValue label="Background" value={background?.nameIt} />
          <DetailValue label="Specie" value={species?.nameIt ?? (character.speciesId === PHB_AASIMAR_PRESENTATION.id ? 'Aasimar' : undefined)} />
          <DetailValue label="Idea iniziale" value={character.initialIdea} wide />
          <DetailValue
            label="Linguaggi"
            value={character.languages.map((id) => languageOptions.find((option) => option.id === id)?.nameIt).filter(Boolean).join(', ')}
            wide
          />
        </DetailSection>
        <section className="detail-panel">
          <h2>Caratteristiche</h2>
          <div className="ability-summary">
            {abilityDefinitions.map((ability) => {
              const score = finalAbilities[ability.id]
              return (
                <div key={ability.id}>
                  <span>{ability.nameIt}</span>
                  <strong>{score ?? '—'}</strong>
                  <small>{score === null ? '—' : formatModifier(score)}</small>
                </div>
              )
            })}
          </div>
        </section>
        <DetailSection title="Classe e preparazione">
          <DetailValue label="Dadi Vita" value={character.advancement.classLevels.map((entry) => `${entry.level}d${selectedClass?.hitDie ?? '—'} (${entry.classId})`).join(', ')} />
          <DetailValue label="Punti ferita" value={`${character.advancement.currentHitPoints}/${character.advancement.maxHitPoints}`} />
          <DetailValue label="Abilità della classe" value={character.classSkillIds.join(', ')} />
          <DetailValue label="Equipaggiamento" value={character.equipmentChoiceIds[0] === 'gold' ? `${selectedClass?.goldAlternative ?? 0} mo` : selectedClass?.startingEquipment.find((item) => item.id === character.equipmentChoiceIds[0])?.label} />
          <DetailValue label="Magia al livello 1" value={selectedClass?.spellcasting ? `${selectedClass.spellcasting.cantrips} trucchetti, ${selectedClass.spellcasting.preparedSpells} incantesimi preparati, ${selectedClass.spellcasting.levelOneSlots} slot` : 'Nessun privilegio Incantesimi al livello 1'} />
        </DetailSection>
        <DetailSection title="Personalità">
          <DetailValue label="Aspetto" value={character.appearance} />
          <DetailValue label="Personalità" value={character.personality} />
          <DetailValue label="Ideale" value={character.ideal} />
          <DetailValue label="Legame" value={character.bond} />
          <DetailValue label="Difetto" value={character.flaw} />
          <DetailValue label="Allineamento" value={character.alignment} />
          <DetailValue label="Storia" value={character.backstory} wide />
        </DetailSection>
      </div>
    </section>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="detail-panel"><h2>{title}</h2><div className="detail-values">{children}</div></section>
}

function DetailValue({ label, value, wide = false }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={wide ? 'detail-value detail-value-wide' : 'detail-value'}>
      <span>{label}</span>
      <p>{value || 'Non specificato'}</p>
    </div>
  )
}

import { useMemo, useState } from 'react'
import type { Character, CharacterClass } from '../../types/character'
import type { HitPointMethod } from '../../types/advancement'
import { useContentRegistry } from '../../content/ContentRegistryContext'
import { findClassProgression, unavailableProgressionMessage } from '../../content/advancementCatalog'
import { applyAdvancement, derivedStatistics, missingRequiredChoices, proficiencyBonusForLevel } from '../../rules/2024/advancementRules'
import { OfficialTermHelp } from '../OfficialTermHelp'

interface Props {
  character: Character
  characterClass: CharacterClass
  onCancel: () => void
  onComplete: (character: Character) => void
}

export function LevelUpWizard({ character, characterClass, onCancel, onComplete }: Props) {
  const { registry } = useContentRegistry()
  const targetLevel = character.level + 1
  const progression = targetLevel <= 10
    ? findClassProgression(registry, character.classId, targetLevel as 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)
    : null
  const [stepIndex, setStepIndex] = useState(0)
  const [hpMethod, setHpMethod] = useState<HitPointMethod>('fixed')
  const [roll, setRoll] = useState(1)
  const [choices, setChoices] = useState<Record<string, string[]>>({})
  const [error, setError] = useState('')
  const before = derivedStatistics(character)

  const steps = useMemo(() => progression ? [
    { id: 'news', label: 'Novità del livello' },
    { id: 'hp', label: 'Punti ferita' },
    ...(progression.grantedFeatureIds.length ? [{ id: 'features', label: 'Capacità' }] : []),
    ...(progression.subclassRequired ? [{ id: 'subclass', label: 'Sottoclasse' }] : []),
    ...(progression.requiredChoices.length ? [{ id: 'choices', label: 'Scelte richieste' }] : []),
    ...(progression.spellcastingProgression ? [{ id: 'spells', label: 'Incantesimi' }] : []),
    { id: 'summary', label: 'Riepilogo' },
    { id: 'confirm', label: 'Conferma' },
  ] : [], [progression])

  if (targetLevel > 10) return <Blocked title="Livello massimo raggiunto" message="Il sistema supporta un livello totale massimo pari a 10." onCancel={onCancel} />
  if (!progression) return <Blocked
    title={`Livello ${targetLevel} non disponibile`}
    message={unavailableProgressionMessage(characterClass.nameIt, targetLevel)}
    onCancel={onCancel}
  />

  const current = steps[stepIndex]
  const constitution = (character.baseAbilities.constitution ?? 10) + character.backgroundBonuses.constitution
  const constitutionModifier = Math.floor((constitution - 10) / 2)
  const hpRaw = hpMethod === 'fixed' ? progression.fixedHitPointValue : roll
  const hpGain = Math.max(1, hpRaw + constitutionModifier)
  const confirm = () => {
    try {
      const next = applyAdvancement({
        character, progression, classId: character.classId, hitDie: characterClass.hitDie,
        hitPointMethod: hpMethod, hitPointRawValue: hpMethod === 'roll' ? roll : undefined, choices,
      })
      onComplete(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Avanzamento non riuscito.')
    }
  }

  return (
    <section className="level-up-wizard">
      <header className="level-up-header">
        <button type="button" className="back-link" onClick={onCancel}>← Annulla avanzamento</button>
        <span className="kicker">Dal livello {character.level} al livello {targetLevel}</span>
        <h1>La leggenda continua</h1>
        <p>Ogni modifica sarà applicata insieme, soltanto dopo la conferma finale.</p>
      </header>
      <ol className="level-path" aria-label="Percorso di avanzamento">
        {steps.map((step, index) => <li key={step.id} className={index === stepIndex ? 'active' : index < stepIndex ? 'done' : ''}><span>{index + 1}</span>{step.label}</li>)}
      </ol>
      <div className="level-up-layout">
        <main className="level-step-card">
          {current.id === 'news' && <>
            <Badge>Automatico</Badge><h2>Cosa cambia con questo livello?</h2>
            <Comparison label="Livello totale" before={character.level} after={targetLevel} />
            <Comparison label="Bonus di competenza" before={`+${before.proficiencyBonus}`} after={`+${proficiencyBonusForLevel(targetLevel)}`} />
            <Comparison label="Dadi Vita" before={character.level} after={targetLevel} />
          </>}
          {current.id === 'hp' && <>
            <Badge>Scelta richiesta</Badge><h2>Punti ferita</h2>
            <div className="hp-method-grid">
              <button className={hpMethod === 'fixed' ? 'active' : ''} onClick={() => setHpMethod('fixed')}><strong>Valore fisso ufficiale</strong><span>{progression.fixedHitPointValue}</span></button>
              <button className={hpMethod === 'roll' ? 'active' : ''} onClick={() => setHpMethod('roll')}><strong>Tiro del Dado Vita</strong><span>d{characterClass.hitDie}</span></button>
            </div>
            {hpMethod === 'roll' && <label className="level-field">Risultato del d{characterClass.hitDie}<input type="number" min="1" max={characterClass.hitDie} value={roll} onChange={(event) => setRoll(Number(event.target.value))} /></label>}
            <div className="hp-calculation"><span>Valore {hpRaw}</span><span>Costituzione {constitutionModifier >= 0 ? '+' : ''}{constitutionModifier}</span><strong>PF ottenuti {hpGain}</strong></div>
          </>}
          {current.id === 'features' && <OptionList title="Capacità ottenute" ids={progression.grantedFeatureIds} registry={registry} />}
          {current.id === 'subclass' && <ChoiceCards title="Scegli la sottoclasse" choiceId="subclass" optionIds={registry.selectable('subclass').filter((item) => item.mechanics.classId === character.classId).map((item) => item.id)} choices={choices} setChoices={setChoices} />}
          {current.id === 'choices' && <>{progression.requiredChoices.map((choice) => <ChoiceCards key={choice.id} title={choice.label} choiceId={choice.id} optionIds={choice.optionIds} choices={choices} setChoices={setChoices} count={choice.count} />)}</>}
          {current.id === 'spells' && <>
            <Badge>Scelta richiesta</Badge><h2>Incantesimi</h2>
            <Comparison label="Livello massimo" before="—" after={progression.spellcastingProgression?.maximumSpellLevel ?? '—'} />
            <Comparison label="Trucchetti" before="—" after={progression.spellcastingProgression?.cantrips ?? 0} />
            <p>Le scelte vengono validate contro lista, livello e strategia della progressione importata.</p>
          </>}
          {current.id === 'summary' && <>
            <Badge>Automatico</Badge><h2>Riepilogo prima/dopo</h2>
            <Comparison label="Livello" before={character.level} after={targetLevel} />
            <Comparison label="PF massimi" before={character.advancement.maxHitPoints} after={character.advancement.maxHitPoints + hpGain} />
            <Comparison label="Bonus di competenza" before={`+${before.proficiencyBonus}`} after={`+${proficiencyBonusForLevel(targetLevel)}`} />
            {missingRequiredChoices(progression, choices).map((label) => <p className="builder-error" key={label}>Scelta obbligatoria mancante: {label}</p>)}
          </>}
          {current.id === 'confirm' && <>
            <Badge>Conferma</Badge><h2>Applica il livello {targetLevel}</h2>
            <p>Verranno creati snapshot precedente e successivo. In caso di errore il personaggio resterà invariato.</p>
            <button className="button button-primary" onClick={confirm}>Conferma avanzamento</button>
          </>}
          {error && <div className="builder-error" role="alert">{error}</div>}
          <nav className="builder-navigation">
            <button className="button button-ghost" disabled={stepIndex === 0} onClick={() => setStepIndex((index) => index - 1)}>Indietro</button>
            {stepIndex < steps.length - 1 && <button className="button button-primary" onClick={() => setStepIndex((index) => index + 1)}>Continua →</button>}
          </nav>
        </main>
        <aside className="sage-level-guide"><span aria-hidden="true">✦</span><h2>Guida del saggio</h2><p>Le regole automatiche sono distinte dalle scelte. Se una fonte o una scelta obbligatoria manca, la conferma viene bloccata.</p></aside>
      </div>
    </section>
  )
}

function Blocked({ title, message, onCancel }: { title: string; message: string; onCancel: () => void }) {
  return <section className="level-up-wizard blocked-level"><span className="kicker">Avanzamento protetto</span><h1>{title}</h1><p>{message}</p><button className="button button-primary" onClick={onCancel}>Torna al personaggio</button></section>
}
function Badge({ children }: { children: React.ReactNode }) { return <span className="level-badge">{children}</span> }
function Comparison({ label, before, after }: { label: string; before: string | number; after: string | number }) {
  return <div className="level-comparison"><span>{label}</span><del>{before}</del><strong>{after}</strong></div>
}
function ChoiceCards({ title, choiceId, optionIds, choices, setChoices, count = 1 }: { title: string; choiceId: string; optionIds: string[]; choices: Record<string, string[]>; setChoices: React.Dispatch<React.SetStateAction<Record<string, string[]>>>; count?: number }) {
  const selected = choices[choiceId] ?? []
  return <section><Badge>Scelta richiesta</Badge><h2>{title}</h2><div className="compact-choice-grid">{optionIds.map((id) => <button key={id} className={selected.includes(id) ? 'active' : ''} onClick={() => setChoices((current) => {
    const values = current[choiceId] ?? []
    return { ...current, [choiceId]: values.includes(id) ? values.filter((item) => item !== id) : values.length < count ? [...values, id] : values }
  })}>{id}</button>)}</div></section>
}
function OptionList({ title, ids, registry }: { title: string; ids: string[]; registry: ReturnType<typeof useContentRegistry>['registry'] }) {
  return <section><Badge>Automatico</Badge><h2>{title}</h2><div className="level-option-list">{ids.map((id) => {
    const item = registry.find('feature', id)
    return <article key={id}><strong>{item?.nameIt ?? id}</strong>{item && <OfficialTermHelp item={item} />}</article>
  })}</div></section>
}

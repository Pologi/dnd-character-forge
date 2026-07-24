import { useRef, useState } from 'react'
import { abilityDefinitions, abilityLabel, classOptions } from '../../data/srd-5.2.1-it/catalog'
import {
  buildCumulativeCostTable,
  calculateAbilityModifier,
  calculateScoreCost,
  calculateTotalPointCost,
  createPhysicalRollGroup,
  generationToAbilityValues,
  officialPointCostConfiguration,
  parsePointCostConfigurationJson,
  rollAbilityGroup,
  rollSixAbilityGroups,
  validatePhysicalDice,
  validatePointCostConfiguration,
} from '../../rules/2024/abilityGenerationRules'
import { applyBackgroundBonuses, formatModifier, STANDARD_ARRAY } from '../../rules/2024/characterBuilderRules'
import type {
  AbilityGeneration,
  AbilityGenerationMethod,
  AbilityKey,
  CharacterDraft,
  CharacterFields,
  PointCostConfiguration,
} from '../../types/character'

interface Props {
  draft: CharacterDraft
  onField: <K extends keyof CharacterFields>(key: K, value: CharacterFields[K]) => void
}

const methodCards: {
  id: AbilityGenerationMethod
  icon: string
  title: string
  description: string
  randomness: string
  control: string
}[] = [
  { id: 'standard-array', icon: '⬡', title: 'Serie standard', description: 'Assegna una volta ciascuno i sei valori ufficiali.', randomness: 'Nessuna', control: 'Alto' },
  { id: 'random-roll', icon: '⚄', title: 'Tiro dei dadi', description: 'Tira 4d6, scarta il più basso e ripeti sei volte.', randomness: 'Alta', control: 'Medio' },
  { id: 'point-cost', icon: '◉', title: 'Acquisto con punti', description: 'Distribuisci un budget di 27 punti tra le caratteristiche.', randomness: 'Nessuna', control: 'Massimo' },
]

export function AbilitiesStep({ draft, onField }: Props) {
  const generation = draft.abilityGeneration
  const selectedClass = classOptions.find((option) => option.id === draft.classId)

  const updateGeneration = (next: AbilityGeneration) => {
    onField('abilityGeneration', next)
    onField('baseAbilities', generationToAbilityValues(next))
  }

  const selectMethod = (method: AbilityGenerationMethod) => {
    if (method === generation.method) return
    const hasScores = Object.values(draft.baseAbilities).some((score) => score !== null)
    if (hasScores && !window.confirm('Cambiare metodo azzererà le caratteristiche assegnate. Vuoi continuare?')) return
    const next = structuredClone(generation)
    next.method = method
    if (method === 'standard-array') next.standardArrayAssignments = {}
    if (method === 'random-roll') next.diceRolls = []
    if (method === 'point-cost') {
      const minimum = next.pointCost.configuration.minScore
      next.pointCost.scores = Object.fromEntries(abilityDefinitions.map((ability) => [ability.id, minimum])) as Record<AbilityKey, number>
      next.pointCost.spentPoints = 0
    }
    updateGeneration(next)
  }

  return (
    <div className="step-stack abilities-workbench">
      <section className="method-card-grid" aria-label="Metodo di generazione">
        {methodCards.map((method) => (
          <article className={`method-card ${generation.method === method.id ? 'selected' : ''}`} key={method.id}>
            <span className="method-icon" aria-hidden="true">{method.icon}</span>
            <Badge>Regola ufficiale 2024</Badge>
            <h2>{method.title}</h2>
            <p>{method.description}</p>
            <dl><div><dt>Casualità</dt><dd>{method.randomness}</dd></div><div><dt>Controllo</dt><dd>{method.control}</dd></div></dl>
            <button type="button" className="button button-small" onClick={() => selectMethod(method.id)}>
              {generation.method === method.id ? 'Metodo in uso' : 'Usa questo metodo'}
            </button>
          </article>
        ))}
      </section>

      {generation.method === 'standard-array' && <StandardArrayPanel draft={draft} onUpdate={updateGeneration} />}
      {generation.method === 'random-roll' && <DiceRollPanel draft={draft} onUpdate={updateGeneration} />}
      {generation.method === 'point-cost' && <PointCostPanel draft={draft} onUpdate={updateGeneration} />}

      <AbilityResults draft={draft} primaryAbilities={selectedClass?.primaryAbilities ?? []} />
      <section className="ability-guide">
        <Badge>{generation.pointCost.configuration.mode === 'custom' && generation.method === 'point-cost' ? 'Regola personalizzata del master' : 'Regole ufficiali 2024'}</Badge>
        <h2>Consigli per l’assegnazione</h2>
        <p>{generation.method === 'standard-array'
          ? 'Equilibrata e veloce. Tutti partono dagli stessi sei valori.'
          : generation.method === 'random-roll'
            ? 'Più imprevedibile. Puoi ottenere punteggi molto alti o molto bassi.'
            : generation.pointCost.configuration.mode === 'custom'
              ? 'Queste impostazioni modificano il metodo ufficiale. Verifica che siano state approvate dal master.'
              : 'Ti permette di costruire esattamente le caratteristiche che desideri.'}</p>
        <ul>
          <li>Il valore maggiore nella caratteristica primaria rende più efficaci molte capacità della classe.</li>
          <li>Costituzione contribuisce ai punti ferita ed è utile a quasi ogni personaggio.</li>
          <li>Il metodo produce il valore base; il Background viene applicato dopo. La Specie non aggiunge bonus.</li>
          <li>I suggerimenti sono indicazioni, non obblighi.</li>
        </ul>
      </section>
    </div>
  )
}

function StandardArrayPanel({ draft, onUpdate }: { draft: CharacterDraft; onUpdate: (next: AbilityGeneration) => void }) {
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const assignments = draft.abilityGeneration.standardArrayAssignments
  const selectedClass = classOptions.find((option) => option.id === draft.classId)

  const assign = (ability: AbilityKey, value: number) => {
    const next = structuredClone(draft.abilityGeneration)
    for (const key of Object.keys(next.standardArrayAssignments) as AbilityKey[]) {
      if (next.standardArrayAssignments[key] === value) delete next.standardArrayAssignments[key]
    }
    next.standardArrayAssignments[ability] = value
    setSelectedValue(null)
    onUpdate(next)
  }

  const recommend = () => {
    const priority: AbilityKey[] = [
      ...(selectedClass?.primaryAbilities ?? []),
      'constitution', 'dexterity', 'wisdom', 'charisma', 'intelligence', 'strength',
    ].filter((ability, index, list) => list.indexOf(ability) === index) as AbilityKey[]
    const next = structuredClone(draft.abilityGeneration)
    next.standardArrayAssignments = Object.fromEntries(priority.slice(0, 6).map((ability, index) => [ability, STANDARD_ARRAY[index]]))
    onUpdate(next)
  }

  return <section className="generation-panel">
    <div className="panel-heading"><div><Badge>Regole ufficiali 2024</Badge><h2>Serie standard</h2></div><div className="panel-actions">
      <button type="button" className="button button-ghost button-small" onClick={recommend}>Assegnazione consigliata</button>
      <button type="button" className="button button-ghost button-small" onClick={() => {
        const next = structuredClone(draft.abilityGeneration)
        next.standardArrayAssignments = {}
        onUpdate(next)
      }}>Azzera assegnazione</button>
    </div></div>
    <p>Seleziona una tessera, poi una caratteristica; oppure trascinala sulla destinazione.</p>
    <div className="score-tile-bank">{STANDARD_ARRAY.map((value) => {
      const usedBy = (Object.entries(assignments) as [AbilityKey, number][]).find(([, score]) => score === value)?.[0]
      return <button
        type="button"
        draggable={!usedBy}
        className={`score-tile ${selectedValue === value ? 'active' : ''} ${usedBy ? 'used' : ''}`}
        key={value}
        aria-pressed={selectedValue === value}
        disabled={Boolean(usedBy)}
        onClick={() => setSelectedValue(selectedValue === value ? null : value)}
        onDragStart={(event) => event.dataTransfer.setData('text/plain', String(value))}
      ><strong>{value}</strong><small>{usedBy ? abilityLabel(usedBy) : 'Disponibile'}</small></button>
    })}</div>
    <div className="assignment-grid">{abilityDefinitions.map((ability) => (
      <button
        type="button"
        key={ability.id}
        className={`assignment-slot ${selectedClass?.primaryAbilities.includes(ability.id) ? 'primary' : ''}`}
        onClick={() => {
          if (selectedValue !== null) assign(ability.id, selectedValue)
          else if (assignments[ability.id] !== undefined) {
            const next = structuredClone(draft.abilityGeneration)
            delete next.standardArrayAssignments[ability.id]
            onUpdate(next)
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const value = Number(event.dataTransfer.getData('text/plain'))
          if (STANDARD_ARRAY.includes(value as never)) assign(ability.id, value)
        }}
      ><span>{ability.nameIt}{selectedClass?.primaryAbilities.includes(ability.id) && ' ★'}</span><strong>{assignments[ability.id] ?? '—'}</strong></button>
    ))}</div>
  </section>
}

function DiceRollPanel({ draft, onUpdate }: { draft: CharacterDraft; onUpdate: (next: AbilityGeneration) => void }) {
  const [physicalMode, setPhysicalMode] = useState(false)
  const [physicalDice, setPhysicalDice] = useState<string[][]>(() => Array.from({ length: 6 }, () => ['', '', '', '']))
  const [error, setError] = useState('')
  const [rolling, setRolling] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const rolls = draft.abilityGeneration.diceRolls

  const animate = (action: () => void) => {
    setRolling(true)
    action()
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setRolling(false), 420)
  }

  const updateRolls = (nextRolls: typeof rolls) => {
    const next = structuredClone(draft.abilityGeneration)
    next.diceRolls = nextRolls
    onUpdate(next)
  }

  const savePhysical = () => {
    try {
      const groups = physicalDice.map((group, index) => {
        const dice = group.map(Number)
        const errors = validatePhysicalDice(dice)
        if (errors.length) throw new Error(`Gruppo ${index + 1}: ${errors[0]}`)
        return createPhysicalRollGroup(dice as [number, number, number, number], new Date().toISOString(), `ability-roll-${index}`)
      })
      setError('')
      updateRolls(groups)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'I dadi inseriti non sono validi.')
    }
  }

  return <section className="generation-panel">
    <div className="panel-heading"><div><Badge>Regole ufficiali 2024</Badge><h2>Tiro dei dadi · 4d6, scarta il più basso</h2></div><div className="panel-actions">
      <button type="button" className="button button-small" onClick={() => animate(() => updateRolls(rollSixAbilityGroups().map((roll, index) => ({ ...roll, id: `ability-roll-${index}` }))))}>Tira tutti</button>
      <button type="button" className="button button-ghost button-small" onClick={() => setPhysicalMode((open) => !open)}>Inserisci dadi fisici</button>
      <button type="button" className="button button-ghost button-small" onClick={() => updateRolls([])}>Azzera tutti i tiri</button>
    </div></div>
    {physicalMode && <div className="physical-dice-panel">
      <p>Inserisci i quattro risultati di ogni gruppo. Il totale non è modificabile direttamente.</p>
      {physicalDice.map((group, groupIndex) => <div className="physical-row" key={groupIndex}><b>Gruppo {groupIndex + 1}</b>{group.map((die, dieIndex) => (
        <input key={dieIndex} inputMode="numeric" aria-label={`Gruppo ${groupIndex + 1}, dado ${dieIndex + 1}`} value={die} onChange={(event) => setPhysicalDice((current) => current.map((row, rowIndex) => rowIndex === groupIndex ? row.map((value, index) => index === dieIndex ? event.target.value : value) : row))} />
      ))}</div>)}
      <button type="button" className="button button-small" onClick={savePhysical}>Calcola e salva i dadi fisici</button>
      {error && <p className="inline-warning" role="alert">{error}</p>}
    </div>}
    <div className={`dice-groups ${rolling ? 'rolling' : ''}`}>
      {Array.from({ length: 6 }, (_, index) => {
        const roll = rolls.find((item) => item.id === `ability-roll-${index}`)
        return <article className="dice-group" key={roll?.id ?? index}>
          <div className="dice-group-title"><b>Gruppo {index + 1}</b><span>{roll?.assignedAbility ? `Assegnato: ${abilityLabel(roll.assignedAbility)}` : 'Non assegnato'}</span></div>
          <div className="dice-row">{roll ? roll.dice.map((die, dieIndex) => <span className={dieIndex === roll.droppedDieIndex ? 'dropped' : ''} key={dieIndex}>{die}</span>) : [0, 1, 2, 3].map((die) => <span className="empty" key={die}>?</span>)}</div>
          <strong className="roll-total">Totale: {roll?.total ?? '—'}</strong>
          <div className="dice-controls">
            <button type="button" className="button button-ghost button-small" onClick={() => animate(() => {
              const replacement = rollAbilityGroup(undefined, new Date().toISOString(), `ability-roll-${index}`)
              if (roll?.assignedAbility) replacement.assignedAbility = roll.assignedAbility
              const nextRolls = [...rolls.filter((item) => item.id !== replacement.id), replacement]
              updateRolls(nextRolls)
            })}>Tira questo gruppo</button>
            {roll && <select aria-label={`Assegna gruppo ${index + 1}`} value={roll.assignedAbility ?? ''} onChange={(event) => {
              const ability = event.target.value as AbilityKey | ''
              const nextRolls = rolls.map((item) => ({
                ...item,
                assignedAbility: item.id === roll.id ? ability || undefined : item.assignedAbility === ability ? undefined : item.assignedAbility,
              }))
              updateRolls(nextRolls)
            }}><option value="">Non assegnato</option>{abilityDefinitions.map((ability) => <option key={ability.id} value={ability.id}>{ability.nameIt}</option>)}</select>}
          </div>
        </article>
      })}
    </div>
  </section>
}

function PointCostPanel({ draft, onUpdate }: { draft: CharacterDraft; onUpdate: (next: AbilityGeneration) => void }) {
  const pointCost = draft.abilityGeneration.pointCost
  const config = pointCost.configuration
  const [customDraft, setCustomDraft] = useState<PointCostConfiguration>(() => structuredClone(config))
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const selectedClass = classOptions.find((option) => option.id === draft.classId)
  const spent = calculateTotalPointCost(pointCost.scores, config)
  const remaining = config.budget - spent

  const applyConfig = (configuration: PointCostConfiguration) => {
    const errors = validatePointCostConfiguration(configuration)
    if (errors.length) {
      setError(errors.join(' '))
      return
    }
    const next = structuredClone(draft.abilityGeneration)
    next.pointCost.configuration = structuredClone(configuration)
    next.pointCost.scores = Object.fromEntries(abilityDefinitions.map((ability) => [ability.id, configuration.minScore])) as Record<AbilityKey, number>
    next.pointCost.spentPoints = 0
    setCustomDraft(structuredClone(configuration))
    setError('')
    onUpdate(next)
  }

  const resetOfficial = () => applyConfig(officialPointCostConfiguration())

  const changeScore = (ability: AbilityKey, delta: number) => {
    const current = pointCost.scores[ability]
    const candidate = current + delta
    if (candidate < config.minScore || candidate > config.maxScore) return
    const nextScores = { ...pointCost.scores, [ability]: candidate }
    const nextSpent = calculateTotalPointCost(nextScores, config)
    if (nextSpent > config.budget) return
    const next = structuredClone(draft.abilityGeneration)
    next.pointCost.scores = nextScores
    next.pointCost.spentPoints = nextSpent
    onUpdate(next)
  }

  const activateCustom = () => {
    if (!window.confirm('Le modifiche seguenti non fanno parte del metodo ufficiale D&D 5e 2024. Usale soltanto se approvate dal master.')) return
    setCustomDraft({ ...structuredClone(config), mode: 'custom' })
  }

  return <section className="generation-panel">
    <div className="panel-heading"><div><Badge>{config.mode === 'custom' ? 'Regola personalizzata del master' : 'Regole ufficiali 2024'}</Badge><h2>Acquisto con punti</h2></div><button type="button" className="button button-ghost button-small" onClick={resetOfficial}>Ripristina regole ufficiali</button></div>
    <div className="budget-panel">
      <div><span>Punti utilizzati <b>{spent}</b></span><span>Disponibili <b>{config.budget}</b></span><span>Rimanenti <b>{remaining}</b></span></div>
      <progress max={config.budget} value={spent}>{spent}/{config.budget}</progress>
    </div>
    <div className="point-score-grid">{abilityDefinitions.map((ability) => {
      const score = pointCost.scores[ability.id]
      const nextCost = score < config.maxScore ? config.stepCosts[`${score}-${score + 1}`] : null
      return <article className={`point-score-card ${selectedClass?.primaryAbilities.includes(ability.id) ? 'primary' : ''}`} key={ability.id}>
        <h3>{ability.nameIt}{selectedClass?.primaryAbilities.includes(ability.id) && ' ★'}</h3>
        <div className="score-stepper"><button type="button" aria-label={`Riduci ${ability.nameIt}`} disabled={score <= config.minScore} onClick={() => changeScore(ability.id, -1)}>−</button><strong>{score}</strong><button type="button" aria-label={`Aumenta ${ability.nameIt}`} disabled={score >= config.maxScore || (nextCost ?? 0) > remaining} onClick={() => changeScore(ability.id, 1)}>+</button></div>
        <dl><div><dt>Costo totale</dt><dd>{calculateScoreCost(score, config)}</dd></div><div><dt>Prossimo incremento</dt><dd>{nextCost === null ? 'Massimo' : `${nextCost} pt`}</dd></div><div><dt>Modificatore</dt><dd>{formatSigned(calculateAbilityModifier(score))}</dd></div></dl>
      </article>
    })}</div>

    <details className="master-rules">
      <summary>Regole personalizzate del master</summary>
      <p className="inline-warning neutral">Le modifiche seguenti non fanno parte del metodo ufficiale D&D 5e 2024. Usale soltanto se approvate dal master.</p>
      {customDraft.mode !== 'custom' ? <button type="button" className="button button-ghost" onClick={activateCustom}>Conferma e configura</button> : <>
        <div className="custom-config-grid">
          <label>Budget totale<input type="number" value={customDraft.budget} onChange={(event) => setCustomDraft({ ...customDraft, budget: Number(event.target.value) })} /></label>
          <label>Valore minimo<input type="number" value={customDraft.minScore} onChange={(event) => rebuildCustomRange(customDraft, Number(event.target.value), customDraft.maxScore, setCustomDraft)} /></label>
          <label>Valore massimo<input type="number" value={customDraft.maxScore} onChange={(event) => rebuildCustomRange(customDraft, customDraft.minScore, Number(event.target.value), setCustomDraft)} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={customDraft.allowUnspentPoints} onChange={(event) => setCustomDraft({ ...customDraft, allowUnspentPoints: event.target.checked })} /> Permetti punti inutilizzati</label>
        </div>
        {customDraft.maxScore > customDraft.minScore && customDraft.maxScore - customDraft.minScore <= 20 && <div className="step-cost-grid">{Array.from({ length: customDraft.maxScore - customDraft.minScore }, (_, index) => {
          const from = customDraft.minScore + index
          const key = `${from}-${from + 1}`
          return <label key={key}>{from} → {from + 1}<input type="number" min="0" step="1" value={customDraft.stepCosts[key] ?? ''} onChange={(event) => setCustomDraft({ ...customDraft, stepCosts: { ...customDraft.stepCosts, [key]: Number(event.target.value) } })} /></label>
        })}</div>}
        <div className="panel-actions">
          <button type="button" className="button button-small" onClick={() => applyConfig(customDraft)}>Salva configurazione</button>
          <button type="button" className="button button-ghost button-small" onClick={resetOfficial}>Ripristina metodo ufficiale</button>
          <button type="button" className="button button-ghost button-small" onClick={() => exportConfiguration(customDraft)}>Esporta configurazione</button>
          <button type="button" className="button button-ghost button-small" onClick={() => fileRef.current?.click()}>Importa configurazione</button>
          <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => importConfiguration(event, setCustomDraft, setError)} />
        </div>
      </>}
      {error && <p className="inline-warning" role="alert">{error}</p>}
      {customDraft.mode === 'custom' && validatePointCostConfiguration(customDraft).length === 0 && <p className="config-preview">Costi cumulativi: {Object.entries(buildCumulativeCostTable(customDraft)).map(([score, cost]) => `${score} = ${cost}`).join(' · ')}</p>}
    </details>
  </section>
}

function AbilityResults({ draft, primaryAbilities }: { draft: CharacterDraft; primaryAbilities: AbilityKey[] }) {
  const finalScores = applyBackgroundBonuses(draft.baseAbilities, draft.backgroundBonuses)
  return <section className="ability-results"><h2>Valori risultanti</h2><div className="ability-result-grid">{abilityDefinitions.map((ability) => {
    const base = draft.baseAbilities[ability.id]
    const bonus = draft.backgroundBonuses[ability.id]
    const final = finalScores[ability.id]
    return <article className={primaryAbilities.includes(ability.id) ? 'primary' : ''} key={ability.id}>
      <h3>{ability.nameIt}{primaryAbilities.includes(ability.id) && ' ★'}</h3>
      <dl>
        <div><dt>Valore base</dt><dd>{base ?? '—'}</dd></div>
        <div><dt>Background</dt><dd>{formatSigned(bonus)}</dd></div>
        <div><dt>Valore finale</dt><dd>{final ?? '—'}</dd></div>
        <div><dt>Modificatore</dt><dd>{final === null ? '—' : formatModifier(final)}</dd></div>
      </dl>
    </article>
  })}</div><p>La Specie non modifica i punteggi di caratteristica.</p></section>
}

function rebuildCustomRange(current: PointCostConfiguration, minScore: number, maxScore: number, setValue: (value: PointCostConfiguration) => void) {
  const stepCosts: Record<string, number> = {}
  if (Number.isInteger(minScore) && Number.isInteger(maxScore) && maxScore - minScore <= 20) {
    for (let score = minScore; score < maxScore; score += 1) stepCosts[`${score}-${score + 1}`] = current.stepCosts[`${score}-${score + 1}`] ?? 1
  }
  setValue({ ...current, minScore, maxScore, stepCosts })
}

function exportConfiguration(configuration: PointCostConfiguration) {
  const blob = new Blob([JSON.stringify(configuration, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'dnd-character-forge-point-cost.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

function importConfiguration(
  event: React.ChangeEvent<HTMLInputElement>,
  setValue: (value: PointCostConfiguration) => void,
  setError: (value: string) => void,
) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const configuration = parsePointCostConfigurationJson(String(reader.result))
      setValue(configuration)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? `JSON non valido: ${cause.message}` : 'JSON personalizzato non valido.')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value)
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="info-badge">{children}</span>
}

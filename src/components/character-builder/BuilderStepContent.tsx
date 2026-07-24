import { useMemo, useState } from 'react'
import {
  PHB_AASIMAR_PRESENTATION,
  abilityLabel,
  backgroundDetermines,
  classOptions,
  inspirationOptions,
  languageOptions,
  personalityPrompts,
  speciesOptions,
  speciesPrinciples,
} from '../../data/srd-5.2.1-it/catalog'
import type {
  AbilityKey,
  BuilderStep,
  CharacterDraft,
  CharacterFields,
  CharacterClass,
  Background,
  RequiredChoice,
  Species,
} from '../../types/character'
import { AbilitiesStep } from './AbilitiesStep'
import { useContentRegistry } from '../../content/ContentRegistryContext'
import { OfficialTermHelp } from '../OfficialTermHelp'
import type { RegistryContentItem } from '../../types/privateContent'

interface Props {
  step: BuilderStep
  draft: CharacterDraft
  onField: <K extends keyof CharacterFields>(key: K, value: CharacterFields[K]) => void
}

export function BuilderStepContent({ step, draft, onField }: Props) {
  const { registry } = useContentRegistry()
  const availableClasses = registry.builderClasses()
  const availableSpecies = registry.builderSpecies()
  const availableBackgrounds = registry.builderBackgrounds()
  const [classFilter, setClassFilter] = useState('tutte')
  const [expandedClass, setExpandedClass] = useState('')
  const [expandedSpecies, setExpandedSpecies] = useState('')

  const filteredClasses = useMemo(() => classFilter === 'tutte'
    ? availableClasses
    : availableClasses.filter((option) => option.filters.includes(classFilter as never)), [availableClasses, classFilter])

  if (step.id === 'intro') return (
    <div className="step-stack">
      <div className="intro-fields">
        <Field label="Nome del personaggio" required><input autoFocus value={draft.name} onChange={(e) => onField('name', e.target.value)} /></Field>
        <Field label="Nome del giocatore"><input value={draft.playerName} onChange={(e) => onField('playerName', e.target.value)} /></Field>
        <Field label="Livello iniziale">
          <select value={draft.requestedLevel} onChange={(event) => onField('requestedLevel', Number(event.target.value) as CharacterFields['requestedLevel'])}>
            {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </Field>
        <Field label="Idea iniziale" wide><textarea rows={3} value={draft.initialIdea} onChange={(e) => onField('initialIdea', e.target.value)} /></Field>
      </div>
      <section className="choice-section">
        <h2>Quale immagine ti ispira?</h2>
        <div className="inspiration-grid">
          {inspirationOptions.map((option) => (
            <button type="button" key={option.id} aria-pressed={draft.inspirationId === option.id} className={`visual-choice inspiration-card ${draft.inspirationId === option.id ? 'selected' : ''}`} onClick={() => onField('inspirationId', option.id)}>
              <span className="choice-art">{option.icon}</span><strong>{option.nameIt}</strong><small>{option.description}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  )

  if (step.id === 'class') {
    const filters = [
      ['tutte', 'Tutte'], ['facile', 'Semplici per principianti'], ['marziali', 'Marziali'],
      ['incantatori', 'Incantatori'], ['supporto', 'Supporto'], ['furtività', 'Furtività'],
      ['distanza', 'Combattimento a distanza'], ['mischia', 'Combattimento in mischia'],
    ]
    return (
      <div className="step-stack">
        <div className="filter-row">{filters.map(([id, label]) => <button type="button" className={classFilter === id ? 'active' : ''} key={id} onClick={() => setClassFilter(id)}>{label}</button>)}</div>
        <div className="class-card-grid">
          {filteredClasses.map((option) => (
            <article className={`visual-choice class-card ${draft.classId === option.id ? 'selected' : ''}`} key={option.id}>
              <button type="button" className="card-select-area" onClick={() => {
                onField('classId', option.id)
                onField('classSkillIds', [])
                onField('classOptionSelections', {})
                onField('equipmentChoiceIds', [])
              }}>
                <span className="class-art"><i>{option.icon}</i></span>
                <span className="card-title-line"><strong>{option.nameIt}</strong><small>{option.role}</small></span>
                <span className="card-description">{option.shortDescription}</span>
                <span className="badge-row"><Badge>{option.source.isSrdContent ? 'SRD 5.2.1 ufficiale' : 'Pacchetto privato'}</Badge><Badge>{option.complexity}</Badge></span>
                <span className="primary-label">Principale: <b>{option.primaryAbilities.map(abilityLabel).join(' e ')}</b></span>
                <span className="primary-label">Dado Vita: <b>d{option.hitDie}</b> · Magia: <b>{option.hasLevelOneSpells ? 'Sì' : 'No'}</b></span>
                <span className="badge-row">{option.styles.map((style) => <Badge key={style}>{style}</Badge>)}</span>
              </button>
              {registry.find('class', option.id) && <span className="card-term-help"><OfficialTermHelp item={registry.find('class', option.id)!} /></span>}
              <button type="button" className="learn-more" onClick={() => setExpandedClass(expandedClass === option.id ? '' : option.id)}>Scopri di più</button>
              {expandedClass === option.id && <ClassDetails option={option} />}
              {draft.classId === option.id && <span className="selected-ribbon">✓ Selezionata</span>}
            </article>
          ))}
        </div>
      </div>
    )
  }

  if (step.id === 'background') return (
    <div className="step-stack">
      <Info title="Il Background nel 2024">{backgroundDetermines.map((item) => <span key={item}>{item}</span>)}</Info>
      <div className="rule-card-grid">{availableBackgrounds.map((option) => (
        <article key={option.id} className={`visual-choice rule-card ${draft.backgroundId === option.id ? 'selected' : ''}`}>
          <button type="button" className="card-select-area" onClick={() => onField('backgroundId', option.id)}>
            <span className="choice-art">{option.icon}</span><Badge>{option.source.isSrdContent ? 'SRD 5.2.1 ufficiale' : 'Pacchetto privato'}</Badge><strong>{option.nameIt}</strong><small>{option.shortDescription}</small>
          </button>
          {registry.find('background', option.id) && <span className="card-term-help"><OfficialTermHelp item={registry.find('background', option.id)!} /></span>}
        </article>
      ))}</div>
    </div>
  )

  if (step.id === 'species') return (
    <div className="step-stack">
      <Info title="Un punto importante">{speciesPrinciples.map((item) => <span key={item}>{item}</span>)}</Info>
      <div className="species-card-grid rule-card-grid">
        <AasimarCard draft={draft} onField={onField} option={availableSpecies.find((item) => item.id === PHB_AASIMAR_PRESENTATION.id)} />
        {availableSpecies.filter((item) => item.id !== PHB_AASIMAR_PRESENTATION.id).map((option) => (
          <article className={`visual-choice rule-card species-card ${draft.speciesId === option.id ? 'selected' : ''}`} key={option.id}>
            <button type="button" className="card-select-area" onClick={() => {
              onField('speciesId', option.id)
              onField('speciesOptionSelections', {})
              onField('officialBookSpeciesConfirmed', false)
              onField('officialBookSpeciesNotes', '')
            }}>
              <span className="choice-art">{option.icon}</span>
              <span className="badge-row"><Badge>{option.source.isSrdContent ? 'SRD 5.2.1 ufficiale' : 'Pacchetto privato'}</Badge><Badge>{option.complexity}</Badge></span>
              <strong>{option.nameIt}</strong><small>{option.shortDescription}</small>
              <span>Taglia: <b>{option.size}</b> · Velocità: <b>{option.speedMeters} m</b></span>
              <span>{option.traits.slice(0, 3).map((trait) => trait.nameIt).join(' · ')}</span>
              <span>{option.requiredChoices.length} gruppi di scelte aggiuntive</span>
            </button>
            {registry.find('species', option.id) && <span className="card-term-help"><OfficialTermHelp item={registry.find('species', option.id)!} /></span>}
            <button type="button" className="learn-more" onClick={() => setExpandedSpecies(expandedSpecies === option.id ? '' : option.id)}>Dettagli</button>
            {expandedSpecies === option.id && <SpeciesDetails option={option} />}
          </article>
        ))}
      </div>
    </div>
  )

  if (step.id === 'languages') return (
    <div className="step-stack">
      <div className="selection-counter"><span>Linguaggi selezionati</span><strong>{draft.languages.length}/2</strong></div>
      <div className="language-grid">{[
        ...languageOptions,
        ...registry.selectable('language')
          .filter((item) => item.origin === 'private-pack')
          .map((item) => ({
            id: `private:language:${item.id}`,
            nameIt: item.nameIt,
            description: typeof item.mechanics.description === 'string' ? item.mechanics.description : '',
          })),
      ].map((language) => {
        const selected = draft.languages.includes(language.id)
        return <button type="button" key={language.id} disabled={!selected && draft.languages.length >= 2} className={`visual-choice language-card ${selected ? 'selected' : ''}`} onClick={() => onField('languages', selected ? draft.languages.filter((id) => id !== language.id) : [...draft.languages, language.id])}>
          <strong>{language.nameIt}</strong><small>{language.description}</small>
        </button>
      })}</div>
    </div>
  )

  if (step.id === 'abilities') return <AbilitiesStep draft={draft} onField={onField} />

  if (step.id === 'class-choices') {
    const selectedClass = availableClasses.find((option) => option.id === draft.classId)
    const selectedSpecies = availableSpecies.find((option) => option.id === draft.speciesId)
    if (!selectedClass) return <p className="inline-warning">Scegli prima una classe.</p>
    return (
      <div className="step-stack">
        <ChoiceGroup title={`Abilità di ${selectedClass.nameIt}`} count={selectedClass.skillChoiceCount} options={selectedClass.skillChoices.map((label) => ({ id: label, label }))} selected={draft.classSkillIds} onChange={(value) => onField('classSkillIds', value)} />
        {selectedClass.requiredChoices.map((choice) => <StructuredChoice
          key={choice.id}
          choice={choice.id === 'expertise' ? { ...choice, options: draft.classSkillIds.map((label) => ({ id: label, label })) } : choice}
          selected={draft.classOptionSelections[choice.id] ?? []}
          onChange={(value) => onField('classOptionSelections', { ...draft.classOptionSelections, [choice.id]: value })}
        />)}
        {selectedSpecies?.requiredChoices.map((choice) => <StructuredChoice key={choice.id} choice={{ ...choice, label: `${selectedSpecies.nameIt}: ${choice.label}` }} selected={draft.speciesOptionSelections[choice.id] ?? []} onChange={(value) => onField('speciesOptionSelections', { ...draft.speciesOptionSelections, [choice.id]: value })} />)}
        <PrivateRegistryChoice
          title="Sottoclasse dal pacchetto privato"
          items={registry.selectable('subclass').filter((item) => {
            const classId = item.mechanics.classId
            return classId === draft.classId || classId === `srd:${draft.classId}`
          })}
          selected={draft.classOptionSelections['private-subclass'] ?? []}
          onChange={(value) => onField('classOptionSelections', { ...draft.classOptionSelections, 'private-subclass': value })}
        />
        <PrivateRegistryChoice
          title="Talento dal pacchetto privato"
          items={registry.selectable('feat').filter((item) => item.origin === 'private-pack')}
          selected={draft.classOptionSelections['private-feat'] ?? []}
          onChange={(value) => onField('classOptionSelections', { ...draft.classOptionSelections, 'private-feat': value })}
        />
        {draft.speciesId === PHB_AASIMAR_PRESENTATION.id && <Field label="Note personali Aasimar (solo localStorage)" wide><textarea rows={6} value={draft.officialBookSpeciesNotes} onChange={(e) => onField('officialBookSpeciesNotes', e.target.value)} placeholder="Trascrivi soltanto le tue note personali consultando il manuale ufficiale." /></Field>}
        <Info title="Applicato automaticamente">
          <span>Dado Vita d{selectedClass.hitDie}; PF al 1º livello: {selectedClass.levelOneHitPoints}</span>
          <span>Tiri salvezza: {selectedClass.savingThrows.map(abilityLabel).join(', ')}</span>
          <span>Bonus di competenza: +2</span>
          <span>Capacità: {selectedClass.levelOneFeatures.map((feature) => feature.nameIt).join(', ')}</span>
        </Info>
      </div>
    )
  }

  if (step.id === 'equipment') {
    const selectedClass = availableClasses.find((option) => option.id === draft.classId)
    if (!selectedClass) return null
    const options = [...selectedClass.startingEquipment, { id: 'gold', label: `${selectedClass.goldAlternative} mo` }]
    const privateEquipment = ['weapon', 'armor', 'equipment', 'tool'].flatMap((category) =>
      registry.selectable(category as 'weapon' | 'armor' | 'equipment' | 'tool').filter((item) => item.origin === 'private-pack'))
    return <div className="step-stack"><h2>Equipaggiamento di {selectedClass.nameIt}</h2><div className="rule-card-grid">{options.map((option) => (
      <button type="button" key={option.id} className={`visual-choice rule-card ${draft.equipmentChoiceIds[0] === option.id ? 'selected' : ''}`} onClick={() => onField('equipmentChoiceIds', [option.id])}>
        <strong>{option.id === 'gold' ? 'Alternativa in monete' : `Opzione ${option.id.toUpperCase()}`}</strong><small>{option.label}</small>
      </button>
    ))}</div>
      {privateEquipment.length > 0 && <PrivateRegistryChoice
        title="Oggetti dal pacchetto privato"
        items={privateEquipment}
        multiple
        selected={draft.equipmentChoiceIds.filter((id) => id.startsWith('private:'))}
        onChange={(value) => onField('equipmentChoiceIds', value)}
      />}
      <SourceLine page={selectedClass.source.sourcePage} section={selectedClass.source.sourceSection} />
    </div>
  }

  if (step.id === 'spells') {
    const selectedClass = availableClasses.find((option) => option.id === draft.classId)
    const magic = selectedClass?.spellcasting
    const privateSpells = registry.selectable('spell').filter((item) => {
      const lists = Array.isArray(item.mechanics.listIds) ? item.mechanics.listIds : []
      return lists.includes(draft.classId) || lists.includes(`srd:${draft.classId}`)
    })
    return magic ? <div className="step-stack"><Info title={`Incantesimi di ${selectedClass.nameIt} al livello 1`}>
      <span>Caratteristica da incantatore: {abilityLabel(magic.ability)}</span>
      <span>Trucchetti: {magic.cantrips}</span><span>Incantesimi preparati: {magic.preparedSpells}</span>
      {magic.spellbookSpells && <span>Incantesimi iniziali nel libro: {magic.spellbookSpells}</span>}
      <span>Slot di 1º livello: {magic.levelOneSlots}</span>
    </Info>
      <PrivateRegistryChoice
        title="Incantesimi dal pacchetto privato"
        items={privateSpells}
        multiple
        selected={draft.spellChoiceIds}
        onChange={(value) => onField('spellChoiceIds', value)}
      />
      {privateSpells.length === 0 && <p className="placeholder-caption">Il catalogo SRD degli incantesimi non è ancora implementato. Un pacchetto privato verificato può completare questa sezione.</p>}
    </div> : null
  }

  if (step.id === 'personality') return (
    <div className="personality-grid">{(Object.entries(personalityPrompts) as [keyof typeof personalityPrompts, (typeof personalityPrompts)[keyof typeof personalityPrompts]][]).map(([key, prompt]) => (
      <Field key={key} label={prompt.label} wide={key === 'backstory'}><textarea rows={key === 'backstory' ? 6 : 3} value={draft[key]} onChange={(e) => onField(key, e.target.value)} placeholder={`${prompt.help} ${prompt.example}`} /></Field>
    ))}</div>
  )

  return <FinalSummary draft={draft} classes={availableClasses} species={availableSpecies} backgrounds={availableBackgrounds} />
}

function ClassDetails({ option }: { option: CharacterClass }) {
  return <div className="official-detail-panel">
    <p>{option.howToPlay}</p>
    <h4>Punti di forza</h4><ul>{option.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
    <h4>Aspetti da gestire</h4><ul>{option.considerations.map((x) => <li key={x}>{x}</li>)}</ul>
    <h4>Capacità di livello 1</h4><ul>{option.levelOneFeatures.map((x) => <li key={x.id}><b>{x.nameIt}:</b> {x.summary}</li>)}</ul>
    <p><b>Competenze:</b> {option.armorProficiencies.join(', ') || 'Nessuna armatura'}; {option.weaponProficiencies.join(', ')}.</p>
    <p><b>Equipaggiamento:</b> {option.startingEquipment.map((x) => x.label).join(' oppure ')}; alternativa {option.goldAlternative} mo.</p>
    <h4>Suggerimenti non vincolanti</h4><ul>{option.suggestions.map((x) => <li key={x}>{x}</li>)}</ul>
    <SourceLine page={option.source.sourcePage} section={option.source.sourceSection} />
  </div>
}

function SpeciesDetails({ option }: { option: Species }) {
  return <div className="official-detail-panel">
    <p><b>Tipo:</b> {option.creatureType} · <b>Taglia:</b> {option.size} · <b>Velocità:</b> {option.speedMeters} m</p>
    {option.darkvisionMeters && <p><b>Scurovisione:</b> {option.darkvisionMeters} m</p>}
    {option.resistances.length > 0 && <p><b>Resistenze:</b> {option.resistances.join(', ')}</p>}
    <ul>{option.traits.map((trait) => <li key={trait.id}><b>{trait.nameIt} (liv. {trait.level}):</b> {trait.summary}</li>)}</ul>
    {option.speciesSpells.length > 0 && <p><b>Magia della specie:</b> {option.speciesSpells.map((spell) => `${spell.nameIt}, liv. ${spell.levelGained}`).join('; ')}</p>}
    <SourceLine page={option.source.sourcePage} section={option.source.sourceSection} />
  </div>
}

function AasimarCard({ draft, onField, option }: Pick<Props, 'draft' | 'onField'> & { option?: Species }) {
  const installed = Boolean(option)
  return <article className={`visual-choice rule-card species-card aasimar-card ${draft.speciesId === PHB_AASIMAR_PRESENTATION.id ? 'selected' : ''}`}>
    <span className="choice-art">{PHB_AASIMAR_PRESENTATION.icon}</span>
    <span className="badge-row"><Badge>Manuale del Giocatore 2024</Badge><Badge>Contenuto non incluso nello SRD</Badge></span>
    <strong>Aasimar</strong><b>{installed ? 'Pacchetto verificato' : 'Manuale richiesto'}</b>
    {installed
      ? <small>{option?.shortDescription}</small>
      : <small>Questa opzione richiede il Pacchetto Manuale del Giocatore 2024.</small>}
    <button type="button" className="learn-more" disabled={!installed} onClick={() => {
      onField('speciesId', PHB_AASIMAR_PRESENTATION.id)
      onField('speciesOptionSelections', {})
      onField('officialBookSpeciesConfirmed', true)
    }}>Seleziona Aasimar</button>
  </article>
}

function StructuredChoice({ choice, selected, onChange }: { choice: RequiredChoice; selected: string[]; onChange: (value: string[]) => void }) {
  return <ChoiceGroup title={choice.label} count={choice.count} options={choice.options} selected={selected} onChange={onChange} />
}

function PrivateRegistryChoice({ title, items, selected, onChange, multiple = false }: {
  title: string
  items: RegistryContentItem[]
  selected: string[]
  onChange: (value: string[]) => void
  multiple?: boolean
}) {
  if (items.length === 0) return null
  return <section className="choice-section">
    <h2>{title}</h2>
    <div className="compact-choice-grid">{items.map((item) => {
      const value = `private:${item.category}:${item.id}`
      const active = selected.includes(value)
      return <span className="private-choice-with-help" key={value}>
        <button type="button" className={active ? 'active' : ''} onClick={() => {
          if (!multiple) onChange(active ? [] : [value])
          else onChange(active ? selected.filter((id) => id !== value) : [...selected, value])
        }}>{active ? '✓ ' : ''}{item.nameIt}</button>
        <OfficialTermHelp item={item} />
      </span>
    })}</div>
  </section>
}

function ChoiceGroup({ title, count, options, selected, onChange }: { title: string; count: number; options: { id: string; label: string; summary?: string }[]; selected: string[]; onChange: (value: string[]) => void }) {
  return <section className="choice-section"><h2>{title} <small>{selected.length}/{count}</small></h2><div className="compact-choice-grid">{options.map((option) => {
    const active = selected.includes(option.id)
    return <button type="button" key={option.id} className={active ? 'active' : ''} disabled={!active && selected.length >= count} onClick={() => onChange(active ? selected.filter((id) => id !== option.id) : [...selected, option.id])}>{active ? '✓ ' : ''}{option.label}{option.summary && <small>{option.summary}</small>}</button>
  })}</div></section>
}

function FinalSummary({ draft, classes, species, backgrounds }: { draft: CharacterDraft; classes: CharacterClass[]; species: Species[]; backgrounds: Background[] }) {
  const selectedClass = classes.find((x) => x.id === draft.classId)
  const selectedSpecies = species.find((x) => x.id === draft.speciesId)
  const speciesName = selectedSpecies?.nameIt ?? (draft.speciesId === PHB_AASIMAR_PRESENTATION.id ? 'Aasimar' : 'Da scegliere')
  const missingChoices = [
    ...(selectedClass?.requiredChoices ?? []).filter((choice) => (draft.classOptionSelections[choice.id]?.length ?? 0) !== choice.count).map((x) => x.label),
    ...(selectedSpecies?.requiredChoices ?? []).filter((choice) => (draft.speciesOptionSelections[choice.id]?.length ?? 0) !== choice.count).map((x) => x.label),
  ]
  return <div className="final-summary">
    {missingChoices.length > 0 && <div className="incomplete-panel"><strong>Scelte obbligatorie mancanti</strong><ul>{missingChoices.map((x) => <li key={x}>{x}</li>)}</ul></div>}
    <Summary title="Identità" items={[['Nome', draft.name], ['Giocatore', draft.playerName]]} />
    <Summary title="Origini e ruolo" items={[['Classe', selectedClass?.nameIt ?? 'Da scegliere'], ['Specie', speciesName], ['Background', backgrounds.find((x) => x.id === draft.backgroundId)?.nameIt ?? 'Da scegliere']]} />
    {selectedClass && <Summary title="Meccaniche di livello 1" items={[
      ['Dado Vita', `d${selectedClass.hitDie}`], ['PF', selectedClass.levelOneHitPoints],
      ['Tiri salvezza', selectedClass.savingThrows.map(abilityLabel).join(', ')],
      ['Abilità scelte', draft.classSkillIds.join(', ') || 'Da scegliere'],
      ['Capacità', selectedClass.levelOneFeatures.map((x) => x.nameIt).join(', ')],
    ]} />}
  </div>
}

function Summary({ title, items }: { title: string; items: [string, string][] }) {
  return <section className="summary-block"><h2>{title}</h2><dl>{items.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || 'Non specificato'}</dd></div>)}</dl></section>
}

function Field({ label, children, required, wide }: { label: string; children: React.ReactNode; required?: boolean; wide?: boolean }) {
  return <label className={`builder-field ${wide ? 'wide' : ''}`}><span>{label}{required && <b> · Richiesto</b>}</span>{children}</label>
}
function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rule-info-panel"><h2>{title}</h2><div>{children}</div></section>
}
function Badge({ children }: { children: React.ReactNode }) { return <span className="info-badge">{children}</span> }
function SourceLine({ section, page }: { section: string; page?: number }) {
  return <p className="source-line">Fonte: SRD 5.2.1 Italiano · {section}{page ? ` · p. ${page}` : ''} · CC-BY-4.0</p>
}

export function classChoiceRequirementsMet(draft: CharacterDraft, classes: CharacterClass[] = classOptions): boolean {
  const option = classes.find((item) => item.id === draft.classId)
  return Boolean(option) &&
    draft.classSkillIds.length === option?.skillChoiceCount &&
    (option?.requiredChoices.every((choice) => (draft.classOptionSelections[choice.id]?.length ?? 0) === choice.count) ?? false)
}

export function speciesChoiceRequirementsMet(draft: CharacterDraft, species: Species[] = speciesOptions): boolean {
  const option = species.find((item) => item.id === draft.speciesId)
  return Boolean(option) && (option?.requiredChoices.every((choice) => (draft.speciesOptionSelections[choice.id]?.length ?? 0) === choice.count) ?? false)
}

export function primaryAbilityLabels(keys: AbilityKey[]): string {
  return keys.map(abilityLabel).join(', ')
}

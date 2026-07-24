import {
  abilityDefinitions,
  PHB_AASIMAR_PRESENTATION,
  backgroundOptions,
  classOptions,
  speciesOptions,
} from '../../data/srd-5.2.1-it/catalog'
import {
  applyBackgroundBonuses,
  LEVEL_ONE_PROFICIENCY_BONUS,
} from '../../rules/2024/characterBuilderRules'
import { validateAbilityAssignments } from '../../rules/2024/abilityGenerationRules'
import { RULESET_LABEL, type CharacterDraft } from '../../types/character'

interface HeroSummaryProps {
  draft: CharacterDraft
  open: boolean
  onToggle: () => void
}

export function HeroSummary({ draft, open, onToggle }: HeroSummaryProps) {
  const selectedClass = classOptions.find((option) => option.id === draft.classId)
  const background = backgroundOptions.find((option) => option.id === draft.backgroundId)
  const species = speciesOptions.find((option) => option.id === draft.speciesId)
  const primaryAbility = abilityDefinitions.find((ability) => ability.id === selectedClass?.primaryAbility)
  const completion = [
    Boolean(draft.name.trim()),
    Boolean(draft.classId),
    Boolean(draft.backgroundId),
    Boolean(draft.speciesId),
    draft.languages.length === 2,
    validateAbilityAssignments(draft.abilityGeneration).length === 0,
  ]
  const completeCount = completion.filter(Boolean).length
  const finalAbilities = applyBackgroundBonuses(draft.baseAbilities, draft.backgroundBonuses)

  return (
    <aside className={`hero-summary ${open ? 'open' : ''}`} aria-labelledby="hero-summary-title">
      <button className="summary-toggle" type="button" onClick={onToggle} aria-expanded={open}>
        <span>Il tuo eroe</span>
        <strong>{completeCount}/{completion.length}</strong>
      </button>
      <div className="summary-body">
        <div className="hero-summary-heading">
          <small>Riepilogo in tempo reale</small>
          <h2 id="hero-summary-title">Il tuo eroe</h2>
        </div>
        <div className="hero-silhouette" aria-label="Sagoma illustrativa originale del personaggio">
          <span className="silhouette-head" />
          <span className="silhouette-body" />
          <span className="silhouette-spark spark-one">✦</span>
          <span className="silhouette-spark spark-two">·</span>
          <strong>{draft.name.trim().charAt(0).toUpperCase() || '?'}</strong>
        </div>
        <div className="hero-identity">
          <h3>{draft.name.trim() || 'Eroe senza nome'}</h3>
          <p>Livello 1 · {RULESET_LABEL}</p>
        </div>
        <dl className="live-facts">
          <Fact icon="⚔" label="Classe" value={selectedClass?.nameIt} />
          <Fact icon="⌘" label="Background" value={background?.nameIt} />
          <Fact icon="❧" label="Specie" value={species?.nameIt ?? (draft.speciesId === PHB_AASIMAR_PRESENTATION.id ? 'Aasimar' : undefined)} />
          <Fact icon="◆" label="Caratteristica principale" value={primaryAbility?.nameIt} />
        </dl>
        <div className="combat-placeholders">
          <div><span>PF</span><strong>{selectedClass?.hitDie ?? '—'}</strong><small>{selectedClass ? `d${selectedClass.hitDie} + Cos` : 'Da calcolare'}</small></div>
          <div><span>Dado Vita</span><strong>{selectedClass ? `d${selectedClass.hitDie}` : '—'}</strong><small>Livello 1</small></div>
          <div><span>Competenza</span><strong>+{LEVEL_ONE_PROFICIENCY_BONUS}</strong><small>Livello 1</small></div>
        </div>
        {primaryAbility && (
          <div className="primary-score">
            <span>{primaryAbility.icon} {primaryAbility.nameIt}</span>
            <strong>{finalAbilities[primaryAbility.id] ?? '—'}</strong>
          </div>
        )}
        <div className="completion-meter">
          <div><span>Stato di completamento</span><strong>{Math.round((completeCount / completion.length) * 100)}%</strong></div>
          <progress max={completion.length} value={completeCount}>{completeCount} su {completion.length}</progress>
        </div>
      </div>
    </aside>
  )
}

function Fact({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <div>
      <dt><span aria-hidden="true">{icon}</span>{label}</dt>
      <dd>{value || 'Da scegliere'}</dd>
    </div>
  )
}

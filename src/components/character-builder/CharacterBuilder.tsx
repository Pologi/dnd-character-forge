import { useEffect, useMemo, useState } from 'react'
import { clearDraft, saveCharacter, saveDraft } from '../../storage/characterStorage'
import { visibleBuilderSteps } from '../../rules/2024/characterBuilderRules'
import { calculateRemainingPoints, validateAbilityAssignments } from '../../rules/2024/abilityGenerationRules'
import { createEmptyDraft, type Character, type CharacterDraft, type CharacterFields } from '../../types/character'
import { BuilderStepContent, classChoiceRequirementsMet, speciesChoiceRequirementsMet } from './BuilderStepContent'
import { HeroSummary } from './HeroSummary'
import { SageGuide } from './SageGuide'
import { StepRail } from './StepRail'
import { useContentRegistry } from '../../content/ContentRegistryContext'
import type { CharacterClass, Species } from '../../types/character'
import { classOptions, speciesOptions } from '../../data/srd-5.2.1-it/catalog'

interface CharacterBuilderProps {
  initialDraft: CharacterDraft
  resumed: boolean
  onDirtyChange: (dirty: boolean) => void
  onCancel: () => void
  onSaved: (character: Character) => void
}

export function CharacterBuilder({
  initialDraft,
  resumed,
  onDirtyChange,
  onCancel,
  onSaved,
}: CharacterBuilderProps) {
  const { registry } = useContentRegistry()
  const [draft, setDraft] = useState<CharacterDraft>(() => cloneDraft(initialDraft))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [furthestIndex, setFurthestIndex] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [error, setError] = useState('')
  const [draftNotice, setDraftNotice] = useState(resumed)

  const steps = useMemo(() => visibleBuilderSteps(draft.classId), [draft.classId])
  const currentStep = steps[Math.min(currentIndex, steps.length - 1)]

  useEffect(() => {
    if (currentIndex >= steps.length) setCurrentIndex(steps.length - 1)
  }, [currentIndex, steps.length])

  useEffect(() => {
    if (dirty) saveDraft(draft)
  }, [dirty, draft])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const updateField = <K extends keyof CharacterFields>(key: K, value: CharacterFields[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
    if (!dirty) {
      setDirty(true)
      onDirtyChange(true)
    }
  }

  const goTo = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, steps.length - 1)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const continueForward = () => {
    const validationError = validateCurrentStep(currentStep.id, draft, registry.builderClasses(), registry.builderSpecies())
    if (validationError) {
      setError(validationError)
      return
    }
    if (currentStep.id === 'abilities' && draft.abilityGeneration.method === 'point-cost') {
      const remaining = calculateRemainingPoints(
        draft.abilityGeneration.pointCost.scores,
        draft.abilityGeneration.pointCost.configuration,
      )
      if (remaining > 0 && !window.confirm(`Hai ancora ${remaining} punti disponibili. Vuoi continuare comunque?`)) return
    }
    const nextIndex = Math.min(currentIndex + 1, steps.length - 1)
    setFurthestIndex((current) => Math.max(current, nextIndex))
    goTo(nextIndex)
  }

  const restart = () => {
    if (!window.confirm('Eliminare questa bozza e ricominciare una nuova leggenda?')) return
    const empty = createEmptyDraft()
    clearDraft()
    setDraft(empty)
    setCurrentIndex(0)
    setFurthestIndex(0)
    setDirty(false)
    setDraftNotice(false)
    onDirtyChange(false)
  }

  const finish = () => {
    const missing = validateForCompletion(draft, registry.builderClasses(), registry.builderSpecies())
    if (missing) {
      setError(missing)
      return
    }
    try {
      const character = saveCharacter(draft)
      clearDraft()
      setDirty(false)
      onDirtyChange(false)
      onSaved(character)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Non è stato possibile creare il personaggio.')
    }
  }

  return (
    <section className="character-builder">
      <header className="builder-topbar">
        <button type="button" className="back-link" onClick={onCancel}>← Esci dalla forgia</button>
        <div>
          <span>D&amp;D 5e 2024</span>
          <small>Livello 1 · SRD 5.2.1 italiano</small>
        </div>
        <button type="button" className="restart-link" onClick={restart}>Ricomincia</button>
      </header>

      {draftNotice && (
        <div className="notice notice-success builder-resume-notice" role="status">
          <span>Bozza ripresa: tutte le tue scelte sono state recuperate.</span>
          <button type="button" onClick={() => setDraftNotice(false)} aria-label="Chiudi messaggio">×</button>
        </div>
      )}

      <div className="builder-layout">
        <StepRail steps={steps} currentIndex={currentIndex} furthestIndex={furthestIndex} onSelect={goTo} />

        <div className="builder-main">
          <div className="builder-step-heading">
            <span className="kicker">{currentStep.chapter}</span>
            <h1>{currentStep.title}</h1>
            <p>{currentStep.shortDescription}</p>
          </div>
          <div key={currentStep.id} className="step-transition">
            <BuilderStepContent step={currentStep} draft={draft} onField={updateField} />
            <SageGuide step={currentStep} draft={draft} />
          </div>
          {error && <div className="builder-error" role="alert">⚠ {error}</div>}
          <div className="builder-navigation">
            <button
              type="button"
              className="button button-ghost"
              onClick={currentIndex === 0 ? onCancel : () => goTo(currentIndex - 1)}
            >
              {currentIndex === 0 ? 'Esci' : 'Indietro'}
            </button>
            <span>La bozza viene salvata automaticamente</span>
            {currentStep.id === 'summary' ? (
              <button type="button" className="button button-primary" onClick={finish}>
                Crea il mio personaggio
              </button>
            ) : (
              <button type="button" className="button button-primary" onClick={continueForward}>
                Continua <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>

        <HeroSummary draft={draft} open={summaryOpen} onToggle={() => setSummaryOpen((open) => !open)} />
      </div>
    </section>
  )
}

function validateCurrentStep(stepId: string, draft: CharacterDraft, classes: CharacterClass[] = classOptions, species: Species[] = speciesOptions): string {
  if (stepId === 'intro' && !draft.name.trim()) return 'Inserisci il nome del personaggio per continuare.'
  if (stepId === 'class' && !draft.classId) return 'Scegli una classe per continuare.'
  if (stepId === 'background' && !draft.backgroundId) return 'Scegli un Background per continuare.'
  if (stepId === 'species' && !draft.speciesId) return 'Scegli una Specie per continuare.'
  if (stepId === 'languages' && draft.languages.length !== 2) return 'Seleziona esattamente due linguaggi.'
  if (stepId === 'abilities') return validateAbilityAssignments(draft.abilityGeneration)[0] ?? ''
  if (stepId === 'class-choices' && !classChoiceRequirementsMet(draft, classes)) return 'Completa le abilità e tutte le scelte obbligatorie della classe.'
  if (stepId === 'class-choices' && !speciesChoiceRequirementsMet(draft, species)) return 'Completa tutte le scelte obbligatorie della specie.'
  if (stepId === 'equipment' && draft.equipmentChoiceIds.length === 0) return 'Scegli l’equipaggiamento iniziale o l’alternativa in monete.'
  return ''
}

function validateForCompletion(draft: CharacterDraft, classes: CharacterClass[] = classOptions, species: Species[] = speciesOptions): string {
  return (
    validateCurrentStep('intro', draft, classes, species) ||
    validateCurrentStep('class', draft, classes, species) ||
    validateCurrentStep('background', draft, classes, species) ||
    validateCurrentStep('species', draft, classes, species) ||
    validateCurrentStep('languages', draft, classes, species) ||
    validateCurrentStep('abilities', draft, classes, species) ||
    validateCurrentStep('class-choices', draft, classes, species) ||
    validateCurrentStep('equipment', draft, classes, species)
  )
}

function cloneDraft(draft: CharacterDraft): CharacterDraft {
  return {
    ...draft,
    languages: [...draft.languages],
    baseAbilities: { ...draft.baseAbilities },
    backgroundBonuses: { ...draft.backgroundBonuses },
    abilityGeneration: structuredClone(draft.abilityGeneration),
    classChoices: [...draft.classChoices],
    classSkillIds: [...draft.classSkillIds],
    classOptionSelections: structuredClone(draft.classOptionSelections),
    speciesOptionSelections: structuredClone(draft.speciesOptionSelections),
    equipmentChoiceIds: [...draft.equipmentChoiceIds],
    spellChoiceIds: [...draft.spellChoiceIds],
  }
}

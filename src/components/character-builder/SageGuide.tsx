import type { BuilderStep, CharacterDraft } from '../../types/character'
import { abilityLabel, classOptions, inspirationOptions } from '../../data/srd-5.2.1-it/catalog'

export function SageGuide({ step, draft }: { step: BuilderStep; draft: CharacterDraft }) {
  const inspiration = inspirationOptions.find((option) => option.id === draft.inspirationId)
  const selectedClass = classOptions.find((option) => option.id === draft.classId)
  const methodGuide = draft.abilityGeneration.method === 'standard-array'
    ? 'Equilibrata e veloce. Tutti partono dagli stessi sei valori.'
    : draft.abilityGeneration.method === 'random-roll'
      ? 'Più imprevedibile. Puoi ottenere punteggi molto alti o molto bassi.'
      : draft.abilityGeneration.pointCost.configuration.mode === 'custom'
        ? 'Queste impostazioni modificano il metodo ufficiale. Verifica che siano state approvate dal master.'
        : 'Ti permette di costruire esattamente le caratteristiche che desideri.'

  const contextualSuggestion = step.id === 'abilities'
    ? `${methodGuide} ${selectedClass ? `Considera ${selectedClass.primaryAbilities.map(abilityLabel).join(' e ')} e non trascurare Costituzione.` : ''} I suggerimenti non sono obblighi.`
    : selectedClass
      ? `Hai scelto ${selectedClass.nameIt}: ${selectedClass.primaryAbilities.map(abilityLabel).join(' e ')} ${selectedClass.primaryAbilities.length > 1 ? 'sono caratteristiche principali' : 'è la caratteristica principale'}.`
      : inspiration
        ? `La tua idea “${inspiration.nameIt}” può orientare le proposte, senza imporre una classe.`
        : step.sageGuide.suggestion

  return (
    <aside className="sage-guide" aria-labelledby="sage-guide-title">
      <div className="sage-title">
        <span className="sage-seal" aria-hidden="true">✦</span>
        <div><small>Una voce al tuo fianco</small><h2 id="sage-guide-title">Guida del saggio</h2></div>
      </div>
      <p>{step.id === 'abilities'
        ? 'Il metodo genera soltanto il valore base. Il bonus del Background viene applicato dopo; la Specie non modifica le caratteristiche.'
        : step.sageGuide.explanation}</p>
      <div className="sage-insight">
        <span className={`rule-badge ${step.sageGuide.ruleLabel === 'Scelta libera' ? 'free' : ''}`}>{step.sageGuide.ruleLabel}</span>
        <p>{step.id === 'abilities' ? 'Valore base, bonus del Background, valore finale e modificatore restano sempre separati.' : step.sageGuide.usefulness}</p>
      </div>
      <div className="sage-suggestion"><strong>✧ Suggerimento</strong><p>{contextualSuggestion}</p></div>
      <p className="compatibility-note">✓ Nessuna incompatibilità rilevata tra le opzioni selezionate.</p>
      {selectedClass?.complexity === 'facile' && <span className="info-badge beginner">Adatto ai principianti</span>}
      {selectedClass?.complexity === 'avanzata' && <span className="info-badge advanced">Richiede più gestione</span>}
    </aside>
  )
}

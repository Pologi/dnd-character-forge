import type { BuilderStep } from '../../types/character'

interface StepRailProps {
  steps: BuilderStep[]
  currentIndex: number
  furthestIndex: number
  onSelect: (index: number) => void
}

export function StepRail({ steps, currentIndex, furthestIndex, onSelect }: StepRailProps) {
  return (
    <nav className="builder-rail" aria-label="Percorso di creazione">
      <div className="rail-heading">
        <span>Percorso</span>
        <strong>{currentIndex + 1}/{steps.length}</strong>
      </div>
      <ol>
        {steps.map((step, index) => {
          const accessible = index <= furthestIndex
          return (
            <li key={step.id}>
              <button
                type="button"
                className={`${index === currentIndex ? 'active' : ''} ${index < currentIndex ? 'visited' : ''}`}
                onClick={() => accessible && onSelect(index)}
                disabled={!accessible}
                aria-current={index === currentIndex ? 'step' : undefined}
              >
                <span className="rail-step-icon" aria-hidden="true">{index < currentIndex ? '✓' : step.icon}</span>
                <span>
                  <small>{step.chapter}</small>
                  <strong>{step.title}</strong>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

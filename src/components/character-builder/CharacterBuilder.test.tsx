// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDraft } from '../../types/character'
import { CharacterBuilder } from './CharacterBuilder'

describe('CharacterBuilder', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn()
    window.confirm = vi.fn(() => true)
  })

  afterEach(() => cleanup())

  it('naviga tra i passaggi e mantiene le scelte tornando indietro', async () => {
    const user = userEvent.setup()
    renderBuilder()

    await user.type(screen.getByLabelText(/Nome del personaggio/), 'Aria')
    const inspiration = screen.getByRole('button', { name: /Combattente coraggioso/ })
    await user.click(inspiration)
    expect(inspiration.getAttribute('aria-pressed')).toBe('true')

    await user.click(screen.getByRole('button', { name: /Continua/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Scegli la tua classe' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Indietro' }))
    expect(screen.getByDisplayValue('Aria')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Combattente coraggioso/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('aggiorna immediatamente il riepilogo del personaggio', async () => {
    const user = userEvent.setup()
    renderBuilder()

    await user.type(screen.getByLabelText(/Nome del personaggio/), 'Neris')

    expect(screen.getByRole('heading', { level: 3, name: 'Neris' })).toBeTruthy()
    expect(screen.getByText('Livello 1 · D&D 5e 2024')).toBeTruthy()
  })
})

function renderBuilder() {
  return render(
    <CharacterBuilder
      initialDraft={createEmptyDraft()}
      resumed={false}
      onDirtyChange={vi.fn()}
      onCancel={vi.fn()}
      onSaved={vi.fn()}
    />,
  )
}

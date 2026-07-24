// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDraft, type CharacterDraft, type CharacterFields } from '../../types/character'
import { AbilitiesStep } from './AbilitiesStep'

afterEach(() => cleanup())

describe('AbilitiesStep', () => {
  it('chiede conferma prima di cambiare metodo quando esistono valori assegnati', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const draft = createEmptyDraft()
    draft.baseAbilities.strength = 15
    draft.abilityGeneration.standardArrayAssignments.strength = 15
    render(<Harness initial={draft} />)

    const pointCard = screen.getByRole('heading', { name: 'Acquisto con punti' }).closest('article')
    expect(pointCard).not.toBeNull()
    await user.click(within(pointCard as HTMLElement).getByRole('button', { name: 'Usa questo metodo' }))

    expect(confirm).toHaveBeenCalledOnce()
    const methodRegion = screen.getByLabelText('Metodo di generazione')
    expect(within(methodRegion).getByRole('heading', { name: 'Serie standard' }).closest('article')?.className).toContain('selected')
  })
})

function Harness({ initial }: { initial: CharacterDraft }) {
  const [draft, setDraft] = useState(initial)
  const onField = <K extends keyof CharacterFields>(key: K, value: CharacterFields[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }
  return <AbilitiesStep draft={draft} onField={onField} />
}

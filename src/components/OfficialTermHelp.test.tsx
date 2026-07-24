// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { OfficialTermHelp } from './OfficialTermHelp'

afterEach(cleanup)

describe('OfficialTermHelp', () => {
  it('mostra termine bilingue, fonte, pagina e origine', async () => {
    render(<OfficialTermHelp item={{
      id: 'fighter',
      category: 'class',
      nameIt: 'Guerriero',
      nameEn: 'Fighter',
      sourceTitle: 'SRD 5.2.1',
      page: 110,
      edition: '2024',
      origin: 'srd-5.2.1-it',
      verificationStatus: 'verified',
      mechanics: {},
      selectable: true,
    }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Informazioni ufficiali: Guerriero' }))
    expect(screen.getByText('Guerriero')).toBeTruthy()
    expect(screen.getByText('Fighter')).toBeTruthy()
    expect(screen.getByText('SRD 5.2.1')).toBeTruthy()
    expect(screen.getByText('110')).toBeTruthy()
    expect(screen.getByText('SRD')).toBeTruthy()
  })
})

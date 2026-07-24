import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { forbiddenPrivatePath } from './privateContentSafety'

describe('protezione dei contenuti privati', () => {
  it('riconosce tutti i percorsi vietati nella build', () => {
    expect(forbiddenPrivatePath('private-content/pack.json')).toBe(true)
    expect(forbiddenPrivatePath('assets/example.private-pack.json')).toBe(true)
    expect(forbiddenPrivatePath('example.manual-pack.json')).toBe(true)
    expect(forbiddenPrivatePath('assets/index.js')).toBe(false)
  })

  it('non trova pacchetti privati tra i file tracciati nel repository', () => {
    const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split(/\r?\n/)
    expect(tracked.filter(forbiddenPrivatePath)).toEqual([])
  })
})

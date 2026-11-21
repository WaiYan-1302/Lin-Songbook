import { describe, expect, it } from 'vitest'
import { createTabStep, formatAsciiTab, tabNoteName } from '../music/tabEditor'

describe('tab editor music helpers', () => {
  it('names notes on each physical string correctly', () => {
    expect(tabNoteName(0, 0)).toBe('E2')
    expect(tabNoteName(0, 5)).toBe('A2')
    expect(tabNoteName(5, 3)).toBe('G4')
    expect(tabNoteName(4, 1)).toBe('C4')
  })

  it('formats a six-line ASCII tab', () => {
    const step = createTabStep('one')
    step.frets[5] = 3
    step.frets[0] = 0
    const result = formatAsciiTab('Small riff', 96, [step])
    expect(result).toContain('Small riff · 96 BPM')
    expect(result).toContain('e |--3-|')
    expect(result).toContain('E |--0-|')
    expect(result.split('\n')).toHaveLength(8)
  })
})

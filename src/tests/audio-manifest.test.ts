import { describe, expect, it } from 'vitest'
import manifest from '../../public/audio/guitar/steel/manifest.json'

describe('recorded acoustic sample manifest', () => {
  it('contains physical-string-specific recordings for all six strings', () => {
    expect(new Set(manifest.samples.map(sample => sample.stringIndex))).toEqual(new Set([0, 1, 2, 3, 4, 5]))
    expect(manifest.license).toBe('CC0-1.0')
  })

  it('covers open strings and common open-position C major notes', () => {
    const keys = new Set(manifest.samples.map(sample => `${sample.stringIndex}:${sample.fret}`))
    for (const [string, fret] of [[1, 3], [2, 2], [3, 0], [4, 1], [5, 0]]) expect(keys.has(`${string}:${fret}`)).toBe(true)
  })
})

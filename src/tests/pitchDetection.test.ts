import { describe, expect, it } from 'vitest'
import { describePitch, detectPitch } from '../audio/pitchDetection'
import { GUITAR_TUNINGS, noteFrequency } from '../music/guitarTunings'

function sineWave(frequency: number, sampleRate = 48_000, length = 8192) {
  return Float32Array.from({ length }, (_, index) => .35 * Math.sin(2 * Math.PI * frequency * index / sampleRate))
}

describe('guitar tuner pitch detection', () => {
  it.each([61.74, 82.41, 110, 146.83, 196, 246.94, 329.63])('detects a guitar string at %s Hz', frequency => {
    const result = detectPitch(sineWave(frequency), 48_000)
    expect(result).not.toBeNull()
    expect(result!.frequency).toBeCloseTo(frequency, 1)
    expect(result!.confidence).toBeGreaterThan(.8)
  })

  it('ignores silence and describes concert A', () => {
    expect(detectPitch(new Float32Array(8192), 48_000)).toBeNull()
    expect(describePitch(440)).toMatchObject({ note: 'A', octave: 4, cents: 0 })
  })

  it('provides standard plus 12 complete alternate tuning presets', () => {
    expect(GUITAR_TUNINGS).toHaveLength(13)
    expect(GUITAR_TUNINGS.every(tuning => tuning.strings.length === 6)).toBe(true)
    expect(noteFrequency('B', 1)).toBeCloseTo(61.74, 1)
    expect(noteFrequency('Eb', 2)).toBeCloseTo(77.78, 1)
  })
})

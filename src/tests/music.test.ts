import { describe, expect, it } from 'vitest'
import { parseChordPro, parseLyricLine, ChordProError } from '../music/chordParser'
import { getVoicing, getVoicings } from '../music/chordDatabase'
import { transposeChord } from '../music/transposition'
import { voicingMidis } from '../music/guitarTuning'

describe('ChordPro parser', () => {
  it('attaches chords to exact lyric segments without inserting spaces', () => {
    expect(parseLyricLine('[C]Under the [Am]moonlight').segments).toEqual([
      { chord: 'C', lyric: 'Under the ' },
      { chord: 'Am', lyric: 'moonlight' },
    ])
  })

  it('keeps Unicode metadata and lyrics', () => {
    const song = parseChordPro('{title: 紙の歌}\n{artist: 林}\n{start_of_chorus: サビ}\n[C]朝のひかり\n{end_of_chorus}', 'jp')
    expect(song.title).toBe('紙の歌')
    expect(song.sections[0].label).toBe('サビ')
    expect(song.sections[0].lines[0].segments[0].lyric).toBe('朝のひかり')
  })

  it('reports malformed chord lines clearly', () => {
    expect(() => parseLyricLine('[Cbroken', 7)).toThrow(ChordProError)
    expect(() => parseLyricLine('[Cbroken', 7)).toThrow('Line 7')
  })
})

describe('transposition', () => {
  it('transposes qualities and slash bass notes independently', () => {
    expect(transposeChord('Cmaj7/E', 2)).toBe('Dmaj7/F#')
    expect(transposeChord('Am7', -2)).toBe('Gm7')
  })
})

describe('shared guitar voicings', () => {
  it('uses the requested low-E to high-E open C shape', () => {
    expect(getVoicing('C')?.frets).toEqual([-1, 3, 2, 0, 1, 0])
    expect(voicingMidis(getVoicing('C')!)).toEqual([null, 48, 52, 55, 60, 64])
  })

  it('does not sound muted strings in Am', () => {
    expect(voicingMidis(getVoicing('Am')!)).toEqual([null, 45, 52, 57, 60, 64])
  })

  it('shows five sounding strings for open C and Cadd9 shapes', () => {
    expect(getVoicing('C')?.frets.filter(fret => fret >= 0)).toHaveLength(5)
    expect(getVoicing('Cadd9')?.frets.filter(fret => fret >= 0)).toHaveLength(5)
    expect(getVoicing('Cadd9')?.frets).toEqual([-1, 3, 2, 0, 3, 0])
  })

  it('loads multiple B minor voicings including a barre shape', () => {
    const voices = getVoicings('Bm')
    expect(voices.length).toBeGreaterThan(1)
    expect(voices.some(voice => voice.barres.length > 0)).toBe(true)
  })
})

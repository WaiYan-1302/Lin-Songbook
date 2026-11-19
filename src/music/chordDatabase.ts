import guitarData from '@tombatossals/chords-db/lib/guitar.json'
import type { FretTuple, GuitarVoicing } from '../types'
import { STANDARD_TUNING } from './guitarTuning'

type DbPosition = { frets: number[]; fingers: number[]; baseFret?: number; barres?: number[] }
type DbChord = { key: string; suffix: string; positions: DbPosition[] }
type Db = { chords: Record<string, DbChord[]> }
const db = guitarData as unknown as Db

const SUFFIX_TO_DB: Record<string, string> = {
  '': 'major', m: 'minor', min: 'minor', maj: 'major', '°': 'dim', ø: 'm7b5',
}
const normalizeRoot = (root: string) => ({ Db: 'C#', 'D#': 'Eb', Gb: 'F#', 'G#': 'Ab', 'A#': 'Bb' }[root] ?? root)

export function splitChordSymbol(symbol: string) {
  const head = symbol.split('/')[0]
  const match = head.match(/^([A-G](?:#|b)?)(.*)$/)
  return match ? { root: normalizeRoot(match[1]), suffix: SUFFIX_TO_DB[match[2]] ?? match[2] } : null
}

export function getVoicings(symbol: string): GuitarVoicing[] {
  const parsed = splitChordSymbol(symbol)
  if (!parsed) return []
  const chord = db.chords[parsed.root]?.find(entry => entry.suffix === parsed.suffix)
  if (!chord) return []
  return chord.positions.map((position, index) => {
    const absolute = position.frets.map(fret => fret <= 0 ? fret : fret + (position.baseFret ?? 1) - 1) as FretTuple
    return {
      id: `${symbol}-${index}`,
      chordSymbol: symbol,
      name: symbol,
      frets: absolute,
      fingers: position.fingers as FretTuple,
      baseFret: position.baseFret ?? 1,
      barres: position.barres ?? [],
      tuning: STANDARD_TUNING,
    }
  })
}

export function getVoicing(symbol: string, index = 0) { return getVoicings(symbol)[index] ?? null }
export const COMMON_CHORDS = ['C', 'G', 'Am', 'F', 'Dm', 'Em', 'A', 'D', 'E', 'A7', 'D7', 'G7', 'Bm', 'Cmaj7', 'Dsus4', 'Cadd9']

import { Note } from '@tonaljs/tonal'

const ROOT_RE = /^([A-G](?:#|b)?)(.*)$/

export function transposeRoot(root: string, semitones: number, preferFlats = /b/.test(root)) {
  const midi = Note.midi(`${root}4`)
  if (midi == null) return root
  const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  return (preferFlats ? flats : sharps)[((midi + semitones) % 12 + 12) % 12]
}

export function transposeChord(symbol: string, semitones: number) {
  if (!semitones) return symbol
  const [head, bass] = symbol.split('/')
  const match = head.match(ROOT_RE)
  if (!match) return symbol
  const moved = transposeRoot(match[1], semitones) + match[2]
  return bass ? `${moved}/${transposeRoot(bass, semitones)}` : moved
}

export function transposeKey(key: string, semitones: number) {
  return transposeRoot(key, semitones)
}

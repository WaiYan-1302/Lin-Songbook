export type TuningNote = { note: string; octave: number }
export type GuitarTuning = {
  id: string
  name: string
  notes: string
  description: string
  strings: TuningNote[]
}

const tuning = (id: string, name: string, notes: string, description: string, pitches: [string, number][]): GuitarTuning => ({
  id,
  name,
  notes,
  description,
  strings: pitches.map(([note, octave]) => ({ note, octave })),
})

// Ordered low string to high string. Standard is followed by the 12 most-used
// alternate six-string tunings in the referenced 2,761-song tuning study.
export const GUITAR_TUNINGS = [
  tuning('standard', 'Standard', 'E A D G B E', 'The familiar all-purpose guitar tuning.', [['E', 2], ['A', 2], ['D', 3], ['G', 3], ['B', 3], ['E', 4]]),
  tuning('drop-d', 'Drop D', 'D A D G B E', 'Standard tuning with a deeper low D.', [['D', 2], ['A', 2], ['D', 3], ['G', 3], ['B', 3], ['E', 4]]),
  tuning('drop-c', 'Drop C', 'C G C F A D', 'A heavy whole-step-down drop tuning.', [['C', 2], ['G', 2], ['C', 3], ['F', 3], ['A', 3], ['D', 4]]),
  tuning('eb-standard', 'Half-step down', 'E♭ A♭ D♭ G♭ B♭ E♭', 'Standard tuning lowered by one semitone.', [['Eb', 2], ['Ab', 2], ['Db', 3], ['Gb', 3], ['Bb', 3], ['Eb', 4]]),
  tuning('d-standard', 'D standard', 'D G C F A D', 'Standard tuning lowered by one whole step.', [['D', 2], ['G', 2], ['C', 3], ['F', 3], ['A', 3], ['D', 4]]),
  tuning('drop-c-sharp', 'Drop C♯', 'C♯ G♯ C♯ F♯ A♯ D♯', 'Drop D lowered by one semitone.', [['C#', 2], ['G#', 2], ['C#', 3], ['F#', 3], ['A#', 3], ['D#', 4]]),
  tuning('open-d', 'Open D', 'D A D F♯ A D', 'Open strings form a D major chord.', [['D', 2], ['A', 2], ['D', 3], ['F#', 3], ['A', 3], ['D', 4]]),
  tuning('b-standard', 'B standard', 'B E A D F♯ B', 'A low baritone-style standard tuning.', [['B', 1], ['E', 2], ['A', 2], ['D', 3], ['F#', 3], ['B', 3]]),
  tuning('open-g', 'Open G', 'D G D G B D', 'Open strings form a G major chord.', [['D', 2], ['G', 2], ['D', 3], ['G', 3], ['B', 3], ['D', 4]]),
  tuning('c-sharp-standard', 'C♯ standard', 'C♯ F♯ B E G♯ C♯', 'Standard tuning lowered by three semitones.', [['C#', 2], ['F#', 2], ['B', 2], ['E', 3], ['G#', 3], ['C#', 4]]),
  tuning('c-standard', 'C standard', 'C F B♭ E♭ G C', 'Standard tuning lowered by two whole steps.', [['C', 2], ['F', 2], ['Bb', 2], ['Eb', 3], ['G', 3], ['C', 4]]),
  tuning('dadgad', 'DADGAD', 'D A D G A D', 'A suspended modal tuning popular in folk music.', [['D', 2], ['A', 2], ['D', 3], ['G', 3], ['A', 3], ['D', 4]]),
  tuning('drop-b', 'Drop B', 'B F♯ B E G♯ C♯', 'A low drop tuning used in heavier music.', [['B', 1], ['F#', 2], ['B', 2], ['E', 3], ['G#', 3], ['C#', 4]]),
] as const satisfies readonly GuitarTuning[]

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
}

export function noteFrequency(note: string, octave: number, concertA = 440) {
  const midi = (octave + 1) * 12 + NOTE_SEMITONES[note]
  return concertA * 2 ** ((midi - 69) / 12)
}

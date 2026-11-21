export const TAB_STRINGS = [
  { name: 'E', octave: 2, midi: 40, label: 'Low E' },
  { name: 'A', octave: 2, midi: 45, label: 'A' },
  { name: 'D', octave: 3, midi: 50, label: 'D' },
  { name: 'G', octave: 3, midi: 55, label: 'G' },
  { name: 'B', octave: 3, midi: 59, label: 'B' },
  { name: 'e', octave: 4, midi: 64, label: 'High E' },
] as const

export const TAB_DURATIONS = [
  { value: 4, label: 'Whole note', short: '1' },
  { value: 2, label: 'Half note', short: '1/2' },
  { value: 1, label: 'Quarter note', short: '1/4' },
  { value: .5, label: 'Eighth note', short: '1/8' },
  { value: .25, label: 'Sixteenth note', short: '1/16' },
] as const

export type TabDuration = typeof TAB_DURATIONS[number]['value']
export type TabStep = { id: string; frets: Array<number | null>; duration: TabDuration }

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

export function tabNoteName(stringIndex: number, fret: number) {
  const midi = TAB_STRINGS[stringIndex].midi + fret
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
}

export function createTabStep(id: string, duration: TabDuration = 1): TabStep {
  return { id, duration, frets: [null, null, null, null, null, null] }
}

export function formatAsciiTab(title: string, bpm: number, steps: TabStep[]) {
  const rows = [5, 4, 3, 2, 1, 0].map(stringIndex => {
    const label = TAB_STRINGS[stringIndex].name.padEnd(2, ' ')
    const cells = steps.map(step => step.frets[stringIndex] === null ? '--' : String(step.frets[stringIndex]).padStart(2, '-')).join('-')
    return `${label}|-${cells}-|`
  })
  return `${title || 'Untitled tab'} · ${bpm} BPM\n\n${rows.join('\n')}`
}

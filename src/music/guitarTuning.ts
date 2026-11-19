import { Midi, Note } from '@tonaljs/tonal'
import type { FretTuple, GuitarVoicing } from '../types'

export const STANDARD_TUNING: FretTuple = [40, 45, 50, 55, 59, 64]
export const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e']

export function voicingMidis(voicing: Pick<GuitarVoicing, 'frets' | 'tuning'>, capo = 0) {
  return voicing.frets.map((fret, index) => fret < 0 ? null : voicing.tuning[index] + fret + capo)
}

export function voicingNotes(voicing: Pick<GuitarVoicing, 'frets' | 'tuning'>, capo = 0) {
  return voicingMidis(voicing, capo).map(midi => midi == null ? '×' : Note.enharmonic(Midi.midiToNoteName(midi, { sharps: true })))
}

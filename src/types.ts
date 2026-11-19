export type FretTuple = [number, number, number, number, number, number]

export type GuitarVoicing = {
  id: string
  chordSymbol: string
  name: string
  frets: FretTuple
  fingers: FretTuple
  baseFret: number
  barres: number[]
  tuning: FretTuple
}

export type SongSegment = { chord?: string; lyric: string }
export type SongLine = { type: 'lyric' | 'blank' | 'comment'; segments: SongSegment[]; text?: string }
export type SongSection = { type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'section'; label: string; lines: SongLine[] }

export type Song = {
  id: string
  title: string
  artist: string
  key: string
  tempo: number
  capo: number
  timeSignature: string
  tags: string[]
  source: string
  sections: SongSection[]
  userCreated?: boolean
  updatedAt?: number
}

export type Progression = { id: string; name: string; key: string; chords: string[]; bpm: number; beats: number; pattern: string }

export type SampleEntry = { stringIndex: number; stringName: string; fret: number; midi: number; velocity: number; file: string; sourceFile: string }
export type SampleManifest = { source: string; license: string; generatedAt: string; samples: SampleEntry[] }

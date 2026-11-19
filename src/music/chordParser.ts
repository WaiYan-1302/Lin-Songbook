import type { Song, SongLine, SongSection } from '../types'

const DIRECTIVE = /^\{([^}:]+)(?::\s*(.*))?\}$/
const SECTION_NAMES: Record<string, SongSection['type']> = {
  verse: 'verse', chorus: 'chorus', bridge: 'bridge', intro: 'intro', outro: 'outro', section: 'section',
}

export class ChordProError extends Error {
  constructor(message: string, public line: number) { super(`Line ${line}: ${message}`) }
}

export function parseLyricLine(raw: string, lineNumber = 1): SongLine {
  const segments: SongLine['segments'] = []
  let chord: string | undefined
  let lyric = ''
  const flush = () => {
    if (lyric || chord) segments.push({ chord, lyric })
    chord = undefined
    lyric = ''
  }
  for (let i = 0; i < raw.length;) {
    if (raw[i] === '[') {
      flush()
      const close = raw.indexOf(']', i + 1)
      if (close < 0) throw new ChordProError('Unclosed chord token', lineNumber)
      chord = raw.slice(i + 1, close).trim()
      if (!chord) throw new ChordProError('Empty chord token', lineNumber)
      i = close + 1
    } else {
      lyric += raw[i++]
    }
  }
  flush()
  return { type: 'lyric', segments }
}

export function parseChordPro(source: string, id: string = crypto.randomUUID()): Song {
  const meta: Record<string, string> = {}
  const sections: SongSection[] = []
  let current: SongSection = { type: 'section', label: '', lines: [] }
  const pushCurrent = () => { if (current.lines.length) sections.push(current) }

  source.replace(/\r/g, '').split('\n').forEach((raw, index) => {
    const lineNo = index + 1
    const directive = raw.trim().match(DIRECTIVE)
    if (directive) {
      const name = directive[1].toLowerCase().replace(/\s+/g, '_')
      const value = directive[2]?.trim() ?? ''
      if (name.startsWith('start_of_')) {
        pushCurrent()
        const rawType = name.slice(9)
        current = { type: SECTION_NAMES[rawType] ?? 'section', label: value || titleCase(rawType), lines: [] }
      } else if (name.startsWith('end_of_')) {
        pushCurrent()
        current = { type: 'section', label: '', lines: [] }
      } else if (name === 'comment' || name === 'c') {
        current.lines.push({ type: 'comment', text: value, segments: [] })
      } else {
        meta[name] = value
      }
      return
    }
    if (!raw.trim()) current.lines.push({ type: 'blank', segments: [] })
    else current.lines.push(parseLyricLine(raw, lineNo))
  })
  pushCurrent()
  return {
    id,
    title: meta.title || meta.t || 'Untitled song',
    artist: meta.artist || meta.subtitle || 'Unknown artist',
    key: meta.key || 'C',
    tempo: Number(meta.tempo) || 84,
    capo: Math.max(0, Math.min(12, Number(meta.capo) || 0)),
    timeSignature: meta.time || meta.time_signature || '4/4',
    tags: (meta.tags || '').split(',').map(v => v.trim()).filter(Boolean),
    source,
    sections,
  }
}

function titleCase(value: string) { return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }

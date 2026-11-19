import { Music2, Play, RotateCcw, Search, Volume2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chord } from '@tonaljs/tonal'
import { ChordDiagram } from '../components/ChordDiagram'
import { AudioStatus } from '../components/AudioStatus'
import { guitarAudio } from '../audio/GuitarAudioEngine'
import { COMMON_CHORDS, getVoicings } from '../music/chordDatabase'
import { STANDARD_TUNING, STRING_LABELS, voicingNotes } from '../music/guitarTuning'
import type { FretTuple, GuitarVoicing } from '../types'

export function ChordLabPage() {
  const [params] = useSearchParams()
  const initial = params.get('chord') || 'C'
  const [query, setQuery] = useState(initial)
  const [symbol, setSymbol] = useState(initial)
  const [voicingIndex, setVoicingIndex] = useState(0)
  const presets = useMemo(() => getVoicings(symbol), [symbol])
  const preset = presets[voicingIndex % Math.max(1, presets.length)]
  const [customFrets, setCustomFrets] = useState<FretTuple | null>(null)
  const voicing: GuitarVoicing | null = preset ? { ...preset, frets: customFrets ?? preset.frets } : null
  const notes = voicing ? voicingNotes(voicing).filter(note => note !== '×') : []
  const identified = Chord.detect(notes.map(note => note.replace(/\d/g, ''))).slice(0, 3)
  const select = (next: string) => { setSymbol(next); setQuery(next); setVoicingIndex(0); setCustomFrets(null) }
  const updateFret = (string: number, fret: number) => { if (!voicing) return; const next = [...voicing.frets] as FretTuple; next[string] = fret; setCustomFrets(next); if (fret >= 0) guitarAudio.playString(string, fret, .72) }
  return <div className="page"><div className="page-title-row"><div><p className="eyebrow">Interactive guitar explorer</p><h1>Chord Lab</h1><p>Touch a fret, hear its physical string, and watch every view stay in sync.</p></div><AudioStatus /></div>
    <div className="lab-layout"><aside className="lab-sidebar"><label className="search-box"><Search /><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && select(query)} placeholder="Try Cmaj7…" /></label><div className="chip-grid">{COMMON_CHORDS.filter(chord => chord.toLowerCase().includes(query.toLowerCase()) || query === symbol).map(chord => <button key={chord} className={chord === symbol ? 'selected' : ''} onClick={() => select(chord)}>{chord}</button>)}</div>{presets.length > 0 && <div className="voicing-list"><span className="field-label">Voicings</span>{presets.map((item, index) => <button key={item.id} onClick={() => { setVoicingIndex(index); setCustomFrets(null) }} className={index === voicingIndex ? 'selected' : ''}><b>{index + 1}</b><span>{item.frets.map(f => f < 0 ? '×' : f).join(' ')}</span></button>)}</div>}</aside>
      <section className="lab-workspace">{voicing ? <><div className="lab-heading"><div><p className="eyebrow">Current shape</p><h2>{customFrets ? (identified.join(' · ') || 'Custom voicing') : symbol}</h2></div><div className="toolbar"><button className="button ghost" onClick={() => setCustomFrets(null)}><RotateCcw /> Reset</button><button className="button primary" onClick={() => guitarAudio.playChord(voicing)}><Play fill="currentColor" /> Strum</button></div></div><div className="fretboard"><div className="fret-numbers"><span /><span>Open</span>{Array.from({ length: 12 }, (_, i) => <span key={i}>{i + 1}</span>)}</div>{[5, 4, 3, 2, 1, 0].map(string => <div className={voicing.frets[string] < 0 ? 'fret-row muted' : 'fret-row'} key={string}><span className="string-name">{STRING_LABELS[string]}</span>{Array.from({ length: 13 }, (_, fret) => { const fingered = fret > 0 && voicing.frets[string] === fret; return <button key={fret} onClick={() => updateFret(string, fret)} data-active={fingered || undefined} className={`${fret === 0 ? 'open-position ' : ''}${fingered ? 'selected' : ''}`} aria-label={`${STRING_LABELS[string]} string ${fret === 0 ? 'open' : `fret ${fret}`}`}><span>{STANDARD_TUNING[string] + fret}</span></button> })}</div>)}</div><p className="fretboard-legend"><span className="legend-dot" /> Fretted finger <b>×</b> Muted string <span>Open strings are unmarked and ring normally</span></p><div className="lab-lower"><ChordDiagram voicing={voicing} size="large" onString={index => voicing.frets[index] >= 0 && guitarAudio.playString(index, voicing.frets[index], .75)} /><div className="tab-view"><div className="field-label">Live chord tab</div>{[5, 4, 3, 2, 1, 0].map(string => <button key={string} onClick={() => voicing.frets[string] >= 0 && guitarAudio.playString(string, voicing.frets[string], .72)}>{STRING_LABELS[string]}|──{voicing.frets[string] < 0 ? 'x' : voicing.frets[string]}──</button>)}</div><div className="chord-info"><span className="field-label">Notes & intervals</span><div className="note-pills">{notes.map((note, index) => <span key={index}>{note}</span>)}</div><p>Possible names</p><strong>{identified.join(', ') || 'No close match'}</strong><button onClick={() => guitarAudio.playArpeggio(voicing)}><Music2 /> Play arpeggio</button><button onClick={() => guitarAudio.stopAll()}><Volume2 /> Stop all</button></div></div></> : <div className="empty-state"><Music2 /><h2>Voicing not found</h2><p>Try C, G, Am, F, Dm, Em, A7, Bm, Cmaj7, or Dsus4.</p></div>}</section></div>
  </div>
}

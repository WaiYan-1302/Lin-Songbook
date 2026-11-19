import { ChevronLeft, ChevronRight, Edit3, Heart, Maximize2, Minus, Pause, Play, Plus, RotateCcw, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AudioStatus } from '../components/AudioStatus'
import { ChordDiagram } from '../components/ChordDiagram'
import { guitarAudio } from '../audio/GuitarAudioEngine'
import { getVoicings } from '../music/chordDatabase'
import { transposeChord, transposeKey } from '../music/transposition'
import { voicingNotes } from '../music/guitarTuning'
import type { GuitarVoicing, Song } from '../types'

type Props = { songs: Song[]; favorites: string[]; onToggleFavorite: (id: string) => void; onOpen: (id: string) => void }
export function SongReaderPage({ songs, favorites, onToggleFavorite, onOpen }: Props) {
  const { id } = useParams()
  const song = songs.find(item => item.id === id)
  const [transpose, setTranspose] = useState(0)
  const [capo, setCapo] = useState(song?.capo ?? 0)
  const [fontSize, setFontSize] = useState(18)
  const [selected, setSelected] = useState('C')
  const [voicingIndex, setVoicingIndex] = useState(0)
  const [autoscroll, setAutoscroll] = useState(false)
  const [speed, setSpeed] = useState(2)
  const pageRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (song) onOpen(song.id) }, [song?.id])
  useEffect(() => { if (!autoscroll) return; const timer = window.setInterval(() => window.scrollBy({ top: speed * .6, behavior: 'auto' }), 40); return () => clearInterval(timer) }, [autoscroll, speed])
  const voicings = useMemo(() => getVoicings(selected), [selected])
  const voicing = voicings[voicingIndex % Math.max(1, voicings.length)]
  if (!song) return <div className="page empty-state"><h1>Song not found</h1><Link className="button primary" to="/songbook">Back to songbook</Link></div>

  const selectChord = async (raw: string) => {
    const chord = transposeChord(raw, transpose)
    setSelected(chord); setVoicingIndex(0)
    const shape = getVoicings(chord)[0]
    if (shape) await guitarAudio.playChord(capoVoicing(shape, capo))
  }
  const sounding = transposeKey(song.key, transpose + capo)
  return <div className="reader-page" ref={pageRef}>
    <header className="reader-header"><div><Link to="/songbook" className="back-link"><ChevronLeft size={17} /> Songbook</Link><p className="eyebrow">{song.artist}</p><h1>{song.title}</h1><div className="song-facts"><span>Original {song.key}</span><span>Shapes {transposeKey(song.key, transpose)}</span><span>Sounds {sounding}</span><span>{song.tempo} BPM</span><span>{song.timeSignature}</span></div></div><div className="reader-actions"><button className={favorites.includes(song.id) ? 'icon-button selected' : 'icon-button'} onClick={() => onToggleFavorite(song.id)} aria-label="Favorite"><Heart fill={favorites.includes(song.id) ? 'currentColor' : 'none'} /></button><Link className="icon-button" to={`/songbook/${song.id}/edit`} aria-label="Edit song"><Edit3 /></Link><button className="icon-button" onClick={() => document.documentElement.requestFullscreen?.()} aria-label="Fullscreen"><Maximize2 /></button></div></header>
    <div className="reader-controls">
      <div className="control-group"><span>Transpose</span><button onClick={() => setTranspose(v => Math.max(-12, v - 1))}><Minus /></button><b>{transpose > 0 ? `+${transpose}` : transpose}</b><button onClick={() => setTranspose(v => Math.min(12, v + 1))}><Plus /></button><button className="reset-control" onClick={() => setTranspose(0)} title="Reset transpose"><RotateCcw /></button></div>
      <label>Capo <select value={capo} onChange={e => setCapo(Number(e.target.value))}>{Array.from({ length: 13 }, (_, i) => <option key={i}>{i}</option>)}</select></label>
      <div className="control-group"><span>Text</span><button onClick={() => setFontSize(v => Math.max(14, v - 1))}><Minus /></button><b>{fontSize}</b><button onClick={() => setFontSize(v => Math.min(28, v + 1))}><Plus /></button></div>
      <button className={autoscroll ? 'scroll-toggle active' : 'scroll-toggle'} onClick={() => setAutoscroll(v => !v)}>{autoscroll ? <Pause /> : <Play />} Autoscroll</button>
      <label className="speed-control">Speed <input type="range" min="1" max="6" value={speed} onChange={e => setSpeed(Number(e.target.value))} /></label>
      <AudioStatus />
    </div>
    <div className="reader-layout"><article className="chord-sheet" style={{ '--sheet-font-size': `${fontSize}px` } as React.CSSProperties}>{song.sections.map((section, sectionIndex) => <section key={sectionIndex}><h2>{section.label}</h2>{section.lines.map((line, lineIndex) => line.type === 'blank' ? <div className="sheet-blank" key={lineIndex} /> : line.type === 'comment' ? <p className="sheet-comment" key={lineIndex}>{line.text}</p> : <div className="lyric-line" key={lineIndex}>{line.segments.map((segment, segmentIndex) => { const display = segment.chord ? transposeChord(segment.chord, transpose) : ''; return <span className="lyric-segment" key={segmentIndex}><button className={display === selected ? 'lyric-chord selected' : 'lyric-chord'} onClick={() => segment.chord && selectChord(segment.chord)}>{display || '\u00a0'}</button><span>{segment.lyric || '\u00a0'}</span></span> })}</div>)}</section>)}</article>
      <aside className="chord-panel">{voicing ? <><div className="panel-top"><div><p className="eyebrow">Selected chord</p><h2>{selected}</h2></div><button className="round-play" onClick={() => guitarAudio.playChord(capoVoicing(voicing, capo))}><Play size={18} fill="currentColor" /></button></div><ChordDiagram voicing={voicing} size="large" onString={index => guitarAudio.playString(index, voicing.frets[index] + capo, .75)} /><div className="note-pills">{voicingNotes(voicing, capo).map((note, i) => <span key={i}>{note}</span>)}</div><p className="capo-note">Shape {selected}{capo ? ` with capo ${capo}` : ''} · physical frets {voicing.frets.map(f => f < 0 ? '×' : f + capo).join(' ')}</p><div className="strum-row"><button onClick={() => guitarAudio.playChord(capoVoicing(voicing, capo), 'down')}>↓ Down</button><button onClick={() => guitarAudio.playChord(capoVoicing(voicing, capo), 'up')}>↑ Up</button><button onClick={() => guitarAudio.playArpeggio(capoVoicing(voicing, capo))}>Arpeggio</button></div>{voicings.length > 1 && <div className="voicing-nav"><button onClick={() => setVoicingIndex(v => (v - 1 + voicings.length) % voicings.length)}><ChevronLeft /></button><span>Voicing {voicingIndex + 1} of {voicings.length}</span><button onClick={() => setVoicingIndex(v => (v + 1) % voicings.length)}><ChevronRight /></button></div>}<Link className="button ghost full" to={`/chord-lab?chord=${encodeURIComponent(selected)}`}>Open in Chord Lab</Link></> : <div className="unsupported"><Volume2 /><h2>{selected}</h2><p>No verified guitar voicing is available for this symbol.</p><Link to="/chord-lab">Explore nearby chords</Link></div>}</aside>
    </div>
  </div>
}

function capoVoicing(voicing: GuitarVoicing, capo: number): GuitarVoicing { return { ...voicing, frets: voicing.frets.map(fret => fret < 0 ? fret : fret + capo) as GuitarVoicing['frets'] } }

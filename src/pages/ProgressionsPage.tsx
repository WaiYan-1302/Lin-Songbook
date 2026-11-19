import { ChevronDown, ChevronUp, Pause, Play, Plus, Save, Square, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Key } from '@tonaljs/tonal'
import { ChordDiagram } from '../components/ChordDiagram'
import { guitarAudio } from '../audio/GuitarAudioEngine'
import { getVoicing } from '../music/chordDatabase'
import { listProgressions, saveProgression } from '../storage/library'
import type { Progression } from '../types'

const KEYS = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb']
const ROMANS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']

export function ProgressionsPage() {
  const [keyName, setKeyName] = useState('C')
  const [chords, setChords] = useState<string[]>(() => JSON.parse(localStorage.getItem('fv:draft-progression') || '["C","G","Am","F"]'))
  const [bpm, setBpm] = useState(92)
  const [beats, setBeats] = useState(4)
  const [pattern, setPattern] = useState('one')
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState(-1)
  const [loop, setLoop] = useState(true)
  const [saved, setSaved] = useState<Progression[]>([])
  const timer = useRef<number | null>(null)
  useEffect(() => { listProgressions().then(setSaved) }, [])
  const palette = useMemo(() => Key.majorKey(keyName).chords, [keyName])
  useEffect(() => { localStorage.setItem('fv:draft-progression', JSON.stringify(chords)) }, [chords])
  useEffect(() => { const sync = () => setChords(JSON.parse(localStorage.getItem('fv:draft-progression') || '[]')); addEventListener('fv-progression', sync); return () => removeEventListener('fv-progression', sync) }, [])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); guitarAudio.stopAll() }, [])
  const playStep = async (index: number) => {
    if (!chords.length) return
    const voicing = getVoicing(chords[index])
    setActive(index)
    if (voicing) {
      await guitarAudio.playChord(voicing)
      if (pattern === 'beats') for (let beat = 1; beat < beats; beat++) setTimeout(() => guitarAudio.playChord(voicing, beat % 2 ? 'up' : 'down', .018), beat * 60000 / bpm)
      if (pattern === 'arp') guitarAudio.playArpeggio(voicing)
    }
    const duration = beats * 60000 / bpm
    timer.current = window.setTimeout(() => {
      const next = index + 1
      if (next < chords.length) playStep(next)
      else if (loop) playStep(0)
      else { setPlaying(false); setActive(-1) }
    }, duration)
  }
  const start = () => { if (timer.current) clearTimeout(timer.current); setPlaying(true); playStep(active >= 0 ? active : 0) }
  const stop = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; setPlaying(false); setActive(-1); guitarAudio.stopAll() }
  const move = (from: number, delta: number) => { const to = from + delta; if (to < 0 || to >= chords.length) return; const next = [...chords]; [next[from], next[to]] = [next[to], next[from]]; setChords(next) }
  const save = async () => { const item: Progression = { id: crypto.randomUUID(), name: `${keyName} progression`, key: keyName, chords, bpm, beats, pattern }; await saveProgression(item); setSaved(items => [...items, item]); alert('Progression saved in this browser.') }
  const load = (id: string) => { const item = saved.find(entry => entry.id === id); if (!item) return; stop(); setKeyName(item.key); setChords(item.chords); setBpm(item.bpm); setBeats(item.beats); setPattern(item.pattern) }
  return <div className="page"><div className="page-title-row"><div><p className="eyebrow">Arrangement sketchbook</p><h1>Progression Builder</h1><p>Build a loop, hear real guitar voicings, and follow the playhead.</p></div><div className="toolbar">{saved.length > 0 && <select aria-label="Load saved progression" defaultValue="" onChange={e => load(e.target.value)}><option value="" disabled>Load saved…</option>{saved.map(item => <option key={item.id} value={item.id}>{item.name} · {item.chords.join(' – ')}</option>)}</select>}<button className="button ghost" onClick={save}><Save /> Save</button></div></div>
    <div className="progression-controls"><label>Key <select value={keyName} onChange={e => setKeyName(e.target.value)}>{KEYS.map(key => <option key={key}>{key}</option>)}</select></label><label>Tempo <input type="number" min="40" max="220" value={bpm} onChange={e => setBpm(Number(e.target.value))} /> BPM</label><label>Beats <select value={beats} onChange={e => setBeats(Number(e.target.value))}><option>2</option><option>3</option><option>4</option></select></label><label>Pattern <select value={pattern} onChange={e => setPattern(e.target.value)}><option value="one">One strum</option><option value="beats">Down / up beats</option><option value="arp">Arpeggio</option></select></label><label className="check-label"><input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} /> Loop</label><div className="transport"><button onClick={playing ? () => { if (timer.current) clearTimeout(timer.current); setPlaying(false) } : start}>{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><button onClick={stop}><Square fill="currentColor" /></button></div></div>
    <section className="progression-stage">{chords.length ? chords.map((chord, index) => { const voicing = getVoicing(chord); return <article key={`${chord}-${index}`} className={active === index ? 'progression-card active' : 'progression-card'}><div className="card-number">{index + 1}</div><div><span className="roman">{palette.indexOf(chord) >= 0 ? ROMANS[palette.indexOf(chord)] : 'chrom.'}</span><h2>{chord}</h2></div>{voicing && <ChordDiagram voicing={voicing} size="compact" />}<div className="card-actions"><button onClick={() => move(index, -1)} disabled={index === 0}><ChevronUp /></button><button onClick={() => move(index, 1)} disabled={index === chords.length - 1}><ChevronDown /></button><button onClick={() => setChords(items => items.filter((_, i) => i !== index))}><Trash2 /></button></div></article> }) : <div className="empty-state"><h2>Your progression is empty</h2><p>Add a chord from the palette below.</p></div>}</section>
    <section className="palette-section"><div className="section-heading"><div><p className="eyebrow">Suggestions in {keyName} major</p><h2>Chord palette</h2></div></div><div className="chord-palette">{palette.map((chord, i) => <button key={chord} onClick={() => setChords(items => [...items, chord])}><span>{ROMANS[i]}</span><strong>{chord}</strong><Plus /></button>)}</div><p className="theory-note">Suggestions are diatonic, but borrowed and chromatic chords are welcome too.</p></section>
  </div>
}

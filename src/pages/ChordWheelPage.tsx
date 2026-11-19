import { ArrowRight, Plus, Volume2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Key, Note } from '@tonaljs/tonal'
import { guitarAudio } from '../audio/GuitarAudioEngine'
import { getVoicing } from '../music/chordDatabase'

const CIRCLE = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const MINORS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm']
const ROMANS_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
const ROMANS_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']

export function ChordWheelPage() {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<'major' | 'minor'>('major')
  const root = mode === 'major' ? CIRCLE[index] : MINORS[index].slice(0, -1)
  const data = useMemo(() => mode === 'major' ? Key.majorKey(root) : Key.minorKey(root).natural, [root, mode])
  const chords = data.chords
  const scale = data.scale
  const romans = mode === 'major' ? ROMANS_MAJOR : ROMANS_MINOR
  const select = (i: number, nextMode: 'major' | 'minor') => { setIndex(i); setMode(nextMode) }
  const play = (chord: string) => { const voicing = getVoicing(chord.replace('dim', 'dim')); if (voicing) guitarAudio.playChord(voicing) }
  const add = (chord: string) => { const saved = JSON.parse(localStorage.getItem('fv:draft-progression') || '[]') as string[]; localStorage.setItem('fv:draft-progression', JSON.stringify([...saved, chord])); window.dispatchEvent(new Event('fv-progression')) }
  return <div className="page wheel-page"><div className="page-title-row"><div><p className="eyebrow">Harmony at a glance</p><h1>Circle of Fifths</h1><p>Select a key to reveal its scale, chord family, and musical functions.</p></div><div className="segmented"><button className={mode === 'major' ? 'active' : ''} onClick={() => setMode('major')}>Major</button><button className={mode === 'minor' ? 'active' : ''} onClick={() => setMode('minor')}>Natural minor</button></div></div>
    <div className="wheel-layout"><div className="wheel-wrap"><svg viewBox="0 0 520 520" role="img" aria-label="Interactive circle of fifths"><circle cx="260" cy="260" r="225" className="wheel-base" /><circle cx="260" cy="260" r="153" className="wheel-inner" />{CIRCLE.map((key, i) => { const angle = (i * 30 - 90) * Math.PI / 180; const outerX = 260 + Math.cos(angle) * 193; const outerY = 260 + Math.sin(angle) * 193; const innerX = 260 + Math.cos(angle) * 132; const innerY = 260 + Math.sin(angle) * 132; const spoke = (i * 30 - 105) * Math.PI / 180; return <g key={key}><line x1={260 + Math.cos(spoke) * 77} y1={260 + Math.sin(spoke) * 77} x2={260 + Math.cos(spoke) * 225} y2={260 + Math.sin(spoke) * 225} className="wheel-spoke" /><circle cx={outerX} cy={outerY} r="28" className={index === i && mode === 'major' ? 'key-node selected' : 'key-node'} onClick={() => select(i, 'major')} /><text x={outerX} y={outerY + 6} textAnchor="middle" className="key-text" onClick={() => select(i, 'major')}>{key}</text><circle cx={innerX} cy={innerY} r="24" className={index === i && mode === 'minor' ? 'minor-node selected' : 'minor-node'} onClick={() => select(i, 'minor')} /><text x={innerX} y={innerY + 5} textAnchor="middle" className="minor-text" onClick={() => select(i, 'minor')}>{MINORS[i]}</text></g>})}<circle cx="260" cy="260" r="76" className="wheel-center" /><text x="260" y="247" textAnchor="middle" className="center-key">{root}{mode === 'minor' ? 'm' : ''}</text><text x="260" y="273" textAnchor="middle" className="center-label">{mode}</text><text x="260" y="293" textAnchor="middle" className="center-label">{scale.join(' · ')}</text></svg></div>
      <section className="harmony-panel"><p className="eyebrow">Diatonic harmony</p><h2>{root} {mode}</h2><p className="theory-note">{mode === 'minor' ? 'Natural-minor harmony is shown. A major V is a common harmonic-minor substitution, but is intentionally not mixed into this list.' : 'These seven chords are built from the notes of the major scale.'}</p><div className="diatonic-list">{chords.map((chord, i) => <div key={chord}><span className="roman">{romans[i]}</span><button className="chord-name" onClick={() => play(chord)}><strong>{chord}</strong><small>{Note.names().filter(() => false)}</small></button><button onClick={() => play(chord)} aria-label={`Play ${chord}`}><Volume2 /></button><button onClick={() => add(chord)} aria-label={`Add ${chord} to progression`}><Plus /></button></div>)}</div><div className="panel-links"><Link className="button ghost" to={`/chord-lab?chord=${encodeURIComponent(chords[0])}`}>Open tonic in Chord Lab <ArrowRight /></Link><Link className="button primary" to="/progressions">Build progression</Link></div></section></div>
  </div>
}

import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Edit3, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ChordDiagram } from './ChordDiagram'
import { getVoicings } from '../music/chordDatabase'
import { transposeChord } from '../music/transposition'
import type { Song, SongProgression } from '../types'

type Props = {
  song: Song
  transpose: number
  onChord: (chord: string) => void
  onSave: (song: Song) => Promise<void>
}

export function SongProgressionRoadmap({ song, transpose, onChord, onSave }: Props) {
  const inferred = useMemo(() => song.progressions?.length ? song.progressions : inferProgressions(song), [song])
  const [progressions, setProgressions] = useState<SongProgression[]>(inferred)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (!editing) setProgressions(inferred) }, [inferred, editing])

  const update = (index: number, next: SongProgression) => setProgressions(items => items.map((item, itemIndex) => itemIndex === index ? next : item))
  const moveProgression = (index: number, direction: -1 | 1) => setProgressions(items => move(items, index, index + direction))
  const moveChord = (progressionIndex: number, chordIndex: number, direction: -1 | 1) => {
    const progression = progressions[progressionIndex]
    update(progressionIndex, { ...progression, chords: move(progression.chords, chordIndex, chordIndex + direction) })
  }
  const addProgression = () => setProgressions(items => [...items, { id: crypto.randomUUID(), label: `Section ${items.length + 1}`, chords: [] }])
  const save = async () => {
    setSaving(true); setError('')
    try {
      await onSave({ ...song, progressions, userCreated: true, updatedAt: Date.now() })
      setEditing(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the roadmap.')
    } finally { setSaving(false) }
  }

  if (!progressions.length && !editing) return <section className="song-roadmap roadmap-empty"><div><p className="eyebrow">Play at a glance</p><h2>Chord roadmap</h2><p>No chords were found in this song yet.</p></div><button className="button ghost" onClick={() => setEditing(true)}><Plus /> Add progression</button></section>

  return <section className="song-roadmap" aria-labelledby="roadmap-heading">
    <header className="roadmap-header"><div><p className="eyebrow">Play at a glance</p><h2 id="roadmap-heading">Chord roadmap</h2><p>Fingering shapes for each part of the song.</p></div>{editing ? <div className="roadmap-header-actions"><button className="button ghost" onClick={() => { setProgressions(inferred); setEditing(false); setError('') }}><X /> Cancel</button><button className="button primary" disabled={saving} onClick={save}><Check /> {saving ? 'Saving…' : 'Save roadmap'}</button></div> : <button className="button ghost" onClick={() => setEditing(true)}><Edit3 /> Customize</button>}</header>
    {error && <p className="roadmap-error" role="alert">{error}</p>}
    <div className="roadmap-sections">{progressions.map((progression, progressionIndex) => <section className="roadmap-section" key={progression.id}>
      <div className="roadmap-section-head">{editing ? <input aria-label={`Progression ${progressionIndex + 1} name`} value={progression.label} onChange={event => update(progressionIndex, { ...progression, label: event.target.value })} /> : <h3>{progression.label}</h3>}{editing && <div className="roadmap-section-actions"><button aria-label={`Move ${progression.label} up`} disabled={progressionIndex === 0} onClick={() => moveProgression(progressionIndex, -1)}><ChevronUp /></button><button aria-label={`Move ${progression.label} down`} disabled={progressionIndex === progressions.length - 1} onClick={() => moveProgression(progressionIndex, 1)}><ChevronDown /></button><button className="danger" aria-label={`Delete ${progression.label}`} onClick={() => setProgressions(items => items.filter((_, index) => index !== progressionIndex))}><Trash2 /></button></div>}</div>
      <div className="roadmap-track">{progression.chords.map((chord, chordIndex) => <RoadmapChord key={`${progression.id}-${chordIndex}`} chord={chord} transpose={transpose} editing={editing} first={chordIndex === 0} last={chordIndex === progression.chords.length - 1} onPlay={() => onChord(chord)} onMove={direction => moveChord(progressionIndex, chordIndex, direction)} onDelete={() => update(progressionIndex, { ...progression, chords: progression.chords.filter((_, index) => index !== chordIndex) })} />)}{editing && <ChordAdder label={progression.label} onAdd={chords => update(progressionIndex, { ...progression, chords: [...progression.chords, ...chords] })} />}{!progression.chords.length && !editing && <p className="roadmap-no-chords">No chords in this progression.</p>}</div>
    </section>)}</div>
    {editing && <button className="button ghost roadmap-add-section" onClick={addProgression}><Plus /> Add another progression</button>}
  </section>
}

function RoadmapChord({ chord, transpose, editing, first, last, onPlay, onMove, onDelete }: { chord: string; transpose: number; editing: boolean; first: boolean; last: boolean; onPlay: () => void; onMove: (direction: -1 | 1) => void; onDelete: () => void }) {
  const display = transposeChord(chord, transpose)
  const voicing = getVoicings(display)[0]
  return <article className="roadmap-chord"><button className="roadmap-shape" onClick={onPlay} aria-label={`Play ${display}`}>{voicing ? <ChordDiagram voicing={voicing} size="compact" /> : <><strong>{display}</strong><span>No diagram available</span></>}</button>{editing && <div className="roadmap-chord-actions"><button aria-label={`Move ${display} left`} disabled={first} onClick={() => onMove(-1)}><ChevronLeft /></button><button aria-label={`Move ${display} right`} disabled={last} onClick={() => onMove(1)}><ChevronRight /></button><button className="danger" aria-label={`Remove ${display}`} onClick={onDelete}><Trash2 /></button></div>}</article>
}

function ChordAdder({ label, onAdd }: { label: string; onAdd: (chords: string[]) => void }) {
  const [value, setValue] = useState('')
  const add = () => {
    const chords = value.split(/[\s,|]+/).map(chord => chord.trim()).filter(Boolean)
    if (chords.length) { onAdd(chords); setValue('') }
  }
  return <div className="roadmap-chord roadmap-adder"><input aria-label={`Add chords to ${label}`} placeholder="Am F C G" value={value} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') add() }} /><button className="button ghost" onClick={add}><Plus /> Add chords</button></div>
}

function inferProgressions(song: Song): SongProgression[] {
  return song.sections.map((section, index) => {
    const chords = section.lines.flatMap(line => line.segments.map(segment => segment.chord).filter((chord): chord is string => Boolean(chord)))
    return { id: `section-${index}`, label: section.label || `Section ${index + 1}`, chords: chords.filter((chord, chordIndex) => chordIndex === 0 || chord !== chords[chordIndex - 1]) }
  }).filter(progression => progression.chords.length)
}

function move<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length || from === to) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

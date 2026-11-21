import { AlertCircle, Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Song } from '../types'
import { parseChordPro } from '../music/chordParser'

const TEMPLATE = `{title: New Song}\n{artist: Your name}\n{key: C}\n{tempo: 84}\n{capo: 0}\n{tags: original}\n\n{start_of_verse: Verse 1}\n[C]Write a line with [Am]chords\n[F]Above the words they [G]belong\n{end_of_verse}`

export function SongEditorPage({ songs, onSave }: { songs: Song[]; onSave: (song: Song) => Promise<void> }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = songs.find(song => song.id === id)
  const [source, setSource] = useState(existing?.source ?? TEMPLATE)
  const parsed = useMemo(() => { try { return { song: parseChordPro(source, existing?.id ?? crypto.randomUUID()) } } catch (error) { return { error: error instanceof Error ? error.message : 'Could not parse song' } } }, [source, existing?.id])
  const save = async () => { if (parsed.song) { const song = { ...parsed.song, progressions: existing?.progressions, userCreated: true, updatedAt: Date.now() }; await onSave(song); navigate(`/songbook/${song.id}`) } }
  return <div className="page editor-page"><div className="page-title-row"><div><p className="eyebrow">ChordPro editor</p><h1>{existing ? `Edit ${existing.title}` : 'Add a song'}</h1></div><div className="toolbar"><button className="button ghost" onClick={() => navigate(-1)}><X size={16} /> Cancel</button><button className="button primary" disabled={!parsed.song} onClick={save}><Check size={16} /> Save song</button></div></div>
    <div className="editor-grid"><div><label className="field-label" htmlFor="source">Song source</label><textarea id="source" spellCheck={false} value={source} onChange={e => setSource(e.target.value)} /></div><div className="live-preview"><span className="field-label">Live preview</span>{parsed.error ? <div className="parse-error"><AlertCircle />{parsed.error}</div> : parsed.song && <><h2>{parsed.song.title}</h2><p>{parsed.song.artist} · {parsed.song.key} · {parsed.song.tempo} BPM</p>{parsed.song.sections.map((section, i) => <section key={i}><h3>{section.label}</h3>{section.lines.map((line, j) => <div className="preview-line" key={j}>{line.segments.map((segment, k) => <span key={k}><b>{segment.chord || '\u00a0'}</b>{segment.lyric || '\u00a0'}</span>)}</div>)}</section>)}</>}</div></div>
  </div>
}

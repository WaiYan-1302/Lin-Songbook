import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { demoSongs } from './data/demoSongs'
import { parseChordPro } from './music/chordParser'
import { deleteSong, getUserSongs, prefs, saveSong } from './storage/library'
import type { Song } from './types'

const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })))
const SongbookPage = lazy(() => import('./pages/SongbookPage').then(module => ({ default: module.SongbookPage })))
const SongEditorPage = lazy(() => import('./pages/SongEditorPage').then(module => ({ default: module.SongEditorPage })))
const SongReaderPage = lazy(() => import('./pages/SongReaderPage').then(module => ({ default: module.SongReaderPage })))
const ChordLabPage = lazy(() => import('./pages/ChordLabPage').then(module => ({ default: module.ChordLabPage })))
const ChordWheelPage = lazy(() => import('./pages/ChordWheelPage').then(module => ({ default: module.ChordWheelPage })))
const ProgressionsPage = lazy(() => import('./pages/ProgressionsPage').then(module => ({ default: module.ProgressionsPage })))
const GuitarTunerPage = lazy(() => import('./pages/GuitarTunerPage').then(module => ({ default: module.GuitarTunerPage })))
const ToolsPage = lazy(() => import('./pages/ToolsPage').then(module => ({ default: module.ToolsPage })))
const MetronomePage = lazy(() => import('./pages/MetronomePage').then(module => ({ default: module.MetronomePage })))
const TabEditorPage = lazy(() => import('./pages/TabEditorPage').then(module => ({ default: module.TabEditorPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })))

export default function App() {
  const [userSongs, setUserSongs] = useState<Song[]>([])
  const [favorites, setFavorites] = useState<string[]>(() => prefs.get('favorites', ['demo-1']))
  const [recent, setRecent] = useState<string[]>(() => prefs.get('recent', []))
  const [deletedSongIds, setDeletedSongIds] = useState<string[]>(() => prefs.get('deleted-song-ids', []))

  useEffect(() => {
    let active = true
    const refreshSongs = () => { getUserSongs().then(songs => { if (active) setUserSongs(songs) }) }
    refreshSongs()
    window.addEventListener('focus', refreshSongs)
    return () => { active = false; window.removeEventListener('focus', refreshSongs) }
  }, [])
  useEffect(() => { prefs.set('favorites', favorites) }, [favorites])
  useEffect(() => { prefs.set('deleted-song-ids', deletedSongIds) }, [deletedSongIds])

  const songs = useMemo(() => {
    const byId = new Map(demoSongs.filter(song => !deletedSongIds.includes(song.id)).map(song => [song.id, song]))
    userSongs.forEach(song => byId.set(song.id, song))
    return [...byId.values()].sort((a, b) => recent.indexOf(a.id) === -1 ? 1 : recent.indexOf(b.id) === -1 ? -1 : recent.indexOf(a.id) - recent.indexOf(b.id))
  }, [userSongs, recent, deletedSongIds])

  const save = async (song: Song) => {
    await saveSong(song)
    setUserSongs(items => [...items.filter(item => item.id !== song.id), song])
    setDeletedSongIds(items => items.filter(id => id !== song.id))
  }
  const remove = async (id: string) => {
    await deleteSong(id)
    setUserSongs(items => items.filter(song => song.id !== id))
    setDeletedSongIds(items => items.includes(id) ? items : [...items, id])
    setFavorites(items => items.filter(item => item !== id))
    setRecent(items => {
      const next = items.filter(item => item !== id)
      prefs.set('recent', next)
      return next
    })
  }
  const importSong = async (source: string) => {
    try {
      if (source.trimStart().startsWith('{"version"') || source.trimStart().startsWith('{\n  "version"')) {
        const backup = JSON.parse(source) as { songs?: Song[] }
        if (!Array.isArray(backup.songs)) throw new Error('This backup does not contain a songs array')
        for (const item of backup.songs) await save({ ...item, userCreated: true, updatedAt: Date.now() })
        alert(`Imported ${backup.songs.length} songs from backup.`)
        return
      }
      const song = { ...parseChordPro(source), userCreated: true, updatedAt: Date.now() }
      await save(song)
      alert(`Imported "${song.title}".`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not import song')
    }
  }
  const toggleFavorite = (id: string) => setFavorites(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id])
  const open = (id: string) => setRecent(items => {
    const next = [id, ...items.filter(item => item !== id)].slice(0, 8)
    prefs.set('recent', next)
    return next
  })

  return <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Suspense fallback={<div className="route-loading">Opening your notebook…</div>}>
      <Routes><Route element={<Layout />}>
        <Route index element={<HomePage songs={songs} favorites={favorites} />} />
        <Route path="songbook" element={<SongbookPage songs={songs} favorites={favorites} onToggleFavorite={toggleFavorite} onImport={importSong} onDelete={remove} />} />
        <Route path="songbook/new" element={<SongEditorPage songs={songs} onSave={save} />} />
        <Route path="songbook/:id/edit" element={<SongEditorPage songs={songs} onSave={save} />} />
        <Route path="songbook/:id" element={<SongReaderPage songs={songs} favorites={favorites} onToggleFavorite={toggleFavorite} onOpen={open} onSave={save} />} />
        <Route path="chord-lab" element={<ChordLabPage />} />
        <Route path="chord-wheel" element={<ChordWheelPage />} />
        <Route path="progressions" element={<ProgressionsPage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="tools/tuner" element={<GuitarTunerPage />} />
        <Route path="tools/metronome" element={<MetronomePage />} />
        <Route path="tuner" element={<Navigate to="/tools/tuner" replace />} />
        <Route path="metronome" element={<Navigate to="/tools/metronome" replace />} />
        <Route path="tab-editor" element={<TabEditorPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route></Routes>
    </Suspense>
  </BrowserRouter>
}

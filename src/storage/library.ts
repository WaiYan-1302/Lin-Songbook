import { openDB } from 'idb'
import type { Progression, Song } from '../types'

const dbPromise = openDB('fret-and-verse', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('progressions')) db.createObjectStore('progressions', { keyPath: 'id' })
  },
})

const SYNC_CODE_KEY = 'sync-code'
const TOMBSTONES_KEY = 'song-tombstones'
type Tombstones = Record<string, number>
type CloudSong = { id: string; song: Song | null; updatedAt: number; deleted: boolean }

export const prefs = {
  get<T>(key: string, fallback: T): T {
    try { const raw = localStorage.getItem(`fv:${key}`); return raw == null ? fallback : JSON.parse(raw) as T } catch { return fallback }
  },
  set(key: string, value: unknown) { localStorage.setItem(`fv:${key}`, JSON.stringify(value)) },
  remove(key: string) { localStorage.removeItem(`fv:${key}`) },
}

export function getSyncCode() { return prefs.get(SYNC_CODE_KEY, '') }
export function formatSyncCode(code: string) { return normalizeSyncCode(code).match(/.{1,8}/g)?.join('-') ?? '' }
export function normalizeSyncCode(code: string) { return code.toLowerCase().replace(/[^a-f0-9]/g, '') }
export function createSyncCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function connectCloudLibrary(code = createSyncCode()) {
  const normalized = normalizeSyncCode(code)
  if (!/^[a-f0-9]{32}$/.test(normalized)) throw new Error('Sync codes must contain 32 letters and numbers.')
  prefs.set(SYNC_CODE_KEY, normalized)
  try { return await syncUserSongs() } catch (error) { prefs.remove(SYNC_CODE_KEY); throw error }
}

export function disconnectCloudLibrary() { prefs.remove(SYNC_CODE_KEY) }

export async function listUserSongs(): Promise<Song[]> { return (await dbPromise).getAll('songs') }
export async function saveUserSong(song: Song) { return saveSong(song) }
export async function deleteUserSong(id: string) { return deleteSong(id) }
export async function listProgressions(): Promise<Progression[]> { return (await dbPromise).getAll('progressions') }
export async function saveProgression(progression: Progression) { return (await dbPromise).put('progressions', progression) }

export async function getUserSongs(): Promise<Song[]> {
  if (!getSyncCode()) return listUserSongs()
  try { return await syncUserSongs() } catch (error) {
    console.warn('Cloud song sync is temporarily unavailable.', error)
    return listUserSongs()
  }
}

export async function saveSong(song: Song) {
  const saved = { ...song, userCreated: true, updatedAt: song.updatedAt ?? Date.now() }
  await (await dbPromise).put('songs', saved)
  const tombstones = prefs.get<Tombstones>(TOMBSTONES_KEY, {})
  if (tombstones[saved.id]) { delete tombstones[saved.id]; prefs.set(TOMBSTONES_KEY, tombstones) }
  if (getSyncCode()) writeCloudSong(saved).catch(error => console.warn('Song saved locally; cloud sync will retry later.', error))
}

export async function deleteSong(id: string) {
  const updatedAt = Date.now()
  await (await dbPromise).delete('songs', id)
  const tombstones = prefs.get<Tombstones>(TOMBSTONES_KEY, {})
  tombstones[id] = updatedAt
  prefs.set(TOMBSTONES_KEY, tombstones)
  if (getSyncCode()) deleteCloudSong(id, updatedAt).catch(error => console.warn('Song deleted locally; cloud sync will retry later.', error))
}

async function syncUserSongs(): Promise<Song[]> {
  const db = await dbPromise
  const [localSongs, remoteSongs] = await Promise.all([db.getAll('songs') as Promise<Song[]>, cloudRequest<CloudSong[]>('/api/songs')])
  const localById = new Map(localSongs.map(song => [song.id, song]))
  const remoteById = new Map(remoteSongs.map(item => [item.id, item]))
  const tombstones = prefs.get<Tombstones>(TOMBSTONES_KEY, {})
  const ids = new Set([...localById.keys(), ...remoteById.keys(), ...Object.keys(tombstones)])

  for (const id of ids) {
    const local = localById.get(id)
    const localSavedAt = local?.updatedAt ?? 0
    const localDeletedAt = tombstones[id] ?? 0
    const localUpdatedAt = Math.max(localSavedAt, localDeletedAt)
    const remote = remoteById.get(id)
    const remoteUpdatedAt = remote?.updatedAt ?? 0

    if (remote && remoteUpdatedAt > localUpdatedAt) {
      if (remote.deleted || !remote.song) {
        await db.delete('songs', id)
        tombstones[id] = remoteUpdatedAt
      } else {
        await db.put('songs', remote.song)
        delete tombstones[id]
      }
    } else if (localUpdatedAt > remoteUpdatedAt) {
      if (localDeletedAt > localSavedAt) await deleteCloudSong(id, localDeletedAt)
      else if (local) await writeCloudSong(local)
    }
  }

  prefs.set(TOMBSTONES_KEY, tombstones)
  return db.getAll('songs')
}

async function writeCloudSong(song: Song) {
  await cloudRequest(`/api/songs/${encodeURIComponent(song.id)}`, { method: 'PUT', body: JSON.stringify(song) })
}

async function deleteCloudSong(id: string, updatedAt: number) {
  await cloudRequest(`/api/songs/${encodeURIComponent(id)}?updatedAt=${updatedAt}`, { method: 'DELETE' })
}

async function cloudRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const code = getSyncCode()
  if (!code) throw new Error('Cloud sync is not connected.')
  const response = await fetch(path, {
    ...init,
    headers: { 'Authorization': `Bearer ${code}`, 'Content-Type': 'application/json', ...init.headers },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(payload?.error || 'Cloud sync could not be reached.')
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

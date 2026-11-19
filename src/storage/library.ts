import { openDB } from 'idb'
import type { Progression, Song } from '../types'

const dbPromise = openDB('fret-and-verse', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('progressions')) db.createObjectStore('progressions', { keyPath: 'id' })
  },
})

export async function listUserSongs(): Promise<Song[]> { return (await dbPromise).getAll('songs') }
export async function saveUserSong(song: Song) { return (await dbPromise).put('songs', { ...song, userCreated: true, updatedAt: Date.now() }) }
export async function deleteUserSong(id: string) { return (await dbPromise).delete('songs', id) }
export async function listProgressions(): Promise<Progression[]> { return (await dbPromise).getAll('progressions') }
export async function saveProgression(progression: Progression) { return (await dbPromise).put('progressions', progression) }

export const prefs = {
  get<T>(key: string, fallback: T): T {
    try { const raw = localStorage.getItem(`fv:${key}`); return raw == null ? fallback : JSON.parse(raw) as T } catch { return fallback }
  },
  set(key: string, value: unknown) { localStorage.setItem(`fv:${key}`, JSON.stringify(value)) },
}

export async function getUserSongs(): Promise<Song[]> { return (await dbPromise).getAll('songs') }
export async function saveSong(song: Song) { return (await dbPromise).put('songs', song) }
export async function deleteSong(id: string) { return (await dbPromise).delete('songs', id) }

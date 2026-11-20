const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
})

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/songs')) return env.ASSETS.fetch(request)

    try {
      const libraryId = await authenticate(request)
      if (!libraryId) return json({ error: 'A valid sync code is required.' }, 401)

      if (url.pathname === '/api/songs' && request.method === 'GET') {
        const result = await env.DB.prepare(
          'SELECT song_id, song_json, updated_at, deleted FROM songs WHERE library_id = ? ORDER BY updated_at DESC'
        ).bind(libraryId).all()
        return json(result.results.map(row => ({
          id: row.song_id,
          song: row.song_json ? JSON.parse(row.song_json) : null,
          updatedAt: row.updated_at,
          deleted: Boolean(row.deleted),
        })))
      }

      const id = decodeURIComponent(url.pathname.slice('/api/songs/'.length))
      if (!id || id.length > 128 || id.includes('/')) return json({ error: 'Invalid song ID.' }, 400)

      if (request.method === 'PUT') {
        if (Number(request.headers.get('content-length') || 0) > 250_000) return json({ error: 'Song is too large.' }, 413)
        const song = await request.json()
        if (!song || song.id !== id || typeof song.title !== 'string' || typeof song.source !== 'string') return json({ error: 'Invalid song data.' }, 400)
        const updatedAt = Number(song.updatedAt) || Date.now()
        await env.DB.prepare(
          `INSERT INTO songs (library_id, song_id, song_json, updated_at, deleted)
           VALUES (?, ?, ?, ?, 0)
           ON CONFLICT(library_id, song_id) DO UPDATE SET song_json = excluded.song_json, updated_at = excluded.updated_at, deleted = 0
           WHERE excluded.updated_at >= songs.updated_at`
        ).bind(libraryId, id, JSON.stringify(song), updatedAt).run()
        return json({ ok: true })
      }

      if (request.method === 'DELETE') {
        const updatedAt = Number(url.searchParams.get('updatedAt')) || Date.now()
        await env.DB.prepare(
          `INSERT INTO songs (library_id, song_id, song_json, updated_at, deleted)
           VALUES (?, ?, NULL, ?, 1)
           ON CONFLICT(library_id, song_id) DO UPDATE SET song_json = NULL, updated_at = excluded.updated_at, deleted = 1
           WHERE excluded.updated_at >= songs.updated_at`
        ).bind(libraryId, id, updatedAt).run()
        return new Response(null, { status: 204 })
      }

      return json({ error: 'Method not allowed.' }, 405)
    } catch (error) {
      console.error(error)
      return json({ error: 'Cloud sync failed. Please try again.' }, 500)
    }
  },
}

async function authenticate(request) {
  const match = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{32})$/)
  if (!match) return null
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(match[1]))
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

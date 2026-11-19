# Architecture

The app is a Vite/React static SPA. There is no backend and no required secret.

## Shared data flow

`@tombatossals/chords-db` → chord adapter → normalized `GuitarVoicing` → diagram, fretboard/tab, song reader, progression scheduler, and audio engine.

The string convention is always low E through high E: `[E2, A2, D3, G3, B3, E4]`. Frets use `-1` for muted, `0` for open, and positive values for fretted notes.

ChordPro source → safe parser → song/section/line/segment structures → React lyric rendering. Chords remain attached to their lyric segment rather than being aligned with manually inserted spaces.

## Capo and transposition

Transposition changes the displayed/fingered chord symbol. Capo changes physical sounding pitch without changing the displayed shape. The reader exposes original key, shape key, and sounding key separately. When playing a capoed shape, the audio engine receives the physical fret (shape fret plus capo).

## Persistence

- Static demo songs: `src/data/demoSongs.ts`
- User songs and saved progressions: IndexedDB database `fret-and-verse`, schema version 1
- Preferences, favorites, recent items, and progression draft: namespaced localStorage keys

Edits to a demo song are stored as a local override with the same ID; deleting that local override restores the static demo.

## Performance

Routes are lazy-loaded. Guitar buffers are also lazy and cached per file. The initial page does not download the entire sample pack.

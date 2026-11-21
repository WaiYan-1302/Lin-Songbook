# Fretbook

Fretbook is a local-first guitar songbook and harmony notebook. It combines structured ChordPro-style lyrics, physical guitar voicings, recorded steel-string audio, editable song roadmaps, an editable fretboard and tab view, a circle of fifths, and a timed progression builder.

The name lives primarily in `src/components/Layout.tsx` and `index.html`, so it is easy to rename.

## Quick start

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`.

The repository already contains the selected CC0 guitar recordings. To recreate or verify them from the official source:

```bash
npm run prepare:samples
```

Build and test:

```bash
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

## What works

- Responsive navigation and layouts for desktop, tablet, and mobile.
- Four original demo songs, including English and Japanese Unicode lyrics.
- A safe ChordPro-compatible parser for metadata, sections, comments, blank lines, inline chords, and malformed-token errors.
- Structured chord-over-lyric rendering without inserted spacing or unsafe HTML.
- Song transposition, slash-chord bass transposition, capo/sounding-pitch distinction, font size, autoscroll, favorites, fullscreen, import, export, editing, and backup.
- Local-first IndexedDB song/progression storage with optional private-code cloud sync for songs across devices.
- `@tombatossals/chords-db` adapter with multiple voicings and one normalized low-E-to-high-E model.
- Reusable custom SVG chord diagram with muted/open strings, finger numbers, base-fret labels, and tappable strings.
- Sample-backed guitar playback for individual strings, down/up strums, and arpeggios. Audio nodes initialize only after a user gesture.
- Chord Lab with 12-fret editing, live chord identification, diagram, notes, voicings, and a six-line chord-position tab view.
- SVG circle of fifths with major and natural-minor contexts, scales, Roman numerals, playback, and “add to progression”.
- Progression reordering, tempo, beats per chord, patterns, play/pause/stop, looping, active playhead, save, and load.
- Warm-paper and dark themes with reduced-motion handling.

## Recorded guitar audio

The local bundle contains **77 OGG files (6,247,183 bytes)** from Meta Open Sound’s `meta-steel-guitar`, using velocity layer 2 and the physical range from fret 0 through 12 for each string.

The official manifest does not include low-E-string B2 at velocity layer 2 (fret 7), so that single position uses the documented same-string nearest-sample pitch-shift fallback. All other selected positions have a direct physical-string recording. No oscillator or synthetic guitar fallback exists; missing audio produces an error state.

See [Audio setup](docs/AUDIO_SETUP.md) and the generated `public/audio/guitar/steel/manifest.json` for the exact acquired filenames.

## Storage and privacy

User songs and saved progressions live in IndexedDB, so they continue to work offline. In Settings, users can optionally create a private sync code; user-created songs are then mirrored to Cloudflare D1 and can be shared with another device using the same code. The code is the key to that library and should be kept private. Small preferences remain in localStorage.

## Cloudflare Pages

1. Push the project to a Git repository.
2. In Cloudflare Pages, choose **Create application → Pages → Connect to Git**.
3. Set the framework preset to **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Leave environment variables empty.

`wrangler.jsonc` supplies the SPA deep-link fallback for Cloudflare Workers static assets. All audio is deployed from local static assets; the app makes no runtime request to GitHub.

Vercel can deploy the same `dist` output. GitHub Pages can use `vite build --base=/REPOSITORY_NAME/`; the build also emits `404.html` for SPA deep links, and the router uses Vite’s base path.

## Current limitations

- The first audio pack includes one velocity layer, not the full 375-recording collection.
- The tab screen is a chord-position explorer, not a time-based Guitar Pro editor.
- The progression scheduler provides practical strums/arpeggios, not a full rhythm-sequencing UI.
- The editor supports the documented ChordPro subset rather than the entire ChordPro specification.
- Audio was automated in Chromium/WebKit, but listening quality remains subjective and should be checked on target phones and speakers.

## Version 2 ideas

- Add a selected soft velocity layer and round-robin alternates for common open chords.
- Add nylon guitar as an optional pack after the steel pack remains the default.
- Add harmonic-minor V/V options, secondary dominants, borrowed chords, and voice-leading views.
- Add installable PWA/offline caching and optional user-controlled file-system sync.
- Add named progression sets, MIDI export, count-in, and metronome accents.

More implementation detail is in [Architecture](docs/ARCHITECTURE.md), [Deployment](docs/DEPLOYMENT.md), and [Third-party licenses](docs/THIRD_PARTY_LICENSES.md).

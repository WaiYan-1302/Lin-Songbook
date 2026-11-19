# Audio setup

## Source

The acoustic recordings come from Meta Open Sound:

- Collection: `systems/instruments/meta-steel-guitar`
- Official manifest: `https://github.com/facebookincubator/Meta-open-sound/blob/main/systems/instruments/meta-steel-guitar/manifest.json`
- License: CC0-1.0
- Local license copy: `public/audio/guitar/steel/LICENSE`

## Prepare samples

```bash
npm run prepare:samples
```

The script performs these steps:

1. Fetches the official instrument manifest.
2. Parses source filenames into physical string, velocity, pitch, and MIDI values.
3. Selects velocity layer 2 for frets 0–12 in standard tuning.
4. Derives each OGG path from a verified manifest filename.
5. Skips existing nonempty files.
6. Downloads recordings to `public/audio/guitar/steel/`.
7. Writes a normalized local `manifest.json` and copies the upstream README/license.
8. Exits unsuccessfully and reports filenames if any selected download fails.

The current result is 77 OGG recordings. Five strings have all 13 positions. Meta’s official velocity-2 listing omits low-E B2 (fret 7), so playback for that position pitch-shifts the nearest sample on the same low-E string by one semitone.

## Runtime behavior

`GuitarAudioEngine` loads only the manifest initially. A sample buffer is fetched on first use and cached afterward. Each physical string has one active player: replacing a note on that string fades the old player briefly, while other strings keep ringing. Downstrokes and upstrokes reverse physical string order and use small timing/velocity variation.

There is no synthesizer fallback. If the manifest or an OGG file is unavailable, the UI reports the failure.

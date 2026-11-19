import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SOURCE_ROOT = 'https://raw.githubusercontent.com/facebookincubator/Meta-open-sound/main/systems/instruments/meta-steel-guitar'
const OUTPUT = join(process.cwd(), 'public', 'audio', 'guitar', 'steel')
const OPEN_MIDI = { LowE: 40, A: 45, D: 50, G: 55, B: 59, HighE: 64 }
const STRING_INDEX = { LowE: 0, A: 1, D: 2, G: 3, B: 4, HighE: 5 }
const NOTE_PC = { C: 0, Cs: 1, D: 2, Ds: 3, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11 }

function parseFile(file) {
  const match = file.match(/^INSGuitarSteel_String(LowE|HighE|A|D|G|B)_Vel(\d{2})_([A-G](?:s)?)(\d)_\d+\.wav$/)
  if (!match) return null
  const [, stringName, velocityRaw, note, octaveRaw] = match
  const midi = (Number(octaveRaw) + 1) * 12 + NOTE_PC[note]
  return { stringName, stringIndex: STRING_INDEX[stringName], velocity: Number(velocityRaw), midi, fret: midi - OPEN_MIDI[stringName], sourceFile: file }
}

async function fetchOk(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'fret-and-verse-sample-preparer' } })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  return response
}

async function main() {
  await mkdir(OUTPUT, { recursive: true })
  const official = await (await fetchOk(`${SOURCE_ROOT}/manifest.json`)).json()
  const selected = official.samples.map(item => parseFile(item.file)).filter(item => item && item.velocity === 2 && item.fret >= 0 && item.fret <= 12)
  const failures = []
  let downloaded = 0
  for (const item of selected) {
    const file = item.sourceFile.replace(/\.wav$/i, '.ogg')
    const destination = join(OUTPUT, file)
    let valid = false
    try { valid = (await stat(destination)).size > 256 } catch { /* not downloaded */ }
    if (!valid) {
      try {
        const bytes = new Uint8Array(await (await fetchOk(`${SOURCE_ROOT}/ogg/${file}`)).arrayBuffer())
        if (bytes.length <= 256) throw new Error('downloaded file is unexpectedly small')
        await writeFile(destination, bytes)
        downloaded++
      } catch (error) { failures.push(`${file}: ${error.message}`); continue }
    }
    item.file = file
  }
  const usable = selected.filter(item => item.file)
  const normalized = {
    id: official.id,
    source: `${SOURCE_ROOT}/manifest.json`,
    license: official.license,
    generatedAt: new Date().toISOString(),
    strategy: 'Physical-string-specific samples, velocity layer 2, frets 0–12',
    samples: usable,
  }
  await writeFile(join(OUTPUT, 'manifest.json'), JSON.stringify(normalized, null, 2))
  for (const name of ['LICENSE', 'README.md']) {
    try { await writeFile(join(OUTPUT, name), await (await fetchOk(`${SOURCE_ROOT}/${name}`)).text()) } catch (error) { failures.push(`${name}: ${error.message}`) }
  }
  console.log(`Prepared ${usable.length} samples (${downloaded} downloaded, ${usable.length - downloaded} reused).`)
  if (failures.length) { console.error(`Failures (${failures.length}):\n${failures.join('\n')}`); process.exitCode = 1 }
}

main().catch(error => { console.error(error); process.exitCode = 1 })

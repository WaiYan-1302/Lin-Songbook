import * as Tone from 'tone'
import type { GuitarVoicing, SampleEntry, SampleManifest } from '../types'

export type AudioStatus = 'idle' | 'loading' | 'ready' | 'error'
type Listener = (status: AudioStatus, message?: string) => void

class GuitarAudioEngine {
  private manifest: SampleManifest | null = null
  private buffers = new Map<string, Tone.ToneAudioBuffer>()
  private active = new Map<number, Tone.Player>()
  private listeners = new Set<Listener>()
  private masterVolume = -8
  status: AudioStatus = 'idle'
  message = 'Audio is waiting for your first interaction.'

  subscribe(listener: Listener) { this.listeners.add(listener); listener(this.status, this.message); return () => { this.listeners.delete(listener) } }
  private update(status: AudioStatus, message?: string) { this.status = status; this.message = message ?? ''; this.listeners.forEach(fn => fn(status, message)) }

  async initializeAudio() {
    if (this.status === 'ready') { await Tone.start(); return }
    this.update('loading', 'Loading recorded steel-string guitar…')
    try {
      await Tone.start()
      const response = await fetch('/audio/guitar/steel/manifest.json')
      if (!response.ok) throw new Error(`Sample manifest unavailable (${response.status})`)
      this.manifest = await response.json() as SampleManifest
      if (!this.manifest.samples?.length) throw new Error('The local sample manifest contains no recordings')
      this.update('ready', `${this.manifest.samples.length} recorded guitar samples available`)
    } catch (error) {
      this.update('error', error instanceof Error ? error.message : 'Recorded guitar samples unavailable')
      throw error
    }
  }

  setVolume(value: number) { this.masterVolume = Math.max(-40, Math.min(2, value)) }

  private findSample(stringIndex: number, fret: number, velocity: number) {
    const samples = this.manifest?.samples.filter(sample => sample.stringIndex === stringIndex) ?? []
    return samples.sort((a, b) => Math.abs(a.fret - fret) + Math.abs(a.velocity - velocity) * 0.25 - (Math.abs(b.fret - fret) + Math.abs(b.velocity - velocity) * 0.25))[0]
  }

  private async getBuffer(sample: SampleEntry) {
    let buffer = this.buffers.get(sample.file)
    if (!buffer) {
      buffer = new Tone.ToneAudioBuffer(`/audio/guitar/steel/${sample.file}`)
      this.buffers.set(sample.file, buffer)
      await buffer.loaded
    }
    return buffer
  }

  async preloadSamples(voicings: GuitarVoicing[]) {
    await this.initializeAudio()
    const entries = voicings.flatMap(voicing => voicing.frets.map((fret, stringIndex) => fret >= 0 ? this.findSample(stringIndex, fret, 2) : undefined)).filter(Boolean) as SampleEntry[]
    await Promise.all([...new Map(entries.map(item => [item.file, item])).values()].map(item => this.getBuffer(item)))
  }

  async playString(stringIndex: number, fret: number, velocity = 0.78, delay = 0) {
    await this.initializeAudio()
    const layer = velocity < 0.48 ? 1 : velocity > 0.84 ? 3 : 2
    const sample = this.findSample(stringIndex, fret, layer)
    if (!sample) throw new Error(`No acoustic recording available for string ${stringIndex + 1}, fret ${fret}`)
    const buffer = await this.getBuffer(sample)
    const previous = this.active.get(stringIndex)
    if (previous) { previous.fadeOut = 0.025; previous.stop(`+${Math.max(0, delay)}`) }
    const player = new Tone.Player(buffer).toDestination()
    player.playbackRate = Math.pow(2, (fret - sample.fret) / 12)
    player.volume.value = this.masterVolume - 4 + (velocity - 0.7) * 8
    player.fadeIn = 0.004
    player.onstop = () => { if (this.active.get(stringIndex) === player) this.active.delete(stringIndex); player.dispose() }
    this.active.set(stringIndex, player)
    player.start(`+${Math.max(0, delay)}`)
  }

  async playChord(voicing: GuitarVoicing, direction: 'down' | 'up' = 'down', speed = 0.026) {
    await this.initializeAudio()
    const strings = voicing.frets.map((fret, stringIndex) => ({ fret, stringIndex })).filter(item => item.fret >= 0)
    if (direction === 'up') strings.reverse()
    await Promise.all(strings.map((item, order) => this.playString(item.stringIndex, item.fret, 0.72 + Math.random() * 0.16, order * speed)))
  }

  async playArpeggio(voicing: GuitarVoicing, pattern = [0, 1, 2, 3, 4, 5]) {
    await this.initializeAudio()
    const playable = pattern.map(index => ({ index, fret: voicing.frets[index] })).filter(item => item.fret >= 0)
    await Promise.all(playable.map((item, order) => this.playString(item.index, item.fret, 0.68, order * 0.14)))
  }

  stopAll() { this.active.forEach(player => { player.fadeOut = 0.03; player.stop('+0.03') }); this.active.clear() }
}

export const guitarAudio = new GuitarAudioEngine()

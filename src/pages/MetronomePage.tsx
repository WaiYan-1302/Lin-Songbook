import { Minus, Pause, Play, Plus, RotateCcw, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { METRONOME_SOUNDS, playMetronomeTick, type MetronomeSound } from '../audio/metronome'
import { createAudioContext } from '../audio/audioContext'
import { ToolsSwitcher } from '../components/ToolsSwitcher'

const clampBpm = (value: number) => Math.max(30, Math.min(240, Math.round(value)))

export function MetronomePage() {
  const [bpm, setBpm] = useState(100)
  const [beatsPerBar, setBeatsPerBar] = useState(4)
  const [sound, setSound] = useState<MetronomeSound>('pendulum')
  const [volume, setVolume] = useState(.7)
  const [playing, setPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [audioError, setAudioError] = useState('')
  const contextRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<number | null>(null)
  const visualTimersRef = useRef<number[]>([])
  const nextTickRef = useRef(0)
  const beatRef = useRef(0)
  const bpmRef = useRef(bpm)
  const beatsRef = useRef(beatsPerBar)
  const soundRef = useRef(sound)
  const volumeRef = useRef(volume)
  const tapTimesRef = useRef<number[]>([])

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { beatsRef.current = beatsPerBar; beatRef.current %= beatsPerBar }, [beatsPerBar])
  useEffect(() => { soundRef.current = sound }, [sound])
  useEffect(() => { volumeRef.current = volume }, [volume])

  const stop = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    visualTimersRef.current.forEach(window.clearTimeout)
    visualTimersRef.current = []
    timerRef.current = null
    setPlaying(false)
    setCurrentBeat(-1)
    beatRef.current = 0
    const context = contextRef.current
    contextRef.current = null
    if (context && context.state !== 'closed') void context.close()
  }, [])

  useEffect(() => stop, [stop])

  const schedule = useCallback(() => {
    const context = contextRef.current
    if (!context) return
    while (nextTickRef.current < context.currentTime + .12) {
      const beat = beatRef.current
      const when = nextTickRef.current
      playMetronomeTick(context, soundRef.current, beat === 0, when, volumeRef.current)
      const delay = Math.max(0, (when - context.currentTime) * 1000)
      const visualTimer = window.setTimeout(() => setCurrentBeat(beat), delay)
      visualTimersRef.current.push(visualTimer)
      nextTickRef.current += 60 / bpmRef.current
      beatRef.current = (beat + 1) % beatsRef.current
    }
    timerRef.current = window.setTimeout(schedule, 25)
  }, [])

  const start = () => {
    let context: AudioContext
    try {
      context = createAudioContext({ latencyHint: 'interactive' })
    } catch {
      setAudioError('This browser does not provide Web Audio. Try the latest Safari, Chrome, Edge, or Firefox.')
      return
    }
    setAudioError('')
    contextRef.current = context
    beatRef.current = 0
    nextTickRef.current = context.currentTime + .05
    setPlaying(true)
    void context.resume().catch(() => {
      if (contextRef.current === context) stop()
    })
    schedule()
  }

  const tapTempo = () => {
    const now = performance.now()
    const previous = tapTimesRef.current.at(-1)
    const taps = previous && now - previous < 2000 ? [...tapTimesRef.current, now].slice(-6) : [now]
    tapTimesRef.current = taps
    if (taps.length > 1) {
      const intervals = taps.slice(1).map((time, index) => time - taps[index])
      setBpm(clampBpm(60000 / (intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length)))
    }
  }

  const changeBpm = (value: number) => setBpm(clampBpm(value))

  return <div className="page metronome-page">
    <ToolsSwitcher />
    <div className="page-title-row"><div><p className="eyebrow">Timing tool</p><h1>Metronome</h1><p>Choose a comfortable pulse, then let the first beat guide each bar.</p></div></div>
    <div className="metronome-layout">
      <section className={`metronome-stage${playing ? ' playing' : ''}`} aria-live="polite">
        <div className="beat-dots" aria-label={playing ? `Beat ${currentBeat + 1} of ${beatsPerBar}` : `${beatsPerBar} beats per bar`}>
          {Array.from({ length: beatsPerBar }, (_, index) => <i key={index} className={`${index === 0 ? 'accent ' : ''}${currentBeat === index ? 'active' : ''}`} />)}
        </div>
        <div className="tempo-readout"><strong>{bpm}</strong><span>BPM</span></div>
        <input className="tempo-slider" aria-label="Tempo" type="range" min="30" max="240" value={bpm} onChange={event => changeBpm(Number(event.target.value))} />
        <div className="tempo-actions">
          <button type="button" aria-label="Decrease tempo" onClick={() => changeBpm(bpm - 1)}><Minus /></button>
          <button className="metronome-start" type="button" onClick={playing ? stop : start}>{playing ? <><Pause fill="currentColor" /> Stop</> : <><Play fill="currentColor" /> Start</>}</button>
          <button type="button" aria-label="Increase tempo" onClick={() => changeBpm(bpm + 1)}><Plus /></button>
        </div>
        <button className="tap-tempo" type="button" onClick={tapTempo}>Tap tempo</button>
        {audioError && <p className="metronome-error" role="alert">{audioError}</p>}
      </section>

      <aside className="metronome-controls">
        <label className="metronome-field"><span className="field-label">Tempo</span><span className="number-stepper"><input aria-label="BPM" type="number" min="30" max="240" value={bpm} onChange={event => changeBpm(Number(event.target.value))} /><span>BPM</span></span></label>
        <label className="metronome-field"><span className="field-label">Beats per bar</span><select aria-label="Beats per bar" value={beatsPerBar} onChange={event => setBeatsPerBar(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map(value => <option key={value} value={value}>{value} {value === 1 ? 'beat' : 'beats'}</option>)}</select></label>
        <fieldset className="sound-picker"><legend className="field-label">Sound</legend>{METRONOME_SOUNDS.map(option => <label key={option.id} className={sound === option.id ? 'selected' : ''}><input type="radio" name="metronome-sound" value={option.id} checked={sound === option.id} onChange={() => setSound(option.id)} /><span><strong>{option.name}</strong><small>{option.description}</small></span></label>)}</fieldset>
        <label className="metronome-volume"><span><Volume2 /> Volume</span><input aria-label="Metronome volume" type="range" min="0" max="1" step=".05" value={volume} onChange={event => setVolume(Number(event.target.value))} /></label>
        <button className="button ghost metronome-reset" type="button" onClick={() => { setBpm(100); setBeatsPerBar(4); setSound('pendulum'); setVolume(.7) }}><RotateCcw /> Reset settings</button>
      </aside>
    </div>
  </div>
}

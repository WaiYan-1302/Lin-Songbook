import { Mic, MicOff, ShieldCheck, SlidersHorizontal, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { describePitch, detectPitch } from '../audio/pitchDetection'
import { createAudioContext } from '../audio/audioContext'
import { GUITAR_TUNINGS, noteFrequency } from '../music/guitarTunings'
import { ToolsSwitcher } from '../components/ToolsSwitcher'

type ListeningState = 'idle' | 'requesting' | 'listening' | 'error'

export function GuitarTunerPage() {
  const [state, setState] = useState<ListeningState>('idle')
  const [frequency, setFrequency] = useState<number | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [level, setLevel] = useState(0)
  const [targetIndex, setTargetIndex] = useState<'auto' | number>('auto')
  const [tuningId, setTuningId] = useState('standard')
  const [concertA, setConcertA] = useState(440)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const frameRef = useRef(0)

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (contextRef.current && contextRef.current.state !== 'closed') void contextRef.current.close()
    contextRef.current = null
    setState('idle'); setFrequency(null); setConfidence(0); setLevel(0)
  }, [])
  useEffect(() => stop, [stop])

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('error'); setError('Microphone access requires a supported browser and a secure HTTPS connection.')
      return
    }
    setState('requesting'); setError('')
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false })
      const context = createAudioContext({ latencyHint: 'interactive' })
      await context.resume()
      const analyser = context.createAnalyser()
      analyser.fftSize = 8192
      analyser.smoothingTimeConstant = 0
      context.createMediaStreamSource(stream).connect(analyser)
      streamRef.current = stream
      contextRef.current = context
      setState('listening')

      const samples = new Float32Array(analyser.fftSize)
      const recent: number[] = []
      let lastChecked = 0
      let quietFrames = 0
      const analyse = (time: number) => {
        if (time - lastChecked > 70) {
          lastChecked = time
          analyser.getFloatTimeDomainData(samples)
          const result = detectPitch(samples, context.sampleRate)
          if (result && result.confidence > .72) {
            recent.push(result.frequency)
            if (recent.length > 5) recent.shift()
            const sorted = [...recent].sort((a, b) => a - b)
            setFrequency(sorted[Math.floor(sorted.length / 2)])
            setConfidence(result.confidence)
            setLevel(Math.min(1, result.level * 9))
            quietFrames = 0
          } else {
            setLevel(result ? Math.min(1, result.level * 9) : 0)
            if (++quietFrames > 4) { recent.length = 0; setFrequency(null); setConfidence(0) }
          }
        }
        frameRef.current = requestAnimationFrame(analyse)
      }
      frameRef.current = requestAnimationFrame(analyse)
    } catch (caught) {
      stream?.getTracks().forEach(track => track.stop())
      const denied = caught instanceof DOMException && (caught.name === 'NotAllowedError' || caught.name === 'SecurityError')
      setError(denied ? 'Microphone permission was blocked. Allow microphone access in your browser settings, then try again.' : 'Fretbook could not open this microphone. Check that it is connected and not being used exclusively by another app.')
      setState('error')
    }
  }

  const activeTuning = GUITAR_TUNINGS.find(tuning => tuning.id === tuningId) ?? GUITAR_TUNINGS[0]
  const adjustedStrings = useMemo(() => activeTuning.strings.map((string, index) => ({
    ...string,
    label: `${6 - index}${index === 5 ? 'st' : index === 4 ? 'nd' : index === 3 ? 'rd' : 'th'}`,
    frequency: noteFrequency(string.note, string.octave, concertA),
  })), [activeTuning, concertA])
  const target = useMemo(() => {
    if (typeof targetIndex === 'number') return adjustedStrings[targetIndex]
    if (!frequency) return null
    return adjustedStrings.reduce((nearest, string) => Math.abs(1200 * Math.log2(frequency / string.frequency)) < Math.abs(1200 * Math.log2(frequency / nearest.frequency)) ? string : nearest)
  }, [adjustedStrings, frequency, targetIndex])
  const detected = frequency ? describePitch(frequency, concertA) : null
  const cents = frequency && target ? 1200 * Math.log2(frequency / target.frequency) : 0
  const clampedCents = Math.max(-50, Math.min(50, cents))
  const inTune = Boolean(frequency && target && Math.abs(cents) <= 4)
  const direction = !frequency ? 'Play one open string' : inTune ? 'In tune' : cents < 0 ? 'Tune up' : 'Tune down'

  return <div className="page tuner-page">
    <ToolsSwitcher />
    <div className="page-title-row"><div><p className="eyebrow">Microphone tuner</p><h1>Guitar tuner</h1><p>Choose a tuning, then play one string at a time. Fretbook listens only on this device and guides each string to its target pitch.</p></div><div className="tuner-privacy"><ShieldCheck /><span>Audio stays on this device</span></div></div>
    <div className="tuner-layout">
      <section className={`tuner-display${inTune ? ' in-tune' : ''}`} aria-live="polite">
        <div className="tuner-readout"><span className="tuner-target-label">{target ? `${target.label} string · ${activeTuning.name}` : targetIndex === 'auto' ? `Automatic · ${activeTuning.name}` : 'Selected string'}</span><div className="detected-note">{detected ? <><strong>{detected.note}</strong><sup>{detected.octave}</sup></> : <strong>—</strong>}</div><p>{frequency ? `${frequency.toFixed(1)} Hz` : state === 'listening' ? 'Listening…' : 'Microphone is off'}</p></div>
        <button className={`button tuner-listen tuner-listen-mobile ${state === 'listening' ? 'listening' : ''}`} disabled={state === 'requesting'} onClick={state === 'listening' ? stop : start}>{state === 'listening' ? <><MicOff /> Stop listening</> : <><Mic /> {state === 'requesting' ? 'Requesting microphone…' : 'Start tuning'}</>}</button>
        <div className="tuner-meter" aria-label={frequency ? `${cents.toFixed(1)} cents ${cents < 0 ? 'flat' : 'sharp'}` : 'No pitch detected'}>
          <div className="meter-scale"><span>−50</span><span>−25</span><span>0</span><span>+25</span><span>+50</span></div>
          <div className="meter-line"><i className="meter-center" /><i className="meter-needle" style={{ left: `${clampedCents + 50}%` }} /></div>
          <div className="meter-words"><span>Flat</span><strong>{direction}</strong><span>Sharp</span></div>
        </div>
        <div className="signal-row"><Volume2 /><span>Signal</span><div className="signal-track"><i style={{ width: `${level * 100}%` }} /></div><small>{confidence ? `${Math.round(confidence * 100)}%` : '—'}</small></div>
      </section>

      <aside className="tuner-controls-panel">
        <label className="tuning-picker"><span className="field-label">Tuning preset</span><select value={tuningId} onChange={event => { setTuningId(event.target.value); setTargetIndex('auto') }}>{GUITAR_TUNINGS.map(tuning => <option key={tuning.id} value={tuning.id}>{tuning.name} — {tuning.notes}</option>)}</select><strong>{activeTuning.notes}</strong><small>{activeTuning.description}</small></label>
        <div><p className="field-label">Target string</p><div className="tuner-strings"><button className={targetIndex === 'auto' ? 'selected' : ''} aria-pressed={targetIndex === 'auto'} onClick={() => setTargetIndex('auto')}><strong>Auto</strong><small>Nearest</small></button>{adjustedStrings.map((string, index) => <button key={`${string.note}${string.octave}`} className={targetIndex === index ? 'selected' : ''} aria-pressed={targetIndex === index} onClick={() => setTargetIndex(index)}><strong>{string.note}<sup>{string.octave}</sup></strong><small>{string.frequency.toFixed(1)} Hz</small></button>)}</div></div>
        <button className={`button tuner-listen ${state === 'listening' ? 'listening' : ''}`} disabled={state === 'requesting'} onClick={state === 'listening' ? stop : start}>{state === 'listening' ? <><MicOff /> Stop listening</> : <><Mic /> {state === 'requesting' ? 'Requesting microphone…' : 'Start tuning'}</>}</button>
        {error && <p className="tuner-error" role="alert">{error}</p>}
        <label className="calibration-control"><span><SlidersHorizontal /> Calibration</span><strong>A4 = {concertA} Hz</strong><input type="range" min="430" max="450" value={concertA} onChange={event => setConcertA(Number(event.target.value))} /></label>
        <div className="tuner-tip"><strong>For a steady reading</strong><p>Use the neck pickup if your guitar is plugged in, or place the device near the sound hole. Pluck gently and mute the other strings.</p></div>
      </aside>
    </div>
  </div>
}

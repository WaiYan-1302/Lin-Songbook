import { ArrowLeft, ArrowRight, Copy, CopyPlus, FileMusic, Pause, Play, Plus, RotateCcw, Save, Trash2, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { guitarAudio } from '../audio/GuitarAudioEngine'
import { createTabStep, formatAsciiTab, TAB_DURATIONS, TAB_STRINGS, tabNoteName, type TabDuration, type TabStep } from '../music/tabEditor'

type Draft = { title: string; bpm: number; showNotes: boolean; loop: boolean; steps: TabStep[] }
type Selection = { step: number; string: number }

const draftKey = 'fv:tab-editor-draft'
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const initialSteps = () => Array.from({ length: 8 }, () => createTabStep(makeId()))

function readDraft(): Draft {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey) || 'null') as Partial<Draft> | null
    if (!saved || !Array.isArray(saved.steps) || !saved.steps.length) throw new Error('No draft')
    return {
      title: typeof saved.title === 'string' ? saved.title : 'Untitled riff',
      bpm: Math.max(40, Math.min(240, Number(saved.bpm) || 100)),
      showNotes: Boolean(saved.showNotes),
      loop: saved.loop !== false,
      steps: saved.steps.map(step => ({
        id: typeof step.id === 'string' ? step.id : makeId(),
        duration: TAB_DURATIONS.some(item => item.value === step.duration) ? step.duration : 1,
        frets: Array.from({ length: 6 }, (_, index) => {
          const fret = step.frets?.[index]
          return typeof fret === 'number' && fret >= 0 && fret <= 24 ? Math.round(fret) : null
        }),
      })),
    }
  } catch {
    return { title: 'Untitled riff', bpm: 100, showNotes: false, loop: true, steps: initialSteps() }
  }
}

export function TabEditorPage() {
  const draft = useMemo(readDraft, [])
  const [title, setTitle] = useState(draft.title)
  const [bpm, setBpm] = useState(draft.bpm)
  const [showNotes, setShowNotes] = useState(draft.showNotes)
  const [loop, setLoop] = useState(draft.loop)
  const [steps, setSteps] = useState(draft.steps)
  const [selected, setSelected] = useState<Selection>({ step: 0, string: 5 })
  const [playing, setPlaying] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [message, setMessage] = useState('Draft saved on this device')
  const timerRef = useRef<number | null>(null)
  const playingRef = useRef(false)
  const stepsRef = useRef(steps)
  const bpmRef = useRef(bpm)
  const loopRef = useRef(loop)

  useEffect(() => { stepsRef.current = steps }, [steps])
  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { loopRef.current = loop }, [loop])
  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ title, bpm, showNotes, loop, steps }))
    setMessage('Draft saved on this device')
  }, [title, bpm, showNotes, loop, steps])

  const stopPlayback = useCallback(() => {
    playingRef.current = false
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    guitarAudio.stopAll()
    setPlaying(false)
    setActiveStep(-1)
  }, [])
  useEffect(() => stopPlayback, [stopPlayback])

  const playStep = useCallback((index: number) => {
    const step = stepsRef.current[index]
    if (!step) return
    step.frets.forEach((fret, stringIndex) => {
      if (fret !== null) void guitarAudio.playString(stringIndex, fret, .75).catch(() => setMessage('Guitar audio could not be loaded'))
    })
  }, [])

  const startPlayback = async () => {
    stopPlayback()
    try {
      await guitarAudio.initializeAudio()
      playingRef.current = true
      setPlaying(true)
      const run = (index: number) => {
        if (!playingRef.current) return
        const current = stepsRef.current[index]
        if (!current) { stopPlayback(); return }
        setActiveStep(index)
        playStep(index)
        timerRef.current = window.setTimeout(() => {
          const next = index + 1
          if (next < stepsRef.current.length) run(next)
          else if (loopRef.current) run(0)
          else stopPlayback()
        }, 60_000 / bpmRef.current * current.duration)
      }
      run(0)
    } catch {
      setMessage('Guitar audio could not be loaded')
      stopPlayback()
    }
  }

  const updateFret = (stepIndex: number, stringIndex: number, raw: string | number | null) => {
    const fret = raw === '' || raw === null ? null : Math.max(0, Math.min(24, Math.round(Number(raw))))
    setSelected({ step: stepIndex, string: stringIndex })
    setSteps(items => items.map((step, index) => index === stepIndex ? { ...step, frets: step.frets.map((value, string) => string === stringIndex ? fret : value) } : step))
  }
  const setDuration = (duration: TabDuration) => setSteps(items => items.map((step, index) => index === selected.step ? { ...step, duration } : step))
  const addStep = () => { setSteps(items => [...items, createTabStep(makeId())]); setSelected({ step: steps.length, string: selected.string }) }
  const duplicateStep = () => setSteps(items => {
    const copy = { ...items[selected.step], id: makeId(), frets: [...items[selected.step].frets] }
    const next = [...items.slice(0, selected.step + 1), copy, ...items.slice(selected.step + 1)]
    setSelected(current => ({ ...current, step: current.step + 1 }))
    return next
  })
  const removeStep = () => setSteps(items => {
    if (items.length === 1) return [createTabStep(makeId())]
    const next = items.filter((_, index) => index !== selected.step)
    setSelected(current => ({ ...current, step: Math.min(current.step, next.length - 1) }))
    return next
  })
  const moveStep = (offset: -1 | 1) => setSteps(items => {
    const target = selected.step + offset
    if (target < 0 || target >= items.length) return items
    const next = [...items]
    ;[next[selected.step], next[target]] = [next[target], next[selected.step]]
    setSelected(current => ({ ...current, step: target }))
    return next
  })
  const audition = (fret: number) => {
    updateFret(selected.step, selected.string, fret)
    void guitarAudio.playString(selected.string, fret, .78).catch(() => setMessage('Guitar audio could not be loaded'))
  }
  const copyTab = async () => {
    try { await navigator.clipboard.writeText(formatAsciiTab(title, bpm, steps)); setMessage('Tab copied to clipboard') }
    catch { setMessage('Clipboard access was unavailable') }
  }
  const clearDraft = () => {
    if (!window.confirm('Clear every note in this tab?')) return
    stopPlayback(); setSteps(initialSteps()); setSelected({ step: 0, string: 5 }); setMessage('Started a fresh tab')
  }

  const selectedStep = steps[selected.step]
  const selectedFret = selectedStep?.frets[selected.string]
  const noteOptions = Array.from({ length: 25 }, (_, fret) => ({ fret, label: `${tabNoteName(selected.string, fret)} · fret ${fret}` }))
  const rowOrder = [5, 4, 3, 2, 1, 0]
  const gridStyle = { gridTemplateColumns: `52px repeat(${steps.length}, 58px)` }

  return <div className="page tab-editor-page">
    <div className="page-title-row"><div><p className="eyebrow">Write, hear, refine</p><h1>Tab editor</h1><p>Build a riff one beat at a time. Enter fret numbers directly or use the virtual string panel to find and hear notes.</p></div><div className="tab-save-state"><Save /><span>{message}</span></div></div>

    <section className="tab-transport" aria-label="Tab playback controls">
      <input className="tab-title-input" aria-label="Tab title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Untitled riff" />
      <label><span>BPM</span><input type="number" min="40" max="240" value={bpm} onChange={event => setBpm(Math.max(40, Math.min(240, Number(event.target.value) || 40)))} /></label>
      <button className={`tab-option${showNotes ? ' active' : ''}`} aria-pressed={showNotes} onClick={() => setShowNotes(value => !value)}>ABC notes</button>
      <button className={`tab-option${loop ? ' active' : ''}`} aria-pressed={loop} onClick={() => setLoop(value => !value)}><RotateCcw /> Loop</button>
      <div className="tab-play-controls"><button aria-label={playing ? 'Stop tab playback' : 'Play tab'} onClick={playing ? stopPlayback : startPlayback}>{playing ? <Pause /> : <Play />}</button><button className="button" onClick={copyTab}><Copy /> Copy tab</button></div>
    </section>

    <div className="tab-editor-layout">
      <section className="tab-score-card">
        <div className="tab-score-heading"><div><p className="field-label">Tab sequence</p><span>Select a cell and type any fret from 0–24.</span></div><button className="button" onClick={addStep}><Plus /> Add beat</button></div>
        <div className="tab-score-scroll">
          <div className={`tab-score${showNotes ? ' show-notes' : ''}`} style={gridStyle}>
            <span className="tab-score-corner">TAB</span>
            {steps.map((step, index) => <button key={`head-${step.id}`} className={`tab-step-head${selected.step === index ? ' selected' : ''}${activeStep === index ? ' playing' : ''}`} onClick={() => setSelected(current => ({ ...current, step: index }))}><b>{index + 1}</b><small>{TAB_DURATIONS.find(item => item.value === step.duration)?.short}</small></button>)}
            {rowOrder.map(stringIndex => <div className="tab-score-row" key={stringIndex} style={{ display: 'contents' }}>
              <span className="tab-string-label">{TAB_STRINGS[stringIndex].name}</span>
              {steps.map((step, stepIndex) => <label key={`${step.id}-${stringIndex}`} className={`tab-cell${selected.step === stepIndex && selected.string === stringIndex ? ' selected' : ''}${activeStep === stepIndex ? ' playing' : ''}`}>
                <input type="number" inputMode="numeric" min="0" max="24" aria-label={`Beat ${stepIndex + 1}, ${TAB_STRINGS[stringIndex].label} string fret`} value={step.frets[stringIndex] ?? ''} placeholder="—" onFocus={() => setSelected({ step: stepIndex, string: stringIndex })} onChange={event => updateFret(stepIndex, stringIndex, event.target.value)} />
                {showNotes && step.frets[stringIndex] !== null && <small>{tabNoteName(stringIndex, step.frets[stringIndex]!)}</small>}
              </label>)}
            </div>)}
          </div>
        </div>
      </section>

      <aside className="tab-input-panel">
        <div className="tab-input-head"><div><p className="field-label">Selected beat</p><strong>Beat {selected.step + 1}</strong></div><div className="tab-step-actions"><button aria-label="Move beat left" disabled={selected.step === 0} onClick={() => moveStep(-1)}><ArrowLeft /></button><button aria-label="Move beat right" disabled={selected.step === steps.length - 1} onClick={() => moveStep(1)}><ArrowRight /></button><button aria-label="Duplicate beat" onClick={duplicateStep}><CopyPlus /></button><button aria-label="Delete beat" onClick={removeStep}><Trash2 /></button></div></div>
        <label className="tab-duration"><span>Duration</span><select value={selectedStep?.duration ?? 1} onChange={event => setDuration(Number(event.target.value) as TabDuration)}>{TAB_DURATIONS.map(duration => <option key={duration.value} value={duration.value}>{duration.label}</option>)}</select></label>

        <div><p className="field-label">Virtual string</p><div className="tab-string-picker">{TAB_STRINGS.map((string, index) => <button key={string.label} className={selected.string === index ? 'selected' : ''} onClick={() => setSelected(current => ({ ...current, string: index }))}><strong>{string.name}</strong><small>{string.octave}</small></button>)}</div></div>
        <label className="tab-note-picker"><span>Choose a note on this string</span><select value={selectedFret ?? ''} onChange={event => audition(Number(event.target.value))}><option value="" disabled>Select note…</option>{noteOptions.map(option => <option key={option.fret} value={option.fret}>{option.label}</option>)}</select></label>
        <div className="tab-fret-strip" aria-label="Frets zero through twelve">{Array.from({ length: 13 }, (_, fret) => <button key={fret} className={selectedFret === fret ? 'selected' : ''} onClick={() => audition(fret)}>{fret === 0 ? 'Open' : fret}</button>)}</div>
        <div className="tab-input-actions"><button className="button" disabled={selectedFret === null} onClick={() => selectedFret !== null && void guitarAudio.playString(selected.string, selectedFret).catch(() => setMessage('Guitar audio could not be loaded'))}><Volume2 /> Hear note</button><button className="button ghost" onClick={() => updateFret(selected.step, selected.string, null)}>Clear cell</button></div>
        <p className="tab-input-tip"><FileMusic /> Clicking a fret writes it into the selected beat and plays the recorded guitar string.</p>
      </aside>
    </div>

    <div className="tab-editor-footer"><span>Standard tuning · 4/4 · automatic local draft</span><button className="button ghost" onClick={clearDraft}><Trash2 /> Clear tab</button></div>
  </div>
}

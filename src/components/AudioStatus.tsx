import { AlertCircle, LoaderCircle, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { guitarAudio, type AudioStatus as Status } from '../audio/GuitarAudioEngine'

export function AudioStatus() {
  const [state, setState] = useState<{ status: Status; message?: string }>({ status: guitarAudio.status, message: guitarAudio.message })
  useEffect(() => guitarAudio.subscribe((status, message) => setState({ status, message })), [])
  return <div className={`audio-status ${state.status}`} title={state.message}>
    {state.status === 'loading' ? <LoaderCircle className="spin" size={15} /> : state.status === 'error' ? <AlertCircle size={15} /> : <Volume2 size={15} />}
    <span>{state.status === 'ready' ? 'Acoustic samples ready' : state.status === 'error' ? 'Audio unavailable' : state.status === 'loading' ? 'Loading audio' : 'Tap a chord to enable audio'}</span>
  </div>
}

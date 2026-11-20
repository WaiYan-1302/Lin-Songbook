import { Cloud, Copy, Database, Moon, RotateCcw, Sun, Unplug, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { guitarAudio } from '../audio/GuitarAudioEngine'
import { connectCloudLibrary, disconnectCloudLibrary, formatSyncCode, getSyncCode, prefs } from '../storage/library'

export function SettingsPage() {
  const [dark, setDark] = useState(() => prefs.get('dark', false))
  const [volume, setVolume] = useState(() => prefs.get('volume', -8))
  const [motion, setMotion] = useState(() => prefs.get('motion', true))
  const [syncCode, setSyncCode] = useState(getSyncCode)
  const [enteredCode, setEnteredCode] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; prefs.set('dark', dark) }, [dark])
  useEffect(() => { guitarAudio.setVolume(volume); prefs.set('volume', volume) }, [volume])

  const connect = async (code?: string) => {
    setSyncing(true); setSyncError('')
    try {
      await connectCloudLibrary(code)
      location.reload()
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Could not connect cloud sync.')
      setSyncing(false)
    }
  }

  return <div className="page settings-page"><div className="page-title-row"><div><p className="eyebrow">Make it yours</p><h1>Settings</h1><p>Appearance stays on this device. Your song library can optionally sync through Cloudflare.</p></div></div><div className="settings-list">
    <section><div className="setting-icon">{dark ? <Moon /> : <Sun />}</div><div><h2>Appearance</h2><p>Switch between warm paper and a low-light studio theme.</p></div><button className="toggle" aria-pressed={dark} onClick={() => setDark(v => !v)}><span /></button></section>
    <section><div className="setting-icon"><Volume2 /></div><div><h2>Master guitar volume</h2><p>{volume} dB · applies to recorded acoustic samples.</p></div><input type="range" min="-30" max="0" value={volume} onChange={e => setVolume(Number(e.target.value))} /></section>
    <section><div className="setting-icon"><Moon /></div><div><h2>Motion</h2><p>Use gentle transitions and string vibration feedback.</p></div><button className="toggle" aria-pressed={motion} onClick={() => { setMotion(v => !v); prefs.set('motion', !motion); document.documentElement.classList.toggle('reduce-motion', motion) }}><span /></button></section>
    <section><div className="setting-icon"><Cloud /></div><div><h2>Cloud song library</h2>{syncCode ? <><p>Connected. Use this private code on your other devices:</p><code className="sync-code">{formatSyncCode(syncCode)}</code></> : <><p>Create a private library, or enter the code from another device.</p>{syncError && <p className="sync-error" role="alert">{syncError}</p>}</>}</div>{syncCode ? <div className="sync-controls"><button className="button ghost" onClick={() => navigator.clipboard.writeText(formatSyncCode(syncCode))}><Copy /> Copy code</button><button className="button ghost" onClick={() => { disconnectCloudLibrary(); setSyncCode('') }}><Unplug /> Disconnect</button></div> : <div className="sync-controls"><button className="button primary" disabled={syncing} onClick={() => connect()}>{syncing ? 'Connecting…' : 'Enable sync'}</button><span>or</span><input aria-label="Existing sync code" placeholder="Enter sync code" value={enteredCode} onChange={e => setEnteredCode(e.target.value)} /><button className="button ghost" disabled={syncing || !enteredCode.trim()} onClick={() => connect(enteredCode)}>Connect</button></div>}</section>
    <section><div className="setting-icon"><Database /></div><div><h2>Offline storage</h2><p>Songs also stay in this browser, so they remain available if the connection drops.</p></div><button className="button ghost" onClick={() => alert('Songs are stored locally in IndexedDB. When cloud sync is connected, changes are also saved to your private cloud library.')}>Storage info</button></section>
    <section><div className="setting-icon"><RotateCcw /></div><div><h2>Reset preferences</h2><p>Leaves your local songs untouched, but disconnects this device from cloud sync.</p></div><button className="button ghost" onClick={() => { Object.keys(localStorage).filter(key => key.startsWith('fv:')).forEach(key => localStorage.removeItem(key)); location.reload() }}>Reset</button></section>
  </div><div className="license-note"><strong>Audio source</strong><p>Meta Open Sound — Meta Steel Guitar, CC0-1.0. Samples are prepared locally and served with the static app.</p></div></div>
}

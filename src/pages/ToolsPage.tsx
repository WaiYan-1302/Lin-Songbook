import { ArrowRight, AudioLines, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ToolsPage() {
  return <div className="page tools-page">
    <div className="page-title-row"><div><p className="eyebrow">Practice utilities</p><h1>Tools</h1><p>Two focused helpers for getting in tune and staying in time.</p></div></div>
    <div className="tool-widget-grid">
      <Link className="tool-widget" to="/tools/tuner">
        <span className="tool-widget-icon"><AudioLines /></span>
        <span><small>Pitch</small><strong>Guitar tuner</strong><p>Use your microphone with standard, drop, and alternate tunings.</p></span>
        <span className="tool-widget-action">Open tuner <ArrowRight /></span>
      </Link>
      <Link className="tool-widget" to="/tools/metronome">
        <span className="tool-widget-icon"><Timer /></span>
        <span><small>Timing</small><strong>Metronome</strong><p>Set your tempo, meter, sound, and keep a steady pulse.</p></span>
        <span className="tool-widget-action">Open metronome <ArrowRight /></span>
      </Link>
    </div>
  </div>
}

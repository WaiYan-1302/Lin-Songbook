import { AudioLines, Timer, Wrench } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function ToolsSwitcher() {
  return <nav className="tools-switcher" aria-label="Practice tools">
    <NavLink to="/tools" end><Wrench /> All tools</NavLink>
    <NavLink to="/tools/tuner"><AudioLines /> Tuner</NavLink>
    <NavLink to="/tools/metronome"><Timer /> Metronome</NavLink>
  </nav>
}

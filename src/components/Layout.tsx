import { BookOpenText, CircleDot, Guitar, Home, ListMusic, Settings, Sparkles } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const items = [
  ['/', 'Home', Home], ['/songbook', 'Songbook', BookOpenText], ['/chord-lab', 'Chord Lab', Guitar],
  ['/chord-wheel', 'Chord Wheel', CircleDot], ['/progressions', 'Progressions', ListMusic], ['/settings', 'Settings', Settings],
] as const

export function Layout() {
  return <div className="app-shell">
    <aside className="side-nav">
      <NavLink to="/" className="brand"><span className="brand-mark"><Sparkles size={19} /></span><span><strong>Fret &amp; Verse</strong><small>musician’s notebook</small></span></NavLink>
      <nav aria-label="Main navigation">{items.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'}><Icon size={20} /><span>{label}</span></NavLink>)}</nav>
      <div className="nav-foot"><span className="status-dot" /> Made for quiet practice</div>
    </aside>
    <main className="main-content"><Outlet /></main>
    <nav className="bottom-nav" aria-label="Mobile navigation">{items.slice(0, 5).map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} aria-label={label}><Icon size={21} /><span>{label === 'Progressions' ? 'Progress' : label}</span></NavLink>)}</nav>
  </div>
}

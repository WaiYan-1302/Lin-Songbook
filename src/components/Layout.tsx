import { useState } from 'react'
import { AudioLines, BookOpenText, CircleDot, Guitar, Home, ListMusic, PanelLeftClose, PanelLeftOpen, Settings, Sparkles } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const items = [
  ['/', 'Home', Home], ['/songbook', 'Songbook', BookOpenText], ['/tuner', 'Tuner', AudioLines], ['/chord-lab', 'Chord Lab', Guitar],
  ['/chord-wheel', 'Chord Wheel', CircleDot], ['/progressions', 'Progressions', ListMusic], ['/settings', 'Settings', Settings],
] as const

export function Layout() {
  const [sidebarHidden, setSidebarHidden] = useState(() => localStorage.getItem('fv:sidebar-hidden') === 'true')
  const setSidebar = (hidden: boolean) => {
    setSidebarHidden(hidden)
    localStorage.setItem('fv:sidebar-hidden', String(hidden))
  }

  return <div className={`app-shell${sidebarHidden ? ' nav-hidden' : ''}`}>
    {!sidebarHidden && <aside className="side-nav">
      <NavLink to="/" className="brand"><span className="brand-mark"><Sparkles size={19} /></span><span><strong>Fretbook</strong><small>guitar practice notebook</small></span></NavLink>
      <button className="sidebar-toggle" type="button" onClick={() => setSidebar(true)} aria-label="Hide navigation" title="Hide navigation"><PanelLeftClose /></button>
      <nav aria-label="Main navigation">{items.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'}><Icon size={20} /><span>{label}</span></NavLink>)}</nav>
      <div className="nav-foot"><span className="status-dot" /> Made for quiet practice</div>
    </aside>}
    {sidebarHidden && <button className="sidebar-reveal" type="button" onClick={() => setSidebar(false)} aria-label="Show navigation" title="Show navigation"><PanelLeftOpen /></button>}
    <main className="main-content"><Outlet /></main>
    <nav className="bottom-nav" aria-label="Mobile navigation">{items.slice(0, 6).map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} aria-label={label}><Icon size={21} /><span>{label === 'Progressions' ? 'Progress' : label === 'Chord Lab' ? 'Chords' : label === 'Chord Wheel' ? 'Wheel' : label}</span></NavLink>)}</nav>
  </div>
}

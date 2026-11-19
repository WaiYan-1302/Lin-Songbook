import { ArrowRight, BookOpenText, CircleDot, Guitar, Heart, Music2, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Song } from '../types'
import { ChordDiagram } from '../components/ChordDiagram'
import { getVoicing } from '../music/chordDatabase'
import { guitarAudio } from '../audio/GuitarAudioEngine'

export function HomePage({ songs, favorites }: { songs: Song[]; favorites: string[] }) {
  const featured = getVoicing('Cmaj7')!
  const recent = songs.slice(0, 3)
  return <div className="page home-page">
    <header className="home-hero">
      <div><p className="eyebrow">Your acoustic practice space</p><h1>Play the song,<br /><em>not the screen.</em></h1><p>Lyrics, chords, real recorded guitar, and just enough theory—together in one calm notebook.</p><div className="hero-actions"><Link className="button primary" to={`/songbook/${songs[0]?.id}`}><Play size={17} /> Continue practicing</Link><Link className="button ghost" to="/songbook">Open songbook <ArrowRight size={16} /></Link></div></div>
      <div className="hero-chord"><span>Chord of the day</span><ChordDiagram voicing={featured} size="large" onString={index => guitarAudio.playString(index, featured.frets[index], .75)} /><button className="round-play" onClick={() => guitarAudio.playChord(featured)} aria-label="Play C major seven"><Play size={19} fill="currentColor" /></button><p>Cmaj7 <small>soft, open, wistful</small></p></div>
    </header>
    <section className="section-heading"><div><p className="eyebrow">Pick up where you left off</p><h2>On the music stand</h2></div><Link to="/songbook">View all songs <ArrowRight size={15} /></Link></section>
    <div className="song-strip">{recent.map((song, i) => <Link to={`/songbook/${song.id}`} className="song-card" key={song.id}><span className={`song-art art-${i + 1}`}><Music2 /></span><span className="song-copy"><small>{song.tags[0] || 'Song'}</small><strong>{song.title}</strong><span>{song.artist}</span></span>{favorites.includes(song.id) && <Heart className="favorite-mark" size={17} fill="currentColor" />}</Link>)}</div>
    <div className="quick-grid"><Link to="/chord-lab"><Guitar /><div><strong>Chord Lab</strong><span>Explore voicings across the fretboard</span></div><ArrowRight /></Link><Link to="/chord-wheel"><CircleDot /><div><strong>Chord Wheel</strong><span>Find the chords that belong together</span></div><ArrowRight /></Link><Link to="/songbook"><BookOpenText /><div><strong>{songs.length} songs</strong><span>{favorites.length} saved as favorites</span></div><ArrowRight /></Link></div>
  </div>
}

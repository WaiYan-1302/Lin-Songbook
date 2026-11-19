import { useMemo } from 'react'
import type { GuitarVoicing } from '../types'

type Props = { voicing: GuitarVoicing; size?: 'compact' | 'medium' | 'large'; activeString?: number | null; onString?: (index: number) => void }

export function ChordDiagram({ voicing, size = 'medium', activeString, onString }: Props) {
  const width = size === 'compact' ? 132 : size === 'large' ? 250 : 190
  const height = width * 1.16
  const paddingX = width * .16
  const top = height * .18
  const gridW = width - paddingX * 2
  const fretH = (height * .62) / 4
  const maxFret = Math.max(...voicing.frets)
  const minFret = Math.min(...voicing.frets.filter(fret => fret > 0))
  const startFret = maxFret > 4 ? Math.max(1, minFret) : 1
  const positions = useMemo(() => voicing.frets.map(fret => fret > 0 && startFret > 1 ? fret - startFret + 1 : fret), [voicing.frets, startFret])

  return <svg className="chord-diagram" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${voicing.chordSymbol} chord diagram`}>
    <text x={width / 2} y={height * .1} textAnchor="middle" className="diagram-title">{voicing.chordSymbol}</text>
    {startFret > 1 && <text x={paddingX - 8} y={top + fretH * .65} textAnchor="end" className="fret-label">{startFret}fr</text>}
    {[0, 1, 2, 3, 4].map(fret => <line key={`f${fret}`} x1={paddingX} x2={width - paddingX} y1={top + fret * fretH} y2={top + fret * fretH} className={fret === 0 && startFret === 1 ? 'nut' : 'fret'} />)}
    {positions.map((fret, stringIndex) => {
      const x = paddingX + (gridW / 5) * stringIndex
      const active = activeString === stringIndex
      return <g key={stringIndex} onClick={() => fret >= 0 && onString?.(stringIndex)} className={onString && fret >= 0 ? 'diagram-string interactive' : 'diagram-string'}>
        <line x1={x} x2={x} y1={top} y2={top + fretH * 4} className={active ? 'string active' : 'string'} />
        {fret === -1 && <><line x1={x - 5} x2={x + 5} y1={top - 14} y2={top - 4} className="marker" /><line x1={x + 5} x2={x - 5} y1={top - 14} y2={top - 4} className="marker" /></>}
        {fret === 0 && <circle cx={x} cy={top - 9} r={5} className="open-marker" />}
        {fret > 0 && <><circle cx={x} cy={top + (fret - .5) * fretH} r={width * .043} className={active ? 'finger active' : 'finger'} /><text x={x} y={top + (fret - .5) * fretH + 4} textAnchor="middle" className="finger-number">{voicing.fingers[stringIndex] || ''}</text></>}
        {onString && fret >= 0 && <rect x={x - gridW / 12} y={top - 20} width={gridW / 6} height={fretH * 4 + 28} fill="transparent"><title>Play string {stringIndex + 1}</title></rect>}
      </g>
    })}
  </svg>
}

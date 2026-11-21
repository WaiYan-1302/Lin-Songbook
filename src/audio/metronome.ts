export type MetronomeSound = 'pendulum' | 'digital' | 'snare' | 'hihat'

export const METRONOME_SOUNDS: { id: MetronomeSound; name: string; description: string }[] = [
  { id: 'pendulum', name: 'Pendulum', description: 'Warm mechanical click' },
  { id: 'digital', name: 'Digital synth', description: 'Clear electronic pulse' },
  { id: 'snare', name: 'Snare', description: 'Short drum hit' },
  { id: 'hihat', name: 'Hi-hat', description: 'Crisp practice tick' },
]

function envelope(context: AudioContext, when: number, volume: number, length: number) {
  const gain = context.createGain()
  gain.gain.setValueAtTime(.0001, when)
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume), when + .003)
  gain.gain.exponentialRampToValueAtTime(.0001, when + length)
  gain.connect(context.destination)
  return gain
}

function noiseBuffer(context: AudioContext, length: number) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1
  return buffer
}

export function playMetronomeTick(context: AudioContext, sound: MetronomeSound, accent: boolean, when: number, volume = .7) {
  const strength = Math.max(0, Math.min(1, volume)) * (accent ? 1 : .72)

  if (sound === 'snare' || sound === 'hihat') {
    const length = sound === 'snare' ? .13 : .055
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    filter.type = sound === 'snare' ? 'bandpass' : 'highpass'
    filter.frequency.setValueAtTime(sound === 'snare' ? (accent ? 1850 : 1450) : (accent ? 7600 : 6500), when)
    filter.Q.value = sound === 'snare' ? .75 : .4
    source.buffer = noiseBuffer(context, length)
    source.connect(filter).connect(envelope(context, when, strength * (sound === 'snare' ? .34 : .18), length))
    source.start(when)
    source.stop(when + length)

    if (sound === 'snare') {
      const body = context.createOscillator()
      body.type = 'triangle'
      body.frequency.setValueAtTime(accent ? 190 : 155, when)
      body.connect(envelope(context, when, strength * .18, .075))
      body.start(when)
      body.stop(when + .08)
    }
    return
  }

  const oscillator = context.createOscillator()
  const length = sound === 'pendulum' ? .065 : .095
  oscillator.type = sound === 'pendulum' ? 'sine' : 'square'
  oscillator.frequency.setValueAtTime(
    sound === 'pendulum' ? (accent ? 1320 : 880) : (accent ? 980 : 620),
    when,
  )
  oscillator.connect(envelope(context, when, strength * (sound === 'pendulum' ? .24 : .12), length))
  oscillator.start(when)
  oscillator.stop(when + length)
}

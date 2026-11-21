export type PitchResult = { frequency: number; confidence: number; level: number }

export function detectPitch(samples: Float32Array, sampleRate: number, minFrequency = 55, maxFrequency = 420): PitchResult | null {
  let energy = 0
  for (const sample of samples) energy += sample * sample
  const level = Math.sqrt(energy / samples.length)
  if (level < .008) return null

  const windowSize = Math.floor(samples.length / 2)
  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency))
  const maxTau = Math.min(windowSize - 2, Math.ceil(sampleRate / minFrequency))
  const difference = new Float32Array(maxTau + 1)

  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0
    for (let index = 0; index < windowSize; index++) {
      const delta = samples[index] - samples[index + tau]
      sum += delta * delta
    }
    difference[tau] = sum
  }

  let runningSum = 0
  difference[0] = 1
  for (let tau = 1; tau <= maxTau; tau++) {
    runningSum += difference[tau]
    difference[tau] = runningSum ? difference[tau] * tau / runningSum : 1
  }

  let tau = minTau
  while (tau <= maxTau) {
    if (difference[tau] < .16) {
      while (tau + 1 <= maxTau && difference[tau + 1] < difference[tau]) tau++
      const refinedTau = interpolateTau(difference, tau)
      return { frequency: sampleRate / refinedTau, confidence: Math.max(0, 1 - difference[tau]), level }
    }
    tau++
  }
  return null
}

export function describePitch(frequency: number, concertA = 440) {
  const midi = Math.round(69 + 12 * Math.log2(frequency / concertA))
  const targetFrequency = concertA * 2 ** ((midi - 69) / 12)
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
  return {
    midi,
    note: names[(midi % 12 + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    cents: 1200 * Math.log2(frequency / targetFrequency),
    targetFrequency,
  }
}

function interpolateTau(values: Float32Array, tau: number) {
  if (tau <= 1 || tau >= values.length - 1) return tau
  const left = values[tau - 1]
  const center = values[tau]
  const right = values[tau + 1]
  const denominator = 2 * (2 * center - right - left)
  return denominator ? tau + (right - left) / denominator : tau
}

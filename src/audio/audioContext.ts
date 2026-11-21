type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext

export function createAudioContext(options?: AudioContextOptions) {
  const browserWindow = window as Window & { webkitAudioContext?: AudioContextConstructor }
  const Context = window.AudioContext ?? browserWindow.webkitAudioContext
  if (!Context) throw new Error('Web Audio is not supported by this browser.')
  try {
    return new Context(options)
  } catch {
    return new Context()
  }
}

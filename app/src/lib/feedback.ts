let ctx: AudioContext | null = null
function tone(freq: number, ms: number) {
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = freq; g.gain.value = 0.08
    o.connect(g); g.connect(ctx.destination); o.start()
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000)
    o.stop(ctx.currentTime + ms / 1000)
  } catch { /* sound is optional */ }
}
export const tap = () => navigator.vibrate?.(10)
export const success = () => { navigator.vibrate?.(30); tone(880, 120); setTimeout(() => tone(1320, 140), 110) }
export const fail = () => { navigator.vibrate?.([40, 60, 40]); tone(220, 220) }

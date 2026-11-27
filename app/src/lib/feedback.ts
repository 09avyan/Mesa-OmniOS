// Tap feedback: a tiny vibration + a soft click. Cheap on low-end phones (one shared AudioContext, 30ms tones).
let ctx: AudioContext | null = null
let soundOn = true
try { soundOn = localStorage.getItem('omni-sound') !== 'off' } catch { /* private mode */ }

export function setSound(on: boolean) {
  soundOn = on
  try { localStorage.setItem('omni-sound', on ? 'on' : 'off') } catch { /* ignore */ }
}
export const soundEnabled = () => soundOn

function tone(freq: number, ms: number, vol = 0.04) {
  if (!soundOn) return
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = freq; o.type = 'sine'
    g.gain.setValueAtTime(vol, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000)
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + ms / 1000)
  } catch { /* no audio: fine */ }
}
const buzz = (ms: number) => { try { navigator.vibrate?.(ms) } catch { /* ignore */ } }

export const tapFx = () => { buzz(10); tone(880, 30, 0.03) }
export const successFx = () => { buzz(30); tone(660, 90); setTimeout(() => tone(990, 120), 90) }
export const errorFx = () => { buzz(40); tone(220, 140, 0.05) }

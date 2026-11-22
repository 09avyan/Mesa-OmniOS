// Browser speech recognition (Chrome on Android: hi-IN understands Hindi + Hinglish + brand names).
// Live words while speaking; stops by itself after a pause. Falls back to typing when unsupported.

type Rec = {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number
  start(): void; stop(): void; abort(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
const Ctor = (globalThis as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec })
const RecCtor = Ctor.SpeechRecognition ?? Ctor.webkitSpeechRecognition

export const speechSupported = () => !!RecCtor

export type ListenError = 'denied' | 'no-speech' | 'network' | 'unsupported' | 'other'

export function listen(opts: {
  lang: 'hi-IN' | 'en-IN'
  onWords: (text: string) => void          // live words (final + interim)
  onDone: (finalText: string) => void      // owner stopped / pause
  onError: (e: ListenError) => void
  silenceMs?: number
}) {
  if (!RecCtor) { opts.onError('unsupported'); return { stop() {} } }
  const rec = new RecCtor()
  rec.lang = opts.lang; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1
  let finalText = '', interim = '', ended = false, timer: ReturnType<typeof setTimeout> | undefined
  const silence = opts.silenceMs ?? 1800
  const arm = () => { clearTimeout(timer); timer = setTimeout(() => rec.stop(), silence) }

  rec.onresult = (e) => {
    interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) finalText += r[0].transcript + ' '; else interim += r[0].transcript
    }
    opts.onWords((finalText + interim).trim())
    arm()
  }
  rec.onerror = (e) => {
    if (e.error === 'no-speech') return // keep waiting; onend handles empty
    ended = true; clearTimeout(timer)
    opts.onError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : e.error === 'network' ? 'network' : 'other')
  }
  rec.onend = () => {
    clearTimeout(timer)
    if (ended) return
    ended = true
    const text = (finalText + interim).trim()
    if (text) opts.onDone(text); else opts.onError('no-speech')
  }
  try { rec.start(); arm(); timer = setTimeout(() => rec.stop(), 8000) } catch { opts.onError('other') }
  return { stop() { try { rec.stop() } catch { /* already stopped */ } } }
}

// Speak an answer aloud (decision 8). Uses the phone's own Hindi/English voice.
export function speak(text: string, lang: 'hi' | 'hinglish' | 'en', rate: number) {
  try {
    const s = window.speechSynthesis
    if (!s) return
    s.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang === 'en' ? 'en-IN' : 'hi-IN'
    u.rate = rate
    const v = s.getVoices().find((x) => x.lang === u.lang)
    if (v) u.voice = v
    s.speak(u)
  } catch { /* no voice: the answer is on screen anyway */ }
}

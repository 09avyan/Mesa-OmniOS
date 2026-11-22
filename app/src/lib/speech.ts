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
  onDone: (finalText: string) => void      // owner finished (pause after speaking)
  onError: (e: ListenError) => void
  silenceMs?: number
}) {
  if (!RecCtor) { opts.onError('unsupported'); return { stop() {} } }
  // Android Chrome ends a recognition session after every short pause and sometimes reports "network"
  // for that. So: short sessions, restarted quietly, words kept across sessions; we decide when the owner is done.
  const silence = opts.silenceMs ?? 2000
  const started = Date.now()
  let kept = '', interim = '', lastWords = 0, finished = false, userStop = false, fails = 0
  let rec: Rec | null = null
  let timer: ReturnType<typeof setInterval> | undefined

  const text = () => (kept + ' ' + interim).replace(/\s+/g, ' ').trim()
  const finish = (err?: ListenError) => {
    if (finished) return
    finished = true; clearInterval(timer)
    try { rec?.abort() } catch { /* ignore */ }
    const t = text()
    if (t) opts.onDone(t); else opts.onError(err ?? 'no-speech')
  }
  const startOne = () => {
    if (finished) return
    const r = new RecCtor!()
    rec = r
    r.lang = opts.lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1
    r.onresult = (e) => {
      interim = ''
      let fin = ''
      for (let i = 0; i < e.results.length; i++) {
        const x = e.results[i]
        if (x.isFinal) fin += x[0].transcript + ' '; else interim += x[0].transcript
      }
      if (fin) { kept = (kept + ' ' + fin).trim(); interim = '' }
      lastWords = Date.now(); fails = 0
      opts.onWords(text())
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { finish('denied'); return }
      if (e.error === 'network' || e.error === 'audio-capture') fails++
      // 'no-speech' / 'aborted' / brief 'network': onend restarts quietly
    }
    r.onend = () => {
      if (finished) return
      if (interim) { kept = (kept + ' ' + interim).trim(); interim = '' }
      if (userStop) { finish(); return }
      if (fails >= 3) { finish(navigator.onLine ? 'other' : 'network'); return }
      setTimeout(startOne, 120)
    }
    try { r.start() } catch { setTimeout(startOne, 300) }
  }
  timer = setInterval(() => {
    const now = Date.now()
    if (text() && now - lastWords > silence) { userStop = true; finish() }     // spoke, then paused
    else if (!text() && now - started > 9000) finish('no-speech')              // nothing heard
    else if (now - started > 25000) finish()                                   // safety cap
  }, 250)
  startOne()
  return { stop() { userStop = true; finish() } }
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

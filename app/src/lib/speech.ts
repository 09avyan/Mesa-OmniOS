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

const key = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()

/** One heard phrase: what the phone thinks (best first) plus its other guesses. */
export type Segment = string[]

/**
 * Chrome restarts and re-sends the same words: drop a phrase that repeats the one before it, replace a phrase that the
 * next one extends ("2 kilo" -> "2 kilo cheeni"), and trim words that overlap the end of what we already have.
 */
export function addSegment(segs: Segment[], seg: Segment): Segment[] {
  const best = seg[0]?.trim()
  if (!best) return segs
  if (!segs.length) return [seg]
  const prev = segs[segs.length - 1], pb = key(prev[0]), nb = key(best)
  if (!nb || nb === pb || pb.endsWith(' ' + nb) || pb === nb) return [...segs.slice(0, -1), [...prev, ...seg.filter((x) => !prev.includes(x))]]
  if (nb.startsWith(pb + ' ')) return [...segs.slice(0, -1), seg]                              // new one extends the old one
  const pw = pb.split(' '), nw = nb.split(' ')
  for (let k = Math.min(pw.length, nw.length, 6); k >= 2; k--) {                                // "2 kilo cheeni" + "kilo cheeni 1 maggi"
    if (pw.slice(-k).join(' ') === nw.slice(0, k).join(' ')) {
      const words = best.split(/\s+/)
      return [...segs, [words.slice(k).join(' ')]].filter((x) => x[0])
    }
  }
  return [...segs, seg]
}

/** Whole-sentence alternatives from per-phrase alternatives: the best reading first, then one phrase swapped at a time. */
export function combineAlternatives(segs: Segment[], cap = 8): string[] {
  const out: string[] = []
  const add = (parts: string[]) => { const t = parts.join(' ').replace(/\s+/g, ' ').trim(); if (t && !out.includes(t)) out.push(t) }
  const bestParts = segs.map((x) => x[0])
  add(bestParts)
  const depth = Math.max(0, ...segs.map((x) => x.length))
  for (let r = 1; r < depth && out.length < cap; r++) {
    for (let i = segs.length - 1; i >= 0 && out.length < cap; i--) {
      if (segs[i][r]) { const parts = [...bestParts]; parts[i] = segs[i][r]; add(parts) }
    }
  }
  return out.slice(0, cap)
}

/** Does the sentence sound unfinished? ("2 kilo cheeni aur" / "2 kilo") Then we wait longer before closing. */
const OPEN_END = /(\b(aur|and|phir|fir|ka|ki|ke|ek|teen|char|paanch|kilo|kg|gram|litre|ml|packet|rupaye|dhai|dedh|aadha|sawa|sau)|और|फिर|का|की|के|एक|दो|तीन|चार|पांच|किलो|ग्राम|लीटर|रुपये|\d|,)\s*$/i
export const silenceFor = (text: string, base: number) => (OPEN_END.test(text.trim()) ? Math.round(base * 1.5) : base)

/**
 * Live words that do not flicker. Chrome re-guesses the whole sentence on every update ("to kilo" -> "2 kilo", a word
 * disappearing and coming back). Rule: only the LAST word may change freely (it is still being spoken); words before it
 * stay as shown. If the phone revises an earlier word, the revision is shown only once the next update repeats it
 * (or on `final`). A shorter update never removes words that were already shown.
 */
export function makeStabiliser() {
  let shown: string[] = [], pending: string[] | null = null
  const lcp = (a: string[], b: string[]) => { let i = 0; while (i < a.length && i < b.length && key(a[i]) === key(b[i])) i++; return i }
  return {
    push(text: string, final = false): string {
      const nw = text.split(/\s+/).filter(Boolean)
      if (final || !shown.length) { shown = nw; pending = null; return shown.join(' ') }
      const c = lcp(shown, nw)
      if (nw.length < shown.length && c === nw.length) return shown.join(' ')          // fewer words than before: keep what was shown
      const frozen = Math.max(0, shown.length - 1)
      if (c >= frozen) { shown = nw; pending = null }                                   // only the tail grew / changed
      else if (pending && pending.length <= nw.length && lcp(pending, nw) === pending.length) { shown = nw; pending = null }   // the revision repeated: accept it
      else pending = nw.slice(0, c + 1)                                                 // an early word changed: wait for it to repeat
      return shown.join(' ')
    },
    reset() { shown = []; pending = null },
  }
}

export function listen(opts: {
  lang: 'hi-IN' | 'en-IN'
  onWords: (text: string) => void                                  // live words (final + interim)
  onDone: (finalText: string, alternatives: string[]) => void      // owner finished (pause after speaking); alternatives[0] === finalText
  onError: (e: ListenError) => void
  silenceMs?: number
}) {
  if (!RecCtor) { opts.onError('unsupported'); return { stop() {} } }
  // Android Chrome ends a recognition session after every short pause and sometimes reports "network"
  // for that. So: short sessions, restarted at once, words kept across sessions; we decide when the owner is done.
  const silence = opts.silenceMs ?? 2500
  const started = Date.now()
  let committed: Segment[] = []        // phrases from finished sessions
  let session: Segment[] = []         // phrases of the running session, by result index (best + n-best)
  let lastWords = 0, finished = false, userStop = false, fails = 0
  let rec: Rec | null = null
  const stab = makeStabiliser()
  let timer: ReturnType<typeof setInterval> | undefined

  const all = () => session.filter((x) => x?.[0]).reduce(addSegment, committed)
  const text = () => combineAlternatives(all(), 1)[0] ?? ''
  const commit = () => { for (const seg of session) if (seg?.[0]) committed = addSegment(committed, seg); session = [] }
  const finish = (err?: ListenError) => {
    if (finished) return
    finished = true; clearInterval(timer)
    try { rec?.abort() } catch { /* ignore */ }
    const segs = all()
    const t = text()
    if (t) opts.onDone(t, combineAlternatives(segs)); else opts.onError(err ?? 'no-speech')
  }
  const startOne = () => {
    if (finished) return
    const r = new RecCtor!()
    rec = r
    r.lang = opts.lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 5
    r.onresult = (e) => {
      // results are cumulative inside one session: rebuild this session's phrases by index (never appended twice)
      const segs: Segment[] = []
      for (let i = 0; i < e.results.length; i++) {
        const x = e.results[i], alts: string[] = []
        for (let k = 0; k < x.length; k++) { const tr = x[k].transcript.replace(/\s+/g, ' ').trim(); if (tr && !alts.some((a) => key(a) === key(tr))) alts.push(tr) }
        segs[i] = alts
      }
      session = segs
      lastWords = Date.now(); fails = 0
      opts.onWords(stab.push(text()))   // steady words on screen; the sentence handed to onDone is always the full, final reading
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { finish('denied'); return }
      if (e.error === 'network' || e.error === 'audio-capture') fails++
      // 'no-speech' / 'aborted' / brief 'network': onend restarts quietly
    }
    r.onend = () => {
      if (finished) return
      commit()   // an unfinished phrase is kept as heard
      if (userStop) { finish(); return }
      if (fails >= 3) { finish(navigator.onLine ? 'other' : 'network'); return }
      setTimeout(startOne, 40)
    }
    try { r.start() } catch { setTimeout(startOne, 250) }
  }
  timer = setInterval(() => {
    const now = Date.now(), t = text()
    if (t && now - lastWords > silenceFor(t, silence)) { userStop = true; finish() }   // spoke, then paused (longer if the sentence sounds unfinished)
    else if (!t && now - started > 9000) finish('no-speech')                          // nothing heard
    else if (now - started > 40000) finish()                                           // safety cap
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

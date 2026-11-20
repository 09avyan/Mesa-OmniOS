// Browser speech recognition (Chrome on Android). hi-IN understands Hindi + Hinglish.
type Rec = { lang: string; interimResults: boolean; maxAlternatives: number; start(): void; stop(): void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: (e: { error: string }) => void; onend: () => void }

export const speechSupported = () => !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

export function listen(onText: (t: string) => void, onError: (code: 'unsupported' | 'denied' | 'none') => void, onEnd: () => void): () => void {
  const C = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!C) { onError('unsupported'); onEnd(); return () => {} }
  const r: Rec = new C()
  r.lang = 'hi-IN'; r.interimResults = false; r.maxAlternatives = 1
  let got = false
  r.onresult = e => { got = true; onText(e.results[0][0].transcript) }
  r.onerror = e => { got = true; onError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : 'none') }
  r.onend = () => { if (!got) onError('none'); onEnd() }
  r.start()
  return () => r.stop()
}

import { Icon } from './Icon'
import type { L3 } from './BillCard'

// Shared bits of the customer-facing pages (bill, khata, store, order). No login, so no useT: each page keeps its own string table.
export const LANGS: { id: L3; label: string }[] = [{ id: 'hi', label: 'हिंदी' }, { id: 'hinglish', label: 'Hinglish' }, { id: 'en', label: 'English' }]
export const readLang = (fallback: string | null | undefined = 'hi'): L3 => {
  let s: string | null = null
  try { s = localStorage.getItem('omni-bill-lang') } catch { /* private mode */ }
  const l = (s ?? fallback ?? 'hi') as L3
  return LANGS.some((x) => x.id === l) ? l : 'hi'
}
export const saveLang = (l: L3) => { try { localStorage.setItem('omni-bill-lang', l) } catch { /* private mode */ } }

export function CxLangs({ lang, onPick }: { lang: L3; onPick: (l: L3) => void }) {
  return <div className="cx-langs2" role="group" aria-label="language">{LANGS.map((x) => <button key={x.id} className={lang === x.id ? 'on' : ''} aria-pressed={lang === x.id} onClick={() => onPick(x.id)}>{x.label}</button>)}</div>
}

export const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '•'

/** shop letterhead: mark, name, area, call button */
export function Letterhead({ name, area, phone, callLabel }: { name: string; area?: string | null; phone?: string | null; callLabel: string }) {
  return (
    <header className="cx-lh">
      <span className="cx-mk" aria-hidden>{initials(name)}</span>
      <div className="t"><h1>{name}</h1>{area && <span>{area}</span>}</div>
      {phone && <a className="cx-call" href={'tel:' + phone} aria-label={callLabel}><Icon name="phone" size={24} /></a>}
    </header>
  )
}

export function CxSkeleton() {
  return <div className="cx-skg" aria-busy="true" style={{ marginTop: 16 }}><span className="cx-sk" style={{ ['--h' as string]: '56px' }} /><span className="cx-sk" style={{ ['--h' as string]: '320px', borderRadius: 18 }} /><span className="cx-sk" style={{ ['--h' as string]: '56px' }} /></div>
}

const ERR: Record<L3, [string, string]> = { hi: ['नेट नहीं चल रहा', 'दोबारा'], hinglish: ['Net nahi chal raha', 'Dobara'], en: ['No connection', 'Retry'] }
/** failed load: plain words + retry (same look as the merchant LoadError, but without the merchant language provider) */
export function CxError({ lang, onRetry }: { lang: L3; onRetry: () => void }) {
  const [msg, retry] = ERR[lang]
  return <div className="cx-err" role="alert"><Icon name="cloudOff" size={40} /><h2>{msg}</h2><button className="btn primary" onClick={onRetry}><Icon name="undo" size={22} />{retry}</button></div>
}

export function CxBrand() {
  return <div className="cx-brand"><Icon name="store" size={20} />OmniOS Dukaan</div>
}

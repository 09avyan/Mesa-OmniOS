import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { tapFx } from '../lib/feedback'
import { goBack, navigate } from '../lib/router'
import { useT } from '../lib/i18n'

// Every tappable thing goes through Tap: instant press state + vibration + soft click.
export function Tap({ className = '', onClick, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`tap ${className}`} onClick={(e) => { tapFx(); onClick?.(e) }}>{children}</button>
  )
}

export function BackBar({ fallback = '/', right }: { fallback?: string; right?: ReactNode }) {
  const { t } = useT()
  return (
    <div className="top">
      <Tap className="ghost back" onClick={() => goBack(fallback)}><Icon name="back" size={22} stroke={2.4} />{t('back')}</Tap>
      {right}
    </div>
  )
}

type TabId = 'home' | 'bill' | 'maal' | 'udhaar'
const TABS: { id: TabId; icon: string; key: 'tabHome' | 'tabBill' | 'tabMaal' | 'tabUdhaar'; path: string; color?: string }[] = [
  { id: 'home', icon: 'home', key: 'tabHome', path: '/' },
  { id: 'bill', icon: 'bill', key: 'tabBill', path: '/bill', color: 'var(--ac)' },
  { id: 'maal', icon: 'box', key: 'tabMaal', path: '/maal', color: 'var(--c-maal)' },
  { id: 'udhaar', icon: 'book', key: 'tabUdhaar', path: '/udhaar', color: 'var(--c-udh)' },
]

// Bottom bar: 4 tabs + the mic, docked in the same spot on every screen.
export function BottomBar({ active, flow = false, micLabel, listening = false, onMic }: {
  active?: TabId; flow?: boolean; micLabel?: string; listening?: boolean; onMic: () => void
}) {
  const { t } = useT()
  const tab = (x: (typeof TABS)[number]) => (
    <Tap key={x.id} className={`tab ${active === x.id ? 'on' : ''}`} onClick={() => navigate(x.path, true)} aria-current={active === x.id ? 'page' : undefined}>
      <Icon name={x.icon} size={26} />{t(x.key)}
    </Tap>
  )
  return (
    <>
      <nav className="band" aria-label="tabs">
        {!flow && <>{tab(TABS[0])}{tab(TABS[1])}<div />{tab(TABS[2])}{tab(TABS[3])}</>}
      </nav>
      <Tap className={`dock ${listening ? 'listening' : ''}`} onClick={onMic} aria-label={micLabel ?? t('mic')}>
        <div className="c"><Icon name="mic" size={30} /></div>
        <span>{micLabel ?? t('mic')}</span>
      </Tap>
    </>
  )
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  // Portal to <body> so the sheet always sits above the bottom bar and mic.
  return createPortal(<><div className="scrim" onClick={onClose} /><div className="sheet" role="dialog" aria-modal="true">{children}</div></>, document.body)
}

// One toast at a time, with an optional undo action.
type ToastMsg = { text: string; action?: { label: string; run: () => void } }
let push: (m: ToastMsg) => void = () => {}
export const toast = (m: ToastMsg) => push(m)
export function ToastHost() {
  const [msg, setMsg] = useState<ToastMsg | null>(null)
  useEffect(() => { push = (m) => setMsg(m) }, [])
  useEffect(() => { if (!msg) return; const id = setTimeout(() => setMsg(null), 6000); return () => clearTimeout(id) }, [msg])
  if (!msg) return null
  return createPortal(
    <div className="toast" role="status">
      <span>{msg.text}</span>
      {msg.action && <button onClick={() => { tapFx(); msg.action!.run(); setMsg(null) }}>{msg.action.label}</button>}
    </div>, document.body)
}

export function RowButton({ icon, color, label, badge, onClick }: { icon: string; color: string; label: string; badge?: number; onClick: () => void }) {
  return (
    <Tap className="rowb" onClick={onClick}>
      <div className="chipw"><div className="chip" style={{ background: color }}><Icon name={icon} /></div>{badge ? <span className="badge">{badge}</span> : null}</div>
      <div className="grow">{label}</div><div className="chev"><Icon name="chev" size={20} /></div>
    </Tap>
  )
}

// App-styled text question (replaces the browser's plain prompt box). Usage: const v = await askText({ title })
type Ask = { title: string; initial?: string; placeholder?: string; mode?: 'text' | 'tel' | 'email'; resolve: (v: string | null) => void }
let pushAsk: (a: Ask) => void = () => {}
export const askText = (o: Omit<Ask, 'resolve'>) => new Promise<string | null>((resolve) => pushAsk({ ...o, resolve }))
export function AskHost() {
  const { t } = useT()
  const [a, setA] = useState<Ask | null>(null)
  const [v, setV] = useState('')
  useEffect(() => { pushAsk = (x) => { setV(x.initial ?? ''); setA(x) } }, [])
  const done = (val: string | null) => { a?.resolve(val); setA(null) }
  return (
    <Sheet open={!!a} onClose={() => done(null)}>
      {a && <>
        <h2 className="h2">{a.title}</h2><div className="gap16" />
        <input className="input" autoFocus inputMode={a.mode === 'tel' ? 'tel' : undefined} type={a.mode === 'email' ? 'email' : 'text'} placeholder={a.placeholder} value={v}
          onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && v.trim() && done(v.trim())} />
        <div className="gap16" />
        <Tap className="btn primary" disabled={!v.trim()} onClick={() => done(v.trim())}><Icon name="tick" size={22} stroke={3} />{t('ok')}</Tap>
        <div className="gap8" />
        <Tap className="btn quiet" onClick={() => done(null)}>{t('back')}</Tap>
      </>}
    </Sheet>
  )
}

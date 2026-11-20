import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mic } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { listen } from '../lib/speech'
import { tap, fail } from '../lib/feedback'
import { routeVoice } from '../lib/voiceRoutes'

export function LangButton({ onNavy = false }: { onNavy?: boolean }) {
  const { t, lang, setLang } = useLang()
  return <button className={'btn lang' + (onNavy ? ' ghost-on-navy' : '')} onClick={() => { tap(); setLang(lang === 'hi' ? 'hinglish' : 'hi') }}><b>{lang === 'hi' ? 'A' : 'अ'}</b>{t('bhasha')}</button>
}

export function Mark() {
  return <span className="mark" aria-hidden><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></svg></span>
}

// One frame for every screen. `cover` = home's passbook cover; otherwise a white bar with Back.
export function Screen({ title, cover, children, onVoice }: {
  title: string; cover?: ReactNode; children: ReactNode; onVoice?: (text: string) => void
}) {
  const nav = useNavigate()
  const { t } = useLang()
  const [on, setOn] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const mic = () => {
    tap(); setMsg(null); setOn(true)
    listen(
      text => {
        if (onVoice) return onVoice(text)
        const to = routeVoice(text)
        if (to) nav(to); else { fail(); setMsg(`"${text}" — ${t('heard_unknown')}`) }
      },
      code => { if (code !== 'none') { fail(); setMsg(t(code === 'unsupported' ? 'mic_unsupported' : 'mic_denied')) } },
      () => setOn(false),
    )
  }

  return (
    <div className="screen">
      {cover !== undefined ? (
        <header className="cover">
          <div className="cover-top"><Mark /><h1>{title}</h1><LangButton onNavy /></div>
          {cover}
        </header>
      ) : (
        <header className="bar">
          <button className="btn" onClick={() => { tap(); nav(-1) }}><ArrowLeft size={22} />{t('back')}</button>
          <h1>{title}</h1>
          <LangButton />
        </header>
      )}
      <main className="content">{children}</main>
      {msg && <div className="toast" role="status" onClick={() => setMsg(null)}><Mic size={20} style={{ flex: 'none', marginTop: 2 }} />{msg}</div>}
      <footer className="bottombar">
        <button className={'mic' + (on ? ' listening' : '')} onClick={mic}>
          {on ? <span className="dot" /> : <Mic size={24} />}{on ? t('listening') : t('bolo')}
        </button>
      </footer>
    </div>
  )
}

export function Stamp({ text }: { text: string }) {
  return <div className="stamp" aria-hidden><span>{text}</span></div>
}

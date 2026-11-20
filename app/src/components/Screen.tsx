import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mic, Store } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { listen } from '../lib/speech'
import { tap, fail } from '../lib/feedback'
import { routeVoice } from '../lib/voiceRoutes'

export function LangButton() {
  const { t, lang, setLang } = useLang()
  return <button className="btn small lang" onClick={() => { tap(); setLang(lang === 'hi' ? 'hinglish' : 'hi') }}><b>{lang === 'hi' ? 'A' : 'अ'}</b>{t('bhasha')}</button>
}

// Same frame on every screen: back + title + language on top, mic fixed at the bottom.
export function Screen({ title, back = true, children, onVoice, action }: {
  title: string; back?: boolean; children: ReactNode
  onVoice?: (text: string) => void
  action?: ReactNode
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
      <header className="topbar">
        {back
          ? <button className="btn small" onClick={() => { tap(); nav(-1) }}><ArrowLeft size={22} />{t('back')}</button>
          : <span className="logo"><Store size={20} /></span>}
        {back ? <h1>{title}</h1> : <div className="brand"><h1>{title}</h1></div>}
        <LangButton />
      </header>
      <main className="content">
        {children}
        {action && <div style={{ marginTop: 'auto' }}>{action}</div>}
      </main>
      {msg && <div className="toast" role="status" onClick={() => setMsg(null)}><Mic size={20} style={{ flex: 'none', marginTop: 2 }} />{msg}</div>}
      <footer className="bottombar">
        <button className={'mic' + (on ? ' listening' : '')} onClick={mic}>
          <Mic size={24} />{on ? t('listening') : t('bolo')}
        </button>
      </footer>
    </div>
  )
}

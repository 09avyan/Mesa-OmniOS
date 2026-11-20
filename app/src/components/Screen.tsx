import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lib/i18n'
import { listen } from '../lib/speech'
import { tap, fail } from '../lib/feedback'
import { routeVoice } from '../lib/voiceRoutes'

// Same frame on every screen: back + title + language on top, mic fixed at the bottom.
export function Screen({ title, back = true, children, onVoice, action }: {
  title: string; back?: boolean; children: ReactNode
  onVoice?: (text: string) => void   // screen-specific voice handling; default = go to a section by name
  action?: ReactNode                 // the screen's main action, always right above the mic
}) {
  const nav = useNavigate()
  const { t, lang, setLang } = useLang()
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
        {back ? <button className="btn small" onClick={() => { tap(); nav(-1) }}><span className="ic">←</span>{t('back')}</button> : <span style={{ width: 8 }} />}
        <h1>{title}</h1>
        <button className="btn small lang" aria-label="Language" onClick={() => { tap(); setLang(lang === 'hi' ? 'hinglish' : 'hi') }}>
          <span style={{display:'flex',flexDirection:'column',lineHeight:1.05,fontSize:16}}><b>{lang === 'hi' ? 'A' : 'अ'}</b>{t('bhasha')}</span>
        </button>
      </header>
      <main className="content">
        {children}
        {action && <div style={{ marginTop: 'auto' }}>{action}</div>}
      </main>
      {msg && <div className="toast" role="status" onClick={() => setMsg(null)}>🎤 {msg}</div>}
      <footer className="bottombar">
        <button className={'mic' + (on ? ' listening' : '')} onClick={mic} aria-label={t('bolo')}>
          <span className="ic">🎤</span>{on ? t('listening') : t('bolo')}
        </button>
      </footer>
    </div>
  )
}

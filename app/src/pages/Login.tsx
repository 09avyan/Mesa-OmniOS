import { useState } from 'react'
import { supabase, storeEmail, storePassword, logUsage } from '../lib/supabase'
import { useLang } from '../lib/i18n'
import { tap, success, fail } from '../lib/feedback'
import { ArrowRight, CircleAlert, Delete, Pencil, Store } from 'lucide-react'
import { LangButton } from '../components/Screen'

export default function Login() {
  const { t } = useLang()
  const [code, setCode] = useState(() => { try { return localStorage.getItem('storeCode') ?? '' } catch { return '' } })
  const [step, setStep] = useState<'code' | 'pin'>(code ? 'pin' : 'code')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const go = async (p: string) => {
    setBusy(true); setErr(null)
    const { error } = await supabase.auth.signInWithPassword({ email: storeEmail(code.trim()), password: storePassword(code.trim(), p) })
    if (error) {
      setBusy(false); setPin(''); fail()
      setErr(t(error.message.includes('fetch') ? 'no_net' : 'bad_login'))
      return
    }
    const { data } = await supabase.rpc('my_store_id')
    if (!data) { await supabase.auth.signOut(); setBusy(false); setPin(''); fail(); setErr(t('paused')); return }
    try { localStorage.setItem('storeCode', code.trim().toLowerCase()) } catch { /* ok */ }
    success(); logUsage('login')
  }

  const press = (d: string) => {
    tap(); if (busy) return
    const p = (pin + d).slice(0, 4); setPin(p)
    if (p.length === 4) go(p)
  }

  return (
    <div className="screen">
      <header className="topbar">
        <span className="logo"><Store size={20} /></span>
        <div className="brand"><h1>OmniOS Dukaan</h1></div>
        <LangButton />
      </header>
      <main className="content">
        <h2 style={{ fontSize: 28, marginTop: 8 }}>{t('login_title')}</h2>
        {err && <div className="err" role="alert"><CircleAlert size={22} style={{ flex: 'none' }} />{err}</div>}
        {step === 'code' ? (
          <>
            <label className="field">{t('store_code')}
              <input value={code} autoCapitalize="none" autoComplete="off" inputMode="text"
                onChange={e => setCode(e.target.value.replace(/[^a-z0-9]/gi, ''))} placeholder="sharma1" />
            </label>
            <button className="btn primary full" disabled={code.length < 3} onClick={() => { tap(); setStep('pin') }}>
              {t('next')}<ArrowRight size={22} />
            </button>
          </>
        ) : (
          <>
            <button className="btn row-btn" onClick={() => { tap(); setStep('code'); setPin('') }}><Store size={20} />{code}<Pencil size={18} style={{ marginLeft: 'auto', color: 'var(--ink-faint)' }} /></button>
            <p className="big" style={{ textAlign: 'center', margin: 0 }}>{t('pin')}</p>
            <div className="pinbox">{[0, 1, 2, 3].map(i => <span key={i} className={pin.length > i ? 'on' : ''}></span>)}</div>
            {busy && <p className="muted" style={{ textAlign: 'center' }}>{t('wait')}</p>}
            <div className="keypad">
              {'123456789'.split('').map(d => <button key={d} className="btn" onClick={() => press(d)}>{d}</button>)}
              <button className="btn word" onClick={() => { tap(); setPin(p => p.slice(0, -1)) }}><Delete size={24} />{t('clear')}</button>
              <button className="btn" onClick={() => press('0')}>0</button>
              <span />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

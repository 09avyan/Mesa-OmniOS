import { useState } from 'react'
import { useT } from '../lib/i18n'
import { storeLogin } from '../lib/auth'
import { errorFx, successFx } from '../lib/feedback'
import { Tap } from '../components/ui'
import { Icon } from '../components/Icon'

// Two calm steps: shop code, then a 4-digit PIN on a big keypad.
export function Login() {
  const { t } = useT()
  const [code, setCode] = useState(() => { try { return localStorage.getItem('omni-code') ?? '' } catch { return '' } })
  const [step, setStep] = useState<'code' | 'pin'>(code ? 'pin' : 'code')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const codeOk = /^[A-Za-z0-9]{4,8}$/.test(code.trim())

  async function press(d: string) {
    if (busy) return
    setErr('')
    const next = (pin + d).slice(0, 4)
    setPin(next)
    if (next.length < 4) return
    setBusy(true)
    const r = await storeLogin(code, next)
    setBusy(false)
    if (r === 'ok') { successFx(); try { localStorage.setItem('omni-code', code.trim().toUpperCase()) } catch { /* ignore */ } return }
    errorFx(); setPin(''); setErr(r === 'wrong' ? t('wrongLogin') : t('offline'))
  }

  if (step === 'code') return (
    <main className="screen">
      <div style={{ height: 40 }} />
      <div style={{ color: 'var(--ac)' }}><Icon name="lock" size={40} /></div>
      <div className="gap16" />
      <h1 className="h1">{t('loginTitle')}</h1>
      <div className="gap24" />
      <div className="field">
        <label htmlFor="code">{t('codeLabel')}</label>
        <input id="code" className="input" value={code} autoCapitalize="characters" autoComplete="off" spellCheck={false}
          maxLength={8} onChange={(e) => setCode(e.target.value.replace(/\s/g, '').toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter' && codeOk) setStep('pin') }} style={{ letterSpacing: 2, fontWeight: 700, fontSize: 24 }} />
        <span className="lab">{t('codeHint')}</span>
      </div>
      <div className="gap24" />
      <Tap className="btn primary" disabled={!codeOk} onClick={() => { setStep('pin'); setPin(''); setErr('') }}>{t('next')}</Tap>
      <div className="gap24" />
      <p className="lab center">{t('forgotCode')}</p>
    </main>
  )

  return (
    <main className="screen">
      <div className="top">
        <Tap className="ghost back" onClick={() => { setStep('code'); setPin(''); setErr('') }}><Icon name="back" size={22} stroke={2.4} />{t('changeCode')}</Tap>
        <span className="num" style={{ letterSpacing: 2 }}>{code.toUpperCase()}</span>
      </div>
      <h1 className="h1 center" style={{ marginTop: 8 }}>{t('pinTitle')}</h1>
      <div className="pins" aria-label={`${pin.length} of 4`}>{[0, 1, 2, 3].map((i) => <i key={i} className={i < pin.length ? 'on' : ''} />)}</div>
      {err && <><div className="err" role="alert">{err}</div><div className="gap16" /></>}
      {busy && <p className="lab center" style={{ marginBottom: 16 }}>{t('loading')}</p>}
      <div className="pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => <Tap key={d} className="key" onClick={() => press(d)}>{d}</Tap>)}
        <Tap className="key word" onClick={() => { setPin(''); setErr('') }}>{t('clear')}</Tap>
        <Tap className="key" onClick={() => press('0')}>0</Tap>
        <Tap className="key word" aria-label="delete" onClick={() => setPin(pin.slice(0, -1))}>⌫</Tap>
      </div>
    </main>
  )
}

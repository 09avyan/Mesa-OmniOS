import { useState } from 'react'
import { useT } from '../lib/i18n'
import { storeLogin } from '../lib/auth'
import { errorFx, successFx } from '../lib/feedback'
import { Tap } from '../components/ui'
import { Icon } from '../components/Icon'

// Two calm steps: shop code, then a 6-digit PIN on a big keypad.
export function Login() {
  const { t } = useT()
  const [code, setCode] = useState(() => { try { return localStorage.getItem('omni-code') ?? '' } catch { return '' } })
  const [step, setStep] = useState<'code' | 'pin'>(code ? 'pin' : 'code')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(() => { try { if (sessionStorage.getItem('omni-removed')) { sessionStorage.removeItem('omni-removed'); return 'removed' } } catch { /* ignore */ } return '' })
  const [shake, setShake] = useState(false)

  const codeOk = /^[A-Za-z0-9]{4,8}$/.test(code.trim())

  async function press(d: string) {
    if (busy) return
    setErr('')
    const next = (pin + d).slice(0, 6)
    setPin(next)
    if (next.length < 6) return
    setBusy(true)
    const r = await storeLogin(code, next)
    setBusy(false)
    if (r.kind === 'ok') { successFx(); try { localStorage.setItem('omni-code', code.trim().toUpperCase()) } catch { /* ignore */ } return }
    errorFx(); setPin(''); setShake(true); setTimeout(() => setShake(false), 400)
    if (r.kind === 'locked') { const m = Math.max(1, Math.ceil((new Date(r.until).getTime() - Date.now()) / 60000)); setErr(t('pinLocked').replace('{m}', String(m))) }
    else if (r.kind === 'wrong') setErr(r.left !== undefined && r.left <= 2 ? `${t('wrongLogin')} ${t('triesLeft').replace('{n}', String(r.left))}` : t('wrongLogin'))
    else setErr(t('offline'))
  }

  if (step === 'code') return (
    <main className="screen lg">
      <h1 className="h1">{t('loginTitle')}</h1>
      <div className="field">
        <label htmlFor="code">{t('codeLabel')}</label>
        <input id="code" className="input lg-code" value={code} autoCapitalize="characters" autoComplete="off" spellCheck={false}
          maxLength={8} placeholder={t('codeExample')} onChange={(e) => setCode(e.target.value.replace(/\s/g, '').toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter' && codeOk) setStep('pin') }} />
        <span className="lg-hint">{t('codeHint')}</span>
      </div>
      <Tap className="btn primary" disabled={!codeOk} onClick={() => { setStep('pin'); setPin(''); setErr('') }}>{codeOk ? t('next') : t('codeFirst')}{codeOk && <Icon name="chev" size={22} stroke={2.6} />}</Tap>
      <p className="lg-hint">{t('forgotCode')}</p>
    </main>
  )

  return (
    <main className="screen lg lg-pin">
      <div className="top">
        <Tap className="ghost back" onClick={() => { setStep('code'); setPin(''); setErr('') }}><Icon name="back" size={22} stroke={2.4} />{t('changeCode')}</Tap>
      </div>
      <h1 className="h1">{t('pinTitle')}</h1>
      <p className="lg-hint">{t('shopLabel')}: <b>{code.toUpperCase()}</b></p>
      <div className={`pins ${shake ? 'shake' : ''}`} aria-label={`${pin.length} of 6`}>{[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className={i < pin.length ? 'on' : ''} />)}</div>
      <div className="msgslot" role="alert">{err ? <div className="err">{err === 'removed' ? t('removedHere') : err}</div> : busy ? <p className="lg-hint">{t('loading')}</p> : null}</div>
      <div className="pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => <Tap key={d} className="key" onClick={() => press(d)}>{d}</Tap>)}
        <Tap className="key word" onClick={() => { setPin(''); setErr('') }}>{t('clear')}</Tap>
        <Tap className="key" onClick={() => press('0')}>0</Tap>
        <Tap className="key word" aria-label="delete" onClick={() => setPin(pin.slice(0, -1))}><Icon name="back" size={26} /></Tap>
      </div>
    </main>
  )
}

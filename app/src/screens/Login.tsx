import { useState } from 'react'
import { useT } from '../lib/i18n'
import { storeLogin } from '../lib/auth'
import { errorFx, successFx } from '../lib/feedback'
import { Tap, toast } from '../components/ui'
import { Icon, Logo } from '../components/Icon'

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
    <main className="screen v2 vlogin">
      <Logo size={56} />
      <h1 className="vh1" style={{ margin: '24px 0 16px' }}>{t('loginTitle')}</h1>
      <div className="field">
        <label htmlFor="code" className="vlab">{t('codeLabel')}</label>
        <input id="code" className="input lg-code" value={code} autoCapitalize="characters" autoComplete="off" spellCheck={false}
          maxLength={8} placeholder={t('codeExample')} onChange={(e) => setCode(e.target.value.replace(/\s/g, '').toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter' && codeOk) setStep('pin') }} />
      </div>
      <div className="grow" />
      <p className="vlab" style={{ marginBottom: 16 }}>{t('forgotCode')}</p>
      <Tap className="btn primary" disabled={!codeOk} onClick={() => { setStep('pin'); setPin(''); setErr('') }}>{codeOk ? t('next') : t('codeFirst')}{codeOk && <Icon name="chev" size={22} stroke={2.6} />}</Tap>
    </main>
  )

  return (
    <main className="screen v2 vlogin">
      <Logo size={56} />
      <h1 className="vh1" style={{ margin: '24px 0 8px' }}>{t('pinPrompt')}</h1>
      <p className="vlab">{t('shopCodeIs')} <b style={{ color: 'var(--ink)' }}>{code.toUpperCase()}</b> · <Tap className="ulink" style={{ font: 'inherit' }} onClick={() => { setStep('code'); setPin(''); setErr('') }}>{t('change')}</Tap></p>
      <div className={`vpins ${shake ? 'shake' : ''}`} aria-label={`${pin.length} of 6`}>{[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={i === pin.length ? 'cur' : ''}>{i < pin.length && <i />}</span>)}</div>
      <div style={{ minHeight: 72, marginTop: 16 }} role="alert">{err ? <div className="err">{err === 'removed' ? t('removedHere') : err}</div> : busy ? <p className="vlab">{t('loading')}</p> : null}</div>
      <div className="grow" />
      <div className="vk">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => <Tap key={d} onClick={() => press(d)}>{d}</Tap>)}
        <Tap className="q" onClick={() => toast({ text: t('forgotCode') })}>{t('pinForgot')}</Tap>
        <Tap onClick={() => press('0')}>0</Tap>
        <Tap className="q" aria-label="delete" onClick={() => setPin(pin.slice(0, -1))}><Icon name="bksp" size={26} /></Tap>
      </div>
    </main>
  )
}

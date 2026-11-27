import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { rupees } from '../lib/i18n'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/config'
import { Icon } from '../components/Icon'
import type { L3 } from '../components/BillCard'
import { CxBrand, CxError, CxLangs, CxSkeleton, Letterhead, readLang, saveLang } from '../components/Cx'

// Public page the customer opens from the reminder: their balance and recent entries. No login.
const pub = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
type Pub = { store: string; area: string | null; phone: string | null; upi: string | null; updated: string | null; customer: string; balance: number; entries: { amount: number; kind: string; at: string; bill: string | null }[] }
const BT: Record<L3, { hi: string; due: string; clear: string; hisaab: string; took: string; paid: string; none: string; upi: string; call: string; after: string; upd: string; see: string }> = {
  hi: { hi: 'नमस्ते', due: 'आपका बाकी', clear: 'सब चुकता', hisaab: 'हिसाब', took: 'सामान लिया', paid: 'पैसे जमा किए', none: 'हिसाब नहीं मिला', upi: 'UPI से चुकाओ', call: 'दुकान को कॉल करें', after: 'बाकी', upd: 'अपडेट', see: 'बिल देखें' },
  hinglish: { hi: 'Namaste', due: 'Aapka baaki', clear: 'Sab chukta', hisaab: 'Hisaab', took: 'Saaman liya', paid: 'Paise jama kiye', none: 'Hisaab nahi mila', upi: 'UPI se chukao', call: 'Dukaan ko call karein', after: 'Baaki', upd: 'Update', see: 'Bill dekhein' },
  en: { hi: 'Hello', due: 'Balance due', clear: 'All paid', hisaab: 'Account', took: 'Bought items', paid: 'Paid', none: 'Account not found', upi: 'Pay by UPI', call: 'Call the shop', after: 'Balance', upd: 'Updated', see: 'See bill' },
}

export function BalancePage({ token }: { token: string }) {
  const [d, setD] = useState<Pub | null | undefined>(undefined)
  const [failed, setFailed] = useState(false)
  const [bl, setBl] = useState<L3>(readLang())
  const B = BT[bl]
  const load = useCallback(() => {
    setFailed(false); setD(undefined)
    pub.rpc('public_balance', { p_token: token }).then(({ data, error }) => { if (error) setFailed(true); else setD((data as Pub) ?? null) }, () => setFailed(true))
  }, [token])
  useEffect(load, [load])
  const langs = <CxLangs lang={bl} onPick={(l) => { setBl(l); saveLang(l) }} />
  if (failed) return <main className="cx-page">{langs}<CxError lang={bl} onRetry={load} /></main>
  if (d === undefined) return <main className="cx-page">{langs}<CxSkeleton /></main>
  if (!d) return <main className="cx-page">{langs}<h1 className="cx-state" style={{ marginTop: 40 }}>{B.none}</h1></main>
  const bal = Number(d.balance)
  const fmtD = (iso: string) => {
    const x = new Date(iso), h = x.getHours(), m = String(x.getMinutes()).padStart(2, '0')
    const day = x.toLocaleDateString(bl === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })
    const part = bl === 'en' ? (h < 12 ? 'am' : 'pm') : h < 12 ? (bl === 'hi' ? 'सुबह' : 'subah') : h < 17 ? (bl === 'hi' ? 'दोपहर' : 'dopahar') : (bl === 'hi' ? 'शाम' : 'shaam')
    const hh = ((h + 11) % 12) + 1
    return bl === 'en' ? `${day} · ${hh}:${m} ${part}` : `${day} · ${part} ${hh}:${m}`
  }
  let run = bal
  const rows = d.entries.map((e) => { const r = { ...e, after: run }; run -= Number(e.amount); return r })
  return (
    <main className="cx-page">
      {langs}
      <Letterhead name={d.store} area={d.area} phone={d.phone} callLabel={B.call} />
      <section className="cx-card cx-hero">
        <div className="l">{B.hi} {d.customer}, {bal > 0 ? B.due : B.clear}</div>
        <div className={`amt ${bal > 0 ? 'ud' : ''}`}><span className="rs">₹</span>{Math.abs(Math.round(bal)).toLocaleString('en-IN')}</div>
        {d.updated && <div className="l">{B.upd}: {fmtD(d.updated)}</div>}
        {bal > 0 && d.upi && <a className="btn primary" style={{ width: '100%', marginTop: 20, gap: 10 }} href={`upi://pay?pa=${encodeURIComponent(d.upi)}&pn=${encodeURIComponent(d.store)}&am=${bal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Udhaar ' + d.customer)}`}><Icon name="qr" size={24} />{B.upi}</a>}
      </section>
      <h2 className="cx-h2">{B.hisaab}</h2>
      <section className="cx-rows">
        {rows.map((e, i) => {
          const took = Number(e.amount) > 0
          const inner = <><div className="g"><b>{took ? B.took : B.paid}</b><small>{fmtD(e.at)} · {B.after} {rupees(e.after)}</small></div>
            <div className={`a ${took ? 'ud' : ''}`}>{took ? '+' : '−'} {rupees(Math.abs(Number(e.amount)))}{e.bill && <Icon name="chev" size={20} />}</div></>
          return e.bill ? <a key={i} className="cx-row" href={'/b/' + e.bill} aria-label={B.see}>{inner}</a> : <div key={i} className="cx-row">{inner}</div>
        })}
      </section>
      <CxBrand />
    </main>
  )
}

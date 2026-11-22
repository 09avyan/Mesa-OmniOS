import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/config'
import { rupees } from '../lib/i18n'

// Public bill page the customer opens from WhatsApp. No login; shows only this one bill.
const pub = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
type Bill = { store: string; area: string | null; customer: string | null; pay: string; subtotal: number; discount: number; total: number; status: string; at: string; lang: string; lines: { name: string; name_hi: string | null; qty: number; unit: string; price: number; amount: number }[] }

const T = {
  hi: { billNo: 'बिल नं.', date: 'तारीख', to: 'ग्राहक', sub: 'जोड़', made: 'बिल बनाया', bill: 'बिल', item: 'सामान', qty: 'मात्रा', amt: 'रकम', total: 'कुल', disc: 'छूट', paid: { cash: 'नकद · भुगतान हुआ', upi: 'UPI · भुगतान हुआ', udhaar: 'उधार में लिखा' }, removed: 'यह बिल दुकान ने हटा दिया है', thanks: 'धन्यवाद! फिर पधारें 🙏', none: 'बिल नहीं मिला', switch: 'English' },
  en: { billNo: 'Bill no.', date: 'Date', to: 'Customer', sub: 'Subtotal', made: 'Bill made with', bill: 'Bill', item: 'Item', qty: 'Qty', amt: 'Amount', total: 'Total', disc: 'Discount', paid: { cash: 'Paid · Cash', upi: 'Paid · UPI', udhaar: 'On udhaar' }, removed: 'The shop has removed this bill', thanks: 'Thank you! Visit again 🙏', none: 'Bill not found', switch: 'हिंदी' },
}
const units: Record<string, string> = { kg: 'kg', g: 'g', l: 'L', ml: 'ml', pc: '', pack: 'pkt' }

export function BillPage({ token }: { token: string }) {
  const [bill, setBill] = useState<Bill | null | undefined>(undefined)
  const [lang, setLang] = useState<'hi' | 'en'>('hi')
  useEffect(() => {
    pub.rpc('public_bill', { p_token: token }).then(({ data }) => {
      const b = (data as Bill | null) ?? null
      setBill(b)
      if (b) setLang((localStorage.getItem('omni-bill-lang') as 'hi' | 'en') ?? (b.lang === 'en' ? 'en' : 'hi'))
    })
  }, [token])
  const L = T[lang]
  const flip = () => { const n = lang === 'hi' ? 'en' : 'hi'; setLang(n); try { localStorage.setItem('omni-bill-lang', n) } catch { /* */ }; pub.rpc('set_bill_lang', { p_token: token, p_lang: n }).then(() => {}) }
  if (bill === undefined) return <main className="screen"><div className="skel" style={{ height: 200, marginTop: 40 }} /></main>
  if (!bill) return <main className="screen"><h1 className="h1" style={{ marginTop: 60 }}>{L.none}</h1></main>
  const date = new Date(bill.at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  const no = token.slice(0, 6).toUpperCase()
  const stamp = bill.status !== 'saved' ? null : bill.pay === 'udhaar' ? 'ud' : 'paid'
  return (
    <main className="rcpt-page">
      <div className="rcpt-top"><button className="rcpt-lang tap" onClick={flip}>{L.switch}</button></div>
      <article className="rcpt">
        <header className="rcpt-head">
          <div className="rcpt-store">{bill.store}</div>
          {bill.area && <div className="rcpt-area">{bill.area}</div>}
        </header>
        <div className="rcpt-meta">
          <div><span>{L.billNo}</span><b>#{no}</b></div>
          <div style={{ textAlign: 'right' }}><span>{L.date}</span><b>{date}</b></div>
        </div>
        {bill.customer && <div className="rcpt-cust">{L.to}: <b>{bill.customer}</b></div>}
        {bill.status !== 'saved' && <div className="err" style={{ margin: '0 20px 12px' }}>{L.removed}</div>}
        <div className="rcpt-lines">
          <div className="rcpt-row rcpt-th"><span>{L.item}</span><span>{L.amt}</span></div>
          {bill.lines.map((l, i) => (
            <div key={i} className="rcpt-row">
              <div><div className="rcpt-name">{lang === 'hi' && l.name_hi ? l.name_hi : l.name}</div>
                <div className="rcpt-sub">{+Number(l.qty).toFixed(3)} {units[l.unit] ?? ''} × ₹{+Number(l.price).toFixed(2)}</div></div>
              <div className="rcpt-amt">{rupees(l.amount)}</div>
            </div>
          ))}
        </div>
        <div className="rcpt-tot">
          {Number(bill.discount) > 0 && <><div className="rcpt-row2"><span>{L.sub}</span><span>{rupees(bill.subtotal)}</span></div>
            <div className="rcpt-row2"><span>{L.disc}</span><span>− {rupees(bill.discount)}</span></div></>}
          <div className="rcpt-grand"><span>{L.total}</span><span>{rupees(bill.total)}</span></div>
          {stamp && <div className={`rcpt-stamp ${stamp}`}>{L.paid[bill.pay as 'cash' | 'upi' | 'udhaar']}</div>}
        </div>
        <footer className="rcpt-foot">{L.thanks}</footer>
      </article>
      <div className="rcpt-brand"><span className="rcpt-logo" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></span>{L.made} <b>OmniOS Dukaan</b></div>
    </main>
  )
}

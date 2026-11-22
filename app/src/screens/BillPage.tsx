import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/config'
import { rupees } from '../lib/i18n'

// Public bill page the customer opens from WhatsApp. No login; shows only this one bill.
const pub = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
type Bill = { store: string; area: string | null; customer: string | null; pay: string; subtotal: number; discount: number; total: number; status: string; at: string; lang: string; lines: { name: string; name_hi: string | null; qty: number; unit: string; price: number; amount: number }[] }

const T = {
  hi: { bill: 'बिल', item: 'सामान', qty: 'मात्रा', amt: 'रकम', total: 'कुल', disc: 'छूट', paid: { cash: 'नकद दिया', upi: 'UPI से दिया', udhaar: 'उधार में लिखा' }, removed: 'यह बिल दुकान ने हटा दिया है', thanks: 'धन्यवाद! फिर आइए', none: 'बिल नहीं मिला', switch: 'English' },
  en: { bill: 'Bill', item: 'Item', qty: 'Qty', amt: 'Amount', total: 'Total', disc: 'Discount', paid: { cash: 'Paid in cash', upi: 'Paid by UPI', udhaar: 'Added to udhaar' }, removed: 'The shop has removed this bill', thanks: 'Thank you! Visit again', none: 'Bill not found', switch: 'हिंदी' },
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
  const date = new Date(bill.at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  return (
    <main className="screen" style={{ paddingBottom: 40 }}>
      <div className="top"><span className="title">{bill.store}</span><button className="ghost tap" onClick={flip}>{L.switch}</button></div>
      <p className="lab">{bill.area ? bill.area + ' · ' : ''}{date}</p>
      {bill.status !== 'saved' && <div className="err" style={{ marginTop: 16 }}>{L.removed}</div>}
      <div className="card" style={{ marginTop: 16, padding: '16px 20px' }}>
        <div className="h2">{L.bill}{bill.customer ? ` · ${bill.customer}` : ''}</div>
        <div className="divider" />
        {bill.lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
            <div><b>{lang === 'hi' && l.name_hi ? l.name_hi : l.name}</b><div className="lab" style={{ fontSize: 17 }}>{+Number(l.qty).toFixed(3)} {units[l.unit] ?? ''} × ₹{+Number(l.price).toFixed(2)}</div></div>
            <div className="num" style={{ fontSize: 20 }}>{rupees(l.amount)}</div>
          </div>
        ))}
        <div className="divider" />
        {Number(bill.discount) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="lab">{L.disc}</span><span>− {rupees(bill.discount)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span className="h2">{L.total}</span><span className="big" style={{ fontSize: 38 }}>{rupees(bill.total)}</span></div>
        <p className="lab" style={{ marginTop: 8 }}>{L.paid[bill.pay as 'cash' | 'upi' | 'udhaar']}</p>
      </div>
      <p className="center lab" style={{ marginTop: 24 }}>{L.thanks}</p>
    </main>
  )
}

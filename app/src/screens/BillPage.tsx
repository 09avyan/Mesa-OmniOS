import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/config'
import { rupees } from '../lib/i18n'
import { CATALOG } from '../voice/catalog'

// Public bill page the customer opens from WhatsApp. No login; shows only this one bill.
const pub = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
type Line = { name: string; name_hi: string | null; catalog_id: string | null; qty: number; unit: string; price: number; amount: number }
type Bill = { store: string; area: string | null; customer: string | null; pay: string; subtotal: number; discount: number; total: number; status: string; at: string; lang: string; lines: Line[] }
type L3 = 'hi' | 'hinglish' | 'en'
const CAT = new Map(CATALOG.map((c) => [c.id, c]))
// Item name in the customer's chosen language (catalogue has all three; shop-only items fall back sensibly)
const itemName = (l: Line, lang: L3) => {
  const c = l.catalog_id ? CAT.get(l.catalog_id) : undefined
  if (lang === 'hi') return c?.hi ?? l.name_hi ?? l.name
  if (lang === 'en') return c?.en ?? l.name
  return c?.hinglish ?? l.name
}

const T: Record<L3, { billNo: string; date: string; to: string; items: string; item: string; amt: string; sub: string; disc: string; total: string; saved: string; paid: { cash: string; upi: string; udhaar: string }; removed: string; thanks: string; none: string; made: string }> = {
  hi: { billNo: 'बिल नं.', date: 'तारीख', to: 'ग्राहक', items: 'सामान', item: 'सामान', amt: 'रकम', sub: 'जोड़', disc: 'छूट', total: 'कुल', saved: 'आपकी बचत', paid: { cash: 'नकद · भुगतान हुआ', upi: 'UPI · भुगतान हुआ', udhaar: 'उधार में लिखा' }, removed: 'यह बिल दुकान ने हटा दिया है', thanks: 'धन्यवाद! फिर पधारें 🙏', none: 'बिल नहीं मिला', made: 'बिल बना' },
  hinglish: { billNo: 'Bill no.', date: 'Tareekh', to: 'Grahak', items: 'saaman', item: 'Saaman', amt: 'Raqam', sub: 'Jod', disc: 'Chhoot', total: 'Kul', saved: 'Aapki bachat', paid: { cash: 'Cash · Bhugtan hua', upi: 'UPI · Bhugtan hua', udhaar: 'Udhaar mein likha' }, removed: 'Yeh bill dukaan ne hata diya hai', thanks: 'Dhanyavaad! Phir padhaarein 🙏', none: 'Bill nahi mila', made: 'Bill bana' },
  en: { billNo: 'Bill no.', date: 'Date', to: 'Customer', items: 'items', item: 'Item', amt: 'Amount', sub: 'Subtotal', disc: 'Discount', total: 'Total', saved: 'You saved', paid: { cash: 'Paid · Cash', upi: 'Paid · UPI', udhaar: 'On udhaar' }, removed: 'The shop has removed this bill', thanks: 'Thank you! Visit again 🙏', none: 'Bill not found', made: 'Bill made with' },
}
const units: Record<string, string> = { kg: 'kg', g: 'g', l: 'L', ml: 'ml', pc: '', pack: 'pkt' }
const LANGS: { id: L3; label: string }[] = [{ id: 'hi', label: 'हिंदी' }, { id: 'hinglish', label: 'Hinglish' }, { id: 'en', label: 'English' }]

export function BillPage({ token }: { token: string }) {
  const [bill, setBill] = useState<Bill | null | undefined>(undefined)
  const [lang, setLang] = useState<L3>('hi')
  useEffect(() => {
    pub.rpc('public_bill', { p_token: token }).then(({ data }) => {
      const b = (data as Bill | null) ?? null
      setBill(b)
      if (b) { const saved = localStorage.getItem('omni-bill-lang') as L3 | null; setLang(saved && T[saved] ? saved : (T[b.lang as L3] ? (b.lang as L3) : 'hi')) }
    })
  }, [token])
  const L = T[lang]
  const pick = (n: L3) => { setLang(n); try { localStorage.setItem('omni-bill-lang', n) } catch { /* */ }; pub.rpc('set_bill_lang', { p_token: token, p_lang: n }).then(() => {}) }
  if (bill === undefined) return <main className="screen"><div className="skel" style={{ height: 200, marginTop: 40 }} /></main>
  if (!bill) return <main className="screen"><h1 className="h1" style={{ marginTop: 60 }}>{L.none}</h1></main>
  const date = new Date(bill.at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  const no = token.slice(0, 6).toUpperCase()
  const stamp = bill.status !== 'saved' ? null : bill.pay === 'udhaar' ? 'ud' : 'paid'
  return (
    <main className="rcpt-page">
      <div className="rcpt-top" role="group" aria-label="language">{LANGS.map((x) => <button key={x.id} className={`rcpt-lang tap ${lang === x.id ? 'on' : ''}`} onClick={() => pick(x.id)}>{x.label}</button>)}</div>
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
          <div className="rcpt-row rcpt-th"><span>{bill.lines.length} {L.items}</span><span>{L.amt}</span></div>
          {bill.lines.map((l, i) => (
            <div key={i} className="rcpt-row">
              <div><div className="rcpt-name">{itemName(l, lang)}</div>
                <div className="rcpt-sub">{+Number(l.qty).toFixed(3)} {units[l.unit] ?? ''} × ₹{+Number(l.price).toFixed(2)}</div></div>
              <div className="rcpt-amt">{rupees(l.amount)}</div>
            </div>
          ))}
        </div>
        <div className="rcpt-tot">
          {Number(bill.discount) > 0 && <><div className="rcpt-row2"><span>{L.sub}</span><span>{rupees(bill.subtotal)}</span></div>
            <div className="rcpt-row2"><span>{L.disc}</span><span>− {rupees(bill.discount)}</span></div></>}
          <div className="rcpt-grand"><span>{L.total}</span><span>{rupees(bill.total)}</span></div>
          {Number(bill.discount) > 0 && <div className="rcpt-saved">🎉 {L.saved} {rupees(bill.discount)}</div>}
          {stamp && <div className={`rcpt-stamp ${stamp}`}>{L.paid[bill.pay as 'cash' | 'upi' | 'udhaar']}</div>}
        </div>
        <footer className="rcpt-foot">{L.thanks}</footer>
      </article>
      <div className="rcpt-brand"><span className="rcpt-logo" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></span>{lang === 'en' ? <>{L.made} <b>OmniOS Dukaan</b></> : <><b>OmniOS Dukaan</b> {lang === 'hi' ? 'से' : 'se'} {L.made}</>}</div>
    </main>
  )
}

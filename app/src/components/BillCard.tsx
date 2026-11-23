import { rupees } from '../lib/i18n'
import { CATALOG } from '../voice/catalog'

// One bill design used everywhere: customer's WhatsApp page, "Bill ban gaya" screen and bill detail.
// Modern-card style (like a UPI receipt): shop on top, big total with a status badge, items below.
export type L3 = 'hi' | 'hinglish' | 'en'
export type BillLine = { name: string; name_hi?: string | null; catalog_id?: string | null; qty: number; unit: string; price: number; amount: number }
export type BillData = { store: string; area?: string | null; customer: string | null; pay: string; subtotal: number; discount: number; total: number; status: string; at: string; no: string; lines: BillLine[] }

const CAT = new Map(CATALOG.map((c) => [c.id, c]))
export const itemName = (l: BillLine, lang: L3) => {
  const c = l.catalog_id ? CAT.get(l.catalog_id) : undefined
  if (lang === 'hi') return c?.hi ?? l.name_hi ?? l.name
  if (lang === 'en') return c?.en ?? l.name
  return c?.hinglish ?? l.name
}
const units: Record<string, string> = { kg: 'kg', g: 'g', l: 'L', ml: 'ml', pc: '', pack: 'pkt' }

export const BILL_T: Record<L3, { bill: string; to: string; walkIn: string; items: string; sub: string; disc: string; total: string; saved: string; paid: string; via: { cash: string; upi: string; udhaar: string }; udhaar: string; removed: string; thanks: string; made: (b: string) => string }> = {
  hi: { bill: 'बिल', to: 'ग्राहक', walkIn: 'ग्राहक', items: 'सामान', sub: 'जोड़', disc: 'छूट', total: 'कुल', saved: 'आपकी बचत', paid: 'भुगतान हुआ', via: { cash: 'नकद से', upi: 'UPI से', udhaar: 'उधार में' }, udhaar: 'उधार में लिखा', removed: 'यह बिल हटा दिया गया', thanks: 'धन्यवाद! फिर पधारें', made: (b) => `${b} से बना बिल` },
  hinglish: { bill: 'Bill', to: 'Grahak', walkIn: 'Grahak', items: 'saaman', sub: 'Jod', disc: 'Chhoot', total: 'Kul', saved: 'Aapki bachat', paid: 'Bhugtan hua', via: { cash: 'Cash se', upi: 'UPI se', udhaar: 'Udhaar mein' }, udhaar: 'Udhaar mein likha', removed: 'Yeh bill hata diya gaya', thanks: 'Dhanyavaad! Phir padhaarein', made: (b) => `${b} se bana bill` },
  en: { bill: 'Bill', to: 'Customer', walkIn: 'Customer', items: 'items', sub: 'Subtotal', disc: 'Discount', total: 'Total', saved: 'You saved', paid: 'Paid', via: { cash: 'by cash', upi: 'by UPI', udhaar: 'on udhaar' }, udhaar: 'Added to udhaar', removed: 'This bill was removed', thanks: 'Thank you! Visit again', made: (b) => `Bill made with ${b}` },
}

export function BillCard({ b, lang, brand = true }: { b: BillData; lang: L3; brand?: boolean }) {
  const L = BILL_T[lang]
  const removed = b.status !== 'saved'
  const ud = b.pay === 'udhaar'
  const date = new Date(b.at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  return (
    <article className={`bc ${removed ? 'bc-off' : ''}`}>
      <header className="bc-shop">
        <div className="bc-av">{b.store.trim().charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}><div className="bc-store">{b.store}</div>{b.area && <div className="bc-area">{b.area}</div>}</div>
      </header>
      <section className="bc-hero">
        <div className={`bc-badge ${removed ? 'off' : ud ? 'ud' : 'ok'}`} aria-hidden="true">{removed ? '×' : ud ? '₹' : '✓'}</div>
        <div className="bc-total">{rupees(b.total)}</div>
        <div className={`bc-status ${removed ? 'off' : ud ? 'ud' : 'ok'}`}>{removed ? L.removed : ud ? L.udhaar : `${L.paid} · ${L.via[b.pay as 'cash' | 'upi']}`}</div>
        <div className="bc-meta">{b.customer ? `${L.to}: ${b.customer} · ` : ''}{b.no ? `${L.bill} ${lang === 'hi' ? 'नं.' : 'no.'} ${b.no}` : ''}</div>
        <div className="bc-meta">{date}</div>
      </section>
      <section className="bc-items">
        <div className="bc-ih">{b.lines.length} {L.items}</div>
        {b.lines.map((l, i) => (
          <div key={i} className="bc-row">
            <div style={{ minWidth: 0 }}><div className="bc-name">{itemName(l, lang)}</div>
              <div className="bc-sub">{+Number(l.qty).toFixed(3)} {units[l.unit] ?? ''} × ₹{+Number(l.price).toFixed(2)}</div></div>
            <div className="bc-amt">{rupees(l.amount)}</div>
          </div>
        ))}
        {Number(b.discount) > 0 && <>
          <div className="bc-row2"><span>{L.sub}</span><span>{rupees(b.subtotal)}</span></div>
          <div className="bc-row2 bc-save"><span>{L.disc} · {L.saved}</span><span>− {rupees(b.discount)}</span></div>
        </>}
        <div className="bc-grand"><span>{L.total}</span><span>{rupees(b.total)}</span></div>
      </section>
      <footer className="bc-foot">{L.thanks}</footer>
      {brand && <div className="bc-brand"><span className="bc-logo"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></span>{L.made('OmniOS Dukaan')}</div>}
    </article>
  )
}

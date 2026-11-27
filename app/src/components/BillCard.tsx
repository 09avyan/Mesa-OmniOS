import { rupees } from '../lib/i18n'
import { Icon } from './Icon'
import { CATALOG } from '../voice/catalog'
import { norm } from '../lib/universe'

// One bill design used everywhere: customer's WhatsApp page, "Bill ban gaya" screen and bill detail.
// Modern-card style (like a UPI receipt): shop on top, big total with a status badge, items below.
export type L3 = 'hi' | 'hinglish' | 'en'
export type BillLine = { name: string; name_hi?: string | null; /** flavour / pack size of this line ("Masala 70g") and its Hindi form */ variant?: string | null; variant_hi?: string | null; catalog_id?: string | null; qty: number; unit: string; price: number; amount: number }
export type BillData = { store: string; area?: string | null; customer: string | null; pay: string; subtotal: number; discount: number; total: number; status: string; at: string; no: string; lines: BillLine[] }

const CAT = new Map(CATALOG.map((c) => [c.id, c]))
const withVariant = (name: string, variant?: string | null) => (variant && !norm(name).includes(norm(variant)) ? `${name} ${variant}` : name)
/** item name + its flavour/size once ("Maggi Masala 70g"); names that already carry it are left alone */
export const itemName = (l: BillLine, lang: L3) => {
  const c = l.catalog_id ? CAT.get(l.catalog_id) : undefined
  if (lang === 'hi') return withVariant(c?.hi ?? l.name_hi ?? l.name, l.variant_hi ?? l.variant)
  if (lang === 'en') return withVariant(c?.en ?? l.name, l.variant)
  return withVariant(c?.hinglish ?? l.name, l.variant)
}
/** WhatsApp / share text: shop, total, one line per item with its flavour/size, then the bill link */
export function billMessage(shopName: string, lang: string, total: number, rows: { name: string; qty: number; amount: number }[], link: string) {
  const items = rows.map((r) => `• ${r.name} × ${+Number(r.qty).toFixed(3)} = ${rupees(r.amount)}`)
  return `${shopName ? shopName + ': ' : ''}${lang === 'en' ? 'Your bill' : 'Aapka bill'} ${rupees(total)}${items.length ? '\n' + items.join('\n') : ''}\n${link}`
}
const units: Record<string, string> = { kg: 'kg', g: 'g', l: 'L', ml: 'ml', pc: '', pack: 'pkt' }

export const BILL_T: Record<L3, { bill: string; to: string; walkIn: string; items: string; sub: string; disc: string; total: string; saved: string; paid: string; via: { cash: string; upi: string; udhaar: string }; udhaar: string; removed: string; thanks: string; made: (b: string) => string }> = {
  hi: { bill: 'बिल', to: 'ग्राहक', walkIn: 'ग्राहक', items: 'सामान', sub: 'जोड़', disc: 'छूट', total: 'कुल', saved: 'आपकी बचत', paid: 'भुगतान हुआ', via: { cash: 'नकद से', upi: 'UPI से', udhaar: 'उधार में' }, udhaar: 'उधार में लिखा', removed: 'यह बिल हटा दिया गया', thanks: 'धन्यवाद! फिर पधारें', made: (b) => `${b} से बना बिल` },
  hinglish: { bill: 'Bill', to: 'Grahak', walkIn: 'Grahak', items: 'saaman', sub: 'Jod', disc: 'Chhoot', total: 'Kul', saved: 'Aapki bachat', paid: 'Bhugtan hua', via: { cash: 'Cash se', upi: 'UPI se', udhaar: 'Udhaar mein' }, udhaar: 'Udhaar mein likha', removed: 'Yeh bill hata diya gaya', thanks: 'Dhanyavaad! Phir padhaarein', made: (b) => `${b} se bana bill` },
  en: { bill: 'Bill', to: 'Customer', walkIn: 'Customer', items: 'items', sub: 'Subtotal', disc: 'Discount', total: 'Total', saved: 'You saved', paid: 'Paid', via: { cash: 'by cash', upi: 'by UPI', udhaar: 'on udhaar' }, udhaar: 'Added to udhaar', removed: 'This bill was removed', thanks: 'Thank you! Visit again', made: (b) => `Bill made with ${b}` },
}

export function BillCard({ b, lang, brand = true, letterhead = true }: { b: BillData; lang: L3; brand?: boolean; letterhead?: boolean }) {
  const L = BILL_T[lang]
  const removed = b.status !== 'saved'
  const ud = b.pay === 'udhaar'
  const d = new Date(b.at)
  const loc = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const date = d.toLocaleDateString(loc, { day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })
  const rows = b.lines
  const chip = removed ? { c: '', t: L.removed } : ud ? { c: 'ud', t: L.udhaar } : { c: 'ok', t: `${L.paid} · ${b.pay === 'upi' ? 'UPI' : 'Cash'}` }
  return (
    <article className={`cx-card cx-bill ${removed ? 'cx-off' : ''}`}>
      {letterhead && <div className="cx-lh" style={{ padding: '0 0 12px', textAlign: 'left' }}><div className="t"><h1>{b.store}</h1>{b.area && <span>{b.area}</span>}</div></div>}
      <span className={`cx-chip ${chip.c}`}>{!removed && !ud && <Icon name="tick" size={20} stroke={3} />}{chip.t}</span>
      <div className="cx-total"><span className="rs">₹</span>{Math.round(Number(b.total)).toLocaleString('en-IN')}</div>
      <div className="cx-sub">{L.bill}{b.no ? ` #${b.no}` : ''} · {date}, {time}</div>
      <hr className="cx-dash" />
      <div className="cx-lines">
        {rows.map((l, i) => (
          <div className="cx-line" key={i}><div><b>{itemName(l, lang)}</b><small>{+Number(l.qty).toFixed(3)}{units[l.unit] ? ' ' + units[l.unit] : ''} × ₹{+Number(l.price).toFixed(2)}</small></div><span className="a">{rupees(l.amount)}</span></div>
        ))}
      </div>
      <hr className="cx-dash" />
      <div className="cx-kv"><span>{L.to}</span><b>{b.customer ?? L.walkIn}</b></div>
      {Number(b.discount) > 0 && <><div className="cx-kv"><span>{L.sub}</span><b>{rupees(b.subtotal)}</b></div><div className="cx-kv"><span>{L.disc}</span><b>− {rupees(b.discount)}</b></div></>}
      <div className="cx-kv tot"><span>{L.total}</span><b>{rupees(b.total)}</b></div>
      {brand && <div className="cx-brand"><Icon name="store" size={20} />{L.made('OmniOS Dukaan')}</div>}
    </article>
  )
}

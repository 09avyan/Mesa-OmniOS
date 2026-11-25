import { rupees } from '../lib/i18n'
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

export function BillCard({ b, lang, brand = true }: { b: BillData; lang: L3; brand?: boolean }) {
  const L = BILL_T[lang]
  const removed = b.status !== 'saved'
  const ud = b.pay === 'udhaar'
  const d = new Date(b.at)
  const loc = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const date = d.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  const rows = b.lines
  return (
    <article className={`bc ${removed ? 'eb-off' : ''}`}>
      <header className="eb-h">
        <div style={{ minWidth: 0 }}><h3>{b.store}</h3>{b.area && <div className="eb-s">{b.area}</div>}</div>
        {b.no && <span className="eb-no">#{b.no}</span>}
      </header>
      <section className="eb-meta">
        <div><span>{L.to}</span><b>{b.customer ?? L.walkIn}</b></div>
        <div><span>{lang === 'hi' ? 'तारीख़' : 'Date'}</span><b>{date}</b></div>
        <div><span>{lang === 'hi' ? 'समय' : 'Time'}</span><b>{time}</b></div>
      </section>
      <table className="eb-t"><tbody>
        {rows.map((l, i) => (
          <tr key={i}><td><b>{itemName(l, lang)}</b><small>{+Number(l.qty).toFixed(3)} {units[l.unit] ?? ''} × ₹{+Number(l.price).toFixed(2)}</small></td><td>{rupees(l.amount)}</td></tr>
        ))}
      </tbody></table>
      {Number(b.discount) > 0
        ? <><div className="eb-sub"><span>{L.sub}</span><span>{rupees(b.subtotal)}</span></div><div className="eb-sub"><span>{L.disc}</span><span>− {rupees(b.discount)}</span></div></>
        : <div className="eb-sub"><span>{rows.length} {L.items}</span><span>{rupees(b.subtotal)}</span></div>}
      <div className="eb-tot"><span>{L.total}</span><b><span className="rs">₹</span>{Math.round(Number(b.total)).toLocaleString('en-IN')}</b></div>
      <div className={`eb-pay ${ud || removed ? '' : 'paid'}`}>
        <span className="eb-pill">{removed ? L.removed : ud ? L.udhaar : `${L.paid}`}</span>
        {!removed && !ud && <span>{L.via[b.pay as 'cash' | 'upi']}</span>}
      </div>
      <footer className="eb-f"><span>{L.thanks}</span></footer>
      {brand && <div className="bc-brand">{L.made('OmniOS Dukaan')}</div>}
    </article>
  )
}

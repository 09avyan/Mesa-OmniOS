import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/config'
import { Icon } from '../components/Icon'
import { BillCard, billMessage, itemName, type BillData, type BillLine, type L3 } from '../components/BillCard'
import { CxBrand, CxError, CxLangs, CxSkeleton, Letterhead, readLang, saveLang } from '../components/Cx'

// Public bill page the customer opens from WhatsApp. No login; shows only this one bill.
const pub = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
type Raw = Omit<BillData, 'no' | 'lines'> & { lang: string; slug: string | null; phone: string | null; khata: string | null; no: number; lines: BillLine[] }
const T: Record<L3, { order: string; khata: string; share: string; none: string; call: string }> = {
  hi: { order: 'ऑनलाइन ऑर्डर', khata: 'मेरा खाता', share: 'शेयर', none: 'बिल नहीं मिला', call: 'दुकान को कॉल करें' },
  hinglish: { order: 'Online order', khata: 'Mera khata', share: 'Share', none: 'Bill nahi mila', call: 'Dukaan ko call karein' },
  en: { order: 'Order online', khata: 'My khata', share: 'Share', none: 'Bill not found', call: 'Call the shop' },
}

export function BillPage({ token }: { token: string }) {
  const [bill, setBill] = useState<Raw | null | undefined>(undefined)
  const [failed, setFailed] = useState(false)
  const [lang, setLang] = useState<L3>(readLang())
  const L = T[lang]
  const load = useCallback(() => {
    setFailed(false); setBill(undefined)
    pub.rpc('public_bill', { p_token: token }).then(({ data, error }) => {
      if (error) { setFailed(true); return }
      const b = (data as Raw | null) ?? null
      setBill(b)
      setLang(readLang(b?.lang))
    }, () => setFailed(true))
  }, [token])
  useEffect(load, [load])
  const pick = (n: L3) => { setLang(n); saveLang(n); pub.rpc('set_bill_lang', { p_token: token, p_lang: n }).then(() => {}, () => {}) }
  const share = () => {
    if (!bill) return
    const text = billMessage(bill.store, lang, bill.total, bill.lines.map((l) => ({ name: itemName(l, lang), qty: l.qty, amount: l.amount })), location.href)
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener')
  }
  return (
    <main className="cx-page">
      <CxLangs lang={lang} onPick={pick} />
      {failed ? <CxError lang={lang} onRetry={load} />
        : bill === undefined ? <CxSkeleton />
        : !bill ? <h1 className="cx-state" style={{ marginTop: 40 }}>{L.none}</h1>
        : <>
          <Letterhead name={bill.store} area={bill.area} phone={bill.phone} callLabel={L.call} />
          <BillCard lang={lang} b={{ ...bill, no: String(bill.no) }} letterhead={false} brand={false} />
          <div className="cx-acts">
            {bill.pay === 'udhaar' && bill.khata && <a className="btn primary" href={'/k/' + bill.khata}><Icon name="book" size={22} />{L.khata}</a>}
            <button className="btn wa" onClick={share}><Icon name="wa" size={22} />{L.share} · WhatsApp</button>
            {bill.slug && <a className="btn outline" href={'/s/' + bill.slug}><Icon name="cart" size={22} />{L.order}</a>}
          </div>
          <CxBrand />
        </>}
    </main>
  )
}

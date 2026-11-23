import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/config'
import { Icon } from '../components/Icon'
import { BillCard, type BillData, type BillLine, type L3 } from '../components/BillCard'

// Public bill page the customer opens from WhatsApp. No login; shows only this one bill.
const pub = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
type Raw = Omit<BillData, 'no' | 'lines'> & { lang: string; slug: string | null; phone: string | null; khata: string | null; no: number; lines: BillLine[] }
const LANGS: { id: L3; label: string }[] = [{ id: 'hi', label: 'हिंदी' }, { id: 'hinglish', label: 'Hinglish' }, { id: 'en', label: 'English' }]
const ORDER: Record<L3, string> = { hi: 'अगली बार ऑनलाइन ऑर्डर करें', hinglish: 'Agli baar online order karein', en: 'Order online next time' }
const KHATA: Record<L3, string> = { hi: 'पूरा खाता देखें', hinglish: 'Poora khata dekhein', en: 'See full account' }
const CALL: Record<L3, string> = { hi: 'दुकान को कॉल करें', hinglish: 'Dukaan ko call karein', en: 'Call the shop' }
const NONE: Record<L3, string> = { hi: 'बिल नहीं मिला', hinglish: 'Bill nahi mila', en: 'Bill not found' }

export function BillPage({ token }: { token: string }) {
  const [bill, setBill] = useState<Raw | null | undefined>(undefined)
  const [lang, setLang] = useState<L3>('hi')
  useEffect(() => {
    pub.rpc('public_bill', { p_token: token }).then(({ data }) => {
      const b = (data as Raw | null) ?? null
      setBill(b)
      let saved: string | null = null
      try { saved = localStorage.getItem('omni-bill-lang') } catch { /* */ }
      const pickL = (saved ?? b?.lang ?? 'hi') as L3
      setLang(LANGS.some((l) => l.id === pickL) ? pickL : 'hi')
    })
  }, [token])
  const pick = (n: L3) => { setLang(n); try { localStorage.setItem('omni-bill-lang', n) } catch { /* */ }; pub.rpc('set_bill_lang', { p_token: token, p_lang: n }).then(() => {}) }
  return (
    <main className="bc-page">
      <div className="bc-langs" role="group" aria-label="language">
        {LANGS.map((x) => <button key={x.id} className={`tap ${lang === x.id ? 'on' : ''}`} onClick={() => pick(x.id)}>{x.label}</button>)}
      </div>
      {bill === undefined ? <div className="skel" style={{ width: '100%', maxWidth: 420, height: 420, borderRadius: 24 }} />
        : !bill ? <h1 className="h1" style={{ marginTop: 40 }}>{NONE[lang]}</h1>
        : <><BillCard lang={lang} b={{ ...bill, no: String(bill.no) }} />
          <div className="cx-actions">
            {bill.pay === 'udhaar' && bill.khata && <a className="tap btn primary" href={'/k/' + bill.khata}>{KHATA[lang]}</a>}
            {bill.phone && <a className="tap btn quiet" href={'tel:' + bill.phone}><Icon name="phone" size={22} />{CALL[lang]}</a>}
            {bill.slug && <a className="tap btn quiet" href={'/s/' + bill.slug}><Icon name="cart" size={22} />{ORDER[lang]}</a>}
          </div></>}
    </main>
  )
}

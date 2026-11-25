import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/config'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { custLabel, invalidateShop } from '../lib/shop'
import { errorFx, successFx } from '../lib/feedback'
import { BackBar, Sheet, Tap, toast } from '../components/ui'
import { NumberSheet, ru } from '../components/Pad'
import { Icon } from '../components/Icon'

type Cust = { id: string; name: string; tag: string | null; phone: string | null; share_token: string; balance: number; last_at: string | null }
type Entry = { id: number; amount: number; kind: string; created_at: string; bill_id: string | null }
const ago = (s: string | null) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''

// Udhaar tab: who owes how much, biggest first.
export function UdhaarList() {
  const { t } = useT()
  const [list, setList] = useState<Cust[] | null>(null)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  useEffect(() => {
    supabase.from('customer_balances').select('id,name,tag,phone,share_token,balance,last_at').order('balance', { ascending: false })
      .then(({ data }) => setList(((data ?? []) as Cust[]).map((c) => ({ ...c, balance: Number(c.balance) }))))
  }, [])
  const owing = (list ?? []).filter((c) => c.balance > 0)
  const total = owing.reduce((s, c) => s + c.balance, 0)
  const shown = (list ?? []).filter((c) => (q ? c.name.toLowerCase().includes(q.toLowerCase()) : c.balance !== 0))
  return (
    <main className="screen has-bar pg">
      <div className="top" />
      <h1 className="h1">{t('tabUdhaar')}</h1>
      <div className="pg-sum">
        <div className="lab">{t('udhaarOut')}</div>
        {list ? <div className="hm-big ud">{ru(total)}</div> : <div className="skel" style={{ height: 56, width: '50%' }} />}
        <div className="sub">{owing.length} {t('peopleOwe')}</div>
      </div>
      <div className="pg-acts" style={{ marginTop: 16 }}>
        <Tap className="btn outline" onClick={() => setAdding(true)}><Icon name="plus" size={22} stroke={2.6} />{t('addPerson')}</Tap>
        <input className="input" placeholder={t('searchName')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div style={{ height: 8 }} />
      {!list ? <div className="stack"><div className="skel" style={{ height: 72 }} /><div className="skel" style={{ height: 72 }} /></div>
        : shown.length === 0 ? <p className="pg-empty">{q ? t('noMatch') : t('noUdhaar')}</p>
        : shown.map((c) => (
          <Tap key={c.id} className="hrow" onClick={() => navigate('/udhaar/' + c.id)}>
            <div className="g"><b>{custLabel(c)}</b>{ago(c.last_at) && <span>{ago(c.last_at)}</span>}</div>
            <div className={`a ${c.balance > 0 ? 'ud' : ''}`}>{rupees(Math.abs(c.balance))}</div>
          </Tap>
        ))}
      <AddPerson open={adding} onClose={() => setAdding(false)} />
    </main>
  )
}

// One customer's khata: balance, collect payment, WhatsApp reminder, history.
export function UdhaarCustomer({ id }: { id: string }) {
  const { t, lang } = useT()
  const { store } = useStore()
  const [c, setC] = useState<Cust | null | undefined>(undefined)
  const [entries, setEntries] = useState<Entry[]>([])
  const [pay, setPay] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const load = () => {
    supabase.from('customer_balances').select('id,name,tag,phone,share_token,balance,last_at').eq('id', id).maybeSingle()
      .then(({ data }) => setC(data ? { ...(data as Cust), balance: Number((data as Cust).balance) } : null))
    supabase.from('udhaar_entries').select('id,amount,kind,created_at,bill_id').eq('customer_id', id).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setEntries((data ?? []) as Entry[]))
  }
  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (c === undefined) return <main className="screen has-bar pg"><BackBar fallback="/udhaar" /><div className="skel" style={{ height: 180 }} /></main>
  if (!c) return <main className="screen has-bar pg"><BackBar fallback="/udhaar" /><p className="pg-empty">{t('noMatch')}</p></main>

  const link = `${location.origin}/k/${c.share_token}`
  const msg = lang === 'en'
    ? `Namaste ${c.name}, your pending amount at ${store?.name} is ${rupees(c.balance)}. Details: ${link}`
    : `Namaste ${c.name}, ${store?.name} par aapka ${rupees(c.balance)} udhaar baaki hai. Poora hisaab: ${link}`
  const phone = (c.phone ?? '').replace(/\D/g, '')
  const wa = `https://wa.me/${phone ? (phone.length === 10 ? '91' + phone : phone) : ''}?text=${encodeURIComponent(msg)}`

  async function collect(amount: number) {
    const { error } = await supabase.rpc('log_payment', { p_customer: c!.id, p_amount: amount })
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop(); toast({ text: `${t('paySaved')} · ${rupees(amount)}` }); load()
  }
  async function savePhone(n: number) {
    const p = String(Math.round(n))
    const { error } = await supabase.from('customers').update({ phone: p }).eq('id', c!.id)
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); load()
  }
  const label: Record<string, string> = { bill: t('udhaarGiven'), payment: t('paySaved'), undo: t('removedWord'), return: t('removedWord') }
  return (
    <main className="screen has-bar pg">
      <BackBar fallback="/udhaar" />
      <h1 className="h1">{c.name}</h1>
      {c.tag && <div className="pg-sub">{c.tag}</div>}
      <Tap className="pg-link" onClick={() => setPhoneOpen(true)}>{c.phone ? <><Icon name="phone" size={22} />{c.phone}</> : <><Icon name="plus" size={22} stroke={2.6} />{t('addPhone')}</>}</Tap>
      <div className="pg-sum">
        <div className="lab">{c.balance >= 0 ? t('balanceNow') : t('advance')}</div>
        <div className={`hm-big ${c.balance > 0 ? 'ud' : ''}`}>{ru(Math.abs(c.balance))}</div>
      </div>
      <div className="pg-acts" style={{ marginTop: 16 }}>
        <Tap className="btn primary" onClick={() => setPay(true)}><Icon name="cash" size={24} />{t('collect')}</Tap>
        {c.balance > 0 && <a className="btn outline tap" href={wa} target="_blank" rel="noreferrer"><Icon name="wa" size={24} />{t('remind')}</a>}
      </div>
      <div className="hm-sec"><h2>{t('history')}</h2></div>
      {entries.length === 0 ? <p className="pg-empty">{t('noUdhaar')}</p> : entries.map((e) => (
        <Tap key={e.id} className="hrow" onClick={() => e.bill_id && navigate('/bill/' + e.bill_id)}>
          <div className="g"><b>{label[e.kind] ?? e.kind}</b><span>{ago(e.created_at)}</span></div>
          <div className={`a ${Number(e.amount) > 0 ? 'ud' : ''}`}>{Number(e.amount) > 0 ? '+' : '−'} {rupees(Math.abs(Number(e.amount)))}</div>
        </Tap>
      ))}
      <NumberSheet open={pay} title={`${c.name} — ${t('amount')}`} initial={c.balance > 0 ? c.balance : null} unit="₹" onClose={() => setPay(false)} onDone={collect} />
      <NumberSheet open={phoneOpen} title={t('addPhone')} initial={c.phone ? Number(c.phone) : null} decimals={false} onClose={() => setPhoneOpen(false)} onDone={savePhone} />
    </main>
  )
}

// Add a person: name, phone, old udhaar from the paper khata; asks a pehchaan (tag) if the name already exists.
function AddPerson({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT()
  const [f, setF] = useState({ name: '', phone: '', tag: '', old: '' })
  const [needTag, setNeedTag] = useState(false)
  async function save() {
    const { data, error } = await supabase.rpc('add_customer', { p_name: f.name, p_phone: f.phone, p_tag: f.tag, p_opening: Number(f.old) || 0 })
    if (error) { errorFx(); if (error.message.includes('same_name')) { setNeedTag(true); toast({ text: t('sameNameExists') }) } else toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop(); onClose(); setF({ name: '', phone: '', tag: '', old: '' }); setNeedTag(false); navigate('/udhaar/' + data)
  }
  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="h2">{t('addPerson')}</h2>
      <div className="pgs stack" style={{ marginTop: 12 }}>
        <input className="input" placeholder={t('nameWord')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        {needTag && <input className="input" style={{ borderBottomColor: 'var(--ink)' }} placeholder={t('tagAsk')} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} />}
        <input className="input" inputMode="tel" placeholder={t('phoneOpt')} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^\d+]/g, '') })} />
        <input className="input" inputMode="decimal" placeholder={t('oldUdhaar')} value={f.old} onChange={(e) => setF({ ...f, old: e.target.value.replace(/[^\d.]/g, '') })} />
        <Tap className="btn primary" disabled={f.name.trim().length < 2 || (needTag && !f.tag.trim())} onClick={save}><Icon name="tick" size={22} stroke={3} />{t('ok')}</Tap>
      </div>
    </Sheet>
  )
}

// Public page the customer opens from the reminder: their balance and recent entries. No login.
const pub = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
type Pub = { store: string; area: string | null; phone: string | null; upi: string | null; updated: string | null; customer: string; balance: number; entries: { amount: number; kind: string; at: string; bill: string | null }[] }
const BT = {
  hi: { hi: 'नमस्ते', due: 'उधार बाकी', clear: 'सब चुकता', hisaab: 'हिसाब', took: 'सामान लिया', paid: 'पैसे जमा किए', none: 'हिसाब नहीं मिला', upi: 'UPI से दें', note: 'UPI ऐप खुलेगा — भेजने से पहले रकम दिखेगी, आप चाहें तो कम भी दे सकते हैं।', shop: 'या दुकान पर नकद दे सकते हैं', call: 'दुकान को कॉल करें', after: 'बाकी', upd: 'अपडेट', see: 'बिल देखें' },
  hinglish: { hi: 'Namaste', due: 'Udhaar baaki', clear: 'Sab chukta', hisaab: 'Hisaab', took: 'Saaman liya', paid: 'Paise jama kiye', none: 'Hisaab nahi mila', upi: 'UPI se dein', note: 'UPI app khulega — bhejne se pehle rakam dikhegi, chahein to kam bhi de sakte hain.', shop: 'Ya dukaan par cash de sakte hain', call: 'Dukaan ko call karein', after: 'Baaki', upd: 'Update', see: 'Bill dekhein' },
  en: { hi: 'Hello', due: 'Balance due', clear: 'All paid', hisaab: 'Account', took: 'Bought items', paid: 'Paid', none: 'Account not found', upi: 'Pay by UPI', note: 'Your UPI app opens — you see the amount before sending and can pay less if you want.', shop: 'Or pay cash at the shop', call: 'Call the shop', after: 'Balance', upd: 'Updated', see: 'See bill' },
}
export function BalancePage({ token }: { token: string }) {
  const [d, setD] = useState<Pub | null | undefined>(undefined)
  const [bl, setBl] = useState<'hi' | 'hinglish' | 'en'>(() => { try { return (localStorage.getItem('omni-bill-lang') as 'hi') || 'hi' } catch { return 'hi' } })
  const B = BT[bl] ?? BT.hi
  useEffect(() => { pub.rpc('public_balance', { p_token: token }).then(({ data }) => setD((data as Pub) ?? null)) }, [token])
  if (d === undefined) return <main className="bc-page kh"><div className="skel" style={{ width: '100%', maxWidth: 420, height: 300, borderRadius: 18 }} /></main>
  if (!d) return <main className="bc-page kh"><h1 className="kh-store">{B.none}</h1></main>
  const bal = Number(d.balance)
  const fmtD = (iso: string) => {
    const d = new Date(iso), h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0')
    const day = d.toLocaleDateString(bl === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })
    const part = bl === 'en' ? (h < 12 ? 'am' : 'pm') : h < 12 ? (bl === 'hi' ? 'सुबह' : 'subah') : h < 17 ? (bl === 'hi' ? 'दोपहर' : 'dopahar') : (bl === 'hi' ? 'शाम' : 'shaam')
    const hh = ((h + 11) % 12) + 1
    return bl === 'en' ? `${day} · ${hh}:${m} ${part}` : `${day} · ${part} ${hh}:${m}`
  }
  let run = bal
  const rows = d.entries.map((e) => { const r = { ...e, after: run }; run -= Number(e.amount); return r })
  return (
    <main className="bc-page kh">
      <div className="bc-langs">{(['hi', 'hinglish', 'en'] as const).map((l) => <button key={l} className={bl === l ? 'on' : ''} onClick={() => { setBl(l); try { localStorage.setItem('omni-bill-lang', l) } catch { /* ignore */ } }}>{l === 'hi' ? 'हिंदी' : l === 'en' ? 'English' : 'Hinglish'}</button>)}</div>
      <article className="kh-wrap">
        <header>
          <h1 className="kh-store">{d.store}</h1>
          {d.area && <div className="kh-area">{d.area}</div>}
        </header>
        <section className="kh-hero">
          <div className="kh-hi">{B.hi} {d.customer}</div>
          <div className="kh-bal">
            <span className={bal > 0 ? 'ud' : ''}>{bal > 0 ? B.due : B.clear}</span>
            <b className={bal > 0 ? 'ud' : ''}>{ru(Math.abs(bal))}</b>
          </div>
          {d.updated && <div className="kh-upd">{B.upd}: {fmtD(d.updated)}</div>}
        </section>
        <div className="kh-acts">
          {bal > 0 && d.upi && <a className="tap btn primary" href={`upi://pay?pa=${encodeURIComponent(d.upi)}&pn=${encodeURIComponent(d.store)}&am=${bal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Udhaar ' + d.customer)}`}>{B.upi} · {rupees(bal)}</a>}
          {d.phone && <a className="tap btn outline" href={'tel:' + d.phone}><Icon name="phone" size={22} />{B.call}</a>}
        </div>
        <section>
          <h2 className="kh-sec">{B.hisaab}</h2>
          {rows.map((e, i) => {
            const took = Number(e.amount) > 0
            const inner = <><div className="g"><b>{took ? B.took : B.paid}</b><small>{fmtD(e.at)}</small><small>{B.after} {rupees(e.after)}</small></div>
              <div className={`kh-amt ${took ? 'ud' : ''}`}>{took ? '+' : '−'} {rupees(Math.abs(Number(e.amount)))}{e.bill && <Icon name="chev" size={20} />}</div></>
            return e.bill ? <a key={i} className="kh-row tap" href={'/b/' + e.bill} aria-label={B.see}>{inner}</a> : <div key={i} className="kh-row">{inner}</div>
          })}
        </section>
        <div className="kh-brand">OmniOS Dukaan</div>
      </article>
    </main>
  )
}

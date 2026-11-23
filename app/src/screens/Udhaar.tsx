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
import { NumberSheet } from '../components/Pad'
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
    <main className="screen has-bar">
      <div className="top" />
      <h1 className="h1">{t('tabUdhaar')}</h1>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="lab">{t('udhaarOut')}</div>
        {list ? <div className="big" style={{ color: 'var(--ud)' }}>{rupees(total)}</div> : <div className="skel" style={{ height: 50, width: '50%' }} />}
        <div className="lab" style={{ marginTop: 4 }}>{owing.length} {t('peopleOwe')}</div>
      </div>
      <div className="gap16" />
      <Tap className="btn quiet" onClick={() => setAdding(true)}>+ {t('addPerson')}</Tap>
      <div className="gap16" />
      <input className="input" placeholder={t('searchName')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="gap16" />
      {!list ? <div className="stack"><div className="skel" style={{ height: 68 }} /><div className="skel" style={{ height: 68 }} /></div>
        : shown.length === 0 ? <div className="card center"><p className="lab">{q ? t('noMatch') : t('noUdhaar')}</p></div>
        : <div className="stack">{shown.map((c) => (
          <Tap key={c.id} className="rowb" onClick={() => navigate('/udhaar/' + c.id)}>
            <div className="av" style={{ width: 44, height: 44, fontSize: 20 }}>{c.name.charAt(0).toUpperCase()}</div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{custLabel(c)}</div>
              <div className="lab" style={{ fontSize: 17, fontWeight: 500, lineHeight: '20px' }}>{ago(c.last_at)}</div>
            </div>
            <div className="num" style={{ color: c.balance > 0 ? 'var(--ud)' : 'var(--ac)' }}>{rupees(Math.abs(c.balance))}</div>
            <div className="chev"><Icon name="chev" size={20} /></div>
          </Tap>
        ))}</div>}
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
  if (c === undefined) return <main className="screen has-bar"><BackBar fallback="/udhaar" /><div className="skel" style={{ height: 180 }} /></main>
  if (!c) return <main className="screen has-bar"><BackBar fallback="/udhaar" /><p>{t('noMatch')}</p></main>

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
    <main className="screen has-bar">
      <BackBar fallback="/udhaar" />
      <div className="who"><div className="av">{c.name.charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}><div className="h1">{c.name}</div>{c.tag && <div className="lab">{c.tag}</div>}
          <Tap className="ghost" style={{ marginLeft: -12, color: 'var(--ac)', fontWeight: 600 }} onClick={() => setPhoneOpen(true)}>{c.phone ? `📞 ${c.phone}` : `+ ${t('addPhone')}`}</Tap></div></div>
      <div className="card center" style={{ marginTop: 12 }}>
        <div className="lab">{c.balance >= 0 ? t('balanceNow') : t('advance')}</div>
        <div className="big" style={{ color: c.balance > 0 ? 'var(--ud)' : 'var(--ac)' }}>{rupees(Math.abs(c.balance))}</div>
      </div>
      <div className="gap16" />
      <Tap className="btn primary" onClick={() => setPay(true)}><Icon name="cash" size={24} />{t('collect')}</Tap>
      {c.balance > 0 && <a className="wa tap" href={wa} target="_blank" rel="noreferrer" style={{ color: '#137A3C', boxShadow: 'inset 0 0 0 2px #1FA855', textDecoration: 'none' }}><Icon name="wa" size={26} />{t('remind')}</a>}
      <h2 className="h2" style={{ marginTop: 28 }}>{t('history')}</h2>
      <div className="card" style={{ marginTop: 8, padding: '4px 18px' }}>
        {entries.length === 0 ? <p className="lab" style={{ padding: '14px 0' }}>{t('noUdhaar')}</p> : entries.map((e, i) => (
          <Tap key={e.id} className="linkrow" style={{ color: 'var(--ink)', fontWeight: 500, borderTop: i ? '1px solid var(--line)' : 'none', minHeight: 56 }}
            onClick={() => e.bill_id && navigate('/bill/' + e.bill_id)}>
            <span>{label[e.kind] ?? e.kind}<span className="lab" style={{ display: 'block', fontSize: 17, lineHeight: '20px' }}>{ago(e.created_at)}</span></span>
            <span className="num" style={{ color: Number(e.amount) > 0 ? 'var(--ud)' : 'var(--ac)' }}>{Number(e.amount) > 0 ? '+' : '−'} {rupees(Math.abs(Number(e.amount)))}</span>
          </Tap>
        ))}
      </div>
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
      <div className="stack" style={{ marginTop: 12 }}>
        <input className="input" placeholder={t('nameWord')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        {needTag && <input className="input" style={{ boxShadow: 'inset 0 0 0 2px var(--unsb)' }} placeholder={t('tagAsk')} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} />}
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
  hi: { hi: 'नमस्ते', due: 'उधार बाकी', clear: 'सब चुकता', hisaab: 'हिसाब', took: 'सामान लिया', paid: 'पैसे जमा किए', none: 'हिसाब नहीं मिला', upi: 'UPI से दें', note: 'UPI ऐप खुलेगा — भेजने से पहले रकम दिखेगी, आप चाहें तो कम भी दे सकते हैं।', shop: 'या दुकान पर नकद दे सकते हैं', call: 'दुकान को कॉल करें', after: 'उसके बाद बाकी', upd: 'अपडेट', see: 'बिल देखें' },
  hinglish: { hi: 'Namaste', due: 'Udhaar baaki', clear: 'Sab chukta', hisaab: 'Hisaab', took: 'Saaman liya', paid: 'Paise jama kiye', none: 'Hisaab nahi mila', upi: 'UPI se dein', note: 'UPI app khulega — bhejne se pehle rakam dikhegi, chahein to kam bhi de sakte hain.', shop: 'Ya dukaan par cash de sakte hain', call: 'Dukaan ko call karein', after: 'Uske baad baaki', upd: 'Update', see: 'Bill dekhein' },
  en: { hi: 'Hello', due: 'Balance due', clear: 'All paid', hisaab: 'Account', took: 'Bought items', paid: 'Paid', none: 'Account not found', upi: 'Pay by UPI', note: 'Your UPI app opens — you see the amount before sending and can pay less if you want.', shop: 'Or pay cash at the shop', call: 'Call the shop', after: 'Balance after', upd: 'Updated', see: 'See bill' },
}
export function BalancePage({ token }: { token: string }) {
  const [d, setD] = useState<Pub | null | undefined>(undefined)
  const [bl, setBl] = useState<'hi' | 'hinglish' | 'en'>(() => { try { return (localStorage.getItem('omni-bill-lang') as 'hi') || 'hi' } catch { return 'hi' } })
  const B = BT[bl] ?? BT.hi
  useEffect(() => { pub.rpc('public_balance', { p_token: token }).then(({ data }) => setD((data as Pub) ?? null)) }, [token])
  if (d === undefined) return <main className="bc-page"><div className="skel" style={{ width: '100%', maxWidth: 420, height: 300, borderRadius: 24 }} /></main>
  if (!d) return <main className="bc-page"><h1 className="h1">{B.none}</h1></main>
  const bal = Number(d.balance)
  const fmtD = (iso: string) => new Date(iso).toLocaleDateString(bl === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })
  let run = bal
  const rows = d.entries.map((e) => { const r = { ...e, after: run }; run -= Number(e.amount); return r })
  return (
    <main className="bc-page">
      <div className="bc-langs">{(['hi', 'hinglish', 'en'] as const).map((l) => <button key={l} className={bl === l ? 'on' : ''} onClick={() => { setBl(l); try { localStorage.setItem('omni-bill-lang', l) } catch { /* ignore */ } }}>{l === 'hi' ? 'हिंदी' : l === 'en' ? 'English' : 'Hinglish'}</button>)}</div>
      <article className="bc">
        <header className="bc-shop"><div className="bc-av">{d.store.charAt(0).toUpperCase()}</div><div><div className="bc-store">{d.store}</div>{d.area && <div className="bc-area">{d.area}</div>}</div></header>
        <section className="bc-hero">
          <div className="bc-meta" style={{ marginTop: 0 }}>{B.hi} {d.customer}</div>
          <div className="bc-total" style={{ color: bal > 0 ? 'var(--ud)' : 'var(--ac)', marginTop: 6 }}>{rupees(Math.abs(bal))}</div>
          <div className={`bc-status ${bal > 0 ? 'ud' : 'ok'}`}>{bal > 0 ? B.due : B.clear}</div>
          {d.updated && <div className="bc-meta">{B.upd}: {fmtD(d.updated)}</div>}
        </section>
        <div className="cx-pay">
          {bal > 0 && d.upi && <a className="tap btn primary" href={`upi://pay?pa=${encodeURIComponent(d.upi)}&pn=${encodeURIComponent(d.store)}&am=${bal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Udhaar ' + d.customer)}`}>{B.upi} · {rupees(bal)}</a>}
          {bal > 0 && d.upi && <p className="lab" style={{ fontSize: 17 }}>{B.note}</p>}
          {bal > 0 && <p className="lab center" style={{ fontSize: 18 }}>{B.shop}</p>}
          {d.phone && <a className="tap btn quiet" href={'tel:' + d.phone}><Icon name="phone" size={22} />{B.call}</a>}
        </div>
        <section className="bc-items">
          <div className="bc-ih">{B.hisaab}</div>
          {rows.map((e, i) => {
            const took = Number(e.amount) > 0
            const inner = <><div style={{ minWidth: 0 }}><div className="bc-name">{took ? B.took : B.paid}</div><div className="bc-sub">{fmtD(e.at)} · {B.after} {rupees(e.after)}</div></div>
              <div className="bc-amt" style={{ color: took ? 'var(--ud)' : 'var(--ac)', display: 'flex', alignItems: 'center', gap: 4 }}>{rupees(Math.abs(Number(e.amount)))}{e.bill && <Icon name="chev" size={20} />}</div></>
            return e.bill ? <a key={i} className="bc-row tap" href={'/b/' + e.bill} style={{ color: 'inherit', textDecoration: 'none' }} aria-label={B.see}>{inner}</a> : <div key={i} className="bc-row">{inner}</div>
          })}
        </section>
        <div className="bc-brand"><span className="bc-logo"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></span>OmniOS Dukaan</div>
      </article>
    </main>
  )
}

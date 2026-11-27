import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { custLabel, invalidateShop } from '../lib/shop'
import { errorFx, successFx } from '../lib/feedback'
import { LoadError, Sheet, Tap, toast, TopBar } from '../components/ui'
import { NumberSheet } from '../components/Pad'
import { Icon } from '../components/Icon'

type Cust = { id: string; name: string; tag: string | null; phone: string | null; share_token: string; balance: number; last_at: string | null }
type Entry = { id: number; amount: number; kind: string; created_at: string; bill_id: string | null }
const ago = (s: string | null) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''
const initials = (n: string) => n.trim().slice(0, 2).toUpperCase()
const RowSk = () => <div className="vc">{[0, 1, 2].map((k) => <div key={k} className="vrow"><i className="vsk" style={{ width: 44, height: 44, borderRadius: 22 }} /><span className="t"><i className="vsk" style={{ width: 140, height: 20 }} /><i className="vsk" style={{ width: 90, height: 18, marginTop: 6 }} /></span></div>)}</div>

// Udhaar tab: who owes how much, biggest first.
export function UdhaarList() {
  const { t } = useT()
  const [list, setList] = useState<Cust[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const load = () => {
    setFailed(false); setList(null)
    supabase.from('customer_balances').select('id,name,tag,phone,share_token,balance,last_at').order('balance', { ascending: false })
      .then(({ data, error }) => { if (error) setFailed(true); else setList(((data ?? []) as Cust[]).map((c) => ({ ...c, balance: Number(c.balance) }))) }, () => setFailed(true))
  }
  useEffect(load, [])
  const owing = (list ?? []).filter((c) => c.balance > 0)
  const total = owing.reduce((s, c) => s + c.balance, 0)
  const shown = (list ?? []).filter((c) => (q ? c.name.toLowerCase().includes(q.toLowerCase()) : c.balance !== 0))
  return (
    <main className="screen v2 has-bar">
      <TopBar title={t('tabUdhaar')} right={<Tap className="ib b" aria-label={t('addPerson')} onClick={() => setAdding(true)}><Icon name="plus" size={24} /></Tap>} />
      {failed ? <LoadError onRetry={load} /> : <>
        <div className="vc vblock">
          <div className="vlab">{t('udhaarOut')}</div>
          {list ? <div className="vbig ud">{rupees(total)}</div> : <i className="vsk" style={{ height: 48, width: '55%', marginTop: 8 }} />}
          {list && <div className="vlab">{owing.length} {t('peopleOwe')}</div>}
        </div>
        <input className="vin" style={{ marginTop: 12 }} placeholder={t('searchName')} value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ height: 12 }} />
        {!list ? <RowSk />
          : shown.length === 0 ? <div className="vempty"><h2>{q ? t('noMatch') : t('noUdhaar')}</h2></div>
          : <div className="vc">{shown.map((c) => (
            <Tap key={c.id} className="vrow" onClick={() => navigate('/udhaar/' + c.id)}>
              <span className="vav">{initials(c.name)}</span>
              <span className="t"><b>{custLabel(c)}</b>{ago(c.last_at) && <span>{ago(c.last_at)}</span>}</span>
              <span className={`a ${c.balance > 0 ? 'ud' : ''}`}>{rupees(Math.abs(c.balance))}</span>
            </Tap>))}</div>}
      </>}
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
  const [failed, setFailed] = useState(false)
  const [pay, setPay] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const load = () => {
    setFailed(false)
    supabase.from('customer_balances').select('id,name,tag,phone,share_token,balance,last_at').eq('id', id).maybeSingle()
      .then(({ data, error }) => { if (error) setFailed(true); else setC(data ? { ...(data as Cust), balance: Number((data as Cust).balance) } : null) }, () => setFailed(true))
    supabase.from('udhaar_entries').select('id,amount,kind,created_at,bill_id').eq('customer_id', id).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setEntries((data ?? []) as Entry[]))
  }
  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (failed) return <main className="screen v2 has-bar"><TopBar back="/udhaar" /><LoadError onRetry={() => { setC(undefined); load() }} /></main>
  if (c === undefined) return <main className="screen v2 has-bar"><TopBar back="/udhaar" /><div className="vstack"><i className="vsk" style={{ height: 150 }} /><RowSk /></div></main>
  if (!c) return <main className="screen v2 has-bar"><TopBar back="/udhaar" /><div className="vempty"><h2>{t('noMatch')}</h2></div></main>

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
    <main className="screen v2 has-foot">
      <TopBar back="/udhaar" title={c.name} />
      {c.tag && <p className="vlab" style={{ marginTop: -4 }}>{c.tag}</p>}
      <div className="vc vblock" style={{ marginTop: 12 }}>
        <div className="vlab">{c.balance >= 0 ? t('balanceNow') : t('advance')}</div>
        <div className={`vbig ${c.balance > 0 ? 'ud' : ''}`}>{rupees(Math.abs(c.balance))}</div>
      </div>
      <Tap className="vrow vc" style={{ marginTop: 12, minHeight: 64 }} onClick={() => setPhoneOpen(true)}>
        <Icon name={c.phone ? 'phone' : 'plus'} size={22} /><span className="t"><b>{c.phone ?? t('addPhone')}</b></span><Icon name="chev" size={22} />
      </Tap>
      <div className="vhead"><span className="vlab">{t('history')}</span></div>
      {entries.length === 0 ? <div className="vempty" style={{ paddingTop: 16 }}><p>{t('noUdhaar')}</p></div> : (
        <div className="vc">{entries.map((e) => {
          const given = Number(e.amount) > 0
          const inner = <><span className="t"><b>{label[e.kind] ?? e.kind}</b><span>{ago(e.created_at)}</span></span><span className={`a ${given ? 'ud' : ''}`}>{given ? '+' : '−'} {rupees(Math.abs(Number(e.amount)))}</span></>
          return e.bill_id ? <Tap key={e.id} className="vrow" onClick={() => navigate('/bill/' + e.bill_id)}>{inner}</Tap> : <div key={e.id} className="vrow">{inner}</div>
        })}</div>
      )}
      <div className="vfoot flat">
        <div className={c.balance > 0 ? 'vgrid2' : ''}>
          <Tap className="btn primary" onClick={() => setPay(true)}><Icon name="cash" size={24} />{t('collect')}</Tap>
          {c.balance > 0 && <a className="btn wa tap" style={{ textDecoration: 'none' }} href={wa} target="_blank" rel="noreferrer"><Icon name="wa" size={24} />WhatsApp</a>}
        </div>
      </div>
      <NumberSheet open={pay} title={`${c.name} — ${t('amount')}`} initial={null} unit="₹" onClose={() => setPay(false)} onDone={collect} />
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
      <h2 className="vfig">{t('addPerson')}</h2>
      <div className="vstack" style={{ marginTop: 16 }}>
        <input className="vin" placeholder={t('nameWord')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        {needTag && <input className="vin" placeholder={t('tagAsk')} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} />}
        <input className="vin" inputMode="tel" placeholder={t('phoneOpt')} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^\d+]/g, '') })} />
        <input className="vin" inputMode="decimal" placeholder={t('oldUdhaar')} value={f.old} onChange={(e) => setF({ ...f, old: e.target.value.replace(/[^\d.]/g, '') })} />
        <Tap className="btn primary" disabled={f.name.trim().length < 2 || (needTag && !f.tag.trim())} onClick={save}><Icon name="tick" size={22} stroke={3} />{t('ok')}</Tap>
      </div>
    </Sheet>
  )
}

import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { navigate } from '../lib/router'
import { HomeBtn, LoadError, Tap, toast, TopBar } from '../components/ui'
import { NumberSheet } from '../components/Pad'
import { itemName } from '../components/BillCard'
import { custLabel } from '../lib/shop'
import { invalidateShop } from '../lib/shop'
import { successFx, errorFx } from '../lib/feedback'
import { Icon } from '../components/Icon'

const waLink = (c: { phone: string | null; share_token: string; balance: number }, msg: string) => {
  const p = (c.phone ?? '').replace(/\D/g, '')
  const text = msg.replace('{x}', rupees(+c.balance)).replace('{link}', `${location.origin}/k/${c.share_token}`)
  return `https://wa.me/${p ? (p.length === 10 ? '91' + p : p) : ''}?text=${encodeURIComponent(text)}`
}

type CheckItem = { id: string; catalog_id: string | null; name: string; name_hi: string | null; unit: string; loose: boolean; stock: number }
type Brief = {
  yday: { sales: number; bills: number; udhaar_given: number; udhaar_collected: number }
  udhaar_total: number
  collect: { id: string; name: string; tag: string | null; phone: string | null; share_token: string; balance: number; days: number | null }[]
  streak: number; check_done: boolean; check: CheckItem[]
}
const useBrief = () => {
  const [b, setB] = useState<Brief | null>(null)
  const [failed, setFailed] = useState(false)
  const load = () => { setFailed(false); supabase.rpc('briefing').then(({ data, error }) => { if (error || !data) setFailed(true); else setB(data as Brief) }, () => setFailed(true)) }
  useEffect(load, [])
  return { b, failed, retry: () => { setB(null); load() } }
}

// Home card: yesterday in one line, who to collect from, streak, today's 3-item count. No restock advice
// until the forecast has enough data (owner decision 23 Nov).
export function BriefingCard() {
  const { t } = useT()
  const { b, failed, retry } = useBrief()
  if (failed) return <LoadError onRetry={retry} />
  if (!b) return <i className="vsk" style={{ height: 150, marginBottom: 16, borderRadius: 18 }} />
  return (
    <section className="vstack">
      <div className="vhead" style={{ margin: '0 4px' }}>
        <span className="vlab">{t('bfTitle')}</span>
        {b.streak >= 2 && <span className="vchip ok">{t('bfStreak').replace('{n}', String(b.streak))}<Icon name="tick" size={20} stroke={3} /></span>}
      </div>
      <Tap className="vrow vc" style={{ minHeight: 64 }} onClick={() => navigate('/hisaab?r=yday')}>
        <span className="t"><b>{b.yday.bills ? t('bfYdayLine').replace('{x}', rupees(+b.yday.sales)).replace('{n}', String(b.yday.bills)) : `${t('bfYday')}: ${t('bfNoBills')}`}</b></span><Icon name="chev" size={22} />
      </Tap>
      {b.check.length > 0 && (b.check_done
        ? <div className="vbanner"><Icon name="tick" size={24} stroke={3} /><b>{t('bfCheckDone')}</b></div>
        : <Tap className="btn primary" onClick={() => navigate('/check')}><Icon name="box" size={24} />{t('bfCheck')}</Tap>)}
      {b.collect.length > 0 && <>
        <span className="vlab" style={{ margin: '4px 4px 0' }}>{t('bfCollect')}</span>
        <div className="vc">{b.collect.map((c) => (
          <div key={c.id} className="vrow">
            <Tap className="t" style={{ textAlign: 'left' }} onClick={() => navigate('/udhaar/' + c.id)}>
              <b>{custLabel(c)}</b><span>{c.days != null && c.days >= 1 ? t('bfDays').replace('{n}', String(c.days)) : t('bfDue')}</span>
            </Tap>
            <span className="a ud">{rupees(+c.balance)}</span>
            <a className="btn wa s tap" style={{ textDecoration: 'none' }} href={waLink(c, t('waRemind'))} target="_blank" rel="noreferrer" aria-label={t('bfRemind')}><Icon name="wa" size={22} /></a>
          </div>
        ))}</div>
      </>}
    </section>
  )
}

// Daily 3-item count: owner counts, we correct stock and show any gap ("koi bill chhoota?").
export function StockCheck() {
  const { t, lang } = useT()
  const { b, failed, retry } = useBrief()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [pad, setPad] = useState<CheckItem | null>(null)
  const [result, setResult] = useState<{ item_id: string; was: number; counted: number }[] | null>(null)
  const [busy, setBusy] = useState(false)
  const unit = (i: CheckItem) => (i.unit === 'pack' || i.unit === 'pc' ? t('bfPcs') : i.unit)
  const nm = (i: CheckItem) => itemName({ ...i, qty: 0, price: 0, amount: 0 }, lang)
  async function save() {
    setBusy(true)
    const { data, error } = await supabase.rpc('stock_check', { p: { lines: b!.check.map((i) => ({ item_id: i.id, counted: counts[i.id] })) } })
    setBusy(false)
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    invalidateShop(); const r = (data as { item_id: string; was: number; counted: number }[]).map((x) => ({ ...x, was: +x.was, counted: +x.counted }))
    setResult(r); r.every((x) => x.was === x.counted) ? successFx() : errorFx()
  }
  return (
    <main className="screen v2 has-foot">
      <TopBar back="/" title={t('ckTitle')} />
      {failed ? <LoadError onRetry={retry} /> : !b ? <div className="vc">{[0, 1, 2].map((k) => <div key={k} className="vrow"><i className="vsk" style={{ width: 150, height: 22 }} /></div>)}</div>
        : !b.check.length ? <div className="vempty"><h2>{t('ckNone')}</h2></div> : (
        <div className="vc">
          {b.check.map((i) => {
            const r = result?.find((x) => x.item_id === i.id)
            const gap = r ? r.counted - r.was : 0
            return (
              <div key={i.id} className="vblock">
                <h2 style={{ font: '700 20px/28px var(--font)' }}>{nm(i)}</h2>
                {!r ? (
                  <Tap className={`btn ${counts[i.id] != null ? 'outline' : 'primary'} s`} style={{ marginTop: 12 }} onClick={() => setPad(i)}>
                    <Icon name="box" size={22} />{counts[i.id] != null ? `${t('ckCounted')}: ${counts[i.id]} ${unit(i)}` : t('ckCount')}
                  </Tap>
                ) : gap === 0 ? <span className="vchip ok" style={{ marginTop: 12 }}><Icon name="tick" size={20} stroke={3} />{t('ckMatch')} ({r.counted} {unit(i)})</span> : (
                  <div className="vnote" style={{ marginTop: 12, display: 'block' }}><b style={{ display: 'block' }}>{t('ckApp')} {r.was} · {t('ckShelf')} {r.counted} {unit(i)} — {Math.abs(gap)} {gap < 0 ? t('ckLess') : t('ckMore')}</b><span style={{ fontWeight: 500 }}>{t('ckFixed')}</span></div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {b && b.check.length > 0 && <div className="vfoot flat">
        {!result
          ? <Tap className="btn primary" disabled={busy || b.check.some((i) => counts[i.id] == null)} onClick={save}><Icon name="tick" size={24} stroke={3} />{busy ? t('loading') : t('ckSave')}</Tap>
          : <HomeBtn className="primary" />}
      </div>}
      <NumberSheet open={!!pad} title={pad ? `${nm(pad)} — ${t('ckAsk')}` : ''} initial={pad ? counts[pad.id] ?? null : null} decimals={!!pad?.loose} zero
        unit={pad ? unit(pad) : undefined} onClose={() => setPad(null)} onDone={(n) => { setCounts({ ...counts, [pad!.id]: n }); setPad(null) }} />
    </main>
  )
}

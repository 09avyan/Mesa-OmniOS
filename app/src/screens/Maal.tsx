import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { navigate } from '../lib/router'
import { invalidateShop, type ShopItem } from '../lib/shop'
import { CATALOG } from '../voice/catalog'
import { errorFx, successFx } from '../lib/feedback'
import { Sheet, Tap, toast } from '../components/ui'
import { NumberSheet } from '../components/Pad'
import { Icon } from '../components/Icon'

const CAT = new Map(CATALOG.map((c) => [c.id, c]))
const units: Record<string, string> = { kg: 'kg', g: 'g', l: 'L', ml: 'ml', pc: '', pack: 'pkt' }
const low = (i: ShopItem) => i.stock_known && i.stock <= (i.loose ? 1 : 3)
const fmt = (n: number) => +n.toFixed(3)

// Maal tab: every item the shop has, what is running low first.
export function Maal() {
  const { t, lang } = useT()
  const [items, setItems] = useState<ShopItem[] | null>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<ShopItem | null>(null)
  const [priceOpen, setPriceOpen] = useState(false)
  const [countOpen, setCountOpen] = useState(false)
  const load = () => supabase.from('items').select('id,catalog_id,name,name_hi,unit,loose,price,learned_price,stock,stock_known,hidden_online').order('name')
    .then(({ data }) => setItems(((data ?? []) as ShopItem[]).map((i) => ({ ...i, stock: Number(i.stock), price: i.price == null ? null : Number(i.price), learned_price: i.learned_price == null ? null : Number(i.learned_price) }))))
  useEffect(() => { load() }, [])
  const nameOf = (i: ShopItem) => { const c = i.catalog_id ? CAT.get(i.catalog_id) : undefined; return lang === 'hi' ? c?.hi ?? i.name_hi ?? i.name : lang === 'en' ? c?.en ?? i.name : i.name }
  const shown = (items ?? []).filter((i) => !q || nameOf(i).toLowerCase().includes(q.toLowerCase()) || i.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(low(b)) - Number(low(a)))
  const lowCount = (items ?? []).filter(low).length

  async function update(patch: Partial<ShopItem>) {
    if (!open) return
    const { error } = await supabase.from('items').update(patch).eq('id', open.id)
    if (error) { errorFx(); toast({ text: t('saveFailed') }); return }
    successFx(); invalidateShop(); setOpen({ ...open, ...patch }); load()
  }
  const price = (i: ShopItem) => i.price ?? i.learned_price
  return (
    <main className="screen has-bar">
      <div className="top" />
      <h1 className="h1">{t('tabMaal')}</h1>
      <div className="gap16" />
      <Tap className="btn primary" onClick={() => navigate('/bolo?stock=1')}><Icon name="mic" size={26} />{t('stockByVoice')}</Tap>
      <div className="gap8" />
      <Tap className="btn quiet" onClick={() => navigate('/receipt')}><Icon name="camera" size={24} />{t('stockByPhoto')}</Tap>
      <div className="gap8" />
      <Tap className="btn quiet" onClick={() => navigate('/bolo?manual=stock')}><Icon name="box" size={24} />{t('stockByPick')}</Tap>
      <div className="gap24" />
      {items && items.length > 0 && <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 className="h2">{items.length} {t('itemsWord')}</h2>
          {lowCount > 0 && <span className="pill" style={{ background: 'var(--udsoft)', color: 'var(--ud)' }}>{lowCount} {t('lowStock')}</span>}
        </div>
        <div className="gap8" />
        <input className="input" placeholder={t('searchItem')} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="gap16" />
      </>}
      {!items ? <div className="stack"><div className="skel" style={{ height: 68 }} /><div className="skel" style={{ height: 68 }} /></div>
        : items.length === 0 ? <div className="card center"><p className="lab">{t('noItems')}</p></div>
        : <div className="stack">{shown.map((i) => (
          <Tap key={i.id} className="rowb" onClick={() => setOpen(i)}>
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameOf(i)}</div>
              <div className="lab" style={{ fontSize: 16, fontWeight: 500, lineHeight: '20px' }}>{price(i) != null ? `₹${fmt(price(i)!)}${units[i.unit] ? '/' + units[i.unit] : ''}` : t('noPrice')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ color: low(i) ? 'var(--ud)' : 'var(--ink)' }}>{i.stock_known ? `${fmt(Math.max(0, i.stock))} ${units[i.unit]}` : '—'}</div>
              {low(i) ? <span className="pill" style={{ background: 'var(--udsoft)', color: 'var(--ud)' }}>{t('lowOne')}</span>
                : !i.stock_known && <span className="lab" style={{ fontSize: 15 }}>{t('stockNotKnown')}</span>}
            </div>
          </Tap>
        ))}</div>}

      <Sheet open={!!open && !priceOpen && !countOpen} onClose={() => setOpen(null)}>
        {open && <>
          <h2 className="h2">{nameOf(open)}</h2>
          <div className="card" style={{ marginTop: 12 }}>
            <Tap className="linkrow" style={{ color: 'var(--ink)', fontWeight: 500 }} onClick={() => setCountOpen(true)}><span className="lab">{t('inStock')}</span><span className="num">{open.stock_known ? `${fmt(Math.max(0, open.stock))} ${units[open.unit]}` : t('stockNotKnown')} ›</span></Tap>
            <Tap className="linkrow" style={{ color: 'var(--ink)', fontWeight: 500 }} onClick={() => setPriceOpen(true)}>
              <span className="lab">{t('sellPrice')}</span><span className="num">{price(open) != null ? rupees(price(open)!) : t('priceAsk')} ›</span>
            </Tap>
            {open.price == null && open.learned_price != null && <p className="lab" style={{ fontSize: 16 }}>{t('learnedNote')}</p>}
          </div>
          <div className="gap16" />
          <Tap className="rowb" onClick={() => update({ hidden_online: !open.hidden_online })}>
            <span className="grow">{t('showOnline')}</span><span style={{ color: open.hidden_online ? 'var(--ink2)' : 'var(--ac)' }}>{open.hidden_online ? t('off') : t('on')}</span>
          </Tap>
          <div className="gap16" />
          <Tap className="btn primary" onClick={() => setOpen(null)}>{t('ok')}</Tap>
        </>}
      </Sheet>
      <NumberSheet open={countOpen} title={`${open ? nameOf(open) : ''} — ${t('howManyNow')}`} initial={open?.stock_known ? Math.max(0, open.stock) : null} unit={open ? units[open.unit] : ''}
        onClose={() => setCountOpen(false)} onDone={async (n) => { if (!open) return; const { error } = await supabase.rpc('set_stock', { p_item: open.id, p_qty: n }); if (error) { errorFx(); toast({ text: t('saveFailed') }); return } successFx(); invalidateShop(); setOpen({ ...open, stock: n, stock_known: true }); load() }} />
      <NumberSheet open={priceOpen} title={`${open ? nameOf(open) : ''} — ${t('sellPrice')}`} initial={open ? price(open) : null} unit="₹"
        onClose={() => setPriceOpen(false)} onDone={(n) => update({ price: n })} />
    </main>
  )
}

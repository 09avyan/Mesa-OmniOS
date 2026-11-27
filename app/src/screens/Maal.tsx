import { useEffect, useState } from 'react'
import { useT, rupees } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { navigate } from '../lib/router'
import { invalidateShop, type ShopItem } from '../lib/shop'
import { CATALOG } from '../voice/catalog'
import { errorFx, successFx } from '../lib/feedback'
import { LoadError, Sheet, Tap, toast, TopBar } from '../components/ui'
import { NumberSheet } from '../components/Pad'
import { Icon } from '../components/Icon'
import { ForecastCard } from './Forecast'

const CAT = new Map(CATALOG.map((c) => [c.id, c]))
const units: Record<string, string> = { kg: 'kg', g: 'g', l: 'L', ml: 'ml', pc: '', pack: 'pkt' }
const low = (i: ShopItem) => i.stock_known && i.stock <= (i.loose ? 1 : 3)
const fmt = (n: number) => +n.toFixed(3)

// Maal tab: every item the shop has, what is running low first.
export function Maal() {
  const { t, lang } = useT()
  const [items, setItems] = useState<ShopItem[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<ShopItem | null>(null)
  const [priceOpen, setPriceOpen] = useState(false)
  const [countOpen, setCountOpen] = useState(false)
  const load = () => supabase.from('items').select('id,catalog_id,name,name_hi,unit,loose,price,learned_price,stock,stock_known,hidden_online').order('name')
    .then(({ data, error }) => { if (error) { setFailed(true); return } setFailed(false); setItems(((data ?? []) as ShopItem[]).map((i) => ({ ...i, stock: Number(i.stock), price: i.price == null ? null : Number(i.price), learned_price: i.learned_price == null ? null : Number(i.learned_price) }))) }, () => setFailed(true))
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
    <main className="screen v2 has-bar">
      <TopBar title={t('tabMaal')} />
      <div className="vstack">
        <Tap className="btn vo" onClick={() => navigate('/bolo?stock=1')}><Icon name="mic" size={26} />{t('stockByVoice')}</Tap>
        <div className="vgrid2">
          <Tap className="btn outline s" onClick={() => navigate('/receipt')}><Icon name="camera" size={22} />{t('stockByPhoto')}</Tap>
          <Tap className="btn outline s" onClick={() => navigate('/bolo?manual=stock')}><Icon name="box" size={22} />{t('stockByPick')}</Tap>
        </div>
      </div>
      <ForecastCard />
      {failed ? <LoadError onRetry={() => { setItems(null); load() }} />
        : !items ? <div className="vc" style={{ marginTop: 16 }}>{[0, 1, 2].map((k) => <div key={k} className="vrow"><span className="t"><i className="vsk" style={{ width: 150, height: 20 }} /><i className="vsk" style={{ width: 80, height: 18, marginTop: 6 }} /></span></div>)}</div>
        : items.length === 0 ? <div className="vempty"><h2>{t('noItems')}</h2></div>
        : <>
          <div className="vhead">
            <span className="vlab">{items.length} {t('itemsWord')}</span>
            {lowCount > 0 && <span className="vchip ud">{lowCount} {t('lowStock')}</span>}
          </div>
          <input className="vin" placeholder={t('searchItem')} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="vc" style={{ marginTop: 12 }}>{shown.map((i) => (
            <Tap key={i.id} className="vrow" onClick={() => setOpen(i)}>
              <span className="t"><b>{nameOf(i)}</b><span>{price(i) != null ? `₹${fmt(price(i)!)}${units[i.unit] ? '/' + units[i.unit] : ''}` : t('noPrice')}</span></span>
              <span className={`a ${low(i) ? 'ud' : ''}`}>{i.stock_known ? `${fmt(Math.max(0, i.stock))} ${units[i.unit]}` : '—'}</span>
            </Tap>))}</div>
        </>}

      <Sheet open={!!open && !priceOpen && !countOpen} onClose={() => setOpen(null)}>
        {open && <>
          <h2 className="vfig">{nameOf(open)}</h2>
          <div className="vc vset" style={{ marginTop: 16 }}>
            <Tap className="vrow" onClick={() => setCountOpen(true)}><span className="t"><b>{t('inStock')}</b></span><span className="val">{open.stock_known ? `${fmt(Math.max(0, open.stock))} ${units[open.unit]}` : t('stockNotKnown')}</span><Icon name="chev" size={22} /></Tap>
            <Tap className="vrow" onClick={() => setPriceOpen(true)}><span className="t"><b>{t('sellPrice')}</b></span><span className="val">{price(open) != null ? rupees(price(open)!) : t('priceAsk')}</span><Icon name="chev" size={22} /></Tap>
            <Tap className="vrow" role="switch" aria-checked={!open.hidden_online} onClick={() => update({ hidden_online: !open.hidden_online })}><span className="t"><b>{t('showOnline')}</b></span><span className="val">{open.hidden_online ? t('off') : t('on')}</span></Tap>
          </div>
          {open.price == null && open.learned_price != null && <p className="vlab" style={{ marginTop: 12 }}>{t('learnedNote')}</p>}
          <Tap className="btn primary" style={{ marginTop: 16 }} onClick={() => setOpen(null)}><Icon name="tick" size={22} stroke={3} />{t('ok')}</Tap>
        </>}
      </Sheet>
      <NumberSheet open={countOpen} title={`${open ? nameOf(open) : ''} — ${t('howManyNow')}`} initial={open?.stock_known ? Math.max(0, open.stock) : null} unit={open ? units[open.unit] : ''}
        onClose={() => setCountOpen(false)} onDone={async (n) => { if (!open) return; const { error } = await supabase.rpc('set_stock', { p_item: open.id, p_qty: n }); if (error) { errorFx(); toast({ text: t('saveFailed') }); return } successFx(); invalidateShop(); setOpen({ ...open, stock: n, stock_known: true }); load() }} />
      <NumberSheet open={priceOpen} title={`${open ? nameOf(open) : ''} — ${t('sellPrice')}`} initial={open ? price(open) : null} unit="₹"
        onClose={() => setPriceOpen(false)} onDone={(n) => update({ price: n })} />
    </main>
  )
}

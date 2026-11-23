import { Icon } from './Icon'
import { useState } from 'react'
import { Sheet, Tap } from './ui'
import { useT } from '../lib/i18n'

// Big number keypad in a sheet, for quantity / price / amount. Same keys as the PIN pad.
export function NumberSheet({ open, title, initial, unit, decimals = true, zero = false, onClose, onDone }: {
  open: boolean; title: string; initial: number | null; unit?: string; decimals?: boolean; zero?: boolean; onClose: () => void; onDone: (n: number) => void
}) {
  const { t } = useT()
  const [v, setV] = useState('')
  const [seeded, setSeeded] = useState(false)
  if (open && !seeded) { setV(initial != null ? String(initial) : ''); setSeeded(true) }
  if (!open && seeded) setSeeded(false)
  const press = (k: string) => {
    if (k === '⌫') return setV(v.slice(0, -1))
    if (k === '.' && (v.includes('.') || !decimals)) return
    if (v.length >= 8) return
    setV(v === '0' && k !== '.' ? k : v + k)
  }
  const n = parseFloat(v)
  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="h2">{title}</h2>
      <div className="big center" style={{ margin: '12px 0 16px', minHeight: 50 }}>{v || '0'}{unit ? <span className="lab" style={{ fontSize: 22, marginLeft: 8 }}>{unit}</span> : null}</div>
      <div className="pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', decimals ? '.' : '', '0', '⌫'].map((k, i) =>
          k ? <Tap key={i} className={`key ${k === '⌫' || k === '.' ? 'word' : ''}`} onClick={() => press(k)} aria-label={k === '⌫' ? 'delete' : k}>{k}</Tap> : <div key={i} />)}
      </div>
      <div className="gap16" />
      <Tap className="btn primary" disabled={!(n > 0 || (zero && n === 0))} onClick={() => { onDone(n); onClose() }}><Icon name="tick" size={22} stroke={3} />{t('ok')}</Tap>
    </Sheet>
  )
}

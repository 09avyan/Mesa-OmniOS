import { useParams } from 'react-router-dom'
import { Check, Clock, ShieldCheck } from 'lucide-react'
import { Screen } from '../components/Screen'
import { useLang } from '../lib/i18n'
import { SOON } from './soonContent'

export default function ComingSoon({ id }: { id?: string }) {
  const p = useParams()
  const c = SOON[id ?? p.id ?? '']
  const { t, lang } = useLang()
  const i = lang === 'hi' ? 0 : 1
  if (!c) return <Screen title="OmniOS"><p>—</p></Screen>
  const Icon = c.icon
  return (
    <Screen title={c.title[i]}>
      <section className="soon">
        <span className="glyph"><Icon size={32} strokeWidth={1.9} /></span>
        <h2>{c.title[i]}</h2>
        <span className="status"><Clock size={16} />{t('soon')}</span>
        <p className="big" style={{ margin: 0 }}>{c.body[i]}</p>
        {c.points && <ul className="points">{c.points.map(pt => <li key={pt[1]}><Check size={20} />{pt[i]}</li>)}</ul>}
        {c.control && <p className="okmsg" style={{ margin: 0 }}><ShieldCheck size={22} />{t('you_control')}</p>}
      </section>
    </Screen>
  )
}

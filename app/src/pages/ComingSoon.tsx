import { useParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { useLang } from '../lib/i18n'
import { SOON } from './soonContent'

export default function ComingSoon({ id }: { id?: string }) {
  const p = useParams()
  const c = SOON[id ?? p.id ?? '']
  const { t, lang } = useLang()
  const i = lang === 'hi' ? 0 : 1
  if (!c) return <Screen title="OmniOS"><p>—</p></Screen>
  return (
    <Screen title={c.title[i]}>
      <section className="card soon">
        <span className="ic" aria-hidden>{c.icon}</span>
        <span className="tag">⏳ {t('soon')}</span>
        <p className="big" style={{ margin: 0 }}>{c.body[i]}</p>
        {c.points && <ul style={{ textAlign: 'left', margin: 0, paddingLeft: 22, display: 'grid', gap: 8 }}>{c.points.map(pt => <li key={pt[1]}>{pt[i]}</li>)}</ul>}
        {c.control && <p className="okmsg" style={{ margin: 0 }}>✋ {t('you_control')}</p>}
      </section>
    </Screen>
  )
}

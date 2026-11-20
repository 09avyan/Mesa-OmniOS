import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { useLang } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { SOON } from './soonContent'
import { tap } from '../lib/feedback'

export default function More() {
  const { t, lang } = useLang()
  const nav = useNavigate()
  const i = lang === 'hi' ? 0 : 1
  const go = (to: string) => () => { tap(); nav(to) }
  return (
    <Screen title={t('more')}>
      <h2 style={{ fontSize: 22 }}>🤖 {t('agents')}</h2>
      <div className="list">
        {['agent-udhaar', 'agent-orders', 'agent-promo'].map(id =>
          <button key={id} className="btn full" style={{ justifyContent: 'flex-start' }} onClick={go('/soon/' + id)}><span className="ic">{SOON[id].icon}</span>{SOON[id].title[i]}</button>)}
      </div>
      <div className="list">
        <button className="btn full" style={{ justifyContent: 'flex-start' }} onClick={go('/soon/phase3')}><span className="ic">🗺️</span>{t('phase3')}</button>
        <button className="btn full" style={{ justifyContent: 'flex-start' }} onClick={go('/terms')}><span className="ic">📄</span>{t('terms')}</button>
        <button className="btn bad full" onClick={async () => { tap(); await supabase.auth.signOut() }}><span className="ic">🚪</span>{t('logout')}</button>
      </div>
    </Screen>
  )
}

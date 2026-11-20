import { useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, LogOut, MapPinned } from 'lucide-react'
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
    <Screen title={t('other')}>
      <h2 className="group-label">{t('agents')}</h2>
      <div className="list">
        {['agent-udhaar', 'agent-orders', 'agent-promo'].map(id => {
          const Icon = SOON[id].icon
          return <button key={id} className="list-row" onClick={go('/soon/' + id)}><Icon size={24} />{SOON[id].title[i]}<ChevronRight className="chev" /></button>
        })}
      </div>
      <h2 className="group-label">{t('app_menu')}</h2>
      <div className="list">
        <button className="list-row" onClick={go('/soon/phase3')}><MapPinned size={24} />{t('phase3')}<ChevronRight className="chev" /></button>
        <button className="list-row" onClick={go('/terms')}><FileText size={24} />{t('terms')}<ChevronRight className="chev" /></button>
      </div>
      <button className="btn danger full" onClick={async () => { tap(); await supabase.auth.signOut() }}><LogOut size={22} />{t('logout')}</button>
    </Screen>
  )
}

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
    <Screen title={t('more')}>
      <h2 className="section-title">{t('agents')}</h2>
      <div className="list">
        {['agent-udhaar', 'agent-orders', 'agent-promo'].map(id => {
          const Icon = SOON[id].icon
          return <button key={id} className="btn row-btn" onClick={go('/soon/' + id)}><span className="iconbox"><Icon size={22} /></span>{SOON[id].title[i]}<ChevronRight className="chev" /></button>
        })}
      </div>
      <h2 className="section-title">OmniOS</h2>
      <div className="list">
        <button className="btn row-btn" onClick={go('/soon/phase3')}><span className="iconbox"><MapPinned size={22} /></span>{t('phase3')}<ChevronRight className="chev" /></button>
        <button className="btn row-btn" onClick={go('/terms')}><span className="iconbox"><FileText size={22} /></span>{t('terms')}<ChevronRight className="chev" /></button>
        <button className="btn bad full" onClick={async () => { tap(); await supabase.auth.signOut() }}><LogOut size={22} />{t('logout')}</button>
      </div>
    </Screen>
  )
}

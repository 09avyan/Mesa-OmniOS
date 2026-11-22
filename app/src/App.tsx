import { useState } from 'react'
import { I18nProvider, savedLang, useT } from './lib/i18n'
import { StoreProvider, useStore } from './lib/store'
import { navigate, usePath } from './lib/router'
import { BottomBar, Tap, ToastHost } from './components/ui'
import { Language } from './screens/Language'
import { Login } from './screens/Login'
import { Home } from './screens/Home'
import { Settings } from './screens/Settings'
import { Building } from './screens/Building'
import { Admin } from './screens/Admin'
import { Voice } from './screens/Voice'
import { Bills, BillDetail } from './screens/Bills'
import { BillPage } from './screens/BillPage'
import { supabase } from './lib/supabase'

export default function App() {
  const path = usePath()
  if (path.startsWith('/admin')) return <><Admin /><ToastHost /></>
  if (path.startsWith('/b/')) return <BillPage token={path.slice(3)} />
  return <I18nProvider><StoreProvider><Owner path={path} /><ToastHost /></StoreProvider></I18nProvider>
}

function Owner({ path }: { path: string }) {
  const { t } = useT()
  const { session, store, ready, storeMissing } = useStore()
  const [langChosen, setLangChosen] = useState(!!savedLang())

  if (!langChosen) return <Language onDone={() => setLangChosen(true)} />
  if (!ready) return <main className="screen"><div style={{ height: 80 }} /><div className="skel" style={{ width: '60%' }} /><div className="gap16" /><div className="skel" style={{ height: 160 }} /></main>
  if (!session) return <Login />
  if (storeMissing || !store) return (
    <main className="screen"><div style={{ height: 60 }} /><div className="err">{t('pausedStore')}</div><div className="gap24" />
      <Tap className="btn quiet" onClick={() => supabase.auth.signOut()}>{t('logout')}</Tap></main>
  )

  if (path === '/bolo') return <Voice key={location.search} />
  const tab = path === '/' ? 'home' : path.startsWith('/bill') ? 'bill' : path.startsWith('/maal') ? 'maal' : path.startsWith('/udhaar') ? 'udhaar' : undefined
  let screen
  switch (path) {
    case '/': screen = <Home />; break
    case '/settings': screen = <Settings />; break
    case '/bill': screen = <Bills />; break
    case '/maal': screen = <Building title={t('tabMaal')} tabRoot />; break
    case '/udhaar': screen = <Building title={t('tabUdhaar')} tabRoot />; break
    case '/hisaab': screen = <Building title={t('fullHisaab')} />; break
    case '/galla': screen = <Building title={t('rowGalla')} />; break
    case '/orders': screen = <Building title={t('rowOrders')} />; break
    case '/bags': screen = <Building title={t('rowBags')} />; break
    case '/terms': screen = <Building title={t('terms')} />; break
    default:
      if (path.startsWith('/bill/')) { screen = <BillDetail id={path.slice(6)} />; break }
      navigate('/', true); return null
  }
  return (
    <div className="app" key={path}>
      {screen}
      <BottomBar active={tab} onMic={() => navigate('/bolo')} />
    </div>
  )
}

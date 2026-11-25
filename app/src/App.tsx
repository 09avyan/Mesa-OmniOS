import { lazy, Suspense, useState } from 'react'
import { I18nProvider, savedLang, useT } from './lib/i18n'
import { StoreProvider, useStore } from './lib/store'
import { navigate, usePath } from './lib/router'
import { AskHost, BottomBar, Tap, ToastHost } from './components/ui'
import { Language } from './screens/Language'
import { Login } from './screens/Login'
import { Home } from './screens/Home'
import { Settings } from './screens/Settings'
const Admin = lazy(() => import('./screens/Admin').then((m) => ({ default: m.Admin })))
import { Voice } from './screens/Voice'
import { Bills, BillDetail } from './screens/Bills'
import { UdhaarList, UdhaarCustomer, BalancePage } from './screens/Udhaar'
import { Maal } from './screens/Maal'
const StorePage = lazy(() => import('./screens/Store').then((m) => ({ default: m.StorePage })))
const OrderPage = lazy(() => import('./screens/Store').then((m) => ({ default: m.OrderPage })))
import { Orders, OrderDetail, MyStore } from './screens/Orders'
const BillPage = lazy(() => import('./screens/BillPage').then((m) => ({ default: m.BillPage })))
import { Hisaab, Galla } from './screens/Hisaab'
import { Bags, Terms, Soon } from './screens/Extras'
import { Receipt, Suppliers } from './screens/Receipt'
import { StockCheck } from './screens/Briefing'
import { supabase } from './lib/supabase'

export default function App() {
  const path = usePath()
  const wait = <main className="screen" />
  if (path.startsWith('/admin')) return <Suspense fallback={wait}><Admin /><ToastHost /></Suspense>
  if (path.startsWith('/b/')) return <Suspense fallback={wait}><BillPage token={path.slice(3)} /></Suspense>
  if (path.startsWith('/k/')) return <BalancePage token={path.slice(3)} />
  if (path.startsWith('/s/')) return <Suspense fallback={wait}><StorePage slug={path.slice(3)} /></Suspense>
  if (path.startsWith('/o/')) return <Suspense fallback={wait}><OrderPage token={path.slice(3)} /></Suspense>
  return <I18nProvider><StoreProvider><Owner path={path} /><ToastHost /><AskHost /></StoreProvider></I18nProvider>
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
  if (path === '/receipt') return <Receipt />
  const tab = path === '/' ? 'home' : path.startsWith('/bill') ? 'bill' : path.startsWith('/maal') ? 'maal' : path.startsWith('/udhaar') ? 'udhaar' : undefined
  let screen
  switch (path) {
    case '/': screen = <Home />; break
    case '/settings': screen = <Settings />; break
    case '/bill': screen = <Bills />; break
    case '/maal': screen = <Maal />; break
    case '/udhaar': screen = <UdhaarList />; break
    case '/hisaab': screen = <Hisaab />; break
    case '/galla': screen = <Galla />; break
    case '/orders': screen = <Orders />; break
    case '/dukaan': screen = <MyStore />; break
    case '/bags': screen = <Bags />; break
    case '/soon': screen = <Soon />; break
    case '/suppliers': screen = <Suppliers />; break
    case '/check': screen = <StockCheck />; break
    case '/terms': screen = <Terms />; break
    default:
      if (path.startsWith('/bill/')) { screen = <BillDetail id={path.slice(6)} />; break }
      if (path.startsWith('/orders/')) { screen = <OrderDetail id={path.slice(8)} />; break }
      if (path.startsWith('/udhaar/')) { screen = <UdhaarCustomer id={path.slice(8)} />; break }
      navigate('/', true); return null
  }
  return (
    <div className="app" key={path}>
      {screen}
      <BottomBar active={tab} onMic={() => navigate('/bolo')} />
    </div>
  )
}

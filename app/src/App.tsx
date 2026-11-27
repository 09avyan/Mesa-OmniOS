import { lazy, Suspense, useEffect, useState } from 'react'
import { I18nProvider, savedLang, useT } from './lib/i18n'
import { StoreProvider, useStore } from './lib/store'
import { navigate, usePath } from './lib/router'
import { AskHost, BottomBar, Tap, ToastHost } from './components/ui'
import { Language } from './screens/Language'
import { Login } from './screens/Login'
import { Home } from './screens/Home'
import { Settings } from './screens/Settings'
const Admin = lazy(() => import('./screens/Admin').then((m) => ({ default: m.Admin })))
import { BalancePage } from './screens/Balance'
const StorePage = lazy(() => import('./screens/Store').then((m) => ({ default: m.StorePage })))
const OrderPage = lazy(() => import('./screens/Store').then((m) => ({ default: m.OrderPage })))
const BillPage = lazy(() => import('./screens/BillPage').then((m) => ({ default: m.BillPage })))
import { supabase } from './lib/supabase'

const Voice = lazy(() => import('./screens/Voice').then((m) => ({ default: m.Voice })))
const Bills = lazy(() => import('./screens/Bills').then((m) => ({ default: m.Bills })))
const BillDetail = lazy(() => import('./screens/Bills').then((m) => ({ default: m.BillDetail })))
const UdhaarList = lazy(() => import('./screens/Udhaar').then((m) => ({ default: m.UdhaarList })))
const UdhaarCustomer = lazy(() => import('./screens/Udhaar').then((m) => ({ default: m.UdhaarCustomer })))
const Maal = lazy(() => import('./screens/Maal').then((m) => ({ default: m.Maal })))
const Orders = lazy(() => import('./screens/Orders').then((m) => ({ default: m.Orders })))
const OrderDetail = lazy(() => import('./screens/Orders').then((m) => ({ default: m.OrderDetail })))
const MyStore = lazy(() => import('./screens/Orders').then((m) => ({ default: m.MyStore })))
const Hisaab = lazy(() => import('./screens/Hisaab').then((m) => ({ default: m.Hisaab })))
const Galla = lazy(() => import('./screens/Hisaab').then((m) => ({ default: m.Galla })))
const Bags = lazy(() => import('./screens/Extras').then((m) => ({ default: m.Bags })))
const Terms = lazy(() => import('./screens/Extras').then((m) => ({ default: m.Terms })))
const Soon = lazy(() => import('./screens/Extras').then((m) => ({ default: m.Soon })))
const Poochho = lazy(() => import('./screens/Poochho').then((m) => ({ default: m.Poochho })))
const Receipt = lazy(() => import('./screens/Receipt').then((m) => ({ default: m.Receipt })))
const Suppliers = lazy(() => import('./screens/Receipt').then((m) => ({ default: m.Suppliers })))
const AllReceipts = lazy(() => import('./screens/Receipt').then((m) => ({ default: m.AllReceipts })))
const StockCheck = lazy(() => import('./screens/Briefing').then((m) => ({ default: m.StockCheck })))

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
  const wait = <main className="screen v2" />
  const { t } = useT()
  const { session, store, ready, storeMissing } = useStore()
  const [langChosen, setLangChosen] = useState(!!savedLang())
  // warm the billing screen while the owner looks at Home, so the Bolo tap opens instantly
  useEffect(() => { if (session) { const f = () => { import('./screens/Voice') }; const id = setTimeout(f, 1500); return () => clearTimeout(id) } }, [!!session])

  if (!langChosen) return <Language onDone={() => setLangChosen(true)} />
  if (!ready) return <main className="screen"><div style={{ height: 80 }} /><div className="skel" style={{ width: '60%' }} /><div className="gap16" /><div className="skel" style={{ height: 160 }} /></main>
  if (!session) return <Login />
  if (storeMissing || !store) return (
    <main className="screen"><div style={{ height: 60 }} /><div className="err">{t('pausedStore')}</div><div className="gap24" />
      <Tap className="btn quiet" onClick={() => supabase.auth.signOut()}>{t('logout')}</Tap></main>
  )

  if (path === '/bolo') return <Suspense fallback={wait}><Voice key={location.search} /></Suspense>
  if (path === '/receipt') return <Suspense fallback={wait}><Receipt /></Suspense>
  if (path === '/poochho') return <Suspense fallback={wait}><Poochho /></Suspense>
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
    case '/receipts': screen = <AllReceipts />; break
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
      <Suspense fallback={<main className="screen v2" />}>{screen}</Suspense>
      <BottomBar active={tab} onMic={() => navigate('/bolo')} />
    </div>
  )
}

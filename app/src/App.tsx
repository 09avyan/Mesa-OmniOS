import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { LangProvider } from './lib/i18n'
import Login from './pages/Login'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
import More from './pages/More'
import Terms from './pages/Terms'
import Admin from './pages/Admin'

function StoreApp() {
  const [store, setStore] = useState<{ name: string } | null | undefined>(undefined)
  useEffect(() => {
    const check = async () => {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session || !s.session.user.email?.endsWith('@store.omnios.app')) return setStore(null)
      const { data } = await supabase.from('stores').select('name').eq('user_id', s.session.user.id).eq('status', 'active').maybeSingle()
      setStore(data ?? null)
    }
    check()
    const { data: sub } = supabase.auth.onAuthStateChange(() => { check() })
    return () => sub.subscription.unsubscribe()
  }, [])
  if (store === undefined) return <div className="screen" />
  if (!store) return <Login />
  return (
    <Routes>
      <Route path="/" element={<Home storeName={store.name} />} />
      <Route path="/bill" element={<ComingSoon id="bill" />} />
      <Route path="/maal" element={<ComingSoon id="maal" />} />
      <Route path="/udhaar" element={<ComingSoon id="udhaar" />} />
      <Route path="/stock" element={<ComingSoon id="stock" />} />
      <Route path="/soon/:id" element={<ComingSoon />} />
      <Route path="/more" element={<More />} />
      <Route path="/agents" element={<More />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<StoreApp />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  )
}

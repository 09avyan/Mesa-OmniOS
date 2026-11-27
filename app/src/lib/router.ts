import { useEffect, useState } from 'react'

// Tiny history router. Each in-app push stores its depth, so "Peeche" never leaves the app.
const depth = () => (history.state as { d?: number } | null)?.d ?? 0

export function navigate(path: string, replace = false) {
  if (path === location.pathname + location.search) return
  if (replace) history.replaceState({ d: depth() }, '', path)
  else history.pushState({ d: depth() + 1 }, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}
export function goBack(fallback = '/') {
  if (depth() > 0) history.back()
  else navigate(fallback, true)
}
export function usePath() {
  const [path, setPath] = useState(location.pathname)
  const [, bump] = useState(0)
  useEffect(() => {
    const on = () => { setPath(location.pathname); bump((n) => n + 1) }
    window.addEventListener('popstate', on)
    return () => window.removeEventListener('popstate', on)
  }, [])
  return path
}

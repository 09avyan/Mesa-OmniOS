import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/hanken-grotesk/latin-500.css'
import '@fontsource/hanken-grotesk/latin-600.css'
import '@fontsource/hanken-grotesk/latin-700.css'
import '@fontsource/hanken-grotesk/latin-800.css'
import '@fontsource/mukta/devanagari-500.css'
import '@fontsource/mukta/devanagari-700.css'
import './styles/app.css'
import './styles/v2.css'
import './styles/df7-pages.css'
import { applyTheme } from './lib/prefs'
import App from './App'
import { startQueueSync } from './lib/offlineQueue'

applyTheme()
startQueueSync()
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/hind/devanagari-500.css'
import '@fontsource/hind/latin-500.css'
import '@fontsource/hind/devanagari-600.css'
import '@fontsource/hind/latin-600.css'
import '@fontsource/hind/devanagari-700.css'
import '@fontsource/hind/latin-700.css'
import './styles/app.css'
import App from './App'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

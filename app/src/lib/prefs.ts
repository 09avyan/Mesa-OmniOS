// Per-phone preferences (decision 8: speak answers aloud by default, controls in Settings).
const get = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d } catch { return d } }
const set = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } }
export const speakOn = () => get('omni-speak', 'on') === 'on'
export const setSpeakOn = (on: boolean) => set('omni-speak', on ? 'on' : 'off')
export const speakRate = () => (get('omni-rate', 'normal') === 'slow' ? 0.8 : 1)
export const speakSlow = () => get('omni-rate', 'normal') === 'slow'
export const setSpeakSlow = (slow: boolean) => set('omni-rate', slow ? 'slow' : 'normal')

// Look of the app: follows the phone unless the owner picks Light or Dark in Settings.
export type Theme = 'auto' | 'light' | 'dark'
export const theme = (): Theme => get('omni-theme', 'auto') as Theme
export const applyTheme = (t: Theme = theme()) => {
  const dark = t === 'dark' || (t === 'auto' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0E0F0F' : '#F7F7F4')
}
export const setTheme = (t: Theme) => { set('omni-theme', t); applyTheme(t) }

// Per-phone preferences (decision 8: speak answers aloud by default, controls in Settings).
const get = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d } catch { return d } }
const set = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } }
export const speakOn = () => get('omni-speak', 'on') === 'on'
export const setSpeakOn = (on: boolean) => set('omni-speak', on ? 'on' : 'off')
export const speakRate = () => (get('omni-rate', 'normal') === 'slow' ? 0.8 : 1)
export const speakSlow = () => get('omni-rate', 'normal') === 'slow'
export const setSpeakSlow = (slow: boolean) => set('omni-rate', slow ? 'slow' : 'normal')

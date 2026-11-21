import { useState } from 'react'
import { LANGS, useT } from '../lib/i18n'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { setSound, soundEnabled } from '../lib/feedback'
import { BackBar, Tap, toast } from '../components/ui'
import { Icon } from '../components/Icon'
import { navigate } from '../lib/router'

export function Settings() {
  const { t, lang, setLang } = useT()
  const { store } = useStore()
  const [snd, setSnd] = useState(soundEnabled())

  function pickLang(l: typeof lang) {
    setLang(l)
    if (store) supabase.from('stores').update({ language: l }).eq('id', store.id).then(() => {})
  }
  return (
    <main className="screen has-bar">
      <BackBar />
      <h1 className="h1">{t('settings')}</h1>
      <div className="lab">{t('shopCode')}: <b style={{ color: 'var(--ink)', letterSpacing: 1 }}>{store?.code}</b></div>
      <div className="gap24" />
      <h2 className="h2" style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="globe" />{t('language')}</h2>
      <div className="gap8" />
      <div className="stack">
        {LANGS.map((l) => (
          <Tap key={l.id} className={`langbtn ${lang === l.id ? 'on' : ''}`} style={{ minHeight: 64 }} onClick={() => pickLang(l.id)}>
            <span>{l.label}</span>{lang === l.id ? <span style={{ color: 'var(--ac)' }}><Icon name="tick" size={26} stroke={3} /></span> : <small>{l.sub}</small>}
          </Tap>
        ))}
      </div>
      <div className="gap24" />
      <div className="stack">
        <Tap className="rowb" onClick={() => { setSound(!snd); setSnd(!snd) }}>
          <Icon name="sound" /><span className="grow">{t('sound')}</span><span style={{ color: snd ? 'var(--ac)' : 'var(--ink2)' }}>{snd ? t('on') : t('off')}</span>
        </Tap>
        <Tap className="rowb" onClick={() => navigate('/terms')}><Icon name="doc" /><span className="grow">{t('terms')}</span><span className="chev">›</span></Tap>
        <Tap className="rowb" onClick={async () => { await supabase.auth.signOut(); navigate('/', true); toast({ text: t('loggedOut') }) }}>
          <Icon name="out" /><span className="grow">{t('logout')}<span className="lab" style={{ display: 'block', fontWeight: 500, fontSize: 17, lineHeight: '22px' }}>{t('logoutSub')}</span></span>
        </Tap>
      </div>
    </main>
  )
}

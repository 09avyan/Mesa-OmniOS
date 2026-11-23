import { useEffect, useState } from 'react'
import { LANGS, useT } from '../lib/i18n'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { setSound, soundEnabled } from '../lib/feedback'
import { askText, BackBar, Sheet, Tap, toast } from '../components/ui'
import { Icon } from '../components/Icon'
import { navigate } from '../lib/router'

export function Settings() {
  const { t, lang, setLang } = useT()
  const { store, reload } = useStore()
  const [snd, setSnd] = useState(soundEnabled())
  const [langOpen, setLangOpen] = useState(false)
  const [askOut, setAskOut] = useState(false)
  const [phonesOpen, setPhonesOpen] = useState(false)

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
      <div className="stack">
        <Tap className="rowb" onClick={async () => { const v = (await askText({ title: t('upiAsk'), initial: store?.upi_id ?? '' }) ?? '').trim(); if (!v) return; const { error } = await supabase.from('stores').update({ upi_id: v }).eq('id', store!.id); if (error) { toast({ text: t('upiBad') }); return } toast({ text: t('saved') }); reload() }}>
          <Icon name="qr" /><span className="grow">{t('upiId')}<span className="lab" style={{ display: 'block', fontSize: 17, fontWeight: 500, lineHeight: '20px' }}>{store?.upi_id ?? t('upiNotSet')}</span></span><span className="chev">›</span>
        </Tap>
        <Tap className="rowb" onClick={() => setLangOpen(true)}>
          <Icon name="globe" /><span className="grow">{t('language')}</span><span style={{ color: 'var(--ac)' }}>{LANGS.find((l) => l.id === lang)?.label}</span><span className="chev">›</span>
        </Tap>
        <Tap className="rowb" onClick={() => { setSound(!snd); setSnd(!snd) }}>
          <Icon name="sound" /><span className="grow">{t('sound')}</span><span style={{ color: snd ? 'var(--ac)' : 'var(--ink2)' }}>{snd ? t('on') : t('off')}</span>
        </Tap>
        <Tap className="rowb" onClick={() => setPhonesOpen(true)}><Icon name="lock" /><span className="grow">{t('phones')}</span><span className="chev">›</span></Tap>
        <Tap className="rowb" onClick={() => navigate('/dukaan')}><Icon name="globe" /><span className="grow">{t('myStore')}</span><span className="chev">›</span></Tap>
        <Tap className="rowb" onClick={() => navigate('/terms')}><Icon name="doc" /><span className="grow">{t('terms')}</span><span className="chev">›</span></Tap>
      </div>
      <div style={{ height: 40 }} />
      <Tap className="rowb" style={{ background: 'none', boxShadow: 'inset 0 0 0 2px #2B313A' }} onClick={() => setAskOut(true)}>
        <Icon name="out" /><span className="grow">{t('logout')}</span>
      </Tap>
      <Sheet open={langOpen} onClose={() => setLangOpen(false)}>
        <h2 className="h2">{t('language')}</h2><div className="gap16" />
        <div className="stack">
          {LANGS.map((l) => (
            <Tap key={l.id} className={`langbtn ${lang === l.id ? 'on' : ''}`} style={{ minHeight: 68 }} onClick={() => { pickLang(l.id); setLangOpen(false) }}>
              <span>{l.label}</span>{lang === l.id ? <span style={{ color: 'var(--ac)' }}><Icon name="tick" size={26} stroke={3} /></span> : <small>{l.sub}</small>}
            </Tap>
          ))}
        </div>
        <div className="gap16" />
        <Tap className="btn quiet" onClick={() => setLangOpen(false)}>{t('ok')}</Tap>
      </Sheet>
      <Sheet open={phonesOpen} onClose={() => setPhonesOpen(false)}>
        <h2 className="h2">{t('phones')}</h2><div className="gap8" />
        <p className="lab">{t('phonesBody')}</p><div className="gap16" />
        {phonesOpen && <Phones />}
        <div className="gap16" />
        <Tap className="btn quiet" onClick={() => setPhonesOpen(false)}>{t('ok')}</Tap>
      </Sheet>
      <Sheet open={askOut} onClose={() => setAskOut(false)}>
        <h2 className="h2">{t('logoutAsk')}</h2><div className="gap8" />
        <p style={{ color: 'var(--ink)' }}>{t('logoutAskBody')}</p><div className="gap24" />
        <div className="stack">
          <Tap className="btn primary" onClick={() => setAskOut(false)}>{t('logoutNo')}</Tap>
          <Tap className="btn outline" onClick={async () => { await supabase.auth.signOut(); navigate('/', true); toast({ text: t('loggedOut') }) }}>{t('logoutYes')}</Tap>
        </div>
      </Sheet>
    </main>
  )
}

type Device = { id: string; session_id: string; label: string; last_seen: string }
const sessionIdOf = (jwt?: string) => { try { return JSON.parse(atob((jwt ?? '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).session_id as string } catch { return '' } }

function Phones() {
  const { t, lang } = useT()
  const { session } = useStore()
  const [list, setList] = useState<Device[] | null>(null)
  const mine = sessionIdOf(session?.access_token)
  const load = () => supabase.from('store_devices').select('id,session_id,label,last_seen').eq('revoked', false).order('last_seen', { ascending: false })
    .then(({ data }) => setList((data as Device[]) ?? []))
  useEffect(() => { load() }, [])
  const when = (iso: string) => new Date(iso).toLocaleString(lang === 'en' ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  if (!list) return <div className="skel" style={{ height: 72 }} />
  return (
    <div className="stack">
      {list.map((d) => (
        <div key={d.id} className="rowb" style={{ cursor: 'default' }}>
          <span className="grow">{d.label}<span className="lab" style={{ display: 'block', fontSize: 17, fontWeight: 500, lineHeight: '20px' }}>
            {d.session_id === mine ? t('thisPhone') : `${t('lastSeen')}: ${when(d.last_seen)}`}</span></span>
          {d.session_id !== mine && <Tap className="btn outline small" onClick={async () => {
            const { error } = await supabase.rpc('device_revoke', { p_id: d.id })
            toast({ text: error ? t('offline') : t('phoneRemoved') }); if (!error) load()
          }}>{t('removePhone')}</Tap>}
        </div>
      ))}
    </div>
  )
}

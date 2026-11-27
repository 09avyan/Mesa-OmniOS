import { useEffect, useState } from 'react'
import { LANGS, useT } from '../lib/i18n'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { setSound, soundEnabled } from '../lib/feedback'
import { askText, Sheet, Tap, toast, TopBar } from '../components/ui'
import { Icon, Logo } from '../components/Icon'
import { navigate } from '../lib/router'
import { setTheme, theme, type Theme } from '../lib/prefs'

export function Settings() {
  const { t, lang, setLang } = useT()
  const { store, reload } = useStore()
  const [snd, setSnd] = useState(soundEnabled())
  const [langOpen, setLangOpen] = useState(false)
  const [askOut, setAskOut] = useState(false)
  const [phonesOpen, setPhonesOpen] = useState(false)
  const [look, setLook] = useState<Theme>(theme())

  function pickLang(l: typeof lang) {
    setLang(l)
    if (store) supabase.from('stores').update({ language: l }).eq('id', store.id).then(() => {})
  }
  const R = ({ icon, label, val, onClick }: { icon: string; label: string; val?: string; onClick: () => void }) => (
    <Tap className="vrow" onClick={onClick}><Icon name={icon} size={24} /><span className="t"><b>{label}</b></span>{val && <span className="val">{val}</span>}<Icon name="chev" size={22} /></Tap>
  )
  return (
    <main className="screen v2 has-bar">
      <TopBar back="/" title={t('settings')} />
      <div className="vstack vset">
        <div className="vc"><div className="vrow" style={{ minHeight: 80 }}><Logo size={48} /><span className="t"><b>{store?.name}</b><span>{store?.code}</span></span></div></div>
        <div className="vc">
          <R icon="globe" label={t('language')} val={LANGS.find((l) => l.id === lang)?.label} onClick={() => setLangOpen(true)} />
          <R icon="moon" label={t('themeTitle')} val={look === 'auto' ? t('themeAuto') : look === 'light' ? t('themeLight') : t('themeDark')} onClick={() => { const n: Theme = look === 'auto' ? 'light' : look === 'light' ? 'dark' : 'auto'; setTheme(n); setLook(n) }} />
          <R icon="qr" label={t('upiId')} val={store?.upi_id ?? t('upiNotSet')} onClick={async () => { const v = (await askText({ title: t('upiAsk'), initial: store?.upi_id ?? '' }) ?? '').trim(); if (!v) return; const { error } = await supabase.from('stores').update({ upi_id: v }).eq('id', store!.id); if (error) { toast({ text: t('upiBad') }); return } toast({ text: t('saved') }); reload() }} />
          <R icon="sound" label={t('sound')} val={snd ? t('on') : t('off')} onClick={() => { setSound(!snd); setSnd(!snd) }} />
          <R icon="store" label={t('myStore')} onClick={() => navigate('/dukaan')} />
        </div>
        <div className="vc">
          <R icon="lock" label={t('phones')} onClick={() => setPhonesOpen(true)} />
          <R icon="bag" label={t('rowBags')} onClick={() => navigate('/bags')} />
          <R icon="tools" label={t('rowSoon')} onClick={() => navigate('/soon')} />
          <R icon="doc" label={t('terms')} onClick={() => navigate('/terms')} />
        </div>
        <Tap className="btn outline s" onClick={() => setAskOut(true)}><Icon name="out" size={22} />{t('logout')}</Tap>
      </div>
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

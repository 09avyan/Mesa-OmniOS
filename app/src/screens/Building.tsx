import { useT } from '../lib/i18n'
import { BackBar, Tap } from '../components/ui'
import { Icon } from '../components/Icon'
import { goBack } from '../lib/router'

// Honest placeholder for Phase 1 parts still being built this week. Replaced section by section.
export function Building({ title, tabRoot = false }: { title: string; tabRoot?: boolean }) {
  const { t } = useT()
  return (
    <main className="screen has-bar">
      {tabRoot ? <div className="top"><span className="title">{title}</span></div> : <BackBar />}
      {!tabRoot && <h1 className="h1">{title}</h1>}
      <div style={{ height: 32 }} />
      <div className="card center" style={{ padding: '36px 24px' }}>
        <div style={{ color: 'var(--c-gal)', display: 'flex', justifyContent: 'center' }}><Icon name="tools" size={44} /></div>
        <div className="gap16" />
        <div className="h2">{t('buildingTitle')}</div>
        <div className="gap8" />
        <p className="lab">{t('buildingBody')}</p>
      </div>
      {!tabRoot && <><div className="gap24" /><Tap className="btn quiet" onClick={() => goBack()}>{t('ok')}</Tap></>}
    </main>
  )
}

import { useT } from '../lib/i18n'
import { BackBar, Tap } from '../components/ui'
import { Icon } from '../components/Icon'
import { goBack } from '../lib/router'

// Honest placeholder for Phase 1 parts still being built this week. Replaced section by section.
export function Building({ title, tabRoot = false }: { title: string; tabRoot?: boolean }) {
  const { t } = useT()
  return (
    <main className="screen has-bar pg">
      {tabRoot ? <div className="top" /> : <BackBar />}
      <h1 className="h1">{title}</h1>
      <div className="pg-blk" style={{ borderBottom: 0, marginTop: 16 }}>
        <div className="h2">{t('buildingTitle')}</div>
        <p className="pg-sub">{t('buildingBody')}</p>
      </div>
      {!tabRoot && <div className="pg-acts"><Tap className="btn primary" onClick={() => goBack()}><Icon name="tick" size={22} stroke={3} />{t('ok')}</Tap></div>}
    </main>
  )
}

import { useT } from '../lib/i18n'
import { HomeBtn, TopBar } from '../components/ui'
import { Icon } from '../components/Icon'

// Honest placeholder for Phase 1 parts still being built this week. Replaced section by section.
export function Building({ title, tabRoot = false }: { title: string; tabRoot?: boolean }) {
  const { t } = useT()
  return (
    <main className={`screen v2 ${tabRoot ? 'has-bar' : 'has-foot'}`}>
      <TopBar title={title} back={tabRoot ? false : '/'} />
      <div className="vempty">
        <Icon name="tools" size={48} />
        <h2>{t('buildingTitle')}</h2>
        <p>{t('buildingBody')}</p>
      </div>
      {!tabRoot && <div className="vfoot flat"><HomeBtn className="primary" /></div>}
    </main>
  )
}

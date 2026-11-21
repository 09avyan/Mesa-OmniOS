import { LANGS, useT, type Lang } from '../lib/i18n'
import { Tap } from '../components/ui'
import { Icon } from '../components/Icon'

// First launch: shown before login. Title in all three languages, since we don't know theirs yet.
export function Language({ onDone, current }: { onDone: (l: Lang) => void; current?: Lang }) {
  const { setLang } = useT()
  return (
    <main className="screen">
      <div style={{ height: 40 }} />
      <div style={{ color: 'var(--ac)' }}><Icon name="globe" size={40} /></div>
      <div className="gap16" />
      <h1 className="h1">भाषा चुनें</h1>
      <div className="h1" style={{ color: 'var(--ink2)' }}>Bhasha chuno</div>
      <div className="h1" style={{ color: 'var(--ink2)' }}>Choose language</div>
      <div className="gap24" />
      <div className="stack" style={{ gap: 16 }}>
        {LANGS.map((l) => (
          <Tap key={l.id} className={`langbtn ${current === l.id ? 'on' : ''}`} onClick={() => { setLang(l.id); onDone(l.id) }}>
            <span>{l.label}</span><small>{l.sub}</small>
          </Tap>
        ))}
      </div>
    </main>
  )
}

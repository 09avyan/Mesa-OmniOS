import { LANGS, useT, type Lang } from '../lib/i18n'
import { Tap } from '../components/ui'
import { Icon, Logo } from '../components/Icon'

// First launch: shown before login. Title in all three languages, since we don't know theirs yet.
export function Language({ onDone, current }: { onDone: (l: Lang) => void; current?: Lang }) {
  const { setLang } = useT()
  return (
    <main className="screen v2" style={{ paddingTop: 32 }}>
      <div style={{ padding: '0 8px' }}>
        <Logo size={56} />
        <h1 className="vh1" style={{ marginTop: 24 }}>भाषा चुनें</h1>
        <div className="vlab">Bhasha chuno · Choose language</div>
      </div>
      <div className="vc" style={{ marginTop: 32 }}>
        {LANGS.map((l) => (
          <Tap key={l.id} className="vrow" style={{ minHeight: 80 }} onClick={() => { setLang(l.id); onDone(l.id) }}>
            <span className="t"><b style={{ font: '800 24px/32px var(--font)' }}>{l.label}</b><span>{l.sub}</span></span>
            {current === l.id ? <Icon name="tick" size={26} stroke={2.6} /> : <Icon name="chev" size={22} />}
          </Tap>
        ))}
      </div>
    </main>
  )
}

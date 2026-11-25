import { LANGS, useT, type Lang } from '../lib/i18n'
import { Tap } from '../components/ui'
import { Icon } from '../components/Icon'

// First launch: shown before login. Title in all three languages, since we don't know theirs yet.
export function Language({ onDone, current }: { onDone: (l: Lang) => void; current?: Lang }) {
  const { setLang } = useT()
  return (
    <main className="screen lg">
      <div>
        <h1 className="h1">भाषा चुनें</h1>
        <div className="lg-alt">Bhasha chuno</div>
        <div className="lg-alt">Choose language</div>
      </div>
      <div className="lg-langs">
        {LANGS.map((l) => (
          <Tap key={l.id} className={`langbtn ${current === l.id ? 'on' : ''}`} onClick={() => { setLang(l.id); onDone(l.id) }}>
            <span>{l.label}<small>{l.sub}</small></span>{current === l.id ? <Icon name="tick" size={26} stroke={3} /> : <Icon name="chev" size={22} />}
          </Tap>
        ))}
      </div>
    </main>
  )
}

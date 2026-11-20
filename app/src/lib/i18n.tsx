import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'hi' | 'hinglish'
const S = {
  back: ['वापस', 'Wapas'],
  bolo: ['बोलो', 'Bolo'],
  bhasha: ['भाषा', 'Bhasha'],
  listening: ['सुन रहा हूँ…', 'Sun raha hoon…'],
  login_title: ['दुकान में आइए', 'Dukaan mein aaiye'],
  store_code: ['दुकान कोड', 'Dukaan code'],
  pin: ['4 अंक का PIN', '4 ank ka PIN'],
  next: ['आगे', 'Aage'],
  enter: ['खोलो', 'Kholo'],
  clear: ['मिटाओ', 'Mitao'],
  wait: ['रुको, आ रहा है…', 'Ruko, aa raha hai…'],
  bad_login: ['कोड या PIN गलत है। फिर से डालिए, या OmniOS टीम को फ़ोन कीजिए।', 'Code ya PIN galat hai. Phir se daaliye, ya OmniOS team ko phone kijiye.'],
  paused: ['यह दुकान अभी बंद है। OmniOS टीम से बात कीजिए।', 'Yeh dukaan abhi band hai. OmniOS team se baat kijiye.'],
  no_net: ['इंटरनेट नहीं चल रहा। नेट चालू करके फिर दबाइए।', 'Internet nahi chal raha. Net chalu karke phir dabaiye.'],
  bill: ['बिल', 'Bill'],
  maal: ['माल आया', 'Maal aaya'],
  udhaar: ['उधार', 'Udhaar'],
  stock: ['स्टॉक', 'Stock'],
  more: ['और', 'Aur'],
  today: ['आज', 'Aaj'],
  sales: ['बिक्री', 'Bikri'],
  bills_n: ['बिल', 'bill'],
  morning_empty: ['आज अभी कोई बिल नहीं बना। पहला बिल बनाइए!', 'Aaj abhi koi bill nahi bana. Pehla bill banaiye!'],
  agents: ['मदद करने वाले AI', 'Madad karne wale AI'],
  phase3: ['ऑनलाइन ऑर्डर नेटवर्क', 'Online order network'],
  terms: ['नियम और शर्तें', 'Niyam aur sharten'],
  logout: ['बाहर निकलो', 'Bahar niklo'],
  soon: ['जल्द आ रहा है', 'Jald aa raha hai'],
  you_control: ['फ़ैसला हमेशा आपका: हर काम में चुनिए — खुद चलने दें या पहले आपसे पूछे।', 'Faisla hamesha aapka: har kaam mein chuniye — khud chalne dein ya pehle aapse pooche.'],
  mic_unsupported: ['इस फ़ोन में आवाज़ नहीं चलती। Chrome खोलकर कोशिश कीजिए।', 'Is phone mein awaaz nahi chalti. Chrome kholkar koshish kijiye.'],
  mic_denied: ['माइक की इजाज़त दीजिए: ऊपर ताले 🔒 पर दबाकर "Microphone" चालू कीजिए।', 'Mic ki ijaazat dijiye: upar taale 🔒 par dabakar "Microphone" chalu kijiye.'],
  heard_unknown: ['समझ नहीं आया। बोलिए: "बिल", "माल आया", "उधार" या "स्टॉक"।', 'Samajh nahi aaya. Boliye: "bill", "maal aaya", "udhaar" ya "stock".'],
} as const
export type Key = keyof typeof S

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>(null!)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setL] = useState<Lang>(() => {
    try { return (localStorage.getItem('lang') as Lang) || 'hi' } catch { return 'hi' }
  })
  const setLang = (l: Lang) => { setL(l); try { localStorage.setItem('lang', l) } catch { /* ok */ } }
  const t = (k: Key) => S[k][lang === 'hi' ? 0 : 1]
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}
export const useLang = () => useContext(Ctx)

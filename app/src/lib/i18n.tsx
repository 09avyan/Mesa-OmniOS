import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'hi' | 'hinglish' | 'en'
type Entry = { hinglish: string; hi: string; en: string }

// Every word the owner sees lives here, in all three languages.
const S = {
  back: { hinglish: 'Peeche', hi: 'पीछे', en: 'Back' },
  ok: { hinglish: 'Theek hai', hi: 'ठीक है', en: 'OK' },
  loading: { hinglish: 'Ek second…', hi: 'एक सेकंड…', en: 'One second…' },
  offline: { hinglish: 'Net nahi chal raha. Wi-Fi ya data on karke dobara dabaiye.', hi: 'नेट नहीं चल रहा। वाई-फ़ाई या डेटा चालू करके दोबारा दबाइए।', en: 'No internet. Turn on Wi-Fi or data and try again.' },
  tryAgain: { hinglish: 'Dobara koshish karo', hi: 'दोबारा कोशिश करें', en: 'Try again' },

  // tabs + mic
  tabHome: { hinglish: 'Ghar', hi: 'घर', en: 'Home' },
  tabBill: { hinglish: 'Bill', hi: 'बिल', en: 'Bill' },
  tabMaal: { hinglish: 'Maal', hi: 'माल', en: 'Stock' },
  tabUdhaar: { hinglish: 'Udhaar', hi: 'उधार', en: 'Udhaar' },
  mic: { hinglish: 'Bolo', hi: 'बोलो', en: 'Speak' },

  // login
  loginTitle: { hinglish: 'Apni dukaan kholo', hi: 'अपनी दुकान खोलें', en: 'Open your shop' },
  codeLabel: { hinglish: 'Dukaan code', hi: 'दुकान कोड', en: 'Shop code' },
  codeHint: { hinglish: 'Dukaan ka code, jo aapko diya gaya', hi: 'दुकान का कोड, जो आपको दिया गया', en: 'Your shop code, the one you were given' },
  codeFirst: { hinglish: 'Pehle code likho', hi: 'पहले कोड लिखें', en: 'Type the code first' },
  next: { hinglish: 'Aage', hi: 'आगे', en: 'Next' },
  pinTitle: { hinglish: '4 number ka PIN daalo', hi: '4 अंकों का PIN डालें', en: 'Enter your 4-digit PIN' },
  clear: { hinglish: 'Saaf karo', hi: 'साफ़ करो', en: 'Clear' },
  wrongLogin: { hinglish: 'Code ya PIN galat hai. Dobara daalo.', hi: 'कोड या PIN गलत है। दोबारा डालें।', en: 'Code or PIN is wrong. Please try again.' },
  pausedStore: { hinglish: 'Yeh dukaan abhi band hai. OmniOS team se baat karo.', hi: 'यह दुकान अभी बंद है। OmniOS टीम से बात करें।', en: 'This shop is paused. Please talk to the OmniOS team.' },
  forgotCode: { hinglish: 'Code ya PIN bhool gaye? Jisne app lagaya, unhe call karo.', hi: 'कोड या PIN भूल गए? जिसने ऐप लगाया, उन्हें कॉल करें।', en: 'Forgot code or PIN? Call the person who set up the app.' },
  changeCode: { hinglish: 'Code badlo', hi: 'कोड बदलो', en: 'Change code' },

  // home
  settings: { hinglish: 'Settings', hi: 'सेटिंग', en: 'Settings' },
  todaySales: { hinglish: 'Aaj ki bikri', hi: 'आज की बिक्री', en: "Today's sales" },
  udhaarToday: { hinglish: 'Aaj udhaar diya', hi: 'आज उधार दिया', en: 'Udhaar given today' },
  fullHisaab: { hinglish: 'Pura hisaab dekho', hi: 'पूरा हिसाब देखें', en: 'See full hisaab' },
  firstBillHint: { hinglish: 'Pehla bill banate hi yahan dikhega', hi: 'पहला बिल बनाते ही यहाँ दिखेगा', en: 'Shows here as soon as you make a bill' },
  rowGalla: { hinglish: 'Galla gino', hi: 'गल्ला गिनो', en: 'Count the cash drawer' },
  rowOrders: { hinglish: 'Online orders', hi: 'ऑनलाइन ऑर्डर', en: 'Online orders' },
  rowBags: { hinglish: 'Free thaile mangao', hi: 'फ्री थैले मंगाओ', en: 'Get free bags' },
  sayHint: { hinglish: 'Mic dabao aur bolo, jaise:', hi: 'माइक दबाओ और बोलो, जैसे:', en: 'Tap the mic and speak, like:' },
  sayExample: { hinglish: '"Sharma ji, 2 kilo cheeni"', hi: '"शर्मा जी, 2 किलो चीनी"', en: '"Sharma ji, 2 kilo sugar"' },

  // settings
  language: { hinglish: 'Bhasha', hi: 'भाषा', en: 'Language' },
  sound: { hinglish: 'Button dabane ki awaaz', hi: 'बटन दबाने की आवाज़', en: 'Sound when you tap' },
  on: { hinglish: 'Chalu', hi: 'चालू', en: 'On' },
  off: { hinglish: 'Band', hi: 'बंद', en: 'Off' },
  terms: { hinglish: 'Niyam aur shartein', hi: 'नियम और शर्तें', en: 'Terms and conditions' },
  logout: { hinglish: 'Is phone se bahar niklo', hi: 'इस फ़ोन से बाहर निकलें', en: 'Log out of this phone' },
  logoutSub: { hinglish: 'Dukaan ka hisaab surakshit rahega', hi: 'दुकान का हिसाब सुरक्षित रहेगा', en: 'Your shop data stays safe' },
  loggedOut: { hinglish: 'Bahar nikal gaye', hi: 'बाहर निकल गए', en: 'Logged out' },
  shopCode: { hinglish: 'Dukaan code', hi: 'दुकान कोड', en: 'Shop code' },
  saved: { hinglish: 'Ho gaya', hi: 'हो गया', en: 'Done' },

  // feature not built yet (honest, temporary during build)
  buildingTitle: { hinglish: 'Is hafte aa raha hai', hi: 'इस हफ़्ते आ रहा है', en: 'Arriving this week' },
  buildingBody: { hinglish: 'Yeh hissa abhi tayyar ho raha hai.', hi: 'यह हिस्सा अभी तैयार हो रहा है।', en: 'This part is being made ready.' },
  micSoonTitle: { hinglish: 'Bolkar bill banana is hafte aa raha hai', hi: 'बोलकर बिल बनाना इस हफ़्ते आ रहा है', en: 'Making bills by voice arrives this week' },
  micSoonBody: { hinglish: 'Tab aap mic dabakar bolenge, aur bill apne aap banega.', hi: 'तब आप माइक दबाकर बोलेंगे, और बिल अपने आप बनेगा।', en: 'Then you tap the mic, speak, and the bill makes itself.' },
} satisfies Record<string, Entry>

export type Key = keyof typeof S

const LANG_KEY = 'omni-lang'
export function savedLang(): Lang | null {
  try { const v = localStorage.getItem(LANG_KEY); return v === 'hi' || v === 'hinglish' || v === 'en' ? v : null } catch { return null }
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }
const I18n = createContext<Ctx>({ lang: 'hinglish', setLang: () => {}, t: (k) => S[k].hinglish })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(savedLang() ?? 'hinglish')
  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(LANG_KEY, l) } catch { /* ignore */ }
    document.documentElement.lang = l === 'en' ? 'en' : 'hi'
  }
  return <I18n.Provider value={{ lang, setLang, t: (k) => S[k][lang] }}>{children}</I18n.Provider>
}
export const useT = () => useContext(I18n)

export const LANGS: { id: Lang; label: string; sub: string }[] = [
  { id: 'hi', label: 'हिंदी', sub: 'हिंदी अक्षरों में' },
  { id: 'hinglish', label: 'Hinglish', sub: 'Hindi, English letters mein' },
  { id: 'en', label: 'English', sub: 'All in English' },
]

export const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

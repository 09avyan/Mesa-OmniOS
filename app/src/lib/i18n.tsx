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
  codeExample: { hinglish: 'jaise: SHARMA12', hi: 'जैसे: SHARMA12', en: 'like: SHARMA12' },
  shopLabel: { hinglish: 'Dukaan', hi: 'दुकान', en: 'Shop' },
  logoutAsk: { hinglish: 'Is phone se bahar niklein?', hi: 'इस फ़ोन से बाहर निकलें?', en: 'Log out of this phone?' },
  logoutAskBody: { hinglish: 'Wapas aane ke liye dukaan code aur PIN lagega. Hisaab surakshit rahega.', hi: 'वापस आने के लिए दुकान कोड और PIN लगेगा। हिसाब सुरक्षित रहेगा।', en: 'You will need the shop code and PIN to come back. Your data stays safe.' },
  logoutYes: { hinglish: 'Haan, bahar niklo', hi: 'हाँ, बाहर निकलो', en: 'Yes, log out' },
  logoutNo: { hinglish: 'Nahi, wapas jao', hi: 'नहीं, वापस जाओ', en: 'No, go back' },
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

  // voice flow
  listenTitle: { hinglish: 'Boliye, sun raha hoon', hi: 'बोलिए, सुन रहा हूँ', en: 'Speak, I am listening' },
  listenNote: { hinglish: 'Saara saaman bol dijiye. Ruk kar sochna theek hai. Khatam hone par "Ho gaya" dabaiye.', hi: 'सारा सामान बोल दीजिए। रुककर सोचना ठीक है। खत्म होने पर "हो गया" दबाइए।', en: 'Say all the items. Pausing is fine. Tap "Done" when finished.' },
  listenDone: { hinglish: 'Ho gaya, aage chalo', hi: 'हो गया, आगे चलो', en: 'Done, continue' },
  listenAgain: { hinglish: 'Phir se bolo', hi: 'फिर से बोलो', en: 'Speak again' },
  micSpeaking: { hinglish: 'Sun raha hai', hi: 'सुन रहा है', en: 'Listening' },
  micFix: { hinglish: 'Bolke badlo', hi: 'बोलकर बदलो', en: 'Speak to change' },
  typeInstead: { hinglish: 'Ya yahan likho', hi: 'या यहाँ लिखो', en: 'Or type here' },
  typeHint: { hinglish: 'jaise: Sharma ji, 2 kilo cheeni', hi: 'जैसे: शर्मा जी, 2 किलो चीनी', en: 'like: Sharma ji, 2 kilo sugar' },
  noMicSupport: { hinglish: 'Is phone mein bolne ki suvidha nahi mili. Neeche likh kar batao.', hi: 'इस फ़ोन में बोलने की सुविधा नहीं मिली। नीचे लिखकर बताओ।', en: 'Voice is not available on this phone. Type below instead.' },
  micDenied: { hinglish: 'Mic ki permission chahiye. Upar "Allow" dabaiye, phir mic dabaiye.', hi: 'माइक की अनुमति चाहिए। ऊपर "Allow" दबाइए, फिर माइक दबाइए।', en: 'Microphone permission needed. Tap "Allow", then tap the mic.' },
  noSpeech: { hinglish: 'Kuch sunai nahi diya. Mic dabake phir se boliye.', hi: 'कुछ सुनाई नहीं दिया। माइक दबाकर फिर से बोलिए।', en: 'I did not hear anything. Tap the mic and speak again.' },
  notUnderstood: { hinglish: 'Samajh nahi aaya', hi: 'समझ नहीं आया', en: 'Did not understand' },
  notUnderstoodBody: { hinglish: 'Aise boliye:', hi: 'ऐसे बोलिए:', en: 'Try saying:' },
  heard: { hinglish: 'Suna', hi: 'सुना', en: 'Heard' },
  billWhose: { hinglish: 'Bill kiska?', hi: 'बिल किसका?', en: "Whose bill?" },
  walkIn: { hinglish: 'Bina naam (aam grahak)', hi: 'बिना नाम (आम ग्राहक)', en: 'No name (walk-in)' },
  addName: { hinglish: 'Naam jodo', hi: 'नाम जोड़ो', en: 'Add name' },
  change: { hinglish: 'Badlo', hi: 'बदलो', en: 'Change' },
  newCustomer: { hinglish: 'Naya grahak', hi: 'नया ग्राहक', en: 'New customer' },
  thisName: { hinglish: 'Yahi naam?', hi: 'यही नाम?', en: 'Is this the name?' },
  itsAnItem: { hinglish: 'Yeh saaman hai', hi: 'यह सामान है', en: 'It is an item' },
  sayItems: { hinglish: 'Ab saaman boliye', hi: 'अब सामान बोलिए', en: 'Now say the items' },
  addItem: { hinglish: 'Saaman jodo', hi: 'सामान जोड़ो', en: 'Add item' },
  billByVoice: { hinglish: 'Bolke bill banao', hi: 'बोलकर बिल बनाओ', en: 'Make bill by voice' },
  billByPick: { hinglish: 'Saaman chunkar bill banao', hi: 'सामान चुनकर बिल बनाओ', en: 'Make bill by choosing items' },
  todayBills: { hinglish: 'Aaj ke bill', hi: 'आज के बिल', en: "Today's bills" },
  noBillsToday: { hinglish: 'Aaj abhi koi bill nahi bana', hi: 'आज अभी कोई बिल नहीं बना', en: 'No bills yet today' },
  itemsWord: { hinglish: 'saaman', hi: 'सामान', en: 'items' },
  removedWord: { hinglish: 'hataya', hi: 'हटाया', en: 'removed' },
  thisOne: { hinglish: 'Yahi wali?', hi: 'यही वाली?', en: 'This one?' },
  yes: { hinglish: 'Haan', hi: 'हाँ', en: 'Yes' },
  other: { hinglish: 'Doosri', hi: 'दूसरी', en: 'Other' },
  whatIsThis: { hinglish: 'Yeh kya hai? Chuno', hi: 'यह क्या है? चुनो', en: 'What is this? Choose' },
  pickItem: { hinglish: 'Saaman chuno', hi: 'सामान चुनो', en: 'Choose item' },
  searchItem: { hinglish: 'Naam likho', hi: 'नाम लिखो', en: 'Type the name' },
  remove: { hinglish: 'Hatao', hi: 'हटाओ', en: 'Remove' },
  priceAsk: { hinglish: 'Daam likho', hi: 'दाम लिखो', en: 'Enter price' },
  priceCheck: { hinglish: 'Daam sahi?', hi: 'दाम सही?', en: 'Price right?' },
  perUnit: { hinglish: 'ek ka', hi: 'एक का', en: 'each' },
  qtyAsk: { hinglish: 'Kitna?', hi: 'कितना?', en: 'How much?' },
  howPaid: { hinglish: 'Paise kaise mile?', hi: 'पैसे कैसे मिले?', en: 'How was it paid?' },
  cash: { hinglish: 'Cash', hi: 'नकद', en: 'Cash' },
  upi: { hinglish: 'UPI', hi: 'UPI', en: 'UPI' },
  udhaar: { hinglish: 'Udhaar', hi: 'उधार', en: 'Udhaar' },
  udhaarNeedsName: { hinglish: 'Udhaar ke liye grahak ka naam jodo', hi: 'उधार के लिए ग्राहक का नाम जोड़ो', en: 'Add the customer name for udhaar' },
  udhaarBefore: { hinglish: 'Pehle', hi: 'पहले', en: 'Before' },
  udhaarThisBill: { hinglish: 'is bill', hi: 'इस बिल', en: 'this bill' },
  udhaarTotal: { hinglish: 'ka kul udhaar', hi: 'का कुल उधार', en: 'total udhaar' },
  discount: { hinglish: 'Chhoot (discount)', hi: 'छूट (डिस्काउंट)', en: 'Discount' },
  total: { hinglish: 'Kul', hi: 'कुल', en: 'Total' },
  answerFirst: { hinglish: 'pehle "Haan" dabao', hi: 'पहले "हाँ" दबाओ', en: 'tap "Yes" first' },
  priceFirst: { hinglish: 'Pehle daam likho', hi: 'पहले दाम लिखो', en: 'Enter the price first' },
  fixFirst: { hinglish: 'Pehle peeli line theek karo', hi: 'पहले पीली लाइन ठीक करो', en: 'Fix the yellow line first' },
  saveBill: { hinglish: 'Save karo', hi: 'सेव करो', en: 'Save' },
  addMore: { hinglish: 'Aur saaman', hi: 'और सामान', en: 'More items' },
  billSaved: { hinglish: 'Bill ban gaya', hi: 'बिल बन गया', en: 'Bill saved' },
  stockLess: { hinglish: 'Stock se kam', hi: 'स्टॉक से कम', en: 'Taken from stock' },
  sendWa: { hinglish: 'ko WhatsApp karo', hi: 'को व्हाट्सऐप करो', en: 'send on WhatsApp' },
  sendWaWalkIn: { hinglish: 'WhatsApp pe bhejo', hi: 'व्हाट्सऐप पर भेजो', en: 'Send on WhatsApp' },
  mistake: { hinglish: 'Galti hui?', hi: 'गलती हुई?', en: 'Mistake?' },
  removeBill: { hinglish: 'Bill hatao', hi: 'बिल हटाओ', en: 'Remove bill' },
  billRemoved: { hinglish: 'Bill hat gaya, stock wapas', hi: 'बिल हट गया, स्टॉक वापस', en: 'Bill removed, stock back' },
  newBill: { hinglish: 'Naya bill', hi: 'नया बिल', en: 'New bill' },
  unrecordedNote: { hinglish: 'Kuch saaman ka maal aaya nahi likha. Agli baar receipt ki photo lo.', hi: 'कुछ सामान का माल आया नहीं लिखा। अगली बार रसीद की फ़ोटो लो।', en: 'Some items have no stock record. Record a receipt next time.' },
  stockInTitle: { hinglish: 'Maal aaya — sahi hai?', hi: 'माल आया — सही है?', en: 'Stock received — correct?' },
  stockAdd: { hinglish: 'Stock mein jodo', hi: 'स्टॉक में जोड़ो', en: 'Add to stock' },
  stockAdded: { hinglish: 'Stock badh gaya', hi: 'स्टॉक बढ़ गया', en: 'Stock added' },
  paymentTitle: { hinglish: 'Udhaar jama', hi: 'उधार जमा', en: 'Udhaar payment' },
  amount: { hinglish: 'Raqam', hi: 'रकम', en: 'Amount' },
  balanceNow: { hinglish: 'Abhi baaki', hi: 'अभी बाकी', en: 'Owes now' },
  balanceAfter: { hinglish: 'Jama ke baad', hi: 'जमा के बाद', en: 'After payment' },
  payDo: { hinglish: 'Jama karo', hi: 'जमा करो', en: 'Record payment' },
  paySaved: { hinglish: 'Jama ho gaya', hi: 'जमा हो गया', en: 'Payment recorded' },
  whoPaid: { hinglish: 'Kisne diye?', hi: 'किसने दिए?', en: 'Who paid?' },
  noSuchCustomer: { hinglish: 'Is naam ka udhaar nahi mila. Neeche se chuno.', hi: 'इस नाम का उधार नहीं मिला। नीचे से चुनो।', en: 'No udhaar under this name. Choose below.' },
  stockLeft: { hinglish: 'bacha hai', hi: 'बचा है', en: 'left' },
  stockUnknown: { hinglish: 'Iska stock abhi likha nahi hai. "Maal aaya" bolkar jodo.', hi: 'इसका स्टॉक अभी लिखा नहीं है। "माल आया" बोलकर जोड़ो।', en: 'No stock recorded yet. Say "Maal aaya" to add it.' },
  gallaTitle: { hinglish: 'Galla milao', hi: 'गल्ला मिलाओ', en: 'Cash drawer check' },
  gallaSaid: { hinglish: 'Galle mein', hi: 'गल्ले में', en: 'In drawer' },
  gallaBills: { hinglish: 'Aaj ke cash bill', hi: 'आज के नकद बिल', en: "Today's cash bills" },
  gallaMatch: { hinglish: 'Galla mil gaya. Shabaash!', hi: 'गल्ला मिल गया। शाबाश!', en: 'Drawer matches. Well done!' },
  gallaLess: { hinglish: 'kam hai. Kuch bill chhoot gaya?', hi: 'कम है। कुछ बिल छूट गया?', en: 'short. Did a bill get missed?' },
  gallaMore: { hinglish: 'zyada hai. Koi bill do baar to nahi bana?', hi: 'ज़्यादा है। कोई बिल दो बार तो नहीं बना?', en: 'extra. Was a bill made twice?' },
  gallaNote: { hinglish: 'Subah ka khula paisa alag rakhein.', hi: 'सुबह का खुला पैसा अलग रखें।', en: 'Keep the morning change float aside.' },
  saving: { hinglish: 'Save ho raha hai…', hi: 'सेव हो रहा है…', en: 'Saving…' },
  saveFailed: { hinglish: 'Save nahi hua. Net check karke dobara dabaiye.', hi: 'सेव नहीं हुआ। नेट चेक करके दोबारा दबाइए।', en: 'Could not save. Check internet and tap again.' },
  speakAnswers: { hinglish: 'Jawab bolkar sunao', hi: 'जवाब बोलकर सुनाओ', en: 'Speak answers aloud' },
  speakSpeed: { hinglish: 'Bolne ki speed', hi: 'बोलने की रफ़्तार', en: 'Speaking speed' },
  slow: { hinglish: 'Dheere', hi: 'धीरे', en: 'Slow' },
  normal: { hinglish: 'Normal', hi: 'सामान्य', en: 'Normal' },
  understanding: { hinglish: 'Samajh raha hoon…', hi: 'समझ रहा हूँ…', en: 'Understanding…' },
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

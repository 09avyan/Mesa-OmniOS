import { Screen } from '../components/Screen'
import { useLang } from '../lib/i18n'

const T = {
  hi: [
    'OmniOS Dukaan आपकी दुकान का हिसाब रखने का ऐप है। आपका डेटा सिर्फ़ आपकी दुकान को दिखता है।',
    'ग्राहक का नाम और फ़ोन सिर्फ़ बिल या उधार भेजने के लिए रखा जाता है।',
    'डेटा का इस्तेमाल: बिना नाम-पहचान वाला, कई दुकानों का मिला-जुला डेटा (जैसे "इंदौर में चीनी की बिक्री") OmniOS दूसरों से साझा कर सकता है या बेच सकता है। इसमें आपकी दुकान, आपका या किसी ग्राहक का नाम या फ़ोन कभी नहीं होगा।',
    'OmniOS कभी आपकी ओर से सप्लायर को ऑर्डर नहीं देता, और पैसे नहीं लेता। UPI सिर्फ़ लिखा जाता है।',
    'आप जब चाहें अपना खाता बंद करवा सकते हैं। तब आपकी दुकान का डेटा मिटा दिया जाएगा।',
  ],
  hinglish: [
    'OmniOS Dukaan aapki dukaan ka hisaab rakhne ka app hai. Aapka data sirf aapki dukaan ko dikhta hai.',
    'Grahak ka naam aur phone sirf bill ya udhaar bhejne ke liye rakha jata hai.',
    'Data ka istemaal: bina naam-pehchaan wala, kai dukaanon ka mila-jula data (jaise "Indore mein cheeni ki bikri") OmniOS doosron se share kar sakta hai ya bech sakta hai. Ismein aapki dukaan, aapka ya kisi grahak ka naam ya phone kabhi nahi hoga.',
    'OmniOS kabhi aapki taraf se supplier ko order nahi deta, aur paise nahi leta. UPI sirf likha jata hai.',
    'Aap jab chahein apna khata band karwa sakte hain. Tab aapki dukaan ka data mita diya jayega.',
  ],
}
export default function Terms() {
  const { t, lang } = useLang()
  return (
    <Screen title={t('terms')}>
      <ol className="panel" style={{ margin: 0, paddingLeft: 40, display: "grid", gap: 14 }}>
        {T[lang].map(p => <li key={p}>{p}</li>)}
      </ol>
    </Screen>
  )
}

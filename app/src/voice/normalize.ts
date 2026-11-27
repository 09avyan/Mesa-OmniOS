import { devToAscii } from './numbers'

export type Unit = 'kg' | 'g' | 'l' | 'ml' | 'pc' | 'pack' | 'rs'

// Spoken unit words -> unit. "pav" (250 g) is handled as a fraction in numbers.ts.
const UNIT_WORDS: Record<string, Unit> = {
  kilo: 'kg', killo: 'kg', keelo: 'kg', kilu: 'kg', kg: 'kg', kgs: 'kg', kilogram: 'kg', kilograms: 'kg', kelo: 'kg', kilos: 'kg', kilogm: 'kg', kgm: 'kg', kiilo: 'kg', 'किलो': 'kg', 'केजी': 'kg', 'किल्लो': 'kg', 'कीलो': 'kg',
  gram: 'g', grams: 'g', gm: 'g', gms: 'g', g: 'g', gr: 'g', grm: 'g', grms: 'g', gramme: 'g', 'ग्रा': 'g', 'ग्राम्स': 'g', 'ग्राम': 'g',
  litre: 'l', leter: 'l', lite: 'l', liter: 'l', litres: 'l', liters: 'l', ltr: 'l', ltrs: 'l', lt: 'l', lit: 'l', l: 'l', litter: 'l', leeter: 'l', 'लीटर': 'l', 'लिटर': 'l',
  ml: 'ml', mls: 'ml', millilitre: 'ml', millilitres: 'ml', mili: 'ml', 'एमएल': 'ml',
  piece: 'pc', pieces: 'pc', pc: 'pc', pcs: 'pc', nag: 'pc', 'नग': 'pc', 'पीस': 'pc',
  packet: 'pack', packets: 'pack', pack: 'pack', packs: 'pack', pkt: 'pack', paket: 'pack', 'पैकेट': 'pack', 'पाकेट': 'pack',
  rupaye: 'rs', rupay: 'rs', rupee: 'rs', rupees: 'rs', rupye: 'rs', rs: 'rs', 'रुपये': 'rs', 'रुपए': 'rs', 'रूपए': 'rs', 'रुपया': 'rs',
}
export const unitOf = (w: string): Unit | null => UNIT_WORDS[w] ?? null

// Words that carry no meaning for items ("de do", "chahiye", "ka", "wala").
export const FILLER = new Set([
  'ka', 'ki', 'ke', 'wala', 'wali', 'wale', 'vala', 'vali', 'bhi', 'please', 'plz', 'dena', 'dedo', 'de', 'dijiye', 'chahiye', 'chaiye',
  'hai', 'hain', 'the', 'a', 'an', 'of', 'ko', 'to', 'lo', 'le', 'lena', 'liya', 'dalo', 'likho', 'aur', 'and', 'also',
  // chatter that is never part of an order (otherwise it becomes junk bill lines)
  'haan', 'han', 'ji', 'bhai', 'bhaiya', 'bhaisaab', 'sir', 'madam', 'yaar', 'arre', 'arey', 'are', 'ruko', 'minute', 'minit', 'hello', 'hi', 'hey', 'ok', 'okay', 'thanks', 'thank', 'you',
  'bolo', 'kya', 'kyun', 'kaise', 'kitna', 'kitne', 'kitni', 'hua', 'hue', 'total', 'bata', 'batao', 'bas', 'itna', 'itni', 'theek', 'thik', 'achha', 'accha', 'chalo', 'jaldi', 'karo', 'kar',
  'paisa', 'aaj', 'bahut', 'mera', 'meri', 'mere', 'mujhe', 'aap', 'aapko', 'hum', 'tum', 'woh', 'wo', 'ye', 'yeh', 'ab', 'abhi', 'mummy', 'phone', 'kahan', 'bola', 'ne',
  'हाँ', 'हां', 'जी', 'भाई', 'यार', 'अरे', 'रुको', 'मिनट', 'क्या', 'कितना', 'कितने', 'बताओ', 'बस', 'ठीक', 'चलो', 'जल्दी', 'करो', 'पैसा', 'आज', 'बहुत', 'मेरा', 'मुझे', 'आप', 'सब', 'हाल', 'ने',
  'का', 'की', 'के', 'वाला', 'वाली', 'भी', 'देना', 'दे', 'दीजिए', 'चाहिए', 'है', 'हैं', 'को', 'लो', 'और',
])
export const SEPARATORS = new Set([',', 'aur', 'and', 'और', 'phir', 'fir', 'then', 'फिर'])

// ---- domain post-correction of what the phone heard (hi-IN / en-IN) ------------------------------------------------
// Hindi-script brand names -> the Latin name the catalogue indexes ("मैगी" -> maggi). Longest first.
const BRANDS: [string, string][] = [
  ['पार्ले जी', 'parle g'], ['पारले जी', 'parle g'], ['पारलेजी', 'parle g'], ['पार्लेजी', 'parle g'], ['पारले', 'parle'], ['पार्ले', 'parle'],
  ['मैगी', 'maggi'], ['मेगी', 'maggi'], ['सर्फ', 'surf'], ['सरफ', 'surf'], ['कोका कोला', 'coca cola'], ['कोकाकोला', 'coca cola'], ['कोक', 'coke'],
  ['अमूल', 'amul'], ['आशीर्वाद', 'aashirvaad'], ['टाटा', 'tata'], ['सनफीस्ट', 'sunfeast'], ['ब्रिटानिया', 'britannia'], ['कुरकुरे', 'kurkure'],
  ['लेज़', 'lays'], ['लेज', 'lays'], ['डेटॉल', 'dettol'], ['लक्स', 'lux'], ['लाइफबॉय', 'lifebuoy'], ['वैसलीन', 'vaseline'], ['कोलगेट', 'colgate'],
  ['पतंजलि', 'patanjali'], ['फॉर्च्यून', 'fortune'], ['सफोला', 'saffola'], ['हल्दीराम', 'haldiram'], ['बिसलेरी', 'bisleri'], ['थम्स अप', 'thums up'],
  ['पेप्सी', 'pepsi'], ['स्प्राइट', 'sprite'], ['फैंटा', 'fanta'], ['निरमा', 'nirma'], ['विम', 'vim'], ['हार्पिक', 'harpic'], ['ओरियो', 'oreo'],
  ['गुड डे', 'good day'], ['हॉर्लिक्स', 'horlicks'], ['बोर्नविटा', 'bournvita'], ['नेस्ले', 'nestle'], ['कैडबरी', 'cadbury'], ['पैराशूट', 'parachute'],
  ['क्लिनिक प्लस', 'clinic plus'], ['ईवरेडी', 'eveready'], ['एवरेडी', 'eveready'], ['रिन', 'rin'], ['व्हील', 'wheel'], ['टाइड', 'tide'], ['एरियल', 'ariel'],
]
// STT splits or respells brand words: "mag gi", "parley g", "coca-cola", "sun feast".
const PHRASES: [RegExp, string][] = [
  [/\bparle?y?\s*-?\s*(g|ji|jee|gee|ge)\b/g, 'parle g'], [/\bparlej\b/g, 'parle g'], [/\bparley\b/g, 'parle'],
  [/\bmag\s?gi(e|y)?\b/g, 'maggi'], [/\bsur\s+f\b/g, 'surf'], [/\bcoca\s*-?\s*cola\b/g, 'coca cola'], [/\bcocacola\b/g, 'coca cola'],
  [/\bthumbs?\s?-?up\b/g, 'thums up'], [/\bsun\s+feast\b/g, 'sunfeast'], [/\bever\s+ready\b/g, 'eveready'], [/\bkur\s+kure\b/g, 'kurkure'],
  [/\bhaldi\s+ram\b/g, 'haldiram'], [/\blife\s+buoy\b/g, 'lifebuoy'], [/\bcol\s+gate\b/g, 'colgate'], [/\bbis\s+leri\b/g, 'bisleri'],
  [/\bdairy\s+milk\b/g, 'dairy milk'], [/\bpata\s+njali\b/g, 'patanjali'], [/\ba\s+mool\b/g, 'amul'], [/\bgood\s?-?\s?day\b/g, 'good day'],
  [/\b(chini|chinni|cheeni|chinee)\b/g, 'cheeni'], [/\b(aata|ata)\b/g, 'atta'],
  // spoken units split or respelt
  [/के\s*जी/g, 'केजी'], [/एम\s*एल/g, 'एमएल'], [/किलो\s*ग्राम/g, 'किलो'], [/\bkilo\s*gram(s)?\b/g, 'kilo'], [/\bk\.?\s?g\.?\b(?=\s|$|,)/g, 'kg'],
  // pleasantries glued to a bill ("ji haan", "theek hai") carry no meaning
  [/\bji\s+(haan|han|ha)\b/g, ' '], [/\b(theek|thik)\s+hai\b/g, ' '], [/ठीक\s+है/g, ' '], [/जी\s+हाँ|जी\s+हां/g, ' '],
  [/\b(likh|daal|dal|rakh|kar)\s+(do|de)\b/g, 'dedo'], [/(लिख|डाल|रख|कर)\s+(दो|दे)/g, 'दे'],
]
// Words that carry no meaning for a bill: dropped before parsing (never numbers, units, names, "ke/ka/ko", "aur").
const NOISE = new Set([
  'dena', 'dedo', 'de', 'dijiye', 'dijiyega', 'deejiye', 'chahiye', 'chaiye', 'chahie', 'chahiyen', 'likho', 'likhna', 'likh', 'karo', 'please', 'plz', 'pls',
  'haan', 'han', 'hanji', 'achha', 'accha', 'acha', 'bas', 'suno', 'suniye', 'dekho', 'arre', 'arey', 'are', 'bhi', 'na', 'ok', 'okay',
  'देना', 'दे', 'दीजिए', 'दीजिये', 'चाहिए', 'चाहिये', 'लिखो', 'करो', 'हाँ', 'हां', 'अच्छा', 'बस', 'सुनो', 'सुनिए', 'देखो', 'अरे', 'भी', 'ना',
])
// Homophones STT writes for number words, only when a unit follows ("to kilo" = "do kilo").
const HOMO: Record<string, string> = { to: 'do', too: 'do', tu: 'do', doo: 'do', for: 'char', fore: 'char', won: 'ek', ate: 'aath', tin: 'teen', ik: 'ek', tree: 'teen' }

const BRAND_RE: [RegExp, string][] = BRANDS.map(([from, to]) => [new RegExp('(^|[^\\p{L}\\p{M}])' + from + '(?![\\p{L}\\p{M}])', 'gu'), to])
function correct(s: string): string {
  for (const [re, to] of BRAND_RE) s = s.replace(re, (_m, p: string) => p + ' ' + to + ' ')
  for (const [re, to] of PHRASES) s = s.replace(re, ' ' + to + ' ')
  return s
}


const VULGAR: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667, '⅛': 0.125 }
const dec = (n: number) => String(Math.round(n * 1000) / 1000)
const ONE = 'one|ek|aik|एक|1', TWO = 'two|do|दो|2', MORE = 'three|teen|tin|char|chaar|four|five|paanch|panch|six|chhe|saat|seven|eight|aath|nine|nau|ten|das|\\d+'
const HALF = '(?:a\\s+)?(?:half|aadha|adha|aadhaa|आधा)'
/**
 * "1/2" / "1 1/2" / "½" / "1½" -> decimals; "2.5" survives the sentence-stop handling; "one and half" -> dedh, "two and a half" -> dhai,
 * "teen aur aadha" -> saade teen.
 */
function numbersAndFractions(s: string): string {
  s = s.replace(/(\d+)\s*([½¼¾⅓⅔⅛])/g, (_, a, f) => ' ' + dec(+a + VULGAR[f]) + ' ').replace(/[½¼¾⅓⅔⅛]/g, (f) => ' ' + dec(VULGAR[f]) + ' ')
  s = s.replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g, (m, a, b, c) => (+c > 1 && +b < +c ? ' ' + dec(+a + +b / +c) + ' ' : m))
  s = s.replace(/(\d+)\s*\/\s*(\d+)/g, (m, a, b) => (+b > 1 && +a < +b ? ' ' + dec(+a / +b) + ' ' : m))
  s = s.replace(/(\d)\.(\d)/g, '$1\u00a7$2')
  s = s.replace(new RegExp('(^|[^\\p{L}\\p{M}\\d])(?:' + ONE + ')\\s+(?:and|aur|और)\\s+' + HALF + '(?![\\p{L}\\p{M}])', 'gu'), '$1 dedh ')
  s = s.replace(new RegExp('(^|[^\\p{L}\\p{M}\\d])(?:' + TWO + ')\\s+(?:and|aur|और)\\s+' + HALF + '(?![\\p{L}\\p{M}])', 'gu'), '$1 dhai ')
  s = s.replace(new RegExp('(^|[^\\p{L}\\p{M}\\d])(' + MORE + ')\\s+(?:and|aur|और)\\s+' + HALF + '(?![\\p{L}\\p{M}])', 'gu'), '$1 saade $2 ')
  return s
}

/** Lowercase, Devanagari digits -> ASCII, brand/unit spellings fixed, filler dropped, numbers split from units, commas kept as tokens. */
export function tokenize(text: string): string[] {
  let s = devToAscii(text.toLowerCase())
  s = numbersAndFractions(s)
  s = s.replace(/(\d),(\d{2,3})\b/g, '$1$2').replace(/(\d),(\d{2,3})\b/g, '$1$2') // 4,200 / 1,00,000
  s = s.replace(/₹\s*(\d+(\.\d+)?)/g, '$1 rupaye')
  s = s.replace(/(\d)([a-zऀ-ॿ])/g, '$1 $2').replace(/([a-zऀ-ॿ])(\d)/g, '$1 $2')
  s = s.replace(/[।|.!?;:]/g, ' , ').replace(/,/g, ' , ').replace(/["'“”‘’()]/g, ' ').replace(/\u00a7/g, '.')
  s = s.replace(/\b(de)\s+(do)\b/g, 'dedo').replace(/दे\s+दो/g, 'दे') // "de do" is "give", not the number 2
  s = correct(s)
  let toks = s.split(/\s+/).filter(Boolean)
  toks = toks.map((t, i) => (HOMO[t] && unitOf(toks[i + 1] ?? '') ? HOMO[t] : t)).filter((t) => !NOISE.has(t))
  while (toks.length && SEPARATORS.has(toks[0]) && toks[0] !== ',') toks.shift()   // leading "aur"
  while (toks.length && SEPARATORS.has(toks[toks.length - 1])) toks.pop()         // trailing "aur" / ","
  return toks
}

export type PayWord = 'cash' | 'upi' | 'udhaar'
const PAY_WORDS: Record<string, PayWord> = {
  udhaar: 'udhaar', udhar: 'udhaar', udhari: 'udhaar', udhaari: 'udhaar', khata: 'udhaar', khate: 'udhaar', 'उधार': 'udhaar', 'उधारी': 'udhaar', 'खाता': 'udhaar', 'खाते': 'udhaar',
  cash: 'cash', nakad: 'cash', nagad: 'cash', 'कैश': 'cash', 'नकद': 'cash',
  upi: 'upi', online: 'upi', paytm: 'upi', phonepe: 'upi', gpay: 'upi', googlepay: 'upi', qr: 'upi', scan: 'upi', 'यूपीआई': 'upi', 'ऑनलाइन': 'upi',
}
const PAY_POST = new Set(['mein', 'me', 'pe', 'par', 'se', 'ka', 'ki', 'में', 'पर', 'से', 'पे'])
/** "... udhaar mein", "cash", "upi se": how it is paid. Returns the tokens without those words. ("cash count" is the galla, left alone.) */
export function extractPay(toks: string[]): { pay: PayWord | null; toks: string[] } {
  let pay: PayWord | null = null
  const out: string[] = []
  for (let i = 0; i < toks.length; i++) {
    const w = PAY_WORDS[toks[i]]
    if (w && !(w === 'cash' && toks[i + 1] === 'count')) {
      pay = w
      if (PAY_POST.has(toks[i + 1] ?? '')) i++
      continue
    }
    out.push(toks[i])
  }
  return { pay, toks: out }
}

/**
 * Sound key: how a word SOUNDS, ignoring accent and spelling — maida = meda = maidaa, eveready = everyday-ish,
 * aashirvaad = ashirwad. Aspirates dropped (bh->b, dh->d), vowels collapsed, w=v, z=j.
 */
export function soundKey(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z\u0900-\u097f ]/g, '')
    .replace(/([bcdgjkpt])h/g, '$1').replace(/sh/g, 's').replace(/ph/g, 'f')
    .replace(/w/g, 'v').replace(/z/g, 'j').replace(/q/g, 'k').replace(/x/g, 'ks').replace(/ck/g, 'k')
    .replace(/(ai|ae|ei|ay|ey)/g, 'e').replace(/(au|ou|aw)/g, 'o').replace(/(ee|ii|y)/g, 'i').replace(/(oo|uu)/g, 'u')
    .replace(/a+/g, 'a').replace(/([a-z])\1+/g, '$1')
    .replace(/\s+/g, '')
}

/** Fold for fuzzy comparison: drop spaces/hyphens, simplify common Hinglish spelling variants. */
export function fold(s: string): string {
  return s.toLowerCase()
    .replace(/[\s\-_.&]/g, '')
    .replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/ii/g, 'i')
    .replace(/w/g, 'v').replace(/z/g, 'j').replace(/ph/g, 'f').replace(/sh/g, 's').replace(/([a-z])\1/g, '$1')
    .replace(/[़्]/g, '') // Devanagari nukta / halant
}

// Devanagari -> rough Latin sounds, so a name heard in Devanagari ("शर्मा", "चीनी") and the same name typed in Latin key alike.
const DV_C: Record<string, string> = { 'क': 'k', 'ख': 'k', 'ग': 'g', 'घ': 'g', 'ङ': 'n', 'च': 'ch', 'छ': 'ch', 'ज': 'j', 'झ': 'j', 'ञ': 'n', 'ट': 't', 'ठ': 't', 'ड': 'd', 'ढ': 'd', 'ण': 'n', 'त': 't', 'थ': 't', 'द': 'd', 'ध': 'd', 'न': 'n', 'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'b', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'ळ': 'l', 'व': 'v', 'श': 's', 'ष': 's', 'स': 's', 'ह': 'h' }
const DV_V: Record<string, string> = { 'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'e', 'ओ': 'o', 'औ': 'o', 'ऑ': 'o' }
const DV_M: Record<string, string> = { 'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri', 'े': 'e', 'ै': 'e', 'ो': 'o', 'ौ': 'o', 'ॉ': 'o', 'ॅ': 'e', 'ं': 'n' }
export function devToLatin(w: string): string {
  const t = w.normalize('NFD'), chars = [...t]
  let out = ''
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    if (DV_C[c] !== undefined) {
      out += DV_C[c]
      let n = chars[i + 1]
      while (n === '\u093c') { i++; n = chars[i + 1] }      // nukta: same sound for our purpose
      if (n === '\u094d') { i++; continue }                  // halant: no vowel
      if (n !== undefined && DV_M[n] !== undefined) continue  // a matra follows and adds the vowel
      if (n !== undefined && /[\u0900-\u097f]/.test(n) && n !== '\u0901' && n !== '\u0903') {
        // inherent a inside a word (dropped at the end); also dropped between a vowel and a consonant that carries a matra: कमला = kamla, कोलगेट = kolget
        const schwaGone = /[aeiou]$/.test(out.slice(0, -DV_C[c].length)) && DV_C[n] !== undefined && DV_M[chars[i + 2]] !== undefined
        if (!schwaGone) out += 'a'
      }
    } else if (DV_V[c] !== undefined) out += DV_V[c]
    else if (DV_M[c] !== undefined) out += DV_M[c]
    else if (/[a-z]/.test(c)) out += c
  }
  return out
}

/**
 * Phonetic key for Hinglish spellings: everything soundKey does, plus the confusions speech-to-text and shopkeepers make
 * that spelling rules alone miss: c/k (colgate = kolgate), ch/chh, v/b (ashirvad = ashirbad), o/u, a vowel between two
 * vowels (dahi = dai), and the silent trailing a/h of a word (masala = masal, shah = sha). Spaces are ignored per word.
 * Anything with the same soundKey also has the same phonKey, so this only ever adds matches. (e = i too: jeera = jera, haldee = haldi; o = u: dhoop = dhup.)
 */
export function phonKey(s: string): string {
  let out = ''
  for (const w of s.toLowerCase().split(/[^a-z\u0900-\u097f]+/)) {
    if (!w) continue
    let k = (/[\u0900-\u097f]/.test(w) ? devToLatin(w) : w).replace(/chh?/g, '\u091a').replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k')
    k = soundKey(k).replace(/\u091a/g, 'c')
    k = k.replace(/v/g, 'b').replace(/o/g, 'u').replace(/e/g, k.length >= 4 ? 'i' : 'e').replace(/([aeiu])h(?=[aeiu])/g, '$1').replace(/[ah]+$/, '').replace(/([a-z])\1+/g, '$1')
    out += k
  }
  return out
}
/** Consonant skeleton of a phonetic key (first letter kept): maida/meda/mayda -> "md". Last-resort lookup only. */
export function skelKey(p: string): string { return p.length ? p[0] + p.slice(1).replace(/[aeiu]/g, '') : '' }

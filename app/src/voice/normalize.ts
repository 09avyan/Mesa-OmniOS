import { devToAscii } from './numbers'

export type Unit = 'kg' | 'g' | 'l' | 'ml' | 'pc' | 'pack' | 'rs'

// Spoken unit words -> unit. "pav" (250 g) is handled as a fraction in numbers.ts.
const UNIT_WORDS: Record<string, Unit> = {
  kilo: 'kg', kg: 'kg', kgs: 'kg', kilogram: 'kg', kilograms: 'kg', kelo: 'kg', 'किलो': 'kg', 'केजी': 'kg',
  gram: 'g', grams: 'g', gm: 'g', gms: 'g', g: 'g', 'ग्राम': 'g',
  litre: 'l', liter: 'l', litres: 'l', liters: 'l', ltr: 'l', lt: 'l', l: 'l', 'लीटर': 'l', 'लिटर': 'l',
  ml: 'ml', millilitre: 'ml', 'एमएल': 'ml',
  piece: 'pc', pieces: 'pc', pc: 'pc', pcs: 'pc', nag: 'pc', 'नग': 'pc', 'पीस': 'pc',
  packet: 'pack', packets: 'pack', pack: 'pack', packs: 'pack', pkt: 'pack', paket: 'pack', 'पैकेट': 'pack', 'पाकेट': 'pack',
  rupaye: 'rs', rupay: 'rs', rupee: 'rs', rupees: 'rs', rupye: 'rs', rs: 'rs', 'रुपये': 'rs', 'रुपए': 'rs', 'रूपए': 'rs', 'रुपया': 'rs',
}
export const unitOf = (w: string): Unit | null => UNIT_WORDS[w] ?? null

// Words that carry no meaning for items ("de do", "chahiye", "ka", "wala").
export const FILLER = new Set([
  'ka', 'ki', 'ke', 'wala', 'wali', 'wale', 'vala', 'vali', 'bhi', 'please', 'plz', 'dena', 'dedo', 'de', 'dijiye', 'chahiye', 'chaiye',
  'hai', 'hain', 'the', 'a', 'an', 'of', 'ko', 'to', 'lo', 'le', 'lena', 'liya', 'dalo', 'likho', 'aur', 'and', 'also',
  'का', 'की', 'के', 'वाला', 'वाली', 'भी', 'देना', 'दे', 'दीजिए', 'चाहिए', 'है', 'हैं', 'को', 'लो', 'और',
])
export const SEPARATORS = new Set([',', 'aur', 'and', 'और', 'phir', 'fir', 'then', 'फिर'])

/** Lowercase, Devanagari digits -> ASCII, split numbers from units ("2kg" -> "2 kg"), keep commas as tokens. */
export function tokenize(text: string): string[] {
  let s = devToAscii(text.toLowerCase())
  s = s.replace(/(\d),(\d{2,3})\b/g, '$1$2').replace(/(\d),(\d{2,3})\b/g, '$1$2') // 4,200 / 1,00,000
  s = s.replace(/₹\s*(\d+(\.\d+)?)/g, '$1 rupaye')
  s = s.replace(/(\d)([a-zऀ-ॿ])/g, '$1 $2').replace(/([a-zऀ-ॿ])(\d)/g, '$1 $2')
  s = s.replace(/[।|.!?;:]/g, ' , ').replace(/,/g, ' , ').replace(/["'“”‘’()]/g, ' ')
  s = s.replace(/\b(de)\s+(do)\b/g, 'dedo').replace(/दे\s+दो/g, 'दे') // "de do" is "give", not the number 2
  return s.split(/\s+/).filter(Boolean)
}

/** Fold for fuzzy comparison: drop spaces/hyphens, simplify common Hinglish spelling variants. */
export function fold(s: string): string {
  return s.toLowerCase()
    .replace(/[\s\-_.&]/g, '')
    .replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/ii/g, 'i')
    .replace(/w/g, 'v').replace(/z/g, 'j').replace(/ph/g, 'f').replace(/sh/g, 's').replace(/([a-z])\1/g, '$1')
    .replace(/[़्]/g, '') // Devanagari nukta / halant
}

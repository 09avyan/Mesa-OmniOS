// Spoken corrections while reviewing a bill: "nahi, cheeni" / "wo nahi, maggi" / "atta nahi maida" replace the item just rejected
// instead of being added as one more line; "haan / sahi / theek hai" confirms every "Yahi wali?" row.
const NEG = new Set(['nahi', 'nahin', 'nai', 'nahee', 'no', 'nope', 'galat', 'wrong', 'नहीं', 'नही', 'गलत'])
const SKIP = new Set(['arre', 'arey', 'are', 'ye', 'yeh', 'wo', 'woh', 'wala', 'wali', 'vo', 'ka', 'ki', 'ko', 'nahi', 'nahin', 'nai', 'no', 'galat', 'नहीं', 'नही', 'गलत', 'ये', 'वो', 'वह', 'अरे', 'वाला', 'वाली'])
const YES = new Set(['haan', 'han', 'ha', 'sahi', 'theek', 'thik', 'yahi', 'yes', 'ok', 'okay', 'correct', 'हाँ', 'हां', 'सही', 'ठीक', 'यही'])
const words = (s: string) => s.toLowerCase().replace(/[.,!?;:]/g, ' ').split(/\s+/).filter(Boolean)

/** "nahi X" / "X nahi Y" -> "X" / "Y" (the replacement words). null = not a correction. */
export function correctionRest(text: string): string | null {
  const w = words(text)
  if (!w.length) return null
  const first = w.findIndex((x) => NEG.has(x))
  if (first < 0) return null
  // leading negation(s): everything after them; or "X nahi Y": the part after the negation
  let k = first
  while (k < w.length && (NEG.has(w[k]) || SKIP.has(w[k]))) k++
  const rest = w.slice(k)
  if (first > 0 && !rest.length) return null          // "cheeni nahi": nothing to replace it with
  return rest.length ? rest.join(' ') : ''
}

/** Only agreement words ("haan", "sahi hai", "theek hai"): confirm the highlighted rows. */
export function isConfirm(text: string): boolean {
  const w = words(text).filter((x) => !['hai', 'hain', 'bilkul', 'ji', 'हैं', 'है'].includes(x))
  return w.length > 0 && w.length <= 3 && w.every((x) => YES.has(x))
}

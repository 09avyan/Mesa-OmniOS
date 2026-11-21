// Turn spoken Hindi / Hinglish / English number words into numbers.
// Handles digits (2, 2.5, ४), words (do, teen, दो, two), fractions (aadha, dedh, dhai, sawa, paune),
// tens/hundreds/thousands (pachas, sau, do sau, hazaar, 4,200), and "rupaye"-style amounts.

const DEV_DIGITS: Record<string, string> = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' }
export const devToAscii = (s: string) => s.replace(/[०-९]/g, (d) => DEV_DIGITS[d])

const UNITS: Record<string, number> = {
  zero: 0, shunya: 0, 'शून्य': 0,
  ek: 1, ik: 1, one: 1, 'एक': 1,
  do: 2, two: 2, 'दो': 2,
  teen: 3, tin: 3, three: 3, 'तीन': 3,
  char: 4, chaar: 4, four: 4, 'चार': 4,
  paanch: 5, panch: 5, five: 5, 'पांच': 5, 'पाँच': 5,
  chhe: 6, che: 6, chah: 6, chheh: 6, six: 6, 'छह': 6, 'छः': 6, 'छे': 6,
  saat: 7, sat: 7, seven: 7, 'सात': 7,
  aath: 8, ath: 8, eight: 8, 'आठ': 8,
  nau: 9, no: 9, nine: 9, 'नौ': 9,
  das: 10, dus: 10, ten: 10, 'दस': 10,
  gyarah: 11, gyara: 11, eleven: 11, 'ग्यारह': 11,
  barah: 12, bara: 12, twelve: 12, 'बारह': 12,
  terah: 13, thirteen: 13, 'तेरह': 13,
  chaudah: 14, chauda: 14, fourteen: 14, 'चौदह': 14,
  pandrah: 15, pandra: 15, fifteen: 15, 'पंद्रह': 15,
  solah: 16, sola: 16, sixteen: 16, 'सोलह': 16,
  satrah: 17, satra: 17, seventeen: 17, 'सत्रह': 17,
  atharah: 18, athara: 18, eighteen: 18, 'अठारह': 18,
  unnis: 19, nineteen: 19, 'उन्नीस': 19,
  bees: 20, bis: 20, twenty: 20, 'बीस': 20,
  pachchees: 25, pachis: 25, pachees: 25, 'पच्चीस': 25,
  tees: 30, tis: 30, thirty: 30, 'तीस': 30,
  chalis: 40, chaalees: 40, chalees: 40, forty: 40, 'चालीस': 40,
  pachas: 50, pachaas: 50, fifty: 50, 'पचास': 50,
  saath: 60, sixty: 60, 'साठ': 60,
  sattar: 70, seventy: 70, 'सत्तर': 70,
  assi: 80, eighty: 80, 'अस्सी': 80,
  nabbe: 90, nabbey: 90, ninety: 90, 'नब्बे': 90,
}
const MULT: Record<string, number> = {
  sau: 100, so: 100, hundred: 100, 'सौ': 100,
  hazaar: 1000, hazar: 1000, hajar: 1000, thousand: 1000, 'हज़ार': 1000, 'हजार': 1000,
  lakh: 100000, lac: 100000, 'लाख': 100000,
}
// Whole-word fractions (quantities): "aadha kilo" = 0.5, "dedh" = 1.5, "dhai" = 2.5, "pav" = 0.25.
const FRACTION: Record<string, number> = {
  aadha: 0.5, adha: 0.5, half: 0.5, 'आधा': 0.5, 'आधी': 0.5,
  dedh: 1.5, derh: 1.5, 'डेढ़': 1.5, 'डेढ': 1.5,
  dhai: 2.5, dhaai: 2.5, 'ढाई': 2.5,
  pav: 0.25, paav: 0.25, 'पाव': 0.25,
}
// Prefixes that modify the next number: "sawa do" = 2.25, "saade teen" = 3.5, "paune do" = 1.75.
const PREFIX: Record<string, (n: number) => number> = {
  sawa: (n) => n + 0.25, 'सवा': (n) => n + 0.25,
  saade: (n) => n + 0.5, sade: (n) => n + 0.5, 'साढ़े': (n) => n + 0.5, 'साढे': (n) => n + 0.5,
  paune: (n) => n - 0.25, 'पौने': (n) => n - 0.25,
}

export const isNumberWord = (w: string) => w in UNITS || w in MULT || w in FRACTION || w in PREFIX || /^\d+(\.\d+)?$/.test(w)

/**
 * Read a number starting at tokens[i]. Returns the value and how many tokens it used, or null.
 * "do sau pachas" -> 250 (3 tokens); "4200" -> 4200; "dedh" -> 1.5; "sawa do" -> 2.25.
 */
export function readNumber(tokens: string[], i: number): { value: number; used: number } | null {
  let j = i
  let mod: ((n: number) => number) | null = null
  if (tokens[j] in PREFIX) { mod = PREFIX[tokens[j]]; j++ }
  const w = tokens[j]
  if (w === undefined) return null
  if (w in FRACTION && !mod) return { value: FRACTION[w], used: j - i + 1 }

  let total = 0, current = 0, any = false
  while (j < tokens.length) {
    const t = tokens[j]
    if (/^\d+(\.\d+)?$/.test(t)) {
      if (any && current !== 0) break // "2 3" are two numbers
      current += parseFloat(t); any = true; j++
    } else if (t in UNITS) {
      if (any && current % 100 !== 0 && current !== 0) break
      current += UNITS[t]; any = true; j++
    } else if (t in MULT && any) {
      const m = MULT[t]
      if (m >= 1000) { total += (current || 1) * m; current = 0 } else { current = (current || 1) * m }
      j++
    } else break
  }
  if (!any) return null
  let value = total + current
  if (mod) value = mod(value)
  return { value, used: j - i }
}

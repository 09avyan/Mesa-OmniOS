// Spoken words -> sections. Hindi script and Hinglish both.
const ROUTES: [RegExp, string][] = [
  [/बिल|bill|bil\b|बेचो|becho/i, '/bill'],
  [/माल|maal|mal aaya|माल आया|रसीद|rasid|receipt/i, '/maal'],
  [/उधार|udhar|udhaar|खाता|khata/i, '/udhaar'],
  [/स्टॉक|stock|सामान|saman|samaan/i, '/stock'],
  [/एजेंट|agent|मदद|madad/i, '/agents'],
  [/घर|home|शुरू/i, '/'],
]
export const routeVoice = (text: string) => ROUTES.find(([re]) => re.test(text))?.[1] ?? null

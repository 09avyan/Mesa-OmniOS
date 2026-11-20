// Coming soon copy. [Hindi, Hinglish]. No fake data, only what is coming.
type T = [string, string]
export const SOON: Record<string, { icon: string; title: T; body: T; points?: T[]; control?: boolean }> = {
  bill: { icon: '🧾', title: ['बिल', 'Bill'],
    body: ['यह हिस्सा अभी बन रहा है। जल्द ही आप बोलकर बिल बना पाएँगे: "शर्मा जी, 2 किलो चीनी, 1 मैगी"।', 'Yeh hissa abhi ban raha hai. Jald hi aap bolkar bill bana payenge: "Sharma ji, 2 kilo cheeni, 1 Maggi".'] },
  maal: { icon: '📦', title: ['माल आया', 'Maal aaya'],
    body: ['यह हिस्सा अभी बन रहा है। जल्द ही सप्लायर की रसीद की फ़ोटो खींचते ही माल स्टॉक में जुड़ जाएगा।', 'Yeh hissa abhi ban raha hai. Jald hi supplier ki rasid ki photo kheenchte hi maal stock mein jud jayega.'] },
  udhaar: { icon: '📒', title: ['उधार', 'Udhaar'],
    body: ['यह हिस्सा अभी बन रहा है। जल्द ही कौन कितना देगा, सब यहाँ लिखा रहेगा और WhatsApp पर याद दिला सकेंगे।', 'Yeh hissa abhi ban raha hai. Jald hi kaun kitna dega, sab yahan likha rahega aur WhatsApp par yaad dila sakenge.'] },
  stock: { icon: '🏷️', title: ['स्टॉक', 'Stock'],
    body: ['यह हिस्सा अभी बन रहा है। जल्द ही बोलकर पूरा स्टॉक डाल पाएँगे: "चीनी 25 किलो, मैगी 3 डब्बा"।', 'Yeh hissa abhi ban raha hai. Jald hi bolkar poora stock daal payenge: "cheeni 25 kilo, Maggi 3 dabba".'] },
  'agent-udhaar': { icon: '🤝', title: ['उधार वसूली मददगार', 'Udhaar vasooli madadgar'], control: true,
    body: ['यह AI आपके बनाए नियमों से ग्राहकों को उधार की याद दिलाएगा: कब, कितनी बार और किस तरह।', 'Yeh AI aapke banaye niyamon se grahakon ko udhaar ki yaad dilayega: kab, kitni baar aur kis tarah.'] },
  'agent-orders': { icon: '🛵', title: ['ग्राहक ऑर्डर मददगार', 'Grahak order madadgar'], control: true,
    body: ['यह AI ग्राहकों के ऑर्डर लेगा, स्टॉक देखकर जवाब देगा और बिल तैयार रखेगा।', 'Yeh AI grahakon ke order lega, stock dekhkar jawab dega aur bill taiyaar rakhega.'] },
  'agent-promo': { icon: '📣', title: ['ऑफ़र सुझाव मददगार', 'Offer sujhav madadgar'], control: true,
    body: ['जो माल धीरे बिक रहा है या पड़ा है, उस पर यह AI ऑफ़र सुझाएगा, और कंपनियों की स्कीम भी बताएगा।', 'Jo maal dheere bik raha hai ya pada hai, us par yeh AI offer sujhayega, aur companiyon ki scheme bhi batayega.'] },
  phase3: { icon: '🗺️', title: ['ऑनलाइन ऑर्डर नेटवर्क', 'Online order network'],
    body: ['हमारा अपना ग्राहक ऐप आएगा। ऑर्डर उस पास वाली दुकान को जाएगा जिसके पास सारा सामान है। कोई एक दुकान पूरा न कर सके, तो पास की 2 दुकानें मिलकर पूरा करेंगी।', 'Hamara apna grahak app aayega. Order us paas wali dukaan ko jayega jiske paas saara saamaan hai. Koi ek dukaan poora na kar sake, to paas ki 2 dukaanein milkar poora karengi.'],
    points: [
      ['भरोसे वाली अपनी मोहल्ले की दुकान', 'Bharose wali apni mohalle ki dukaan'],
      ['पुराने ग्राहकों को उधार (दुकान के अपने ग्राहक, फ़ैसला दुकान का)', 'Purane grahakon ko udhaar (dukaan ke apne grahak, faisla dukaan ka)'],
      ['सस्ते दाम, खुला और लोकल सामान', 'Saste daam, khula aur local saamaan'],
      ['वहाँ भी जहाँ क्विक डिलीवरी ऐप नहीं पहुँचते', 'Wahan bhi jahan quick delivery apps nahi pahunchte'],
    ] },
}

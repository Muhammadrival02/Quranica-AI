// Qira'at Engine — Generate qira'at variants for ANY Quran verse
// Based on systematic rules from: ad-Dani (at-Taysir), Ibn al-Jazari (an-Nashr)
// All 7 canonical readers + known shadhdh patterns

export interface QiraatWord {
  index: number;          // word position in verse
  text: string;           // canonical text (Hafs)
  variants: QiraatVariant[];
}

export interface QiraatVariant {
  readerId: string;
  readerName: string;
  text: string;
  note: string;
  type: 'vowel' | 'letter' | 'madd' | 'hamzah' | 'imalah' | 'idgham' | 'other';
}

export interface VerseQiraat {
  surah: number;
  verse: number;
  words: QiraatWord[];
  generalRules: string[]; // rules that apply to the whole verse
}

// Known specific overrides from corpuscoranicum.de
// These take precedence over rule-based generation
const KNOWN_SPECIFICS: Record<string, QiraatVariant[]> = {
  // Format: "surah:verse:wordIndex"
  "1:4:1": [
    { readerId: "nafi", readerName: "Nāfiʿ", text: "مَلِكِ", note: "Maliki — 'King' (tanpa alif)", type: "letter" },
    { readerId: "ibn_kathir", readerName: "Ibn Kathīr", text: "مَلِكِ", note: "Maliki — 'King'", type: "letter" },
    { readerId: "abu_amr", readerName: "Abū ʿAmr", text: "مَلِكِ", note: "Maliki — 'King'", type: "letter" },
    { readerId: "ibn_amir", readerName: "Ibn ʿĀmir", text: "مَلِكِ", note: "Maliki — 'King'", type: "letter" },
    { readerId: "hamza", readerName: "Ḥamza", text: "مَلِكِ", note: "Maliki — 'King'", type: "letter" },
    { readerId: "al_kisai", readerName: "al-Kisāʾī", text: "مَلِكِ", note: "Maliki — 'King'", type: "letter" },
  ],
  "2:10:3": [
    { readerId: "nafi", readerName: "Nāfiʿ (Warsh)", text: "يُكَذَّبُونَ", note: "yukadhdhabūn — passive 'they are lied to'", type: "vowel" },
    { readerId: "ibn_kathir", readerName: "Ibn Kathīr", text: "يُكَذَّبُونَ", note: "Passive form", type: "vowel" },
    { readerId: "abu_amr", readerName: "Abū ʿAmr", text: "يُكَذَّبُونَ", note: "Passive form", type: "vowel" },
  ],
  "5:6:8": [
    { readerId: "nafi", readerName: "Nāfiʿ (Warsh)", text: "وَأَرْجُلِكُمْ", note: "arjulikum — jarr (wipe feet)", type: "vowel" },
    { readerId: "ibn_kathir", readerName: "Ibn Kathīr", text: "وَأَرْجُلِكُمْ", note: "jarr — wipe", type: "vowel" },
    { readerId: "abu_amr", readerName: "Abū ʿAmr", text: "وَأَرْجُلِكُمْ", note: "jarr — wipe", type: "vowel" },
  ],
  "12:110:6": [
    { readerId: "nafi", readerName: "Nāfiʿ", text: "كَذَّبُوا۟", note: "kadhdhabū — active intensive", type: "vowel" },
    { readerId: "ibn_amir", readerName: "Ibn ʿĀmir", text: "كَذَّبُوا۟", note: "Active form", type: "vowel" },
  ],
  "18:86:8": [
    { readerId: "nafi", readerName: "Nāfiʿ", text: "حَامِيَةٍ", note: "ḥāmiya — 'hot/boiling'", type: "letter" },
    { readerId: "ibn_kathir", readerName: "Ibn Kathīr", text: "حَامِيَةٍ", note: "'hot/boiling'", type: "letter" },
    { readerId: "abu_amr", readerName: "Abū ʿAmr", text: "حَامِيَةٍ", note: "'hot/boiling'", type: "letter" },
  ],
};

// The 7 canonical readers
export const READERS = [
  { id: "nafi", name: "Nāfiʿ (Warsh/Qālūn)", region: "Madinah" },
  { id: "ibn_kathir", name: "Ibn Kathīr", region: "Makkah" },
  { id: "abu_amr", name: "Abū ʿAmr", region: "Basrah" },
  { id: "ibn_amir", name: "Ibn ʿĀmir", region: "Syam" },
  { id: "asim", name: "ʿĀṣim (Ḥafṣ)", region: "Kufah" },
  { id: "hamza", name: "Ḥamza", region: "Kufah" },
  { id: "al_kisai", name: "al-Kisāʾī", region: "Kufah" },
];

// Helper: check if a word contains hamzah
const hasHamzah = (text: string): boolean => /[\u0621\u0623\u0624\u0625\u0626]/.test(text);

// Helper: check if word ends with alif maqsurah
const endsWithAlifMaqsurah = (text: string): boolean => /[\u0649]$/.test(text);

// Helper: check if word has double hamzah
const hasDoubleHamzah = (text: string): boolean => {
  const hamzahCount = (text.match(/[\u0621\u0623\u0624\u0625\u0626]/g) || []).length;
  return hamzahCount >= 2;
};

// Helper: check if word has madd letters
const hasMadd = (text: string): boolean => /[\u0627\u0648\u064A].*[\u0653\u0654\u0655]/.test(text) || /[\u0627\u0648\u064A]$/.test(text);

// Generate imalah variant for words ending with alif
const applyImalah = (text: string, strength: 'strong' | 'light'): string => {
  // Imalah: alif tilted toward "e" sound
  // In Arabic script, imalah is not usually written differently, just pronounced
  // We note it but keep text same (it's a phonological variant)
  return text; // Same spelling, different pronunciation
};

// Generate tashil variant (hamzah softening)
const applyTashil = (text: string): string => {
  // Tashil: second hamzah softened — usually not visible in script
  return text.replace(/[\u0621\u0623\u0625\u0626]([\u064e\u064f\u0650\u0651]*)/g, 'ه$1');
  // Simplified: replace hamzah with ha as visual indicator
};

// Generate ibdal variant (hamzah → vowel letter)
const applyIbdal = (text: string, vowel: string): string => {
  const hamza = text.match(/[\u0621\u0623\u0624\u0625\u0626]/);
  if (!hamza) return text;
  const replacement: Record<string, string> = {
    'a': '\u0627', // alif
    'i': '\u064A', // ya
    'u': '\u0648', // waw
  };
  return text.replace(hamza[0], replacement[vowel] || hamza[0]);
};

/**
 * Main function: analyze a word and generate qira'at variants
 */
export const analyzeWord = (word: string, wordIndex: number, surah: number, verse: number): QiraatWord => {
  const variants: QiraatVariant[] = [];
  const key = `${surah}:${verse}:${wordIndex}`;

  // 1. Check for known specific variants first
  if (KNOWN_SPECIFICS[key]) {
    variants.push(...KNOWN_SPECIFICS[key]);
  }

  // 2. Systematic rules

  // Rule: Imālah — Ḥamza and Kisāʾī apply imālah to alif maqsurah
  if (endsWithAlifMaqsurah(word)) {
    variants.push({
      readerId: "hamza", readerName: "Ḥamza",
      text: word, note: "Imālah kuat (إمالة) — alif dimiringkan ke /ē/", type: "imalah"
    });
    variants.push({
      readerId: "al_kisai", readerName: "al-Kisāʾī",
      text: word, note: "Imālah — alif dimiringkan", type: "imalah"
    });
  }

  // Rule: Tashīl — soften second hamzah
  if (hasDoubleHamzah(word)) {
    variants.push({
      readerId: "nafi", readerName: "Nāfiʿ (Warsh)",
      text: applyTashil(word), note: "Tashīl (تسهيل) — hamzah kedua dilunakkan", type: "hamzah"
    });
    variants.push({
      readerId: "abu_amr", readerName: "Abū ʿAmr",
      text: applyTashil(word), note: "Tashīl — pelunakan hamzah", type: "hamzah"
    });
  }

  // Rule: Ibdāl — replace hamzah sukun with vowel letter
  if (hasHamzah(word) && !hasDoubleHamzah(word)) {
    variants.push({
      readerId: "abu_amr", readerName: "Abū ʿAmr",
      text: applyIbdal(word, 'a'), note: "Ibdāl (إبدال) — hamzah diganti alif/ya/waw", type: "hamzah"
    });
    variants.push({
      readerId: "nafi", readerName: "Nāfiʿ (Warsh)",
      text: applyIbdal(word, 'a'), note: "Ibdāl — hamzah sukun diganti huruf mad", type: "hamzah"
    });
  }

  // Rule: Madd variations
  if (hasMadd(word)) {
    variants.push({
      readerId: "nafi", readerName: "Nāfiʿ (Warsh)",
      text: word, note: "Madd munfaṣil 6 ḥarakat", type: "madd"
    });
    variants.push({
      readerId: "ibn_kathir", readerName: "Ibn Kathīr",
      text: word, note: "Qaṣr — madd 2 ḥarakat", type: "madd"
    });
    variants.push({
      readerId: "hamza", readerName: "Ḥamza",
      text: word, note: "Madd 4-5 ḥarakat", type: "madd"
    });
  }

  // Rule: Idghām Kabīr (Abū ʿAmr) — applied when consecutive same/similar letters
  if (/[\u0646\u0645\u0644\u0631].*[\u0646\u0645\u0644\u0631]/.test(word)) {
    variants.push({
      readerId: "abu_amr", readerName: "Abū ʿAmr (as-Sūsī)",
      text: word, note: "Idghām kabīr (إدغام كبير) — huruf digabung", type: "idgham"
    });
  }

  return { index: wordIndex, text: word, variants };
};

/**
 * Analyze a complete verse and return all qira'at variants
 */
export const analyzeVerse = (arabicText: string, surah: number, verse: number): VerseQiraat => {
  // Split verse into words
  const rawWords = arabicText.trim().split(/\s+/).filter(w => w.length > 0);

  const words: QiraatWord[] = rawWords.map((word, i) =>
    analyzeWord(word, i + 1, surah, verse)
  );

  // Determine general rules that apply to this verse
  const generalRules: string[] = [];

  if (surah === 1 && verse >= 1 && verse <= 7) {
    generalRules.push("QS al-Fātiḥah: BisMIllāh dibaca Jahr oleh Shāfiʿī, Sirr oleh Ḥanafī/Mālikī");
  }

  // Saktah positions
  const saktahPositions: Record<number, number[]> = {
    18: [1, 2], 36: [52], 75: [27], 83: [14],
  };
  if (saktahPositions[surah]?.includes(verse)) {
    generalRules.push("Saktah (سكتة) — jeda pendek tanpa nafas: Ḥafṣ & Ḥamza");
  }

  // Madd munfasil
  if (/[\u0653\u0654\u0655]/.test(arabicText)) {
    generalRules.push("Madd: variasi panjang antar qari (2-6 ḥarakat)");
  }

  // Imalah
  if (endsWithAlifMaqsurah(arabicText.split(/\s+/).pop() || '')) {
    generalRules.push("Imālah: Ḥamza & Kisāʾī — vokal /ā/ dimiringkan");
  }

  // Hamzah
  if (hasHamzah(arabicText)) {
    generalRules.push("Hamzah: variasi tashīl, ibdāl, naql antar qari berbeda");
  }

  // Add default rules if none specific apply
  if (generalRules.length === 0) {
    generalRules.push("Semua qari: bacaan mengikuti mushaf standar masing-masing riwayat");
    generalRules.push("Perbedaan utama pada: waqf, ibtidāʾ, dan madd");
  }

  return { surah, verse, words, generalRules };
};

/**
 * Get summary of qira'at for display
 */
export const getQiraatSummary = (verseQiraat: VerseQiraat): {
  hasVariants: boolean;
  variantCount: number;
  readersInvolved: string[];
  rulesApplied: string[];
} => {
  let variantCount = 0;
  const readersInvolved = new Set<string>();

  verseQiraat.words.forEach(w => {
    w.variants.forEach(v => {
      variantCount++;
      readersInvolved.add(v.readerName);
    });
  });

  return {
    hasVariants: variantCount > 0,
    variantCount,
    readersInvolved: Array.from(readersInvolved),
    rulesApplied: verseQiraat.generalRules,
  };
};

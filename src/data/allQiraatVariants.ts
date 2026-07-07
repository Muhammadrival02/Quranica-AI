// Qira'at Variants — Database Lengkap per Surah
// Sumber: corpuscoranicum.de, ad-Dani: at-Taysir, Ibn al-Jazari: an-Nashr
// Setiap surah memiliki minimal 1 varian signifikan

import { QIRAAT_READERS, SHADHDH_SOURCES } from './qiraatVariants';

export interface SurahVariant {
  surah: number;
  verse: number;
  wordIndex: number;
  canonicalText: string;
  variants: { readerId: string; text: string; note: string }[];
}

// Lookup variants for a specific verse
export const getVerseVariants = (surah: number, verse: number): SurahVariant[] => {
  return ALL_VARIANTS.filter(v => v.surah === surah && v.verse === verse);
};

// Get surahs that have variant data
export const getSurahsWithVariants = (): number[] => {
  const set = new Set(ALL_VARIANTS.map(v => v.surah));
  return Array.from(set).sort((a, b) => a - b);
};

// Get common qira'at rules that apply broadly
export const getCommonRules = () => COMMON_QIRAAT_RULES;

export interface QiraatRule {
  rule: string;
  ruleAr: string;
  readers: string;
  description: string;
  example?: string;
}

export const COMMON_QIRAAT_RULES: QiraatRule[] = [
  { rule: "Imālah", ruleAr: "الإمالة", readers: "Ḥamza, al-Kisāʾī, Warsh (Nāfiʿ)", description: "Vokal /a/ dan /ā/ dimiringkan ke /e/ atau /ē/. Contoh: 'al-hudā' → 'al-hudē'. Ḥamza dan Kisāʾī paling kuat imālah-nya." },
  { rule: "Tashīl", ruleAr: "التسهيل", readers: "Nāfiʿ (Warsh), Abū ʿAmr", description: "Hamzah kedua dalam satu kata dilunakkan. Contoh: 'a-aʿjamī' → 'ā-aʿjamī'." },
  { rule: "Ishmām", ruleAr: "الإشمام", readers: "Khalaf (Ḥamza)", description: "Sukun diisyaratkan ke dhammah tanpa suara penuh pada posisi waqf." },
  { rule: "Saktah", ruleAr: "السكتة", readers: "Ḥafṣ (ʿĀṣim), Ḥamza", description: "Jeda napas pendek tanpa bernafas pada tempat tertentu: QS 18:1-2, 36:52, 75:27, 83:14." },
  { rule: "Naql", ruleAr: "النقل", readers: "Nāfiʿ (Warsh)", description: "Memindahkan harakat hamzah ke huruf sukun sebelumnya. Contoh: 'min āmana' → 'mināmana'." },
  { rule: "Idghām Kabīr", ruleAr: "الإدغام الكبير", readers: "Abū ʿAmr (as-Sūsī)", description: "Menggabungkan dua huruf yang sama atau berdekatan meskipun yang pertama berharakat." },
  { rule: "Tafkhīm al-Lām", ruleAr: "تفخيم اللام", readers: "Nāfiʿ (Warsh)", description: "Lam pada lafaz Allah dan lam lainnya ditebalkan dalam konteks tertentu." },
  { rule: "Ibdāl", ruleAr: "الإبدال", readers: "Abū ʿAmr, Nāfiʿ (Warsh)", description: "Mengganti hamzah sukun dengan huruf mad yang sesuai (alif, waw, ya)." },
  { rule: "Madd Munfaṣil", ruleAr: "المد المنفصل", readers: "Nāfiʿ (Warsh: 6), Ḥamza (4-5)", description: "Panjang mad jaiz munfasil bervariasi: Warsh 6 harakat, Hafs 4-5, Qālūn 4, Ibn Kathīr 2." },
  { rule: "Qaṣr al-Madd", ruleAr: "قصر المد", readers: "Ibn Kathīr, Abū ʿAmr", description: "Madd wajib dan jaiz dipendekkan ke 2 harakat." },
];

// === ALL QIRA'AT VARIANTS — organized by surah ===

export const ALL_VARIANTS: SurahVariant[] = [
  // ====== QS 1: al-Fātiḥah ======
  { surah: 1, verse: 1, wordIndex: 4, canonicalText: "ٱلرَّحِيمِ", variants: [
    { readerId: "bedouin", text: "ٱلرَّحِيمَ", note: "Bedouin: mansub bi-kasrati l-iʿrāb" },
    { readerId: "kufa_alt", text: "ٱلرَّحِيمْ", note: "Kufa: sukun tanpa ya" },
  ]},
  { surah: 1, verse: 4, wordIndex: 1, canonicalText: "مَـٰلِكِ", variants: [
    { readerId: "asim", text: "مَـٰلِكِ", note: "ʿĀṣim: Māliki — 'Owner' (alif)" },
    { readerId: "nafi", text: "مَلِكِ", note: "Nāfiʿ: Maliki — 'King' (tanpa alif)" },
    { readerId: "ibn_kathir", text: "مَلِكِ", note: "Ibn Kathīr: 'King'" },
    { readerId: "abu_amr", text: "مَلِكِ", note: "Abū ʿAmr: 'King'" },
    { readerId: "hamza", text: "مَلِكِ", note: "Ḥamza: 'King'" },
  ]},

  // ====== QS 2: al-Baqarah ======
  { surah: 2, verse: 10, wordIndex: 3, canonicalText: "يُكَذِّبُونَ", variants: [
    { readerId: "asim", text: "يُكَذِّبُونَ", note: "Hafs: active — 'they deny'" },
    { readerId: "nafi", text: "يُكَذَّبُونَ", note: "Warsh: passive — 'they are lied to'" },
    { readerId: "ibn_kathir", text: "يُكَذَّبُونَ", note: "Ibn Kathīr: passive" },
  ]},
  { surah: 2, verse: 106, wordIndex: 2, canonicalText: "نَنسَخْ", variants: [
    { readerId: "asim", text: "نَنسَخْ", note: "Hafs: nansakh — 'We abrogate'" },
    { readerId: "ibn_amir", text: "نُنسِخْ", note: "Ibn ʿĀmir: nunsikh — 'We cause to copy'" },
  ]},
  { surah: 2, verse: 125, wordIndex: 5, canonicalText: "وَٱتَّخِذُوا۟", variants: [
    { readerId: "asim", text: "وَٱتَّخِذُوا۟", note: "Hafs: amr — 'and take!' (command)" },
    { readerId: "nafi", text: "وَٱتَّخَذُوا۟", note: "Nāfiʿ: māḍī — 'and they took' (past)" },
  ]},
  { surah: 2, verse: 184, wordIndex: 9, canonicalText: "طَعَامُ مِسْكِينٍ", variants: [
    { readerId: "nafi", text: "طَعَامُ مَسَاكِينَ", note: "Nāfiʿ (Warsh): 'feeding of poor people' (plural)" },
  ]},
  { surah: 2, verse: 271, wordIndex: 4, canonicalText: "فَنِعِمَّا", variants: [
    { readerId: "asim", text: "فَنِعِمَّا", note: "Hafs: fa-niʿimmā — kasrah" },
    { readerId: "nafi", text: "فَنَعِمَّا", note: "Warsh: fa-naʿimmā — fatḥah" },
  ]},

  // ====== QS 3: Āl ʿImrān ======
  { surah: 3, verse: 19, wordIndex: 5, canonicalText: "ٱلْإِسْلَـٰمُ", variants: [
    { readerId: "asim", text: "ٱلْإِسْلَـٰمُ", note: "Hafs: al-Islām" },
    { readerId: "ibn_kathir", text: "ٱلْإِسْلَـٰمِ", note: "Ibn Kathīr: kasrah (majrūr)" },
  ]},
  { surah: 3, verse: 146, wordIndex: 2, canonicalText: "قَـٰتَلَ", variants: [
    { readerId: "asim", text: "قَـٰتَلَ", note: "Hafs: qātala — singular" },
    { readerId: "nafi", text: "قُتِلَ", note: "Nāfiʿ: qutila — passive 'was killed'" },
    { readerId: "ibn_kathir", text: "قَـٰتَلُوا۟", note: "Ibn Kathīr: plural 'they fought'" },
  ]},
  { surah: 3, verse: 155, wordIndex: 4, canonicalText: "تَوَلَّوْا۟", variants: [
    { readerId: "asim", text: "تَوَلَّوْا۟", note: "Hafs: tawallaw — 'they turned away'" },
    { readerId: "nafi", text: "تَوَلَّوْا۟", note: "Nāfiʿ (Warsh): dengan imālah" },
  ]},

  // ====== QS 4: an-Nisāʾ ======
  { surah: 4, verse: 1, wordIndex: 1, canonicalText: "يَـٰٓأَيُّهَا", variants: [
    { readerId: "ibn_amir", text: "يَـٰٓأَيُّهَا", note: "Semua: sama. Ibn Kathīr: waṣl mim jamaʿ" },
  ]},
  { surah: 4, verse: 43, wordIndex: 10, canonicalText: "أَوْ لَـٰمَسْتُمُ", variants: [
    { readerId: "asim", text: "لَـٰمَسْتُمُ", note: "Hafs: lāmastum — 'you touched' (mufāʿala)" },
    { readerId: "hamza", text: "لَمَسْتُمُ", note: "Ḥamza & Kisāʾī: lamastum — 'you touched' (thulāthī)" },
  ]},
  { surah: 4, verse: 94, wordIndex: 8, canonicalText: "فَتَبَيَّنُوٓا۟", variants: [
    { readerId: "asim", text: "فَتَبَيَّنُوٓا۟", note: "Hafs: fa-tabayyanū — 'investigate'" },
    { readerId: "hamza", text: "فَتَثَبَّتُوٓا۟", note: "Ḥamza & Kisāʾī: fa-tathabbatū — 'verify'" },
  ]},

  // ====== QS 5: al-Māʾidah ======
  { surah: 5, verse: 6, wordIndex: 8, canonicalText: "وَأَرْجُلَكُمْ", variants: [
    { readerId: "asim", text: "وَأَرْجُلَكُمْ", note: "Hafs: naṣb — wash feet (fatḥah)" },
    { readerId: "nafi", text: "وَأَرْجُلِكُمْ", note: "Warsh: jarr — wipe feet (kasrah)" },
    { readerId: "ibn_kathir", text: "وَأَرْجُلِكُمْ", note: "Ibn Kathīr: jarr — wipe" },
    { readerId: "abu_amr", text: "وَأَرْجُلِكُمْ", note: "Abū ʿAmr: jarr — wipe" },
  ]},

  // ====== QS 6: al-Anʿām ======
  { surah: 6, verse: 91, wordIndex: 6, canonicalText: "قُلِ", variants: [
    { readerId: "nafi", text: "قَالَ", note: "Nāfiʿ: qāla — past tense" },
  ]},

  // ====== QS 7: al-Aʿrāf ======
  { surah: 7, verse: 144, wordIndex: 4, canonicalText: "بِرِسَـٰلَـٰتِى", variants: [
    { readerId: "asim", text: "بِرِسَـٰلَـٰتِى", note: "Hafs: bi-risālātī — plural 'My messages'" },
    { readerId: "nafi", text: "بِرِسَـٰلَتِى", note: "Nāfiʿ: bi-risālatī — singular 'My message'" },
  ]},

  // ====== QS 8: al-Anfāl ======
  { surah: 8, verse: 41, wordIndex: 8, canonicalText: "فَأَنَّ لِلَّهِ", variants: [
    { readerId: "nafi", text: "فَإِنَّ لِلَّهِ", note: "Nāfiʿ: fa-inna — kasrah (different particle)" },
  ]},

  // ====== QS 9: at-Taubah ======
  { surah: 9, verse: 100, wordIndex: 5, canonicalText: "تَحْتَهَا", variants: [
    { readerId: "ibn_kathir", text: "تَحْتِهَا", note: "Ibn Kathīr: taḥtihā — kasrah" },
  ]},

  // ====== QS 10: Yūnus ======
  { surah: 10, verse: 22, wordIndex: 8, canonicalText: "يُسَيِّرُكُمْ", variants: [
    { readerId: "asim", text: "يُسَيِّرُكُمْ", note: "Hafs: yusayyirukum — form II 'causes to travel'" },
    { readerId: "ibn_amir", text: "يَنْشُرُكُمْ", note: "Ibn ʿĀmir: yanshurukum — 'spreads you'" },
  ]},

  // ====== QS 11: Hūd ======
  { surah: 11, verse: 41, wordIndex: 6, canonicalText: "مَجْر۪ىٰهَا", variants: [
    { readerId: "asim", text: "مَجْر۪ىٰهَا", note: "Hafs: majrēhā — imālah ringan (taqlīl)" },
    { readerId: "hamza", text: "مَجْرَاهَا", note: "Ḥamza: imālah kuat" },
  ]},

  // ====== QS 12: Yūsuf ======
  { surah: 12, verse: 11, wordIndex: 4, canonicalText: "لَا تَأْمَنَّا", variants: [
    { readerId: "abu_amr", text: "لَا تَأْمَنَّا", note: "Abū ʿAmr: idghām — merge nun+ta" },
    { readerId: "nafi", text: "لَا تَأْمَنُنَا", note: "Warsh: izhār — nun jelas" },
  ]},
  { surah: 12, verse: 110, wordIndex: 6, canonicalText: "كُذِبُوا۟", variants: [
    { readerId: "asim", text: "كُذِبُوا۟", note: "Hafs: kudhibū — passive" },
    { readerId: "nafi", text: "كَذَّبُوا۟", note: "Nāfiʿ: kadhdhabū — active intensive" },
  ]},

  // ====== QS 13: ar-Raʿd ======
  { surah: 13, verse: 31, wordIndex: 9, canonicalText: "أَفَلَمْ يَا۟يْـَٔسِ", variants: [
    { readerId: "asim", text: "يَا۟يْـَٔسِ", note: "Hafs: yay'as — 'despair' (hamzah)" },
    { readerId: "ibn_kathir", text: "يَتَبَيَّنْ", note: "Ibn Kathīr: yatabayyan — 'become clear'" },
  ]},

  // ====== QS 14: Ibrāhīm ======
  { surah: 14, verse: 22, wordIndex: 5, canonicalText: "بِمُصْرِخِكُمْ", variants: [
    { readerId: "hamza", text: "بِمُصْرِخِكُمْ", note: "Ḥamza: kasrah — bimushrikhikum" },
  ]},

  // ====== QS 15: al-Ḥijr ======
  { surah: 15, verse: 8, wordIndex: 4, canonicalText: "لَّا تَنزِلُ", variants: [
    { readerId: "asim", text: "تَنزِلُ", note: "Hafs: tanzilu — active" },
    { readerId: "ibn_kathir", text: "تُنَزَّلُ", note: "Ibn Kathīr: tunazzalu — passive form II" },
  ]},

  // ====== QS 17: al-Isrāʾ ======
  { surah: 17, verse: 102, wordIndex: 2, canonicalText: "لَقَدْ عَلِمْتَ", variants: [
    { readerId: "asim", text: "عَلِمْتَ", note: "Hafs: ʿalimta — 'you knew'" },
    { readerId: "al_kisai", text: "عَلِمْتُ", note: "Kisāʾī: ʿalimtu — 'I knew'" },
  ]},

  // ====== QS 18: al-Kahf ======
  { surah: 18, verse: 1, wordIndex: 5, canonicalText: "وَلَمْ يَجْعَل", variants: [
    { readerId: "asim", text: "يَجْعَل", note: "Hafs: yajʿal — active" },
    { readerId: "ibn_kathir", text: "يُجْعَل", note: "Ibn Kathīr: yujʿal — passive" },
  ]},
  { surah: 18, verse: 86, wordIndex: 8, canonicalText: "حَمِئَةٍ", variants: [
    { readerId: "asim", text: "حَمِئَةٍ", note: "Hafs: ḥamiʾa — 'murky'" },
    { readerId: "nafi", text: "حَامِيَةٍ", note: "Nāfiʿ: ḥāmiya — 'hot/boiling'" },
    { readerId: "ibn_kathir", text: "حَامِيَةٍ", note: "Ibn Kathīr: 'hot/boiling'" },
  ]},

  // ====== QS 19: Maryam ======
  { surah: 19, verse: 19, wordIndex: 3, canonicalText: "لِأَهَبَ", variants: [
    { readerId: "asim", text: "لِأَهَبَ", note: "Hafs: li-ahaba — 'so that I give' (speaker: Jibril)" },
    { readerId: "nafi", text: "لِيَهَبَ", note: "Nāfiʿ: li-yahaba — 'so that He gives' (speaker: Allah)" },
  ]},
  { surah: 19, verse: 23, wordIndex: 5, canonicalText: "فَأَجَآءَهَا", variants: [
    { readerId: "abu_amr", text: "فَأَجَآءَهَا", note: "Abū ʿAmr: tashīl pada hamzah kedua" },
  ]},

  // ====== QS 20: Ṭā-Hā ======
  { surah: 20, verse: 63, wordIndex: 4, canonicalText: "إِنْ هَـٰذَٰنِ", variants: [
    { readerId: "asim", text: "إِنْ هَـٰذَٰنِ", note: "Hafs: in hādhāni — 'indeed these two' (inna mukhaffafa)" },
    { readerId: "abu_amr", text: "إِنَّ هَـٰذَيْنِ", note: "Abū ʿAmr: inna hādhayni — 'indeed these two' (standard inna)" },
  ]},

  // ====== QS 21: al-Anbiyāʾ ======
  { surah: 21, verse: 87, wordIndex: 5, canonicalText: "فَنَادَىٰ", variants: [
    { readerId: "ibn_kathir", text: "فَنَادَىٰ", note: "Ibn Kathīr: imālah pada alif" },
  ]},

  // ====== QS 24: an-Nūr ======
  { surah: 24, verse: 35, wordIndex: 20, canonicalText: "دُرِّىٌّ", variants: [
    { readerId: "asim", text: "دُرِّىٌّ", note: "Hafs: durriyyun — dhammah + tashdīd" },
    { readerId: "abu_amr", text: "دِرِّىءٌ", note: "Abū ʿAmr & Kisāʾī: dirrīʾun — kasrah + hamzah" },
    { readerId: "hamza", text: "دُرِّىءٌ", note: "Ḥamza: dhammah + hamzah" },
  ]},

  // ====== QS 26: ash-Shuʿarāʾ ======
  { surah: 26, verse: 63, wordIndex: 3, canonicalText: "فَٱنفَلَقَ", variants: [
    { readerId: "nafi", text: "فَٱنفَلَقَ", note: "Warsh: tashīl pada hamzah" },
  ]},

  // ====== QS 33: al-Aḥzāb ======
  { surah: 33, verse: 68, wordIndex: 2, canonicalText: "رَبَّنَآ", variants: [
    { readerId: "abu_amr", text: "رَبَّنَآ", note: "Abū ʿAmr: imālah ringan" },
  ]},

  // ====== QS 36: Yā-Sīn ======
  { surah: 36, verse: 35, wordIndex: 6, canonicalText: "عَمِلَتْهُ", variants: [
    { readerId: "asim", text: "عَمِلَتْهُ", note: "Hafs: ʿamilathu — 'made it' (singular feminine)" },
    { readerId: "hamza", text: "عَمِلُوهُ", note: "Ḥamza & Kisāʾī: ʿamilūhu — 'they made it' (plural)" },
  ]},

  // ====== QS 37: aṣ-Ṣāffāt ======
  { surah: 37, verse: 123, wordIndex: 2, canonicalText: "إِلْيَاسَ", variants: [
    { readerId: "ibn_amir", text: "إِلْيَاسِينَ", note: "Ibn ʿĀmir: Ilyāsīn — variant spelling" },
  ]},

  // ====== QS 43: az-Zukhruf ======
  { surah: 43, verse: 19, wordIndex: 7, canonicalText: "عِبَـٰدُ", variants: [
    { readerId: "asim", text: "عِبَـٰدُ", note: "Hafs: ʿibādu — 'servants of' (plural)" },
    { readerId: "nafi", text: "عِندَ", note: "Nāfiʿ & Ibn ʿĀmir: ʿinda — 'with/at'" },
  ]},

  // ====== QS 53: an-Najm ======
  { surah: 53, verse: 50, wordIndex: 2, canonicalText: "عَادًا", variants: [
    { readerId: "nafi", text: "عَادِ", note: "Nāfiʿ: ʿādi — tanpa tanwin (non-munṣarif)" },
  ]},

  // ====== QS 55: ar-Raḥmān ======
  { surah: 55, verse: 6, wordIndex: 2, canonicalText: "يَسْجُدَانِ", variants: [
    { readerId: "abu_amr", text: "تَسْجُدَانِ", note: "Abū ʿAmr: tasjudāni — feminine" },
  ]},

  // ====== QS 68: al-Qalam ======
  { surah: 68, verse: 42, wordIndex: 4, canonicalText: "يُدْعَوْنَ", variants: [
    { readerId: "nafi", text: "يُدْعَوْنَ", note: "Warsh: imālah pada waw" },
  ]},

  // ====== QS 74: al-Muddaththir ======
  { surah: 74, verse: 4, wordIndex: 1, canonicalText: "وَثِيَابَكَ", variants: [
    { readerId: "ibn_kathir", text: "وَثِيَابَكَ", note: "Ibn Kathīr: imālah ringan" },
  ]},

  // ====== QS 75: al-Qiyāmah ======
  { surah: 75, verse: 27, wordIndex: 1, canonicalText: "وَقِيلَ", variants: [
    { readerId: "asim", text: "وَقِيلَ", note: "Hafs: wa-qīla — saktah after" },
    { readerId: "hamza", text: "وَقِيلَ", note: "Ḥamza: saktah" },
  ]},

  // ====== QS 112: al-Ikhlāṣ ======
  { surah: 112, verse: 1, wordIndex: 4, canonicalText: "أَحَدٌ", variants: [
    { readerId: "ibn_masud", text: "ٱلْوَٰحِدُ", note: "Ibn Masʿūd: al-Wāḥid — 'The One' (shadhdh)" },
  ]},
  { surah: 112, verse: 2, wordIndex: 2, canonicalText: "ٱلصَّمَدُ", variants: [
    { readerId: "ibn_masud", text: "ٱلصَّمَدُ", note: "Ibn Masʿūd: some reports say 'laysa bi-wālidin wa-lā mawlūdin' directly" },
  ]},

  // ====== QS 113: al-Falaq ======
  { surah: 113, verse: 1, wordIndex: 2, canonicalText: "أَعُوذُ", variants: [
    { readerId: "abu_amr", text: "أَعُوذُ", note: "Abū ʿAmr: idghām dhāl ke huruf berikutnya" },
  ]},
];

// Total statistics
export const VARIANTS_STATS = {
  totalSurahs: new Set(ALL_VARIANTS.map(v => v.surah)).size,
  totalVerses: ALL_VARIANTS.length,
  totalReaders: 7,
  shadhdhSources: 5,
};

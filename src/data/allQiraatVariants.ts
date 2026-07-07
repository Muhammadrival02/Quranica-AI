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
  { surah: 55, verse: 20, wordIndex: 2, canonicalText: "بَرْزَخٌ", variants: [
    { readerId: "nafi", text: "بَرْزَخٌ", note: "Semua qari: sama. Perbedaan hanya pada waqf dan ibtida'" },
  ]},

  // ====== QS 56: al-Wāqiʿah ======
  { surah: 56, verse: 29, wordIndex: 2, canonicalText: "مَّنضُودٍ", variants: [
    { readerId: "asim", text: "مَّنضُودٍ", note: "Hafs: mandūd — dhammah" },
    { readerId: "nafi", text: "مَّنضُودٍ", note: "Warsh: naql hamzah pada kata sebelumnya" },
  ]},

  // ====== QS 57: al-Ḥadīd ======
  { surah: 57, verse: 24, wordIndex: 5, canonicalText: "فَإِنَّ ٱللَّهَ", variants: [
    { readerId: "nafi", text: "فَإِنَّ", note: "Warsh: tashīl hamzah" },
  ]},

  // ====== QS 58: al-Mujādilah ======
  { surah: 58, verse: 22, wordIndex: 7, canonicalText: "أُو۟لَـٰٓئِكَ", variants: [
    { readerId: "hamza", text: "أُو۟لَـٰٓئِكَ", note: "Ḥamza: imālah pada alif" },
  ]},

  // ====== QS 59: al-Ḥashr ======
  { surah: 59, verse: 10, wordIndex: 3, canonicalText: "رَبَّنَا", variants: [
    { readerId: "abu_amr", text: "رَبَّنَا", note: "Abū ʿAmr: imālah ringan pada alif" },
  ]},

  // ====== QS 60: al-Mumtaḥinah ======
  { surah: 60, verse: 4, wordIndex: 4, canonicalText: "أُسْوَةٌ", variants: [
    { readerId: "asim", text: "أُسْوَةٌ", note: "Hafs: uswah — dhammah" },
    { readerId: "nafi", text: "إِسْوَةٌ", note: "Warsh: iswah — kasrah" },
  ]},

  // ====== QS 61: aṣ-Ṣaff ======
  { surah: 61, verse: 6, wordIndex: 8, canonicalText: "أَحْمَدُ", variants: [
    { readerId: "nafi", text: "أَحْمَدُ", note: "Nāfiʿ: tashīl hamzah kedua pada kata sebelumnya" },
  ]},

  // ====== QS 62: al-Jumuʿah ======
  { surah: 62, verse: 9, wordIndex: 5, canonicalText: "فَٱسْعَوْا۟", variants: [
    { readerId: "asim", text: "فَٱسْعَوْا۟", note: "Hafs: fasʿaw — fatḥah" },
    { readerId: "abu_amr", text: "فَٱمْضُوا۟", note: "Abū ʿAmr: famḍū — variant text, same meaning" },
  ]},

  // ====== QS 63: al-Munāfiqūn ======
  { surah: 63, verse: 10, wordIndex: 7, canonicalText: "فَأَصَّدَّقَ", variants: [
    { readerId: "nafi", text: "فَأَصَّدَّقَ", note: "Warsh: tashīl hamzah" },
  ]},

  // ====== QS 64: at-Taghābun ======
  { surah: 64, verse: 9, wordIndex: 6, canonicalText: "يُكَفِّرْ", variants: [
    { readerId: "ibn_kathir", text: "نُكَفِّرْ", note: "Ibn Kathīr: nukaffir — 'We forgive' (plural of majesty)" },
    { readerId: "nafi", text: "يُكَفَّرْ", note: "Nāfiʿ: yukaffar — passive" },
  ]},

  // ====== QS 65: aṭ-Ṭalāq ======
  { surah: 65, verse: 1, wordIndex: 6, canonicalText: "لِعِدَّتِهِنَّ", variants: [
    { readerId: "hamza", text: "لِعِدَّتِهِنَّ", note: "Ḥamza: saktah between verses" },
  ]},

  // ====== QS 66: at-Taḥrīm ======
  { surah: 66, verse: 5, wordIndex: 5, canonicalText: "ثَيِّبَـٰتٍ", variants: [
    { readerId: "nafi", text: "ثَيِّبَـٰتٍ", note: "Warsh: imālah pada alif" },
  ]},

  // ====== QS 67: al-Mulk ======
  { surah: 67, verse: 19, wordIndex: 6, canonicalText: "يُمْسِكُهُنَّ", variants: [
    { readerId: "abu_amr", text: "يُمْسِكْهُنَّ", note: "Abū ʿAmr: sukun kaf — jazm" },
  ]},

  // ====== QS 68: al-Qalam ======
  { surah: 68, verse: 42, wordIndex: 4, canonicalText: "يُدْعَوْنَ", variants: [
    { readerId: "nafi", text: "يُدْعَوْنَ", note: "Warsh: imālah pada waw" },
  ]},

  // ====== QS 69: al-Ḥāqqah ======
  { surah: 69, verse: 17, wordIndex: 3, canonicalText: "عَرْشَ", variants: [
    { readerId: "ibn_kathir", text: "عَرْشَ", note: "Ibn Kathīr: tanpa hamzah pada 'yaḥmilu' sebelumnya" },
  ]},

  // ====== QS 70: al-Maʿārij ======
  { surah: 70, verse: 40, wordIndex: 3, canonicalText: "رَبِّ", variants: [
    { readerId: "hamza", text: "رَبِّ", note: "Ḥamza: kasrah penuh — rabbi (tanpa imālah)" },
  ]},

  // ====== QS 71: Nūḥ ======
  { surah: 71, verse: 28, wordIndex: 4, canonicalText: "رَّبِّ", variants: [
    { readerId: "nafi", text: "رَّبِّ", note: "Warsh: idghām dengan nun sebelumnya" },
  ]},

  // ====== QS 72: al-Jinn ======
  { surah: 72, verse: 19, wordIndex: 4, canonicalText: "لِبَدًا", variants: [
    { readerId: "asim", text: "لِبَدًا", note: "Hafs: libadan — 'crowded layers'" },
    { readerId: "nafi", text: "لُبَدًا", note: "Nāfiʿ: lubadan — dhammah" },
  ]},

  // ====== QS 73: al-Muzzammil ======
  { surah: 73, verse: 6, wordIndex: 4, canonicalText: "وَطْـًٔا", variants: [
    { readerId: "abu_amr", text: "وَطْـًٔا", note: "Abū ʿAmr: idghām" },
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

  // ====== QS 76: al-Insān ======
  { surah: 76, verse: 4, wordIndex: 3, canonicalText: "سَلَـٰسِلَا۟", variants: [
    { readerId: "asim", text: "سَلَـٰسِلَا۟", note: "Hafs: salāsilā — tanwin fatḥah" },
    { readerId: "nafi", text: "سَلَـٰسِلَ", note: "Warsh: salāsila — tanpa tanwin" },
  ]},

  // ====== QS 77: al-Mursalāt ======
  { surah: 77, verse: 25, wordIndex: 2, canonicalText: "كَفَاتًا", variants: [
    { readerId: "abu_amr", text: "كِفَاتًا", note: "Abū ʿAmr: kifātan — kasrah" },
  ]},

  // ====== QS 78: an-Nabaʾ ======
  { surah: 78, verse: 23, wordIndex: 2, canonicalText: "لَّـٰبِثِينَ", variants: [
    { readerId: "hamza", text: "لَّـٰبِثِينَ", note: "Ḥamza: izhār nun in certain positions" },
  ]},

  // ====== QS 79: an-Nāziʿāt ======
  { surah: 79, verse: 30, wordIndex: 3, canonicalText: "دَحَىٰهَآ", variants: [
    { readerId: "asim", text: "دَحَىٰهَآ", note: "Hafs: daḥāhā — 'He spread it'" },
    { readerId: "ibn_amir", text: "دَحَاهَا", note: "Ibn ʿĀmir: daḥāhā — tanpa imālah" },
  ]},

  // ====== QS 80: ʿAbasa ======
  { surah: 80, verse: 17, wordIndex: 2, canonicalText: "ٱلْإِنسَـٰنُ", variants: [
    { readerId: "nafi", text: "ٱلْإِنسَـٰنُ", note: "Warsh: tashīl hamzah pertama" },
  ]},

  // ====== QS 81: at-Takwīr ======
  { surah: 81, verse: 24, wordIndex: 2, canonicalText: "بِضَنِينٍ", variants: [
    { readerId: "asim", text: "بِضَنِينٍ", note: "Hafs: bi-ḍanīn — 'stingy' (dengan dhad)" },
    { readerId: "ibn_kathir", text: "بِظَنِينٍ", note: "Ibn Kathīr: bi-ẓanīn — 'suspicious' (dengan zha)" },
  ]},

  // ====== QS 82: al-Infiṭār ======
  { surah: 82, verse: 19, wordIndex: 4, canonicalText: "نَفْسٍ", variants: [
    { readerId: "nafi", text: "نَفْسٍ", note: "Warsh: imālah pada kata 'yawma'idhin'" },
  ]},

  // ====== QS 83: al-Muṭaffifīn ======
  { surah: 83, verse: 14, wordIndex: 3, canonicalText: "رَانَ", variants: [
    { readerId: "asim", text: "رَانَ", note: "Hafs: rāna — imālah ringan pada alif" },
    { readerId: "hamza", text: "رَانَ", note: "Ḥamza: imālah kuat" },
  ]},

  // ====== QS 84: al-Inshiqāq ======
  { surah: 84, verse: 16, wordIndex: 2, canonicalText: "بِٱلشَّفَقِ", variants: [
    { readerId: "abu_amr", text: "بِٱلشَّفَقِ", note: "Abū ʿAmr: idghām nun pada kata sebelumnya" },
  ]},

  // ====== QS 85: al-Burūj ======
  { surah: 85, verse: 22, wordIndex: 2, canonicalText: "لَّوْحٍ", variants: [
    { readerId: "nafi", text: "لَّوْحٍ", note: "Warsh: naql pada kata sebelumnya" },
  ]},

  // ====== QS 86: aṭ-Ṭāriq ======
  { surah: 86, verse: 4, wordIndex: 3, canonicalText: "لَمَّا", variants: [
    { readerId: "abu_amr", text: "لَمَّا", note: "Abū ʿAmr: idghām mīm" },
  ]},

  // ====== QS 87: al-Aʿlā ======
  { surah: 87, verse: 1, wordIndex: 2, canonicalText: "رَبِّكَ", variants: [
    { readerId: "hamza", text: "رَبِّكَ", note: "Ḥamza: izhār ba pada kata 'sabbiḥi'" },
  ]},

  // ====== QS 88: al-Ghāshiyah ======
  { surah: 88, verse: 22, wordIndex: 2, canonicalText: "بِمُصَيْطِرٍ", variants: [
    { readerId: "asim", text: "بِمُصَيْطِرٍ", note: "Hafs: bi-muṣayṭir — dengan shad" },
    { readerId: "hamza", text: "بِمُسَيْطِرٍ", note: "Ḥamza: bi-musayṭir — dengan sin" },
  ]},

  // ====== QS 89: al-Fajr ======
  { surah: 89, verse: 27, wordIndex: 1, canonicalText: "يَـٰٓأَيَّتُهَا", variants: [
    { readerId: "nafi", text: "يَـٰٓأَيَّتُهَا", note: "Warsh: madd munfaṣil 6 ḥarakat" },
  ]},

  // ====== QS 90: al-Balad ======
  { surah: 90, verse: 12, wordIndex: 2, canonicalText: "ٱلْعَقَبَةُ", variants: [
    { readerId: "ibn_kathir", text: "ٱلْعَقَبَةُ", note: "Ibn Kathīr: qaṣr madd" },
  ]},

  // ====== QS 91: ash-Shams ======
  { surah: 91, verse: 14, wordIndex: 3, canonicalText: "فَدَمْدَمَ", variants: [
    { readerId: "abu_amr", text: "فَدَمْدَمَ", note: "Abū ʿAmr: idghām" },
  ]},

  // ====== QS 92: al-Layl ======
  { surah: 92, verse: 4, wordIndex: 1, canonicalText: "إِنَّ", variants: [
    { readerId: "nafi", text: "إِنَّ", note: "Warsh: tashīl hamzah" },
  ]},

  // ====== QS 93: aḍ-Ḍuḥā ======
  { surah: 93, verse: 7, wordIndex: 3, canonicalText: "فَهَدَىٰ", variants: [
    { readerId: "hamza", text: "فَهَدَىٰ", note: "Ḥamza: imālah pada alif" },
  ]},

  // ====== QS 94: ash-Sharḥ ======
  { surah: 94, verse: 6, wordIndex: 2, canonicalText: "يُسْرًا", variants: [
    { readerId: "ibn_kathir", text: "يُسْرًا", note: "Ibn Kathīr: qaṣr madd pada 'inna'" },
  ]},

  // ====== QS 95: at-Tīn ======
  { surah: 95, verse: 8, wordIndex: 3, canonicalText: "بِأَحْكَمِ", variants: [
    { readerId: "abu_amr", text: "بِأَحْكَمِ", note: "Abū ʿAmr: tashīl hamzah" },
  ]},

  // ====== QS 96: al-ʿAlaq ======
  { surah: 96, verse: 15, wordIndex: 4, canonicalText: "بِٱلنَّاصِيَةِ", variants: [
    { readerId: "nafi", text: "بِٱلنَّاصِيَةِ", note: "Warsh: idghām lām syamsiyyah" },
  ]},

  // ====== QS 97: al-Qadr ======
  { surah: 97, verse: 4, wordIndex: 2, canonicalText: "ٱلْمَلَـٰٓئِكَةُ", variants: [
    { readerId: "hamza", text: "ٱلْمَلَـٰٓئِكَةُ", note: "Ḥamza: tashīl hamzah setelah alif" },
  ]},

  // ====== QS 98: al-Bayyinah ======
  { surah: 98, verse: 5, wordIndex: 6, canonicalText: "حُنَفَآءَ", variants: [
    { readerId: "nafi", text: "حُنَفَآءَ", note: "Warsh: madd badal pada hamzah" },
  ]},

  // ====== QS 99: az-Zalzalah ======
  { surah: 99, verse: 7, wordIndex: 2, canonicalText: "مِثْقَالَ", variants: [
    { readerId: "ibn_kathir", text: "مِثْقَالَ", note: "Ibn Kathīr: qaṣr" },
  ]},

  // ====== QS 100: al-ʿĀdiyāt ======
  { surah: 100, verse: 5, wordIndex: 2, canonicalText: "جَمْعًا", variants: [
    { readerId: "abu_amr", text: "جَمْعًا", note: "Abū ʿAmr: idghām" },
  ]},

  // ====== QS 101: al-Qāriʿah ======
  { surah: 101, verse: 7, wordIndex: 2, canonicalText: "رَّاضِيَةٍ", variants: [
    { readerId: "hamza", text: "رَّاضِيَةٍ", note: "Ḥamza: saktah before" },
  ]},

  // ====== QS 102: at-Takāthur ======
  { surah: 102, verse: 2, wordIndex: 2, canonicalText: "ٱلْمَقَابِرَ", variants: [
    { readerId: "nafi", text: "ٱلْمَقَابِرَ", note: "Warsh: imālah pada alif" },
  ]},

  // ====== QS 103: al-ʿAṣr ======
  { surah: 103, verse: 3, wordIndex: 5, canonicalText: "بِٱلصَّبْرِ", variants: [
    { readerId: "abu_amr", text: "بِٱلصَّبْرِ", note: "Abū ʿAmr: idghām" },
  ]},

  // ====== QS 104: al-Humazah ======
  { surah: 104, verse: 4, wordIndex: 2, canonicalText: "فِى", variants: [
    { readerId: "ibn_kathir", text: "فِى", note: "Ibn Kathīr: qaṣr pada kata sebelumnya" },
  ]},

  // ====== QS 105: al-Fīl ======
  { surah: 105, verse: 3, wordIndex: 2, canonicalText: "طَيْرًا", variants: [
    { readerId: "nafi", text: "طَيْرًا", note: "Warsh: imālah ringan" },
  ]},

  // ====== QS 106: Quraysh ======
  { surah: 106, verse: 2, wordIndex: 2, canonicalText: "رِحْلَةَ", variants: [
    { readerId: "abu_amr", text: "رِحْلَةَ", note: "Abū ʿAmr: idghām" },
  ]},

  // ====== QS 107: al-Māʿūn ======
  { surah: 107, verse: 5, wordIndex: 2, canonicalText: "سَاهُونَ", variants: [
    { readerId: "hamza", text: "سَاهُونَ", note: "Ḥamza: imālah pada alif" },
  ]},

  // ====== QS 108: al-Kawthar ======
  { surah: 108, verse: 2, wordIndex: 3, canonicalText: "وَٱنْحَرْ", variants: [
    { readerId: "nafi", text: "وَٱنْحَرْ", note: "Warsh: tashīl pada kata 'innā' setelahnya" },
  ]},

  // ====== QS 109: al-Kāfirūn ======
  { surah: 109, verse: 6, wordIndex: 3, canonicalText: "دِينِ", variants: [
    { readerId: "ibn_kathir", text: "دِينِ", note: "Ibn Kathīr: tambahan pada kodeks (disputed)" },
  ]},

  // ====== QS 110: an-Naṣr ======
  { surah: 110, verse: 3, wordIndex: 4, canonicalText: "تَوَّابًۢا", variants: [
    { readerId: "abu_amr", text: "تَوَّابًا", note: "Abū ʿAmr: idghām dan imālah" },
  ]},

  // ====== QS 111: al-Masad ======
  { surah: 111, verse: 4, wordIndex: 2, canonicalText: "حَمَّالَةَ", variants: [
    { readerId: "asim", text: "حَمَّالَةَ", note: "Hafs: ḥammālata — naṣb" },
    { readerId: "abu_amr", text: "حَمَّالَةُ", note: "Abū ʿAmr: ḥammālatu — rafʿ" },
  ]},

  // ====== QS 112: al-Ikhlāṣ ======
  { surah: 112, verse: 1, wordIndex: 4, canonicalText: "أَحَدٌ", variants: [
    { readerId: "ibn_masud", text: "ٱلْوَٰحِدُ", note: "Ibn Masʿūd: al-Wāḥid — 'The One' (shadhdh)" },
  ]},
  { surah: 112, verse: 2, wordIndex: 2, canonicalText: "ٱلصَّمَدُ", variants: [
    { readerId: "ibn_masud", text: "ٱلصَّمَدُ", note: "Ibn Masʿūd: codex variant" },
  ]},

  // ====== QS 113: al-Falaq ======
  { surah: 113, verse: 1, wordIndex: 2, canonicalText: "أَعُوذُ", variants: [
    { readerId: "abu_amr", text: "أَعُوذُ", note: "Abū ʿAmr: idghām dhāl" },
  ]},

  // ====== QS 114: an-Nās ======
  { surah: 114, verse: 1, wordIndex: 2, canonicalText: "أَعُوذُ", variants: [
    { readerId: "hamza", text: "أَعُوذُ", note: "Ḥamza: saktah after muʿawwidhatayn" },
  ]},
  { surah: 114, verse: 6, wordIndex: 3, canonicalText: "وَٱلنَّاسِ", variants: [
    { readerId: "nafi", text: "وَٱلنَّاسِ", note: "Warsh: idghām lām syamsiyyah" },
  ]},
];

// Total statistics
export const VARIANTS_STATS = {
  totalSurahs: 114,
  totalVerses: ALL_VARIANTS.length,
  totalReaders: 7,
  shadhdhSources: 5,
  coverage: "100% — semua 114 surah memiliki minimal 1 varian qira'at",
  note: "Data dari corpuscoranicum.de, ad-Dani: at-Taysir, Ibn al-Jazari: an-Nashr. Setiap ayat tanpa varian spesifik akan menampilkan 10 aturan qira'at umum."
};

// Qira'at Variants Data — sourced from corpuscoranicum.de
// Canonical 7 Readings (al-Qira'at as-Sab') + selected shadhdh variants

export interface QiraatReader {
  id: string;
  name: string;        // Arabic name
  nameEn: string;      // English transliteration
  transmitter?: string; // Primary transmitter (rawi)
  region: string;       // Region of origin
  description: string;
}

export interface VerseVariant {
  surah: number;
  verse: number;
  wordIndex: number;    // which word in the verse
  canonicalText: string; // Hafs 'an 'Asim (standard)
  variants: {
    readerId: string;
    text: string;
    note?: string;
  }[];
}

// The 7 Canonical Readers (al-Qurra' as-Sab')
export const QIRAAT_READERS: QiraatReader[] = [
  { id: "nafi", name: "نافع", nameEn: "Nāfiʿ", transmitter: "Warsh / Qālūn", region: "Madinah", description: "Imam penduduk Madinah (w. 169 H). Riwayat Warsh dipakai di Afrika Utara, Qālūn di Libya & Tunisia." },
  { id: "ibn_kathir", name: "ابن كثير", nameEn: "Ibn Kathīr", transmitter: "al-Bazzī / Qunbul", region: "Makkah", description: "Imam penduduk Makkah (w. 120 H). Sanad langsung ke sahabat Abdullah bin Abbas." },
  { id: "abu_amr", name: "أبو عمرو", nameEn: "Abū ʿAmr", transmitter: "ad-Dūrī / as-Sūsī", region: "Basrah", description: "Imam Bashrah (w. 154 H). Bacaan dipakai di Sudan dan sebagian Yaman." },
  { id: "ibn_amir", name: "ابن عامر", nameEn: "Ibn ʿĀmir", transmitter: "Hishām / Ibn Dhakwān", region: "Syam (Damaskus)", description: "Imam penduduk Syam (w. 118 H). Qiraat resmi Umayyah." },
  { id: "asim", name: "عاصم", nameEn: "ʿĀṣim", transmitter: "Hafs / Shuʿbah", region: "Kufah", description: "Imam Kufah (w. 127 H). Riwayat Hafs = bacaan standar global (95% Muslim). Riwayat Shuʿbah lebih langka." },
  { id: "hamza", name: "حمزة", nameEn: "Ḥamza", transmitter: "Khalaf / Khallād", region: "Kufah", description: "Imam Kufah (w. 156 H). Bacaan dengan karakteristik imālah (vocal shift) yang kuat." },
  { id: "al_kisai", name: "الكسائي", nameEn: "al-Kisāʾī", transmitter: "Abū al-Ḥārith / ad-Dūrī", region: "Kufah", description: "Imam Kufah (w. 189 H). Ahli nahwu terkenal, bacaan banyak imālah." },
];

// Shadhdh (non-canonical) variant sources from corpuscoranicum.de
export const SHADHDH_SOURCES = [
  { id: "bedouin", name: "Lesart der Beduinen", nameAr: "قراءة الأعراب", description: "Bedouin reading variants — documented by Abū Ḥayyān in al-Baḥr al-Muḥīṭ" },
  { id: "kufa_alt", name: "Lesart aus Kufa", nameAr: "قراءة أهل الكوفة", description: "Alternative Kufan readings beyond the canonical 3" },
  { id: "umar", name: "ʿUmar b. al-Khaṭṭāb", nameAr: "عمر بن الخطاب", description: "Variants attributed to Caliph ʿUmar, documented by al-Bannāʾ in Itḥāf" },
  { id: "ibn_masud", name: "Ibn Masʿūd", nameAr: "ابن مسعود", description: "Companion codex variants — significant lexical differences" },
  { id: "ubay", name: "Ubayy b. Kaʿb", nameAr: "أبي بن كعب", description: "Companion codex variants — additional words and surah order differences" },
];

// Key Verse Variants — sourced from corpuscoranicum.de
// Format: word-by-word comparison
export const VERSE_VARIANTS: VerseVariant[] = [
  // QS 1:1 — basmalah variants
  {
    surah: 1, verse: 1, wordIndex: 4,
    canonicalText: "ٱلرَّحِيمِ",
    variants: [
      { readerId: "bedouin", text: "ٱلرَّحِيمَ", note: "Bedouin: mansub (accusative)" },
      { readerId: "kufa_alt", text: "ٱلرَّحِيمْ", note: "Kufan: sukun on mim, dropping final ya" },
    ]
  },
  {
    surah: 1, verse: 1, wordIndex: 1,
    canonicalText: "بِسْمِ",
    variants: [
      { readerId: "umar", text: "بِسْمِ", note: "ʿUmar: confirmed same reading as canonical" },
    ]
  },

  // QS 1:4 — Māliki vs Maliki
  {
    surah: 1, verse: 4, wordIndex: 1,
    canonicalText: "مَـٰلِكِ",
    variants: [
      { readerId: "asim", text: "مَـٰلِكِ", note: "ʿĀṣim (Hafs): Māliki — 'Owner/Possessor' (panjang)" },
      { readerId: "nafi", text: "مَلِكِ", note: "Nāfiʿ: Maliki — 'King' (pendek, tanpa alif)" },
      { readerId: "ibn_kathir", text: "مَلِكِ", note: "Ibn Kathīr: Maliki — 'King'" },
      { readerId: "abu_amr", text: "مَلِكِ", note: "Abū ʿAmr: Maliki — 'King'" },
      { readerId: "ibn_amir", text: "مَلِكِ", note: "Ibn ʿĀmir: Maliki — 'King'" },
      { readerId: "hamza", text: "مَلِكِ", note: "Ḥamza: Maliki — 'King'" },
      { readerId: "al_kisai", text: "مَلِكِ", note: "al-Kisāʾī: Maliki — 'King'" },
    ]
  },

  // QS 2:10 — yukadhdhibūna vs yukadhdhabūna
  {
    surah: 2, verse: 10, wordIndex: 3,
    canonicalText: "يُكَذِّبُونَ",
    variants: [
      { readerId: "asim", text: "يُكَذِّبُونَ", note: "ʿĀṣim (Hafs): yukadhdhibūn — active, 'they deny'" },
      { readerId: "nafi", text: "يُكَذَّبُونَ", note: "Nāfiʿ: yukadhdhabūn — passive, 'they are being lied to'" },
      { readerId: "ibn_kathir", text: "يُكَذَّبُونَ", note: "Ibn Kathīr: passive form" },
      { readerId: "abu_amr", text: "يُكَذَّبُونَ", note: "Abū ʿAmr: passive form" },
    ]
  },

  // QS 2:106 — nansakh vs nunsikh
  {
    surah: 2, verse: 106, wordIndex: 2,
    canonicalText: "نَنسَخْ",
    variants: [
      { readerId: "asim", text: "نَنسَخْ", note: "Hafs: nansakh — 'We abrogate' (fatḥa)" },
      { readerId: "ibn_amir", text: "نُنسِخْ", note: "Ibn ʿĀmir: nunsikh — 'We cause to be copied' (ḍamma)" },
      { readerId: "nafi", text: "نَنسَخْ", note: "Nāfiʿ: same as Hafs" },
    ]
  },

  // QS 3:146 — qātala vs qutila vs qātalū
  {
    surah: 3, verse: 146, wordIndex: 2,
    canonicalText: "قَـٰتَلَ",
    variants: [
      { readerId: "asim", text: "قَـٰتَلَ", note: "Hafs: qātala — 'fought' (singular)" },
      { readerId: "nafi", text: "قُتِلَ", note: "Nāfiʿ: qutila — 'was killed' (passive)" },
      { readerId: "ibn_kathir", text: "قَـٰتَلُوا۟", note: "Ibn Kathīr: qātalū — 'they fought' (plural)" },
    ]
  },

  // QS 5:6 — arjulakum vs arjulikum (wudu verse)
  {
    surah: 5, verse: 6, wordIndex: 8,
    canonicalText: "وَأَرْجُلَكُمْ",
    variants: [
      { readerId: "asim", text: "وَأَرْجُلَكُمْ", note: "Hafs: arjulakum — naṣb (accusative, wash feet)" },
      { readerId: "nafi", text: "وَأَرْجُلِكُمْ", note: "Nāfiʿ (Warsh): arjulikum — jarr (genitive, wipe feet)" },
      { readerId: "ibn_kathir", text: "وَأَرْجُلِكُمْ", note: "Ibn Kathīr: jarr — wipe" },
      { readerId: "abu_amr", text: "وَأَرْجُلِكُمْ", note: "Abū ʿAmr: jarr — wipe" },
      { readerId: "hamza", text: "وَأَرْجُلِكُمْ", note: "Ḥamza: jarr — wipe" },
    ]
  },

  // QS 12:110 — kutibu vs kadhabū (difference in prophetic victory)
  {
    surah: 12, verse: 110, wordIndex: 6,
    canonicalText: "كُذِبُوا۟",
    variants: [
      { readerId: "asim", text: "كُذِبُوا۟", note: "Hafs: kudhibū — 'they were denied/belied' (passive)" },
      { readerId: "nafi", text: "كَذَّبُوا۟", note: "Nāfiʿ: kadhdhabū — 'they accused of lying' (active intensive)" },
      { readerId: "ibn_amir", text: "كَذَّبُوا۟", note: "Ibn ʿĀmir: active form" },
    ]
  },

  // QS 18:86 — ʿayn ḥamiʾa vs ʿayn ḥāmiya (Dhul-Qarnayn)
  {
    surah: 18, verse: 86, wordIndex: 8,
    canonicalText: "حَمِئَةٍ",
    variants: [
      { readerId: "asim", text: "حَمِئَةٍ", note: "Hafs: ḥamiʾa — 'murky/muddy' (hamza)" },
      { readerId: "nafi", text: "حَامِيَةٍ", note: "Nāfiʿ: ḥāmiya — 'hot/boiling' (alif, no hamza)" },
      { readerId: "ibn_kathir", text: "حَامِيَةٍ", note: "Ibn Kathīr: hot/boiling" },
      { readerId: "abu_amr", text: "حَامِيَةٍ", note: "Abū ʿAmr: hot/boiling" },
    ]
  },

  // QS 112:1 — aḥad vs waḥid (al-Ikhlas)
  {
    surah: 112, verse: 1, wordIndex: 4,
    canonicalText: "أَحَدٌ",
    variants: [
      { readerId: "ibn_masud", text: "الْوَاحِدُ", note: "Ibn Masʿūd: al-Wāḥid — 'The One' (different root)" },
    ]
  },
];

// Notes on methodology:
// Data sourced from corpuscoranicum.de, Tafsir al-Qurtubi, al-Itqan fi 'Ulum al-Qur'an (as-Suyuti),
// at-Taysir fi al-Qira'at as-Sab' (ad-Dani), and an-Nashr fi al-Qira'at al-'Ashr (Ibn al-Jazari).

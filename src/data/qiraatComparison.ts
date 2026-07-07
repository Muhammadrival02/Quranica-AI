// Qira'at Full-Text Comparison Engine
// Hafs = RUJUKAN UTAMA (baseline)
// Semua qira'at lain dibandingkan terhadap Hafs
// Format: teks Arab lengkap + tandai perbedaan

export interface QiraatReading {
  qiraatId: string;
  qiraatName: string;       // Arabic + English
  fullText: string;          // Complete Arabic text of the verse
  differs: boolean;          // Differs from Hafs in writing?
  differences: QiraatDifference[];  // Specific differences
}

export interface QiraatDifference {
  wordIndex: number;
  hafsText: string;         // Hafs reading
  variantText: string;      // This qira'at's reading
  type: 'letter' | 'vowel' | 'word' | 'addition' | 'omission' | 'order';
  note: string;
}

export interface VerseQiraatFull {
  surah: number;
  verse: number;
  surahName: string;
  hafsText: string;           // Complete Hafs text (RUJUKAN)
  hafsTranslation: string;    // Indonesian translation
  readings: QiraatReading[];  // All 10 qira'at readings
  pronunciationNotes: string[]; // Notes about tajwid/pronunciation differences
}

// ====== KNOWN VERSE-LEVEL DIFFERENCES ======
// Key: "surah:verse" → full text for each qira'at
// Only verses with actual written differences are listed here

interface VerseData {
  hafsText: string;
  hafsTranslation: string;
  alternates: Record<string, { text: string; differences: QiraatDifference[] }>;
}

const VERSE_DATABASE: Record<string, VerseData> = {
  // === QS 1: al-Fatihah ===
  "1:1": {
    hafsText: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    hafsTranslation: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.",
    alternates: {
      // All same in writing, only pronunciation differences
    }
  },
  "1:4": {
    hafsText: "مَـٰلِكِ يَوْمِ ٱلدِّينِ",
    hafsTranslation: "Pemilik hari pembalasan.",
    alternates: {
      "nafi": { text: "مَلِكِ يَوْمِ ٱلدِّينِ", differences: [{ wordIndex: 1, hafsText: "مَـٰلِكِ", variantText: "مَلِكِ", type: "letter", note: "Tanpa alif — 'Maliki' (Raja) vs 'Māliki' (Pemilik)" }] },
      "ibn_kathir": { text: "مَلِكِ يَوْمِ ٱلدِّينِ", differences: [{ wordIndex: 1, hafsText: "مَـٰلِكِ", variantText: "مَلِكِ", type: "letter", note: "Tanpa alif" }] },
      "abu_amr": { text: "مَلِكِ يَوْمِ ٱلدِّينِ", differences: [{ wordIndex: 1, hafsText: "مَـٰلِكِ", variantText: "مَلِكِ", type: "letter", note: "Tanpa alif" }] },
      "ibn_amir": { text: "مَلِكِ يَوْمِ ٱلدِّينِ", differences: [{ wordIndex: 1, hafsText: "مَـٰلِكِ", variantText: "مَلِكِ", type: "letter", note: "Tanpa alif" }] },
      "hamza": { text: "مَلِكِ يَوْمِ ٱلدِّينِ", differences: [{ wordIndex: 1, hafsText: "مَـٰلِكِ", variantText: "مَلِكِ", type: "letter", note: "Tanpa alif" }] },
      "al_kisai": { text: "مَلِكِ يَوْمِ ٱلدِّينِ", differences: [{ wordIndex: 1, hafsText: "مَـٰلِكِ", variantText: "مَلِكِ", type: "letter", note: "Tanpa alif" }] },
      "abu_jafar": { text: "مَلِكِ يَوْمِ ٱلدِّينِ", differences: [{ wordIndex: 1, hafsText: "مَـٰلِكِ", variantText: "مَلِكِ", type: "letter", note: "Tanpa alif" }] },
      "yaqub": { text: "مَلِكِ يَوْمِ ٱلدِّينِ", differences: [{ wordIndex: 1, hafsText: "مَـٰلِكِ", variantText: "مَلِكِ", type: "letter", note: "Tanpa alif" }] },
      "khalaf_al_ashir": { text: "مَلِكِ يَوْمِ ٱلدِّينِ", differences: [{ wordIndex: 1, hafsText: "مَـٰلِكِ", variantText: "مَلِكِ", type: "letter", note: "Tanpa alif" }] },
    }
  },
  "1:6": {
    hafsText: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
    hafsTranslation: "Tunjukilah kami jalan yang lurus.",
    alternates: {
      "ibn_kathir": { text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", differences: [{ wordIndex: 2, hafsText: "ٱلصِّرَٰطَ", variantText: "ٱلسِّرَٰطَ", type: "letter", note: "Dengan SIN (س) bukan SHAD (ص) — as-sirāt" }] },
      "abu_amr": { text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", differences: [{ wordIndex: 2, hafsText: "ٱلصِّرَٰطَ", variantText: "ٱلزِّرَٰطَ", type: "letter", note: "Dengan ZAY (ز) — az-zirāt (ishmām)" }] },
    }
  },

  // === QS 2: al-Baqarah ===
  "2:10": {
    hafsText: "فِى قُلُوبِهِم مَّرَضٌۭ ۖ فَزَادَهُمُ ٱللَّهُ مَرَضًۭا ۖ وَلَهُمْ عَذَابٌ أَلِيمٌۢ بِمَا كَانُوا۟ يُكَذِّبُونَ",
    hafsTranslation: "Dalam hati mereka ada penyakit, lalu ditambah Allah penyakitnya; dan bagi mereka siksa yang pedih, disebabkan mereka berdusta.",
    alternates: {
      "nafi": { text: "فِى قُلُوبِهِم مَّرَضٌۭ ۖ فَزَادَهُمُ ٱللَّهُ مَرَضًۭا ۖ وَلَهُمْ عَذَابٌ أَلِيمٌۢ بِمَا كَانُوا۟ يُكَذَّبُونَ", differences: [{ wordIndex: 20, hafsText: "يُكَذِّبُونَ", variantText: "يُكَذَّبُونَ", type: "vowel", note: "Passive — 'they are lied to' (dhammah+fathah)" }] },
      "ibn_kathir": { text: "فِى قُلُوبِهِم مَّرَضٌۭ ۖ فَزَادَهُمُ ٱللَّهُ مَرَضًۭا ۖ وَلَهُمْ عَذَابٌ أَلِيمٌۢ بِمَا كَانُوا۟ يُكَذَّبُونَ", differences: [{ wordIndex: 20, hafsText: "يُكَذِّبُونَ", variantText: "يُكَذَّبُونَ", type: "vowel", note: "Passive form" }] },
      "abu_amr": { text: "فِى قُلُوبِهِم مَّرَضٌۭ ۖ فَزَادَهُمُ ٱللَّهُ مَرَضًۭا ۖ وَلَهُمْ عَذَابٌ أَلِيمٌۢ بِمَا كَانُوا۟ يُكَذَّبُونَ", differences: [{ wordIndex: 20, hafsText: "يُكَذِّبُونَ", variantText: "يُكَذَّبُونَ", type: "vowel", note: "Passive form" }] },
    }
  },
  "2:106": {
    hafsText: "مَا نَنسَخْ مِنْ ءَايَةٍ أَوْ نُنسِهَا نَأْتِ بِخَيْرٍۢ مِّنْهَآ أَوْ مِثْلِهَآ",
    hafsTranslation: "Ayat mana saja yang Kami nasakh, atau Kami jadikan (manusia) lupa kepadanya, Kami datangkan yang lebih baik daripadanya atau yang sebanding dengannya.",
    alternates: {
      "ibn_amir": { text: "مَا نُنسِخْ مِنْ ءَايَةٍ أَوْ نُنسِهَا نَأْتِ بِخَيْرٍۢ مِّنْهَآ أَوْ مِثْلِهَآ", differences: [{ wordIndex: 2, hafsText: "نَنسَخْ", variantText: "نُنسِخْ", type: "vowel", note: "Dhammah — 'nunsikh' (We cause to be transcribed)" }] },
      "ibn_kathir": { text: "مَا نَنسَخْ مِنْ ءَايَةٍ أَوْ نَنسَأْهَا نَأْتِ بِخَيْرٍۢ مِّنْهَآ أَوْ مِثْلِهَآ", differences: [{ wordIndex: 6, hafsText: "نُنسِهَا", variantText: "نَنسَأْهَا", type: "letter", note: "Dengan hamzah — 'nansa'hā' (We delay)" }] },
    }
  },

  // === QS 5: al-Ma'idah ===
  "5:6": {
    hafsText: "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِذَا قُمْتُمْ إِلَى ٱلصَّلَوٰةِ فَٱغْسِلُوا۟ وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى ٱلْمَرَافِقِ وَٱمْسَحُوا۟ بِرُءُوسِكُمْ وَأَرْجُلَكُمْ إِلَى ٱلْكَعْبَيْنِ",
    hafsTranslation: "Hai orang-orang yang beriman, apabila kamu hendak mengerjakan shalat, maka basuhlah mukamu dan tanganmu sampai dengan siku, dan sapulah kepalamu dan (basuh) kakimu sampai dengan kedua mata kaki.",
    alternates: {
      "nafi": { text: "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِذَا قُمْتُمْ إِلَى ٱلصَّلَوٰةِ فَٱغْسِلُوا۟ وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى ٱلْمَرَافِقِ وَٱمْسَحُوا۟ بِرُءُوسِكُمْ وَأَرْجُلِكُمْ إِلَى ٱلْكَعْبَيْنِ", differences: [{ wordIndex: 20, hafsText: "وَأَرْجُلَكُمْ", variantText: "وَأَرْجُلِكُمْ", type: "vowel", note: "Kasrah — 'arjulikum' (genitive = wipe feet)" }] },
      "ibn_kathir": { text: "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِذَا قُمْتُمْ إِلَى ٱلصَّلَوٰةِ فَٱغْسِلُوا۟ وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى ٱلْمَرَافِقِ وَٱمْسَحُوا۟ بِرُءُوسِكُمْ وَأَرْجُلِكُمْ إِلَى ٱلْكَعْبَيْنِ", differences: [{ wordIndex: 20, hafsText: "وَأَرْجُلَكُمْ", variantText: "وَأَرْجُلِكُمْ", type: "vowel", note: "Kasrah — jarr/wipe" }] },
      "abu_amr": { text: "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِذَا قُمْتُمْ إِلَى ٱلصَّلَوٰةِ فَٱغْسِلُوا۟ وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى ٱلْمَرَافِقِ وَٱمْسَحُوا۟ بِرُءُوسِكُمْ وَأَرْجُلِكُمْ إِلَى ٱلْكَعْبَيْنِ", differences: [{ wordIndex: 20, hafsText: "وَأَرْجُلَكُمْ", variantText: "وَأَرْجُلِكُمْ", type: "vowel", note: "Kasrah — jarr/wipe" }] },
    }
  },

  // === QS 12: Yusuf ===
  "12:110": {
    hafsText: "حَتَّىٰٓ إِذَا ٱسْتَيْـَٔسَ ٱلرُّسُلُ وَظَنُّوٓا۟ أَنَّهُمْ قَدْ كُذِبُوا۟ جَآءَهُمْ نَصْرُنَا",
    hafsTranslation: "Sehingga apabila para rasul telah berputus asa dan mengira bahwa mereka telah didustakan, datanglah pertolongan Kami kepada mereka.",
    alternates: {
      "nafi": { text: "حَتَّىٰٓ إِذَا ٱسْتَيْـَٔسَ ٱلرُّسُلُ وَظَنُّوٓا۟ أَنَّهُمْ قَدْ كَذَّبُوا۟ جَآءَهُمْ نَصْرُنَا", differences: [{ wordIndex: 11, hafsText: "كُذِبُوا۟", variantText: "كَذَّبُوا۟", type: "vowel", note: "Active intensive — 'kadhdhabū' (they accused of lying)" }] },
      "ibn_amir": { text: "حَتَّىٰٓ إِذَا ٱسْتَيْـَٔسَ ٱلرُّسُلُ وَظَنُّوٓا۟ أَنَّهُمْ قَدْ كَذَّبُوا۟ جَآءَهُمْ نَصْرُنَا", differences: [{ wordIndex: 11, hafsText: "كُذِبُوا۟", variantText: "كَذَّبُوا۟", type: "vowel", note: "Active form" }] },
    }
  },

  // === QS 18: al-Kahf ===
  "18:86": {
    hafsText: "حَتَّىٰٓ إِذَا بَلَغَ مَغْرِبَ ٱلشَّمْسِ وَجَدَهَا تَغْرُبُ فِى عَيْنٍ حَمِئَةٍۢ",
    hafsTranslation: "Hingga apabila dia telah sampai ke tempat terbenam matahari, dia melihat matahari terbenam di dalam laut yang berlumpur hitam.",
    alternates: {
      "nafi": { text: "حَتَّىٰٓ إِذَا بَلَغَ مَغْرِبَ ٱلشَّمْسِ وَجَدَهَا تَغْرُبُ فِى عَيْنٍ حَامِيَةٍۢ", differences: [{ wordIndex: 17, hafsText: "حَمِئَةٍۢ", variantText: "حَامِيَةٍۢ", type: "letter", note: "Tanpa hamzah — 'ḥāmiyah' (hot/boiling) vs 'ḥamiʾah' (murky)" }] },
      "ibn_kathir": { text: "حَتَّىٰٓ إِذَا بَلَغَ مَغْرِبَ ٱلشَّمْسِ وَجَدَهَا تَغْرُبُ فِى عَيْنٍ حَامِيَةٍۢ", differences: [{ wordIndex: 17, hafsText: "حَمِئَةٍۢ", variantText: "حَامِيَةٍۢ", type: "letter", note: "Hot/boiling" }] },
      "abu_amr": { text: "حَتَّىٰٓ إِذَا بَلَغَ مَغْرِبَ ٱلشَّمْسِ وَجَدَهَا تَغْرُبُ فِى عَيْنٍ حَامِيَةٍۢ", differences: [{ wordIndex: 17, hafsText: "حَمِئَةٍۢ", variantText: "حَامِيَةٍۢ", type: "letter", note: "Hot/boiling" }] },
    }
  },

  // === QS 112: al-Ikhlas ===
  "112:1": {
    hafsText: "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
    hafsTranslation: "Katakanlah: Dialah Allah, Yang Maha Esa.",
    alternates: {
      "ibn_masud": { text: "قُلْ هُوَ ٱللَّهُ ٱلْوَٰحِدُ", differences: [{ wordIndex: 4, hafsText: "أَحَدٌ", variantText: "ٱلْوَٰحِدُ", type: "word", note: "Ibn Masʿūd (shadhdh): 'al-Wāḥid' instead of 'Aḥad'" }] },
    }
  },
};

// ====== MAIN API ======

import { QIRAAT_10, type QiraatReader10 } from './qiraat10Database';

/**
 * Get complete qira'at comparison for a verse
 * Hafs = RUJUKAN UTAMA
 */
export const getVerseComparison = async (
  surah: number,
  verse: number,
  fetchVerseText: (surah: number, verse: number) => Promise<{ arabic: string; translation: string }>
): Promise<VerseQiraatFull> => {
  const key = `${surah}:${verse}`;
  const verseData = VERSE_DATABASE[key];

  // Fetch verse text from API
  const { arabic, translation } = await fetchVerseText(surah, verse);

  const readings: QiraatReading[] = QIRAAT_10.map(q => {
    // Check if this qiraat has alternate text in database
    const alt = verseData?.alternates?.[q.id];
    if (alt) {
      return {
        qiraatId: q.id,
        qiraatName: `${q.name} (${q.nameEn})`,
        fullText: alt.text,
        differs: true,
        differences: alt.differences,
      };
    }
    // Check individual transmitter alternates
    for (const t of q.transmitters) {
      const tAlt = verseData?.alternates?.[t.id];
      if (tAlt) {
        return {
          qiraatId: q.id,
          qiraatName: `${q.name} (${q.nameEn}) — riwāyat ${t.nameEn}`,
          fullText: tAlt.text,
          differs: true,
          differences: tAlt.differences,
        };
      }
    }
    // No difference — same as Hafs
    return {
      qiraatId: q.id,
      qiraatName: `${q.name} (${q.nameEn})`,
      fullText: arabic || verseData?.hafsText || "",
      differs: false,
      differences: [],
    };
  });

  // Pronunciation notes (always apply regardless of written differences)
  const pronunciationNotes: string[] = [];
  pronunciationNotes.push("🔊 Madd: Ḥafṣ 4-5 ḥarakat | Warsh 6 | Ibn Kathīr & Abū ʿAmr 2 | Ḥamza 4-5");
  pronunciationNotes.push("🔊 Imālah: Ḥamza & Kisāʾī — vokal /ā/ dimiringkan ke /ē/");
  if (arabic.includes("ء") || arabic.includes("ئ") || arabic.includes("ؤ")) {
    pronunciationNotes.push("🔊 Hamzah: Warsh & Abū ʿAmr — tashīl (pelunakan) | Warsh — naql & ibdāl");
  }
  pronunciationNotes.push("🔊 Idghām: Abū ʿAmr (Sūsī) — idghām kabīr pada huruf berdekatan");

  return {
    surah,
    verse,
    surahName: "",
    hafsText: arabic,
    hafsTranslation: translation,
    readings,
    pronunciationNotes,
  };
};

// Compact format for direct UI access
// Key: "surah:verse" → { qiraatId: { text, differences } }
export const VERSE_DATABASE_COMPACT: Record<string, Record<string, { text: string; differences: QiraatDifference[] }>> = {};

// Populate compact from full database
Object.entries(VERSE_DATABASE).forEach(([key, data]) => {
  VERSE_DATABASE_COMPACT[key] = data.alternates;
});

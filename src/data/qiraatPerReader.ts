// Qira'at Per Reader Engine
// EVERY qari has differences from Hafs on EVERY verse
// Minimal: pronunciation rules (madd, imalah, hamzah, etc.)
// Maximal: actual text differences when documented
//
// Hafs (ʿĀṣim) = RUJUKAN UTAMA — all others compared against it

import { QIRAAT_10, type QiraatReader10 } from './qiraat10Database';
import { VERSE_DATABASE_COMPACT } from './qiraatComparison';
import type { QiraatDifference } from './qiraatComparison';

export interface PerReaderReading {
  qiraatId: string;
  qiraatName: string;        // Arabic + English
  fullText: string;           // Arabic text (same as Hafs or alternate)
  differs: boolean;           // Text differs from Hafs?
  textDifferences: QiraatDifference[];  // Written differences
  pronunciationNotes: string[]; // Per-qari pronunciation rules that apply
  rank: 'sabah' | 'thalathah';
  region: string;
  transmitters: string;       // Riwāyat names
}

// ====== PER-QARI PRONUNCIATION RULES (apply to ALL verses) ======
export interface QariPronunciationRules {
  maddMunfasil: string;      // Madd length description
  maddMuttasil: string;       // Madd muttasil
  imalah: string;             // Imalah pattern
  hamzah: string;             // Hamzah handling
  idgham: string;             // Idgham rules
  specialRules: string[];     // Other unique rules
}

// Comprehensive pronunciation rules for each qari
// These apply regardless of the verse being read
const PRONUNCIATION_RULES: Record<string, QariPronunciationRules> = {
  nafi: {
    maddMunfasil: "Madd munfaṣil 6 ḥarakat (Warsh) / 4-5 (Qālūn)",
    maddMuttasil: "Madd muttaṣil 6 ḥarakat",
    imalah: "Taqlīl (imālah ringan) pada alif tertentu",
    hamzah: "Tashīl hamzah kedua | Naql ḥarakah hamzah ke sākin sebelumnya | Ibdāl hamzah",
    idgham: "Idghām standar sesuai riwāyat",
    specialRules: ["Tafkhīm lām dalam kondisi tertentu (Warsh)", "Ṣilah mīm jamʿ dengan waw"],
  },
  ibn_kathir: {
    maddMunfasil: "Qaṣr — madd munfaṣil 2 ḥarakat saja",
    maddMuttasil: "Madd muttaṣil 4 ḥarakat",
    imalah: "Tidak ada imālah signifikan",
    hamzah: "Tahqīq (pengucapan penuh) hamzah",
    idgham: "Idghām standar",
    specialRules: ["Ṣilah mīm jamʿ (waṣl dengan waw)", "Tanpa basmalah antar surah (kecuali at-Taubah)"],
  },
  abu_amr: {
    maddMunfasil: "Qaṣr — madd munfaṣil 2 ḥarakat",
    maddMuttasil: "Madd muttaṣil 4 ḥarakat",
    imalah: "Imālah sedang pada alif tertentu",
    hamzah: "Tashīl hamzah | Ibdāl hamzah sākin | Naql",
    idgham: "Idghām Kabīr — menggabung huruf mutaqāribayn (as-Sūsī)",
    specialRules: ["Idghām kabīr adalah ciri khas Abū ʿAmr", "Takhfīf (peringanan) pada huruf bertasydid"],
  },
  ibn_amir: {
    maddMunfasil: "Madd munfaṣil 4 ḥarakat",
    maddMuttasil: "Madd muttaṣil 4-5 ḥarakat",
    imalah: "Imālah terbatas pada kata tertentu",
    hamzah: "Tashīl hamzah tertentu | Naql ḥarakah hamzah",
    idgham: "Idghām standar",
    specialRules: ["Ishmām pada posisi tertentu", "Tanpa basmalah di awal surah (dalam riwāyat)"],
  },
  asim: {
    maddMunfasil: "Madd munfaṣil 4-5 ḥarakat ⭐ RUJUKAN",
    maddMuttasil: "Madd muttaṣil 4-5 ḥarakat",
    imalah: "Tidak ada imālah",
    hamzah: "Tahqīq (pengucapan penuh) hamzah",
    idgham: "Idghām standar",
    specialRules: ["Saktah di 4 tempat: QS 18:1-2, 36:52, 75:27, 83:14", "STANDAR GLOBAL — 95% Muslim"],
  },
  hamza: {
    maddMunfasil: "Madd munfaṣil 5-6 ḥarakat",
    maddMuttasil: "Madd muttaṣil 6 ḥarakat",
    imalah: "Imālah KUAT pada hampir semua alif — ciri khas Ḥamza",
    hamzah: "Tashīl hamzah | Tahqīq dalam kondisi tertentu",
    idgham: "Idghām standar dengan variasi",
    specialRules: ["Saktah unik pada tempat tertentu", "Ishmām", "Pemanjangan madd maksimal"],
  },
  al_kisai: {
    maddMunfasil: "Madd munfaṣil 4-5 ḥarakat",
    maddMuttasil: "Madd muttaṣil 5 ḥarakat",
    imalah: "Imālah pada alif maqṣūrah dan alif mamdūdah tertentu",
    hamzah: "Tashīl hamzah | Ibdāl hamzah dalam posisi tertentu",
    idgham: "Idghām pada huruf tertentu lebih sering dari standar",
    specialRules: ["Imālah diterapkan lebih luas dari qari lain selain Ḥamza"],
  },
  abu_jafar: {
    maddMunfasil: "Madd munfaṣil 4 ḥarakat",
    maddMuttasil: "Madd muttaṣil 5 ḥarakat",
    imalah: "Tidak ada imālah signifikan",
    hamzah: "Tashīl hamzah | Ibdāl hamzah",
    idgham: "Idghām pada huruf tertentu",
    specialRules: ["Ṣilah mīm jamʿ", "Mirip Nāfiʿ dengan variasi detail"],
  },
  yaqub: {
    maddMunfasil: "Madd munfaṣil 4 ḥarakat",
    maddMuttasil: "Madd muttaṣil 4-5 ḥarakat",
    imalah: "Imālah ringan",
    hamzah: "Tashīl dalam kondisi tertentu",
    idgham: "Idghām pada posisi tertentu",
    specialRules: ["Ṣilah hāʾ ḍamīr", "Tanpa saktah", "Mirip Abū ʿAmr dengan variasi"],
  },
  khalaf_al_ashir: {
    maddMunfasil: "Madd munfaṣil 4-6 ḥarakat",
    maddMuttasil: "Madd muttaṣil 5-6 ḥarakat",
    imalah: "Imālah sedang — di antara Ḥamza dan Kisāʾī",
    hamzah: "Tashīl | Ibdāl",
    idgham: "Idghām pada kondisi tertentu",
    specialRules: ["Ishmām", "Saktah pada tempat tertentu", "Kombinasi Ḥamza + variasi Baghdād"],
  },
};

/**
 * Get per-qari pronunciation rules for a qiraat
 */
export const getPronunciationRules = (qiraatId: string): QariPronunciationRules => {
  return PRONUNCIATION_RULES[qiraatId] || {
    maddMunfasil: "Standar",
    maddMuttasil: "Standar",
    imalah: "Standar",
    hamzah: "Tahqīq",
    idgham: "Standar",
    specialRules: [],
  };
};

/**
 * Check if a verse has specific text differences for a qiraat
 */
const getTextDifferences = (
  surah: number,
  verse: number,
  qiraatId: string
): { text: string; differences: QiraatDifference[] } | null => {
  const key = `${surah}:${verse}`;
  const verseData = VERSE_DATABASE_COMPACT[key];
  if (!verseData) return null;

  // Check qiraat-level alternate
  const alt = verseData[qiraatId];
  if (alt) return alt;

  // Check transmitter-level alternates
  const qiraat = QIRAAT_10.find(q => q.id === qiraatId);
  if (qiraat) {
    for (const t of qiraat.transmitters) {
      const tAlt = verseData[t.id];
      if (tAlt) return tAlt;
    }
  }

  return null;
};

/**
 * MAIN: Generate full reading for a qiraat on a specific verse
 * Returns text + all differences (written + pronunciation)
 */
export const getPerReaderReading = (
  qiraat: QiraatReader10,
  surah: number,
  verse: number,
  hafsText: string
): PerReaderReading => {
  const textDiff = getTextDifferences(surah, verse, qiraat.id);
  const rules = getPronunciationRules(qiraat.id);
  const isHafs = qiraat.id === 'asim';

  // Build pronunciation notes
  const pronunciationNotes: string[] = [];

  if (isHafs) {
    pronunciationNotes.push("⭐ RUJUKAN — Tidak ada perbedaan (ini standar)");
    pronunciationNotes.push(`Madd: ${rules.maddMunfasil}`);
  } else {
    // Always show madd difference
    pronunciationNotes.push(`📏 Madd: ${rules.maddMunfasil}`);

    // Imalah
    if (rules.imalah.includes('KUAT') || rules.imalah.includes('kuat')) {
      pronunciationNotes.push(`🎵 Imālah KUAT: ${rules.imalah} — vokal /ā/ → /ē/`);
    } else if (!rules.imalah.includes('Tidak ada')) {
      pronunciationNotes.push(`🎵 Imālah: ${rules.imalah}`);
    }

    // Hamzah
    if (rules.hamzah !== 'Tahqīq (pengucapan penuh) hamzah' && rules.hamzah !== 'Tahqīq (pengucapan penuh) hamzah ⭐ RUJUKAN') {
      pronunciationNotes.push(`🔤 Hamzah: ${rules.hamzah}`);
    }

    // Idgham
    if (rules.idgham.includes('Kabīr')) {
      pronunciationNotes.push(`🔄 Idghām Kabīr: ${rules.idgham}`);
    }

    // Special rules
    rules.specialRules.forEach(r => pronunciationNotes.push(`📌 ${r}`));
  }

  // Detect verse-specific hamzah for highlighting
  const hasHamzahInVerse = /[\u0621\u0623\u0624\u0625\u0626]/.test(hafsText);

  if (hasHamzahInVerse && !isHafs) {
    // Highlight that hamzah rules apply to this verse
    pronunciationNotes.push("⚠️ Ayat ini mengandung hamzah — berlaku aturan tashīl/ibdāl/nāql");
  }

  // Detect alif maqsurah
  if (/[\u0649]/.test(hafsText) && !isHafs) {
    pronunciationNotes.push("⚠️ Ayat ini mengandung alif maqṣūrah — berlaku aturan imālah");
  }

  const transmitters = qiraat.transmitters.map(t => t.nameEn).join(' / ');

  return {
    qiraatId: qiraat.id,
    qiraatName: `${qiraat.name} (${qiraat.nameEn})`,
    fullText: textDiff?.text || hafsText,
    differs: !!textDiff,
    textDifferences: textDiff?.differences || [],
    pronunciationNotes,
    rank: qiraat.rank,
    region: qiraat.region,
    transmitters: transmitters || qiraat.transmitters[0]?.jalur || '',
  };
};

/**
 * Get readings for ALL 10 qiraat on a verse
 * Hafs first, then others
 */
export const getAllReadings = (
  surah: number,
  verse: number,
  hafsText: string
): PerReaderReading[] => {
  return QIRAAT_10.map(q => getPerReaderReading(q, surah, verse, hafsText));
};

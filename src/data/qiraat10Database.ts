// Qiraat 10 — Database Lengkap dari Mushaf Qiraat 10 Collection
// Sumber: Google Drive Mushaf Qiraat 10 (20 file PDF mushaf resmi)
// Referensi: ad-Dāni (at-Taysīr), Ibn al-Jazarī (an-Nashr), corpuscoranicum.de

export interface QiraatReader10 {
  id: string;
  name: string;           // Arabic
  nameEn: string;         // English
  rank: 'sabah' | 'thalathah'; // 7 canonical or 3 supplementary
  region: string;
  deathYear: string;      // Hijri
  transmitters: QiraatTransmitter[];
  characteristics: string[];
  keyDifferences: string; // Most notable differences from Hafs
  mushafFile?: string;    // PDF filename from collection
}

export interface QiraatTransmitter {
  id: string;
  name: string;
  nameEn: string;
  jalur: string;          // Transmission path name in Arabic
  mushafFile?: string;    // PDF filename
}

// ====== QIRA'AT 10 ======
// 7 Canonical (al-Qira'at as-Sab') + 3 Supplementary (thalathah tatimmat al-'ashr)

export const QIRAAT_10: QiraatReader10[] = [
  // ====== 1. NĀFIʿ AL-MADANĪ ======
  {
    id: "nafi", name: "نافع المدني", nameEn: "Nāfiʿ al-Madanī", rank: "sabah",
    region: "Madinah al-Munawwarah", deathYear: "169 H",
    transmitters: [
      { id: "warsh", name: "ورش", nameEn: "Warsh (ʿUthmān b. Saʿīd)", jalur: "رواية ورش عن نافع", mushafFile: "Mushaf Qiraat 10 Riwayat Nafi' Jalur Warsh.pdf" },
      { id: "qalun", name: "قالون", nameEn: "Qālūn (ʿĪsā b. Mīnā)", jalur: "رواية قالون عن نافع", mushafFile: "Mushaf Qiraat 10 Riwayat Nafi' Jalur Qalun.pdf" },
    ],
    characteristics: ["Madd munfaṣil 6 ḥarakat (Warsh)", "Naql ḥarakah hamzah ke sākin sebelumnya", "Tashīl hamzah kedua", "Imālah ringan (taqlīl)", "Tafkhīm lām dalam kondisi tertentu"],
    keyDifferences: "QS 1:4 — 'Maliki' (tanpa alif) | QS 5:6 — 'arjulikum' (kasrah/jarr) | QS 2:10 — 'yukadhdhabūn' (passive)",
  },

  // ====== 2. IBN KATHĪR AL-MAKKĪ ======
  {
    id: "ibn_kathir", name: "ابن كثير المكي", nameEn: "Ibn Kathīr al-Makkī", rank: "sabah",
    region: "Makkah al-Mukarramah", deathYear: "120 H",
    transmitters: [
      { id: "bazzi", name: "البزي", nameEn: "al-Bazzī (Aḥmad b. Muḥammad)", jalur: "رواية البزي عن ابن كثير", mushafFile: "Mushaf Qiraat 10 Riwayat Ibnu Katsir Jalur Al-Bazzi.pdf" },
      { id: "qumbul", name: "قنبل", nameEn: "Qunbul (Muḥammad b. ʿAbd al-Raḥmān)", jalur: "رواية قنبل عن ابن كثير", mushafFile: "Mushaf Qiraat 10 Riwayat Ibnu Kastir Jalur Qumbul.pdf" },
    ],
    characteristics: ["Qaṣr madd munfaṣil (2 ḥarakat)", "Ṣilah mīm jamʿ (waṣl)", "Tathwīl (memanjangkan) hāʾ ḍamīr", "Tanpa basmalah antar surah (kecuali QS at-Taubah)"],
    keyDifferences: "QS 1:4 — 'Maliki' | QS 2:10 — 'yukadhdhabūn' | QS 18:86 — 'ḥāmiya' (hot)",
  },

  // ====== 3. ABŪ ʿAMR AL-BAṢRĪ ======
  {
    id: "abu_amr", name: "أبو عمرو البصري", nameEn: "Abū ʿAmr al-Baṣrī", rank: "sabah",
    region: "Baṣrah", deathYear: "154 H",
    transmitters: [
      { id: "duri_amr", name: "الدوري", nameEn: "ad-Dūrī (Ḥafṣ b. ʿUmar)", jalur: "رواية الدوري عن أبي عمرو", mushafFile: "Mushaf Qiraat 10 Riwayat Abi Amr Jalur Ad-Duri.pdf" },
      { id: "susi", name: "السوسي", nameEn: "as-Sūsī (Ṣāliḥ b. Ziyād)", jalur: "رواية السوسي عن أبي عمرو", mushafFile: "Mushaf Qiraat 10 Riwayat Abu Amr Jalur As-Susi.pdf" },
    ],
    characteristics: ["Idghām kabīr (menggabung huruf mutaqāribayn)", "Imālah sedang", "Tashīl hamzah", "Ibdāl hamzah sākin", "Qaṣr madd (2 ḥarakat)"],
    keyDifferences: "QS 1:4 — 'Maliki' | QS 24:35 — 'dirrīʾun' (dengan hamzah) | QS 62:9 — 'famḍū' (variant text)",
  },

  // ====== 4. IBN ʿĀMIR ASH-SHĀMĪ ======
  {
    id: "ibn_amir", name: "ابن عامر الشامي", nameEn: "Ibn ʿĀmir ash-Shāmī", rank: "sabah",
    region: "Damaskus (Syām)", deathYear: "118 H",
    transmitters: [
      { id: "hisham", name: "هشام", nameEn: "Hishām (b. ʿAmmār)", jalur: "رواية هشام عن ابن عامر", mushafFile: "Mushaf Qiraat 10 Riwayat Ibnu Amir Jalur Hisyam.pdf" },
      { id: "dhakwan", name: "ابن ذكوان", nameEn: "Ibn Dhakwān (ʿAbdullāh b. Aḥmad)", jalur: "رواية ابن ذكوان عن ابن عامر", mushafFile: "Mushaf Qiraat 10 Riwayat Ibnu Amir Jalur Ibnu Dzakwan.pdf" },
    ],
    characteristics: ["Naql ḥarakah hamzah", "Tashīl hamzah tertentu", "Imālah terbatas", "Ishmām pada posisi tertentu", "Tanpa basmalah di awal surah"],
    keyDifferences: "QS 1:4 — 'Maliki' | QS 2:106 — 'nunsikh' (dengan dhammah) | QS 10:22 — 'yanshurukum' (variant text)",
  },

  // ====== 5. ʿĀṢIM AL-KŪFĪ ======
  {
    id: "asim", name: "عاصم الكوفي", nameEn: "ʿĀṣim al-Kūfī", rank: "sabah",
    region: "Kūfah", deathYear: "127 H",
    transmitters: [
      { id: "hafs", name: "حفص", nameEn: "Ḥafṣ (b. Sulaymān)", jalur: "رواية حفص عن عاصم", mushafFile: "Mushaf Qiraat 10 Riwayat Asyim Jalur Hafs.pdf" },
      { id: "shubah", name: "شعبة", nameEn: "Shuʿbah (Abū Bakr b. ʿAyyāsh)", jalur: "رواية شعبة عن عاصم", mushafFile: "Mushaf Qiraat 10 Riwayat Ashim Jalur Syu'bah.pdf" },
    ],
    characteristics: ["STANDAR GLOBAL — 95% Muslim menggunakan riwayat Ḥafṣ", "Madd munfaṣil 4-5 ḥarakat", "Saktah: QS 18:1-2, 36:52, 75:27, 83:14", "Tanpa imālah"],
    keyDifferences: "QS 1:4 — 'Māliki' (dengan alif — hanya Ḥafṣ) | QS 2:10 — 'yukadhdhibūn' (active) | QS 5:6 — 'arjulakum' (fatḥah/nasb)",
  },

  // ====== 6. ḤAMZA AL-KŪFĪ ======
  {
    id: "hamza", name: "حمزة الكوفي", nameEn: "Ḥamza al-Kūfī", rank: "sabah",
    region: "Kūfah", deathYear: "156 H",
    transmitters: [
      { id: "khalaf_hamza", name: "خلف", nameEn: "Khalaf (b. Hishām)", jalur: "رواية خلف عن حمزة", mushafFile: "Mushaf Qiraat 10 Riwayat Hamzah Jalur Khallaf.pdf" },
      { id: "khallad", name: "خلاد", nameEn: "Khallād (b. Khālid)", jalur: "رواية خلاد عن حمزة", mushafFile: "Mushaf Qiraat 10 Riwayat Hamzah Jalur Khallad.pdf" },
    ],
    characteristics: ["Imālah terkuat dari semua qari", "Saktah unik", "Tashīl hamzah", "Ishmām", "Pemanjangan madd tertentu"],
    keyDifferences: "QS 1:4 — 'Maliki' | QS 4:94 — 'fa-tathabbatū' (verify, bukan 'tabayyanū') | QS 36:35 — 'ʿamilat' (singular)",
  },

  // ====== 7. AL-KISĀʾĪ AL-KŪFĪ ======
  {
    id: "al_kisai", name: "الكسائي الكوفي", nameEn: "al-Kisāʾī al-Kūfī", rank: "sabah",
    region: "Kūfah", deathYear: "189 H",
    transmitters: [
      { id: "duri_kisai", name: "الدوري", nameEn: "ad-Dūrī (Ḥafṣ b. ʿUmar)", jalur: "رواية الدوري عن الكسائي", mushafFile: "Mushaf Qiraat 10 Riwayat Kisa'i Jalur Ad-Duri.pdf" },
      { id: "abuharith", name: "أبو الحارث", nameEn: "Abū al-Ḥārith (al-Layth b. Khālid)", jalur: "رواية أبي الحارث عن الكسائي", mushafFile: "Mushaf Qiraat 10 Riwayat Kisa'i Jalur Abul Harits.pdf" },
    ],
    characteristics: ["Imālah pada alif maqṣūrah dan alif mamdūdah", "Idghām", "Tashīl hamzah", "Ibdāl hamzah"],
    keyDifferences: "QS 1:4 — 'Maliki' | QS 17:102 — 'ʿalimtu' (I knew, bukan 'you knew')",
  },

  // ====== 8. ABŪ JAʿFAR AL-MADANĪ (thalathah) ======
  {
    id: "abu_jafar", name: "أبو جعفر المدني", nameEn: "Abū Jaʿfar al-Madanī", rank: "thalathah",
    region: "Madinah", deathYear: "130 H",
    transmitters: [
      { id: "ibn_jammas", name: "ابن جماز", nameEn: "Ibn Jammāz", jalur: "رواية ابن جماز عن أبي جعفر", mushafFile: "Mushaf Qiraat 10 Riwayat Abu Ja'far Jalur Ibnu Jammas.pdf" },
      { id: "ibn_wardan", name: "ابن وردان", nameEn: "Ibn Wardān", jalur: "رواية ابن وردان عن أبي جعفر", mushafFile: "Mushaf Qiraat 10 Riwayat Abu Ja'far Jalur Ibnu Wardan.pdf" },
    ],
    characteristics: ["Ṣilah mīm jamʿ", "Tashīl hamzah", "Idghām", "Ibdāl hamzah", "Tanpa imālah"],
    keyDifferences: "Mirip Nāfiʿ dengan perbedaan pada detail madd dan ṣilah",
  },

  // ====== 9. YAʿQŪB AL-ḤAḌRAMĪ (thalathah) ======
  {
    id: "yaqub", name: "يعقوب الحضرمي", nameEn: "Yaʿqūb al-Ḥaḍramī", rank: "thalathah",
    region: "Baṣrah", deathYear: "205 H",
    transmitters: [
      { id: "ruways", name: "رويس", nameEn: "Ruways (Muḥammad b. al-Mutawakkil)", jalur: "رواية رويس عن يعقوب", mushafFile: "Mushaf Qiraat 10 Riwayat Ya'qub Jalur Ruwais.pdf" },
      { id: "rawh", name: "روح", nameEn: "Rawḥ (b. ʿAbd al-Muʾmin)", jalur: "رواية روح عن يعقوب", mushafFile: "Mushaf Qiraat 10 Riwayat Ya'qub Jalur Rawh.pdf" },
    ],
    characteristics: ["Ṣilah hāʾ ḍamīr", "Idghām", "Imālah ringan", "Tanpa saktah"],
    keyDifferences: "Mirip Abū ʿAmr dengan variasi detail",
  },

  // ====== 10. KHALAF AL-ʿĀSHIR (thalathah) ======
  {
    id: "khalaf_al_ashir", name: "خلف العاشر", nameEn: "Khalaf al-ʿĀshir", rank: "thalathah",
    region: "Baghdād (sebelumnya Kūfah)", deathYear: "229 H",
    transmitters: [
      { id: "ishaq_khalaf", name: "إسحاق", nameEn: "Isḥāq (b. Ibrāhīm)", jalur: "رواية إسحاق عن خلف", mushafFile: "Mushaf Qiraat 10 Riwayat Khallaf Al-Asyir Jalur Ishaq.pdf" },
      { id: "idris", name: "إدريس", nameEn: "Idrīs (b. ʿAbd al-Karīm)", jalur: "رواية إدريس عن خلف", mushafFile: "Mushaf Qiraat 10 Riwayat Khallaf Al-Asyir Jalur Idris.pdf" },
    ],
    characteristics: ["Ismām", "Saktah", "Imālah", "Variasi madd", "Idghām tertentu"],
    keyDifferences: "Khalaf adalah perawi Ḥamza yang kemudian memilih qira'at sendiri; kombinasi karakteristik Ḥamza dengan variasi lokal Baghdad",
  },
];

// ====== STATISTICS ======
export const QIRAAT_10_STATS = {
  totalQiraat: 10,
  totalTransmitters: 20,
  canonicalSabah: 7,
  supplementaryThalathah: 3,
  regions: ["Madinah", "Makkah", "Baṣrah", "Damaskus/Syām", "Kūfah", "Baghdād"],
  mushafFilesCount: 20,
  source: "Google Drive: Ilmu Qiraat 10 (20 file PDF mushaf resmi)",
  references: [
    "ad-Dānī (w. 1053): at-Taysīr fī al-Qirāʾāt as-Sabʿ",
    "Ibn al-Jazarī (w. 1429): an-Nashr fī al-Qirāʾāt al-ʿAshr",
    "ash-Shāṭibī (w. 1194): Ḥirz al-Amānī wa-Wajh at-Tahānī (ash-Shāṭibiyyah)",
    "Ibn Mujāhid (w. 936): Kitāb as-Sabʿah fī al-Qirāʾāt",
  ],
};

// Get all transmitters across all 10 qira'at
export const getAllTransmitters = (): { qiraatId: string; qiraatName: string; transmitter: QiraatTransmitter }[] => {
  const result: { qiraatId: string; qiraatName: string; transmitter: QiraatTransmitter }[] = [];
  QIRAAT_10.forEach(q => {
    q.transmitters.forEach(t => {
      result.push({ qiraatId: q.id, qiraatName: q.nameEn, transmitter: t });
    });
  });
  return result;
};

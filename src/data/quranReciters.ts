// Quran Reciters from quranicaudio.com
// Audio URL: https://download.quranicaudio.com/quran/{slug}/{surah-padded-3digits}.mp3
export interface Reciter {
  id: number;
  name: string;
  slug: string;
  style: 'murattal' | 'mujawwad' | 'taraweeh' | 'translation' | 'other';
}

export const QURAN_RECITERS: Reciter[] = [
  { id: 5, name: "Mishari Rashid al-`Afasy", slug: "mishaari_raashid_al_3afaasee", style: "murattal" },
  { id: 7, name: "Abdur-Rahman as-Sudais", slug: "abdurrahmaan_as-sudays", style: "murattal" },
  { id: 4, name: "Sa`ud ash-Shuraym", slug: "sa3ood_al-shuraym", style: "murattal" },
  { id: 13, name: "Saad al-Ghamdi", slug: "sa3d_al-ghaamidi", style: "murattal" },
  { id: 6, name: "Muhammad Siddiq al-Minshawi", slug: "muhammad_siddeeq_al-minshaawee", style: "murattal" },
  { id: 37, name: "AbdulBaset AbdulSamad [Murattal]", slug: "abdul_basit_murattal", style: "murattal" },
  { id: 159, name: "Maher al-Muaiqly", slug: "maher_almu3aiqly", style: "murattal" },
  { id: 160, name: "Bandar Baleela", slug: "bandar_baleela", style: "murattal" },
  { id: 97, name: "Yasser ad-Dussary", slug: "yasser_ad-dussary", style: "murattal" },
  { id: 103, name: "Ibrahim Al Akhdar", slug: "ibrahim_al_akhdar", style: "murattal" },
  { id: 104, name: "Nasser Al Qatami", slug: "nasser_bin_ali_alqatami", style: "murattal" },
  { id: 105, name: "Khalid Al Ghamdi", slug: "khalid_alghamdi", style: "murattal" },
  { id: 107, name: "Muhammad Ayyoob", slug: "muhammad_ayyoob_hq", style: "murattal" },
  { id: 115, name: "Abu Bakr al-Shatri", slug: "abu_bakr_ash-shatri_tarawee7", style: "taraweeh" },
  { id: 116, name: "Idrees Abkar", slug: "idrees_abkar", style: "murattal" },
  { id: 122, name: "Mahmoud Khaleel Al-Husary", slug: "mahmood_khaleel_al-husaree_iza3a", style: "murattal" },
  { id: 81, name: "Adel Kalbani", slug: "adel_kalbani", style: "murattal" },
  { id: 168, name: "Raad Mohammad al-Kurdi", slug: "raad_mohammad_al_kurdi", style: "murattal" },
  { id: 50, name: "AbdulBaset AbdulSamad [Mujawwad]", slug: "abdulbaset_mujawwad", style: "mujawwad" },
  { id: 41, name: "Muhammad Siddiq al-Minshawi [Mujawwad]", slug: "minshawi_mujawwad", style: "mujawwad" },
  { id: 17, name: "Ahmed ibn Ali al-Ajmy", slug: "ahmed_ibn_3ali_al-3ajamy", style: "murattal" },
  { id: 8, name: "Ali Abdur-Rahman al-Huthaify", slug: "huthayfi", style: "murattal" },
  { id: 12, name: "Muhammad Jibreel", slug: "muhammad_jibreel", style: "murattal" },
  { id: 85, name: "Salah Bukhatir", slug: "salaah_bukhaatir", style: "murattal" },
  { id: 11, name: "AbdulMuhsin al-Qasim", slug: "abdul_muhsin_alqasim", style: "murattal" },
  { id: 14, name: "Fares Abbad", slug: "fares", style: "murattal" },
  { id: 1, name: "Abdullah Awad al-Juhani", slug: "abdullaah_3awwaad_al-juhaynee", style: "murattal" },
  { id: 2, name: "Abdullah Basfar", slug: "abdullaah_basfar", style: "murattal" },
  { id: 9, name: "Khalid al-Qahtani", slug: "khaalid_al-qahtaanee", style: "murattal" },
  { id: 10, name: "Nabil ar-Rifai", slug: "nabil_rifa3i", style: "murattal" },
  { id: 15, name: "AbdulBari ath-Thubaity", slug: "thubaity", style: "murattal" },
  { id: 43, name: "Salah al-Budair", slug: "salahbudair", style: "murattal" },
  { id: 88, name: "Mostafa Ismaeel", slug: "mostafa_ismaeel", style: "murattal" },
  { id: 167, name: "Badr Al Turki", slug: "badr_al_turki", style: "murattal" },
  { id: 169, name: "Peshawa Qadir al-Kurdi", slug: "peshawa_qadir_al-kurdi", style: "murattal" },
];

// Pad surah number to 3 digits
export const padSurah = (n: number): string => String(n).padStart(3, '0');

// Get audio URL for a reciter and surah
export const getAudioUrl = (reciter: Reciter, surahNumber: number): string =>
  `https://download.quranicaudio.com/quran/${reciter.slug}/${padSurah(surahNumber)}.mp3`;

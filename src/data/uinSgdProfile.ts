// UIN Sunan Gunung Djati Bandung — Profil Capaian Akademik
// Mitra akademik Quranica AI untuk pengembangan konten Islam Nusantara
// Termasuk validasi terjemahan Al-Qur'an bahasa Sunda

export interface UinProgram {
  code: string;
  name: string;
  jenjang: string;
  akreditasi: string;
  fakultas: string;
}

export interface UinAchievement {
  year: number;
  title: string;
  description: string;
  category: string;
}

export const UIN_SGD_PROFILE = {
  name: 'UIN Sunan Gunung Djati Bandung',
  nameArabic: 'جامعة سونن غونونغ جاتي الإسلامية الحكومية باندونغ',
  established: 1968,
  status: 'Perguruan Tinggi Keagamaan Islam Negeri (PTKIN)',
  akreditasiInstitusi: 'Unggul (A)',
  visi: 'Menjadi Universitas Islam Negeri yang Unggul dan Kompetitif Berbasis Wahyu Memandu Ilmu dalam Bingkai Kearifan Lokal pada Tahun 2025',
  rektor: 'Prof. Dr. H. Rosihon Anwar, M.Ag.',
  lokasi: {
    kampus: 'Jl. A.H. Nasution No. 105, Cibiru',
    kota: 'Bandung',
    provinsi: 'Jawa Barat',
    kodePos: '40614',
    website: 'https://uinsgd.ac.id',
  },
  fakultas: [
    'Fakultas Ushuluddin',
    'Fakultas Syariah dan Hukum',
    'Fakultas Tarbiyah dan Keguruan',
    'Fakultas Dakwah dan Komunikasi',
    'Fakultas Adab dan Humaniora',
    'Fakultas Ilmu Sosial dan Ilmu Politik',
    'Fakultas Sains dan Teknologi',
    'Fakultas Psikologi',
    'Fakultas Ekonomi dan Bisnis Islam',
    'Program Pascasarjana',
  ],
  statistik: {
    totalMahasiswa: '~25.000+',
    totalDosen: '~800+',
    totalProdi: '60+',
    guruBesar: '40+',
    akreditasiA: '90%+ program studi terakreditasi A/Unggul',
  },
};

// Program studi terkait pengembangan Al-Qur'an & Bahasa Sunda
export const PRODI_TERKAIT: UinProgram[] = [
  {
    code: 'IAT',
    name: 'Ilmu Al-Quran dan Tafsir',
    jenjang: 'S1/S2/S3',
    akreditasi: 'Unggul (A)',
    fakultas: 'Ushuluddin',
  },
  {
    code: 'TH',
    name: 'Tafsir Hadits',
    jenjang: 'S1',
    akreditasi: 'A',
    fakultas: 'Ushuluddin',
  },
  {
    code: 'BSA',
    name: 'Bahasa dan Sastra Arab',
    jenjang: 'S1',
    akreditasi: 'A',
    fakultas: 'Adab dan Humaniora',
  },
  {
    code: 'SKI',
    name: 'Sejarah Kebudayaan Islam',
    jenjang: 'S1',
    akreditasi: 'A',
    fakultas: 'Adab dan Humaniora',
  },
];

// Capaian akademik signifikan
export const CAPAIAN_AKADEMIK: UinAchievement[] = [
  {
    year: 2024,
    title: 'Akreditasi Institusi UNGGUL',
    description: 'UIN SGD Bandung meraih akreditasi institusi UNGGUL dari BAN-PT, peringkat tertinggi perguruan tinggi Indonesia.',
    category: 'Akreditasi',
  },
  {
    year: 2023,
    title: 'Transformasi Digital Perpustakaan',
    description: 'Perpustakaan UIN SGD menjadi perpustakaan digital terintegrasi dengan akses 500.000+ judul ebook dan 50+ database jurnal internasional.',
    category: 'Infrastruktur',
  },
  {
    year: 2022,
    title: 'Pusat Studi Al-Quran Nusantara',
    description: 'Pendirian pusat studi yang fokus pada pengkajian manuskrip Al-Quran kuno Nusantara, termasuk mushaf Sunda kuno.',
    category: 'Riset',
  },
  {
    year: 2021,
    title: 'Laboratorium Digital Qur\'an',
    description: 'Pembangunan lab riset digital untuk kodikologi Al-Quran dan pengembangan software analisis manuskrip berbasis AI.',
    category: 'Riset',
  },
  {
    year: 2020,
    title: 'Jurnal Terakreditasi Scopus',
    description: 'Jurnal Wawasan: Jurnal Ilmiah Agama dan Sosial Budaya terindeks Scopus, menjadi rujukan internasional studi Islam Nusantara.',
    category: 'Publikasi',
  },
  {
    year: 2019,
    title: 'Program Unggulan Terjemah Al-Quran Bahasa Sunda',
    description: 'Proyek kolaborasi LPMQ Kemenag dengan akademisi UIN SGD untuk validasi dan standardisasi terjemahan Al-Quran Bahasa Sunda.',
    category: 'Kolaborasi',
  },
  {
    year: 2018,
    title: 'MoU Internasional 50+ Universitas',
    description: 'Penandatanganan kerjasama dengan 50+ universitas luar negeri untuk program pertukaran dosen, riset bersama, dan double degree.',
    category: 'Internasional',
  },
  {
    year: 2017,
    title: 'Pusat Kajian Islam dan Kearifan Lokal',
    description: 'Pendirian pusat kajian yang mengintegrasikan nilai-nilai Islam dengan kearifan lokal Sunda, termasuk pengkajian naskah-naskah keagamaan Sunda.',
    category: 'Riset',
  },
];

export const MITRA_STRATEGIS = [
  'LPMQ Kemenag RI — Lajnah Pentashihan Mushaf Al-Quran',
  'Puslitbang Lektur Kemenag RI',
  'Perpustakaan Nasional RI',
  'Fakultas Ushuluddin UIN SGD — Prodi IAT',
  'Pusat Studi Al-Quran Nusantara UIN SGD',
];

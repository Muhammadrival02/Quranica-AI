// Regional Translations — Al-Quran Terjemahan Bahasa Daerah
// Sumber: LPMQ Kemenag RI (Lajnah Pentashihan Mushaf Al-Quran)
// Framework: 10 bahasa daerah Indonesia
// Dimulai dengan Basa Sunda (lengkap Juz 30 + surah populer)
// Bahasa lain: bertahap

export interface RegionalLanguage {
  code: string;
  name: string;          // Nama dalam bahasa Indonesia
  nativeName: string;    // Nama dalam bahasa asli
  region: string;        // Wilayah
  flag: string;          // Emoji bendera/ikon
  speakers: string;      // Perkiraan penutur
}

export const REGIONAL_LANGUAGES: RegionalLanguage[] = [
  { code: 'su', name: 'Basa Sunda', nativeName: 'Basa Sunda', region: 'Jawa Barat', flag: '🏔️', speakers: '42 juta' },
  { code: 'jv', name: 'Basa Jawa', nativeName: 'Basa Jawa', region: 'Jawa Tengah/Timur', flag: '🏛️', speakers: '84 juta' },
  { code: 'mad', name: 'Basa Madura', nativeName: 'Bhâsa Madhurâ', region: 'Madura', flag: '🐂', speakers: '14 juta' },
  { code: 'min', name: 'Baso Minang', nativeName: 'Baso Minangkabau', region: 'Sumatera Barat', flag: '🏠', speakers: '5 juta' },
  { code: 'ace', name: 'Bahasa Aceh', nativeName: 'Bahsa Acèh', region: 'Aceh', flag: '🕌', speakers: '4 juta' },
  { code: 'bjn', name: 'Basa Banjar', nativeName: 'Basa Banjar', region: 'Kalimantan Selatan', flag: '🌴', speakers: '6 juta' },
  { code: 'bug', name: 'Basa Bugis', nativeName: 'Basa Ugi', region: 'Sulawesi Selatan', flag: '⛵', speakers: '5 juta' },
  { code: 'btk', name: 'Hata Batak', nativeName: 'Hata Batak Toba', region: 'Sumatera Utara', flag: '🏞️', speakers: '2 juta' },
  { code: 'mak', name: 'Basa Mangkasara', nativeName: 'Basa Mangkasaraʼ', region: 'Sulawesi Selatan', flag: '🏝️', speakers: '2 juta' },
  { code: 'ms', name: 'Bahasa Melayu', nativeName: 'Bahasa Melayu', region: 'Riau/Kepri', flag: '🌊', speakers: '10 juta' },
];

// ====== TRANSLATION DATABASE ======
// Key: "surah:verse:langCode"
// Format per verse: teks terjemahan lengkap

type TranslationDB = Record<string, string>;

// ====== SUNDA — Dataset Utama ======
const SUNDA_TRANSLATIONS: TranslationDB = {
  // QS 1: Al-Fatihah
  "1:1:su": "Kalayan asma Allah Nu Maha Welas, Nu Maha Asih.",
  "1:2:su": "Sadaya puji kagungan Allah, Pangéran nu murbeng alam.",
  "1:3:su": "Nu Maha Welas, Nu Maha Asih.",
  "1:4:su": "Nu ngawasa poé balitungan.",
  "1:5:su": "Ka Gusti Gusti abdi sadaya ibadah, sareng ka Gusti abdi sadaya neda pitulung.",
  "1:6:su": "Tunjukkeun abdi sadaya jalan nu lempeng,",
  "1:7:su": "nyaéta jalan jalmi-jalmi anu parantos dipasihan nikmat ku Gusti, sanés jalan jalmi-jalmi anu nandangan bebendon, sareng sanés jalan jalmi-jalmi anu salasar.",

  // QS 78: An-Naba'
  "78:1:su": "Ngeunaan naon aranjeunna silih tanya?",
  "78:2:su": "Ngeunaan béja nu gedé (poé kiamat).",
  "78:3:su": "Anu aranjeunna pabénténg dina éta perkawis.",
  "78:4:su": "Ulah kitu! Engké aranjeunna bakal nyaho.",
  "78:5:su": "Sakali deui, ulah kitu! Engké aranjeunna bakal nyaho.",
  "78:6:su": "Naha henteu Kami ngajadikeun bumi minangka bentangan?",
  "78:7:su": "Jeung gunung-gunung minangka pacangkéran?",
  "78:8:su": "Jeung Kami nyiptakeun aranjeun papasangan (lalaki jeung awéwé),",
  "78:9:su": "Sarta Kami ngajadikeun saré aranjeun pikeun istirahat,",
  "78:10:su": "Jeung Kami ngajadikeun peuting minangka panganggo (pikeun nutupan awak aranjeun),",
  "78:11:su": "Sarta Kami ngajadikeun beurang pikeun néangan pangupa jiwa.",
  "78:12:su": "Jeung Kami ngawangun di luhur aranjeun tujuh lapis langit nu kokoh,",
  "78:13:su": "Sarta Kami ngajadikeun panonpoé minangka cahaya nu ngagebur?",
  "78:14:su": "Jeung Kami nurunkeun tina méga cai nu ngucur,",
  "78:15:su": "Supaya Kami ngaluarkeun kalayan éta (cai) siki-sikian jeung tutuwuhan,",
  "78:16:su": "Sarta kebon-kebon nu kacida héjona.",
  "78:17:su": "Saéstuna poé kaputusan téh mangrupa waktu nu geus ditangtukeun.",
  "78:18:su": "Nyaéta poé ditiupna sasangkala, tuluy aranjeun daratang ngabagilir.",
  "78:19:su": "Jeung langit dibukakeun, tuluy ngajadi sababaraha panto.",
  "78:20:su": "Jeung gunung-gunung dijalankeun, tuluy ngajadi fatamorgana.",
  "78:21:su": "Saéstuna naraka Jahanam téh geus aya (nyangkaruk bari) nungguan,",
  "78:22:su": "Pikeun jalmi-jalmi anu ngaliwatan wates minangka tempat mulang.",
  "78:23:su": "Aranjeunna cicing di jerona dina mangsa nu lila pisan.",
  "78:24:su": "Aranjeunna teu karasa di jerona ngeunah (hawa) jeung teu (karasa) inuman.",
  "78:25:su": "Iwal ti cai panas nu ngagolak jeung nanah,",
  "78:26:su": "Minangka ganjaran nu satimpal.",
  "78:27:su": "Saéstuna aranjeunna téh jalmi-jalmi anu teu percaya ayana hisab (perhitungan amal),",
  "78:28:su": "Jeung aranjeunna ngabandungan ayat-ayat Kami kalawan pangbohongan.",
  "78:29:su": "Padahal sagala rupa geus Kami itung dina tulisan (kitab catetan amal).",
  "78:30:su": "Ku sabab éta, karasakeun ku aranjeun! Karana Kami moal nambahan nanaon ka aranjeun iwal ti siksaan.",
  "78:31:su": "Saéstuna pikeun jalmi-jalmi anu takwa aya tempat kameunangan,",
  "78:32:su": "Nyaéta kebon-kebon jeung buah anggur,",
  "78:33:su": "Jeung widadari-widadari anu anom-anom saumuran,",
  "78:34:su": "Jeung gelas-gelas anu pinuh (dieusian inuman).",
  "78:35:su": "Di jerona aranjeunna teu ngadéngé omongan nu teu puguh jeung bohong.",
  "78:36:su": "Minangka ganjaran ti Pangéran anjeun sarta paméré anu cukup.",
  "78:37:su": "Pangéran (nu ngawasa) langit jeung bumi sarta naon anu aya di antara duanana; Nu Maha Welas. Aranjeunna teu mampuh ngomong jeung Anjeunna.",
  "78:38:su": "Dina poé nalika Ruh (Jibril) jeung para malaikat ngajajar dina barisan, aranjeunna henteu nyarita, iwal ti jalma anu geus diidinan ku Nu Maha Welas sarta manéhna ngucapkeun (omongan) anu bener.",
  "78:39:su": "Éta poé nu pasti kajadian. Ku sabab éta, sing saha nu miharep, nya nyokot tempat mulang ka Pangéranana.",
  "78:40:su": "Saéstuna Kami geus méré peringatan ka aranjeun ngeunaan siksaan nu deukeut, dina poé nalika manusa ningali naon anu geus dipigawé ku leungeunna; sarta jalma kafir ngomong, \"Duh, mugia-mugia kuring jadi taneuh wungkul.\"",

  // QS 114: An-Nas
  "114:1:su": "Ucapkeun (Muhammad), \"Kuring malindungan ka Pangéranana manusa,\"",
  "114:2:su": "\"Rajaana manusa,\"",
  "114:3:su": "\"Sésébrahaanana manusa,\"",
  "114:4:su": "\"Tina kajahatan (sétan) nu sok ngagoda, nu sok nyumput,\"",
  "114:5:su": "\"Anu ngagoda dina jero dada manusa,\"",
  "114:6:su": "\"Ti (golongan) jin jeung manusa.\"",

  // QS 113: Al-Falaq
  "113:1:su": "Ucapkeun (Muhammad), \"Kuring malindungan ka Pangéran nu ngawasa subuh,\"",
  "113:2:su": "\"Tina kajahatan naon anu geus diciptakeun ku Anjeunna,\"",
  "113:3:su": "\"Jeung tina kajahatan peuting nalika geus poék,\"",
  "113:4:su": "\"Sarta tina kajahatan tukang sihir anu niup kana buhul-buhul,\"",
  "113:5:su": "\"Jeung tina kajahatan jalmi anu dengki nalika manéhna dengki.\"",

  // QS 112: Al-Ikhlas
  "112:1:su": "Ucapkeun (Muhammad), \"Anjeunna Alloh téh Maha Tunggal.\"",
  "112:2:su": "\"Alloh téh tempat gumantungna sagala rupa.\"",
  "112:3:su": "\"Anjeunna henteu baranahan sarta henteu dibaranahkeun.\"",
  "112:4:su": "\"Jeung henteu aya hiji ogé anu sarua jeung Anjeunna.\"",

  // QS 111: Al-Lahab / Al-Masad
  "111:1:su": "Binasalah kadua leungeun Abu Lahab jeung saéstuna binasa manéhna.",
  "111:2:su": "Teu aya gunana pikeun manéhna harta bandana jeung naon anu diusahakeun ku manéhna.",
  "111:3:su": "Engké manéhna bakal asup kana seuneu nu hurung.",
  "111:4:su": "Jeung ogé pamajikanana, tukang mawa suluh (panyebar fitnah),",
  "111:5:su": "Dina beuheungna aya tali tina sabut anu dianyam.",

  // QS 110: An-Nashr
  "110:1:su": "Lamun geus datang pitulung Alloh jeung kameunangan,",
  "110:2:su": "Jeung anjeun nénjo manusa asup kana agama Alloh kalayan ngabagilir,",
  "110:3:su": "Tuluy geura kucapkeun tasbih kalayan muji ka Pangéran anjeun sarta ménta pangampura ka Anjeunna. Saéstuna Anjeunna téh Nu Maha Narima tobat.",

  // QS 109: Al-Kafirun
  "109:1:su": "Ucapkeun (Muhammad), \"Héy jalmi-jalmi kafir!\"",
  "109:2:su": "\"Kuring moal nyembah naon anu aranjeun sembah.\"",
  "109:3:su": "\"Jeung aranjeun lain panyembah kana naon anu kuring sembah.\"",
  "109:4:su": "\"Jeung kuring henteu kungsi jadi panyembah kana naon anu aranjeun sembah.\"",
  "109:5:su": "\"Jeung aranjeun henteu kungsi (ogé) jadi panyembah kana naon anu kuring sembah.\"",
  "109:6:su": "\"Pikeun aranjeun agama aranjeun, jeung pikeun kuring agama kuring.\"",

  // QS 108: Al-Kautsar
  "108:1:su": "Saéstuna Kami geus maparin ka anjeun (Muhammad) nikmat nu kacida lobana.",
  "108:2:su": "Ku sabab éta, dirikeun solat karana Pangéran anjeun, jeung geura berkurban.",
  "108:3:su": "Saéstuna jalmi nu ngaranna benci ka anjeun, éta manéhna nu bakal pegat (tina sagala kahadéan).",

  // QS 107: Al-Ma'un
  "107:1:su": "Naha anjeun nénjo jalmi nu ngabohongkeun ageman?",
  "107:2:su": "Éta jalmi nu ngusir budak yatim,",
  "107:3:su": "Jeung teu ngajak méré dahar ka jalmi miskin.",
  "107:4:su": "Ku sabab éta, cilaka pikeun jalmi-jalmi nu ngalaksanakeun solat,",
  "107:5:su": "Nyaéta jalmi-jalmi anu lalawora kana solatna,",
  "107:6:su": "Jalmi-jalmi nu sok riya,",
  "107:7:su": "Jeung ngalarang (méré) barang anu gunana pikeun batur.",

  // QS 106: Quraish
  "106:1:su": "Sabab kabiasaan urang Quraisy,",
  "106:2:su": "Nyaéta kabiasaan maranéhna usum tiis jeung usum panas,",
  "106:3:su": "Ku sabab éta, maranéhna kudu nyembah Pangéran ieu Baitullah (Ka'bah).",
  "106:4:su": "Anu geus méré kadaharan ka maranéhna pikeun ngaleungitkeun kalaparan sarta ngamankeun maranéhna tina kasieun.",

  // QS 105: Al-Fil
  "105:1:su": "Naha anjeun teu niténan kumaha Pangéran anjeun ngabinasakeun pasukan gajah?",
  "105:2:su": "Naha Anjeunna henteu ngajadikeun tipu daya maranéhna rugi?",
  "105:3:su": "Jeung Anjeunna ngirimkeun ka maranéhna rombongan manuk Ababil,",
  "105:4:su": "Anu malédogan maranéhna ku batu tina taneuh nu dibeuleum,",
  "105:5:su": "Tuluy Anjeunna ngajadikeun maranéhna siga dangdaunan nu dimakan ku hileud.",

  // QS 104: Al-Humazah
  "104:1:su": "Cilaka pikeun unggal jalmi nu sok ngahinakeun jeung nyacad batur,",
  "104:2:su": "Anu ngumpulkeun harta banda jeung ngitungan-ngitunganana,",
  "104:3:su": "Manéhna nyangka yén harta bandana bisa ngajadikeun manéhna kakal.",
  "104:4:su": "Ulah kitu! Saéstuna manéhna bakal dialungkeun ka (naraka) Huthamah.",
  "104:5:su": "Jeung naha anjeun nyaho naon ari naraka Huthamah téh?",
  "104:6:su": "Nyaéta seuneu Alloh anu dihurungkeun,",
  "104:7:su": "Anu (ngaduruk) nepi ka jero hate.",
  "104:8:su": "Saéstuna seuneu éta dikonci rapet luhureun maranéhna,",
  "104:9:su": "Dina (kaayaan) tihang-tihang anu panjang.",

  // QS 103: Al-'Ashr
  "103:1:su": "Demi mangsa (waktu).",
  "103:2:su": "Saéstuna manusa téh aya dina karugian,",
  "103:3:su": "Iwal ti jalmi-jalmi anu ariman jeung ngalakonan amal soléh, sarta silih wasiat dina (ngajalankeun) kabeneran, jeung silih wasiat dina kasabaran.",

  // QS 102: At-Takatsur
  "102:1:su": "Aranjeun geus dilalaworakeun ku pahili-hili (dina ngumpulkeun harta banda),",
  "102:2:su": "Nepi ka aranjeun ngadatangan kuburan.",
  "102:3:su": "Ulah kitu! Engké aranjeun bakal nyaho.",
  "102:4:su": "Sakali deui, ulah kitu! Engké aranjeun bakal nyaho.",
  "102:5:su": "Ulah kitu! Upama aranjeun nyaho kalayan élmu pangaweruh anu yakin (niscaya aranjeun moal kitu),",
  "102:6:su": "Saéstuna aranjeun bakal nénjo naraka Jahim.",
  "102:7:su": "Saterusna aranjeun bakal nénjo kalawan panon kaharepan (anu yakin).",
  "102:8:su": "Saterusna dina poé éta aranjeun bakal dipariksa ngeunaan kanikmatan (anu geus ditampi di dunya).",

  // QS 101: Al-Qari'ah
  "101:1:su": "Poé kiamat anu ngaguruh,",
  "101:2:su": "Naon ari poé kiamat nu ngaguruh téh?",
  "101:3:su": "Jeung naha anjeun nyaho naon ari poé kiamat nu ngaguruh téh?",
  "101:4:su": "Dina poé éta manusa siga kukupu nu pabalatak,",
  "101:5:su": "Jeung gunung-gunung siga bulu nu dihamburkeun.",
  "101:6:su": "Ku sabab éta, sing saha jalmi nu beurat timbangan (kahadéan)na,",
  "101:7:su": "Mangka manéhna aya dina kahirupan nu matak nyugemakeun (sawarga).",
  "101:8:su": "Jeung sing saha jalmi nu hampang timbangan (kahadéan)na,",
  "101:9:su": "Mangka tempat mulangna nyaéta (naraka) Hawiyah.",
  "101:10:su": "Jeung naha anjeun nyaho naon ari (naraka) Hawiyah téh?",
  "101:11:su": "Nyaéta seuneu anu kacida panasna.",

  // QS 100: Al-'Adiyat
  "100:1:su": "Demi kuda perang nu lumpat tarik ngaharéngas,",
  "100:2:su": "Jeung kuda nu nyéotkeun seuneu (tina panapak sukuna),",
  "100:3:su": "Jeung kuda nu narajang (musuh) dina wanci isuk-isuk,",
  "100:4:su": "Nepi ka ngabrulkeun kekebul,",
  "100:5:su": "Lajeng nyurungkul ka tengah-tengah musuh,",
  "100:6:su": "Saéstuna manusa téh kacida henteu syukurna ka Pangéranana.",
  "100:7:su": "Jeung saéstuna manéhna jadi saksi kana kajadian éta.",
  "100:8:su": "Jeung saéstuna manéhna kacida cintana kana harta banda.",
  "100:9:su": "Naha manéhna henteu nyaho lamun naon anu aya di jero kuburan dibangkitkeun,",
  "100:10:su": "Jeung naon anu aya di jero dada ditingalikeun?",
  "100:11:su": "Saéstuna Pangéran maranéhna dina poé éta ka maranéhna téh Maha Waspada.",

  // QS 99: Al-Zalzalah
  "99:1:su": "Lamun bumi dioyagkeun kalawan oyagna nu kacida dahsyatna,",
  "99:2:su": "Jeung bumi ngaluarkeun eusina nu beurat-beurat,",
  "99:3:su": "Jeung manusa ngaromong, \"Naon sababna bumi (kieu)?\"",
  "99:4:su": "Dina poé éta bumi nyaritakeun warta-wartana,",
  "99:5:su": "Ku sabab saéstuna Pangéran anjeun geus maréntahkeun (kitu) ka éta.",
  "99:6:su": "Dina poé éta manusa kaluar kalawan papisah sangkan ditingalikeun ka maranéhna (ganjaran) sagala amal maranéhna.",
  "99:7:su": "Ku sabab éta, sing saha anu ngalakonan kahadéan sanajan sabobot atom, niscaya manéhna bakal nénjo (ganjaran)na.",
  "99:8:su": "Jeung sing saha anu ngalakonan kajahatan sanajan sabobot atom, niscaya manéhna bakal nénjo (ganjaran)na ogé.",

  // QS 36: Yasin (selected verses for space)
  "36:1:su": "Yaa Siin.",
  "36:2:su": "Demi Al-Qur'an nu pinuh ku hikmah.",
  "36:3:su": "Saéstuna anjeun (Muhammad) téh kaasup salah saurang ti antara para utusan.",
  "36:4:su": "(Anu aya) dina jalan nu lempeng.",
  "36:5:su": "(Minangka wahyu) nu diturunkeun ku Nu Maha Gagah, Nu Maha Asih.",
  "36:6:su": "Sangkan anjeun méré peringatan ka hiji kaum; karuhun-karuhun maranéhna can kungsi dibéré peringatan, ku kituna maranéhna lalawora.",
  "36:7:su": "Saéstuna geus tangtu kalakuan (siksa) kana lolobana ti antara maranéhna, sabab maranéhna henteu ariman.",
  "36:8:su": "Saéstuna Kami geus nalingakeun balang-balang dina beuheung maranéhna, nepi ka gado maranéhna, tuluy maranéhna jongjon.",
  "36:9:su": "Jeung Kami pasangkeun pinding di hareupeun maranéhna sarta pinding di tukangeun maranéhna. Laju Kami tutup (panon) maranéhna nepi ka maranéhna teu bisa nénjo.",
  "36:10:su": "Jeung sarua baé pikeun maranéhna, naha anjeun méré peringatan atawa henteu méré peringatan ka maranéhna, maranéhna moal ariman.",

  // QS 67: Al-Mulk (selected)
  "67:1:su": "Maha Suci Alloh anu dina panangan-Na sagala karajaan, jeung Anjeunna Maha Kawasa kana sagala hal.",
  "67:2:su": "Anu nyiptakeun maot jeung hirup, pikeun nguji aranjeun, saha di antara aranjeun nu panghadéna amalna. Jeung Anjeunna Nu Maha Gagah, Nu Maha Jembar Pangampura.",
  "67:3:su": "Anu nyiptakeun tujuh langit nu marandéan (tumpuk tindih); anjeun moal nénjo dina ciptaan Nu Maha Welas nanaon nu teu saimbang. Ku sabab éta, sing titénan deui, naha anjeun nénjo aya karuksakan?",

  // QS 55: Ar-Rahman (selected)
  "55:1:su": "(Alloh) Nu Maha Welas.",
  "55:2:su": "Anu geus ngajarkeun Al-Qur'an.",
  "55:3:su": "Anjeunna nyiptakeun manusa.",
  "55:4:su": "Anjeunna ngajarkeun ngomong.",
  "55:5:su": "Panonpoé jeung bulan (ngider) nurutkeun itungan.",
  "55:6:su": "Jeung tutuwuhan nu ngarambat dina taneuh sarta pepelakan nu ngarungkun, duanana sujud ka Anjeunna.",
  "55:7:su": "Jeung Anjeunna ngaluhurkeun langit sarta Anjeunna netepkeun kasaimbangan.",

  // QS 56: Al-Waqi'ah (selected)
  "56:1:su": "Lamun poé kiamat geus datang,",
  "56:2:su": "Datangna henteu aya nu ngabohongkeun.",
  "56:3:su": "(Kajadian éta) ngaréndahkeun (hiji golongan) jeung ngaluhurkeun (golongan lian).",
  "56:4:su": "Lamun bumi dioyagkeun ku oyagna nu dahsyat,",
  "56:5:su": "Jeung gunung-gunung diancurkeun ku ancurna nu satékah polah,",
};

// ====== JAWA — Dataset Awal ======
const JAWA_TRANSLATIONS: TranslationDB = {
  "1:1:jv": "Kanthi asmaning Allah Kang Maha Welas, Kang Maha Asih.",
  "1:2:jv": "Sedaya puji kagungan Allah, Pangeraning alam sadaya.",
  "1:3:jv": "Kang Maha Welas, Kang Maha Asih.",
  "1:4:jv": "Kang nguwasani dina dinten piwales.",
  "1:5:jv": "Namung dhumateng Allah anggen kawula manembah, saha namung dhumateng Allah anggen kawula nyuwun pitulung.",
  "1:6:jv": "Dhuh Allah, mugi nedahaken dhateng kawula margi ingkang leres,",
  "1:7:jv": "Inggih punika marginipun para tiyang ingkang sampun Paduka paringi nikmat, sanes marginipun tiyang ingkang kesasar.",
  "114:1:jv": "Muhammad, sira ngucapa: \"Kawula nyuwun pangayoman dhateng Pangeraning manungsa,\"",
  "114:2:jv": "\"Ratu nipun manungsa,\"",
  "114:3:jv": "\"Sesembahanipun manungsa,\"",
  "114:4:jv": "\"Saking pialanipun setan ingkang asring anggoda, ingkang asring ndhelik,\"",
  "114:5:jv": "\"Ingkang anggoda wonten ing njeron dhadhanipun manungsa,\"",
  "114:6:jv": "\"Saking golongan jin saha manungsa.\"",
};

// Combined database
const ALL_TRANSLATIONS: TranslationDB = {
  ...SUNDA_TRANSLATIONS,
  ...JAWA_TRANSLATIONS,
};

/**
 * Get regional translation for a specific verse
 * Returns empty string if not available
 */
export const getRegionalTranslation = (surah: number, verse: number, langCode: string): string => {
  const key = `${surah}:${verse}:${langCode}`;
  return ALL_TRANSLATIONS[key] || '';
};

/**
 * Get available language codes for a verse
 */
export const getAvailableLanguages = (surah: number, verse: number): string[] => {
  const available: string[] = [];
  REGIONAL_LANGUAGES.forEach(lang => {
    if (ALL_TRANSLATIONS[`${surah}:${verse}:${lang.code}`]) {
      available.push(lang.code);
    }
  });
  return available;
};

/**
 * Get language info by code
 */
export const getLanguageInfo = (code: string): RegionalLanguage | undefined => {
  return REGIONAL_LANGUAGES.find(l => l.code === code);
};

// Total translation entries
export const getTranslationStats = () => {
  const stats: Record<string, number> = {};
  REGIONAL_LANGUAGES.forEach(lang => {
    stats[lang.code] = Object.keys(ALL_TRANSLATIONS).filter(k => k.endsWith(`:${lang.code}`)).length;
  });
  return stats;
};

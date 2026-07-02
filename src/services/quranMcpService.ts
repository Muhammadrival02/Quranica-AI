import { GoogleGenAI, Type } from '@google/genai';

export async function fetchQuranMcpData(surah: string, ayah: string) {
  try {
    // Fetch real Quran text and translation from AlQuran Cloud API
    const quranResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,id.indonesian`);
    if (!quranResponse.ok) {
      throw new Error("Gagal mengambil data dari AlQuran Cloud API");
    }
    const quranData = await quranResponse.json();
    
    const arabicText = quranData.data[0].text;
    const translation = quranData.data[1].text;

    // Get API Key
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      // If no API key, return basic data so the UI still updates the Ayah
      return {
        verifiedText: arabicText,
        transliteration: translation, // Fallback to translation if transliteration can't be generated
        morphology: "API Key Gemini tidak ditemukan.",
        tafsir: "API Key Gemini tidak ditemukan.",
        tajwidRules: "API Key Gemini tidak ditemukan."
      };
    }

    // Use Gemini for morphology, transliteration, and tafsir
    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    
    const prompt = `Berikan data tambahan untuk ayat Al-Qur'an berikut:
    Teks Arab: ${arabicText}
    Terjemahan: ${translation}
    
    Anda memiliki akses ke basis pengetahuan berikut mengenai ilmu tajwid:
    1. Matan Al-Jazariyah
    2. Matan Tuhfatul Athfal
    3. Buku "مقرر التجويد كاملاً" (Materi Tajwid Lengkap) yang membahas:
       - Makharijul Huruf (Jauf, Halq, Lisan, Syafatain, Khaisyum)
       - Sifat-sifat Huruf (Hams, Jahr, Syiddah, Rakhawah, Isti'la, Istifal, dll)
       - Hukum Nun Mati dan Tanwin (Idzhar, Idgham, Iqlab, Ikhfa)
       - Hukum Mim Mati
       - Hukum Lam Mati
       - Hubungan Antar Huruf (Mutamatsilain, Mutaqaribain, Mutajanisain, Mutaba'idain)
       - Tafkhim dan Tarqiq
       - Pertemuan Dua Sukun (Iltaqa' As-Sakinain)
       - Waqaf dan Ibtida'
       - Al-Maqtu' wal Maushul
       - At-Ta'at (Ta' Maftuhah dan Marbuthah)
       - Hamzatul Wasl dan Hamzah Qath'
       - Hadzf dan Itsbat
    
    Berikan HANYA dalam format JSON valid dengan struktur persis seperti ini tanpa teks lain:
    {
      "transliteration": "Cara membaca dalam huruf latin (transliterasi)",
      "morphology": "Analisis akar kata utama (Root word) dari salah satu kata penting di ayat tersebut",
      "tafsir": "Tafsir ringkas (berdasarkan Ibnu Katsir atau Jalalayn)",
      "tajwidRules": "Sebutkan 1-2 hukum tajwid utama dalam ayat ini berdasarkan basis pengetahuan di atas. WAJIB sertakan kutipan bait teks Arab asli dari Matan Tuhfatul Athfal ATAU Matan Al-Jazariyah yang relevan."
    }`;
    
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transliteration: { type: Type.STRING },
            morphology: { type: Type.STRING },
            tafsir: { type: Type.STRING },
            tajwidRules: { type: Type.STRING }
          },
          required: ["transliteration", "morphology", "tafsir", "tajwidRules"]
        }
      }
    });
    
    const aiData = JSON.parse(res.text || "{}");
    
    return {
      verifiedText: arabicText,
      transliteration: aiData.transliteration || translation,
      morphology: aiData.morphology || "Tidak tersedia",
      tafsir: aiData.tafsir || "Tidak tersedia",
      tajwidRules: aiData.tajwidRules || "Tidak tersedia"
    };
  } catch (error: any) {
    console.error("Error fetching Quran data:", error);
    throw new Error(error.message || "Gagal memproses data RAG.");
  }
}

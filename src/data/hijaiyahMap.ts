// Hijaiyah 28 huruf — urutan standar (VN 001-028)
// Digunakan untuk koreksi E-Tahsin: user salah lafalkan huruf X → dapat VN nomor urut X
export const HIJAIYAH_MAP: Record<string, { nomor: number; nama: string; vn: string }> = {
  "ا": { nomor: 1, nama: "Alif", vn: "001" },
  "ب": { nomor: 2, nama: "Ba", vn: "002" },
  "ت": { nomor: 3, nama: "Ta", vn: "003" },
  "ث": { nomor: 4, nama: "Tsa", vn: "004" },
  "ج": { nomor: 5, nama: "Jim", vn: "005" },
  "ح": { nomor: 6, nama: "Ha", vn: "006" },
  "خ": { nomor: 7, nama: "Kha", vn: "007" },
  "د": { nomor: 8, nama: "Dal", vn: "008" },
  "ذ": { nomor: 9, nama: "Dzal", vn: "009" },
  "ر": { nomor: 10, nama: "Ra", vn: "010" },
  "ز": { nomor: 11, nama: "Za", vn: "011" },
  "س": { nomor: 12, nama: "Sin", vn: "012" },
  "ش": { nomor: 13, nama: "Syin", vn: "013" },
  "ص": { nomor: 14, nama: "Shad", vn: "014" },
  "ض": { nomor: 15, nama: "Dhad", vn: "015" },
  "ط": { nomor: 16, nama: "Tha", vn: "016" },
  "ظ": { nomor: 17, nama: "Zha", vn: "017" },
  "ع": { nomor: 18, nama: "Ain", vn: "018" },
  "غ": { nomor: 19, nama: "Ghain", vn: "019" },
  "ف": { nomor: 20, nama: "Fa", vn: "020" },
  "ق": { nomor: 21, nama: "Qaf", vn: "021" },
  "ك": { nomor: 22, nama: "Kaf", vn: "022" },
  "ل": { nomor: 23, nama: "Lam", vn: "023" },
  "م": { nomor: 24, nama: "Mim", vn: "024" },
  "ن": { nomor: 25, nama: "Nun", vn: "025" },
  "و": { nomor: 26, nama: "Waw", vn: "026" },
  "ه": { nomor: 27, nama: "Ha", vn: "027" },
  "ي": { nomor: 28, nama: "Ya", vn: "028" },
};

export function getKoreksiVn(huruf: string): string | null {
  return HIJAIYAH_MAP[huruf]?.vn || null;
}

export function getHurufByVn(vn: string): string | null {
  for (const [h, data] of Object.entries(HIJAIYAH_MAP)) {
    if (data.vn === vn) return h;
  }
  return null;
}

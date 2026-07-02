import React, { useState, useRef } from 'react';

// Mapping huruf → VN
const VN_MAP: Record<string, string> = {
  'ا':'001','ب':'002','ت':'003','ث':'004','ج':'005','ح':'006','خ':'007',
  'د':'008','ذ':'009','ر':'010','ز':'011','س':'012','ش':'013','ص':'014',
  'ض':'015','ط':'016','ظ':'017','ع':'018','غ':'019','ف':'020','ق':'021',
  'ك':'022','ل':'023','م':'024','ن':'025','و':'026','ه':'027','ي':'028',
  'ء':'001', // Hamzah pakai Alif
};

interface MakhrajPoint {
  id: string;
  label: string;
  huruf: string[];
  x: number;
  y: number;
  penjelasan: string;
  warna: string;
}

const MAKHARIJ_DATA: MakhrajPoint[] = [
  // Al-Jauf (rongga mulut)
  { id: 'jauf', label: 'Al-Jauf\n(Rongga Mulut)', huruf: ['ا', 'و', 'ي'], x: 50, y: 15, warna: '#10b981',
    penjelasan: 'Al-Jauf adalah rongga mulut dan tenggorokan bagian dalam. Huruf Mad: Alif (ا) setelah fathah, Waw (و) sukun setelah dhammah, Ya (ي) sukun setelah kasrah. Suara keluar dari rongga tanpa hambatan.' },
  
  // Aqsha al-Halq (pangkal tenggorokan)
  { id: 'aqsa', label: 'Aqsha al-Halq\n(Pangkal Tenggorokan)', huruf: ['ء', 'ه'], x: 50, y: 30, warna: '#ef4444',
    penjelasan: 'Aqsha al-Halq adalah pangkal tenggorokan paling dalam. Huruf Hamzah (ء) dan Ha (ه). Hamzah dihasilkan dari tekanan pita suara, Ha dari aliran napas.' },
  
  // Wasath al-Halq (tengah tenggorokan)
  { id: 'wasath', label: 'Wasath al-Halq\n(Tengah Tenggorokan)', huruf: ['ع', 'ح'], x: 50, y: 42, warna: '#f97316',
    penjelasan: 'Wasath al-Halq adalah tengah tenggorokan. Huruf Ain (ع) dan Ha (ح). Ain dari tengah tenggorokan dengan getaran, Ha dari tengah dengan desiran.' },
  
  // Adna al-Halq (ujung tenggorokan)
  { id: 'adna', label: 'Adna al-Halq\n(Ujung Tenggorokan)', huruf: ['غ', 'خ'], x: 50, y: 54, warna: '#eab308',
    penjelasan: 'Adna al-Halq adalah ujung tenggorokan dekat lidah. Huruf Ghain (غ) dan Kha (خ). Suara mengalir dengan getaran di langit-langit lunak.' },
  
  // Aqsha al-Lisan (pangkal lidah)
  { id: 'aqsaLisan', label: 'Aqsha al-Lisan\n(Pangkal Lidah)', huruf: ['ق'], x: 72, y: 55, warna: '#06b6d4',
    penjelasan: 'Aqsha al-Lisan: pangkal lidah bertemu langit-langit lunak. Huruf Qaf (ق). Lidah diangkat ke langit-langit lunak, suara tebal (tafkhim).' },
  
  // Wasath al-Lisan (tengah lidah)
  { id: 'wasathLisan', label: 'Wasath al-Lisan\n(Tengah Lidah)', huruf: ['ج', 'ش', 'ي'], x: 75, y: 65, warna: '#8b5cf6',
    penjelasan: 'Wasath al-Lisan: tengah lidah bertemu langit-langit keras. Huruf Jim (ج), Syin (ش), dan Ya (ي) non-mad. Lidah menyentuh langit-langit.' },
  
  // Hafah al-Lisan (sisi lidah)
  { id: 'hafah', label: 'Hafah al-Lisan\n(Sisi Lidah)', huruf: ['ض'], x: 85, y: 72, warna: '#ec4899',
    penjelasan: 'Hafah al-Lisan: sisi lidah bertemu gigi geraham. Huruf Dhad (ض). Lidah menekan ke samping, suara tebal dan panjang. Paling sulit di antara huruf Arab.' },
  
  // Tarf al-Lisan (ujung lidah)
  { id: 'tarf', label: 'Tarf al-Lisan\n(Ujung Lidah)', huruf: ['ل', 'ن', 'ر', 'ت', 'د', 'ط', 'ظ', 'ذ', 'ث', 'ص', 'ز', 'س'], x: 88, y: 82, warna: '#14b8a6',
    penjelasan: 'Tarf al-Lisan: ujung lidah bertemu berbagai titik. Lam (ل) ke gusi depan, Nun (ن) ke gusi, Ra (ر) getaran ujung lidah. Ta (ت) Dal (د) Tha (ط) ke pangkal gigi atas. Zha (ظ) Dzal (ذ) Tsa (ث) ke ujung gigi. Shad (ص) Sin (س) Za (ز) ke antara gigi.' },
  
  // Syafatain (dua bibir)
  { id: 'syafatain', label: 'Asy-Syafatain\n(Dua Bibir)', huruf: ['ب', 'م', 'و', 'ف'], x: 50, y: 85, warna: '#f43f5e',
    penjelasan: 'Asy-Syafatain: dua bibir. Ba (ب) dan Mim (م) dari menutup bibir. Waw (و) dari membulatkan bibir. Fa (ف) dari bibir bawah + gigi atas.' },
  
  // Al-Khaisyum (rongga hidung)
  { id: 'khaisyum', label: 'Al-Khaisyum\n(Rongga Hidung)', huruf: ['م', 'ن'], x: 50, y: 25, warna: '#a855f7',
    penjelasan: 'Al-Khaisyum: rongga hidung untuk ghunnah (dengung). Berlaku pada Mim (م) dan Nun (ن) bertasydid, serta ikhfa dan iqlab. Suara resonansi nasal.' },
];

export default function MakharijulHuruf() {
  const [activePoint, setActivePoint] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const speakingRef = useRef(false);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    speakingRef.current = true;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'id-ID';
    utter.rate = 0.85;
    utter.onend = () => { speakingRef.current = false; };
    window.speechSynthesis.speak(utter);
  };

  const playVN = (huruf: string) => {
    const vn = VN_MAP[huruf];
    if (!vn) return;
    const audio = new Audio(`/vn/vn_${vn}.mp3`);
    audio.play();
  };

  const playAllVN = (hurufList: string[]) => {
    let i = 0;
    const playNext = () => {
      if (i >= hurufList.length) return;
      const vn = VN_MAP[hurufList[i]];
      if (vn) {
        const audio = new Audio(`/vn/vn_${vn}.mp3`);
        audio.onended = () => { i++; playNext(); };
        audio.play();
      } else {
        i++;
        playNext();
      }
    };
    playNext();
  };

  const active = MAKHARIJ_DATA.find(p => p.id === activePoint);

  const togglePoint = (id: string) => {
    if (activePoint === id) {
      setActivePoint(null);
    } else {
      setActivePoint(id);
      const point = MAKHARIJ_DATA.find(p => p.id === id);
      if (point) {
        speak(`Makhraj ${point.label.replace('\n', ' ')}. ${point.penjelasan}`);
      }
    }
  };

  return (
    <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-emerald-400 font-bold text-lg flex items-center gap-2">
          🗣️ Makharijul Huruf Interaktif
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? 'Sembunyikan' : 'Tampilkan Semua'} ▼
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* SVG Diagram */}
        <div className="relative w-full lg:w-64 aspect-[3/4] bg-slate-950 rounded-xl border border-slate-700 overflow-hidden flex-shrink-0">
          {/* Mouth outer shape */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Head outline */}
            <ellipse cx="50" cy="50" rx="45" ry="48" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
            
            {/* Mouth area background */}
            <path d="M 20 25 Q 20 15, 50 10 Q 80 15, 80 25 L 80 90 Q 50 95, 20 90 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            
            {/* Nasal cavity */}
            <ellipse cx="50" cy="18" rx="12" ry="6" fill="#a855f7" fillOpacity="0.15" stroke="#a855f7" strokeWidth="0.5" />
            <text x="50" y="20" textAnchor="middle" fill="#a855f7" fontSize="3" fontFamily="monospace">Hidung</text>
            
            {/* Throat zones */}
            <rect x="35" y="28" width="30" height="8" rx="2" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="0.5" />
            <text x="50" y="33" textAnchor="middle" fill="#ef4444" fontSize="2.5" fontFamily="monospace">Pangkal</text>
            
            <rect x="35" y="37" width="30" height="8" rx="2" fill="#f97316" fillOpacity="0.2" stroke="#f97316" strokeWidth="0.5" />
            <text x="50" y="42" textAnchor="middle" fill="#f97316" fontSize="2.5" fontFamily="monospace">Tengah</text>
            
            <rect x="35" y="46" width="30" height="8" rx="2" fill="#eab308" fillOpacity="0.2" stroke="#eab308" strokeWidth="0.5" />
            <text x="50" y="51" textAnchor="middle" fill="#eab308" fontSize="2.5" fontFamily="monospace">Ujung</text>
            
            {/* Tongue */}
            <path d="M 45 55 Q 50 50, 55 55 Q 70 60, 85 75 Q 90 80, 88 85 Q 85 88, 70 80 Q 50 70, 40 60 Z" 
                  fill="#f472b6" fillOpacity="0.15" stroke="#f472b6" strokeWidth="0.5" />
            <text x="68" y="68" textAnchor="middle" fill="#f472b6" fontSize="3" fontFamily="monospace">Lidah</text>
            
            {/* Teeth */}
            <path d="M 75 82 Q 80 80, 85 82" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
            <path d="M 72 85 Q 78 83, 84 85" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
            
            {/* Lips */}
            <path d="M 20 85 Q 30 82, 50 80 Q 70 82, 80 85" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
            <text x="50" y="92" textAnchor="middle" fill="#f43f5e" fontSize="3" fontFamily="monospace">Bibir</text>
            
            {/* Gum line */}
            <path d="M 25 78 Q 50 75, 75 78" fill="none" stroke="#94a3b8" strokeWidth="0.3" strokeDasharray="1 1" />
            
            {/* Interactive clickable zones */}
            {MAKHARIJ_DATA.map((point) => (
              <g key={point.id} onClick={() => togglePoint(point.id)} className="cursor-pointer">
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={activePoint === point.id ? 5 : 3.5}
                  fill={point.warna}
                  fillOpacity={activePoint === point.id ? 0.6 : 0.3}
                  stroke={point.warna}
                  strokeWidth={activePoint === point.id ? 1.5 : 0.5}
                  className="transition-all duration-200"
                />
                {activePoint === point.id && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={7}
                    fill="none"
                    stroke={point.warna}
                    strokeWidth="0.5"
                    strokeDasharray="1 1"
                    className="animate-pulse"
                  />
                )}
              </g>
            ))}
            
            {/* Title */}
            <text x="50" y="96" textAnchor="middle" fill="#64748b" fontSize="4" fontFamily="monospace">MAKHARIJUL HURUF</text>
          </svg>
        </div>

        {/* Info Panel */}
        <div className="flex-1 space-y-3">
          {active ? (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 animate-in fade-in">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: active.warna }} />
                <h4 className="text-white font-bold text-sm whitespace-pre-line">{active.label}</h4>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {active.huruf.map((h) => (
                  <button
                    key={h}
                    onClick={() => playVN(h)}
                    title={`Dengar VN ${h}`}
                    className="text-2xl font-arabic px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all active:scale-90 cursor-pointer"
                    style={{ fontFamily: 'Traditional Arabic, serif' }}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">{active.penjelasan}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => speak(active.penjelasan)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95"
                >
                  🔊 Dengar Penjelasan
                </button>
                <button
                  onClick={() => playAllVN(active.huruf)}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95"
                >
                  🎵 Putar Semua VN
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 border-dashed flex items-center justify-center h-32">
              <div className="text-center text-slate-500">
                <p className="text-3xl mb-2">👆</p>
                <p className="text-sm">Klik titik pada diagram untuk melihat makhraj</p>
                <p className="text-xs text-slate-600 mt-1">Audio penjelasan otomatis diputar</p>
              </div>
            </div>
          )}

          {expanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
              {MAKHARIJ_DATA.map((point) => (
                <button
                  key={point.id}
                  onClick={() => togglePoint(point.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-all ${
                    activePoint === point.id
                      ? 'bg-slate-700 border border-slate-500'
                      : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: point.warna }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 font-medium truncate">{point.label.replace('\n', ' ')}</p>
                    <p className="text-slate-500 truncate">{point.huruf.join(' ')}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

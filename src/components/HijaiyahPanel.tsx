import React, { useRef } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';

const HIJAIYAH_DATA = [
  { no: 1, huruf: 'ا', nama: 'Alif', vn: '001' },
  { no: 2, huruf: 'ب', nama: 'Ba', vn: '002' },
  { no: 3, huruf: 'ت', nama: 'Ta', vn: '003' },
  { no: 4, huruf: 'ث', nama: 'Tsa', vn: '004' },
  { no: 5, huruf: 'ج', nama: 'Jim', vn: '005' },
  { no: 6, huruf: 'ح', nama: 'Ha', vn: '006' },
  { no: 7, huruf: 'خ', nama: 'Kha', vn: '007' },
  { no: 8, huruf: 'د', nama: 'Dal', vn: '008' },
  { no: 9, huruf: 'ذ', nama: 'Dzal', vn: '009' },
  { no: 10, huruf: 'ر', nama: 'Ra', vn: '010' },
  { no: 11, huruf: 'ز', nama: 'Za', vn: '011' },
  { no: 12, huruf: 'س', nama: 'Sin', vn: '012' },
  { no: 13, huruf: 'ش', nama: 'Syin', vn: '013' },
  { no: 14, huruf: 'ص', nama: 'Shad', vn: '014' },
  { no: 15, huruf: 'ض', nama: 'Dhad', vn: '015' },
  { no: 16, huruf: 'ط', nama: 'Tha', vn: '016' },
  { no: 17, huruf: 'ظ', nama: 'Zha', vn: '017' },
  { no: 18, huruf: 'ع', nama: 'Ain', vn: '018' },
  { no: 19, huruf: 'غ', nama: 'Ghain', vn: '019' },
  { no: 20, huruf: 'ف', nama: 'Fa', vn: '020' },
  { no: 21, huruf: 'ق', nama: 'Qaf', vn: '021' },
  { no: 22, huruf: 'ك', nama: 'Kaf', vn: '022' },
  { no: 23, huruf: 'ل', nama: 'Lam', vn: '023' },
  { no: 24, huruf: 'م', nama: 'Mim', vn: '024' },
  { no: 25, huruf: 'ن', nama: 'Nun', vn: '025' },
  { no: 26, huruf: 'و', nama: 'Waw', vn: '026' },
  { no: 27, huruf: 'ه', nama: 'Ha', vn: '027' },
  { no: 28, huruf: 'ي', nama: 'Ya', vn: '028' },
];

export default function HijaiyahPanel() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState<string | null>(null);

  const playVN = (vn: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playing === vn) {
      setPlaying(null);
      return;
    }
    const audio = new Audio(`/vn/vn_${vn}.mp3`);
    audio.onended = () => setPlaying(null);
    audio.onerror = () => setPlaying(null);
    audio.play();
    audioRef.current = audio;
    setPlaying(vn);
  };

  const speakLetter = (huruf: string, nama: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(`Huruf ${nama}, ${huruf}`);
    utter.lang = 'ar-SA';
    utter.rate = 0.7;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-emerald-400 mb-2">📖 28 Huruf Hijaiyah</h2>
        <p className="text-slate-400 text-sm mb-6">
          Klik kartu untuk mendengar pelafalan. Gunakan sebagai panduan E-Tahsin.
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-7 lg:grid-cols-7 gap-3">
          {HIJAIYAH_DATA.map((item) => (
            <button
              key={item.no}
              onClick={() => playVN(item.vn)}
              onContextMenu={(e) => { e.preventDefault(); speakLetter(item.huruf, item.nama); }}
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                playing === item.vn
                  ? 'bg-emerald-600 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 hover:border-emerald-600/50 hover:bg-slate-750'
              }`}
              title={`${item.nama} - Klik: Audio VN | Klik Kanan: TTS`}
            >
              <span className="text-3xl mb-1 font-arabic" style={{ fontFamily: 'Traditional Arabic, Scheherazade New, serif' }}>
                {item.huruf}
              </span>
              <span className="text-[10px] text-slate-400">{item.nama}</span>
              <span className="text-[9px] text-slate-600">VN-{item.no}</span>
              {playing === item.vn && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-4 text-center">
          💡 Klik = Audio VN &nbsp;|&nbsp; Klik Kanan = Text-to-Speech (TTS)
        </p>
      </div>
    </div>
  );
}

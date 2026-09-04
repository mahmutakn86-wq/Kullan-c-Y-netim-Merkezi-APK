import React, { useState } from 'react';
import { Globe, Copy, Check, QrCode, Smartphone, Laptop, ShieldCheck, X, ExternalLink, Lock, ArrowUpRight } from 'lucide-react';

interface RemoteAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemoteAccessModal: React.FC<RemoteAccessModalProps> = ({ isOpen, onClose }) => {
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedPre, setCopiedPre] = useState(false);
  const [activeUrlType, setActiveUrlType] = useState<'dev' | 'pre'>('dev');

  if (!isOpen) return null;

  const devUrl = 'https://ais-dev-l2fembifbbwustocfsa7x6-781806603085.europe-west2.run.app';
  const preUrl = 'https://ais-pre-l2fembifbbwustocfsa7x6-781806603085.europe-west2.run.app';
  
  // Current active chosen URL
  const selectedUrl = activeUrlType === 'dev' ? devUrl : preUrl;

  const handleCopy = (url: string, type: 'dev' | 'pre') => {
    navigator.clipboard.writeText(url);
    if (type === 'dev') {
      setCopiedDev(true);
      setTimeout(() => setCopiedDev(false), 2500);
    } else {
      setCopiedPre(true);
      setTimeout(() => setCopiedPre(false), 2500);
    }
  };

  // Generate QR code URL using standard public QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(selectedUrl)}&bgcolor=15-23-42&color=52-211-153&margin=2`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#11141c] border border-[#2b3347] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative text-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#1c2230] hover:bg-[#283145] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 shrink-0">
            <Globe className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
              Canlı Bulut Yönetim Merkezi Bağlantısı
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                ● 7/24 Kesintisiz Aktif
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Bu bağlantıları telefonunuzda, tabletinizde veya herhangi bir bilgisayar tarayıcısında (Chrome, Edge, Safari) açarak Yönetim Merkezine doğrudan erişebilirsiniz.
            </p>
          </div>
        </div>

        {/* URL Type Tabs */}
        <div className="flex gap-2 p-1 bg-[#181d28] rounded-xl border border-[#262f40] mb-4">
          <button
            type="button"
            onClick={() => setActiveUrlType('dev')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeUrlType === 'dev'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202736]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>1. Ana Doğrudan Canlı URL (Önerilen)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveUrlType('pre')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeUrlType === 'pre'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202736]'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>2. Paylaşılan Önizleme URL'si</span>
          </button>
        </div>

        {/* Selected URL Card */}
        <div className="p-4 bg-[#161a24] rounded-xl border border-cyan-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              {activeUrlType === 'dev' ? 'Doğrudan Canlı Erişim Adresi (Dev Container):' : 'Paylaşılan Yayın Adresi (Pre Container):'}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              HTTPS Güvenli SSL
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={selectedUrl}
              className="flex-1 bg-[#0d1017] border border-[#2c3447] rounded-lg px-3.5 py-2.5 text-xs font-mono text-cyan-200 select-all focus:outline-none focus:border-cyan-400"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(selectedUrl, activeUrlType)}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  (activeUrlType === 'dev' && copiedDev) || (activeUrlType === 'pre' && copiedPre)
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                }`}
              >
                {(activeUrlType === 'dev' && copiedDev) || (activeUrlType === 'pre' && copiedPre) ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>URL Kopyala</span>
                  </>
                )}
              </button>
              <a
                href={selectedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors"
              >
                <span>Aç</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* QR Code & Mobile Instructions */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* QR Code Preview */}
          <div className="p-4 bg-[#161a24] rounded-xl border border-[#283144] flex flex-col items-center justify-center text-center">
            <div className="w-[140px] h-[140px] bg-slate-900 rounded-lg p-2 border border-emerald-500/40 shadow-inner flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="Canlı URL QR Kodu"
                className="w-full h-full object-contain rounded"
                loading="lazy"
              />
            </div>
            <p className="text-[11px] font-semibold text-slate-300 mt-2 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              Telefon veya Tabletinizden Okutun
            </p>
          </div>

          {/* Security & Access Info */}
          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-2.5 bg-[#161a24] rounded-lg border border-emerald-500/40 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300 block">Android APK / Uygulama Olarak Yükleme:</strong>
                <span className="text-[11px] text-slate-300">
                  Chrome'da linki açıp sağ üstteki <strong>üç noktaya (⋮)</strong> dokunun ve <strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> seçin. Telefonunuzda APK gibi masaüstü ikonu oluşur.
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-[#161a24] rounded-lg border border-[#283144] flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Giriş Bilgileriniz:</strong>
                <div className="font-mono text-[11px] text-slate-300 mt-0.5 space-y-0.5">
                  <div>Kullanıcı: <span className="text-cyan-300 font-bold">PotakOğlu</span></div>
                  <div>E-Posta: <span className="text-cyan-300">akincisurfer1@gmail.com</span></div>
                  <div>Şifre: <span className="text-cyan-300 font-bold">Akinci_B1927A38</span></div>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-[#161a24] rounded-lg border border-[#283144] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Canlı Kontrol & Uzaktan Kilit</strong>
                <span>Masaüstü lisanslarını istediğiniz her yerden anında yönetin ve sürelerini uzatın.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-[#232a3a] flex items-center justify-between">
          <a
            href={selectedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-bold"
          >
            <span>Yeni Sekmede Doğrudan Aç</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#202738] hover:bg-[#2b344a] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};


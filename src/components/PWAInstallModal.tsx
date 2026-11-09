import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  HardDrive
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'id' | 'en';
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const isId = language === 'id';

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {isId ? 'Pasang di Layar HP' : 'Install on Mobile Phone'}
              </h3>
              <p className="text-xs text-slate-400">
                {isId ? 'Tertanam mandiri di HP tanpa browser bar' : 'Embedded standalone app on your phone'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Native Install Prompt Banner if available */}
          {isInstallable && (
            <div className="bg-rose-950/40 border border-rose-500/40 p-4 rounded-2xl space-y-3">
              <div className="flex items-start space-x-3">
                <Download className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {isId ? 'Pemasangan Cepat Tersedia!' : 'Instant Install Available!'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isId
                      ? 'Klik tombol di bawah untuk memasang Cube ACR langsung ke aplikasi HP Anda.'
                      : 'Click below to install Cube ACR directly onto your device.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleNativeInstall}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{isId ? 'Pasang Sekarang ke HP' : 'Install Now to Phone'}</span>
              </button>
            </div>
          )}

          {/* OS Switcher Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'android' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Android (Chrome / Samsung)</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'ios' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>iPhone / iPad (iOS Safari)</span>
            </button>
          </div>

          {/* Step by Step Guide */}
          {activeTab === 'android' ? (
            <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
              <h5 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                {isId ? 'Cara Pasang di HP Android:' : 'How to install on Android:'}
              </h5>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs border border-indigo-500/30">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100">
                      {isId ? 'Buka menu browser' : 'Open browser menu'}
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5 flex items-center">
                      {isId ? 'Ketuk ikon titik tiga (⋮) di pojok kanan atas peramban Chrome.' : 'Tap the three-dots (⋮) icon in Chrome top right.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs border border-indigo-500/30">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100">
                      {isId ? 'Pilih "Pasang Aplikasi" / "Tambahkan ke Layar Utama"' : 'Select "Install app" or "Add to Home screen"'}
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {isId ? 'Pilih opsi "Install app" atau "Tambahkan ke Layar Utama".' : 'Tap "Install app" from the menu list.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs border border-indigo-500/30">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100">
                      {isId ? 'Selesai! Aplikasi tertanam di HP' : 'Done! App embedded on your phone'}
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {isId ? 'Ikon Cube ACR akan muncul di menu aplikasi HP Anda dan bisa dibuka offline.' : 'Cube ACR icon will appear in your app drawer.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
              <h5 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                {isId ? 'Cara Pasang di iPhone / iPad:' : 'How to install on iOS:'}
              </h5>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs border border-indigo-500/30">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 flex items-center">
                      {isId ? 'Ketuk tombol Bagikan' : 'Tap Share button'}
                      <Share2 className="w-3.5 h-3.5 ml-1.5 text-sky-400" />
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {isId ? 'Di Safari, ketuk tombol Share (kotak dengan panah ke atas) di baris bawah.' : 'In Safari, tap the Share icon at the bottom.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs border border-indigo-500/30">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 flex items-center">
                      {isId ? 'Pilih "Add to Home Screen"' : 'Select "Add to Home Screen"'}
                      <PlusSquare className="w-3.5 h-3.5 ml-1.5 text-emerald-400" />
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {isId ? 'Gulir ke bawah dan ketuk opsi "Tambahkan ke Layar Utama".' : 'Scroll down and tap "Add to Home Screen".'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs border border-indigo-500/30">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100">
                      {isId ? 'Ketuk "Tambah" (Add)' : 'Tap "Add"'}
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {isId ? 'Cube ACR kini tertanam layaknya aplikasi App Store asli di iPhone Anda.' : 'Cube ACR is now installed on your home screen.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advantages of PWA on mobile */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center space-x-2 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{isId ? 'Membuka instan tanpa URL bar' : 'Instant launch, no URL bar'}</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isId ? 'Rekam & simpan MP3 offline' : 'Offline MP3 recording'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
          >
            {isId ? 'Tutup' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

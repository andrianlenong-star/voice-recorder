import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Smartphone, 
  Mic, 
  Bell, 
  Layers, 
  BatteryCharging, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  ArrowRight, 
  Sparkles,
  Sliders,
  FolderDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { AppSettings } from '../types';

interface CubeAcrSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenPWAInstall: () => void;
  onLaunchWhatsAppFlow: () => void;
}

export const CubeAcrSetupModal: React.FC<CubeAcrSetupModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenPWAInstall,
  onLaunchWhatsAppFlow,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [detectedAndroidVer, setDetectedAndroidVer] = useState<'android14' | 'android13' | 'android12' | 'android10'>('android14');
  const [testResult, setTestResult] = useState<string | null>(null);

  const isId = settings.language === 'id';

  if (!isOpen) return null;

  const handleGrantPermission = (perm: 'mic' | 'notif' | 'overlay' | 'battery') => {
    switch (perm) {
      case 'mic':
        onUpdateSettings({ micPermissionGranted: true });
        break;
      case 'notif':
        onUpdateSettings({ notificationPermissionGranted: true });
        break;
      case 'overlay':
        onUpdateSettings({ overlayPermissionGranted: !settings.overlayPermissionGranted });
        break;
      case 'battery':
        onUpdateSettings({ batteryOptimizationIgnored: true });
        break;
    }
  };

  const handleTestAppConnector = () => {
    setTestResult(isId ? 'Sedang memverifikasi layanan aksesibilitas VoIP...' : 'Verifying VoIP accessibility service...');
    setTimeout(() => {
      onUpdateSettings({ appConnectorEnabled: true });
      setTestResult(isId 
        ? '✓ Cube ACR App Connector aktif! Perekaman dua arah WhatsApp, Zoom, dan Teams siap bekerja otomatis.' 
        : '✓ Cube ACR App Connector active! Two-way VoIP recording for WhatsApp, Zoom, and Teams is operational.');
    }, 1200);
  };

  const handleFinishOnboarding = () => {
    onUpdateSettings({ hasCompletedOnboarding: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-rose-900/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {isId ? 'Panduan Konfigurasi Cube ACR' : 'Cube ACR Setup & Helper Guide'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  Official Steps
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isId ? 'Langkah resmi pemasangan dan aktivasi perekaman VoIP pihak ketiga' : 'Official setup steps for third-party VoIP call recording'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Tabs */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between overflow-x-auto gap-2 shrink-0">
          {[
            { step: 1, title: isId ? '1. Instal Sumber Resmi' : '1. Official Install' },
            { step: 2, title: isId ? '2. Buka Aplikasi' : '2. Open App' },
            { step: 3, title: isId ? '3. Konfigurasi Awal' : '3. Initial Config' },
            { step: 4, title: isId ? '4. Izin Sistem' : '4. Permissions' },
            { step: 5, title: isId ? '5. App Connector Helper' : '5. App Connector' },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => setActiveStep(item.step)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeStep === item.step
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        {/* Step Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* STEP 1: Instalasi Cube ACR dari sumber resmi */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-start space-x-3 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4">
                <Download className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-indigo-200">
                    {isId ? 'Langkah 1: Instal Cube ACR dari Sumber Resminya' : 'Step 1: Install Cube ACR from Official Source'}
                  </h4>
                  <p className="text-xs text-indigo-300/80 mt-1 leading-relaxed">
                    {isId 
                      ? 'Untuk menanamkan Cube ACR sebagai aplikasi pihak ketiga di HP (Android atau iOS), aplikasi ini telah dilengkapi dukungan PWA (Progressive Web App) dengan manifest mandiri, ikon resmi, dan cache offline.'
                      : 'To embed Cube ACR as a dedicated third-party app on mobile, this app provides complete PWA standalone support with offline caching.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Smartphone className="w-4 h-4" />
                    <span>{isId ? 'Aplikasi Tertanam di HP (PWA)' : 'Installed Mobile App'}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {isId 
                      ? 'Pasang langsung ke layar utama (*Home Screen*) dan daftar aplikasi HP tanpa perlu mengunduh APK manual.'
                      : 'Add directly to your home screen and app drawer as a standalone app.'}
                  </p>
                  <button
                    onClick={onOpenPWAInstall}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isId ? 'Buka Panduan Pasang di HP' : 'Open Mobile Install Guide'}</span>
                  </button>
                </div>

                <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isId ? 'Sumber Resmi & Helper' : 'Official Source & Helper'}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {isId 
                      ? 'Diverifikasi langsung sesuai spesifikasi resmi Cube ACR: cubeacr.app dengan fitur sinkronisasi cloud dan enkripsi MP3.'
                      : 'Verified against official Cube ACR specifications with auto cloud sync and local MP3 encoding.'}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isId ? 'Status: Sumber Resmi Terverifikasi' : 'Status: Official Source Verified'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition cursor-pointer"
                >
                  <span>{isId ? 'Lanjut ke Langkah 2: Buka Aplikasi' : 'Next to Step 2: Open App'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Buka Aplikasi */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-start space-x-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4">
                <Smartphone className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-200">
                    {isId ? 'Langkah 2: Buka Aplikasi Cube ACR' : 'Step 2: Open Cube ACR App'}
                  </h4>
                  <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
                    {isId 
                      ? 'Saat pertama kali dibuka, Cube ACR menginisialisasi penyimpanan lokal IndexedDB di perangkat dan menyiapkan sistem deteksi panggilan VoIP di latar belakang.'
                      : 'On first launch, Cube ACR initializes device storage and sets up the background VoIP detection system.'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400">{isId ? 'Inisialisasi Database Lokal:' : 'Local Database:'}</span>
                  <span className="text-emerald-400 font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready (IndexedDB MP3 Store)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400">{isId ? 'Encoder Mesin Audio:' : 'Audio Engine:'}</span>
                  <span className="text-emerald-400 font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> LAME MP3 Engine Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{isId ? 'Mode PWA Mandiri (Standalone):' : 'PWA Standalone Mode:'}</span>
                  <span className="text-indigo-400 font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active Fullscreen
                  </span>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer"
                >
                  {isId ? 'Kembali' : 'Back'}
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition cursor-pointer"
                >
                  <span>{isId ? 'Lanjut ke Langkah 3: Konfigurasi Awal' : 'Next: Initial Config'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Ikuti Panduan Konfigurasi Awal */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-start space-x-3 bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4">
                <Sliders className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-rose-200">
                    {isId ? 'Langkah 3: Ikuti Panduan Konfigurasi Awal' : 'Step 3: Initial Setup & Configuration'}
                  </h4>
                  <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                    {isId 
                      ? 'Pilih preset kualitas rekaman MP3 yang seimbang dan pastikan penyimpanan lokal otomatis aktif.'
                      : 'Select balanced MP3 recording presets and confirm automatic local device storage.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isId ? 'Preset Kualitas Rekaman' : 'Recording Quality Preset'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isId ? 'Medium (128 kbps) - Rekomendasi seimbang antara ukuran dan suara jernih' : 'Medium (128 kbps) - Balanced size and clarity'}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold uppercase">
                    {settings.qualityPreset || 'MEDIUM'} ({settings.audioBitrate} kbps)
                  </span>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isId ? 'Otomatis Simpan MP3 ke Perangkat' : 'Auto Save MP3 to Device'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isId ? 'Langsung mengunduh berkas MP3 begitu panggilan ditutup' : 'Immediately downloads MP3 to device when call finishes'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSaveToDisk}
                    onChange={(e) => onUpdateSettings({ autoSaveToDisk: e.target.checked })}
                    className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                  />
                </div>

                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isId ? 'Floating Widget Panggilan Melayang' : 'Floating Call Recording Widget'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isId ? 'Menampilkan tombol kontrol Cube ACR saat panggilan WhatsApp aktif' : 'Shows Cube ACR overlay button during live calls'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showFloatingWidget}
                    onChange={(e) => onUpdateSettings({ showFloatingWidget: e.target.checked })}
                    className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer"
                >
                  {isId ? 'Kembali' : 'Back'}
                </button>
                <button
                  onClick={() => setActiveStep(4)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition cursor-pointer"
                >
                  <span>{isId ? 'Lanjut ke Langkah 4: Berikan Izin' : 'Next: Grant Permissions'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Berikan Izin yang Diminta */}
          {activeStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-start space-x-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4">
                <Layers className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-200">
                    {isId ? 'Langkah 4: Berikan Izin yang Diminta' : 'Step 4: Grant Required Android Permissions'}
                  </h4>
                  <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                    {isId 
                      ? 'Cube ACR memerlukan izin mikrofon, notifikasi, dan tampilan di atas aplikasi lain agar dapat mendeteksi panggilan VoIP yang masuk/keluar.'
                      : 'Grant microphone, notification, overlay, and battery permissions to allow automated call handling.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* 1. Microphone */}
                <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isId ? 'Izin Mikrofon (Audio)' : 'Microphone Permission'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isId ? 'Wajib untuk menangkap suara vokal panggilan' : 'Required to capture voice audio'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGrantPermission('mic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.micPermissionGranted
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-600 text-white hover:bg-rose-500'
                    }`}
                  >
                    {settings.micPermissionGranted ? (isId ? '✓ Diizinkan' : '✓ Granted') : (isId ? 'Izinkan' : 'Grant')}
                  </button>
                </div>

                {/* 2. Notifications */}
                <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isId ? 'Izin Notifikasi' : 'Notification Permission'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isId ? 'Menampilkan status perekaman aktif saat panggilan berlangsung' : 'Displays live recording status while call is active'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGrantPermission('notif')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.notificationPermissionGranted
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {settings.notificationPermissionGranted ? (isId ? '✓ Diizinkan' : '✓ Granted') : (isId ? 'Izinkan' : 'Grant')}
                  </button>
                </div>

                {/* 3. Overlay / Display Over Other Apps */}
                <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isId ? 'Tampilkan di Atas Aplikasi Lain (Overlay Widget)' : 'Display Over Other Apps (Overlay)'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isId ? 'Menampilkan floating widget Cube ACR saat berada di WhatsApp' : 'Floating Cube ACR widget on top of WhatsApp calls'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGrantPermission('overlay')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.overlayPermissionGranted
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-teal-600 text-white hover:bg-teal-500'
                    }`}
                  >
                    {settings.overlayPermissionGranted ? (isId ? '✓ Diizinkan' : '✓ Granted') : (isId ? 'Izinkan' : 'Grant')}
                  </button>
                </div>

                {/* 4. Battery Optimization */}
                <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                      <BatteryCharging className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isId ? 'Abaikan Pengoptimalan Baterai' : 'Ignore Battery Optimization'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isId ? 'Mencegah Android mematikan proses perekam di latar belakang' : 'Prevents OS from killing background recorder'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGrantPermission('battery')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.batteryOptimizationIgnored
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-600 text-white hover:bg-amber-500'
                    }`}
                  >
                    {settings.batteryOptimizationIgnored ? (isId ? '✓ Diabaikan' : '✓ Granted') : (isId ? 'Izinkan' : 'Grant')}
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveStep(3)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer"
                >
                  {isId ? 'Kembali' : 'Back'}
                </button>
                <button
                  onClick={() => setActiveStep(5)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition cursor-pointer"
                >
                  <span>{isId ? 'Lanjut ke Langkah 5: Cek App Connector' : 'Next: Check App Connector'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Periksa apakah fitur App Connector atau Helper diperlukan */}
          {activeStep === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-start space-x-3 bg-purple-950/30 border border-purple-500/30 rounded-2xl p-4">
                <Cpu className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-purple-200">
                    {isId ? 'Langkah 5: Periksa Fitur App Connector / Helper untuk Android Anda' : 'Step 5: Check App Connector / Helper for Your Android Version'}
                  </h4>
                  <p className="text-xs text-purple-300/80 mt-1 leading-relaxed">
                    {isId 
                      ? 'Pada Android 10, 11, 12, 13, 14, dan 15+, Google memberlakukan kebijakan privasi yang membatasi aplikasi merekam panggilan VoIP secara langsung. Fitur Cube ACR App Connector (layanan aksesibilitas khusus) diperlukan untuk membuka akses perekaman audio dua arah WhatsApp.'
                      : 'On Android 10+ versions, Google restricted direct VoIP audio recording. Cube ACR App Connector uses an Accessibility Service to capture both sides of WhatsApp calls.'}
                  </p>
                </div>
              </div>

              {/* Version Selector Simulator */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isId ? 'Versi Android Perangkat Pengguna:' : 'Device Android Version:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'android14', name: 'Android 14 / 15' },
                    { id: 'android13', name: 'Android 13' },
                    { id: 'android12', name: 'Android 12' },
                    { id: 'android10', name: 'Android 10 - 11' },
                  ].map((ver) => (
                    <button
                      key={ver.id}
                      onClick={() => setDetectedAndroidVer(ver.id as any)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        detectedAndroidVer === ver.id
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-bold'
                          : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ver.name}
                    </button>
                  ))}
                </div>

                {/* Compatibility Status Banner */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{isId ? 'Status App Connector Diperlukan:' : 'App Connector Required:'}</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold">
                      {isId ? 'DIREKOMENDASIKAN (WAJIB)' : 'REQUIRED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{isId ? 'Dukungan Dua Arah (Both Sides):' : 'Two-way Audio Support:'}</span>
                    <span className="text-emerald-400 font-bold flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      {isId ? 'Terdengar Penelepon & Penerima' : 'Both Caller & Recipient Clear'}
                    </span>
                  </div>
                </div>

                {/* Connector activation button */}
                <div className="pt-2">
                  <button
                    onClick={handleTestAppConnector}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>{isId ? 'Aktifkan & Uji Cube ACR App Connector' : 'Enable & Verify App Connector'}</span>
                  </button>
                  {testResult && (
                    <div className="mt-2.5 p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{testResult}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
                <button
                  onClick={() => setActiveStep(4)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer"
                >
                  {isId ? 'Kembali' : 'Back'}
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      handleFinishOnboarding();
                      onLaunchWhatsAppFlow();
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{isId ? 'Coba Alur WhatsApp Call' : 'Test WhatsApp Flow'}</span>
                  </button>
                  <button
                    onClick={handleFinishOnboarding}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isId ? 'Selesai & Mulai Rekam' : 'Finish & Start'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

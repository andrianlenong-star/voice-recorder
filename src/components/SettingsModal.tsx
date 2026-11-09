import React from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  HardDrive, 
  Sliders, 
  Volume2, 
  Globe, 
  Archive, 
  Trash2, 
  Check, 
  Cloud, 
  Smartphone, 
  Sparkles, 
  CheckCircle2,
  Layers,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { AppSettings, Mp3QualityPreset, CloudProvider } from '../types';
import { QUALITY_PRESETS } from '../utils/callManager';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportAllZip: () => void;
  onClearAllRecords: () => void;
  onOpenPWAInstall: () => void;
  onOpenSetupGuide?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportAllZip,
  onClearAllRecords,
  onOpenPWAInstall,
  onOpenSetupGuide,
}) => {
  const isId = settings.language === 'id';

  if (!isOpen) return null;

  const handleSelectQuality = (preset: Mp3QualityPreset) => {
    const details = QUALITY_PRESETS[preset];
    onUpdateSettings({
      qualityPreset: preset,
      audioBitrate: details.bitrate,
      audioSampleRate: details.sampleRate,
    });
  };

  const toggleCloudConnection = (provider: CloudProvider) => {
    const current = settings.connectedClouds || { gdrive: true, dropbox: false, onedrive: false, webdav: false };
    const updated = {
      ...current,
      [provider]: !current[provider],
    };
    onUpdateSettings({ connectedClouds: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {isId ? 'Pengaturan Perekam Cube ACR' : 'Cube ACR Recorder Settings'}
              </h3>
              <p className="text-xs text-slate-400">
                {isId ? 'Preset kualitas audio MP3, multi-cloud, dan instalasi HP' : 'MP3 quality presets, multi-cloud, and phone install'}
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: MP3 Quality Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                <Sliders className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                {isId ? 'Preset Kualitas Perekaman MP3' : 'MP3 Recording Quality Presets'}
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {isId ? 'Bawaan: Medium (Seimbang)' : 'Default: Medium (Balanced)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(['low', 'medium', 'high', 'ultra'] as Mp3QualityPreset[]).map((preset) => {
                const info = QUALITY_PRESETS[preset];
                const isSelected = (settings.qualityPreset || 'medium') === preset;

                return (
                  <div
                    key={preset}
                    onClick={() => handleSelectQuality(preset)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-rose-600/15 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h5 className="font-bold text-sm text-slate-100">
                            {isId ? info.nameId : info.name}
                          </h5>
                          {preset === 'medium' && (
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-rose-400 font-mono font-semibold mt-0.5">
                          {info.bitrate} kbps • {info.sampleRate / 1000} kHz • {info.approxSizePerMin}
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      {isId ? info.descriptionId : info.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Multi-Cloud Storage Services */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="flex items-center text-xs font-bold text-slate-200">
                  <Cloud className="w-4 h-4 mr-1.5 text-indigo-400" />
                  {isId ? 'Dukungan Multi-Cloud Storage' : 'Multi-Cloud Storage Support'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {isId ? 'Pilih dan hubungkan akun cloud yang Anda inginkan' : 'Connect and select your preferred cloud services'}
                </p>
              </div>

              {/* Multi-cloud simultaneous backup toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {isId ? 'Sinkron ke Semua Sekaligus:' : 'Simultaneous Backup:'}
                </span>
                <input
                  type="checkbox"
                  checked={settings.multiCloudSync || false}
                  onChange={(e) => onUpdateSettings({ multiCloudSync: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  title="Sinkronkan ke semua cloud terhubung sekaligus"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { id: 'gdrive' as CloudProvider, name: 'Google Drive', email: 'iniakunkutau878@gmail.com' },
                { id: 'dropbox' as CloudProvider, name: 'Dropbox', email: 'user@dropbox.com' },
                { id: 'onedrive' as CloudProvider, name: 'OneDrive', email: 'user@live.com' },
                { id: 'webdav' as CloudProvider, name: 'WebDAV / Nextcloud', email: 'https://cloud.local' },
              ].map((c) => {
                const isConnected = settings.connectedClouds?.[c.id] ?? false;
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCloudConnection(c.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isConnected
                        ? 'bg-indigo-600/15 border-indigo-500/80 text-white'
                        : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <p className="font-bold text-xs truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.email}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isConnected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isConnected ? (isId ? 'Terhubung' : 'Connected') : (isId ? 'Hubungkan' : 'Connect')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Automatic Local Storage Saving */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5 pr-2">
                <span className="flex items-center text-xs font-bold text-slate-200">
                  <HardDrive className="w-4 h-4 mr-1.5 text-emerald-400" />
                  {isId ? 'Simpan Otomatis ke Penyimpanan Lokal HP' : 'Auto-Save MP3 to Local Phone Storage'}
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isId
                    ? 'Secara otomatis mengunduh berkas audio .MP3 ke penyimpanan perangkat saat panggilan VoIP berakhir.'
                    : 'Automatically downloads MP3 directly to device storage when call completes.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSaveToDisk}
                onChange={(e) => onUpdateSettings({ autoSaveToDisk: e.target.checked })}
                className="w-4 h-4 accent-rose-600 rounded cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Section 4: Audio Loudness Booster */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center">
                <Volume2 className="w-4 h-4 mr-1.5 text-pink-400" />
                {isId ? 'Penguat Volume Lawan Bicara (Audio Boost)' : 'Caller Audio Loudness Booster'}
              </span>
              <span className="font-mono font-bold text-pink-400">
                {settings.audioBoostGain.toFixed(1)}x (+{Math.round((settings.audioBoostGain - 1) * 100)}%)
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={settings.audioBoostGain}
              onChange={(e) => onUpdateSettings({ audioBoostGain: parseFloat(e.target.value) })}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          {/* Section 5: PWA Install to Phone */}
          <div className="bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/30 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h5 className="font-bold text-xs text-white">
                {isId ? 'Pemasangan Aplikasi di HP (PWA)' : 'Mobile Phone App Installation (PWA)'}
              </h5>
            </div>
            <p className="text-[11px] text-slate-300">
              {isId
                ? 'Pasang Cube ACR ke layar utama HP Android atau iPhone agar berjalan mandiri dan tertanam tanpa bilah alamat browser.'
                : 'Install Cube ACR to your Android or iPhone home screen for a native standalone experience.'}
            </p>
            <PWAInstallButton
              onOpenModal={onOpenPWAInstall}
              language={settings.language}
              variant="settings"
            />
          </div>

          {/* Section 5.5: Cube ACR App Connector & Helper */}
          <div className="bg-gradient-to-r from-purple-950/30 to-slate-900 border border-purple-500/30 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h5 className="font-bold text-xs text-white">
                  {isId ? 'Cube ACR App Connector (Helper)' : 'Cube ACR App Connector (Helper)'}
                </h5>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                settings.appConnectorEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {settings.appConnectorEnabled ? (isId ? 'AKTIF' : 'ACTIVE') : (isId ? 'NONAKTIF' : 'INACTIVE')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isId
                ? 'Layanan aksesibilitas VoIP pihak ketiga untuk merekam dua arah di WhatsApp, Zoom, dan Teams pada Android 10, 11, 12, 13, 14, 15+.'
                : 'VoIP accessibility service for capturing both sides of WhatsApp and Zoom calls on Android 10+.'}
            </p>
            {onOpenSetupGuide && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSetupGuide();
                }}
                className="w-full py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>{isId ? 'Buka Panduan 5 Langkah Konfigurasi & Helper' : 'Open 5-Step Setup & Helper Guide'}</span>
              </button>
            )}
          </div>

          {/* Section 6: Language Toggle & Data Export */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-200">
                  {isId ? 'Bahasa Antarmuka' : 'Language'}
                </span>
              </div>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => onUpdateSettings({ language: 'id' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    settings.language === 'id' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  ID
                </button>
                <button
                  onClick={() => onUpdateSettings({ language: 'en' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    settings.language === 'en' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <button
              onClick={onExportAllZip}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Archive className="w-4 h-4 text-indigo-400" />
              <span>{isId ? 'Ekspor Semua MP3 sebagai Arsip ZIP' : 'Export All MP3s as ZIP Archive'}</span>
            </button>

            <button
              onClick={onClearAllRecords}
              className="w-full py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs font-medium rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isId ? 'Hapus Semua Riwayat Rekaman' : 'Clear All Call History'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            {isId ? 'Selesai' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

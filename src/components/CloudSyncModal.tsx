import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  CheckCircle2, 
  RefreshCw, 
  UploadCloud, 
  Folder, 
  Wifi, 
  Check,
  Link,
  Plus,
  Layers
} from 'lucide-react';
import { CallRecord, AppSettings, CloudProvider } from '../types';
import { calculateSyncStats, formatCloudProviders } from '../utils/callManager';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordings: CallRecord[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSyncRecordings: (recordsToSync: CallRecord[]) => Promise<void>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  recordings,
  settings,
  onUpdateSettings,
  onSyncRecordings,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>(settings.selectedCloudProvider || 'gdrive');
  const [folderPath, setFolderPath] = useState(settings.cloudFolder || '/CubeACR_VoIP_Recordings');
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);

  // Simulated connect dialog state
  const [connectingProvider, setConnectingProvider] = useState<CloudProvider | null>(null);

  const isId = settings.language === 'id';
  const syncStats = calculateSyncStats(recordings);
  const connectedClouds = settings.connectedClouds || { gdrive: true, dropbox: false, onedrive: false, webdav: false };

  if (!isOpen) return null;

  const toggleConnect = (provider: CloudProvider) => {
    const isNowConnected = !connectedClouds[provider];
    if (isNowConnected) {
      setConnectingProvider(provider);
      setTimeout(() => {
        setConnectingProvider(null);
        onUpdateSettings({
          connectedClouds: {
            ...connectedClouds,
            [provider]: true,
          },
        });
      }, 700);
    } else {
      onUpdateSettings({
        connectedClouds: {
          ...connectedClouds,
          [provider]: false,
        },
      });
    }
  };

  const handleProviderSelect = (provider: CloudProvider) => {
    setSelectedProvider(provider);
    onUpdateSettings({ selectedCloudProvider: provider });
  };

  const handleStartBatchSync = async () => {
    const pendingList = recordings.filter((r) => r.cloudSync.status !== 'synced');
    if (pendingList.length === 0) return;

    setIsSyncingAll(true);
    setSyncProgress(10);

    const progressInterval = setInterval(() => {
      setSyncProgress((p) => {
        if (p >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return p + 25;
      });
    }, 250);

    await onSyncRecordings(pendingList);

    clearInterval(progressInterval);
    setSyncProgress(100);
    setTimeout(() => {
      setIsSyncingAll(false);
      setSyncProgress(0);
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 3000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {isId ? 'Pusat Sinkronisasi Multi-Cloud' : 'Multi-Cloud Synchronization Center'}
              </h3>
              <p className="text-xs text-slate-400">
                {isId ? 'Hubungkan dan cadangkan rekaman VoIP MP3 ke beberapa cloud' : 'Connect and backup VoIP MP3 recordings to multi-cloud'}
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status summary banner */}
          <div className="bg-gradient-to-r from-slate-800 to-indigo-950/40 p-4 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  {isId ? 'Status Sinkronisasi Saat Ini' : 'Current Sync Status'}
                </span>
                <h4 className="text-xl font-extrabold text-white">
                  {syncStats.synced} / {syncStats.total} {isId ? 'Tersinkron' : 'Synced'}
                </h4>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 text-xs font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  {syncStats.percent}% {isId ? 'Tercadangkan' : 'Backed Up'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${syncStats.percent}%` }}
              />
            </div>
          </div>

          {/* Cloud Provider Connections */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                {isId ? 'Penyedia Layanan Cloud Anda' : 'Your Cloud Storage Providers'}
              </label>

              <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                <input
                  type="checkbox"
                  id="multiSyncToggle"
                  checked={settings.multiCloudSync || false}
                  onChange={(e) => onUpdateSettings({ multiCloudSync: e.target.checked })}
                  className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="multiSyncToggle" className="cursor-pointer text-[11px]">
                  {isId ? 'Cadangkan ke semua sekaligus' : 'Simultaneous multi-cloud backup'}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Google Drive */}
              <div
                className={`p-3.5 rounded-2xl border transition relative ${
                  connectedClouds.gdrive
                    ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      G
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-100">Google Drive</h5>
                      <p className="text-[11px] text-slate-400">iniakunkutau878@gmail.com</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleConnect('gdrive')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      connectedClouds.gdrive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {connectedClouds.gdrive ? (isId ? 'Terhubung' : 'Connected') : (isId ? 'Hubungkan' : 'Connect')}
                  </button>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Kapasitas: 4.2 GB / 15 GB</span>
                  <span className="text-emerald-400 font-semibold">{isId ? 'Utama' : 'Primary'}</span>
                </div>
              </div>

              {/* Dropbox */}
              <div
                className={`p-3.5 rounded-2xl border transition relative ${
                  connectedClouds.dropbox
                    ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                      D
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-100">Dropbox</h5>
                      <p className="text-[11px] text-slate-400">user@dropbox.com</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleConnect('dropbox')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      connectedClouds.dropbox
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {connectingProvider === 'dropbox' ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : connectedClouds.dropbox ? (
                      isId ? 'Terhubung' : 'Connected'
                    ) : (
                      isId ? 'Hubungkan' : 'Connect'
                    )}
                  </button>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>OAuth 2.0 Auth</span>
                  <span className={connectedClouds.dropbox ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {connectedClouds.dropbox ? (isId ? 'Aktif' : 'Active') : (isId ? 'Tersedia' : 'Available')}
                  </span>
                </div>
              </div>

              {/* Microsoft OneDrive */}
              <div
                className={`p-3.5 rounded-2xl border transition relative ${
                  connectedClouds.onedrive
                    ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                      O
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-100">OneDrive</h5>
                      <p className="text-[11px] text-slate-400">Microsoft 365 Cloud</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleConnect('onedrive')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      connectedClouds.onedrive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {connectingProvider === 'onedrive' ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : connectedClouds.onedrive ? (
                      isId ? 'Terhubung' : 'Connected'
                    ) : (
                      isId ? 'Hubungkan' : 'Connect'
                    )}
                  </button>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>5 GB Cloud Storage</span>
                  <span className={connectedClouds.onedrive ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {connectedClouds.onedrive ? (isId ? 'Aktif' : 'Active') : (isId ? 'Tersedia' : 'Available')}
                  </span>
                </div>
              </div>

              {/* WebDAV / Nextcloud */}
              <div
                className={`p-3.5 rounded-2xl border transition relative ${
                  connectedClouds.webdav
                    ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                      W
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-100">WebDAV / Nextcloud</h5>
                      <p className="text-[11px] text-slate-400">Penyimpanan Pribadi</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleConnect('webdav')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      connectedClouds.webdav
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {connectedClouds.webdav ? (isId ? 'Terhubung' : 'Connected') : (isId ? 'Hubungkan' : 'Connect')}
                  </button>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Enkripsi End-to-End</span>
                  <span className={connectedClouds.webdav ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {connectedClouds.webdav ? (isId ? 'Aktif' : 'Active') : (isId ? 'Kustom' : 'Custom')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Preferences & Target folder */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
            {/* Auto sync toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200">
                  {isId ? 'Otomatis Sinkronisasi Panggilan' : 'Auto-Sync Finished Calls'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isId ? 'Segera unggah berkas MP3 ke cloud begitu panggilan VoIP selesai' : 'Upload MP3 to cloud right after call ends'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSyncCloud}
                onChange={(e) => onUpdateSettings({ autoSyncCloud: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Wifi only toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    {isId ? 'Sinkronisasi Hanya via Wi-Fi' : 'Sync on Wi-Fi Only'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isId ? 'Menghemat kuota data seluler perangkat' : 'Save mobile cellular data'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.cloudSyncOnWifiOnly}
                onChange={(e) => onUpdateSettings({ cloudSyncOnWifiOnly: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Target Folder */}
            <div className="pt-2 border-t border-slate-700/40">
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center">
                <Folder className="w-3.5 h-3.5 mr-1 text-amber-400" />
                {isId ? 'Folder Tujuan di Cloud' : 'Target Cloud Folder'}
              </label>
              <input
                type="text"
                value={folderPath}
                onChange={(e) => {
                  setFolderPath(e.target.value);
                  onUpdateSettings({ cloudFolder: e.target.value });
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sync Progress animation if active */}
          {isSyncingAll && (
            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-indigo-500/40">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-indigo-400 flex items-center">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {isId ? 'Mengunggah Berkas MP3 ke Cloud...' : 'Uploading MP3s to Cloud...'}
                </span>
                <span className="font-mono text-white font-bold">{syncProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          )}

          {syncSuccessToast && (
            <div className="bg-emerald-950/60 border border-emerald-500/60 p-3 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{isId ? 'Semua rekaman berhasil disinkronkan ke cloud!' : 'All recordings successfully synced to cloud!'}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            {syncStats.pending > 0
              ? `${syncStats.pending} ${isId ? 'rekaman belum tersinkron' : 'recordings pending sync'}`
              : (isId ? 'Semua rekaman tersinkron rapi' : 'All recordings in sync')}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
            >
              {isId ? 'Tutup' : 'Close'}
            </button>

            <button
              onClick={handleStartBatchSync}
              disabled={isSyncingAll || syncStats.pending === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-900/40 flex items-center space-x-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {isSyncingAll
                  ? (isId ? 'Sinkronisasi...' : 'Syncing...')
                  : (isId ? 'Sinkronkan Sekarang' : 'Sync Now')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

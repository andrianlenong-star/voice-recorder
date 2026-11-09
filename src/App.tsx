import React, { useState, useEffect } from 'react';
import { 
  getStoredRecordings, 
  saveRecord, 
  deleteRecord, 
  loadSettings, 
  saveSettings, 
  seedInitialDemoRecordings 
} from './utils/db';
import { CallRecord, AppSettings, CloudProvider } from './types';
import { calculateStorageUsage, calculateSyncStats } from './utils/callManager';
import { exportRecordingsToZip } from './utils/zipExport';

import { Header } from './components/Header';
import { RecordingsList } from './components/RecordingsList';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { CallSimulatorModal } from './components/CallSimulatorModal';
import { LiveRecorderModal } from './components/LiveRecorderModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { CubeAcrSetupModal } from './components/CubeAcrSetupModal';
import { WhatsAppCallFlowModal } from './components/WhatsAppCallFlowModal';
import { Check, Mic, Sparkles, MessageCircle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [recordings, setRecordings] = useState<CallRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [activeRecord, setActiveRecord] = useState<CallRecord | null>(null);

  // Modals state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isLiveRecorderOpen, setIsLiveRecorderOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [isWhatsAppFlowOpen, setIsWhatsAppFlowOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load and seed database on initial mount
  useEffect(() => {
    async function init() {
      try {
        const loaded = await seedInitialDemoRecordings();
        setRecordings(loaded);
        if (loaded.length > 0) {
          // Set first record as initial selection for immediate preview
          setActiveRecord(loaded[0]);
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
      }
    }
    init();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleToggleLanguage = () => {
    const newLang = settings.language === 'id' ? 'en' : 'id';
    handleUpdateSettings({ language: newLang });
  };

  const handleCallRecorded = async (newRecord: CallRecord) => {
    await saveRecord(newRecord);
    setRecordings((prev) => [newRecord, ...prev]);
    setActiveRecord(newRecord);

    const isId = settings.language === 'id';
    const msg = settings.autoSaveToDisk
      ? (isId ? `Panggilan ${newRecord.callerName} selesai & otomatis diunduh dalam format MP3!` : `Call finished & MP3 downloaded automatically!`)
      : (isId ? `Rekaman MP3 ${newRecord.callerName} tersimpan di penyimpanan lokal!` : `Call recording saved locally!`);
    showToast(msg);
  };

  const handleToggleStar = async (id: string) => {
    const target = recordings.find((r) => r.id === id);
    if (!target) return;
    const updated = { ...target, isStarred: !target.isStarred };
    await saveRecord(updated);
    setRecordings((prev) => prev.map((r) => (r.id === id ? updated : r)));
    if (activeRecord?.id === id) setActiveRecord(updated);
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteRecord(id);
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    if (activeRecord?.id === id) {
      setActiveRecord(null);
    }
    const isId = settings.language === 'id';
    showToast(isId ? 'Rekaman berhasil dihapus.' : 'Recording deleted.');
  };

  const handleDeleteMultipleRecords = async (ids: string[]) => {
    for (const id of ids) {
      await deleteRecord(id);
    }
    setRecordings((prev) => prev.filter((r) => !ids.includes(r.id)));
    if (activeRecord && ids.includes(activeRecord.id)) {
      setActiveRecord(null);
    }
    const isId = settings.language === 'id';
    showToast(isId ? `${ids.length} rekaman berhasil dihapus.` : `${ids.length} recordings deleted.`);
  };

  const handleAssignTagMultiple = async (ids: string[], tag: string) => {
    const updatedList: CallRecord[] = [];
    for (const rec of recordings) {
      if (ids.includes(rec.id)) {
        const currentTags = rec.tags || [];
        if (!currentTags.includes(tag)) {
          const updated = { ...rec, tags: [...currentTags, tag] };
          await saveRecord(updated);
          updatedList.push(updated);
          continue;
        }
      }
      updatedList.push(rec);
    }
    setRecordings(updatedList);
    const isId = settings.language === 'id';
    showToast(isId ? `Tag #${tag} ditambahkan ke ${ids.length} rekaman.` : `Tag #${tag} assigned.`);
  };

  const handleUpdateRecord = async (updated: CallRecord) => {
    await saveRecord(updated);
    setRecordings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (activeRecord?.id === updated.id) setActiveRecord(updated);
  };

  const handleSyncSingleRecord = async (record: CallRecord) => {
    const connectedList = Object.entries(settings.connectedClouds || {})
      .filter(([_, isConn]) => isConn)
      .map(([p]) => p as CloudProvider);

    const syncedProviders = settings.multiCloudSync && connectedList.length > 0
      ? connectedList
      : [settings.selectedCloudProvider];

    const updated: CallRecord = {
      ...record,
      cloudSync: {
        status: 'synced',
        provider: settings.selectedCloudProvider,
        syncedProviders,
        lastSyncedAt: Date.now(),
        cloudFileId: `cloud_${Date.now()}`,
      },
    };
    await saveRecord(updated);
    setRecordings((prev) => prev.map((r) => (r.id === record.id ? updated : r)));
    if (activeRecord?.id === record.id) setActiveRecord(updated);

    const isId = settings.language === 'id';
    showToast(isId ? `Rekaman berhasil disinkronkan ke ${syncedProviders.join(' & ')}!` : `Synced to ${syncedProviders.join(', ')}!`);
  };

  const handleSyncBatch = async (recordsToSync: CallRecord[]) => {
    const now = Date.now();
    const connectedList = Object.entries(settings.connectedClouds || {})
      .filter(([_, isConn]) => isConn)
      .map(([p]) => p as CloudProvider);

    const syncedProviders = settings.multiCloudSync && connectedList.length > 0
      ? connectedList
      : [settings.selectedCloudProvider];

    for (const rec of recordsToSync) {
      const updated: CallRecord = {
        ...rec,
        cloudSync: {
          status: 'synced',
          provider: settings.selectedCloudProvider,
          syncedProviders,
          lastSyncedAt: now,
          cloudFileId: `cloud_${now}_${rec.id}`,
        },
      };
      await saveRecord(updated);
    }

    const reloaded = await getStoredRecordings();
    setRecordings(reloaded);
  };

  const handleExportZip = async () => {
    const isId = settings.language === 'id';
    showToast(isId ? 'Sedang menyiapkan arsip ZIP semua berkas MP3...' : 'Preparing ZIP archive...');
    await exportRecordingsToZip(recordings);
    showToast(isId ? 'Arsip ZIP berhasil diunduh ke perangkat Anda!' : 'ZIP archive downloaded successfully!');
  };

  const handleClearAll = async () => {
    for (const rec of recordings) {
      await deleteRecord(rec.id);
    }
    setRecordings([]);
    setActiveRecord(null);
    setIsSettingsOpen(false);
    const isId = settings.language === 'id';
    showToast(isId ? 'Semua riwayat rekaman dibersihkan.' : 'All recordings cleared.');
  };

  const storageUsage = calculateStorageUsage(recordings);
  const syncStats = calculateSyncStats(recordings);
  const isId = settings.language === 'id';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900 border border-emerald-500/50 shadow-2xl shadow-emerald-950/50 rounded-2xl px-4 py-3 flex items-center space-x-2.5 text-xs text-emerald-300 backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        settings={settings}
        storageFormatted={storageUsage.formatted}
        totalRecordsCount={recordings.length}
        pendingSyncCount={syncStats.pending}
        onOpenLiveRecorder={() => setIsLiveRecorderOpen(true)}
        onOpenCallSimulator={() => setIsSimulatorOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
        onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
        onOpenWhatsAppFlow={() => setIsWhatsAppFlowOpen(true)}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-32">
        {/* Hero Features Strip (Cube ACR Highlights) */}
        <div className="mb-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/50 border border-slate-800/80 rounded-3xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  ✓ {isId ? 'Otomatis Simpan MP3 Lokal' : 'Auto Local MP3 Storage'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  ☁️ {isId ? 'Multi-Cloud Sync Siaga' : 'Multi-Cloud Sync Ready'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  🎧 Preset: {settings.qualityPreset?.toUpperCase() || 'MEDIUM'} ({settings.audioBitrate} kbps)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
                  📱 {isId ? 'PWA Siap Pasang di HP' : 'PWA Mobile Ready'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  ⚡ App Connector: {settings.appConnectorEnabled ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {isId ? 'Perekam Panggilan VoIP Cerdas & Multi-Platform' : 'Universal VoIP Call Recorder & Auto Archiver'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                {isId
                  ? 'Merekam percakapan WhatsApp Call, Zoom, Teams, dan telepon secara otomatis ke format MP3 lokal perangkat dengan Cube ACR App Connector dan sinkronisasi multi-cloud.'
                  : 'Automatic VoIP call recording for WhatsApp, Zoom, Teams, and Phone in crisp MP3 format directly to device storage with multi-cloud backup.'}
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center space-x-2.5 shrink-0 flex-wrap gap-y-2">
              <button
                onClick={() => setIsWhatsAppFlowOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition active:scale-95 cursor-pointer flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isId ? 'Alur WhatsApp Call' : 'WhatsApp Call Flow'}</span>
              </button>

              <button
                onClick={() => setIsSetupGuideOpen(true)}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition cursor-pointer flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>{isId ? 'Panduan Setup & Helper' : 'Setup & Helper'}</span>
              </button>

              <button
                onClick={() => setIsPWAInstallOpen(true)}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition cursor-pointer flex items-center space-x-1.5"
              >
                <span>{isId ? '📱 Pasang di HP' : '📱 Install on Phone'}</span>
              </button>

              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="px-3.5 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{isId ? 'VoIP Lain' : 'Other VoIP'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recordings List */}
        <RecordingsList
          recordings={recordings}
          activeRecord={activeRecord}
          settings={settings}
          onSelectRecord={(rec) => setActiveRecord(rec)}
          onToggleStar={handleToggleStar}
          onDeleteRecord={handleDeleteRecord}
          onDeleteMultipleRecords={handleDeleteMultipleRecords}
          onUpdateRecord={handleUpdateRecord}
          onAssignTagMultiple={handleAssignTagMultiple}
          onSyncSingleRecord={handleSyncSingleRecord}
          onExportAllZip={handleExportZip}
          onOpenCallSimulator={() => setIsSimulatorOpen(true)}
        />
      </main>

      {/* Persistent Audio Player Bar */}
      <AudioPlayerBar
        currentRecord={activeRecord}
        onClose={() => setActiveRecord(null)}
        language={settings.language}
      />

      {/* Modals */}
      <CallSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        settings={settings}
        onCallRecorded={handleCallRecorded}
      />

      <LiveRecorderModal
        isOpen={isLiveRecorderOpen}
        onClose={() => setIsLiveRecorderOpen(false)}
        settings={settings}
        onRecordingSaved={handleCallRecorded}
      />

      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        recordings={recordings}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onSyncRecordings={handleSyncBatch}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportAllZip={handleExportZip}
        onClearAllRecords={handleClearAll}
        onOpenPWAInstall={() => {
          setIsSettingsOpen(false);
          setIsPWAInstallOpen(true);
        }}
        onOpenSetupGuide={() => {
          setIsSettingsOpen(false);
          setIsSetupGuideOpen(true);
        }}
      />

      {/* PWA Phone Installation Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallOpen}
        onClose={() => setIsPWAInstallOpen(false)}
        language={settings.language}
      />

      {/* Cube ACR 5-Step Official Onboarding & Helper Setup Modal */}
      <CubeAcrSetupModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenPWAInstall={() => {
          setIsSetupGuideOpen(false);
          setIsPWAInstallOpen(true);
        }}
        onLaunchWhatsAppFlow={() => {
          setIsSetupGuideOpen(false);
          setIsWhatsAppFlowOpen(true);
        }}
      />

      {/* WhatsApp Call Flow & Floating Cube Widget Simulation Modal */}
      <WhatsAppCallFlowModal
        isOpen={isWhatsAppFlowOpen}
        onClose={() => setIsWhatsAppFlowOpen(false)}
        settings={settings}
        onCallRecorded={handleCallRecorded}
        onViewRecordingsList={() => {
          setIsWhatsAppFlowOpen(false);
          window.scrollTo({ top: 320, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

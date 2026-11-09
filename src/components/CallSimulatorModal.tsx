import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Phone, 
  PhoneOff, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Mic, 
  MicOff, 
  Volume2, 
  Bookmark, 
  Check, 
  Radio, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { VoipApp, CallDirection, CallRecord, AppSettings, CallBookmark, CloudProvider } from '../types';
import { VoipSoundEffects } from '../utils/audioTone';
import { generateSyntheticCallAudio, encodeAudioBufferToMp3, triggerLocalDownload, generateRecordingFilename } from '../utils/audioEncoder';
import { formatDuration, getAppMeta } from '../utils/callManager';

interface CallSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onCallRecorded: (record: CallRecord) => void;
}

type CallState = 'setup' | 'ringing' | 'connected' | 'encoding' | 'completed';

export const CallSimulatorModal: React.FC<CallSimulatorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onCallRecorded,
}) => {
  const [callState, setCallState] = useState<CallState>('setup');
  const [voipApp, setVoipApp] = useState<VoipApp>('whatsapp');
  const [direction, setDirection] = useState<CallDirection>('incoming');
  const [callerName, setCallerName] = useState('Budi Santoso (Kantor)');
  const [phoneNumber, setPhoneNumber] = useState('+62 812-7788-9900');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [bookmarks, setBookmarks] = useState<CallBookmark[]>([]);
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Work', 'Important']);
  const [lastSavedRecord, setLastSavedRecord] = useState<CallRecord | null>(null);

  const timerRef = useRef<number | null>(null);

  const isId = settings.language === 'id';
  const appMeta = getAppMeta(voipApp);

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      setCallState('setup');
      setDuration(0);
      setBookmarks([]);
      setSelectedTags(['Work', 'Important']);
      setLastSavedRecord(null);
    } else {
      VoipSoundEffects.stopRinging();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      VoipSoundEffects.stopRinging();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartCall = () => {
    setCallState('ringing');
    VoipSoundEffects.startRinging(voipApp === 'whatsapp' ? 'whatsapp' : 'phone');

    // If outgoing call, automatically connect after 3 seconds of ringing
    if (direction === 'outgoing') {
      setTimeout(() => {
        handleAnswerCall();
      }, 3500);
    }
  };

  const handleAnswerCall = () => {
    VoipSoundEffects.playCallAnswered();
    setCallState('connected');
    setDuration(0);

    // Start call timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  };

  const handleDeclineCall = () => {
    VoipSoundEffects.stopRinging();
    setCallState('setup');
  };

  const handleAddBookmark = () => {
    const label = bookmarkLabel.trim() || `Bookmark @ ${formatDuration(duration)}`;
    const newBm: CallBookmark = {
      id: `bm_${Date.now()}`,
      time: duration,
      label,
    };
    setBookmarks([...bookmarks, newBm]);
    setBookmarkLabel('');
    setShowBookmarkInput(false);
  };

  const handleHangupAndSave = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    VoipSoundEffects.playCallEnded();
    setCallState('encoding');

    // Minimum 3 seconds audio to create a valid recording
    const finalDuration = Math.max(3, duration);

    try {
      // 1. Generate realistic VoIP conversation audio buffer
      const audioBuffer = generateSyntheticCallAudio(
        finalDuration,
        settings.audioSampleRate,
        voipApp
      );

      // 2. Encode to MP3 using lamejs with user's configured bitrate & boost gain
      const mp3Blob = encodeAudioBufferToMp3(
        audioBuffer,
        settings.audioBitrate,
        settings.audioBoostGain
      );

      // 3. Create object URL
      const mp3Url = URL.createObjectURL(mp3Blob);
      const filename = generateRecordingFilename(voipApp, callerName);

      // 4. Auto download directly to user's device if setting enabled
      if (settings.autoSaveToDisk) {
        triggerLocalDownload(mp3Blob, filename);
      }

      const connectedList = Object.entries(settings.connectedClouds || {})
        .filter(([_, isConn]) => isConn)
        .map(([p]) => p as CloudProvider);

      const syncedProviders = settings.autoSyncCloud
        ? (settings.multiCloudSync && connectedList.length > 0 ? connectedList : [settings.selectedCloudProvider])
        : [];

      // 5. Construct CallRecord
      const newRecord: CallRecord = {
        id: `cube_voip_${Date.now()}`,
        title: `${appMeta.name} - ${callerName}`,
        callerName,
        phoneNumber,
        voipApp,
        direction,
        timestamp: Date.now(),
        duration: finalDuration,
        mp3Blob,
        mp3Url,
        fileSize: mp3Blob.size,
        bitrate: settings.audioBitrate,
        sampleRate: settings.audioSampleRate,
        qualityPreset: settings.qualityPreset || 'medium',
        isStarred: false,
        notes: `Perekaman otomatis panggilan ${appMeta.name} oleh Cube ACR.`,
        tags: Array.from(new Set([...selectedTags, appMeta.name])),
        bookmarks,
        cloudSync: {
          status: settings.autoSyncCloud ? 'synced' : 'pending',
          provider: settings.selectedCloudProvider,
          syncedProviders,
          lastSyncedAt: settings.autoSyncCloud ? Date.now() : undefined,
          cloudFileId: settings.autoSyncCloud ? `cloud_${Date.now()}` : undefined,
        },
        locationTag: 'Jakarta, ID',
      };

      setLastSavedRecord(newRecord);
      onCallRecorded(newRecord);
      setCallState('completed');
    } catch (err) {
      console.error('Failed to encode and save MP3:', err);
      setCallState('completed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {isId ? 'Simulator Panggilan VoIP' : 'VoIP Call Simulator'}
              </h3>
              <p className="text-xs text-slate-400">
                {isId ? 'Uji coba rekaman otomatis Cube ACR' : 'Test Cube ACR automatic call recording'}
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

        {/* Content based on callState */}
        <div className="p-6">
          {callState === 'setup' && (
            <div className="space-y-4">
              {/* App selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {isId ? 'Pilih Aplikasi VoIP' : 'Choose VoIP Application'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['whatsapp', 'telegram', 'zoom', 'skype', 'meet', 'phone'] as VoipApp[]).map((app) => {
                    const meta = getAppMeta(app);
                    const isSelected = voipApp === app;
                    return (
                      <button
                        key={app}
                        onClick={() => setVoipApp(app)}
                        className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600/20 border-rose-500 text-white shadow-sm'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="truncate">{meta.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direction selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDirection('incoming')}
                  className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    direction === 'incoming'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <PhoneIncoming className="w-4 h-4 text-emerald-400" />
                  <span>{isId ? 'Panggilan Masuk' : 'Incoming Call'}</span>
                </button>

                <button
                  onClick={() => setDirection('outgoing')}
                  className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    direction === 'outgoing'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <PhoneOutgoing className="w-4 h-4 text-blue-400" />
                  <span>{isId ? 'Panggilan Keluar' : 'Outgoing Call'}</span>
                </button>
              </div>

              {/* Caller details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {isId ? 'Nama Kontak / Penelepon' : 'Contact / Caller Name'}
                  </label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                    placeholder="Nama kontak"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {isId ? 'Nomor Telepon / Handle ID' : 'Phone / ID Handle'}
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                    placeholder="+62 812..."
                  />
                </div>

                {/* Tag Selection Chips */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    {isId ? 'Pilih Tag Panggilan:' : 'Assign Call Tags:'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Work', 'Personal', 'Important', 'Meeting', 'VIP'].map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTags(selectedTags.filter((t) => t !== tag));
                            } else {
                              setSelectedTags([...selectedTags, tag]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {isSelected ? `✓ #${tag}` : `+#${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Automatic Features Info Card */}
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p>
                  {isId
                    ? `Cube ACR otomatis merekam ketika panggilan diangkat, mengonversi langsung ke MP3 ${settings.audioBitrate}kbps, dan menyimpannya ke penyimpanan lokal perangkat.`
                    : `Cube ACR automatically triggers recording upon answering, encodes directly to MP3 ${settings.audioBitrate}kbps, and saves it to local device storage.`}
                </p>
              </div>

              {/* Start Simulation button */}
              <button
                onClick={handleStartCall}
                className="w-full py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-rose-900/40 transition active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Phone className="w-5 h-5" />
                <span>
                  {direction === 'incoming'
                    ? (isId ? 'Mulai Dering Panggilan Masuk' : 'Trigger Incoming Call Ring')
                    : (isId ? 'Mulai Panggilan Keluar' : 'Start Outgoing Call')}
                </span>
              </button>
            </div>
          )}

          {/* Ringing State */}
          {callState === 'ringing' && (
            <div className="text-center py-6 space-y-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-2xl relative z-10">
                  <span className="text-3xl font-extrabold text-slate-200">
                    {callerName.charAt(0)}
                  </span>
                </div>
                {/* Ringing pulse animation */}
                <div className="absolute inset-0 rounded-full border-4 border-rose-500 animate-ping opacity-60" />
                <div className="absolute -inset-3 rounded-full border border-rose-500/40 animate-pulse" />
              </div>

              <div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full uppercase">
                  {appMeta.name} {direction === 'incoming' ? 'Incoming...' : 'Calling...'}
                </span>
                <h4 className="text-xl font-bold text-white mt-2">{callerName}</h4>
                <p className="text-sm text-slate-400">{phoneNumber}</p>
              </div>

              {/* Action buttons */}
              {direction === 'incoming' ? (
                <div className="flex items-center justify-center space-x-8 pt-4">
                  {/* Decline button */}
                  <button
                    onClick={handleDeclineCall}
                    className="flex flex-col items-center space-y-2 group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform active:scale-90">
                      <PhoneOff className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-rose-400">
                      {isId ? 'Tolak' : 'Decline'}
                    </span>
                  </button>

                  {/* Answer button */}
                  <button
                    onClick={handleAnswerCall}
                    className="flex flex-col items-center space-y-2 group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 transition-transform active:scale-90 animate-bounce">
                      <Phone className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-400 font-bold">
                      {isId ? 'Jawab' : 'Answer'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleDeclineCall}
                    className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Connected & Live Recording State */}
          {callState === 'connected' && (
            <div className="space-y-6 py-2">
              {/* Top call status banner with Cube ACR active notification */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                  <div>
                    <span className="text-xs font-bold text-emerald-300">
                      Cube ACR Otomatis Merekam VoIP
                    </span>
                    <p className="text-[10px] text-emerald-400/80">
                      Format: MP3 {settings.audioBitrate}kbps (Boost: +{Math.round((settings.audioBoostGain - 1) * 100)}%)
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {formatDuration(duration)}
                </span>
              </div>

              {/* Caller Avatar & Name */}
              <div className="text-center space-y-1">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border-2 border-indigo-500/30 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">{callerName.charAt(0)}</span>
                </div>
                <h4 className="text-lg font-bold text-white pt-1">{callerName}</h4>
                <p className="text-xs text-slate-400">{phoneNumber} • {appMeta.name}</p>
              </div>

              {/* Live Audio Visualizer */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                  <span className="flex items-center">
                    <Radio className="w-3.5 h-3.5 mr-1 text-rose-500 animate-pulse" />
                    Audio Stream VoIP
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">
                    {formatDuration(duration)}
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-1.5 h-12 px-2">
                  {[20, 50, 75, 90, 60, 40, 80, 100, 70, 45, 85, 95, 60, 30, 80, 40, 65, 90].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-rose-600 via-pink-500 to-indigo-400 rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.max(6, (h * (0.3 + Math.random() * 0.7)) / 2.2)}px`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Bookmarks Section */}
              {bookmarks.length > 0 && (
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center mb-1">
                    <Bookmark className="w-3 h-3 mr-1" />
                    Bookmarks ({bookmarks.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {bookmarks.map((bm) => (
                      <span
                        key={bm.id}
                        className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-200 rounded-md font-medium"
                      >
                        ⏱️ {formatDuration(bm.time)}: {bm.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* In-call controls */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                    isMuted ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5 mb-1" /> : <Mic className="w-5 h-5 mb-1" />}
                  <span>{isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                <button
                  onClick={() => setIsSpeaker(!isSpeaker)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                    isSpeaker ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Volume2 className="w-5 h-5 mb-1" />
                  <span>{isId ? 'Speaker' : 'Speaker'}</span>
                </button>

                <button
                  onClick={() => setShowBookmarkInput(!showBookmarkInput)}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 hover:bg-slate-750 text-xs transition cursor-pointer"
                >
                  <Bookmark className="w-5 h-5 mb-1" />
                  <span>Bookmark</span>
                </button>

                <button
                  onClick={handleHangupAndSave}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-rose-900/50 active:scale-95"
                >
                  <PhoneOff className="w-5 h-5 mb-1" />
                  <span>{isId ? 'Tutup & Simpan' : 'End & Save'}</span>
                </button>
              </div>

              {/* Bookmark Input Form */}
              {showBookmarkInput && (
                <div className="flex space-x-2 pt-1 animate-in fade-in">
                  <input
                    type="text"
                    value={bookmarkLabel}
                    onChange={(e) => setBookmarkLabel(e.target.value)}
                    placeholder={isId ? 'Keterangan bookmark...' : 'Bookmark label...'}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <button
                    onClick={handleAddBookmark}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Encoding State */}
          {callState === 'encoding' && (
            <div className="text-center py-12 space-y-4">
              <div className="w-14 h-14 mx-auto border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <h4 className="text-base font-bold text-white">
                {isId ? 'Mengonversi Rekaman ke Format MP3...' : 'Encoding Audio to MP3 Format...'}
              </h4>
              <p className="text-xs text-slate-400">
                {isId
                  ? 'Menyimpan secara otomatis ke penyimpanan lokal perangkat pengguna...'
                  : 'Automatically saving to local storage on your device...'}
              </p>
            </div>
          )}

          {/* Completed State */}
          {callState === 'completed' && lastSavedRecord && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">
                  {isId ? 'Perekaman VoIP Berhasil Disimpan!' : 'VoIP Recording Saved Successfully!'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {isId
                    ? 'Berkas audio telah dienkripsi & disimpan dalam format MP3 ke penyimpanan lokal.'
                    : 'Audio file has been encoded in MP3 and stored locally.'}
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isId ? 'Judul: ' : 'Title: '}</span>
                  <span className="font-semibold text-slate-200">{lastSavedRecord.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isId ? 'Durasi & Ukuran: ' : 'Duration & Size: '}</span>
                  <span className="font-semibold text-slate-200">
                    {formatDuration(lastSavedRecord.duration)} • {(lastSavedRecord.fileSize / 1024).toFixed(1)} KB (MP3 {lastSavedRecord.bitrate}k)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isId ? 'Status Unduh Lokal: ' : 'Local Download: '}</span>
                  <span className="text-emerald-400 font-medium">
                    {settings.autoSaveToDisk
                      ? (isId ? '✓ Diunduh otomatis ke perangkat' : '✓ Automatically downloaded')
                      : (isId ? 'Tersimpan di IndexedDB browser' : 'Saved in IndexedDB')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isId ? 'Sinkronisasi Cloud: ' : 'Cloud Sync: '}</span>
                  <span className="text-indigo-400 font-medium">
                    {lastSavedRecord.cloudSync.status === 'synced'
                      ? (isId ? '✓ Tersinkron ke Google Drive' : '✓ Synced to Google Drive')
                      : (isId ? '⏳ Menunggu Sinkron' : '⏳ Pending Sync')}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setCallState('setup')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer"
                >
                  {isId ? 'Simulasi Lagi' : 'Simulate Again'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {isId ? 'Lihat di Riwayat' : 'View in History'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

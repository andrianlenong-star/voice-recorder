import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Phone, 
  Video, 
  PhoneOff, 
  ShieldCheck, 
  CheckCircle2, 
  Mic, 
  Volume2, 
  Bookmark, 
  Sparkles, 
  Search, 
  Camera, 
  MoreVertical, 
  MessageCircle, 
  Radio, 
  ArrowLeft,
  Check,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { AppSettings, CallRecord, VoipApp, CloudProvider } from '../types';
import { VoipSoundEffects } from '../utils/audioTone';
import { generateSyntheticCallAudio, encodeAudioBufferToMp3, triggerLocalDownload, generateRecordingFilename } from '../utils/audioEncoder';
import { formatDuration } from '../utils/callManager';

interface WhatsAppCallFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onCallRecorded: (record: CallRecord) => void;
  onViewRecordingsList: () => void;
}

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
  status: string;
  consentAgreed: boolean;
  lastSeen: string;
}

const DEMO_CONTACTS: WhatsAppContact[] = [
  {
    id: 'c1',
    name: 'Budi Santoso (Kantor)',
    phone: '+62 812-7788-9900',
    avatarColor: 'from-blue-600 to-indigo-600',
    status: 'Bisa hubungi untuk koordinasi proyek kantor',
    consentAgreed: true,
    lastSeen: 'online',
  },
  {
    id: 'c2',
    name: 'Dr. Sarah Sp.A (Konsultasi)',
    phone: '+62 813-1122-3344',
    avatarColor: 'from-emerald-600 to-teal-600',
    status: 'Jadwal konsultasi klinis online',
    consentAgreed: true,
    lastSeen: 'terakhir dilihat hari ini 09:15',
  },
  {
    id: 'c3',
    name: 'Aditya Pratama (Project Manager)',
    phone: '+62 811-5566-7788',
    avatarColor: 'from-rose-600 to-pink-600',
    status: 'Diskusi sprint & review arsitektur aplikasi',
    consentAgreed: true,
    lastSeen: 'online',
  },
  {
    id: 'c4',
    name: 'Siti Rahma (Keluarga)',
    phone: '+62 819-9988-7766',
    avatarColor: 'from-amber-600 to-orange-600',
    status: 'Tersedia untuk panggilan keluarga',
    consentAgreed: true,
    lastSeen: 'terakhir dilihat kemarin',
  },
];

type FlowPhase = 
  | 'step1_whatsapp_home' 
  | 'step2_contact_consent' 
  | 'step3_connecting' 
  | 'step4_call_with_cube_widget' 
  | 'step5_completed_review';

export const WhatsAppCallFlowModal: React.FC<WhatsAppCallFlowModalProps> = ({
  isOpen,
  onClose,
  settings,
  onCallRecorded,
  onViewRecordingsList,
}) => {
  const [phase, setPhase] = useState<FlowPhase>('step1_whatsapp_home');
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact>(DEMO_CONTACTS[0]);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [consentConfirmed, setConsentConfirmed] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState<CallRecord | null>(null);

  const timerRef = useRef<number | null>(null);
  const isId = settings.language === 'id';

  useEffect(() => {
    if (isOpen) {
      setPhase('step1_whatsapp_home');
      setSelectedContact(DEMO_CONTACTS[0]);
      setCallType('voice');
      setConsentConfirmed(true);
      setCallDuration(0);
      setBookmarks([]);
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

  // Step 2 -> Step 3: Trigger Call
  const handleStartCall = (type: 'voice' | 'video') => {
    setCallType(type);
    setPhase('step3_connecting');
    VoipSoundEffects.startRinging('whatsapp');

    // Simulate connection after 3.2 seconds
    setTimeout(() => {
      VoipSoundEffects.playCallAnswered();
      setPhase('step4_call_with_cube_widget');
      setCallDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }, 3200);
  };

  // Step 4: Add bookmark
  const handleAddBookmark = () => {
    const bm = `Bookmark @ ${formatDuration(callDuration)}`;
    setBookmarks([...bookmarks, bm]);
  };

  // Step 4 -> Step 5: Hangup & Process with Cube ACR
  const handleEndCallAndProcess = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    VoipSoundEffects.playCallEnded();

    const finalDuration = Math.max(3, callDuration);

    try {
      // 1. Generate audio buffer
      const audioBuffer = generateSyntheticCallAudio(
        finalDuration,
        settings.audioSampleRate,
        'whatsapp'
      );

      // 2. Encode to MP3 with chosen preset
      const mp3Blob = encodeAudioBufferToMp3(
        audioBuffer,
        settings.audioBitrate,
        settings.audioBoostGain
      );

      const mp3Url = URL.createObjectURL(mp3Blob);
      const filename = generateRecordingFilename('whatsapp', selectedContact.name);

      // 3. Local download if autoSaveToDisk is true
      if (settings.autoSaveToDisk) {
        triggerLocalDownload(mp3Blob, filename);
      }

      const connectedList = Object.entries(settings.connectedClouds || {})
        .filter(([_, isConn]) => isConn)
        .map(([p]) => p as CloudProvider);

      const syncedProviders = settings.autoSyncCloud
        ? (settings.multiCloudSync && connectedList.length > 0 ? connectedList : [settings.selectedCloudProvider])
        : [];

      // 4. Construct CallRecord
      const newRecord: CallRecord = {
        id: `cube_wa_${Date.now()}`,
        title: `WhatsApp ${callType === 'video' ? 'Video' : 'Voice'} - ${selectedContact.name}`,
        callerName: selectedContact.name,
        phoneNumber: selectedContact.phone,
        voipApp: 'whatsapp',
        direction: 'outgoing',
        timestamp: Date.now(),
        duration: finalDuration,
        mp3Blob,
        mp3Url,
        fileSize: mp3Blob.size,
        bitrate: settings.audioBitrate,
        sampleRate: settings.audioSampleRate,
        qualityPreset: settings.qualityPreset || 'medium',
        isStarred: false,
        notes: `Perekaman WhatsApp ${callType === 'video' ? 'Video' : 'Voice'} Call otomatis melalui Cube ACR App Connector. Kontak telah menyetujui perekaman.`,
        tags: ['WhatsApp', callType === 'video' ? 'Meeting' : 'Work', 'Important'],
        bookmarks: bookmarks.map((b, idx) => ({
          id: `bm_wa_${idx}`,
          time: idx * 5,
          label: b,
        })),
        cloudSync: {
          status: settings.autoSyncCloud ? 'synced' : 'pending',
          provider: settings.selectedCloudProvider,
          syncedProviders,
          lastSyncedAt: settings.autoSyncCloud ? Date.now() : undefined,
          cloudFileId: settings.autoSyncCloud ? `cloud_wa_${Date.now()}` : undefined,
        },
        locationTag: 'Jakarta, ID',
      };

      setLastSavedRecord(newRecord);
      onCallRecorded(newRecord);
      setPhase('step5_completed_review');
    } catch (err) {
      console.error('Error encoding WhatsApp MP3:', err);
      setPhase('step5_completed_review');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top App Bar Header with Cube ACR Status Banner */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">
              Cube ACR VoIP Connector
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded uppercase">
              WhatsApp Mode
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Five Step Breadcrumbs */}
        <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0 overflow-x-auto gap-2">
          <span className={`font-semibold shrink-0 ${phase === 'step1_whatsapp_home' ? 'text-emerald-400 font-bold' : ''}`}>
            1. Buka WA
          </span>
          <span>→</span>
          <span className={`font-semibold shrink-0 ${phase === 'step2_contact_consent' ? 'text-emerald-400 font-bold' : ''}`}>
            2. Kontak & Izin
          </span>
          <span>→</span>
          <span className={`font-semibold shrink-0 ${phase === 'step3_connecting' ? 'text-emerald-400 font-bold' : ''}`}>
            3. Mulai Call
          </span>
          <span>→</span>
          <span className={`font-semibold shrink-0 ${phase === 'step4_call_with_cube_widget' ? 'text-rose-400 font-bold' : ''}`}>
            4. Cube ACR Widget
          </span>
          <span>→</span>
          <span className={`font-semibold shrink-0 ${phase === 'step5_completed_review' ? 'text-indigo-400 font-bold' : ''}`}>
            5. Hasil MP3
          </span>
        </div>

        {/* Main Body per Phase */}
        <div className="flex-1 overflow-y-auto">
          {/* PHASE 1: Buka WhatsApp */}
          {phase === 'step1_whatsapp_home' && (
            <div className="flex flex-col h-full bg-[#111b21] text-[#e9edef] animate-in fade-in">
              {/* WhatsApp Green Header */}
              <div className="bg-[#008069] text-white p-3.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold tracking-tight">WhatsApp</span>
                  <div className="flex items-center space-x-4">
                    <Camera className="w-4 h-4 opacity-90" />
                    <Search className="w-4 h-4 opacity-90" />
                    <MoreVertical className="w-4 h-4 opacity-90" />
                  </div>
                </div>

                {/* WhatsApp Tabs */}
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-100/90 pt-1 border-b-2 border-white pb-1">
                  <span>CHATS</span>
                  <span className="opacity-70">STATUS</span>
                  <span className="opacity-70">CALLS</span>
                </div>
              </div>

              {/* Informational Guidance */}
              <div className="bg-[#202c33] p-3 text-xs text-[#8696a0] border-b border-[#222e35] flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isId 
                    ? 'Langkah 1 & 2: Pilih kontak yang sudah menyetujui perekaman panggilan'
                    : 'Step 1 & 2: Select a contact who has consented to call recording'}
                </span>
              </div>

              {/* Contact list */}
              <div className="divide-y divide-[#222e35] flex-1">
                {DEMO_CONTACTS.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact);
                      setPhase('step2_contact_consent');
                    }}
                    className="w-full p-3.5 flex items-center space-x-3.5 hover:bg-[#202c33] transition text-left cursor-pointer group"
                  >
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${contact.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow`}>
                      {contact.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#e9edef] truncate group-hover:text-emerald-400">
                          {contact.name}
                        </span>
                        <span className="text-[10px] text-[#8696a0] shrink-0">
                          {contact.lastSeen === 'online' ? 'Online' : 'Hari ini'}
                        </span>
                      </div>
                      <p className="text-xs text-[#8696a0] truncate mt-0.5">
                        {contact.status}
                      </p>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] rounded font-semibold flex items-center">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-400" />
                          Persetujuan Rekam: OK
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PHASE 2: Kontak & Verifikasi Persetujuan Etis */}
          {phase === 'step2_contact_consent' && (
            <div className="p-5 space-y-4 bg-[#111b21] text-[#e9edef] h-full animate-in fade-in">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#222e35]">
                <button
                  onClick={() => setPhase('step1_whatsapp_home')}
                  className="p-1 text-[#8696a0] hover:text-white rounded-lg cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${selectedContact.avatarColor} text-white flex items-center justify-center font-bold text-sm`}>
                  {selectedContact.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{selectedContact.name}</h4>
                  <p className="text-xs text-emerald-400 font-medium">{selectedContact.phone} • {selectedContact.lastSeen}</p>
                </div>
              </div>

              {/* Ethics Consent Card */}
              <div className="bg-[#202c33] border border-emerald-500/40 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Persetujuan Perekaman Terverifikasi</span>
                </div>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  {isId 
                    ? 'Kontak ini telah memberikan izin perekaman panggilan VoIP untuk keperluan dokumentasi, transparansi, dan arsip audio yang sah.'
                    : 'This contact has provided consent to record VoIP calls for documentation and archiving.'}
                </p>
                <label className="flex items-center space-x-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    {isId ? 'Konfirmasi kedua belah pihak setuju direkam' : 'Both parties agree to call recording'}
                  </span>
                </label>
              </div>

              {/* Action Buttons to Start Call */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isId ? 'Langkah 3: Pilih Jenis Panggilan WhatsApp' : 'Step 3: Start WhatsApp Call'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={!consentConfirmed}
                    onClick={() => handleStartCall('voice')}
                    className="p-4 bg-[#008069] hover:bg-[#00705c] disabled:opacity-50 text-white rounded-2xl shadow-lg transition flex flex-col items-center justify-center space-y-2 cursor-pointer active:scale-95"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-xs">Voice Call</span>
                  </button>

                  <button
                    disabled={!consentConfirmed}
                    onClick={() => handleStartCall('video')}
                    className="p-4 bg-[#008069] hover:bg-[#00705c] disabled:opacity-50 text-white rounded-2xl shadow-lg transition flex flex-col items-center justify-center space-y-2 cursor-pointer active:scale-95"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-xs">Video Call</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 3: Ringing & Connecting */}
          {phase === 'step3_connecting' && (
            <div className="p-8 text-center bg-[#111b21] text-[#e9edef] h-full flex flex-col justify-between animate-in fade-in">
              <div className="space-y-3 pt-4">
                <div className="relative inline-block">
                  <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-tr ${selectedContact.avatarColor} text-white flex items-center justify-center font-bold text-3xl shadow-xl ring-4 ring-[#222e35]`}>
                    {selectedContact.name.charAt(0)}
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-50" />
                </div>
                <h4 className="text-xl font-bold text-white">{selectedContact.name}</h4>
                <p className="text-xs text-emerald-400 font-semibold tracking-wider uppercase">
                  WhatsApp {callType === 'video' ? 'Video Call' : 'Voice Call'}...
                </p>
                <p className="text-xs text-[#8696a0]">Menghubungkan (Calling)...</p>
              </div>

              {/* Cube ACR Background Listener Indicator */}
              <div className="bg-[#202c33] p-3 rounded-2xl border border-slate-700/80 text-xs text-slate-300 flex items-center space-x-2.5 mx-auto max-w-xs">
                <Sparkles className="w-4 h-4 text-rose-400 shrink-0 animate-spin" />
                <span className="text-[11px] text-left">
                  Cube ACR App Connector mendeteksi sinyal panggilan keluar WhatsApp...
                </span>
              </div>

              <div className="pt-4 flex justify-center pb-2">
                <button
                  onClick={() => {
                    VoipSoundEffects.stopRinging();
                    setPhase('step2_contact_consent');
                  }}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* PHASE 4: Panggilan Berlangsung dengan Floating Cube ACR Widget */}
          {phase === 'step4_call_with_cube_widget' && (
            <div className="relative h-full min-h-[380px] bg-[#111b21] text-[#e9edef] flex flex-col justify-between p-5 animate-in fade-in">
              {/* Top call info */}
              <div className="text-center space-y-1 pt-2">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-tr ${selectedContact.avatarColor} text-white flex items-center justify-center font-bold text-xl shadow-lg ring-2 ring-emerald-500/50`}>
                  {selectedContact.name.charAt(0)}
                </div>
                <h4 className="text-base font-bold text-white pt-1">{selectedContact.name}</h4>
                <p className="text-xs text-[#8696a0] font-mono">
                  {callType === 'video' ? 'WhatsApp Video Call' : 'WhatsApp Call'} • {formatDuration(callDuration)}
                </p>
              </div>

              {/* FLOATING CUBE ACR WIDGET OVERLAY (Merekam otomatis di atas panggilan) */}
              <div className="my-auto">
                <div className="bg-slate-900/95 border-2 border-rose-500 shadow-2xl shadow-rose-950/70 rounded-2xl p-3.5 backdrop-blur-xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                      </div>
                      <span className="text-xs font-black text-white tracking-wide">
                        CUBE ACR WIDGET
                      </span>
                      <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold rounded">
                        REC LIVE
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                      {formatDuration(callDuration)}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-300 font-semibold block text-[11px]">
                        Deteksi Otomatis: WhatsApp VoIP
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Preset: {settings.qualityPreset?.toUpperCase() || 'MEDIUM'} ({settings.audioBitrate} kbps MP3)
                      </span>
                    </div>

                    {/* Audio visualizer stream */}
                    <div className="flex items-center space-x-1 h-6">
                      {[15, 30, 60, 90, 45, 80, 50, 20].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-gradient-to-t from-rose-500 to-indigo-400 rounded-full"
                          style={{
                            height: `${Math.max(4, (h * (0.4 + Math.random() * 0.6)) / 3.5)}px`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Bookmark Button */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleAddBookmark}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition"
                    >
                      <Bookmark className="w-3 h-3" />
                      <span>{isId ? 'Tandai Bookmark' : 'Add Bookmark'}</span>
                    </button>

                    <span className="text-[10px] text-emerald-400 flex items-center font-medium">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      App Connector Aktif
                    </span>
                  </div>

                  {bookmarks.length > 0 && (
                    <div className="mt-2 text-[10px] text-amber-300 bg-amber-950/40 p-1.5 rounded-lg border border-amber-500/30">
                      ✓ {bookmarks.length} bookmark ditandai pada rekaman ini
                    </div>
                  )}
                </div>
              </div>

              {/* End Call Button */}
              <div className="flex justify-center pb-2">
                <button
                  onClick={handleEndCallAndProcess}
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-900/50 transition active:scale-95 cursor-pointer"
                  title="Tutup Panggilan WhatsApp"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            </div>
          )}

          {/* PHASE 5: Panggilan Selesai & Periksa Hasil di Cube ACR */}
          {phase === 'step5_completed_review' && lastSavedRecord && (
            <div className="p-6 text-center space-y-4 bg-slate-900 text-white h-full animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">
                  {isId ? 'Langkah 5: Panggilan WhatsApp Berhasil Direkam!' : 'Step 5: WhatsApp Call Successfully Recorded!'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {isId
                    ? 'Rekaman MP3 telah dibuat secara otomatis dan disimpan ke penyimpanan lokal Anda.'
                    : 'MP3 recording was automatically created and saved to your local storage.'}
                </p>
              </div>

              {/* Details card */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Kontak / Penelepon:</span>
                  <span className="font-bold text-white">{lastSavedRecord.callerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Format & Preset:</span>
                  <span className="font-semibold text-rose-300">
                    MP3 {lastSavedRecord.bitrate} kbps ({lastSavedRecord.qualityPreset?.toUpperCase()})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Durasi Panggilan:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {formatDuration(lastSavedRecord.duration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tag Otomatis:</span>
                  <span className="text-indigo-300 font-semibold">
                    {lastSavedRecord.tags.map(t => `#${t}`).join(' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Penyimpanan Lokal:</span>
                  <span className="text-emerald-400 font-semibold">
                    {settings.autoSaveToDisk ? '✓ Diunduh ke HP' : '✓ Tersimpan di IndexedDB'}
                  </span>
                </div>
              </div>

              {/* Direct Action: View in Cube ACR Recordings List */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onViewRecordingsList();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/40 transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{isId ? 'Periksa Hasil di Daftar Rekaman Cube ACR' : 'View in Cube ACR Recordings List'}</span>
                </button>

                <button
                  onClick={() => setPhase('step1_whatsapp_home')}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer"
                >
                  {isId ? 'Uji Coba Panggilan WhatsApp Lain' : 'Test Another WhatsApp Call'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Square, 
  Pause, 
  Play, 
  Bookmark, 
  Sliders, 
  Check, 
  Volume2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { VoipApp, CallRecord, AppSettings, CallBookmark, CloudProvider } from '../types';
import { encodeAudioBufferToMp3, floatTo16BitPCM, triggerLocalDownload, generateRecordingFilename } from '../utils/audioEncoder';
import { formatDuration, getAppMeta } from '../utils/callManager';

interface LiveRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onRecordingSaved: (record: CallRecord) => void;
}

export const LiveRecorderModal: React.FC<LiveRecorderModalProps> = ({
  isOpen,
  onClose,
  settings,
  onRecordingSaved,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [voipApp, setVoipApp] = useState<VoipApp>('whatsapp');
  const [callerName, setCallerName] = useState('Panggilan WhatsApp Web');
  const [phoneNumber, setPhoneNumber] = useState('+62 813-2233-4455');
  const [audioBoost, setAudioBoost] = useState<number>(settings.audioBoostGain || 1.5);
  const [bookmarks, setBookmarks] = useState<CallBookmark[]>([]);
  const [bookmarkText, setBookmarkText] = useState('');
  const [isEncoding, setIsEncoding] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const recordedSamplesRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isId = settings.language === 'id';
  const appMeta = getAppMeta(voipApp);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopAndCleanAudio();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setBookmarks([]);
      setMicError(null);
    }
    return () => {
      stopAndCleanAudio();
    };
  }, [isOpen]);

  const stopAndCleanAudio = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const startLiveRecording = async () => {
    setMicError(null);
    recordedSamplesRef.current = [];
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Audio processor to collect PCM samples
      const bufferSize = 4096;
      const scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1);
      scriptProcessorRef.current = scriptNode;

      scriptNode.onaudioprocess = (e) => {
        if (!isPaused) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Clone the samples
          recordedSamplesRef.current.push(new Float32Array(inputData));
        }
      };

      source.connect(analyser);
      analyser.connect(scriptNode);
      scriptNode.connect(ctx.destination);

      setIsRecording(true);
      setIsPaused(false);

      // Start duration counter
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Start canvas waveform visualizer
      startVisualizer();
    } catch (err: unknown) {
      console.warn('Microphone access issue:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMicError(
        isId
          ? `Gagal mengakses mikrofon (${errorMsg}). Anda dapat menggunakan Simulator Panggilan untuk merekam VoIP sintetik berkualitas tinggi.`
          : `Failed to access microphone (${errorMsg}). You can use the VoIP Simulator instead.`
      );
    }
  };

  const startVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Gradient color from Rose to Indigo
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#e11d48');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#6366f1');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const togglePauseResume = () => {
    if (!isRecording) return;
    if (isPaused) {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setIsPaused(false);
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
      }
      setIsPaused(true);
    }
  };

  const handleAddBookmark = () => {
    const label = bookmarkText.trim() || `Bookmark @ ${formatDuration(duration)}`;
    setBookmarks((prev) => [
      ...prev,
      { id: `bm_${Date.now()}`, time: duration, label },
    ]);
    setBookmarkText('');
  };

  const handleFinishAndSave = async () => {
    setIsEncoding(true);
    stopAndCleanAudio();

    try {
      const allChunks = recordedSamplesRef.current;
      const totalSamples = allChunks.reduce((acc, chunk) => acc + chunk.length, 0);

      // Create an AudioBuffer from recorded chunks
      const sampleRate = audioCtxRef.current ? audioCtxRef.current.sampleRate : settings.audioSampleRate;
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const finalBuffer = audioCtx.createBuffer(1, Math.max(sampleRate, totalSamples), sampleRate);
      const channelData = finalBuffer.getChannelData(0);

      let offset = 0;
      for (const chunk of allChunks) {
        channelData.set(chunk, offset);
        offset += chunk.length;
      }

      // Encode to MP3 with user's audio boost gain and bitrate
      const mp3Blob = encodeAudioBufferToMp3(
        finalBuffer,
        settings.audioBitrate,
        audioBoost
      );

      const mp3Url = URL.createObjectURL(mp3Blob);
      const filename = generateRecordingFilename(voipApp, callerName);

      // Automatic download to user's device
      if (settings.autoSaveToDisk) {
        triggerLocalDownload(mp3Blob, filename);
      }

      const connectedList = Object.entries(settings.connectedClouds || {})
        .filter(([_, isConn]) => isConn)
        .map(([p]) => p as CloudProvider);

      const syncedProviders = settings.autoSyncCloud
        ? (settings.multiCloudSync && connectedList.length > 0 ? connectedList : [settings.selectedCloudProvider])
        : [];

      const newRecord: CallRecord = {
        id: `cube_live_${Date.now()}`,
        title: `${appMeta.name} - ${callerName}`,
        callerName,
        phoneNumber,
        voipApp,
        direction: 'incoming',
        timestamp: Date.now(),
        duration: Math.max(1, duration),
        mp3Blob,
        mp3Url,
        fileSize: mp3Blob.size,
        bitrate: settings.audioBitrate,
        sampleRate,
        qualityPreset: settings.qualityPreset || 'medium',
        isStarred: false,
        notes: `Rekaman mikrofon VoIP langsung via Cube ACR. Audio Boost: ${audioBoost.toFixed(1)}x`,
        tags: ['Work', appMeta.name],
        bookmarks,
        cloudSync: {
          status: settings.autoSyncCloud ? 'synced' : 'pending',
          provider: settings.selectedCloudProvider,
          syncedProviders,
          lastSyncedAt: settings.autoSyncCloud ? Date.now() : undefined,
          cloudFileId: settings.autoSyncCloud ? `gdrive_live_${Date.now()}` : undefined,
        },
        locationTag: 'Lokal Perangkat',
      };

      onRecordingSaved(newRecord);
      setIsEncoding(false);
      onClose();
    } catch (err) {
      console.error('Error encoding live MP3:', err);
      setIsEncoding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {isId ? 'Perekam Audio VoIP Langsung' : 'Live VoIP Audio Recorder'}
              </h3>
              <p className="text-xs text-slate-400">
                {isId ? 'Merekam mikrofon / audio tab panggilan & ekspor MP3 otomatis' : 'Record microphone & auto-export MP3'}
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

        {/* Body */}
        <div className="p-6 space-y-4">
          {micError && (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3 text-xs text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">{isId ? 'Peringatan Mikrofon' : 'Microphone Notice'}</p>
                <p className="mt-0.5">{micError}</p>
              </div>
            </div>
          )}

          {/* Call Metadata Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {isId ? 'Aplikasi VoIP' : 'VoIP Application'}
              </label>
              <select
                value={voipApp}
                onChange={(e) => setVoipApp(e.target.value as VoipApp)}
                disabled={isRecording}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              >
                <option value="whatsapp">WhatsApp Web / Call</option>
                <option value="telegram">Telegram Web / Voice</option>
                <option value="zoom">Zoom Meeting</option>
                <option value="skype">Skype</option>
                <option value="meet">Google Meet</option>
                <option value="phone">Telepon Biasa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {isId ? 'Nama Kontak / Penelepon' : 'Contact / Caller Name'}
              </label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                disabled={isRecording}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Audio Boost (Loudness Amplifier) Slider */}
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center">
                <Sliders className="w-3.5 h-3.5 mr-1.5 text-pink-400" />
                {isId ? 'Penguat Audio (Audio Loudness Booster)' : 'Audio Boost (Loudness Booster)'}
              </span>
              <span className="font-mono font-bold text-pink-400">
                {audioBoost.toFixed(1)}x (+{Math.round((audioBoost - 1) * 100)}%)
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={audioBoost}
              onChange={(e) => setAudioBoost(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
            <p className="text-[10px] text-slate-400">
              {isId
                ? 'Fitur khas Cube ACR untuk memperjelas dan memperkeras suara lawan bicara.'
                : 'Cube ACR signature feature to amplify the other party’s speech clarity.'}
            </p>
          </div>

          {/* Audio Visualizer Canvas */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 px-1">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isRecording && !isPaused ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
                <span className="font-medium text-slate-300">
                  {isRecording ? (isPaused ? 'Perekaman Dijeda' : 'Merekam Suara...') : 'Mikrofon Siaga'}
                </span>
              </div>
              <span className="font-mono text-base font-bold text-rose-400">
                {formatDuration(duration)}
              </span>
            </div>

            <canvas
              ref={canvasRef}
              width={440}
              height={70}
              className="w-full h-[70px] bg-slate-950/90 rounded-xl"
            />

            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-[1px]">
                <p className="text-xs text-slate-400">
                  {isId ? 'Tekan tombol "Mulai Merekam" di bawah' : 'Click "Start Recording" below'}
                </p>
              </div>
            )}
          </div>

          {/* Bookmarks while recording */}
          {isRecording && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={bookmarkText}
                  onChange={(e) => setBookmarkText(e.target.value)}
                  placeholder={isId ? 'Tandai catatan waktu...' : 'Bookmark label at this time...'}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
                <button
                  onClick={handleAddBookmark}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isId ? 'Tandai' : 'Tag'}</span>
                </button>
              </div>

              {bookmarks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {bookmarks.map((bm) => (
                    <span
                      key={bm.id}
                      className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 text-amber-300 rounded-md font-medium"
                    >
                      ⏱️ {formatDuration(bm.time)}: {bm.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Control Buttons */}
          <div className="pt-2">
            {!isRecording ? (
              <button
                onClick={startLiveRecording}
                className="w-full py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Mic className="w-5 h-5" />
                <span>{isId ? 'Mulai Merekam VoIP' : 'Start VoIP Recording'}</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={togglePauseResume}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-slate-300" />}
                  <span>{isPaused ? (isId ? 'Lanjutkan' : 'Resume') : (isId ? 'Jeda' : 'Pause')}</span>
                </button>

                <button
                  onClick={handleFinishAndSave}
                  disabled={isEncoding}
                  className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-900/50 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isEncoding ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Square className="w-4 h-4 fill-current" />
                  )}
                  <span>{isEncoding ? 'Menyimpan MP3...' : (isId ? 'Selesai & Simpan MP3' : 'Finish & Save MP3')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

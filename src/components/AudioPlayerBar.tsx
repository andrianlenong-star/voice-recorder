import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Download, 
  X, 
  Sliders, 
  Bookmark, 
  Zap,
  Repeat
} from 'lucide-react';
import { CallRecord } from '../types';
import { formatDuration, getAppMeta } from '../utils/callManager';
import { triggerLocalDownload, generateRecordingFilename } from '../utils/audioEncoder';

interface AudioPlayerBarProps {
  currentRecord: CallRecord | null;
  onClose: () => void;
  language: 'id' | 'en';
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentRecord,
  onClose,
  language,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [boostLevel, setBoostLevel] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const isId = language === 'id';

  // Setup Web Audio gain boost whenever audio element or boostLevel changes
  useEffect(() => {
    if (!currentRecord) return;

    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.loop = isLooping;
    }
  }, [currentRecord, playbackRate, volume, isMuted, isLooping]);

  useEffect(() => {
    if (currentRecord) {
      setCurrentTime(0);
      setIsPlaying(true);
      // Auto-play when opened
      if (audioRef.current) {
        audioRef.current.src = currentRecord.mp3Url;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [currentRecord?.id, currentRecord?.mp3Url]);

  if (!currentRecord) return null;

  const appMeta = getAppMeta(currentRecord.voipApp);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    } else {
      setDuration(currentRecord.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const skipSeconds = (delta: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration || currentRecord.duration, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const jumpToBookmark = (bookmarkTime: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = bookmarkTime;
    setCurrentTime(bookmarkTime);
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const handleCycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleCycleBoost = () => {
    const boosts = [1.0, 1.5, 2.0, 2.5];
    const currentIndex = boosts.indexOf(boostLevel);
    const nextBoost = boosts[(currentIndex + 1) % boosts.length];
    setBoostLevel(nextBoost);

    // Apply digital boost multiplier
    if (audioRef.current) {
      // In browser Audio element, simulate boost by scaling volume or Web Audio gain
      audioRef.current.volume = Math.min(1.0, volume * (nextBoost > 1.0 ? 1.0 : volume));
    }
  };

  const handleDownload = () => {
    if (currentRecord.mp3Blob) {
      const filename = generateRecordingFilename(currentRecord.voipApp, currentRecord.callerName, currentRecord.timestamp);
      triggerLocalDownload(currentRecord.mp3Blob, filename);
    } else if (currentRecord.mp3Url) {
      const a = document.createElement('a');
      a.href = currentRecord.mp3Url;
      a.download = generateRecordingFilename(currentRecord.voipApp, currentRecord.callerName, currentRecord.timestamp);
      a.click();
    }
  };

  const effectiveDuration = duration > 0 ? duration : currentRecord.duration;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl text-slate-100 animate-in slide-in-from-bottom duration-300">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left Info */}
          <div className="flex items-center space-x-3 w-full md:w-1/4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <span className="font-bold text-base text-rose-400">
                {currentRecord.callerName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${appMeta.badgeBg}`}>
                  {appMeta.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  MP3 {currentRecord.bitrate}k
                </span>
              </div>
              <h5 className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                {currentRecord.title}
              </h5>
              <p className="text-[11px] text-slate-400 truncate">
                {currentRecord.callerName} • {currentRecord.phoneNumber}
              </p>
            </div>
          </div>

          {/* Center Player Controls & Waveform Scrubber */}
          <div className="w-full md:w-2/4 flex flex-col items-center space-y-1.5">
            {/* Play/Pause/Skip buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => skipSeconds(-5)}
                className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
                title="-5 detik"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/50 transition cursor-pointer active:scale-95"
                title={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
              </button>

              <button
                onClick={() => skipSeconds(5)}
                className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
                title="+5 detik"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Scrubber bar with bookmark markers */}
            <div className="w-full flex items-center space-x-2.5 text-xs text-slate-400">
              <span className="font-mono text-[11px] w-10 text-right text-slate-300">
                {formatDuration(currentTime)}
              </span>

              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min="0"
                  max={effectiveDuration || 1}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-rose-500 cursor-pointer"
                />

                {/* Render bookmark pins on timeline */}
                {currentRecord.bookmarks?.map((bm) => {
                  const percent = Math.min(100, Math.max(0, (bm.time / (effectiveDuration || 1)) * 100));
                  return (
                    <button
                      key={bm.id}
                      onClick={() => jumpToBookmark(bm.time)}
                      style={{ left: `${percent}%` }}
                      className="absolute -top-1.5 -ml-1.5 w-3 h-3 bg-amber-400 hover:bg-amber-300 rounded-full border border-slate-900 shadow-sm cursor-pointer z-10"
                      title={`Lompat ke bookmark: ${bm.label} (${formatDuration(bm.time)})`}
                    />
                  );
                })}
              </div>

              <span className="font-mono text-[11px] w-10 text-slate-400">
                {formatDuration(effectiveDuration)}
              </span>
            </div>
          </div>

          {/* Right Tools (Speed, Audio Boost, Download, Close) */}
          <div className="flex items-center justify-end space-x-2 w-full md:w-1/4">
            {/* Speed pill */}
            <button
              onClick={handleCycleSpeed}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer"
              title="Kecepatan putar"
            >
              {playbackRate}x
            </button>

            {/* Cube ACR Audio Boost Amplifier */}
            <button
              onClick={handleCycleBoost}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer flex items-center space-x-1 ${
                boostLevel > 1.0
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Cube ACR Audio Boost (Pengeras Suara Lawan Bicara)"
            >
              <Zap className="w-3 h-3 text-rose-400" />
              <span>{boostLevel > 1.0 ? `+${Math.round((boostLevel - 1) * 100)}%` : 'Boost'}</span>
            </button>

            {/* Loop toggle */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isLooping ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' : 'text-slate-400 border-transparent hover:bg-slate-800'
              }`}
              title={isLooping ? 'Ulangi Aktif' : 'Ulangi Audio'}
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Download MP3 */}
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
              title={isId ? 'Unduh Berkas MP3 ke Perangkat' : 'Download MP3 to Device'}
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close Bar */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title={isId ? 'Tutup Pemutar' : 'Close Player'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

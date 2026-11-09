import React, { useState } from 'react';
import { Bookmark, Square, Pause, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { VoipApp } from '../types';
import { formatDuration, getAppMeta } from '../utils/callManager';

interface FloatingCubeWidgetProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  callerName: string;
  voipApp: VoipApp;
  onPauseResume: () => void;
  onStopAndSave: () => void;
  onAddBookmark: () => void;
}

export const FloatingCubeWidget: React.FC<FloatingCubeWidgetProps> = ({
  isRecording,
  isPaused,
  duration,
  callerName,
  voipApp,
  onPauseResume,
  onStopAndSave,
  onAddBookmark,
}) => {
  const [minimized, setMinimized] = useState(false);
  const appMeta = getAppMeta(voipApp);

  if (!isRecording) return null;

  return (
    <div className="fixed bottom-24 right-5 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 text-white border-2 border-rose-500/50 shadow-2xl shadow-rose-950/50 rounded-2xl p-3 backdrop-blur-xl max-w-xs transition-all ring-4 ring-rose-500/10">
        {/* Header bar of floating widget */}
        <div className="flex items-center justify-between space-x-3 mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-rose-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
              C
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                Cube ACR Live
              </span>
            </div>
          </div>

          <button
            onClick={() => setMinimized(!minimized)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
            title={minimized ? 'Perluas widget' : 'Perkecil widget'}
            aria-label="Toggle widget size"
          >
            {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Content */}
        {!minimized ? (
          <div>
            <div className="flex items-center justify-between text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 mb-2.5">
              <div className="truncate max-w-[130px]">
                <p className="font-semibold text-slate-100 truncate">{callerName || 'Panggilan VoIP'}</p>
                <p className="text-[10px] text-slate-400 capitalize">{appMeta.name}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-rose-400">
                  {formatDuration(duration)}
                </span>
                <span className="block text-[9px] text-emerald-400 font-medium">MP3 192k</span>
              </div>
            </div>

            {/* Live Audio Visualizer Bars */}
            <div className="flex items-center justify-center space-x-1 h-5 mb-3 px-2 bg-slate-950/60 rounded-md">
              {[40, 75, 95, 60, 30, 85, 100, 70, 45, 90, 65, 35].map((height, i) => (
                <div
                  key={i}
                  className="w-1 bg-rose-500 rounded-full transition-all duration-150"
                  style={{
                    height: isPaused ? '4px' : `${Math.max(4, (height * (0.4 + Math.random() * 0.6)) / 3.5)}px`,
                    opacity: isPaused ? 0.3 : 0.9,
                  }}
                />
              ))}
            </div>

            {/* Control buttons */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-medium">
              <button
                onClick={onAddBookmark}
                className="flex flex-col items-center justify-center py-1.5 px-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition cursor-pointer"
                title="Tandai momen penting (Bookmark)"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                <span>Bookmark</span>
              </button>

              <button
                onClick={onPauseResume}
                className="flex flex-col items-center justify-center py-1.5 px-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition cursor-pointer"
                title={isPaused ? 'Lanjutkan perekaman' : 'Jeda perekaman'}
              >
                {isPaused ? (
                  <Play className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-slate-300 mb-0.5" />
                )}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={onStopAndSave}
                className="flex flex-col items-center justify-center py-1.5 px-1 bg-rose-600 hover:bg-rose-500 rounded-lg text-white font-semibold transition cursor-pointer shadow-sm shadow-rose-600/40"
                title="Hentikan dan simpan rekaman MP3"
              >
                <Square className="w-3.5 h-3.5 mb-0.5 fill-current" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-rose-400">
              {formatDuration(duration)}
            </span>
            <button
              onClick={onStopAndSave}
              className="p-1 bg-rose-600 hover:bg-rose-500 rounded text-white"
              title="Stop & Save MP3"
              aria-label="Stop and save"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

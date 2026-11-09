import React from 'react';
import { 
  Mic, 
  PhoneCall, 
  Cloud, 
  Settings as SettingsIcon, 
  HardDrive, 
  CheckCircle2, 
  Radio,
  ShieldCheck,
  MessageCircle
} from 'lucide-react';
import { AppSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  settings: AppSettings;
  storageFormatted: string;
  totalRecordsCount: number;
  pendingSyncCount: number;
  onOpenLiveRecorder: () => void;
  onOpenCallSimulator: () => void;
  onOpenCloudSync: () => void;
  onOpenSettings: () => void;
  onOpenPWAInstall: () => void;
  onOpenSetupGuide: () => void;
  onOpenWhatsAppFlow: () => void;
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  storageFormatted,
  totalRecordsCount,
  pendingSyncCount,
  onOpenLiveRecorder,
  onOpenCallSimulator,
  onOpenCloudSync,
  onOpenSettings,
  onOpenPWAInstall,
  onOpenSetupGuide,
  onOpenWhatsAppFlow,
  onToggleLanguage,
}) => {
  const isId = settings.language === 'id';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-indigo-600 shadow-md shadow-pink-500/20 text-white font-bold ring-2 ring-white/10">
              <span className="text-xl tracking-tighter">C</span>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Cube ACR
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded uppercase tracking-wider">
                  VoIP PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                {isId ? 'Perekam Panggilan Otomatis & Konversi MP3' : 'Automated VoIP Recorder & MP3 Cloud Sync'}
              </p>
            </div>
          </div>

          {/* Center Info Stats */}
          <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-300">
            {/* Storage stat */}
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-slate-400">{isId ? 'Lokal: ' : 'Storage: '}</span>
                <span className="font-semibold text-slate-200">{storageFormatted}</span>
                <span className="text-slate-500 text-[11px] ml-1">({totalRecordsCount} MP3)</span>
              </div>
            </div>

            {/* Cloud Sync status */}
            <button
              onClick={onOpenCloudSync}
              className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-750 px-3 py-1.5 rounded-lg border border-slate-700/60 transition cursor-pointer group"
              title={isId ? 'Buka Pengelola Sinkronisasi Cloud' : 'Open Cloud Sync Manager'}
            >
              <Cloud className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="font-medium text-slate-200 capitalize">
                    {settings.selectedCloudProvider}
                  </span>
                  {pendingSyncCount > 0 ? (
                    <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-300 text-[10px] rounded-full font-bold">
                      {pendingSyncCount} {isId ? 'tertunda' : 'pending'}
                    </span>
                  ) : (
                    <span className="flex items-center text-[10px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> {isId ? 'Sinkron' : 'Synced'}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* WhatsApp Call Flow Button (User requested flow) */}
            <button
              onClick={onOpenWhatsAppFlow}
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm shadow-emerald-600/30 transition cursor-pointer"
              title={isId ? 'Alur Perekaman WhatsApp Call Cube ACR' : 'WhatsApp Call Cube ACR Flow'}
            >
              <MessageCircle className="w-4 h-4 text-emerald-100" />
              <span>{isId ? 'WhatsApp Call' : 'WhatsApp Call'}</span>
            </button>

            {/* Setup & Helper Guide Button */}
            <button
              onClick={onOpenSetupGuide}
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              title={isId ? 'Panduan Setup & App Connector Helper' : 'Setup & App Connector Guide'}
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>{isId ? 'Setup & Helper' : 'Setup Guide'}</span>
            </button>

            {/* Call Simulator Button */}
            <button
              onClick={onOpenCallSimulator}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition cursor-pointer"
              title={isId ? 'Simulasi Panggilan Lain (Zoom, Teams, dll)' : 'Simulate Other Calls'}
            >
              <PhoneCall className="w-4 h-4 text-indigo-200" />
              <span>{isId ? 'VoIP Lain' : 'Other VoIP'}</span>
            </button>

            {/* Live Recording Button */}
            <button
              onClick={onOpenLiveRecorder}
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm shadow-rose-600/30 transition cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">{isId ? 'Rekam Mic' : 'Record'}</span>
            </button>

            {/* PWA Phone Install Button */}
            <PWAInstallButton
              onOpenModal={onOpenPWAInstall}
              language={settings.language}
              variant="header"
            />

            {/* Cloud Sync Icon Button */}
            <button
              onClick={onOpenCloudSync}
              className="relative p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
              title={isId ? 'Sinkronisasi Cloud' : 'Cloud Sync'}
              aria-label="Cloud Sync"
            >
              <Cloud className="w-4 h-4" />
              {pendingSyncCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLanguage}
              className="px-2.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
              title={isId ? 'Ganti ke Bahasa Inggris' : 'Switch to Indonesian'}
            >
              {settings.language.toUpperCase()}
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
              title={isId ? 'Pengaturan Perekaman & Audio' : 'Recording & Audio Settings'}
              aria-label="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

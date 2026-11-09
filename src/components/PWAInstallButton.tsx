import React from 'react';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenModal: () => void;
  language: 'id' | 'en';
  variant?: 'header' | 'hero' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenModal,
  language,
  variant = 'header',
}) => {
  const { isInstalled, isInstallable } = usePWAInstall();
  const isId = language === 'id';

  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-500/30">
          <CheckCircle2 className="w-4 h-4" />
          <span>{isId ? 'Cube ACR sudah tertanam di HP Anda' : 'Cube ACR is installed on your phone'}</span>
        </div>
      );
    }
    return null;
  }

  if (variant === 'header') {
    return (
      <button
        onClick={onOpenModal}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm shadow-emerald-700/30 transition cursor-pointer"
        title={isId ? 'Pasang aplikasi di HP Anda' : 'Install app on your phone'}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden md:inline">{isId ? 'Pasang di HP' : 'Install on Phone'}</span>
      </button>
    );
  }

  if (variant === 'settings') {
    return (
      <button
        onClick={onOpenModal}
        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
      >
        <Smartphone className="w-4 h-4" />
        <span>{isId ? 'Pasang & Tanamkan Aplikasi di HP' : 'Install & Embed App on Phone'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenModal}
      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center space-x-2"
    >
      <Download className="w-4 h-4" />
      <span>{isId ? 'Download & Pasang di HP' : 'Download & Install App'}</span>
    </button>
  );
};

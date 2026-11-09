import { CallRecord, VoipApp, Mp3QualityPreset, QualityPresetDetails, CloudProvider } from '../types';

export const QUALITY_PRESETS: Record<Mp3QualityPreset, QualityPresetDetails> = {
  low: {
    preset: 'low',
    name: 'Low (Space Saver)',
    nameId: 'Rendah (Hemat Memori)',
    bitrate: 96,
    sampleRate: 32000,
    approxSizePerMin: '~0.7 MB / min',
    description: 'Compact file size, ideal for long conversations and saving disk space.',
    descriptionId: 'Ukuran hemat, ideal untuk percakapan panjang dan menghemat memori.',
    tag: 'Low 96k',
  },
  medium: {
    preset: 'medium',
    name: 'Medium (Balanced - Default)',
    nameId: 'Sedang (Seimbang - Bawaan)',
    bitrate: 128,
    sampleRate: 44100,
    approxSizePerMin: '~0.95 MB / min',
    description: 'Optimal balance between audio clarity and file size. Recommended.',
    descriptionId: 'Keseimbangan optimal antara kejernihan suara dan ukuran berkas.',
    tag: 'Med 128k',
  },
  high: {
    preset: 'high',
    name: 'High Quality',
    nameId: 'Kualitas Tinggi',
    bitrate: 192,
    sampleRate: 44100,
    approxSizePerMin: '~1.44 MB / min',
    description: 'Crystal-clear speech clarity with defined high frequencies.',
    descriptionId: 'Suara VoIP jernih dengan vokal terdefinisi tajam.',
    tag: 'High 192k',
  },
  ultra: {
    preset: 'ultra',
    name: 'Ultra HD Studio',
    nameId: 'Ultra HD Studio',
    bitrate: 320,
    sampleRate: 48000,
    approxSizePerMin: '~2.4 MB / min',
    description: 'Maximum studio fidelity MP3 recording for professional archiving.',
    descriptionId: 'Kualitas fidelitas maksimal untuk arsip percakapan profesional.',
    tag: 'Ultra 320k',
  },
};

export const COMMON_TAGS = [
  { id: 'Work', labelId: 'Kerja', labelEn: 'Work', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'Personal', labelId: 'Pribadi', labelEn: 'Personal', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'Important', labelId: 'Penting', labelEn: 'Important', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'Meeting', labelId: 'Meeting', labelEn: 'Meeting', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'Family', labelId: 'Keluarga', labelEn: 'Family', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'VIP', labelId: 'Klien VIP', labelEn: 'VIP Client', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
];

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human-readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (isNaN(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Estimate MP3 file size based on bitrate and duration
 */
export function estimateMp3Size(durationSeconds: number, bitrateKbps: number): number {
  if (durationSeconds <= 0 || bitrateKbps <= 0) return 0;
  return Math.round(((bitrateKbps * 1000) / 8) * durationSeconds);
}

/**
 * Filter recordings by search query, app category, selected tags, starred, and sync status
 */
export function filterRecordings(
  recordings: CallRecord[],
  options: {
    query?: string;
    appFilter?: string; // 'all' | VoipApp | 'starred' | 'synced' | 'pending'
    selectedTag?: string; // e.g. 'Work', 'Personal', 'Important'
    sortBy?: 'date_desc' | 'date_asc' | 'duration_desc' | 'size_desc';
  }
): CallRecord[] {
  const { query = '', appFilter = 'all', selectedTag = '', sortBy = 'date_desc' } = options;
  const q = query.trim().toLowerCase();

  return recordings
    .filter((rec) => {
      // Query filter
      if (q) {
        const matchTitle = rec.title.toLowerCase().includes(q);
        const matchCaller = rec.callerName.toLowerCase().includes(q);
        const matchPhone = rec.phoneNumber.toLowerCase().includes(q);
        const matchNotes = rec.notes ? rec.notes.toLowerCase().includes(q) : false;
        const matchTags = rec.tags ? rec.tags.some((t) => t.toLowerCase().includes(q)) : false;
        if (!matchTitle && !matchCaller && !matchPhone && !matchNotes && !matchTags) {
          return false;
        }
      }

      // Tag filter
      if (selectedTag && selectedTag !== 'all') {
        const hasTag = rec.tags && rec.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // App category filter
      if (appFilter === 'starred') {
        return rec.isStarred;
      }
      if (appFilter === 'synced') {
        return rec.cloudSync.status === 'synced';
      }
      if (appFilter === 'pending') {
        return rec.cloudSync.status === 'pending';
      }
      if (appFilter !== 'all') {
        return rec.voipApp === appFilter;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return a.timestamp - b.timestamp;
        case 'duration_desc':
          return b.duration - a.duration;
        case 'size_desc':
          return b.fileSize - a.fileSize;
        case 'date_desc':
        default:
          return b.timestamp - a.timestamp;
      }
    });
}

/**
 * Calculate total storage used across recordings
 */
export function calculateStorageUsage(recordings: CallRecord[]): {
  totalBytes: number;
  formatted: string;
} {
  const totalBytes = recordings.reduce((acc, rec) => acc + (rec.fileSize || 0), 0);
  return {
    totalBytes,
    formatted: formatFileSize(totalBytes),
  };
}

/**
 * Calculate cloud synchronization statistics
 */
export function calculateSyncStats(recordings: CallRecord[]): {
  total: number;
  synced: number;
  pending: number;
  failed: number;
  percent: number;
} {
  const total = recordings.length;
  if (total === 0) {
    return { total: 0, synced: 0, pending: 0, failed: 0, percent: 100 };
  }
  const synced = recordings.filter((r) => r.cloudSync.status === 'synced').length;
  const pending = recordings.filter((r) => r.cloudSync.status === 'pending').length;
  const failed = recordings.filter((r) => r.cloudSync.status === 'failed').length;
  const percent = Math.round((synced / total) * 100);

  return { total, synced, pending, failed, percent };
}

/**
 * Information badges and themes for each VoIP app supported by Cube ACR
 */
export function getAppMeta(app: VoipApp): {
  name: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
} {
  switch (app) {
    case 'whatsapp':
      return {
        name: 'WhatsApp',
        badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
        badgeText: 'text-emerald-600',
        borderColor: 'border-emerald-500',
      };
    case 'telegram':
      return {
        name: 'Telegram',
        badgeBg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
        badgeText: 'text-sky-600',
        borderColor: 'border-sky-500',
      };
    case 'zoom':
      return {
        name: 'Zoom Meeting',
        badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
        badgeText: 'text-blue-600',
        borderColor: 'border-blue-500',
      };
    case 'skype':
      return {
        name: 'Skype',
        badgeBg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
        badgeText: 'text-cyan-600',
        borderColor: 'border-cyan-500',
      };
    case 'meet':
      return {
        name: 'Google Meet',
        badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
        badgeText: 'text-amber-600',
        borderColor: 'border-amber-500',
      };
    case 'phone':
    case 'cellular':
    default:
      return {
        name: 'Telepon Seluler',
        badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
        badgeText: 'text-indigo-600',
        borderColor: 'border-indigo-500',
      };
  }
}

/**
 * Format cloud providers into readable string
 */
export function formatCloudProviders(providers?: CloudProvider[]): string {
  if (!providers || providers.length === 0) return 'Cloud';
  const names: Record<CloudProvider, string> = {
    gdrive: 'Google Drive',
    dropbox: 'Dropbox',
    onedrive: 'OneDrive',
    webdav: 'WebDAV',
  };
  return providers.map((p) => names[p] || p).join(', ');
}

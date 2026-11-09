import { CallRecord, AppSettings } from '../types';
import { generateSyntheticCallAudio, encodeAudioBufferToMp3 } from './audioEncoder';

const DB_NAME = 'CubeACR_Database_v1';
const STORE_RECORDINGS = 'recordings';
const SETTINGS_KEY = 'cube_acr_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  autoSaveToDisk: true,
  qualityPreset: 'medium', // Default is balance between quality and size
  audioBitrate: 128,
  audioSampleRate: 44100,
  audioBoostGain: 1.5,
  autoSyncCloud: true,
  selectedCloudProvider: 'gdrive',
  connectedClouds: {
    gdrive: true,
    dropbox: false,
    onedrive: false,
    webdav: false,
  },
  multiCloudSync: false,
  cloudSyncOnWifiOnly: true,
  cloudFolder: '/CubeACR_VoIP_Recordings',
  noiseSuppression: true,
  echoCancellation: true,
  language: 'id',
  showFloatingWidget: true,
  appConnectorEnabled: true,
  overlayPermissionGranted: true,
  micPermissionGranted: true,
  notificationPermissionGranted: true,
  batteryOptimizationIgnored: true,
  hasCompletedOnboarding: false,
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_RECORDINGS)) {
        db.createObjectStore(STORE_RECORDINGS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredRecordings(): Promise<CallRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDINGS, 'readonly');
    const store = tx.objectStore(STORE_RECORDINGS);
    const request = store.getAll();

    request.onsuccess = () => {
      const results: CallRecord[] = request.result || [];
      // Re-create object URLs for blobs if needed
      const mapped = results.map(rec => {
        if (rec.mp3Blob && (!rec.mp3Url || rec.mp3Url.startsWith('blob:'))) {
          try {
            return {
              ...rec,
              mp3Url: URL.createObjectURL(rec.mp3Blob),
            };
          } catch {
            return rec;
          }
        }
        return rec;
      });
      resolve(mapped);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecord(record: CallRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDINGS, 'readwrite');
    const store = tx.objectStore(STORE_RECORDINGS);
    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDINGS, 'readwrite');
    const store = tx.objectStore(STORE_RECORDINGS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings to localStorage:', err);
  }
}

/**
 * Seeds initial demo recordings with real synthesized MP3 audio so the app
 * is immediately fully usable and enjoyable upon launch.
 */
export async function seedInitialDemoRecordings(): Promise<CallRecord[]> {
  const existing = await getStoredRecordings();
  if (existing.length > 0) {
    return existing;
  }

  // Create real audio blobs for demo records
  const sample1Audio = generateSyntheticCallAudio(14, 44100, 'whatsapp');
  const sample1Blob = encodeAudioBufferToMp3(sample1Audio, 192);

  const sample2Audio = generateSyntheticCallAudio(22, 44100, 'zoom');
  const sample2Blob = encodeAudioBufferToMp3(sample2Audio, 192);

  const sample3Audio = generateSyntheticCallAudio(8, 44100, 'telegram');
  const sample3Blob = encodeAudioBufferToMp3(sample3Audio, 192);

  const initialRecords: CallRecord[] = [
    {
      id: 'cube_demo_01',
      title: 'WhatsApp VoIP - Budi Prasetyo (Kantor)',
      callerName: 'Budi Prasetyo',
      phoneNumber: '+62 812-9842-1102',
      voipApp: 'whatsapp',
      direction: 'incoming',
      timestamp: Date.now() - 1000 * 60 * 35, // 35 mins ago
      duration: 14,
      mp3Blob: sample1Blob,
      mp3Url: URL.createObjectURL(sample1Blob),
      fileSize: sample1Blob.size,
      bitrate: 128,
      sampleRate: 44100,
      qualityPreset: 'medium',
      isStarred: true,
      notes: 'Konfirmasi deadline revisi modul pembayaran dan sinkronisasi cloud.',
      tags: ['Work', 'Important'],
      bookmarks: [
        { id: 'bm1', time: 4, label: 'Jadwal deployment ke production' },
        { id: 'bm2', time: 10, label: 'Persetujuan anggaran' },
      ],
      cloudSync: {
        status: 'synced',
        provider: 'gdrive',
        syncedProviders: ['gdrive'],
        lastSyncedAt: Date.now() - 1000 * 60 * 34,
        cloudFileId: 'gdrive_cube_01_a9b8',
        cloudUrl: 'https://drive.google.com/file/d/cube_01_demo',
      },
      locationTag: 'Jakarta Selatan, ID',
    },
    {
      id: 'cube_demo_02',
      title: 'Zoom Meeting - Standup Teknis Mingguan',
      callerName: 'Sarah Amanda & Tim Core',
      phoneNumber: 'ID: 894 1224 5510',
      voipApp: 'zoom',
      direction: 'outgoing',
      timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
      duration: 22,
      mp3Blob: sample2Blob,
      mp3Url: URL.createObjectURL(sample2Blob),
      fileSize: sample2Blob.size,
      bitrate: 192,
      sampleRate: 44100,
      qualityPreset: 'high',
      isStarred: true,
      notes: 'Review arsitektur mikroservis VoIP streaming & enkripsi audio lokal.',
      tags: ['Work', 'Meeting'],
      bookmarks: [
        { id: 'bm3', time: 8, label: 'Optimalisasi bitrate audio' },
      ],
      cloudSync: {
        status: 'synced',
        provider: 'onedrive',
        syncedProviders: ['onedrive', 'gdrive'],
        lastSyncedAt: Date.now() - 1000 * 60 * 60 * 3,
        cloudFileId: 'onedrive_cube_02_x41',
        cloudUrl: 'https://onedrive.live.com/?id=cube_02_demo',
      },
      locationTag: 'Bandung Digital Valley, ID',
    },
    {
      id: 'cube_demo_03',
      title: 'Telegram Voice - Dr. Kevin Wijaya',
      callerName: 'Dr. Kevin Wijaya',
      phoneNumber: '@drkevin_consultant',
      voipApp: 'telegram',
      direction: 'incoming',
      timestamp: Date.now() - 1000 * 60 * 60 * 26, // yesterday
      duration: 8,
      mp3Blob: sample3Blob,
      mp3Url: URL.createObjectURL(sample3Blob),
      fileSize: sample3Blob.size,
      bitrate: 128,
      sampleRate: 44100,
      qualityPreset: 'medium',
      isStarred: false,
      notes: 'Konsultasi keamanan VoIP dan kebijakan penyimpanan otomatis di perangkat.',
      tags: ['Personal'],
      bookmarks: [],
      cloudSync: {
        status: 'pending',
        provider: 'gdrive',
        syncedProviders: [],
      },
      locationTag: 'Surabaya, ID',
    },
  ];

  for (const rec of initialRecords) {
    await saveRecord(rec);
  }

  return initialRecords;
}

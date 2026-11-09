export type VoipApp = 'whatsapp' | 'telegram' | 'zoom' | 'skype' | 'phone' | 'meet' | 'cellular';
export type CallDirection = 'incoming' | 'outgoing';
export type CloudProvider = 'gdrive' | 'dropbox' | 'onedrive' | 'webdav';
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed';

export type Mp3QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface QualityPresetDetails {
  preset: Mp3QualityPreset;
  name: string;
  nameId: string;
  bitrate: 96 | 128 | 192 | 320;
  sampleRate: 32000 | 44100 | 48000;
  approxSizePerMin: string;
  description: string;
  descriptionId: string;
  tag: string;
}

export interface CallBookmark {
  id: string;
  time: number; // in seconds
  label: string;
}

export interface CallRecord {
  id: string;
  title: string;
  callerName: string;
  phoneNumber: string;
  voipApp: VoipApp;
  direction: CallDirection;
  timestamp: number;
  duration: number; // in seconds
  mp3Blob?: Blob;
  mp3Url: string;
  fileSize: number; // in bytes
  bitrate: number;
  sampleRate: number;
  qualityPreset?: Mp3QualityPreset;
  isStarred: boolean;
  notes: string;
  tags: string[]; // e.g. ['Work', 'Personal', 'Important']
  bookmarks: CallBookmark[];
  cloudSync: {
    status: SyncStatus;
    provider?: CloudProvider;
    syncedProviders?: CloudProvider[];
    lastSyncedAt?: number;
    cloudFileId?: string;
    cloudUrl?: string;
  };
  locationTag?: string;
}

export interface ConnectedCloudAccount {
  provider: CloudProvider;
  name: string;
  accountEmail: string;
  isConnected: boolean;
  storageUsed: string;
  storageTotal: string;
  autoSyncEnabled: boolean;
  lastSyncTimestamp?: number;
}

export interface AppSettings {
  autoSaveToDisk: boolean;
  qualityPreset: Mp3QualityPreset;
  audioBitrate: 96 | 128 | 192 | 320;
  audioSampleRate: number;
  audioBoostGain: number; // 1.0 to 3.0
  autoSyncCloud: boolean;
  selectedCloudProvider: CloudProvider;
  connectedClouds: Record<CloudProvider, boolean>;
  multiCloudSync: boolean; // Sync to all connected clouds simultaneously
  cloudSyncOnWifiOnly: boolean;
  cloudFolder: string;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  language: 'id' | 'en';
  showFloatingWidget: boolean;
  appConnectorEnabled?: boolean;
  overlayPermissionGranted?: boolean;
  micPermissionGranted?: boolean;
  notificationPermissionGranted?: boolean;
  batteryOptimizationIgnored?: boolean;
  hasCompletedOnboarding?: boolean;
}

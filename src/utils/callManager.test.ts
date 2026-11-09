import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDuration,
  formatFileSize,
  estimateMp3Size,
  filterRecordings,
  calculateStorageUsage,
  calculateSyncStats,
  getAppMeta,
  QUALITY_PRESETS,
  formatCloudProviders,
} from './callManager';
import { CallRecord } from '../types';

test('QUALITY_PRESETS has low, medium, high, ultra with balanced medium default', () => {
  assert.equal(QUALITY_PRESETS.medium.bitrate, 128);
  assert.equal(QUALITY_PRESETS.low.bitrate, 96);
  assert.equal(QUALITY_PRESETS.high.bitrate, 192);
  assert.equal(QUALITY_PRESETS.ultra.bitrate, 320);
});

test('formatCloudProviders joins multiple cloud services into readable string', () => {
  assert.equal(formatCloudProviders(['gdrive', 'dropbox']), 'Google Drive, Dropbox');
  assert.equal(formatCloudProviders([]), 'Cloud');
});

test('filterRecordings supports tag filtering (Work, Personal, Important)', () => {
  const sampleRecords: CallRecord[] = [
    {
      id: '1',
      title: 'Meeting Proyek',
      callerName: 'Budi Santoso',
      phoneNumber: '123',
      voipApp: 'whatsapp',
      direction: 'incoming',
      timestamp: 1000,
      duration: 60,
      mp3Url: '',
      fileSize: 1000,
      bitrate: 128,
      sampleRate: 44100,
      isStarred: false,
      notes: '',
      tags: ['Work', 'Important'],
      bookmarks: [],
      cloudSync: { status: 'synced', provider: 'gdrive' },
    },
    {
      id: '2',
      title: 'Obrolan Santai',
      callerName: 'Sarah Jenkins',
      phoneNumber: '456',
      voipApp: 'telegram',
      direction: 'outgoing',
      timestamp: 2000,
      duration: 120,
      mp3Url: '',
      fileSize: 2000,
      bitrate: 128,
      sampleRate: 44100,
      isStarred: false,
      notes: '',
      tags: ['Personal'],
      bookmarks: [],
      cloudSync: { status: 'pending' },
    },
  ];

  const workRecords = filterRecordings(sampleRecords, { selectedTag: 'Work' });
  assert.equal(workRecords.length, 1);
  assert.equal(workRecords[0].id, '1');

  const personalRecords = filterRecordings(sampleRecords, { selectedTag: 'Personal' });
  assert.equal(personalRecords.length, 1);
  assert.equal(personalRecords[0].id, '2');

  const importantRecords = filterRecordings(sampleRecords, { selectedTag: 'Important' });
  assert.equal(importantRecords.length, 1);
  assert.equal(importantRecords[0].id, '1');
});

test('getAppMeta returns proper metadata for whatsapp and phone', () => {
  const waMeta = getAppMeta('whatsapp');
  assert.equal(waMeta.name, 'WhatsApp');
  assert.equal(waMeta.borderColor, 'border-emerald-500');

  const phoneMeta = getAppMeta('phone');
  assert.equal(phoneMeta.name, 'Telepon Seluler');
});

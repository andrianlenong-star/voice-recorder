import JSZip from 'jszip';
import { CallRecord } from '../types';
import { triggerLocalDownload, generateRecordingFilename } from './audioEncoder';

/**
 * Packages all call records and their MP3 audio blobs into a single ZIP archive
 */
export async function exportRecordingsToZip(recordings: CallRecord[]): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('CubeACR_VoIP_MP3s');

  const summary = recordings.map((r) => ({
    id: r.id,
    title: r.title,
    caller: r.callerName,
    phone: r.phoneNumber,
    app: r.voipApp,
    direction: r.direction,
    date: new Date(r.timestamp).toISOString(),
    durationSeconds: r.duration,
    bitrateKbps: r.bitrate,
    fileSizeBytes: r.fileSize,
    bookmarks: r.bookmarks,
    notes: r.notes,
    cloudSync: r.cloudSync,
  }));

  zip.file('cube_acr_call_index.json', JSON.stringify(summary, null, 2));

  for (const rec of recordings) {
    const filename = generateRecordingFilename(rec.voipApp, rec.callerName, rec.timestamp);
    if (rec.mp3Blob) {
      folder?.file(filename, rec.mp3Blob);
    } else if (rec.mp3Url) {
      try {
        const resp = await fetch(rec.mp3Url);
        const blob = await resp.blob();
        folder?.file(filename, blob);
      } catch (err) {
        console.warn('Could not fetch blob for zip:', err);
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  triggerLocalDownload(content, `CubeACR_Backup_${Date.now()}.zip`);
}

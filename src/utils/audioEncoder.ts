import { Mp3Encoder } from './lameBundle';

/**
 * Convert Float32Array PCM audio samples to 16-bit PCM Int16Array
 */
export function floatTo16BitPCM(input: Float32Array, gainMultiplier: number = 1.0): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    let s = input[i] * gainMultiplier;
    // Hard clip protection
    s = Math.max(-1, Math.min(1, s));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

/**
 * Encode an AudioBuffer directly to an MP3 Blob using lamejs
 */
export function encodeAudioBufferToMp3(
  audioBuffer: AudioBuffer,
  bitrateKbps: 96 | 128 | 192 | 320 = 128,
  gainMultiplier: number = 1.0
): Blob {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mp3encoder = new (Mp3Encoder as any)(channels > 1 ? 2 : 1, sampleRate, bitrateKbps);
  const mp3Data: Uint8Array[] = [];

  const sampleBlockSize = 1152; // LAME standard block size
  const leftFloat = audioBuffer.getChannelData(0);
  const rightFloat = channels > 1 ? audioBuffer.getChannelData(1) : leftFloat;

  const leftPcm = floatTo16BitPCM(leftFloat, gainMultiplier);
  const rightPcm = channels > 1 ? floatTo16BitPCM(rightFloat, gainMultiplier) : undefined;

  for (let i = 0; i < leftPcm.length; i += sampleBlockSize) {
    const leftChunk = leftPcm.subarray(i, i + sampleBlockSize);
    let mp3buf: Int8Array;
    if (channels > 1 && rightPcm) {
      const rightChunk = rightPcm.subarray(i, i + sampleBlockSize);
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf.buffer, mp3buf.byteOffset, mp3buf.length));
    }
  }

  const endBuf = mp3encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(new Uint8Array(endBuf.buffer, endBuf.byteOffset, endBuf.length));
  }

  return new Blob(mp3Data as unknown as BlobPart[], { type: 'audio/mp3' });
}

/**
 * Synthesizes a realistic VoIP call audio buffer with conversation cadence,
 * background ambience and speech waveforms for simulated calls or mock VoIP capture.
 */
export function generateSyntheticCallAudio(
  durationSeconds: number,
  sampleRate: number = 44100,
  voipType: string = 'whatsapp'
): AudioBuffer {
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const frameCount = Math.max(sampleRate, Math.floor(sampleRate * durationSeconds));
  const audioBuffer = audioCtx.createBuffer(1, frameCount, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Generate realistic VoIP voice cadence
  // Alternating speakers every 3 to 6 seconds with natural pauses and VoIP comfort noise
  const baseFreqCaller = voipType === 'whatsapp' ? 190 : 160;
  const baseFreqCallee = 240;

  for (let i = 0; i < frameCount; i++) {
    const t = i / sampleRate;
    const turnPeriod = 5.0; // 5 seconds per turn
    const phase = t % turnPeriod;
    const isCallerSpeaking = phase < 2.2;
    const isCalleeSpeaking = phase >= 2.6 && phase < 4.6;

    let sample = 0;

    if (isCallerSpeaking) {
      // Natural formant frequencies
      const f0 = baseFreqCaller + Math.sin(t * 8) * 15;
      const f1 = f0 * 2.1;
      const f2 = f0 * 3.4;
      const envelope = Math.sin((phase / 2.2) * Math.PI) * (0.6 + 0.4 * Math.sin(t * 12));
      sample = (
        Math.sin(2 * Math.PI * f0 * t) * 0.45 +
        Math.sin(2 * Math.PI * f1 * t) * 0.25 +
        Math.sin(2 * Math.PI * f2 * t) * 0.15
      ) * envelope;
    } else if (isCalleeSpeaking) {
      const f0 = baseFreqCallee + Math.sin(t * 9) * 20;
      const f1 = f0 * 1.9;
      const f2 = f0 * 3.2;
      const subPhase = phase - 2.6;
      const envelope = Math.sin((subPhase / 2.0) * Math.PI) * (0.6 + 0.4 * Math.sin(t * 14));
      sample = (
        Math.sin(2 * Math.PI * f0 * t) * 0.4 +
        Math.sin(2 * Math.PI * f1 * t) * 0.25 +
        Math.sin(2 * Math.PI * f2 * t) * 0.15
      ) * envelope;
    }

    // VoIP line codec comfort noise / subtle warmth
    const pinkNoise = (Math.random() * 2 - 1) * 0.015;
    channelData[i] = sample * 0.7 + pinkNoise;
  }

  return audioBuffer;
}

/**
 * Triggers automatic browser file download directly to the user's local disk
 */
export function triggerLocalDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Format timestamp into standard Cube ACR filename
 * Example: CubeACR_WhatsApp_BudiSantoso_20261109_124500.mp3
 */
export function generateRecordingFilename(
  app: string,
  callerName: string,
  timestamp: number = Date.now()
): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  const secs = d.getSeconds().toString().padStart(2, '0');

  const cleanCaller = callerName.replace(/[^a-zA-Z0-9]/g, '');
  const cleanApp = app.toUpperCase();

  return `CubeACR_${cleanApp}_${cleanCaller || 'VoipCall'}_${year}${month}${day}_${hours}${mins}${secs}.mp3`;
}

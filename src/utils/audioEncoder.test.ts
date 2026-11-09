import test from 'node:test';
import assert from 'node:assert/strict';
import { floatTo16BitPCM, generateRecordingFilename } from './audioEncoder';

test('floatTo16BitPCM converts normalized floats to Int16 bounds', () => {
  const floats = new Float32Array([-1.0, 0.0, 1.0, 1.5, -1.5]);
  const pcm = floatTo16BitPCM(floats, 1.0);

  assert.equal(pcm[0], -32768);
  assert.equal(pcm[1], 0);
  assert.equal(pcm[2], 32767);
  // clipping test
  assert.equal(pcm[3], 32767);
  assert.equal(pcm[4], -32768);
});

test('floatTo16BitPCM applies audio gain booster correctly', () => {
  const floats = new Float32Array([0.25]);
  const pcmNormal = floatTo16BitPCM(floats, 1.0);
  const pcmBoosted = floatTo16BitPCM(floats, 2.0);

  assert.ok(pcmBoosted[0] > pcmNormal[0]);
});

test('generateRecordingFilename outputs valid Cube ACR standard format', () => {
  const ts = new Date('2026-11-09T14:30:00').getTime();
  const filename = generateRecordingFilename('whatsapp', 'Budi Santoso', ts);
  assert.ok(filename.startsWith('CubeACR_WHATSAPP_BudiSantoso_'));
  assert.ok(filename.endsWith('.mp3'));
});

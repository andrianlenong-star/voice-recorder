export class Mp3Encoder {
  constructor(channels: number, samplerate: number, kbps: number);
  encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
  flush(): Int8Array;
}

export class WavHeader {
  static readHeader(dataView: DataView): {
    channels: number;
    sampleRate: number;
  };
}

declare const lamejs: {
  Mp3Encoder: typeof Mp3Encoder;
  WavHeader: typeof WavHeader;
};

export default lamejs;

import { renderAudio, toAudioBuffer } from './audioProcessing';

const WAV_HEADER_LENGTH_BYTES = 44 as const;
const BYTES_PER_SAMPLE = 2 as const;
const RIFF_FILE_MAX_BYTES = 4294967295 as const;

const HEADER = {
  AUDIO_FORMAT: { offset: 20, value: 1 }, // PCM = 1
  BITS_PER_SAMPLE: { offset: 34, value: BYTES_PER_SAMPLE * 8 }, // 16 bits encoding
  BLOCK_ALIGN: { offset: 32 },
  BYTE_RATE: { offset: 28 },
  CHANNEL_COUNT: { offset: 22 }, // 1 - mono, 2 - stereo
  CHUNK_ID: { offset: 0, value: 0x52494646 }, // hex representation of string "RIFF" (Resource Interchange File Format) - identifies the file structure that defines a class of more specific file formats, e.g. WAVE
  CHUNK_SIZE: { offset: 4 },
  FILE_FORMAT: { offset: 8, value: 0x57415645 }, // hex representation of string "WAVE"
  SAMPLE_RATE: { offset: 24 },
  SUBCHUNK1_ID: { offset: 12, value: 0x666d7420 }, // hex representation of string "fmt " - identifies the start of "format" section of the header
  SUBCHUNK1_SIZE: { offset: 16, value: 16 }, // Subchunk1 Size without SUBCHUNK1_ID and SUBCHUNK1_SIZE fields
  SUBCHUNK2_ID: { offset: 36, value: 0x64617461 }, // hex representation of string "data" - identifies the start of actual audio data section
  SUBCHUNK2_SIZE: { offset: 40 }, // actual audio data size
} as const;

const fourCharsToInt = (chars: string) =>
  (chars.charCodeAt(0) << 24) |
  (chars.charCodeAt(1) << 16) |
  (chars.charCodeAt(2) << 8) |
  chars.charCodeAt(3);

const WAV_HEADER_FLAGS = {
  data: fourCharsToInt('data'),
  fmt: fourCharsToInt('fmt '),
  RIFF: fourCharsToInt('RIFF'),
  WAVE: fourCharsToInt('WAVE'),
};

type WriteWaveHeaderParams = {
  arrayBuffer: ArrayBuffer;
  // 1 - mono, 2 - stereo
  channelCount: number;
  // Number of samples per second, e.g. 44100Hz
  sampleRate: number;
};
const writeWavHeader = ({
  arrayBuffer,
  channelCount,
  sampleRate,
}: WriteWaveHeaderParams) => {
  const byteRate = sampleRate * channelCount * BYTES_PER_SAMPLE; // bytes/sec
  const blockAlign = channelCount * BYTES_PER_SAMPLE;

  const dataView = new DataView(arrayBuffer);
  /*
   * The maximum size of a RIFF file is 4294967295 bytes and since the header takes up 44 bytes there are 4294967251 bytes left for the
   * data chunk.
   */
  const dataChunkSize = Math.min(
    dataView.byteLength - WAV_HEADER_LENGTH_BYTES,
    RIFF_FILE_MAX_BYTES - WAV_HEADER_LENGTH_BYTES,
  );

  dataView.setUint32(HEADER.CHUNK_ID.offset, HEADER.CHUNK_ID.value); // "RIFF"
  dataView.setUint32(HEADER.CHUNK_SIZE.offset, arrayBuffer.byteLength - 8, true); // adjustment for the first two headers - chunk id + file size
  dataView.setUint32(HEADER.FILE_FORMAT.offset, HEADER.FILE_FORMAT.value); // "WAVE"

  dataView.setUint32(HEADER.SUBCHUNK1_ID.offset, HEADER.SUBCHUNK1_ID.value); // "fmt "
  dataView.setUint32(HEADER.SUBCHUNK1_SIZE.offset, HEADER.SUBCHUNK1_SIZE.value, true);
  dataView.setUint16(HEADER.AUDIO_FORMAT.offset, HEADER.AUDIO_FORMAT.value, true);
  dataView.setUint16(HEADER.CHANNEL_COUNT.offset, channelCount, true);
  dataView.setUint32(HEADER.SAMPLE_RATE.offset, sampleRate, true);
  dataView.setUint32(HEADER.BYTE_RATE.offset, byteRate, true);
  dataView.setUint16(HEADER.BLOCK_ALIGN.offset, blockAlign, true);
  dataView.setUint16(HEADER.BITS_PER_SAMPLE.offset, HEADER.BITS_PER_SAMPLE.value, true);

  dataView.setUint32(HEADER.SUBCHUNK2_ID.offset, HEADER.SUBCHUNK2_ID.value); // "data"
  dataView.setUint32(HEADER.SUBCHUNK2_SIZE.offset, dataChunkSize, true);
};

export const readWavHeader = (dataView: DataView) => {
  const header = dataView.getUint32(0, false);
  if (WAV_HEADER_FLAGS.RIFF !== header) {
    console.error('Missing RIFF header in WAVE file');
    return;
  }
  if (WAV_HEADER_FLAGS.WAVE !== dataView.getUint32(HEADER.FILE_FORMAT.offset, false)) {
    console.error('Missing WAVE header in WAVE file');
    return;
  }
  if (WAV_HEADER_FLAGS.fmt !== dataView.getUint32(HEADER.SUBCHUNK1_ID.offset, false)) {
    console.error('Missing fmt header in WAVE file');
    return;
  }

  return {
    audioDataSizeBytes: dataView.getUint32(HEADER.SUBCHUNK2_SIZE.offset, true),
    audioDataStartOffset: WAV_HEADER_LENGTH_BYTES,
    channelCount: dataView.getUint16(HEADER.CHANNEL_COUNT.offset, true),
    sampleRate: dataView.getUint32(HEADER.SAMPLE_RATE.offset, true),
  };
};

const splitDataByChannel = (audioBuffer: AudioBuffer) =>
  Array.from({ length: audioBuffer.numberOfChannels }, (_, i) =>
    audioBuffer.getChannelData(i),
  );

type WriteAudioDataParams = {
  arrayBuffer: ArrayBuffer;
  dataByChannel: Float32Array[];
};

/**
 * In a WAV file, samples for each channel are usually interleaved, meaning samples from each channel are grouped together sequentially.
 * For example, in a stereo audio file (2 channels), samples alternate between the left and right channels.
 * @param arrayBuffer
 * @param dataByChannel
 */
const writeWavAudioData = ({ arrayBuffer, dataByChannel }: WriteAudioDataParams) => {
  const dataView = new DataView(arrayBuffer);
  const channelCount = dataByChannel.length;

  dataByChannel.forEach((channelData, channelIndex) => {
    let writeOffset = WAV_HEADER_LENGTH_BYTES + channelCount * channelIndex;

    channelData.forEach((float32Value) => {
      dataView.setInt16(
        writeOffset,
        float32Value < 0
          ? Math.max(-1, float32Value) * 32768
          : Math.min(1, float32Value) * 32767,
        true,
      );
      writeOffset += channelCount * BYTES_PER_SAMPLE;
    });
  });
};

export const encodeToWaw = async (file: File, sampleRate: number) => {
  const audioBuffer = await renderAudio(await toAudioBuffer(file), sampleRate);
  const numberOfSamples = audioBuffer.duration * sampleRate;
  const fileSizeBytes =
    numberOfSamples * audioBuffer.numberOfChannels * BYTES_PER_SAMPLE +
    WAV_HEADER_LENGTH_BYTES;

  const arrayBuffer = new ArrayBuffer(fileSizeBytes);
  writeWavHeader({ arrayBuffer, channelCount: audioBuffer.numberOfChannels, sampleRate });
  writeWavAudioData({ arrayBuffer, dataByChannel: splitDataByChannel(audioBuffer) });
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

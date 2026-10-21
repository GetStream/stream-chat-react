import { encodeToWav } from '../wav';
import { renderAudio, toAudioBuffer } from '../audioProcessing';

vi.mock('../audioProcessing', () => ({
  renderAudio: vi.fn(),
  toAudioBuffer: vi.fn(),
}));

const WAV_HEADER_LENGTH_BYTES = 44;
const BYTES_PER_SAMPLE = 2;

const fakeAudioBuffer = (dataByChannel: number[][], sampleRate: number) =>
  ({
    duration: dataByChannel[0].length / sampleRate,
    getChannelData: (channel: number) => Float32Array.from(dataByChannel[channel]),
    numberOfChannels: dataByChannel.length,
  }) as unknown as AudioBuffer;

const readBlob = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });

const readSamples = (buffer: ArrayBuffer) => {
  const view = new DataView(buffer);
  const samples: number[] = [];
  for (
    let offset = WAV_HEADER_LENGTH_BYTES;
    offset < buffer.byteLength;
    offset += BYTES_PER_SAMPLE
  ) {
    samples.push(view.getInt16(offset, true));
  }
  return samples;
};

describe('encodeToWav', () => {
  it.each([
    ['mono', [[0.5, -0.5]]],
    [
      'stereo',
      [
        [0.5, -0.5],
        [1, -1],
      ],
    ],
    [
      'three channels',
      [
        [0.5, -0.5],
        [1, -1],
        [0.25, -0.25],
      ],
    ],
  ])('interleaves %s samples one frame at a time', async (_, dataByChannel) => {
    const sampleRate = 2;
    vi.mocked(toAudioBuffer).mockResolvedValue({} as AudioBuffer);
    vi.mocked(renderAudio).mockResolvedValue(fakeAudioBuffer(dataByChannel, sampleRate));

    const blob = await encodeToWav(new File([], 'recording.webm'), sampleRate);
    const samples = readSamples(await readBlob(blob));

    const toInt16 = (value: number) =>
      value < 0 ? Math.max(-1, value) * 32768 : Math.min(1, value) * 32767;
    const frameCount = dataByChannel[0].length;
    const expected = Array.from({ length: frameCount }, (__, frame) =>
      dataByChannel.map((channel) => Math.trunc(toInt16(channel[frame]))),
    ).flat();

    expect(samples).toEqual(expected);
  });
});

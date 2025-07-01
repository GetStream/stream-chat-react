import {
  renderAudio,
  toAudioBuffer,
} from '../../components/MediaRecorder/transcode/audioProcessing';

const ENCODING_BIT_RATE = 128; // kbps;
const COUNT_SAMPLES_PER_ENCODED_BLOCK = 1152;

const float32ArrayToInt16Array = (float32Arr: Float32Array) => {
  const int16Arr = new Int16Array(float32Arr.length);
  for (let i = 0; i < float32Arr.length; i++) {
    const float32Value = float32Arr[i];
    // Clamp the float value between -1 and 1
    const clampedValue = Math.max(-1, Math.min(1, float32Value));
    // Convert the float value to a signed 16-bit integer
    int16Arr[i] = Math.round(clampedValue * 32767);
  }
  return int16Arr;
};

const splitDataByChannel = (audioBuffer: AudioBuffer) =>
  Array.from({ length: audioBuffer.numberOfChannels }, (_, i) =>
    audioBuffer.getChannelData(i),
  ).map(float32ArrayToInt16Array);

export async function encodeToMp3(file: File, sampleRate: number) {
  const lameJs = await import('@breezystack/lamejs');
  const audioBuffer = await renderAudio(await toAudioBuffer(file), sampleRate);
  const channelCount = audioBuffer.numberOfChannels;
  const dataByChannel = splitDataByChannel(audioBuffer);
  const mp3Encoder = new lameJs.Mp3Encoder(channelCount, sampleRate, ENCODING_BIT_RATE);

  const dataBuffer: Int8Array[] = [];
  let remaining = dataByChannel[0].length;
  for (
    let i = 0;
    remaining >= COUNT_SAMPLES_PER_ENCODED_BLOCK;
    i += COUNT_SAMPLES_PER_ENCODED_BLOCK
  ) {
    const [leftChannelBlock, rightChannelBlock] = dataByChannel.map((channel) =>
      channel.subarray(i, i + COUNT_SAMPLES_PER_ENCODED_BLOCK),
    );
    dataBuffer.push(
      new Int8Array(mp3Encoder.encodeBuffer(leftChannelBlock, rightChannelBlock)),
    );
    remaining -= COUNT_SAMPLES_PER_ENCODED_BLOCK;
  }

  const lastBlock = mp3Encoder.flush();
  if (lastBlock.length) dataBuffer.push(new Int8Array(lastBlock));
  return new Blob(dataBuffer, { type: 'audio/mp3;sbu_type=voice' });
}

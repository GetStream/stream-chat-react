import { readFileAsArrayBuffer } from '../../ReactFileUtilities';

/**
 * Decodes an audio file into an `AudioBuffer` and closes the `AudioContext` it used.
 * @param file - Audio file to decode.
 */
export const toAudioBuffer = async (file: File) => {
  const audioCtx = new AudioContext();

  const arrayBuffer = await readFileAsArrayBuffer(file);
  const decodedData = await audioCtx.decodeAudioData(arrayBuffer);
  if (audioCtx.state !== 'closed') await audioCtx.close();
  return decodedData;
};

/**
 * Resamples a decoded `AudioBuffer` with an `OfflineAudioContext`, which renders without playback.
 * @param audioBuffer - Decoded audio to resample.
 * @param sampleRate - Target sample rate in Hz.
 */
export const renderAudio = async (audioBuffer: AudioBuffer, sampleRate: number) => {
  const offlineAudioCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.duration * sampleRate,
    sampleRate,
  );
  const source = offlineAudioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineAudioCtx.destination);
  source.start();

  return await offlineAudioCtx.startRendering();
};

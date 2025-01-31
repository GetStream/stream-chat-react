import { BehaviorSubject } from '../observable/BehaviorSubject';
import { Subject } from '../observable/Subject';
import { mergeDeepUndefined } from '../../../utils/mergeDeep';

const MAX_FREQUENCY_AMPLITUDE = 255 as const;

const logError = (e?: Error) => e && console.error('[AMPLITUDE RECORDER ERROR]', e);

const rootMeanSquare = (values: Uint8Array) =>
  Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val, 2), 0) / values.length);

/**
 * fftSize
 * An unsigned integer, representing the window size of the FFT, given in number of samples.
 * A higher value will result in more details in the frequency domain but fewer details
 * in the amplitude domain.
 *
 * Must be a power of 2 between 2^5 and 2^15, so one of: 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, and 32768.
 * Defaults to 32.
 *
 * maxDecibels
 * A double, representing the maximum decibel value for scaling the FFT analysis data,
 * where 0 dB is the loudest possible sound, -10 dB is a 10th of that, etc.
 * The default value is -30 dB.
 *
 * minDecibels
 * A double, representing the minimum decibel value for scaling the FFT analysis data,
 * where 0 dB is the loudest possible sound, -10 dB is a 10th of that, etc.
 * The default value is -100 dB.
 */
export type AmplitudeAnalyserConfig = Pick<
  AnalyserNode,
  'fftSize' | 'maxDecibels' | 'minDecibels'
>;
export type AmplitudeRecorderConfig = {
  analyserConfig: AmplitudeAnalyserConfig;
  sampleCount: number;
  samplingFrequencyMs: number;
};

export const DEFAULT_AMPLITUDE_RECORDER_CONFIG: AmplitudeRecorderConfig = {
  analyserConfig: {
    fftSize: 32,
    maxDecibels: 0,
    minDecibels: -100,
  } as AmplitudeAnalyserConfig,
  sampleCount: 100,
  samplingFrequencyMs: 60,
};

type AmplitudeAnalyserOptions = {
  stream: MediaStream;
  config?: AmplitudeRecorderConfig;
};

export enum AmplitudeRecorderState {
  CLOSED = 'closed',
  RECORDING = 'recording',
  STOPPED = 'stopped',
}

export class AmplitudeRecorder {
  audioContext: AudioContext | undefined;
  analyserNode: AnalyserNode | undefined;
  microphone: MediaStreamAudioSourceNode | undefined;
  stream: MediaStream;

  config: AmplitudeRecorderConfig;

  amplitudeSamplingInterval: ReturnType<typeof setInterval> | undefined;

  amplitudes = new BehaviorSubject<number[]>([]);
  state = new BehaviorSubject<AmplitudeRecorderState | undefined>(undefined);
  error = new Subject<Error | undefined>();

  constructor({ config, stream }: AmplitudeAnalyserOptions) {
    this.config = mergeDeepUndefined({ ...config }, DEFAULT_AMPLITUDE_RECORDER_CONFIG);
    this.stream = stream;
  }

  init() {
    this.audioContext = new AudioContext();
    this.analyserNode = this.audioContext.createAnalyser();
    const { analyserConfig } = this.config;
    this.analyserNode.fftSize = analyserConfig.fftSize;
    this.analyserNode.maxDecibels = analyserConfig.maxDecibels;
    this.analyserNode.minDecibels = analyserConfig.minDecibels;

    this.microphone = this.audioContext.createMediaStreamSource(this.stream);
    this.microphone.connect(this.analyserNode);
  }

  stop() {
    clearInterval(this.amplitudeSamplingInterval);
    this.amplitudeSamplingInterval = undefined;
    this.state.next(AmplitudeRecorderState.STOPPED);
  }

  start = () => {
    if (this.state.value === AmplitudeRecorderState.CLOSED) return;
    if (!this.stream) {
      throw new Error(
        'Missing MediaStream instance. Cannot to start amplitude recording',
      );
    }

    if (this.state.value === AmplitudeRecorderState.RECORDING) this.stop();

    if (!this.analyserNode) {
      if (!this.stream) return;
      this.init();
    }

    this.state.next(AmplitudeRecorderState.RECORDING);

    this.amplitudeSamplingInterval = setInterval(() => {
      if (!(this.analyserNode && this.state.value === AmplitudeRecorderState.RECORDING))
        return;
      const frequencyBins = new Uint8Array(this.analyserNode.frequencyBinCount);
      try {
        this.analyserNode.getByteFrequencyData(frequencyBins);
      } catch (e) {
        logError(e as Error);
        this.error.next(e as Error);
        return;
      }
      const normalizedSignalStrength =
        rootMeanSquare(frequencyBins) / MAX_FREQUENCY_AMPLITUDE;
      this.amplitudes.next([...this.amplitudes.value, normalizedSignalStrength]);
    }, this.config.samplingFrequencyMs);
  };

  close() {
    if (this.state.value !== AmplitudeRecorderState.STOPPED) this.stop();
    this.state.next(AmplitudeRecorderState.CLOSED);
    this.amplitudes.next([]);
    this.microphone?.disconnect();
    this.analyserNode?.disconnect();
    if (this.audioContext?.state !== 'closed') this.audioContext?.close();
  }
}

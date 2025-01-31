import {
  AmplitudeRecorder,
  AmplitudeRecorderState,
  DEFAULT_AMPLITUDE_RECORDER_CONFIG,
} from '../AmplitudeRecorder';
import { AudioContextMock } from '../../../../mock-builders/browser';

window.AudioContext = AudioContextMock;

const intervalID = 1;
jest.spyOn(window, 'setInterval').mockReturnValue(intervalID);

describe('AmplitudeRecorder', () => {
  it('is initiated with defaults', () => {
    const ar = new AmplitudeRecorder({ stream: {} });
    expect(ar.config).toStrictEqual(
      expect.objectContaining(DEFAULT_AMPLITUDE_RECORDER_CONFIG),
    );
  });
  it('is initiated with custom config', () => {
    const customConfig = {
      analyserConfig: {
        fftSize: 64,
        maxDecibels: -6,
        minDecibels: -90,
      },
      sampleCount: 50,
      samplingFrequencyMs: 30,
    };

    const mixedConfig = {
      analyserConfig: customConfig.analyserConfig,
      sampleCount: DEFAULT_AMPLITUDE_RECORDER_CONFIG.sampleCount,
      samplingFrequencyMs: DEFAULT_AMPLITUDE_RECORDER_CONFIG.samplingFrequencyMs,
    };

    let ar = new AmplitudeRecorder({ config: customConfig });
    expect(ar.config).toStrictEqual(expect.objectContaining(customConfig));
    ar = new AmplitudeRecorder({
      config: { analyserConfig: customConfig.analyserConfig },
    });
    expect(ar.config).toStrictEqual(expect.objectContaining(mixedConfig));
  });

  describe('start', () => {
    it('throws error if MediaStream is not available', () => {
      const ar = new AmplitudeRecorder({ stream: {} });
      ar.stream = undefined;
      expect(ar.start).toThrow(
        'Missing MediaStream instance. Cannot to start amplitude recording',
      );
    });

    it('initiates the recorder state', () => {
      const ar = new AmplitudeRecorder({ stream: {} });
      ar.start({});
      expect(ar.audioContext).toBeDefined();
      expect(ar.analyserNode).toStrictEqual(
        expect.objectContaining(DEFAULT_AMPLITUDE_RECORDER_CONFIG.analyserConfig),
      );
      expect(ar.microphone).toBeDefined();
      expect(ar.microphone.connect).toHaveBeenCalledWith(ar.analyserNode);
      expect(ar.state.value).toBe(AmplitudeRecorderState.RECORDING);
      expect(ar.amplitudeSamplingInterval).toBe(intervalID);
    });
  });

  it('stops the recording', () => {
    const ar = new AmplitudeRecorder({ stream: {} });
    ar.start({});
    ar.stop();
    expect(ar.audioContext).toBeDefined();
    expect(ar.analyserNode).toStrictEqual(
      expect.objectContaining(DEFAULT_AMPLITUDE_RECORDER_CONFIG.analyserConfig),
    );
    expect(ar.microphone).toBeDefined();
    expect(ar.microphone.connect).toHaveBeenCalledWith(ar.analyserNode);
    expect(ar.state.value).toBe(AmplitudeRecorderState.STOPPED);
    expect(ar.amplitudeSamplingInterval).toBeUndefined();
  });

  describe('close', () => {
    it('disconnects all the devices', () => {
      const ar = new AmplitudeRecorder({ stream: {} });
      const stopSpy = jest.spyOn(ar, 'stop');
      ar.start({});
      ar.stop();
      ar.close();

      expect(stopSpy).toHaveBeenCalledTimes(1);
      expect(ar.state.value).toBe(AmplitudeRecorderState.CLOSED);
      expect(ar.microphone.disconnect).toHaveBeenCalledWith();
      expect(ar.analyserNode.disconnect).toHaveBeenCalledWith();
      expect(ar.audioContext.close).toHaveBeenCalledWith();
    });

    it('stops the recording if not already stopped', () => {
      const ar = new AmplitudeRecorder({ stream: {} });
      const stopSpy = jest.spyOn(ar, 'stop');
      ar.start({});
      ar.close();
      expect(stopSpy).toHaveBeenCalledWith();
      expect(ar.state.value).toBe(AmplitudeRecorderState.CLOSED);
      expect(ar.microphone.disconnect).toHaveBeenCalledWith();
      expect(ar.analyserNode.disconnect).toHaveBeenCalledWith();
      expect(ar.audioContext.close).toHaveBeenCalledWith();
      stopSpy.mockRestore();
    });

    it('cannot restart the recorder', () => {
      const ar = new AmplitudeRecorder({ stream: {} });
      ar.start({});
      ar.close();
      ar.start();
      expect(ar.state.value).toBe(AmplitudeRecorderState.CLOSED);
    });
  });
});

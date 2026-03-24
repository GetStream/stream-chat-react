import {
  AmplitudeRecorder,
  AmplitudeRecorderState,
  DEFAULT_AMPLITUDE_RECORDER_CONFIG,
} from '../AmplitudeRecorder';
import { AudioContextMock } from '../../../../mock-builders/browser';

window.AudioContext = AudioContextMock as any;

const intervalID = 1;
vi.spyOn(window, 'setInterval').mockReturnValue(intervalID as any);

describe('AmplitudeRecorder', () => {
  it('is initiated with defaults', () => {
    const ar = new AmplitudeRecorder({ stream: {} as any });
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

    const mixedConfig: any = {
      analyserConfig: customConfig.analyserConfig,
      sampleCount: DEFAULT_AMPLITUDE_RECORDER_CONFIG.sampleCount,
      samplingFrequencyMs: DEFAULT_AMPLITUDE_RECORDER_CONFIG.samplingFrequencyMs,
    };

    let ar = new AmplitudeRecorder({ config: customConfig } as any);
    expect(ar.config).toStrictEqual(expect.objectContaining(customConfig));
    ar = new AmplitudeRecorder({
      config: { analyserConfig: customConfig.analyserConfig },
    } as any);
    expect(ar.config).toStrictEqual(expect.objectContaining(mixedConfig));
  });

  describe('start', () => {
    it('throws error if MediaStream is not available', () => {
      const ar = new AmplitudeRecorder({ stream: {} as any });
      ar.stream = undefined;
      expect(ar.start).toThrow(
        'Missing MediaStream instance. Cannot to start amplitude recording',
      );
    });

    it('initiates the recorder state', () => {
      const ar = new AmplitudeRecorder({ stream: {} as any });
      (ar as any).start({});
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
    const ar = new AmplitudeRecorder({ stream: {} as any });
    (ar as any).start({});
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
      const ar = new AmplitudeRecorder({ stream: {} as any });
      const stopSpy = vi.spyOn(ar, 'stop');
      (ar as any).start({});
      ar.stop();
      ar.close();

      expect(stopSpy).toHaveBeenCalledTimes(1);
      expect(ar.state.value).toBe(AmplitudeRecorderState.CLOSED);
      expect(ar.microphone.disconnect).toHaveBeenCalledWith();
      expect(ar.analyserNode.disconnect).toHaveBeenCalledWith();
      expect(ar.audioContext.close).toHaveBeenCalledWith();
    });

    it('stops the recording if not already stopped', () => {
      const ar = new AmplitudeRecorder({ stream: {} as any });
      const stopSpy = vi.spyOn(ar, 'stop');
      (ar as any).start({});
      ar.close();
      expect(stopSpy).toHaveBeenCalledWith();
      expect(ar.state.value).toBe(AmplitudeRecorderState.CLOSED);
      expect(ar.microphone.disconnect).toHaveBeenCalledWith();
      expect(ar.analyserNode.disconnect).toHaveBeenCalledWith();
      expect(ar.audioContext.close).toHaveBeenCalledWith();
      stopSpy.mockRestore();
    });

    it('cannot restart the recorder', () => {
      const ar = new AmplitudeRecorder({ stream: {} as any });
      (ar as any).start({});
      ar.close();
      (ar as any).start();
      expect(ar.state.value).toBe(AmplitudeRecorderState.CLOSED);
    });
  });
});

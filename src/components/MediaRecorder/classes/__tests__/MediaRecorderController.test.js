import {
  DEFAULT_AUDIO_RECORDER_CONFIG,
  MediaRecorderController,
  MediaRecordingState,
} from '../MediaRecorderController';
import { defaultTranslatorFunction } from '../../../../i18n';
import { AmplitudeRecorderState } from '../AmplitudeRecorder';
import { generateVoiceRecordingAttachment } from '../../../../mock-builders';

const idMock = 'randomNanoId';

jest.mock('nanoid', () => ({
  nanoid: () => idMock,
}));

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

class MediaRecorderMock {
  constructor() {}
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  start = jest.fn();
  pause = jest.fn();
  resume = jest.fn();
  stop = jest.fn();
}

class AudioContextMock {
  constructor() {}
  createAnalyser = jest.fn(() => ({}));
  createMediaStreamSource = jest.fn().mockReturnValue({ connect: jest.fn() });
  close = jest.fn();
}

// eslint-disable-next-line
window.MediaRecorder = MediaRecorderMock;

// eslint-disable-next-line
window.AudioContext = AudioContextMock;

// eslint-disable-next-line
window.URL.createObjectURL = jest.fn();
// eslint-disable-next-line
window.URL.revokeObjectURL = jest.fn();

const generateBlobEvent = (
  { dataOverrides, mediaRecorder } = {
    dataOverrides: {},
    mediaRecorder: new window.MediaRecorder(),
  },
) => ({
  bubbles: false,
  cancelable: false,
  cancelBubble: false,
  composed: false,
  currentTarget: mediaRecorder,
  data: new Blob([0x48], { type: 'audio/webm' }),
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  returnValue: true,
  srcElement: mediaRecorder,
  target: mediaRecorder,
  timecode: 1713214079256.997,
  timeStamp: 11853.20000000298,
  type: 'dataavailable',
  ...dataOverrides,
});

describe('MediaRecorderController', () => {
  beforeEach(() => {
    window.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue({}),
    };
  });
  afterEach(jest.clearAllMocks);

  it('provides defaults on initiation', () => {
    const controller = new MediaRecorderController();
    expect(controller.mediaRecorderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AUDIO_RECORDER_CONFIG.mediaRecorderConfig),
    );
    expect(controller.transcoderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AUDIO_RECORDER_CONFIG.transcoderConfig),
    );
    expect(controller.amplitudeRecorderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AUDIO_RECORDER_CONFIG.amplitudeRecorderConfig),
    );
    expect(controller.t).toStrictEqual(defaultTranslatorFunction);
    expect(controller.mediaType).toStrictEqual('audio');
    expect(controller.customGenerateRecordingTitle).toBeUndefined();
  });

  it('overrides the defaults on initiation', () => {
    const config = {
      amplitudeRecorderConfig: {
        analyserConfig: {
          fftSize: 64,
          maxDecibels: -6,
          minDecibels: -90,
        },
        sampleCount: 50,
        samplingFrequencyMs: 30,
      },
      mediaRecorderConfig: { mimeType: 'audio/ogg' },
      transcoderConfig: {
        sampleRate: 22050,
        targetMimeType: 'audio/wav',
      },
    };
    const generateRecordingTitle = jest.fn();
    const t = jest.fn();
    const controller = new MediaRecorderController({
      config,
      generateRecordingTitle,
      t,
    });
    expect(controller.mediaRecorderConfig).toStrictEqual(
      expect.objectContaining(config.mediaRecorderConfig),
    );
    expect(controller.transcoderConfig).toStrictEqual(
      expect.objectContaining(config.transcoderConfig),
    );
    expect(controller.amplitudeRecorderConfig).toStrictEqual(
      expect.objectContaining(config.amplitudeRecorderConfig),
    );
    expect(controller.t).toStrictEqual(t);
    expect(controller.mediaType).toStrictEqual('audio');
    expect(controller.customGenerateRecordingTitle).toStrictEqual(generateRecordingTitle);
  });

  it('overrides the defaults on initiation partially', () => {
    const generateRecordingTitle = jest.fn();
    const controller = new MediaRecorderController({ generateRecordingTitle });
    expect(controller.customGenerateRecordingTitle).toStrictEqual(generateRecordingTitle);
    expect(controller.mediaRecorderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AUDIO_RECORDER_CONFIG.mediaRecorderConfig),
    );
    expect(controller.transcoderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AUDIO_RECORDER_CONFIG.transcoderConfig),
    );
    expect(controller.amplitudeRecorderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AUDIO_RECORDER_CONFIG.amplitudeRecorderConfig),
    );
    expect(controller.t).toStrictEqual(defaultTranslatorFunction);
    expect(controller.mediaType).toStrictEqual('audio');
  });

  it('generates a default recording audio title', () => {
    const controller = new MediaRecorderController();
    expect(controller.generateRecordingTitle('audio/webm')).toMatch(/audio_recording_.+\.webm/);
  });

  it('generates a custom recording audio title', () => {
    const title = 'Test title';
    const controller = new MediaRecorderController({ generateRecordingTitle: () => title });
    expect(controller.generateRecordingTitle('audio/webm')).toBe(title);
  });

  describe('start', () => {
    const expectRegistersError = async ({ controller, errorMsg, withNotification = true }) => {
      let error, notification;
      const errorSubscription = controller.error.subscribe((e) => {
        error = e;
      });
      const notificationSubscription =
        withNotification &&
        controller.notification.subscribe((n) => {
          notification = n;
        });
      await controller.start();
      expect(error.message).toBe(errorMsg);
      expect(consoleErrorSpy.mock.calls[0][0]).toBe('[MEDIA RECORDER ERROR]');
      expect(consoleErrorSpy.mock.calls[0][1].message).toBe(errorMsg);
      if (withNotification)
        expect(notification).toStrictEqual(
          expect.objectContaining({ text: 'Error starting recording', type: 'error' }),
        );
      expect(controller.mediaRecorder).toBeUndefined();

      errorSubscription.unsubscribe();
      if (withNotification) notificationSubscription.unsubscribe();
    };

    it('checks device permission if unknown', async () => {
      const controller = new MediaRecorderController();
      controller.permission.state.next(undefined);
      const permissionCheckSpy = jest.spyOn(controller.permission, 'check').mockImplementation();
      await controller.start();
      expect(permissionCheckSpy).toHaveBeenCalledWith();
    });

    it.each([MediaRecordingState.RECORDING, MediaRecordingState.PAUSED])(
      'registers error if %s',
      async (recordingState) => {
        const controller = new MediaRecorderController();
        controller.recordingState.next(recordingState);
        await expectRegistersError({
          controller,
          errorMsg: 'Cannot start recording. Recording already in progress',
          withNotification: false,
        });
      },
    );

    describe.each([undefined, MediaRecordingState.STOPPED])('recording in state %s', () => {
      describe.each([['denied'], ['prompt'], ['granted']])('with permission %s', (permission) => {
        it('registers error on unavailable navigator.mediaDevices', async () => {
          window.navigator.mediaDevices = undefined;
          const controller = new MediaRecorderController();
          controller.permission.state.next(permission);
          await expectRegistersError({ controller, errorMsg: 'Media recording is not supported' });
          expect(controller.recordingState.value).toBeUndefined();
        });

        it('registers error for video recording', async () => {
          const controller = new MediaRecorderController({
            config: { mediaRecorderConfig: { mimeType: 'video/webm' } },
          });
          controller.permission.state.next(permission);
          await expectRegistersError({
            controller,
            errorMsg: 'Video recording is not supported. Provided MIME type: video/webm',
          });
          expect(controller.recordingState.value).toBeUndefined();
        });

        it('does not check device permission', async () => {
          const controller = new MediaRecorderController();
          controller.permission.state.next(permission);
          const permissionCheckSpy = jest
            .spyOn(controller.permission, 'check')
            .mockImplementation();
          await controller.start();
          expect(permissionCheckSpy).not.toHaveBeenCalledWith();
        });

        it.each([['prevents accessing'], ['accesses'], ['accesses']])(
          '%s media devices',
          async () => {
            const controller = new MediaRecorderController();
            controller.permission.state.next(permission);
            await controller.start();
            if (permission === 'denied') {
              expect(window.navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
              expect(controller.recordingState.value).toBeUndefined();
            } else {
              expect(window.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
                expect.objectContaining({ audio: true }),
              );
              expect(controller.recordingState.value).toBe(MediaRecordingState.RECORDING);
            }
          },
        );

        it.each([['does not initiate'], ['initiates'], ['initiates']])(
          '%s amplitude recording for audio recording on permission %s',
          async () => {
            const controller = new MediaRecorderController();
            controller.permission.state.next(permission);
            await controller.start();
            if (permission === 'denied') {
              expect(controller.amplitudeRecorder).toBeUndefined();
            } else {
              expect(controller.amplitudeRecorder.state.value).toBe(
                AmplitudeRecorderState.RECORDING,
              );
            }
          },
        );
        it('starts MediaRecorder', async () => {
          const controller = new MediaRecorderController();
          await controller.start();
          expect(controller.mediaRecorder.start).toHaveBeenCalledWith();
        });

        it('handles runtime error', async () => {
          const controller = new MediaRecorderController();
          const errorMsg = 'User media error';
          window.navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(new Error(errorMsg));
          await expectRegistersError({ controller, errorMsg });
          expect(controller.recordingState.value).toBeUndefined();
        });
      });
    });
  });

  describe('pause', () => {
    it('pauses recording', async () => {
      const controller = new MediaRecorderController();
      expect(controller.recordedChunkDurations).toHaveLength(0);
      await controller.start();
      controller.pause();
      expect(controller.startTime).toBeUndefined();
      expect(controller.recordingState.value).toBe(MediaRecordingState.PAUSED);
      expect(controller.mediaRecorder.pause).toHaveBeenCalledWith();
      expect(controller.amplitudeRecorder.state.value).toBe(AmplitudeRecorderState.STOPPED);
      controller.resume();
      controller.pause();
      expect(controller.recordedChunkDurations).toHaveLength(2);
    });

    it.each([MediaRecordingState.PAUSED, MediaRecordingState.STOPPED, undefined])(
      'does nothing if recording state is %s',
      (recordingState) => {
        const controller = new MediaRecorderController();
        controller.recordingState.next(recordingState);
        controller.pause();
        expect(controller.recordedChunkDurations).toHaveLength(0);
        expect(controller.recordingState.value).toBe(recordingState);
      },
    );
  });

  describe('resume', () => {
    it('resumes paused recording', async () => {
      const controller = new MediaRecorderController();
      await controller.start();
      controller.pause();
      controller.resume();
      expect(controller.startTime).toBeDefined();
      expect(controller.mediaRecorder.resume).toHaveBeenCalledWith();
      expect(controller.amplitudeRecorder.state.value).toBe(AmplitudeRecorderState.RECORDING);
      expect(controller.recordingState.value).toBe(MediaRecordingState.RECORDING);
    });

    it.each([MediaRecordingState.RECORDING, MediaRecordingState.STOPPED, undefined])(
      'does nothing if recording state is %s',
      (recordingState) => {
        const controller = new MediaRecorderController();
        controller.recordingState.next(recordingState);
        controller.resume();
        expect(controller.recordedChunkDurations).toHaveLength(0);
        expect(controller.recordingState.value).toBe(recordingState);
      },
    );
  });

  describe('stop', () => {
    it('returns existing recording', async () => {
      const controller = new MediaRecorderController();
      const existingRecording = generateVoiceRecordingAttachment();
      controller.recording.next(existingRecording);
      expect(await controller.stop()).toStrictEqual(expect.objectContaining(existingRecording));
    });

    it.each([MediaRecordingState.STOPPED, undefined])(
      'does nothing if recording state is %s',
      async (recordingState) => {
        const controller = new MediaRecorderController();
        controller.recordingState.next(recordingState);
        expect(await controller.stop()).toBeUndefined();
        expect(controller.recordingState.value).toBe(recordingState);
      },
    );

    it.each([MediaRecordingState.RECORDING, MediaRecordingState.PAUSED])(
      'stops recording if recording state is %s',
      async (recordingState) => {
        const controller = new MediaRecorderController();
        await controller.start();
        controller.mediaRecorder.state = MediaRecordingState.RECORDING;
        if (recordingState === MediaRecordingState.PAUSED) {
          controller.pause();
          controller.mediaRecorder.state = MediaRecordingState.PAUSED;
        }
        const voiceRecording = generateVoiceRecordingAttachment();
        setTimeout(() => {
          controller.signalRecordingReady(voiceRecording);
        }, 0);
        const stopResult = await controller.stop();
        expect(stopResult).toStrictEqual(expect.objectContaining(voiceRecording));
        expect(controller.startTime).toBeUndefined();
        expect(controller.mediaRecorder.stop).toHaveBeenCalledWith();
        expect(controller.amplitudeRecorder.state.value).toBe(AmplitudeRecorderState.STOPPED);
        expect(controller.recordingState.value).toBe(MediaRecordingState.STOPPED);
      },
    );
  });

  describe('handleDataavailable event handler', () => {
    it('does nothing if event does not contain data', () => {
      const controller = new MediaRecorderController();
      controller.handleDataavailableEvent(
        generateBlobEvent({ dataOverrides: { data: new Blob([], { type: 'audio/webm' }) } }),
      );
      expect(controller.recording.value).toBeUndefined();
    });
    it.todo('handles error');
    it.todo('adds recording duration to audio/webm recording');
    it.each([
      ['does not transcode', 'audio/mp4'],
      ['transcodes', 'audio/web'],
      ['transcodes', 'audio/ogg'],
    ])('%s recording of MIME type %s');
    it.todo('does not emit recording if generation was unsuccessful');
    it.todo('emits recording if generation was successful');
  });

  describe('makeVoiceRecording', () => {
    it.todo('revokes URI of the previous recording');
  });

  it.todo('handles MediaRecorder error events');

  it('records the duration', async () => {
    const controller = new MediaRecorderController();
    await controller.start();
    expect(controller.startTime).toBeGreaterThan(0);
    expect(controller.recordingState.value).toBe(MediaRecordingState.RECORDING);
  });
});

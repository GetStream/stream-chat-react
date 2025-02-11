import fixWebmDuration from 'fix-webm-duration';
import * as transcoder from '../../transcode';
import * as wavTranscoder from '../../transcode/wav';
import {
  DEFAULT_AUDIO_TRANSCODER_CONFIG,
  MediaRecorderController,
  MediaRecordingState,
  RECORDED_MIME_TYPE_BY_BROWSER,
  RecordingAttachmentType,
} from '../MediaRecorderController';
import {
  AmplitudeRecorderState,
  DEFAULT_AMPLITUDE_RECORDER_CONFIG,
} from '../AmplitudeRecorder';
import { defaultTranslatorFunction } from '../../../../i18n';
import * as audioSampling from '../../../Attachment/audioSampling';
import * as reactFileUtils from '../../../ReactFileUtilities/utils';
import { generateVoiceRecordingAttachment } from '../../../../mock-builders';
import { AudioContextMock, MediaRecorderMock } from '../../../../mock-builders/browser';
import { generateDataavailableEvent } from '../../../../mock-builders/browser/events/dataavailable';

const fileObjectURL = 'fileObjectURL';
const nanoidMockValue = 'randomNanoId';
const fileMock = { name: 'fileName' };

const recordedChunkCount = 10;
const dataPoints = Array.from({ length: recordedChunkCount }, (_, i) => i);
jest.mock('nanoid', () => ({
  nanoid: () => nanoidMockValue,
}));

jest
  .spyOn(wavTranscoder, 'encodeToWaw')
  .mockImplementation((file) => Promise.resolve(new Blob([file], { type: 'audio/wav' })));

const mp3EncoderMock = jest.fn((file) =>
  Promise.resolve(new Blob([file], { type: 'audio/mp3' })),
);

jest.mock('fix-webm-duration', () => jest.fn((blob) => blob));

jest.spyOn(audioSampling, 'resampleWaveformData').mockReturnValue(dataPoints);

const createFileFromBlobsSpy = jest
  .spyOn(reactFileUtils, 'createFileFromBlobs')
  .mockReturnValue(fileMock);

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const expectRegistersError = async ({
  action,
  controller,
  errorMsg,
  notificationMsg,
}) => {
  let error, notification;
  const errorSubscription = controller.error.subscribe((e) => {
    error = e;
  });
  const notificationSubscription =
    notificationMsg &&
    controller.notification.subscribe((n) => {
      notification = n;
    });
  await action();
  expect(error.message).toBe(errorMsg);
  expect(consoleErrorSpy.mock.calls[0][0]).toBe('[MEDIA RECORDER ERROR]');
  expect(consoleErrorSpy.mock.calls[0][1].message).toBe(errorMsg);
  if (notificationMsg)
    expect(notification).toStrictEqual(
      expect.objectContaining({ text: notificationMsg, type: 'error' }),
    );
  expect(controller.mediaRecorder).toBeUndefined();

  errorSubscription.unsubscribe();
  notificationSubscription?.unsubscribe();
};

window.MediaRecorder = MediaRecorderMock;

window.AudioContext = AudioContextMock;

// eslint-disable-next-line
window.URL.createObjectURL = jest.fn(() => fileObjectURL);
// eslint-disable-next-line
window.URL.revokeObjectURL = jest.fn();

describe('MediaRecorderController', () => {
  beforeEach(() => {
    window.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue({}),
    };
  });
  afterEach(jest.clearAllMocks);

  it('provides defaults on initiation (non-Safari)', () => {
    const controller = new MediaRecorderController();
    expect(controller.mediaRecorderConfig).toStrictEqual(
      expect.objectContaining({ mimeType: RECORDED_MIME_TYPE_BY_BROWSER.audio.others }),
    );
    expect(controller.transcoderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AUDIO_TRANSCODER_CONFIG),
    );
    expect(controller.amplitudeRecorderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AMPLITUDE_RECORDER_CONFIG),
    );
    expect(controller.t).toStrictEqual(defaultTranslatorFunction);
    expect(controller.mediaType).toStrictEqual('audio');
    expect(controller.customGenerateRecordingTitle).toBeUndefined();
  });

  it('provides defaults on initiation (Safari)', () => {
    MediaRecorder.isTypeSupported.mockReturnValueOnce(false);
    const controller = new MediaRecorderController();
    expect(controller.mediaRecorderConfig).toStrictEqual(
      expect.objectContaining({ mimeType: RECORDED_MIME_TYPE_BY_BROWSER.audio.safari }),
    );
    expect(controller.transcoderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AUDIO_TRANSCODER_CONFIG),
    );
    expect(controller.amplitudeRecorderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AMPLITUDE_RECORDER_CONFIG),
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
      expect.objectContaining({ mimeType: RECORDED_MIME_TYPE_BY_BROWSER.audio.others }),
    );
    expect(controller.transcoderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AUDIO_TRANSCODER_CONFIG),
    );
    expect(controller.amplitudeRecorderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AMPLITUDE_RECORDER_CONFIG),
    );
    expect(controller.t).toStrictEqual(defaultTranslatorFunction);
    expect(controller.mediaType).toStrictEqual('audio');
  });

  it('generates a default recording audio title', () => {
    const controller = new MediaRecorderController();
    expect(controller.generateRecordingTitle('audio/webm')).toMatch(
      /audio_recording_.+\.webm/,
    );
  });

  it('generates a custom recording audio title', () => {
    const title = 'Test title';
    const controller = new MediaRecorderController({
      generateRecordingTitle: () => title,
    });
    expect(controller.generateRecordingTitle('audio/webm')).toBe(title);
  });

  describe('start', () => {
    it('checks device permission if unknown', async () => {
      const controller = new MediaRecorderController();
      controller.permission.state.next(undefined);
      const permissionCheckSpy = jest
        .spyOn(controller.permission, 'check')
        .mockImplementation();
      await controller.start();
      expect(permissionCheckSpy).toHaveBeenCalledWith();
    });

    it.each([MediaRecordingState.RECORDING, MediaRecordingState.PAUSED])(
      'registers error if %s',
      async (recordingState) => {
        const controller = new MediaRecorderController();
        controller.recordingState.next(recordingState);
        await expectRegistersError({
          action: controller.start,
          controller,
          errorMsg: 'Cannot start recording. Recording already in progress',
        });
      },
    );

    describe.each([undefined, MediaRecordingState.STOPPED])(
      'recording in state %s',
      () => {
        describe.each([['denied'], ['prompt'], ['granted']])(
          'with permission "%s"',
          (permission) => {
            it('registers error on unavailable navigator.mediaDevices', async () => {
              window.navigator.mediaDevices = undefined;
              const controller = new MediaRecorderController();
              controller.permission.state.next(permission);
              await expectRegistersError({
                action: controller.start,
                controller,
                errorMsg: 'Media recording is not supported',
                notificationMsg: 'Error starting recording',
              });
              expect(controller.recordingState.value).toBeUndefined();
            });

            it('registers error for video recording', async () => {
              const controller = new MediaRecorderController({
                config: { mediaRecorderConfig: { mimeType: 'video/webm' } },
              });
              controller.permission.state.next(permission);
              await expectRegistersError({
                action: controller.start,
                controller,
                errorMsg:
                  'Video recording is not supported. Provided MIME type: video/webm',
                notificationMsg: 'Error starting recording',
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
                  expect(
                    window.navigator.mediaDevices.getUserMedia,
                  ).not.toHaveBeenCalled();
                  expect(controller.recordingState.value).toBeUndefined();
                } else {
                  expect(window.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
                    expect.objectContaining({ audio: true }),
                  );
                  expect(controller.recordingState.value).toBe(
                    MediaRecordingState.RECORDING,
                  );
                }
              },
            );

            it.each([['does not initiate'], ['initiates'], ['initiates']])(
              '%s amplitude recording for audio recording',
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
              window.navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(
                new Error(errorMsg),
              );
              await expectRegistersError({
                action: controller.start,
                controller,
                errorMsg,
                notificationMsg: 'Error starting recording',
              });
              expect(controller.recordingState.value).toBeUndefined();
            });
          },
        );
      },
    );
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
      expect(controller.amplitudeRecorder.state.value).toBe(
        AmplitudeRecorderState.STOPPED,
      );
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
      expect(controller.amplitudeRecorder.state.value).toBe(
        AmplitudeRecorderState.RECORDING,
      );
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
      expect(await controller.stop()).toStrictEqual(
        expect.objectContaining(existingRecording),
      );
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
        expect(controller.amplitudeRecorder.state.value).toBe(
          AmplitudeRecorderState.STOPPED,
        );
        expect(controller.recordingState.value).toBe(MediaRecordingState.STOPPED);
      },
    );
  });

  describe('handleDataavailable event handler', () => {
    it('does nothing if event does not contain data', () => {
      const controller = new MediaRecorderController();
      controller.handleDataavailableEvent(
        generateDataavailableEvent({
          dataOverrides: { data: new Blob([], { type: 'audio/webm' }) },
        }),
      );
      expect(controller.recording.value).toBeUndefined();
    });

    it('handles error', () => {
      const errorMsg = 'Error making voice recording';
      const controller = new MediaRecorderController();
      const makeVoiceRecordingSpy = jest
        .spyOn(controller, 'makeVoiceRecording')
        .mockRejectedValue(new Error(errorMsg));
      expectRegistersError({
        action: () => controller.handleDataavailableEvent(generateDataavailableEvent()),
        controller,
        errorMsg,
        notificationMsg: 'An error has occurred during the recording processing',
      });
      makeVoiceRecordingSpy.mockRestore();
    });

    it('does not emit recording if generation was unsuccessful', async () => {
      const controller = new MediaRecorderController();
      const makeVoiceRecordingSpy = jest
        .spyOn(controller, 'makeVoiceRecording')
        .mockResolvedValue(undefined);
      await controller.handleDataavailableEvent(generateDataavailableEvent());
      expect(controller.recording.value).toBeUndefined();
      makeVoiceRecordingSpy.mockRestore();
    });

    it('emits recording if generation was successful', async () => {
      const controller = new MediaRecorderController();
      const voiceRecording = generateVoiceRecordingAttachment();
      const makeVoiceRecordingSpy = jest
        .spyOn(controller, 'makeVoiceRecording')
        .mockResolvedValue(voiceRecording);
      await controller.handleDataavailableEvent(generateDataavailableEvent());
      expect(controller.recording.value).toStrictEqual(
        expect.objectContaining(voiceRecording),
      );
      makeVoiceRecordingSpy.mockRestore();
    });
  });

  describe('makeVoiceRecording', () => {
    it('does not generate recording if no data was recorded', async () => {
      const controller = new MediaRecorderController();
      const recording = await controller.makeVoiceRecording();
      expect(recording).toBeUndefined();
    });

    it('revokes URI of the previous recording', async () => {
      const recordingUri = 'recordingUri';
      const controller = new MediaRecorderController();
      controller.recordingUri = recordingUri;
      await controller.makeVoiceRecording();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(recordingUri);
    });

    it.each([
      ['does not add', 'audio/mp4'],
      ['adds', 'audio/webm'],
      ['does not add', 'audio/ogg'],
    ])('%s recording duration to %s recording', async (_, mimeType) => {
      const controller = new MediaRecorderController({
        config: { mediaRecorderConfig: { mimeType } },
      });
      controller.recordedData.push(new Blob([1], { type: mimeType }));
      await controller.makeVoiceRecording();
      if (mimeType === 'audio/webm') {
        expect(fixWebmDuration).toHaveBeenCalledTimes(1);
      } else {
        expect(fixWebmDuration).not.toHaveBeenCalled();
      }
    });

    it.each([
      ['does not transcode', 'audio/mp4'],
      ['transcodes', 'audio/webm'],
      ['transcodes', 'audio/ogg'],
    ])('%s recording of MIME type %s', async (_, mimeType) => {
      const transcodeSpy = jest
        .spyOn(transcoder, 'transcode')
        .mockImplementation((opts) =>
          Promise.resolve(new Blob([opts.blob], { type: 'audio/wav' })),
        );

      const controller = new MediaRecorderController({
        config: { mediaRecorderConfig: { mimeType } },
      });
      controller.recordedData.push(new Blob([1], { type: mimeType }));
      await controller.makeVoiceRecording();
      if (mimeType === 'audio/mp4') {
        expect(transcodeSpy).not.toHaveBeenCalled();
      } else {
        expect(transcodeSpy).toHaveBeenCalledTimes(1);
      }
      transcodeSpy.mockRestore();
    });

    it.each([
      ['audio/mp4', 'audio/mp4'],
      ['audio/wav', 'audio/webm'],
      ['audio/wav', 'audio/ogg'],
    ])(
      'generates recording of MIME type %s for original recording of MIME type %s',
      async (targetMimeType, recordedMimeType) => {
        const controller = new MediaRecorderController({
          config: { mediaRecorderConfig: { mimeType: recordedMimeType } },
        });

        controller.recordedData = [
          new Blob(new Uint8Array(dataPoints), { type: recordedMimeType }),
        ];
        controller.recordedChunkDurations = dataPoints.map((n) => n * 1000);
        const recordedFile = new File(controller.recordedData, fileMock);
        createFileFromBlobsSpy.mockReturnValue(recordedFile);

        const recording = await controller.makeVoiceRecording();

        expect(recording).toStrictEqual(
          expect.objectContaining({
            asset_url: fileObjectURL,
            duration: dataPoints.reduce((acc, n) => acc + n),
            file_size: recordedChunkCount,
            localMetadata: {
              file: recordedFile,
              id: nanoidMockValue,
            },
            mime_type: targetMimeType,
            title: recordedFile.name,
            type: RecordingAttachmentType.VOICE_RECORDING,
            waveform_data: dataPoints,
          }),
        );
        createFileFromBlobsSpy.mockReturnValue(fileMock);
      },
    );

    it.each([
      ['audio/mp3', 'audio/webm'],
      ['audio/mp3', 'audio/ogg'],
    ])(
      'executes the custom MP3 encoder for MIME type %s',
      async (targetMimeType, recordedMimeType) => {
        const controller = new MediaRecorderController({
          config: {
            mediaRecorderConfig: { mimeType: recordedMimeType },
            transcoderConfig: { encoder: mp3EncoderMock },
          },
        });

        controller.recordedData = [
          new Blob(new Uint8Array(dataPoints), { type: recordedMimeType }),
        ];
        controller.recordedChunkDurations = dataPoints.map((n) => n * 1000);
        const recordedFile = new File(controller.recordedData, fileMock);
        createFileFromBlobsSpy.mockReturnValue(recordedFile);

        const recording = await controller.makeVoiceRecording();

        expect(mp3EncoderMock).toHaveBeenCalledWith(
          recordedFile,
          DEFAULT_AUDIO_TRANSCODER_CONFIG.sampleRate,
        );
        expect(recording).toStrictEqual(
          expect.objectContaining({
            asset_url: fileObjectURL,
            duration: dataPoints.reduce((acc, n) => acc + n),
            file_size: recordedChunkCount,
            localMetadata: {
              file: recordedFile,
              id: nanoidMockValue,
            },
            mime_type: targetMimeType,
            title: recordedFile.name,
            type: RecordingAttachmentType.VOICE_RECORDING,
            waveform_data: dataPoints,
          }),
        );
        createFileFromBlobsSpy.mockReturnValue(fileMock);
      },
    );

    it('does not executed custom encoder for MIME type audio/mp4', async () => {
      const targetMimeType = 'audio/mp4';
      const recordedMimeType = 'audio/mp4';
      const controller = new MediaRecorderController({
        config: {
          mediaRecorderConfig: { mimeType: recordedMimeType },
          transcoderConfig: { encoder: mp3EncoderMock },
        },
      });

      controller.recordedData = [
        new Blob(new Uint8Array(dataPoints), { type: recordedMimeType }),
      ];
      controller.recordedChunkDurations = dataPoints.map((n) => n * 1000);
      const recordedFile = new File(controller.recordedData, fileMock);
      createFileFromBlobsSpy.mockReturnValue(recordedFile);

      const recording = await controller.makeVoiceRecording();

      expect(mp3EncoderMock).not.toHaveBeenCalled();
      expect(recording).toStrictEqual(
        expect.objectContaining({
          asset_url: fileObjectURL,
          duration: dataPoints.reduce((acc, n) => acc + n),
          file_size: recordedChunkCount,
          localMetadata: {
            file: recordedFile,
            id: nanoidMockValue,
          },
          mime_type: targetMimeType,
          title: recordedFile.name,
          type: RecordingAttachmentType.VOICE_RECORDING,
          waveform_data: dataPoints,
        }),
      );
      createFileFromBlobsSpy.mockReturnValue(fileMock);
    });
  });
});

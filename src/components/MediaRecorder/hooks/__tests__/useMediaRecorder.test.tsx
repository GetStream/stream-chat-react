import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';
import type {
  AttachmentManager,
  LocalUploadAttachment,
  LocalVoiceRecordingAttachment,
} from 'stream-chat';
import { useMediaRecorder } from '../useMediaRecorder';
import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';
import { EventEmitterMock, MediaRecorderMock } from '../../../../mock-builders/browser';
import { DEFAULT_AMPLITUDE_RECORDER_CONFIG } from '../../classes/AmplitudeRecorder';
import { DEFAULT_AUDIO_TRANSCODER_CONFIG, MediaRecordingState } from '../../classes';
import {
  generateVoiceRecordingAttachment,
  initClientWithChannels,
} from '../../../../mock-builders';

// `useMediaRecorder` submits through `messageComposer.send`. `render` spies on the composer of the
// channel it builds, which is what these tests assert the submit step against.
let sendSpy: ReturnType<typeof vi.spyOn>;

// Captures interaction announcements while keeping the rest of the Accessibility module intact,
// since Chat mounts AriaLiveAnnouncerProvider / NotificationAnnouncer from it.
const { announceInteractionMock } = vi.hoisted(() => ({
  announceInteractionMock: vi.fn(),
}));
vi.mock('../../../Accessibility', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../Accessibility')>()),
  useInteractionAnnouncements: () => ({
    announceInteraction: announceInteractionMock,
    cancelInteraction: vi.fn(),
  }),
}));

window.MediaRecorder = MediaRecorderMock as unknown as typeof MediaRecorder;

const defaultMockPermissionState = 'prompt';
const status = new EventEmitterMock();
status['state'] = defaultMockPermissionState;
(navigator as any).permissions = {
  query: vi.fn().mockResolvedValue(status),
};

// A recording as `MediaRecorderController.stop()` builds it: a voice recording with its file and local id.
const generateLocalVoiceRecording = () =>
  ({
    ...generateVoiceRecordingAttachment(),
    localMetadata: {
      file: new File(['audio'], 'recording.aac', { type: 'audio/aac' }),
      id: 'recording-local-id',
    },
  }) as unknown as LocalVoiceRecordingAttachment;

// Stands in for a successful `uploadFile()`, which adds the attachment to the composer.
const mockUploadFileAddingTheAttachment = (attachmentManager: AttachmentManager) =>
  vi.spyOn(attachmentManager, 'uploadFile').mockImplementation((attachment) => {
    attachmentManager.upsertAttachments([attachment as LocalUploadAttachment]);
    return Promise.resolve(attachment as LocalUploadAttachment);
  });

const render = async (params = {}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  sendSpy = vi.spyOn(channel.messageComposer, 'send').mockResolvedValue('sent');
  const wrapper = ({ children }) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );
  let result: RenderHookResult<ReturnType<typeof useMediaRecorder>, unknown>;
  await act(async () => {
    result = await renderHook(
      () =>
        useMediaRecorder(
          fromPartial<Parameters<typeof useMediaRecorder>[0]>({
            enabled: true,
            ...params,
          }),
        ),
      {
        wrapper,
      },
    );
  });
  return { channel, ...result };
};

describe('useMediaRecorder', () => {
  afterEach(vi.clearAllMocks);

  it('subscribes to MediaRecorderController state updates', async () => {
    const {
      result: {
        current: { permissionState, recorder, recording, recordingState },
      },
    } = await render();
    expect(recorder.permission.isWatching).toBe(true);
    expect(permissionState).toBe(defaultMockPermissionState);
    expect(recording).toBeUndefined();
    expect(recordingState).toBeUndefined();
  });

  it('unsubscribes MediaRecorderController state updates on unmount', async () => {
    const {
      result: {
        current: { recorder },
      },
      unmount,
    } = await render();
    unmount();
    expect(recorder.permission.isWatching).toBe(false);
  });

  it('does not initiate MediaRecorderController instance when recording is disabled', async () => {
    const {
      result: {
        current: { permissionState, recorder, recording, recordingState },
      },
    } = await render({ enabled: false });
    expect(recorder).toBeUndefined();
    expect(permissionState).toBeUndefined();
    expect(recording).toBeUndefined();
    expect(recordingState).toBeUndefined();
  });

  it('forwards recordingConfig to recorder instance', async () => {
    const mediaRecorderConfig = { mimeType: 'audio/ogg' };
    const {
      result: {
        current: { recorder },
      },
    } = await render({ recordingConfig: { mediaRecorderConfig } });
    expect(recorder.mediaRecorderConfig).toStrictEqual(
      expect.objectContaining(mediaRecorderConfig),
    );
    expect(recorder.amplitudeRecorderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AMPLITUDE_RECORDER_CONFIG),
    );
    expect(recorder.transcoderConfig).toStrictEqual(
      expect.objectContaining(DEFAULT_AUDIO_TRANSCODER_CONFIG),
    );
  });

  it('forwards custom function to generate recording title to recorder instance', async () => {
    const customTitle = 'custom title';
    const generateRecordingTitle = () => customTitle;
    const {
      result: {
        current: { recorder },
      },
    } = await render({ generateRecordingTitle });
    expect(recorder.generateRecordingTitle()).toBe(customTitle);
  });

  describe('completeRecording', () => {
    it('does nothing if recording is disabled', async () => {
      const {
        channel,
        result: {
          current: { completeRecording },
        },
      } = await render({ enabled: false });
      const uploadFileSpy = vi.spyOn(
        channel.messageComposer.attachmentManager,
        'uploadFile',
      );
      await completeRecording();
      expect(uploadFileSpy).not.toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('does nothing if recording attachment is not generated on stop', async () => {
      const {
        channel,
        result: {
          current: { completeRecording, recorder },
        },
      } = await render();
      const uploadFileSpy = vi.spyOn(
        channel.messageComposer.attachmentManager,
        'uploadFile',
      );
      const recorderStopSpy = vi.spyOn(recorder, 'stop').mockResolvedValue(undefined);
      const recorderCleanUpSpy = vi
        .spyOn(recorder, 'cleanUp')
        .mockResolvedValue(undefined);
      await completeRecording();
      expect(recorderStopSpy).toHaveBeenCalledWith();
      expect(recorderCleanUpSpy).not.toHaveBeenCalledWith();
      expect(uploadFileSpy).not.toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('uploads and submits the attachment', async () => {
      const generatedVoiceRecording = generateLocalVoiceRecording();
      const {
        channel,
        result: {
          current: { completeRecording, recorder },
        },
      } = await render();
      vi.spyOn(
        channel.messageComposer.attachmentManager,
        'isUploadEnabled',
        'get',
      ).mockReturnValue(true);
      const uploadFileSpy = mockUploadFileAddingTheAttachment(
        channel.messageComposer.attachmentManager,
      );
      vi.spyOn(recorder, 'stop').mockResolvedValue(generatedVoiceRecording);
      const recorderCleanUpSpy = vi
        .spyOn(recorder, 'cleanUp')
        .mockResolvedValue(undefined);
      await act(() => {
        completeRecording();
      });
      expect(uploadFileSpy).toHaveBeenCalledWith(generatedVoiceRecording);
      expect(sendSpy).toHaveBeenCalledWith();
      expect(recorderCleanUpSpy).toHaveBeenCalledWith();
      expect(announceInteractionMock).toHaveBeenCalledWith('voiceRecording.sent');
      expect(announceInteractionMock).not.toHaveBeenCalledWith('voiceRecording.attached');
    });

    it('uploads but does not submit the attachment if multiple async messages enabled', async () => {
      const generatedVoiceRecording = generateLocalVoiceRecording();
      const {
        channel,
        result: {
          current: { completeRecording, recorder },
        },
      } = await render({
        asyncMessagesMultiSendEnabled: true,
      });
      vi.spyOn(
        channel.messageComposer.attachmentManager,
        'isUploadEnabled',
        'get',
      ).mockReturnValue(true);
      const uploadFileSpy = mockUploadFileAddingTheAttachment(
        channel.messageComposer.attachmentManager,
      );
      vi.spyOn(recorder, 'stop').mockResolvedValue(generatedVoiceRecording);
      const recorderCleanUpSpy = vi
        .spyOn(recorder, 'cleanUp')
        .mockResolvedValue(undefined);
      await act(() => {
        completeRecording();
      });
      expect(uploadFileSpy).toHaveBeenCalledWith(generatedVoiceRecording);
      expect(sendSpy).not.toHaveBeenCalled();
      expect(recorderCleanUpSpy).toHaveBeenCalledWith();
      expect(announceInteractionMock).toHaveBeenCalledWith('voiceRecording.attached');
      expect(announceInteractionMock).not.toHaveBeenCalledWith('voiceRecording.sent');
    });

    it('does not announce the recording as sent when the send fails', async () => {
      const localVoiceRecording = generateLocalVoiceRecording();
      const {
        channel,
        result: {
          current: { completeRecording, recorder },
        },
      } = await render();
      const { attachmentManager } = channel.messageComposer;
      vi.spyOn(attachmentManager, 'isUploadEnabled', 'get').mockReturnValue(true);
      mockUploadFileAddingTheAttachment(attachmentManager);
      sendSpy.mockResolvedValue('failed');
      vi.spyOn(recorder, 'stop').mockResolvedValue(localVoiceRecording);
      vi.spyOn(recorder, 'cleanUp').mockResolvedValue(undefined);
      await act(() => completeRecording());
      expect(sendSpy).toHaveBeenCalledWith();
      expect(announceInteractionMock).not.toHaveBeenCalledWith('voiceRecording.sent');
    });

    describe.each([
      { asyncMessagesMultiSendEnabled: false },
      { asyncMessagesMultiSendEnabled: true },
    ])(
      'when the composer does not take the recording (asyncMessagesMultiSendEnabled: $asyncMessagesMultiSendEnabled)',
      ({ asyncMessagesMultiSendEnabled }) => {
        // Each case starts with uploads on, then sets up what keeps the recording out.
        it.each([
          {
            cause: 'uploads are off',
            setUp: (attachmentManager: AttachmentManager) => {
              vi.spyOn(attachmentManager, 'isUploadEnabled', 'get').mockReturnValue(
                false,
              );
            },
            uploadsTheRecording: false,
          },
          {
            cause: 'the upload filter rejects it',
            setUp: (attachmentManager: AttachmentManager) => {
              attachmentManager.fileUploadFilter = () => false;
            },
            uploadsTheRecording: true,
          },
          {
            cause: 'pre-upload middleware discards it',
            setUp: (attachmentManager: AttachmentManager) => {
              attachmentManager.preUploadMiddlewareExecutor.use({
                handlers: { prepare: ({ discard }) => discard() },
                id: 'test/discard-recording',
              });
            },
            uploadsTheRecording: true,
          },
          {
            cause: 'post-upload middleware discards it',
            setUp: (attachmentManager: AttachmentManager) => {
              attachmentManager.setCustomUploadFn(
                vi
                  .fn()
                  .mockResolvedValue({ file: 'https://cdn.example.com/recording.aac' }),
              );
              attachmentManager.postUploadMiddlewareExecutor.use({
                handlers: { postProcess: ({ discard }) => discard() },
                id: 'test/discard-recording',
              });
            },
            uploadsTheRecording: true,
          },
        ])(
          'keeps the recording and sends nothing when $cause',
          async ({ setUp, uploadsTheRecording }) => {
            const localVoiceRecording = generateLocalVoiceRecording();
            const {
              channel,
              result: {
                current: { completeRecording, recorder },
              },
            } = await render({ asyncMessagesMultiSendEnabled });
            const { attachmentManager } = channel.messageComposer;
            vi.spyOn(attachmentManager, 'isUploadEnabled', 'get').mockReturnValue(true);
            setUp(attachmentManager);
            const uploadFileSpy = vi.spyOn(attachmentManager, 'uploadFile');
            vi.spyOn(recorder, 'stop').mockResolvedValue(localVoiceRecording);
            const recorderCleanUpSpy = vi
              .spyOn(recorder, 'cleanUp')
              .mockResolvedValue(undefined);
            const releaseMicrophoneSpy = vi.spyOn(recorder, 'releaseMicrophone');
            await act(() => completeRecording());
            expect(uploadFileSpy).toHaveBeenCalledTimes(uploadsTheRecording ? 1 : 0);
            expect(sendSpy).not.toHaveBeenCalled();
            expect(recorderCleanUpSpy).not.toHaveBeenCalled();
            expect(releaseMicrophoneSpy).toHaveBeenCalledWith();
            expect(announceInteractionMock).not.toHaveBeenCalledWith(
              'voiceRecording.sent',
            );
            expect(announceInteractionMock).not.toHaveBeenCalledWith(
              'voiceRecording.attached',
            );
          },
        );
      },
    );
  });

  describe('lifecycle announcements', () => {
    it('announces started, paused, and resumed on the matching state transitions', async () => {
      const {
        result: {
          current: { recorder },
        },
      } = await render();

      await act(() => {
        recorder.recordingState.next(MediaRecordingState.RECORDING);
      });
      expect(announceInteractionMock).toHaveBeenLastCalledWith('voiceRecording.started');

      await act(() => {
        recorder.recordingState.next(MediaRecordingState.PAUSED);
      });
      expect(announceInteractionMock).toHaveBeenLastCalledWith('voiceRecording.paused');

      await act(() => {
        recorder.recordingState.next(MediaRecordingState.RECORDING);
      });
      expect(announceInteractionMock).toHaveBeenLastCalledWith('voiceRecording.resumed');
    });

    it('does not announce an interaction when a recording is cancelled/reset (covered by a notification)', async () => {
      const {
        result: {
          current: { recorder },
        },
      } = await render();

      await act(() => {
        recorder.recordingState.next(MediaRecordingState.RECORDING);
      });
      announceInteractionMock.mockClear();

      // Cancelling resets the state to `undefined`; the "Voice message deleted" notification,
      // spoken by NotificationAnnouncer, is the announcement, so no interaction is fired.
      await act(() => {
        recorder.recordingState.next(undefined);
      });
      expect(announceInteractionMock).not.toHaveBeenCalled();
    });
  });
});

import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { useMediaRecorder } from '../useMediaRecorder';
import { EventEmitterMock, MediaRecorderMock } from '../../../../mock-builders/browser';
import { DEFAULT_AMPLITUDE_RECORDER_CONFIG } from '../../classes/AmplitudeRecorder';
import { DEFAULT_AUDIO_TRANSCODER_CONFIG } from '../../classes';
import {
  generateVoiceRecordingAttachment,
  initClientWithChannels,
} from '../../../../mock-builders';
import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';

window.MediaRecorder = MediaRecorderMock;

const handleSubmit = jest.fn();

const defaultMockPermissionState = 'prompt';
const status = new EventEmitterMock();
status.state = defaultMockPermissionState;
window.navigator.permissions = {
  query: jest.fn().mockResolvedValue(status),
};

const render = async (params = {}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  const wrapper = ({ children }) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );
  let result;
  await act(async () => {
    result = await renderHook(() => useMediaRecorder({ enabled: true, ...params }), {
      wrapper,
    });
  });
  return { channel, ...result };
};

describe('useMediaRecorder', () => {
  afterEach(jest.clearAllMocks);

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
      } = await render({ enabled: false, handleSubmit });
      const uploadAttachmentSpy = jest.spyOn(
        channel.messageComposer.attachmentManager,
        'uploadAttachment',
      );
      await completeRecording();
      expect(uploadAttachmentSpy).not.toHaveBeenCalled();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('does nothing if recording attachment is not generated on stop', async () => {
      const {
        channel,
        result: {
          current: { completeRecording, recorder },
        },
      } = await render({ handleSubmit });
      const uploadAttachmentSpy = jest.spyOn(
        channel.messageComposer.attachmentManager,
        'uploadAttachment',
      );
      const recorderStopSpy = jest.spyOn(recorder, 'stop').mockResolvedValue(undefined);
      const recorderCleanUpSpy = jest
        .spyOn(recorder, 'cleanUp')
        .mockResolvedValue(undefined);
      await completeRecording();
      expect(recorderStopSpy).toHaveBeenCalledWith();
      expect(recorderCleanUpSpy).not.toHaveBeenCalledWith();
      expect(uploadAttachmentSpy).not.toHaveBeenCalled();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('uploads and submits the attachment', async () => {
      const generatedVoiceRecording = generateVoiceRecordingAttachment();
      const {
        channel,
        result: {
          current: { completeRecording, recorder },
        },
      } = await render({ handleSubmit });
      const uploadAttachmentSpy = jest.spyOn(
        channel.messageComposer.attachmentManager,
        'uploadAttachment',
      );
      jest.spyOn(recorder, 'stop').mockResolvedValue(generatedVoiceRecording);
      const recorderCleanUpSpy = jest
        .spyOn(recorder, 'cleanUp')
        .mockResolvedValue(undefined);
      await act(() => {
        completeRecording();
      });
      expect(uploadAttachmentSpy).toHaveBeenCalledWith(generatedVoiceRecording);
      expect(handleSubmit).toHaveBeenCalledWith();
      expect(recorderCleanUpSpy).toHaveBeenCalledWith();
    });

    it('uploads but does not submit the attachment if multiple async messages enabled', async () => {
      const generatedVoiceRecording = generateVoiceRecordingAttachment();
      const {
        channel,
        result: {
          current: { completeRecording, recorder },
        },
      } = await render({
        asyncMessagesMultiSendEnabled: true,
        handleSubmit,
      });
      const uploadAttachmentSpy = jest.spyOn(
        channel.messageComposer.attachmentManager,
        'uploadAttachment',
      );
      jest.spyOn(recorder, 'stop').mockResolvedValue(generatedVoiceRecording);
      const recorderCleanUpSpy = jest
        .spyOn(recorder, 'cleanUp')
        .mockResolvedValue(undefined);
      await act(() => {
        completeRecording();
      });
      expect(uploadAttachmentSpy).toHaveBeenCalledWith(generatedVoiceRecording);
      expect(handleSubmit).not.toHaveBeenCalled();
      expect(recorderCleanUpSpy).toHaveBeenCalledWith();
    });
  });
});

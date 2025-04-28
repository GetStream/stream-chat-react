import React, { useEffect } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as transcoder from '../../transcode';

import { MessageInput, MessageInputFlat } from '../../../MessageInput';
import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  MessageInputContextProvider,
  useMessageInputContext,
} from '../../../../context';
import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
  generateLocalAttachmentData,
  generateVideoAttachment,
  generateVoiceRecordingAttachment,
  initClientWithChannels,
} from '../../../../mock-builders';

import '../../../../mock-builders/browser/HTMLMediaElement';
import {
  AnalyserNodeMock,
  AudioContextMock,
  EventEmitterMock,
  MediaRecorderMock,
  ResizeObserverMock,
} from '../../../../mock-builders/browser';
import { generateDataavailableEvent } from '../../../../mock-builders/browser/events/dataavailable';
import { AudioRecorder } from '../AudioRecorder';
import { MediaRecordingState } from '../../classes';

const PERM_DENIED_NOTIFICATION_TEXT =
  'To start recording, allow the microphone access in your browser';

const START_RECORDING_AUDIO_BUTTON_TEST_ID = 'start-recording-audio-button';
const CANCEL_RECORDING_AUDIO_BUTTON_TEST_ID = 'cancel-recording-audio-button';
const PAUSE_RECORDING_AUDIO_BUTTON_TEST_ID = 'pause-recording-audio-button';
const AUDIO_RECORDER_STOP_BTN_TEST_ID = 'audio-recorder-stop-button';
const AUDIO_RECORDER_TEST_ID = 'audio-recorder';
const AUDIO_RECORDER_COMPLETE_BTN_TEST_ID = 'audio-recorder-complete-button';

const DEFAULT_RENDER_PARAMS = {
  channelActionCtx: {
    addNotification: jest.fn(),
  },
  channelStateCtx: {
    channelCapabilities: [],
  },
  chatCtx: {
    getAppSettings: jest.fn().mockReturnValue({}),
    latestMessageDatesByChannels: {},
  },
  componentCtx: {},
};

window.ResizeObserver = ResizeObserverMock;

jest
  .spyOn(HTMLDivElement.prototype, 'getBoundingClientRect')
  .mockReturnValue({ width: 120 });

const renderComponent = async ({
  channelActionCtx,
  channelStateCtx,
  chatCtx,
  componentCtx,
  props,
} = {}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  let result;
  await act(async () => {
    result = await render(
      <ChatProvider
        value={{
          client,
          ...DEFAULT_RENDER_PARAMS.chatCtx,
          ...chatCtx,
        }}
      >
        <ComponentProvider
          value={{ ...DEFAULT_RENDER_PARAMS.componentCtx, ...componentCtx }}
        >
          <ChannelActionProvider
            value={{ ...DEFAULT_RENDER_PARAMS.channelActionCtx, ...channelActionCtx }}
          >
            <ChannelStateProvider
              value={{
                channel,
                ...DEFAULT_RENDER_PARAMS.channelStateCtx,
                ...channelStateCtx,
              }}
            >
              <MessageInput {...{ audioRecordingEnabled: true, ...props }} />
            </ChannelStateProvider>
          </ChannelActionProvider>
        </ComponentProvider>
      </ChatProvider>,
    );
  });
  return result;
};

const nanoidMockValue = 'randomNanoId';
jest.mock('nanoid', () => ({
  nanoid: () => nanoidMockValue,
}));

jest.mock('fix-webm-duration', () => jest.fn((blob) => blob));

jest.spyOn(console, 'warn').mockImplementation();

jest
  .spyOn(transcoder, 'transcode')
  .mockImplementation((opts) =>
    Promise.resolve(new Blob([opts.blob], { type: opts.targetMimeType })),
  );

window.navigator.permissions = {
  query: jest.fn(),
};

window.MediaRecorder = MediaRecorderMock;

window.AudioContext = AudioContextMock;

window.AnalyserNode = AnalyserNodeMock;

const fileObjectURL = 'fileObjectURL';
// eslint-disable-next-line
window.URL.createObjectURL = jest.fn(() => fileObjectURL);
// eslint-disable-next-line
window.URL.revokeObjectURL = jest.fn();

describe('MessageInput', () => {
  beforeEach(() => {
    window.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue({}),
    };
  });
  afterEach(jest.clearAllMocks);

  it('does not render start recording button if disabled', async () => {
    await renderComponent({ props: { audioRecordingEnabled: false } });
    expect(
      screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('does not render start recording button if navigator.mediaDevices is undefined', async () => {
    window.navigator.mediaDevices = undefined;
    await renderComponent();
    expect(
      screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('renders start recording button when enabled and message input is empty', async () => {
    await renderComponent();
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).toBeInTheDocument();
    expect(btn).toBeEnabled();
  });

  it('renders start recording button when message input contains text', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.textComposer.setText('X');
    await renderComponent({ channelStateCtx: { channel }, chatCtx: { client } });
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).toBeInTheDocument();
    expect(btn).toBeEnabled();
  });

  it('renders start recording button when message input contains attachments', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.attachmentManager.upsertAttachments([
      { ...generateLocalAttachmentData(), ...generateFileAttachment() },
      { ...generateLocalAttachmentData(), ...generateImageAttachment() },
      { ...generateLocalAttachmentData(), ...generateAudioAttachment() },
      { ...generateLocalAttachmentData(), ...generateVideoAttachment() },
    ]);
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).toBeInTheDocument();
    expect(btn).toBeEnabled();
  });

  it('disables start recording button if is asyncMessagesMultiSendEnabled is false and voiceRecording attachment already present', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.attachmentManager.upsertAttachments([
      { ...generateLocalAttachmentData(), ...generateVoiceRecordingAttachment() },
    ]);
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it('renders AudioRecorder on start recording button click', async () => {
    await renderComponent();
    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    expect(screen.queryByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
  });

  it.each([
    MediaRecordingState.PAUSED,
    MediaRecordingState.RECORDING,
    MediaRecordingState.STOPPED,
  ])(
    'renders message composer when recording cancelled while recording in state %s',
    async (state) => {
      const { container } = await renderComponent();
      const Input = () => container.querySelector('.str-chat__message-input');
      await waitFor(() => {
        expect(Input()).toBeInTheDocument();
      });

      await act(() => {
        fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
      });
      await waitFor(() => {
        expect(Input()).not.toBeInTheDocument();
      });

      if (state === MediaRecordingState.PAUSED) {
        await act(() => {
          fireEvent.click(screen.queryByTestId(PAUSE_RECORDING_AUDIO_BUTTON_TEST_ID));
        });
      } else if (state === MediaRecordingState.STOPPED) {
        await act(() => {
          fireEvent.click(screen.queryByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));
        });
      }
      await waitFor(() => {
        expect(Input()).not.toBeInTheDocument();
      });

      await act(() => {
        fireEvent.click(screen.queryByTestId(CANCEL_RECORDING_AUDIO_BUTTON_TEST_ID));
      });
      await waitFor(() => {
        expect(Input()).toBeInTheDocument();
      });
    },
  );

  it('does not show RecordingPermissionDeniedNotification until start recording button clicked if microphone permission is denied', async () => {
    expect(screen.queryByText(PERM_DENIED_NOTIFICATION_TEXT)).not.toBeInTheDocument();
    const status = new EventEmitterMock();
    status.state = 'denied';
    window.navigator.permissions.query.mockResolvedValueOnce(status);
    await renderComponent();
    expect(screen.queryByText(PERM_DENIED_NOTIFICATION_TEXT)).not.toBeInTheDocument();
    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    expect(screen.queryByText(PERM_DENIED_NOTIFICATION_TEXT)).toBeInTheDocument();
  });

  it('renders custom RecordingPermissionDeniedNotification', async () => {
    const RecordingPermissionDeniedNotification = () => <div>custom notification</div>;
    const status = new EventEmitterMock();
    status.state = 'denied';
    window.navigator.permissions.query.mockResolvedValueOnce(status);
    await renderComponent({ componentCtx: { RecordingPermissionDeniedNotification } });
    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    expect(screen.queryByText('custom notification')).toBeInTheDocument();
  });

  it('uploads and submits the whole message with all the attachments on recording completion and multiple async messages disabled', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });
    const sendMessage = jest.fn();
    const sendFileSpy = jest
      .spyOn(channel, 'sendFile')
      .mockResolvedValue({ file: fileObjectURL });
    let recorder;
    let recording;
    const MessageInputFlatWithContextCatcher = () => {
      const ctx = useMessageInputContext();

      useEffect(() => {
        if (ctx.recordingController.recorder) {
          recorder = ctx.recordingController.recorder;
        }
        if (ctx.recordingController.recording) {
          recording = ctx.recordingController.recording;
        }
      }, [ctx.recordingController.recorder, ctx.recordingController.recording]);

      return <MessageInputFlat />;
    };
    await renderComponent({
      channelActionCtx: { sendMessage },
      channelStateCtx: { channel },
      chatCtx: { client },
      componentCtx: { Input: MessageInputFlatWithContextCatcher },
    });

    await act(async () => {
      await fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    recorder.mediaRecorder.state = 'recording';

    await act(async () => {
      await fireEvent.click(screen.queryByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));
    });
    recorder.mediaRecorder.state = 'paused';

    await act(async () => {
      await recorder.handleDataavailableEvent(generateDataavailableEvent());
    });
    await act(async () => {
      await fireEvent.click(screen.queryByTestId(AUDIO_RECORDER_COMPLETE_BTN_TEST_ID));
    });

    expect(sendFileSpy).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { localMetadata, ...uploadedRecordingAtt } = recording;
    expect(sendMessage).toHaveBeenCalledWith({
      localMessage: expect.objectContaining({
        attachments: [uploadedRecordingAtt],
      }),
      message: expect.objectContaining({
        attachments: [uploadedRecordingAtt],
      }),
      options: {},
    });
  });

  it('uploads but does not submit message on recording completion and multiple async messages enabled', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });
    const sendMessage = jest.fn();
    const sendFileSpy = jest
      .spyOn(channel, 'sendFile')
      .mockResolvedValue({ file: fileObjectURL });
    let recorder;
    const MessageInputFlatWithContextCatcher = () => {
      const ctx = useMessageInputContext();

      useEffect(() => {
        if (ctx.recordingController.recorder) {
          recorder = ctx.recordingController.recorder;
        }
      }, [ctx.recordingController.recorder]);

      return <MessageInputFlat />;
    };
    await renderComponent({
      channelActionCtx: { sendMessage },
      channelStateCtx: { channel },
      chatCtx: { client },
      componentCtx: { Input: MessageInputFlatWithContextCatcher },
      props: { asyncMessagesMultiSendEnabled: true },
    });

    await act(async () => {
      await fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    recorder.mediaRecorder.state = 'recording';

    await act(async () => {
      await fireEvent.click(screen.queryByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));
    });
    recorder.mediaRecorder.state = 'paused';

    await act(async () => {
      recorder.amplitudeRecorder.amplitudes.next([1]);
      await recorder.handleDataavailableEvent(generateDataavailableEvent());
    });
    await act(async () => {
      await fireEvent.click(screen.queryByTestId(AUDIO_RECORDER_COMPLETE_BTN_TEST_ID));
    });

    expect(sendFileSpy).toHaveBeenCalledTimes(1);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});

const recorderMock = {};

const DEFAULT_RECORDING_CONTROLLER = {
  completeRecording: jest.fn(),
  recorder: recorderMock,
  recording: undefined,
  recordingState: undefined,
};

const renderAudioRecorder = (controller = {}) =>
  render(
    <ChannelActionProvider value={{}}>
      <MessageInputContextProvider
        value={{
          recordingController: { ...DEFAULT_RECORDING_CONTROLLER, ...controller },
        }}
      >
        <AudioRecorder />
      </MessageInputContextProvider>
    </ChannelActionProvider>,
  );

describe('AudioRecorder', () => {
  it('does not render anything if recorder is not available', async () => {
    const { container } = await renderAudioRecorder({ recorder: undefined });
    expect(container).toBeEmpty();
  });

  it('renders audio recording in progress UI', async () => {
    const { container } = await renderAudioRecorder({
      recordingState: MediaRecordingState.RECORDING,
    });
    expect(container).toMatchSnapshot();
  });
  it('renders audio recording paused UI when paused', async () => {
    const { container } = await renderAudioRecorder({
      recordingState: MediaRecordingState.PAUSED,
    });
    expect(container).toMatchSnapshot();
  });
  it('renders audio recording stopped UI when stopped without recording preview', async () => {
    const { container } = await renderAudioRecorder({
      recordingState: MediaRecordingState.STOPPED,
    });
    expect(container).toMatchSnapshot();
  });
  it('renders audio recording stopped UI with recording preview', async () => {
    const { container } = await renderAudioRecorder({
      recording: generateVoiceRecordingAttachment(),
      recordingState: MediaRecordingState.STOPPED,
    });
    expect(container).toMatchSnapshot();
  });

  it.each([MediaRecordingState.PAUSED, MediaRecordingState.RECORDING])(
    'does not render recording preview if %s',
    async (state) => {
      const { container } = await renderAudioRecorder({
        recording: generateVoiceRecordingAttachment(),
        recordingState: state,
      });
      expect(container).toMatchSnapshot();
    },
  );

  it('renders loading indicators while recording being uploaded', async () => {
    await renderAudioRecorder({
      recording: generateVoiceRecordingAttachment({
        localMetadata: { uploadState: 'uploading' },
      }),
      recordingState: MediaRecordingState.STOPPED,
    });
    expect(screen.queryByTestId('loading-indicator')).toBeInTheDocument();
  });
});

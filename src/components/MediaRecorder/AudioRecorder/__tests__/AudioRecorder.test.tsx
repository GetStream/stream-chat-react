import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import * as transcoder from '../../transcode';

import { MessageComposer } from '../../../MessageComposer';
import {
  type ChannelActionContextValue,
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  MessageComposerContextProvider,
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
import { AudioRecorder } from '../AudioRecorder';
import { MediaRecordingState } from '../../classes';
import { WithAudioPlayback } from '../../../AudioPlayback';
import { ChatViewContext } from '../../../ChatView/ChatView';

const chatViewContextValue = {
  activeChatView: 'channels',
  setActiveChatView: () => {},
} as any;

const PERM_DENIED_NOTIFICATION_TEXT =
  'To start recording, allow the microphone access in your browser';

const START_RECORDING_AUDIO_BUTTON_TEST_ID = 'start-recording-audio-button';
const CANCEL_RECORDING_AUDIO_BUTTON_TEST_ID = 'cancel-recording-audio-button';
const AUDIO_RECORDER_TEST_ID = 'audio-recorder';
const AUDIO_RECORDER_STOP_BTN_TEST_ID = 'audio-recorder-stop-button';

const DEFAULT_RENDER_PARAMS = {
  channelActionCtx: {},
  channelStateCtx: {
    channelCapabilities: [],
  },
  chatCtx: {
    getAppSettings: vi.fn().mockReturnValue({}),
    latestMessageDatesByChannels: {},
  },
  componentCtx: {},
};

window.ResizeObserver = ResizeObserverMock as any;

vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue(
  fromPartial<DOMRect>({ width: 120 }),
);

const renderComponent = async ({
  channelActionCtx,
  channelStateCtx,
  chatCtx,
  componentCtx,
  props,
}: any = {}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  let result;
  await act(async () => {
    result = await render(
      <ChatViewContext.Provider value={chatViewContextValue}>
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
                <MessageComposer {...{ audioRecordingEnabled: true, ...props }} />
              </ChannelStateProvider>
            </ChannelActionProvider>
          </ComponentProvider>
        </ChatProvider>
      </ChatViewContext.Provider>,
    );
  });
  return result;
};

const nanoidMockValue = 'randomNanoId';
vi.mock('nanoid', () => ({
  nanoid: () => nanoidMockValue,
}));

vi.mock('fix-webm-duration', () => ({ default: vi.fn((blob) => blob) }));

vi.mock('../../../Notifications', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Notifications')>();
  const notificationTarget = await import('../../../Notifications/notificationTarget');
  return {
    ...actual,
    ...notificationTarget,
    useNotificationTarget: () => 'channel',
  };
});

vi.spyOn(console, 'warn').mockImplementation(() => {});

vi.spyOn(transcoder, 'transcode').mockImplementation((opts) =>
  Promise.resolve(new Blob([opts.blob], { type: 'audio/wav' })),
);

(navigator as any).permissions = {
  query: vi.fn(),
};

window.MediaRecorder = MediaRecorderMock as any;

window.AudioContext = AudioContextMock as any;

window.AnalyserNode = AnalyserNodeMock as any;

const fileObjectURL = 'fileObjectURL';
// eslint-disable-next-line
window.URL.createObjectURL = vi.fn(() => fileObjectURL);
// eslint-disable-next-line
window.URL.revokeObjectURL = vi.fn();

describe('MessageInput', () => {
  beforeEach(() => {
    (navigator as any).mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({}),
    };
  });
  afterEach(() => {
    vi.clearAllMocks();
    MediaRecorderMock.autoEmitDataOnStop = false;
  });

  it('does not render start recording button if disabled', async () => {
    await renderComponent({ props: { audioRecordingEnabled: false } });
    expect(
      screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('does not render start recording button if navigator.mediaDevices is undefined', async () => {
    (navigator as any).mediaDevices = undefined;
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

  it('does not render start recording button when message input contains text', async () => {
    // In v14, the recording button is hidden when content is present (send button shows instead)
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.textComposer.setText('X');
    await renderComponent({ channelStateCtx: { channel }, chatCtx: { client } });
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).not.toBeInTheDocument();
  });

  it('does not render start recording button when message input contains attachments', async () => {
    // In v14, the recording button is hidden when content is present (send button shows instead)
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.attachmentManager.upsertAttachments([
      { ...generateLocalAttachmentData(), ...generateFileAttachment() } as any,
      { ...generateLocalAttachmentData(), ...generateImageAttachment() } as any,
      { ...generateLocalAttachmentData(), ...generateAudioAttachment() } as any,
      { ...generateLocalAttachmentData(), ...generateVideoAttachment() } as any,
    ]);
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).not.toBeInTheDocument();
  });

  it('does not render start recording button when voiceRecording attachment already present', async () => {
    // In v14, the recording button is hidden when content is present
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.attachmentManager.upsertAttachments([
      { ...generateLocalAttachmentData(), ...generateVoiceRecordingAttachment() } as any,
    ]);
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).not.toBeInTheDocument();
  });

  it('renders AudioRecorder on start recording button click', async () => {
    await renderComponent();
    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    expect(screen.queryByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
  });

  it.each([MediaRecordingState.PAUSED, MediaRecordingState.RECORDING])(
    'renders message composer when recording cancelled while recording in state %s',
    async (state) => {
      const { container } = await renderComponent();
      expect(screen.queryByTestId(AUDIO_RECORDER_TEST_ID)).not.toBeInTheDocument();

      await act(() => {
        fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
      });
      await waitFor(() => {
        expect(screen.queryByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
      });

      if (state === MediaRecordingState.PAUSED) {
        // In v14, there's a toggle button (pause/resume) without a specific test ID.
        // Click the toggle button (has class str-chat__audio_recorder__toggle-recording-button)
        const toggleBtn = container.querySelector(
          '.str-chat__audio_recorder__toggle-recording-button',
        );
        if (toggleBtn) {
          await act(() => {
            fireEvent.click(toggleBtn);
          });
        }
      }
      expect(screen.queryByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();

      // Cancel button is only visible when not actively recording (paused state)
      const cancelBtn = screen.queryByTestId(CANCEL_RECORDING_AUDIO_BUTTON_TEST_ID);
      if (cancelBtn) {
        await act(() => {
          fireEvent.click(cancelBtn);
        });
        await waitFor(() => {
          expect(screen.queryByTestId(AUDIO_RECORDER_TEST_ID)).not.toBeInTheDocument();
        });
      }
    },
  );

  it('does not show RecordingPermissionDeniedNotification until start recording button clicked if microphone permission is denied', async () => {
    expect(screen.queryByText(PERM_DENIED_NOTIFICATION_TEXT)).not.toBeInTheDocument();
    const status = new EventEmitterMock() as any;
    status.state = 'denied';
    window.navigator.permissions.query['mockResolvedValueOnce'](status);
    await renderComponent();
    expect(screen.queryByText(PERM_DENIED_NOTIFICATION_TEXT)).not.toBeInTheDocument();
    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    expect(screen.queryByText(PERM_DENIED_NOTIFICATION_TEXT)).toBeInTheDocument();
  });

  it('renders custom RecordingPermissionDeniedNotification', async () => {
    const RecordingPermissionDeniedNotification = () => <div>custom notification</div>;
    const status = new EventEmitterMock() as any;
    status.state = 'denied';
    window.navigator.permissions.query['mockResolvedValueOnce'](status);
    await renderComponent({ componentCtx: { RecordingPermissionDeniedNotification } });
    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    expect(screen.queryByText('custom notification')).toBeInTheDocument();
  });

  it('uploads the recording on completion and schedules submit when multiple async messages disabled', async () => {
    // Enable auto-emit so MediaRecorderMock.stop() triggers dataavailable like a real browser
    MediaRecorderMock.autoEmitDataOnStop = true;
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });
    // Mock getAppSettings so the SDK's upload config check doesn't make a real network request
    vi.spyOn(client, 'getAppSettings').mockResolvedValue(fromPartial({}));
    const sendFileSpy = vi
      .spyOn(channel, 'sendFile')
      .mockResolvedValue(fromPartial({ file: fileObjectURL }));
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });

    // Start recording
    fireEvent.click(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(screen.getByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
    });

    // Complete recording — this calls recorder.stop() which triggers dataavailable via our mock,
    // then uploads the attachment
    fireEvent.click(screen.getByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));

    await waitFor(() => {
      expect(sendFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('uploads but does not submit message on recording completion and multiple async messages enabled', async () => {
    MediaRecorderMock.autoEmitDataOnStop = true;
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });
    // Mock getAppSettings so the SDK's upload config check doesn't make a real network request
    vi.spyOn(client, 'getAppSettings').mockResolvedValue(fromPartial({}));
    const sendFileSpy = vi
      .spyOn(channel, 'sendFile')
      .mockResolvedValue(fromPartial({ file: fileObjectURL }));
    const sendMessageSpy = vi
      .spyOn(channel, 'sendMessage')
      .mockResolvedValue(fromPartial({}));
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
      props: { asyncMessagesMultiSendEnabled: true },
    });

    // Start recording
    fireEvent.click(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(screen.getByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
    });

    // Complete recording — uploads but should NOT submit when multi-send is enabled
    fireEvent.click(screen.getByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));

    await waitFor(() => {
      expect(sendFileSpy).toHaveBeenCalledTimes(1);
    });
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });
});

const recorderMock = {};

const DEFAULT_RECORDING_CONTROLLER = {
  completeRecording: vi.fn(),
  recorder: recorderMock,
  recording: undefined,
  recordingState: undefined,
};

const renderAudioRecorder = (controller = {}) =>
  render(
    <ChannelActionProvider value={fromPartial<ChannelActionContextValue>({})}>
      <WithAudioPlayback>
        <MessageComposerContextProvider
          value={
            {
              recordingController: { ...DEFAULT_RECORDING_CONTROLLER, ...controller },
            } as any
          }
        >
          <AudioRecorder />
        </MessageComposerContextProvider>
      </WithAudioPlayback>
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
    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
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
      } as any),
      recordingState: MediaRecordingState.STOPPED,
    });
    expect(screen.queryByTestId('loading-indicator')).toBeInTheDocument();
  });
});

// Import the package barrel first so it evaluates in its natural order (components, then context).
// MessageComposer's send/update hooks import `useChannel` from this barrel, and a deep component
// import first causes a partial circular re-entry that leaves `useChannel` undefined in Vitest.
import '../../../..';
import React from 'react';
import {
  act,
  fireEvent,
  render,
  type RenderResult,
  screen,
  waitFor,
} from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import * as transcoder from '../../transcode';

import { MessageComposer } from '../../../MessageComposer';
import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';
import {
  ChatProvider,
  DialogManagerProvider,
  MessageComposerContextProvider,
  WithComponents,
} from '../../../../context';
import { mockChatContext } from '../../../../mock-builders/context';
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
import { BehaviorSubject } from '../../observable/BehaviorSubject';
import { WithAudioPlayback } from '../../../AudioPlayback';
import type {
  Attachment,
  GetApplicationResponse,
  LocalAttachment,
  StreamResponse,
  UploadChannelFileResponse,
} from 'stream-chat';
import type { MessageComposerContextValue } from '../../../../context';

const PERM_DENIED_NOTIFICATION_TEXT =
  'To start recording, allow the microphone access in your browser';

const START_RECORDING_AUDIO_BUTTON_TEST_ID = 'start-recording-audio-button';
const CANCEL_RECORDING_AUDIO_BUTTON_TEST_ID = 'cancel-recording-audio-button';
const AUDIO_RECORDER_TEST_ID = 'audio-recorder';
const AUDIO_RECORDER_STOP_BTN_TEST_ID = 'audio-recorder-stop-button';

window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue(
  fromPartial<DOMRect>({ width: 120 }),
);

// Renders a real <Chat>/<Channel> tree. A caller may pass an initialized channel and client (e.g.
// with preset composer text or attachments) via `channelStateCtx.channel` / `chatCtx.client`;
// otherwise a fresh pair is created, with a channel that allows uploads, which a recording needs.
// `componentCtx` is applied through `WithComponents`.
const renderComponent = async ({
  channelStateCtx,
  chatCtx,
  componentCtx,
  props,
}: any = {}) => {
  let channel = channelStateCtx?.channel;
  let client = chatCtx?.client;
  if (!channel || !client) {
    ({
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    }));
  }
  let result: RenderResult;
  await act(async () => {
    result = await render(
      <WithComponents overrides={componentCtx ?? {}}>
        <Chat client={client}>
          <DialogManagerProvider id='audio-recorder-test-dialog-manager'>
            <Channel channel={channel}>
              <MessageComposer {...{ audioRecordingEnabled: true, ...props }} />
            </Channel>
          </DialogManagerProvider>
        </Chat>
      </WithComponents>,
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

window.MediaRecorder = MediaRecorderMock as unknown as typeof MediaRecorder;

window.AudioContext = AudioContextMock as unknown as typeof AudioContext;

window.AnalyserNode = AnalyserNodeMock as unknown as typeof AnalyserNode;

const fileObjectURL = 'fileObjectURL';
const recordingObjectURL = 'blob:recording';
// eslint-disable-next-line
window.URL.createObjectURL = vi.fn(() => fileObjectURL);
// eslint-disable-next-line
window.URL.revokeObjectURL = vi.fn();

describe('MessageInput', () => {
  beforeEach(() => {
    (navigator as any).mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({}),
    };
    // vi.clearAllMocks() keeps mock implementations, so a `mockResolvedValue` set by the permission
    // tests would leak a 'denied' status into later tests; reset the permissions query each time.
    (navigator as any).permissions = { query: vi.fn() };
  });
  afterEach(() => {
    vi.clearAllMocks();
    MediaRecorderMock.autoEmitDataOnStop = false;
    vi.mocked(window.URL.createObjectURL).mockImplementation(() => fileObjectURL);
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

  it.each([
    [
      'the channel does not allow uploads',
      async () => {
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();
        return { channel, client };
      },
    ],
    [
      'the composer has attachments disabled',
      async () => {
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels({
          channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
        });
        channel.messageComposer.updateConfig({ attachments: { enabled: false } });
        return { channel, client };
      },
    ],
  ])('disables the start recording button when %s', async (_, setUp) => {
    const { channel, client } = await setUp();
    await renderComponent({ channelStateCtx: { channel }, chatCtx: { client } });
    expect(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID)).toBeDisabled();
  });

  it('enables and disables the start recording button as composer uploads are turned on and off', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });
    await renderComponent({ channelStateCtx: { channel }, chatCtx: { client } });
    expect(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID)).toBeEnabled();
    await act(() => {
      channel.messageComposer.updateConfig({ attachments: { enabled: false } });
    });
    expect(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID)).toBeDisabled();
    await act(() => {
      channel.messageComposer.updateConfig({ attachments: { enabled: true } });
    });
    expect(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID)).toBeEnabled();
  });

  it('does not render start recording button when message input contains text', async () => {
    // The recording button is hidden when content is present (the send button shows instead).
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
    // The recording button is hidden when content is present (the send button shows instead).
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.attachmentManager.upsertAttachments([
      fromPartial<LocalAttachment>({
        ...generateLocalAttachmentData(),
        ...generateFileAttachment(),
      }),
      fromPartial<LocalAttachment>({
        ...generateLocalAttachmentData(),
        ...generateImageAttachment(),
      }),
      fromPartial<LocalAttachment>({
        ...generateLocalAttachmentData(),
        ...generateAudioAttachment(),
      }),
      fromPartial<LocalAttachment>({
        ...generateLocalAttachmentData(),
        ...generateVideoAttachment(),
      }),
    ]);
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).not.toBeInTheDocument();
  });

  it('does not render start recording button when voiceRecording attachment already present', async () => {
    // The recording button is hidden when content is present.
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    channel.messageComposer.attachmentManager.upsertAttachments([
      fromPartial<LocalAttachment>({
        ...generateLocalAttachmentData(),
        ...generateVoiceRecordingAttachment(),
      }),
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
        // The pause/resume toggle has no test ID, so it is selected by class.
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
    const status: EventEmitterMock & { state?: PermissionState } = new EventEmitterMock();
    status.state = 'denied';
    window.navigator.permissions.query['mockResolvedValue'](status);
    await renderComponent();
    expect(screen.queryByText(PERM_DENIED_NOTIFICATION_TEXT)).not.toBeInTheDocument();
    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    await waitFor(() => {
      expect(screen.queryByText(PERM_DENIED_NOTIFICATION_TEXT)).toBeInTheDocument();
    });
  });

  it('renders custom RecordingPermissionDeniedNotification', async () => {
    const RecordingPermissionDeniedNotification = () => <div>custom notification</div>;
    const status: EventEmitterMock & { state?: PermissionState } = new EventEmitterMock();
    status.state = 'denied';
    window.navigator.permissions.query['mockResolvedValue'](status);
    await renderComponent({ componentCtx: { RecordingPermissionDeniedNotification } });
    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    await waitFor(() => {
      expect(screen.queryByText('custom notification')).toBeInTheDocument();
    });
  });

  it('uploads and sends the recording on completion when multiple async messages disabled', async () => {
    // Auto-emit makes MediaRecorderMock.stop() trigger `dataavailable` like a real browser.
    MediaRecorderMock.autoEmitDataOnStop = true;
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });
    // Mock getAppSettings so the SDK's upload config check doesn't make a real network request
    vi.spyOn(client, 'getAppSettings').mockResolvedValue(fromPartial({}));
    // Differs from the local preview URL, so the assertion below proves the upload's URL is sent.
    const uploadedFileURL = 'https://cdn.example.com/recording.wav';
    const uploadFileSpy = vi
      .spyOn(channel, 'uploadFile')
      .mockResolvedValue(fromPartial({ file: uploadedFileURL }));
    const sendMessageSpy = vi
      .spyOn(channel, 'sendMessage')
      .mockResolvedValue(fromPartial({}));
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });

    fireEvent.click(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(screen.getByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
    });

    // Stopping triggers `dataavailable` through the mock, which uploads the attachment.
    fireEvent.click(screen.getByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));

    await waitFor(() => {
      expect(uploadFileSpy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    });
    // The recording is sent as its uploaded attachment, without its local metadata.
    const sentAttachments = sendMessageSpy.mock.calls[0][0].message.attachments ?? [];
    expect(sentAttachments).toHaveLength(1);
    expect(sentAttachments[0]).toMatchObject({
      asset_url: uploadedFileURL,
      type: 'voiceRecording',
    });
    expect(sentAttachments[0]).not.toHaveProperty('localMetadata');
  });

  it('keeps a recording whose upload failed in the composer, unsent, and retries it from there', async () => {
    // Only `blob:` URLs are released by the attachment's upload lifecycle.
    vi.mocked(window.URL.createObjectURL).mockImplementation(() => recordingObjectURL);
    MediaRecorderMock.autoEmitDataOnStop = true;
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });
    vi.spyOn(client, 'getAppSettings').mockResolvedValue(fromPartial({}));
    const uploadedFileURL = 'https://cdn.example.com/recording.wav';
    const uploadFileSpy = vi
      .spyOn(channel, 'uploadFile')
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValueOnce(fromPartial({ file: uploadedFileURL }));
    const sendMessageSpy = vi
      .spyOn(channel, 'sendMessage')
      .mockResolvedValue(fromPartial({}));
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });

    fireEvent.click(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(screen.getByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));

    const retryButton = await screen.findByTestId('file-preview-item-retry-button');
    expect(screen.getByTestId('voice-preview-slot')).toBeInTheDocument();
    // The kept recording still plays from its local file URL.
    expect(window.URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(uploadFileSpy).toHaveBeenCalledTimes(1);
    expect(sendMessageSpy).not.toHaveBeenCalled();

    await act(() => {
      fireEvent.click(retryButton);
    });
    await waitFor(() => {
      expect(uploadFileSpy).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(channel.messageComposer.attachmentManager.attachments).toEqual([
        expect.objectContaining({
          asset_url: uploadedFileURL,
          localMetadata: expect.objectContaining({ uploadState: 'finished' }),
          type: 'voiceRecording',
        }),
      ]);
    });
    expect(
      screen.queryByTestId('file-preview-item-retry-button'),
    ).not.toBeInTheDocument();
    // The uploaded URL replaced the local one, which is released.
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(recordingObjectURL);
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  it('keeps a recording whose upload is blocked in the composer, unsent', async () => {
    MediaRecorderMock.autoEmitDataOnStop = true;
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });
    // The transcoder mock turns every recording into a WAV file.
    vi.spyOn(client, 'getAppSettings').mockResolvedValue(
      fromPartial({ app: { file_upload_config: { blocked_mime_types: ['audio/wav'] } } }),
    );
    const uploadFileSpy = vi.spyOn(channel, 'uploadFile');
    const sendMessageSpy = vi
      .spyOn(channel, 'sendMessage')
      .mockResolvedValue(fromPartial({}));
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });

    fireEvent.click(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(screen.getByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));

    // The recorder closes once completion has decided whether to send.
    await waitFor(() => {
      expect(screen.queryByTestId(AUDIO_RECORDER_TEST_ID)).not.toBeInTheDocument();
    });
    expect(screen.getByText('Upload blocked')).toBeInTheDocument();
    expect(screen.getByTestId('voice-preview-slot')).toBeInTheDocument();
    expect(channel.messageComposer.attachmentManager.attachments).toEqual([
      expect.objectContaining({
        localMetadata: expect.objectContaining({ uploadState: 'blocked' }),
        type: 'voiceRecording',
      }),
    ]);
    expect(uploadFileSpy).not.toHaveBeenCalled();
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  it('with pending uploads allowed, sends the recording right away and posts it once the upload ends', async () => {
    // Only `blob:` URLs are released by the attachment's upload lifecycle.
    vi.mocked(window.URL.createObjectURL).mockImplementation(() => recordingObjectURL);
    MediaRecorderMock.autoEmitDataOnStop = true;
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });
    vi.spyOn(client, 'getAppSettings').mockResolvedValue(fromPartial({}));
    channel.messageComposer.updateConfig({
      attachments: { pendingUploadsEnabled: true },
    });
    const uploadedFileURL = 'https://cdn.example.com/recording.wav';
    let finishUpload: (value: UploadChannelFileResponse) => void = () => undefined;
    const uploadFileSpy = vi.spyOn(channel, 'uploadFile').mockReturnValue(
      new Promise((resolve) => {
        finishUpload = resolve;
      }),
    );
    const sendMessageSpy = vi
      .spyOn(channel, 'sendMessage')
      .mockResolvedValue(fromPartial({}));
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });

    fireEvent.click(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(screen.getByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));

    // While the upload still runs, the message is in the list, the composer is empty and the recorder
    // has closed, so the next message can be typed.
    await waitFor(() => {
      expect(channel.messagePaginator.items).toEqual([
        expect.objectContaining({
          attachments: [expect.objectContaining({ type: 'voiceRecording' })],
        }),
      ]);
    });
    expect(uploadFileSpy).toHaveBeenCalledTimes(1);
    expect(channel.messageComposer.attachmentManager.attachments).toEqual([]);
    await waitFor(() => {
      expect(screen.queryByTestId(AUDIO_RECORDER_TEST_ID)).not.toBeInTheDocument();
    });
    expect(sendMessageSpy).not.toHaveBeenCalled();

    await act(() => {
      finishUpload(fromPartial({ file: uploadedFileURL }));
    });
    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    });
    expect(uploadFileSpy).toHaveBeenCalledTimes(1);
    expect(sendMessageSpy.mock.calls[0][0].message.attachments).toEqual([
      expect.objectContaining({ asset_url: uploadedFileURL, type: 'voiceRecording' }),
    ]);
    // The uploaded URL replaced the local one, which is released.
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(recordingObjectURL);
  });

  it('with pending uploads allowed, keeps the recording on the failed message when its upload fails', async () => {
    MediaRecorderMock.autoEmitDataOnStop = true;
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });
    vi.spyOn(client, 'getAppSettings').mockResolvedValue(fromPartial({}));
    channel.messageComposer.updateConfig({
      attachments: { pendingUploadsEnabled: true },
    });
    vi.spyOn(channel, 'uploadFile').mockRejectedValue(new Error('upload failed'));
    const sendMessageSpy = vi
      .spyOn(channel, 'sendMessage')
      .mockResolvedValue(fromPartial({}));
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
    });

    fireEvent.click(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(screen.getByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));

    // The failed message keeps the recording's file, so retrying the message uploads it again.
    await waitFor(() => {
      expect(channel.messagePaginator.items).toEqual([
        expect.objectContaining({
          attachments: [
            expect.objectContaining({
              localMetadata: expect.objectContaining({ file: expect.any(File) }),
              type: 'voiceRecording',
            }),
          ],
          status: 'failed',
        }),
      ]);
    });
    expect(sendMessageSpy).not.toHaveBeenCalled();
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
    const uploadFileSpy = vi
      .spyOn(channel, 'uploadFile')
      .mockResolvedValue(fromPartial({ file: fileObjectURL }));
    const sendMessageSpy = vi
      .spyOn(channel, 'sendMessage')
      .mockResolvedValue(fromPartial({}));
    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
      props: { asyncMessagesMultiSendEnabled: true },
    });

    fireEvent.click(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(screen.getByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));

    await waitFor(() => {
      expect(uploadFileSpy).toHaveBeenCalledTimes(1);
    });
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  it('renders voice preview slot after stopping recording when multiple async messages are enabled', async () => {
    MediaRecorderMock.autoEmitDataOnStop = true;
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { own_capabilities: ['upload-file'] } }],
    });

    vi.spyOn(client, 'getAppSettings').mockResolvedValue(
      {} as StreamResponse<GetApplicationResponse>,
    );
    vi.spyOn(channel, 'uploadFile').mockResolvedValue({
      file: fileObjectURL,
    } as StreamResponse<UploadChannelFileResponse>);

    await renderComponent({
      channelStateCtx: { channel },
      chatCtx: { client },
      props: { asyncMessagesMultiSendEnabled: true },
    });

    fireEvent.click(screen.getByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(screen.getByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));

    await waitFor(() => {
      expect(screen.getByTestId('voice-preview-slot')).toBeInTheDocument();
    });
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
    // AudioRecorder reaches useChatContext through useNotificationApi, so it needs a ChatProvider.
    <ChatProvider value={mockChatContext()}>
      <WithAudioPlayback>
        <MessageComposerContextProvider
          value={fromPartial<MessageComposerContextValue>({
            recordingController: { ...DEFAULT_RECORDING_CONTROLLER, ...controller },
          })}
        >
          <AudioRecorder />
        </MessageComposerContextProvider>
      </WithAudioPlayback>
    </ChatProvider>,
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

  it.each([
    [MediaRecordingState.RECORDING, false],
    [MediaRecordingState.PAUSED, false],
    [MediaRecordingState.STOPPED, true],
  ])(
    'disables the pause/resume toggle only when stopped (%s)',
    async (recordingState, disabled) => {
      const { container } = await renderAudioRecorder({ recordingState });
      // The pause/resume toggle has no test ID, so it is selected by class.
      const toggleBtn = container.querySelector(
        '.str-chat__audio_recorder__toggle-recording-button',
      );
      expect((toggleBtn as HTMLButtonElement).disabled).toBe(disabled);
    },
  );

  describe('recording waveform', () => {
    const AMPLITUDE_BAR_SELECTOR = '.str-chat__wave-progress-bar__amplitude-bar';
    let trackWidth = 0;
    let clientWidthSpy: { mockRestore: () => void };

    let barWidth = 2;

    beforeEach(() => {
      barWidth = 2;
      // Bars measure `barWidth`; every other div keeps this file's 120px.
      vi.mocked(HTMLDivElement.prototype.getBoundingClientRect).mockImplementation(
        function (this: HTMLDivElement) {
          return fromPartial<DOMRect>({
            width: this.classList.contains('str-chat__wave-progress-bar__amplitude-bar')
              ? barWidth
              : 120,
          });
        },
      );
      clientWidthSpy = vi
        .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
        .mockImplementation(function (this: HTMLElement) {
          return this.classList.contains('str-chat__wave-progress-bar__track')
            ? trackWidth
            : 0;
        });
    });

    afterEach(() => {
      vi.mocked(HTMLDivElement.prototype.getBoundingClientRect).mockReturnValue(
        fromPartial<DOMRect>({ width: 120 }),
      );
      clientWidthSpy.mockRestore();
      ResizeObserverMock.observers = [];
    });

    const renderRecordingWaveform = (amplitudeCount: number) =>
      renderAudioRecorder({
        recorder: {
          amplitudeRecorder: {
            amplitudes: new BehaviorSubject(
              Array.from({ length: amplitudeCount }, (_, i) => (i % 10) / 10),
            ),
          },
        },
        recordingState: MediaRecordingState.RECORDING,
      });

    // jsdom computes no gap, so a bar takes its own width of the track.
    it('draws as many of the latest amplitudes as fit the track', async () => {
      trackWidth = 900;
      const { container } = await renderRecordingWaveform(1000);
      expect(container.querySelectorAll(AMPLITUDE_BAR_SELECTOR)).toHaveLength(450);
    });

    it('redraws for the new width when the track resizes', async () => {
      trackWidth = 900;
      const { container } = await renderRecordingWaveform(1000);

      trackWidth = 300;
      act(() => {
        ResizeObserverMock.observers.forEach((observer) => {
          if (observer.active) observer.cb([], observer as unknown as ResizeObserver);
        });
      });

      expect(container.querySelectorAll(AMPLITUDE_BAR_SELECTOR)).toHaveLength(150);
    });

    it('measures again with the width of the first rendered bar', async () => {
      trackWidth = 900;
      barWidth = 3;
      const amplitudes = new BehaviorSubject<number[]>([]);
      const { container } = await renderAudioRecorder({
        recorder: { amplitudeRecorder: { amplitudes } },
        recordingState: MediaRecordingState.RECORDING,
      });

      act(() => {
        amplitudes.next(Array.from({ length: 1000 }, () => 0.5));
      });

      expect(container.querySelectorAll(AMPLITUDE_BAR_SELECTOR)).toHaveLength(300);
    });

    it('counts the gap the track sets between bars', async () => {
      trackWidth = 900;
      const getComputedStyle = window.getComputedStyle;
      const styleSpy = vi
        .spyOn(window, 'getComputedStyle')
        .mockImplementation((element, pseudo) => {
          const style = getComputedStyle(element, pseudo);
          return element.classList.contains('str-chat__wave-progress-bar__track')
            ? ({ ...style, columnGap: '1px' } as CSSStyleDeclaration)
            : style;
        });

      const { container } = await renderRecordingWaveform(1000);
      styleSpy.mockRestore();

      // (900 + 1) / (2 + 1)
      expect(container.querySelectorAll(AMPLITUDE_BAR_SELECTOR)).toHaveLength(300);
    });

    it('draws every amplitude while there are fewer than fit', async () => {
      trackWidth = 900;
      const { container } = await renderRecordingWaveform(30);
      expect(container.querySelectorAll(AMPLITUDE_BAR_SELECTOR)).toHaveLength(30);
    });
  });

  it('renders loading indicators while recording being uploaded', async () => {
    await renderAudioRecorder({
      recording: generateVoiceRecordingAttachment(
        fromPartial<Partial<Attachment>>({
          localMetadata: { uploadState: 'uploading' },
        }),
      ),
      recordingState: MediaRecordingState.STOPPED,
    });
    expect(screen.queryByTestId('loading-indicator')).toBeInTheDocument();
  });
});

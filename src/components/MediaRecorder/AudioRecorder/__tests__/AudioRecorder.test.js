import React, { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as transcoder from '../../transcode';

import { MessageInput, MessageInputFlat } from '../../../MessageInput';
import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  useMessageInputContext,
} from '../../../../context';
import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
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
} from '../../../../mock-builders/browser';
import { generateDataavailableEvent } from '../../../../mock-builders/browser/events/dataavailable';

const PERM_DENIED_NOTIFICATION_TEXT =
  'To start recording, allow the {{name}} access in your browser';
const CSS_THEME_VERSION = '2';

const START_RECORDING_AUDIO_BUTTON_TEST_ID = 'start-recording-audio-button';
const AUDIO_RECORDER_TEST_ID = 'audio-recorder';
const AUDIO_RECORDER_STOP_BTN_TEST_ID = 'audio-recorder-stop-button';
const AUDIO_RECORDER_COMPLETE_BTN_TEST_ID = 'audio-recorder-complete-button';

const DEFAULT_RENDER_PARAMS = {
  channelActionCtx: {
    addNotification: jest.fn(),
  },
  channelStateCtx: {},
  chatCtx: {
    getAppSettings: jest.fn().mockReturnValue({}),
    latestMessageDatesByChannels: {},
  },
  componentCtx: {},
};

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
  return render(
    <ChatProvider
      value={{
        ...{ client, ...DEFAULT_RENDER_PARAMS.chatCtx, ...chatCtx },
        themeVersion: CSS_THEME_VERSION,
      }}
    >
      <ComponentProvider value={{ ...DEFAULT_RENDER_PARAMS.componentCtx, ...componentCtx }}>
        <ChannelActionProvider
          value={{ ...DEFAULT_RENDER_PARAMS.channelActionCtx, ...channelActionCtx }}
        >
          <ChannelStateProvider
            value={{ channel, ...DEFAULT_RENDER_PARAMS.channelStateCtx, ...channelStateCtx }}
          >
            <MessageInput {...{ audioRecordingEnabled: true, ...props }} />
          </ChannelStateProvider>
        </ChannelActionProvider>
      </ComponentProvider>
    </ChatProvider>,
  );
};

const nanoidMockValue = 'randomNanoId';
jest.mock('nanoid', () => ({
  nanoid: () => nanoidMockValue,
}));

jest.mock('fix-webm-duration', () => jest.fn((blob) => blob));

jest
  .spyOn(transcoder, 'transcode')
  .mockImplementation((opts) =>
    Promise.resolve(new Blob([opts.blob], { type: opts.targetMimeType })),
  );

window.navigator.permissions = {
  query: jest.fn(),
};

// eslint-disable-next-line
window.MediaRecorder = MediaRecorderMock;

// eslint-disable-next-line
window.AudioContext = AudioContextMock;

// eslint-disable-next-line
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
    expect(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it('does not render start recording button if navigator.mediaDevices is undefined', async () => {
    window.navigator.mediaDevices = undefined;
    await renderComponent();
    expect(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it('renders start recording button when enabled and message input is empty', async () => {
    await renderComponent();
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).toBeInTheDocument();
    expect(btn).toBeEnabled();
  });

  it('renders start recording button when message input contains text', async () => {
    await renderComponent({ props: { message: { text: 'X' } } });
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).toBeInTheDocument();
    expect(btn).toBeEnabled();
  });

  it('renders start recording button when message input contains attachments', async () => {
    await renderComponent({
      props: {
        attachments: [
          generateFileAttachment(),
          generateImageAttachment(),
          generateAudioAttachment(),
          generateVideoAttachment(),
        ],
        message: { text: 'X' },
      },
    });
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).toBeInTheDocument();
    expect(btn).toBeEnabled();
  });

  it('disables start recording button if is asyncMessagesMultiSendEnabled is false and voiceRecording attachment already present', async () => {
    await renderComponent({
      props: {
        attachments: [generateVoiceRecordingAttachment()],
        message: { text: 'X' },
      },
    });
    const btn = screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID);
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it('renders AudioRecorder on start recording button click', async () => {
    await act(async () => {
      await renderComponent();
    });
    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    expect(screen.queryByTestId(AUDIO_RECORDER_TEST_ID)).toBeInTheDocument();
  });

  it('does not show RecordingPermissionDeniedNotification until start recording button clicked if microphone permission is denied', async () => {
    expect(screen.queryByText(PERM_DENIED_NOTIFICATION_TEXT)).not.toBeInTheDocument();
    const status = new EventEmitterMock();
    status.state = 'denied';
    window.navigator.permissions.query.mockResolvedValueOnce(status);
    await act(async () => {
      await renderComponent();
    });
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
    await act(async () => {
      await renderComponent({ componentCtx: { RecordingPermissionDeniedNotification } });
    });
    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    expect(screen.queryByText('custom notification')).toBeInTheDocument();
  });

  it.todo(
    'uploads and submits the whole message with all the attachments on recording completion and multiple async messages disabled',
  );

  it('uploads but does not submit message on recording completion and multiple async messages enabled', async () => {
    const sendMessage = jest.fn();
    const doFileUploadRequest = jest.fn().mockResolvedValue({ file: fileObjectURL });
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
    await act(async () => {
      await renderComponent({
        channelActionCtx: { sendMessage },
        componentCtx: { Input: MessageInputFlatWithContextCatcher },
        props: { asyncMessagesMultiSendEnabled: true, doFileUploadRequest },
      });
    });

    await act(() => {
      fireEvent.click(screen.queryByTestId(START_RECORDING_AUDIO_BUTTON_TEST_ID));
    });
    recorder.mediaRecorder.state = 'recording';

    await act(() => {
      fireEvent.click(screen.queryByTestId(AUDIO_RECORDER_STOP_BTN_TEST_ID));
    });
    recorder.mediaRecorder.state = 'paused';

    await act(async () => {
      recorder.amplitudeRecorder.amplitudes.next([1]);
      await recorder.handleDataavailableEvent(generateDataavailableEvent());
    });
    await act(() => {
      fireEvent.click(screen.queryByTestId(AUDIO_RECORDER_COMPLETE_BTN_TEST_ID));
    });

    expect(doFileUploadRequest).toHaveBeenCalledTimes(1);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
describe('AudioRecorder', () => {
  it.todo('does not render anything if recorder is not available');
  it.todo('renders audio recording in progress UI');
  it.todo('renders audio recording paused UI when paused');
  it.todo('renders audio recording in progress UI when recording resumed');
  it.todo('renders audio recording stopped UI when stopped');
  it.todo('renders message composer when recording cancelled while recording');
  it.todo('renders message composer when recording cancelled while paused');
  it.todo('renders message composer when recording cancelled while stopped');
  it.todo('renders loading indicators while recording being uploaded');
});

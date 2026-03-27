import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import {
  generateMessage,
  generateVoiceRecordingAttachment,
  mockChatContext,
  mockMessageContext,
} from '../../../mock-builders';
import { VoiceRecording, VoiceRecordingPlayer } from '../VoiceRecording';
import { ChatProvider, MessageProvider } from '../../../context';
import { ResizeObserverMock } from '../../../mock-builders/browser';
import { WithAudioPlayback } from '../../AudioPlayback';

vi.mock('../../Notifications', () => ({
  useNotificationTarget: () => 'channel',
}));

const AUDIO_RECORDING_PLAYER_TEST_ID = 'voice-recording-widget';
const QUOTED_AUDIO_RECORDING_TEST_ID = 'quoted-voice-recording-widget';

const attachment = generateVoiceRecordingAttachment();

(window as any).ResizeObserver = ResizeObserverMock;

vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue(
  fromPartial<DOMRect>({
    width: 120,
  }),
);

const clickPlay = async () => {
  await act(async () => {
    await fireEvent.click(screen.queryByTestId('play-audio'));
  });
};

vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() =>
  Promise.resolve(),
);
vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

const renderComponent = (props, VoiceRecordingComponent = VoiceRecording) =>
  render(
    <ChatProvider value={mockChatContext()}>
      <WithAudioPlayback>
        <VoiceRecordingComponent {...props} />
      </WithAudioPlayback>
    </ChatProvider>,
  );

describe('VoiceRecording', () => {
  it('should be rendered with player if not quoted', () => {
    const { queryByTestId } = renderComponent({ attachment });
    expect(queryByTestId(AUDIO_RECORDING_PLAYER_TEST_ID)).toBeInTheDocument();
    expect(queryByTestId(QUOTED_AUDIO_RECORDING_TEST_ID)).not.toBeInTheDocument();
  });
  it('should be rendered without player if quoted', () => {
    const { queryByTestId } = renderComponent({ attachment, isQuoted: true });
    expect(queryByTestId(QUOTED_AUDIO_RECORDING_TEST_ID)).toBeInTheDocument();
    expect(queryByTestId(AUDIO_RECORDING_PLAYER_TEST_ID)).not.toBeInTheDocument();
  });
  it('differentiates between in thread and in channel audio player', () => {
    const createdAudios = []; //HTMLAudioElement[]
    const RealAudio = window.Audio;
    const spy = vi.spyOn(window, 'Audio').mockImplementation(function AudioMock(...args) {
      const el = new RealAudio(...args);
      createdAudios.push(el);
      return el;
    });
    const message = generateMessage();
    render(
      <WithAudioPlayback>
        <MessageProvider value={mockMessageContext({ message })}>
          <VoiceRecording attachment={attachment} />
        </MessageProvider>
        <MessageProvider value={mockMessageContext({ message, threadList: true })}>
          <VoiceRecording attachment={attachment} />
        </MessageProvider>
      </WithAudioPlayback>,
    );
    expect(createdAudios).toHaveLength(2);
    spy.mockRestore();
  });

  it('keeps a single copy of audio player for the same requester', () => {
    const createdAudios = []; //HTMLAudioElement[]
    const RealAudio = window.Audio;
    const spy = vi.spyOn(window, 'Audio').mockImplementation(function AudioMock(...args) {
      const el = new RealAudio(...args);
      createdAudios.push(el);
      return el;
    });
    const message = generateMessage();
    render(
      <WithAudioPlayback>
        <MessageProvider value={mockMessageContext({ message })}>
          <VoiceRecording attachment={attachment} />
        </MessageProvider>
        <MessageProvider value={mockMessageContext({ message })}>
          <VoiceRecording attachment={attachment} />
        </MessageProvider>
        <MessageProvider value={mockMessageContext({ message })}>
          <VoiceRecording attachment={attachment} isQuoted={true} />
        </MessageProvider>
      </WithAudioPlayback>,
    );
    expect(createdAudios).toHaveLength(1);
    spy.mockRestore();
  });
});

describe('VoiceRecordingPlayer', () => {
  beforeAll(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(window.HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
  });
  afterAll(vi.clearAllMocks);

  it('should not render the component if asset_url is missing', () => {
    const { container } = renderComponent({
      attachment: { ...attachment, asset_url: undefined },
    });
    expect(container).toBeEmptyDOMElement();
  });
  it('should render the player widget', () => {
    const { queryByTestId } = renderComponent({ attachment });
    expect(queryByTestId('voice-recording-widget')).toBeInTheDocument();
  });

  it('should fallback to file size, if duration is not available', () => {
    const { getByTestId } = renderComponent({
      attachment: { ...attachment, duration: undefined, file_size: 60 * 1024 },
    });
    expect(getByTestId('file-size-indicator')).toHaveTextContent('60 kB');
  });
  it('should render play button when not playing', () => {
    const { queryByTestId } = renderComponent({ attachment });
    expect(queryByTestId('play-audio')).toBeInTheDocument();
    expect(queryByTestId('pause-audio')).not.toBeInTheDocument();
  });
  it('should render pause button when playing', async () => {
    const { queryByTestId } = renderComponent({ attachment });
    await clickPlay();
    expect(queryByTestId('play-audio')).not.toBeInTheDocument();
    expect(queryByTestId('pause-audio')).toBeInTheDocument();
  });
  it('should render playback rate button', () => {
    const { queryByTestId } = renderComponent({ attachment });
    expect(queryByTestId('playback-rate-button')).toBeInTheDocument();
    expect(queryByTestId('playback-rate-button')).toHaveTextContent('x1');
  });
  it('should use custom playback rates', () => {
    const { queryByTestId } = renderComponent(
      {
        attachment: { ...attachment },
        playbackRates: [2.5, 3.0],
      },
      VoiceRecordingPlayer,
    );
    expect(queryByTestId('playback-rate-button')).toBeInTheDocument();
    expect(queryByTestId('playback-rate-button')).toHaveTextContent('x2.5');
  });
  it('should switch playback rates in round robin', () => {
    const { queryByTestId } = renderComponent(
      {
        attachment: { ...attachment },
        playbackRates: [2.5, 3.0],
      },
      VoiceRecordingPlayer,
    );
    const playbackRateButton = queryByTestId('playback-rate-button');
    expect(playbackRateButton).toBeInTheDocument();
    expect(playbackRateButton).toHaveTextContent('x2.5');
    act(() => {
      fireEvent.click(playbackRateButton);
    });
    expect(playbackRateButton).toHaveTextContent('x3');
    act(() => {
      fireEvent.click(playbackRateButton);
    });
    expect(playbackRateButton).toHaveTextContent('x2.5');
  });

  it('should update progress on timeupdate', async () => {
    const createdAudios = []; // HTMLAudioElement[]

    const RealAudio = window.Audio;
    const constructorSpy = vi
      .spyOn(window, 'Audio')
      .mockImplementation(function AudioMock(...args) {
        const el = new RealAudio(...args);
        createdAudios.push(el);
        return el;
      });

    renderComponent({ attachment });
    await clickPlay();

    // Find the actual playing audio element (last created)
    const actualPlayingAudio = createdAudios[createdAudios.length - 1];
    vi.spyOn(actualPlayingAudio, 'duration', 'get').mockReturnValue(100);
    vi.spyOn(actualPlayingAudio, 'currentTime', 'get').mockReturnValue(50);
    fireEvent.timeUpdate(actualPlayingAudio);

    await waitFor(() => {
      expect(
        screen.getByTestId('wave-progress-bar-progress-indicator'),
      ).toBeInTheDocument();
    });

    constructorSpy.mockRestore();
  });
});

describe('QuotedVoiceRecording', () => {
  it('should render the component', () => {
    const { queryByTestId } = renderComponent({
      attachment,
      isQuoted: true,
    });
    expect(queryByTestId('quoted-voice-recording-widget')).toBeInTheDocument();
    expect(queryByTestId('file-size-indicator')).not.toBeInTheDocument();
  });
  it('should render duration when available', () => {
    const { queryByTestId } = renderComponent({
      attachment,
      isQuoted: true,
    });
    expect(queryByTestId('quoted-voice-recording-widget')).toBeInTheDocument();
    // Duration is rendered but not file size when duration is available
    expect(queryByTestId('file-size-indicator')).not.toBeInTheDocument();
  });
  it('should fallback to file size, if duration is not available', () => {
    const { queryByTestId } = renderComponent({
      attachment: { ...attachment, duration: undefined, file_size: 60 * 1024 },
      isQuoted: true,
    });
    expect(queryByTestId('file-size-indicator')).toHaveTextContent('60 kB');
  });
});

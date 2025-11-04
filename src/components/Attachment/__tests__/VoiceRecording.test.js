import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { generateVoiceRecordingAttachment } from '../../../mock-builders';
import { VoiceRecording, VoiceRecordingPlayer } from '../VoiceRecording';
import { ChannelActionProvider } from '../../../context';
import { ResizeObserverMock } from '../../../mock-builders/browser';
import { WithAudioPlayback } from '../../AudioPlayer';

const AUDIO_RECORDING_PLAYER_TEST_ID = 'voice-recording-widget';
const QUOTED_AUDIO_RECORDING_TEST_ID = 'quoted-voice-recording-widget';

const FALLBACK_TITLE = 'Voice message';

const attachment = generateVoiceRecordingAttachment();

window.ResizeObserver = ResizeObserverMock;

jest
  .spyOn(HTMLDivElement.prototype, 'getBoundingClientRect')
  .mockReturnValue({ width: 120 });

const clickPlay = async () => {
  await act(async () => {
    await fireEvent.click(screen.queryByTestId('play-audio'));
  });
};

jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => {});
jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

const addNotificationSpy = jest.fn();
const renderComponent = (props, VoiceRecordingComponent = VoiceRecording) =>
  render(
    <ChannelActionProvider value={{ addNotification: addNotificationSpy }}>
      <WithAudioPlayback>
        <VoiceRecordingComponent {...props} />
      </WithAudioPlayback>
    </ChannelActionProvider>,
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
});

describe('VoiceRecordingPlayer', () => {
  beforeAll(() => {
    jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => {});
    jest.spyOn(window.HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
  });
  afterAll(jest.clearAllMocks);

  it('should not render the component if asset_url is missing', () => {
    const { container } = renderComponent({
      attachment: { ...attachment, asset_url: undefined },
    });
    expect(container).toBeEmptyDOMElement();
  });
  it('should render title if present', () => {
    const { getByTestId } = renderComponent({ attachment });
    expect(getByTestId('voice-recording-title')).toHaveTextContent(attachment.title);
  });
  it('should render fallback title if attachment title not present', () => {
    const { getByTestId } = renderComponent({
      attachment: { ...attachment, title: undefined },
    });
    expect(getByTestId('voice-recording-title')).toHaveTextContent(FALLBACK_TITLE);
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
  it('should render playback rate button only when playing', async () => {
    const { queryByTestId } = renderComponent({ attachment });
    expect(queryByTestId('playback-rate-button')).not.toBeInTheDocument();
    await clickPlay();
    expect(queryByTestId('playback-rate-button')).toHaveTextContent('1.0x');
  });
  it('should use custom playback rates', async () => {
    const { queryByTestId } = renderComponent(
      {
        attachment: { ...attachment },
        playbackRates: [2.5, 3.0],
      },
      VoiceRecordingPlayer,
    );
    expect(queryByTestId('playback-rate-button')).not.toBeInTheDocument();
    await clickPlay();
    expect(queryByTestId('playback-rate-button')).toHaveTextContent('2.5x');
  });
  it('should switch playback rates in round robin', async () => {
    const { queryByTestId } = renderComponent(
      {
        attachment: { ...attachment },
        playbackRates: [2.5, 3.0],
      },
      VoiceRecordingPlayer,
    );
    expect(queryByTestId('playback-rate-button')).not.toBeInTheDocument();
    await clickPlay();
    const playbackRateButton = queryByTestId('playback-rate-button');
    expect(playbackRateButton).toHaveTextContent('2.5x');
    act(() => {
      fireEvent.click(playbackRateButton);
    });
    expect(playbackRateButton).toHaveTextContent('3.0x');
    act(() => {
      fireEvent.click(playbackRateButton);
    });
    expect(playbackRateButton).toHaveTextContent('2.5x');
  });

  it('should show the correct progress', async () => {
    const createdAudios = []; // HTMLAudioElement[]

    const RealAudio = window.Audio;
    const constructorSpy = jest
      .spyOn(window, 'Audio')
      .mockImplementation(function AudioMock(...args) {
        const el = new RealAudio(...args);
        createdAudios.push(el);
        return el;
      });

    renderComponent({ attachment });

    jest
      .spyOn(HTMLAudioElement.prototype, 'duration', 'get')
      .mockImplementationOnce(() => 100);
    jest
      .spyOn(HTMLAudioElement.prototype, 'currentTime', 'get')
      .mockImplementationOnce(() => 50);
    expect(createdAudios.length).toBe(1);
    fireEvent.timeUpdate(createdAudios[0]);

    await waitFor(() => {
      expect(screen.getByTestId('wave-progress-bar-progress-indicator')).toHaveStyle({
        left: '50%',
      });
    });

    constructorSpy.mockRestore();
  });
});

describe('QuotedVoiceRecording', () => {
  it('should render the component', () => {
    const { container, queryByTestId, queryByText } = renderComponent({
      attachment,
      isQuoted: true,
    });
    expect(container).toMatchSnapshot();
    expect(queryByText(FALLBACK_TITLE)).not.toBeInTheDocument();
    expect(queryByTestId('file-size-indicator')).not.toBeInTheDocument();
  });
  it('should display fallback title, if title is not available', () => {
    const { queryByText } = renderComponent({
      attachment: { ...attachment, title: undefined },
      isQuoted: true,
    });
    expect(queryByText(FALLBACK_TITLE)).toBeInTheDocument();
  });
  it('should fallback to file size, if duration is not available', () => {
    const { queryByTestId } = renderComponent({
      attachment: { ...attachment, duration: undefined, file_size: 60 * 1024 },
      isQuoted: true,
    });
    expect(queryByTestId('file-size-indicator')).toHaveTextContent('60 kB');
  });
});

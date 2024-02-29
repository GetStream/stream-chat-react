import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { generateAudioRecordingAttachment } from '../../../mock-builders';
import { AudioRecording, AudioRecordingPlayer, QuotedAudioRecording } from '../AudioRecording';

const AUDIO_RECORDING_PLAYER_TEST_ID = 'audio-recording-widget';
const QUOTED_AUDIO_RECORDING_TEST_ID = 'quoted-audio-recording-widget';

const FALLBACK_TITLE = 'Voice message';

const attachment = generateAudioRecordingAttachment();

describe('AudioRecording', () => {
  it('should render AudioRecording with player if not quoted', () => {
    const { queryByTestId } = render(<AudioRecording attachment={attachment} />);
    expect(queryByTestId(AUDIO_RECORDING_PLAYER_TEST_ID)).toBeInTheDocument();
    expect(queryByTestId(QUOTED_AUDIO_RECORDING_TEST_ID)).not.toBeInTheDocument();
  });
  it('should render stripped down AudioRecording if quoted', () => {
    const { queryByTestId } = render(<AudioRecording attachment={attachment} isQuoted />);
    expect(queryByTestId(QUOTED_AUDIO_RECORDING_TEST_ID)).toBeInTheDocument();
    expect(queryByTestId(AUDIO_RECORDING_PLAYER_TEST_ID)).not.toBeInTheDocument();
  });
});

describe('AudioRecordingPlayer', () => {
  beforeAll(() => {
    jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => {});
  });
  afterAll(jest.restoreAllMocks);

  it('should not render the component if asset_url is missing', () => {
    const { container } = render(
      <AudioRecordingPlayer attachment={{ ...attachment, asset_url: undefined }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
  it('should render title if present', () => {
    const { getByTestId } = render(<AudioRecordingPlayer attachment={attachment} />);
    expect(getByTestId('audio-recording-title')).toHaveTextContent(attachment.title);
  });
  it('should render fallback title if attachment title not present', () => {
    const { getByTestId } = render(
      <AudioRecordingPlayer attachment={{ ...attachment, title: undefined }} />,
    );
    expect(getByTestId('audio-recording-title')).toHaveTextContent(FALLBACK_TITLE);
  });

  it('should fallback to file size, if duration is not available', () => {
    const { getByTestId } = render(
      <AudioRecordingPlayer
        attachment={{ ...attachment, duration: undefined, file_size: 60000 }}
      />,
    );
    expect(getByTestId('file-size-indicator')).toHaveTextContent('60 kB');
  });
  it('should render play button when not playing', () => {
    const { queryByTestId } = render(<AudioRecordingPlayer attachment={attachment} />);
    expect(queryByTestId('play-audio')).toBeInTheDocument();
    expect(queryByTestId('pause-audio')).not.toBeInTheDocument();
  });
  it('should render pause button when playing', () => {
    const { queryByTestId } = render(<AudioRecordingPlayer attachment={attachment} />);
    fireEvent.click(queryByTestId('play-audio'));
    expect(queryByTestId('play-audio')).not.toBeInTheDocument();
    expect(queryByTestId('pause-audio')).toBeInTheDocument();
  });
  it('should render playback rate button only when playing', () => {
    const { queryByTestId } = render(<AudioRecordingPlayer attachment={attachment} />);
    expect(queryByTestId('playback-rate-button')).not.toBeInTheDocument();
    fireEvent.click(queryByTestId('play-audio'));
    expect(queryByTestId('playback-rate-button')).toHaveTextContent('1.0x');
  });
  it('should use custom playback rates', () => {
    const { queryByTestId } = render(
      <AudioRecordingPlayer attachment={attachment} playbackRates={[2.5, 3.0]} />,
    );
    expect(queryByTestId('playback-rate-button')).not.toBeInTheDocument();
    fireEvent.click(queryByTestId('play-audio'));
    expect(queryByTestId('playback-rate-button')).toHaveTextContent('2.5x');
  });
  it('should switch playback rates in round robin', () => {
    const { queryByTestId } = render(
      <AudioRecordingPlayer attachment={attachment} playbackRates={[2.5, 3.0]} />,
    );
    expect(queryByTestId('playback-rate-button')).not.toBeInTheDocument();
    fireEvent.click(queryByTestId('play-audio'));
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
});

describe('QuotedAudioRecording', () => {
  it('should render the component', () => {
    const { container, queryByTestId, queryByText } = render(
      <QuotedAudioRecording attachment={attachment} />,
    );
    expect(container).toMatchSnapshot();
    expect(queryByText(FALLBACK_TITLE)).not.toBeInTheDocument();
    expect(queryByTestId('file-size-indicator')).not.toBeInTheDocument();
  });
  it('should display fallback title, if title is not available', () => {
    const { queryByText } = render(
      <QuotedAudioRecording attachment={{ ...attachment, title: undefined }} />,
    );
    expect(queryByText(FALLBACK_TITLE)).toBeInTheDocument();
  });
  it('should fallback to file size, if duration is not available', () => {
    const { queryByTestId } = render(
      <QuotedAudioRecording
        attachment={{ ...attachment, duration: undefined, file_size: 60000 }}
      />,
    );
    expect(queryByTestId('file-size-indicator')).toHaveTextContent('60 kB');
  });
});

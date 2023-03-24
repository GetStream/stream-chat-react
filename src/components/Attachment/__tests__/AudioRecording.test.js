import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { generateAudioRecordingAttachment } from '../../../mock-builders';
import { AudioRecordingPlayer } from '../AudioRecording';

const FALLBACK_TITLE = 'Voice message';

const attachment = generateAudioRecordingAttachment();

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
      <AudioRecordingPlayer attachment={{ ...attachment, duration: undefined }} />,
    );
    expect(getByTestId('file-size-indicator')).toHaveTextContent('55 kB');
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

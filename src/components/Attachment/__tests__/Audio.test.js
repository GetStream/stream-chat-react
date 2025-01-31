import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Audio } from '../Audio';

import { ChannelActionProvider } from '../../../context';
import { generateAudioAttachment } from '../../../mock-builders';
import { prettifyFileSize } from '../../MessageInput/hooks/utils';

const AUDIO = generateAudioAttachment();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const originalConsoleError = console.error;
jest.spyOn(console, 'error').mockImplementationOnce((...errorOrTextorArg) => {
  const msg = Array.isArray(errorOrTextorArg)
    ? errorOrTextorArg[0]
    : (errorOrTextorArg.message ?? errorOrTextorArg);
  if (msg.match('Not implemented')) return;
  originalConsoleError(...errorOrTextorArg);
});

const addNotificationSpy = jest.fn();
const defaultChannelActionContext = { addNotification: addNotificationSpy };
const renderComponent = (
  props = {
    channelActionContext: defaultChannelActionContext,
    og: AUDIO,
  },
) =>
  render(
    <ChannelActionProvider
      value={{ ...props.channelActionContext, ...defaultChannelActionContext }}
    >
      <Audio og={props.og} />
    </ChannelActionProvider>,
  );

const playButtonTestId = 'play-audio';
const pauseButtonTestId = 'pause-audio';
const playButton = () => screen.queryByTestId(playButtonTestId);
const pauseButton = () => screen.queryByTestId(pauseButtonTestId);

describe('Audio', () => {
  beforeAll(() => {
    // jsdom doesn't define these, so mock them instead
    // see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#Methods
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => {});
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    jest.resetAllMocks();
  });

  it('should render title and file size', () => {
    const { container, getByText } = renderComponent({
      og: AUDIO,
    });

    expect(getByText(AUDIO.title)).toBeInTheDocument();
    expect(getByText(prettifyFileSize(AUDIO.file_size))).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('should show the correct progress after clicking to the middle of a progress bar (seeking)', async () => {
    const { getByTestId } = renderComponent({ og: AUDIO });

    jest
      .spyOn(HTMLDivElement.prototype, 'getBoundingClientRect')
      .mockImplementationOnce(() => ({ width: 120, x: 0 }));

    jest
      .spyOn(HTMLAudioElement.prototype, 'currentTime', 'set')
      .mockImplementationOnce(() => {});
    jest.spyOn(HTMLAudioElement.prototype, 'duration', 'get').mockReturnValue(120);

    act(() => {
      fireEvent.click(getByTestId('audio-progress'), {
        clientX: 60,
      });
    });

    await waitFor(() => {
      expect(getByTestId('audio-progress')).toHaveAttribute('data-progress', '50');
    });
  });

  it('should render an audio element with the right source', () => {
    const { getByTestId } = renderComponent({ og: AUDIO });

    const source = getByTestId('audio-source');

    expect(source).toBeInTheDocument();
    expect(source.src).toBe(AUDIO.asset_url);
    expect(source.parentElement).toBeInstanceOf(HTMLAudioElement);
  });

  it('should show the correct button if the song is paused/playing', async () => {
    const { container } = renderComponent({
      og: { ...AUDIO, mime_type: undefined },
    });
    const audioPausedMock = jest.spyOn(container.querySelector('audio'), 'paused', 'get');
    expect(await playButton()).toBeInTheDocument();
    expect(await pauseButton()).not.toBeInTheDocument();

    audioPausedMock.mockReturnValueOnce(true);
    await act(async () => {
      await fireEvent.click(playButton());
    });

    expect(await playButton()).not.toBeInTheDocument();
    expect(await pauseButton()).toBeInTheDocument();

    audioPausedMock.mockReturnValueOnce(false);
    await act(async () => {
      await fireEvent.click(pauseButton());
    });

    expect(await playButton()).toBeInTheDocument();
    expect(await pauseButton()).not.toBeInTheDocument();
    expect(addNotificationSpy).not.toHaveBeenCalled();
    audioPausedMock.mockRestore();
  });

  it('should pause the audio if the playback has not started in 2000ms', async () => {
    jest.useFakeTimers('modern');
    const { container } = renderComponent({
      og: { ...AUDIO, mime_type: undefined },
    });

    const audio = container.querySelector('audio');
    const audioPlayMock = jest.spyOn(audio, 'play').mockImplementation(() => delay(3000));
    const audioPauseMock = jest.spyOn(audio, 'pause');

    expect(await playButton()).toBeInTheDocument();
    expect(await pauseButton()).not.toBeInTheDocument();

    await act(async () => {
      await fireEvent.click(playButton());
    });
    expect(await playButton()).toBeInTheDocument();
    expect(await pauseButton()).not.toBeInTheDocument();

    jest.advanceTimersByTime(2000);

    await waitFor(async () => {
      expect(audioPauseMock).toHaveBeenCalledWith();
      expect(await playButton()).toBeInTheDocument();
      expect(await pauseButton()).not.toBeInTheDocument();
      expect(addNotificationSpy).not.toHaveBeenCalled();
    });

    jest.useRealTimers();
    audioPlayMock.mockRestore();
    audioPauseMock.mockRestore();
  });

  it('should register error if pausing the audio after 2000ms of inactivity failed', async () => {
    jest.useFakeTimers('modern');
    const { container } = renderComponent({
      og: { ...AUDIO, mime_type: undefined },
    });
    const audio = container.querySelector('audio');
    const audioPlayMock = jest.spyOn(audio, 'play').mockImplementation(() => delay(3000));
    const audioPauseMock = jest.spyOn(audio, 'pause').mockImplementationOnce(() => {
      throw new Error('');
    });

    await act(() => {
      fireEvent.click(playButton());
    });
    jest.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(audioPauseMock).toHaveBeenCalledWith();
      expect(addNotificationSpy).toHaveBeenCalledWith(
        'Failed to play the recording',
        'error',
      );
    });

    jest.useRealTimers();
    audioPlayMock.mockRestore();
    audioPauseMock.mockRestore();
  });

  it('should register error if playing the audio failed', async () => {
    const errorText = 'Test error';
    const { container } = renderComponent({
      og: AUDIO,
    });
    const audio = container.querySelector('audio');
    const audioPlayMock = jest
      .spyOn(audio, 'play')
      .mockRejectedValueOnce(new Error(errorText));
    const audioCanPlayTypeMock = jest
      .spyOn(audio, 'canPlayType')
      .mockReturnValue('maybe');

    expect(await playButton()).toBeInTheDocument();
    expect(await pauseButton()).not.toBeInTheDocument();

    await act(async () => {
      await fireEvent.click(playButton());
    });
    expect(await playButton()).toBeInTheDocument();
    expect(await pauseButton()).not.toBeInTheDocument();
    expect(addNotificationSpy).toHaveBeenCalledWith(errorText, 'error');
    audioPlayMock.mockRestore();
    audioCanPlayTypeMock.mockRestore();
  });

  it('should register error if the audio MIME type is not playable', async () => {
    const { container } = renderComponent({
      og: AUDIO,
    });
    const audio = container.querySelector('audio');
    const audioPlayMock = jest.spyOn(audio, 'play');
    const audioCanPlayTypeMock = jest.spyOn(audio, 'canPlayType').mockReturnValue('');

    expect(await playButton()).toBeInTheDocument();
    expect(await pauseButton()).not.toBeInTheDocument();

    await act(async () => {
      await fireEvent.click(playButton());
    });
    expect(audioPlayMock).not.toHaveBeenCalled();
    expect(addNotificationSpy).toHaveBeenCalledWith(
      'Recording format is not supported and cannot be reproduced',
      'error',
    );
    expect(await playButton()).toBeInTheDocument();
    expect(await pauseButton()).not.toBeInTheDocument();

    audioPlayMock.mockRestore();
    audioCanPlayTypeMock.mockRestore();
  });

  it('should show the correct progress', async () => {
    const { container } = renderComponent({ og: AUDIO });

    jest
      .spyOn(HTMLAudioElement.prototype, 'duration', 'get')
      .mockImplementationOnce(() => 100);
    jest
      .spyOn(HTMLAudioElement.prototype, 'currentTime', 'get')
      .mockImplementationOnce(() => 50);
    const audioElement = container.querySelector('audio');
    fireEvent.timeUpdate(audioElement);

    await waitFor(() => {
      expect(screen.getByTestId('audio-progress')).toHaveAttribute('data-progress', '50');
    });
  });
});

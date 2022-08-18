import React from 'react';
import prettybytes from 'pretty-bytes';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Audio } from '../Audio';
import { PROGRESS_UPDATE_INTERVAL } from '../hooks/useAudioController';

import { ChatContext } from '../../../context/ChatContext';

import { generateAudioAttachment } from 'mock-builders';

const AUDIO = generateAudioAttachment();

const renderComponent = (
  props = {
    chatContext: { themeVersion: '1' },
    og: AUDIO,
  },
) =>
  render(
    <ChatContext.Provider value={props.chatContext}>
      <Audio og={props.og} />
    </ChatContext.Provider>,
  );

const playButtonTestId = 'play-audio';
const pauseButtonTestId = 'pause-audio';

describe('Audio', () => {
  beforeAll(() => {
    // jsdom doesn't define these, so mock them instead
    // see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#Methods
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => {});
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });
  afterEach(cleanup);

  it('in v1 should render title and render the image with description as alt tag', () => {
    const { container } = renderComponent({
      chatContext: { themeVersion: '1' },
      og: { ...AUDIO, title: 'deterministic' },
    });

    expect(container).toMatchSnapshot();
  });

  it('in v2 uploaded should render title and file size', () => {
    const { container, getByText } = renderComponent({
      chatContext: { themeVersion: '2' },
      og: AUDIO,
    });

    expect(getByText(AUDIO.title)).toBeInTheDocument();
    expect(getByText(prettybytes(AUDIO.file_size))).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('in v2 should show the correct progress after clicking to the middle of a progress bar (seeking)', async () => {
    const { getByTestId } = renderComponent({ chatContext: { themeVersion: '2' }, og: AUDIO });

    jest
      .spyOn(HTMLDivElement.prototype, 'getBoundingClientRect')
      .mockImplementationOnce(() => ({ width: 120, x: 0 }));

    jest.spyOn(HTMLAudioElement.prototype, 'currentTime', 'set').mockImplementationOnce(() => {});

    fireEvent.click(getByTestId('audio-progress'), {
      clientX: 60,
    });

    await waitFor(() => {
      expect(getByTestId('audio-progress')).toHaveAttribute('data-progress', '50');
    });
  });

  describe.each([['1'], ['2']])('version %s', (themeVersion) => {
    it('should render an audio element with the right source', () => {
      const { getByTestId } = renderComponent({ chatContext: { themeVersion }, og: AUDIO });

      const source = getByTestId('audio-source');

      expect(source).toBeInTheDocument();
      expect(source.src).toBe(AUDIO.asset_url);
      expect(source.parentElement).toBeInstanceOf(HTMLAudioElement);
    });

    it('should show the correct button if the song is paused/playing', async () => {
      const { queryByTestId } = renderComponent({ chatContext: { themeVersion }, og: AUDIO });

      const playButton = () => queryByTestId(playButtonTestId);
      const pauseButton = () => queryByTestId(pauseButtonTestId);

      expect(await playButton()).toBeInTheDocument();
      expect(await pauseButton()).not.toBeInTheDocument();

      fireEvent.click(playButton());

      expect(await playButton()).not.toBeInTheDocument();
      expect(await pauseButton()).toBeInTheDocument();

      fireEvent.click(pauseButton());

      expect(await playButton()).toBeInTheDocument();
      expect(await pauseButton()).not.toBeInTheDocument();
    });

    it(`should poll for progress every ${PROGRESS_UPDATE_INTERVAL}ms if the file is played, and stop doing that when it is paused`, () => {
      const { getByTestId } = renderComponent({ chatContext: { themeVersion }, og: AUDIO });

      let intervalId;
      const setIntervalSpy = jest.spyOn(window, 'setInterval').mockImplementationOnce(() => {
        intervalId = 'something';
        return intervalId;
      });
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

      fireEvent.click(getByTestId(playButtonTestId));
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), PROGRESS_UPDATE_INTERVAL);

      fireEvent.click(getByTestId(pauseButtonTestId));
      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    });

    it('should clean up the progress interval if the component is unmounted while the file is playing', () => {
      const { getByTestId, unmount = cleanup } = renderComponent({
        chatContext: { themeVersion },
        og: AUDIO,
      });

      let intervalId;
      jest.spyOn(window, 'setInterval').mockImplementationOnce(() => {
        intervalId = 'something';
        return intervalId;
      });
      fireEvent.click(getByTestId(playButtonTestId));

      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    });

    it('should show the correct progress', async () => {
      const { getByTestId } = renderComponent({ chatContext: { themeVersion }, og: AUDIO });

      jest.spyOn(HTMLAudioElement.prototype, 'duration', 'get').mockImplementationOnce(() => 100);
      jest.spyOn(HTMLAudioElement.prototype, 'currentTime', 'get').mockImplementationOnce(() => 50);

      fireEvent.click(getByTestId(playButtonTestId));

      await waitFor(() => {
        expect(getByTestId('audio-progress')).toHaveAttribute('data-progress', '50');
      });
    });
  });
});

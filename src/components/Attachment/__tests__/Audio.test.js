import React from 'react';
import prettybytes from 'pretty-bytes';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Audio } from '../Audio';

import { ChatContext } from '../../../context/ChatContext';

import { generateAudioAttachment, generateScrapedAudioAttachment } from 'mock-builders';

const THEME_VERSIONS = ['1', '2'];

const AUDIO = {
  scraped: generateScrapedAudioAttachment(),
  uploaded: generateAudioAttachment(),
};

const renderComponent = (
  props = {
    chatContext: { themeVersion: '1' },
    og: AUDIO.scraped,
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

  it('in v1 scraped should render title and description as text, and render the image with description as alt tag', () => {
    const audioData = AUDIO.scraped;
    const { getByAltText, getByText } = renderComponent({
      chatContext: { themeVersion: '1' },
      og: audioData,
    });

    expect(getByText(audioData.title)).toBeInTheDocument();
    expect(getByText(audioData.text)).toBeInTheDocument();

    const image = getByAltText(audioData.description);
    expect(image).toBeInTheDocument();
    expect(image.src).toBe(audioData.image_url);
  });

  it('in v1 uploaded should render title and render the image with description as alt tag', () => {
    const audioData = AUDIO.uploaded;
    const { container } = renderComponent({
      chatContext: { themeVersion: '1' },
      og: { ...audioData, title: 'deterministic' },
    });

    expect(container).toMatchSnapshot();
  });

  it('in v2 scraped should render title and description as text, and render the image with description as alt tag', () => {
    const { container, getByText } = renderComponent({
      chatContext: { themeVersion: '2' },
      og: AUDIO.scraped,
    });

    expect(getByText(AUDIO.scraped.title)).toBeInTheDocument();
    expect(getByText(AUDIO.scraped.text)).toBeInTheDocument();

    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('in v2 uploaded should render title and file size', () => {
    const { container, getByText } = renderComponent({
      chatContext: { themeVersion: '2' },
      og: AUDIO.uploaded,
    });

    expect(getByText(AUDIO.uploaded.title)).toBeInTheDocument();
    expect(getByText(prettybytes(AUDIO.uploaded.file_size))).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  const matrix = THEME_VERSIONS.reduce((acc, version) => {
    Object.entries(AUDIO).forEach(([type, attachment]) => {
      acc.push([type, version, attachment]);
    });
    return acc;
  }, []);

  describe.each(matrix)('%s in version %s', (type, themeVersion, audioData) => {
    it('should render an audio element with the right source', () => {
      const { getByTestId } = renderComponent({ chatContext: { themeVersion }, og: audioData });

      const source = getByTestId('audio-source');

      expect(source).toBeInTheDocument();
      expect(source.src).toBe(audioData.asset_url);
      expect(source.parentElement).toBeInstanceOf(HTMLAudioElement);
    });

    it('should show the correct button if the song is paused/playing', async () => {
      const { queryByTestId } = renderComponent({ chatContext: { themeVersion }, og: audioData });

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

    it('should poll for progress every 500ms if the file is played, and stop doing that when it is paused', () => {
      const { getByTestId } = renderComponent({ chatContext: { themeVersion }, og: audioData });

      let intervalId;
      const setIntervalSpy = jest.spyOn(window, 'setInterval').mockImplementationOnce(() => {
        intervalId = 'something';
        return intervalId;
      });
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

      fireEvent.click(getByTestId(playButtonTestId));
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 500);

      fireEvent.click(getByTestId(pauseButtonTestId));
      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    });

    it('should clean up the progress interval if the component is unmounted while the file is playing', () => {
      const { getByTestId, unmount = cleanup } = renderComponent({
        chatContext: { themeVersion },
        og: audioData,
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
      const { getByTestId } = renderComponent({ chatContext: { themeVersion }, og: audioData });

      jest.spyOn(HTMLAudioElement.prototype, 'duration', 'get').mockImplementationOnce(() => 100);
      jest.spyOn(HTMLAudioElement.prototype, 'currentTime', 'get').mockImplementationOnce(() => 50);

      fireEvent.click(getByTestId(playButtonTestId));

      await waitFor(() => {
        expect(getByTestId('audio-progress')).toHaveStyle({ width: '50%' });
      });
    });
  });
});

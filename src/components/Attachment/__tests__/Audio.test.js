import React from 'react';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { generateAudioAttachment } from 'mock-builders';
import Audio from '../Audio';

const mockAudioAsset = generateAudioAttachment();

const renderComponent = (
  props = {
    og: mockAudioAsset,
  },
) => render(<Audio {...props} />);

const playButtonTestId = 'play-audio';
const pauseButtonTestId = 'pause-audio';

describe('Audio', () => {
  beforeAll(() => {
    // jsdom doesn't define these, so mock them instead
    // see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#Methods
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => {});
    jest
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => {});
  });
  afterEach(cleanup);

  it('should render title and description as text, and render the image with description as alt tag', () => {
    const { getByText, getByAltText } = renderComponent();

    expect(getByText(mockAudioAsset.title)).toBeInTheDocument();
    expect(getByText(mockAudioAsset.text)).toBeInTheDocument();

    const image = getByAltText(mockAudioAsset.description);
    expect(image).toBeInTheDocument();
    expect(image.src).toBe(mockAudioAsset.image_url);
  });

  it('should render an audio element with the right source', () => {
    const { getByTestId } = renderComponent();

    const source = getByTestId('audio-source');

    expect(source).toBeInTheDocument();
    expect(source.src).toBe(mockAudioAsset.asset_url);
    expect(source.parentElement).toBeInstanceOf(HTMLAudioElement);
  });

  it('should show the correct button if the song is paused/playing', async () => {
    const { queryByTestId } = renderComponent();

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
    const { getByTestId } = renderComponent();

    let intervalId;
    const setIntervalSpy = jest
      .spyOn(window, 'setInterval')
      .mockImplementationOnce(() => {
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
    const { getByTestId, unmount = cleanup } = renderComponent();

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
    const { getByTestId } = renderComponent();

    jest
      .spyOn(HTMLAudioElement.prototype, 'duration', 'get')
      .mockImplementationOnce(() => 100);
    jest
      .spyOn(HTMLAudioElement.prototype, 'currentTime', 'get')
      .mockImplementationOnce(() => 50);

    fireEvent.click(getByTestId(playButtonTestId));

    await waitFor(() => {
      expect(getByTestId('audio-progress')).toHaveStyle({ width: '50%' });
    });
  });
});

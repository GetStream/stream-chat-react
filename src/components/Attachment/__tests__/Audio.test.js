import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Audio } from '../Audio';
import { generateAudioAttachment, generateMessage } from '../../../mock-builders';
import { prettifyFileSize } from '../../MessageInput/hooks/utils';
import { WithAudioPlayback } from '../../AudioPlayback';
import { MessageProvider } from '../../../context';

jest.mock('../../../context/ChatContext', () => ({
  useChatContext: () => ({ client: mockClient }),
}));
jest.mock('../../../context/TranslationContext', () => ({
  useTranslationContext: () => ({ t: (s) => tSpy(s) }),
}));

const addErrorSpy = jest.fn();
const mockClient = {
  notifications: { addError: addErrorSpy },
};
const tSpy = (s) => s;

// capture created Audio() elements so we can assert src & dispatch events
const createdAudios = []; //HTMLAudioElement[]
const RealAudio = window.Audio;
jest.spyOn(window, 'Audio').mockImplementation(function AudioMock(...args) {
  const el = new RealAudio(...args);
  createdAudios.push(el);
  return el;
});

const originalConsoleError = console.error;
jest.spyOn(console, 'error').mockImplementationOnce((...errorOrTextorArg) => {
  const msg = Array.isArray(errorOrTextorArg)
    ? errorOrTextorArg[0]
    : (errorOrTextorArg.message ?? errorOrTextorArg);
  if (msg.match('Not implemented')) return;
  originalConsoleError(...errorOrTextorArg);
});

const audioAttachment = generateAudioAttachment({ mime_type: undefined });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const renderComponent = (
  props = {
    og: audioAttachment,
  },
) =>
  render(
    <WithAudioPlayback>
      <Audio attachment={props.og} />
    </WithAudioPlayback>,
  );

const playButton = () => screen.queryByTestId('play-audio');
const pauseButton = () => screen.queryByTestId('pause-audio');

const clickToPlay = async () => {
  await act(async () => {
    await fireEvent.click(playButton());
  });
};

const clickToPause = async () => {
  await act(async () => {
    await fireEvent.click(pauseButton());
  });
};

const expectAddErrorMessage = (message) => {
  expect(addErrorSpy).toHaveBeenCalled();
  const hit = addErrorSpy.mock.calls.find((c) => c?.[0]?.message === message);
  expect(hit).toBeTruthy();
};

describe('Audio', () => {
  beforeEach(() => {
    // jsdom doesn't define these, so mock them instead
    // see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#Methods
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => {});
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    createdAudios.length = 0;
  });

  it('renders title and file size', () => {
    const { container, getByText } = renderComponent({
      og: audioAttachment,
    });

    expect(getByText(audioAttachment.title)).toBeInTheDocument();
    expect(getByText(prettifyFileSize(audioAttachment.file_size))).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('creates a playback Audio() with the right src only after clicked to play', async () => {
    renderComponent({ og: audioAttachment });
    await clickToPlay();
    expect(createdAudios.length).toBe(1);
    expect(createdAudios[0].src).toBe(audioAttachment.asset_url);
  });

  it('shows the correct progress after clicking to the middle of a progress bar (seeking)', async () => {
    const { getByTestId } = renderComponent({ og: audioAttachment });
    await clickToPlay();
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

  it('shows the correct button if the song is paused/playing', async () => {
    renderComponent({ og: { ...audioAttachment } });

    expect(playButton()).toBeInTheDocument();

    await clickToPlay();
    const audioPausedMock = jest.spyOn(createdAudios[0], 'paused', 'get');

    expect(pauseButton()).toBeInTheDocument();

    audioPausedMock.mockReturnValueOnce(false);

    await clickToPause();
    expect(playButton()).toBeInTheDocument();

    expect(addErrorSpy).not.toHaveBeenCalled();
    audioPausedMock.mockRestore();
  });

  it('pauses the audio if the playback has not started in 2000ms', async () => {
    jest.useFakeTimers({ now: Date.now() });
    renderComponent({
      og: audioAttachment,
    });
    expect(playButton()).toBeInTheDocument();
    expect(pauseButton()).not.toBeInTheDocument();
    jest
      .spyOn(HTMLAudioElement.prototype, 'play')
      .mockImplementationOnce(() => sleep(3000));
    await clickToPlay();

    await waitFor(() => {
      expect(playButton()).toBeInTheDocument();
      expect(pauseButton()).not.toBeInTheDocument();
    });

    jest.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(playButton()).toBeInTheDocument();
      expect(pauseButton()).not.toBeInTheDocument();
      expect(addErrorSpy).not.toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it('registers error if pausing the audio after 2000ms of inactivity failed', async () => {
    jest.useFakeTimers('modern');
    renderComponent({ og: audioAttachment });

    jest
      .spyOn(HTMLAudioElement.prototype, 'play')
      .mockImplementationOnce(() => sleep(3000));
    jest.spyOn(HTMLAudioElement.prototype, 'pause').mockImplementationOnce(() => {
      throw new Error('');
    });

    await clickToPlay();

    jest.advanceTimersByTime(2000);
    await waitFor(() => {
      expectAddErrorMessage('Failed to play the recording');
    });

    jest.useRealTimers();
  });

  it('registers error if playing the audio failed', async () => {
    const errorText = 'Test error';
    renderComponent({
      og: audioAttachment,
    });
    jest
      .spyOn(HTMLAudioElement.prototype, 'play')
      .mockRejectedValueOnce(new Error(errorText));
    const canPlaySpy = jest
      .spyOn(HTMLAudioElement.prototype, 'canPlayType')
      .mockReturnValue('maybe');

    expect(playButton()).toBeInTheDocument();
    expect(pauseButton()).not.toBeInTheDocument();

    await clickToPlay();
    expect(playButton()).toBeInTheDocument();
    expect(pauseButton()).not.toBeInTheDocument();
    expectAddErrorMessage(errorText);
    canPlaySpy.mockRestore();
  });

  it('should register error if the audio MIME type is not playable', async () => {
    renderComponent({ og: { ...audioAttachment, mime_type: 'audio/mp4' } });
    const spy = jest.spyOn(HTMLAudioElement.prototype, 'canPlayType').mockReturnValue('');

    await clickToPlay();
    expect(playButton()).toBeInTheDocument();
    expect(pauseButton()).not.toBeInTheDocument();
    expectAddErrorMessage('Recording format is not supported and cannot be reproduced');
    spy.mockRestore();
  });

  it('shows the correct progress on timeupdate', async () => {
    renderComponent({ og: audioAttachment });
    await clickToPlay();
    const audio = createdAudios[0];
    jest.spyOn(audio, 'duration', 'get').mockReturnValue(100);
    jest.spyOn(audio, 'currentTime', 'get').mockReturnValue(50);

    audio.dispatchEvent(new Event('timeupdate'));

    await waitFor(() => {
      expect(screen.getByTestId('audio-progress')).toHaveAttribute('data-progress', '50');
    });
  });

  it('differentiates between in thread and in channel audio player', async () => {
    const message = generateMessage();
    render(
      <WithAudioPlayback allowConcurrentPlayback>
        <MessageProvider value={{ message }}>
          <Audio attachment={audioAttachment} />
        </MessageProvider>
        <MessageProvider value={{ message, threadList: true }}>
          <Audio attachment={audioAttachment} />
        </MessageProvider>
      </WithAudioPlayback>,
    );
    const playButtons = screen.queryAllByTestId('play-audio');
    expect(playButtons.length).toBe(2);
    await Promise.all(
      playButtons.map(async (button) => {
        await fireEvent.click(button);
      }),
    );
    expect(createdAudios).toHaveLength(2);
  });

  it('keeps a single copy of audio player for the same requester', async () => {
    const message = generateMessage();
    render(
      <WithAudioPlayback>
        <MessageProvider value={{ message }}>
          <Audio attachment={audioAttachment} />
        </MessageProvider>
        <MessageProvider value={{ message }}>
          <Audio attachment={audioAttachment} />
        </MessageProvider>
      </WithAudioPlayback>,
    );
    const playButtons = screen.queryAllByTestId('play-audio');
    expect(playButtons.length).toBe(2);
    await Promise.all(
      playButtons.map(async (button) => {
        await fireEvent.click(button);
      }),
    );
    expect(createdAudios).toHaveLength(1);
  });
});

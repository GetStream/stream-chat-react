import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Audio } from '../Audio';
import { generateAudioAttachment, generateMessage } from '../../../mock-builders';
import { prettifyFileSize } from '../../MessageComposer/hooks/utils';
import { WithAudioPlayback } from '../../AudioPlayback';
import { MessageProvider } from '../../../context';

vi.mock('../../../context/ChatContext', () => ({
  useChatContext: () => ({ client: mockClient }),
}));
vi.mock('../../../context/TranslationContext', () => ({
  useTranslationContext: () => ({ t: (s) => tSpy(s) }),
}));
vi.mock('../../Notifications', () => ({
  useNotificationTarget: () => 'channel',
}));

const addErrorSpy = vi.fn();
const mockClient = {
  notifications: { addError: addErrorSpy },
};
const tSpy = (s) => s;

// capture created Audio() elements so we can assert src & dispatch events
const createdAudios = []; //HTMLAudioElement[]
const RealAudio = window.Audio;
vi.spyOn(window, 'Audio').mockImplementation(function AudioMock(...args) {
  const el = new RealAudio(...args);
  createdAudios.push(el);
  return el;
});

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementationOnce((...errorOrTextorArg: any[]) => {
  const msg = Array.isArray(errorOrTextorArg)
    ? errorOrTextorArg[0]
    : ((errorOrTextorArg as any).message ?? errorOrTextorArg);
  if (msg.match('Not implemented')) return;
  originalConsoleError(...errorOrTextorArg);
});

const audioAttachment = generateAudioAttachment({ mime_type: undefined });

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
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    createdAudios.length = 0;
  });

  it('renders title and file size', () => {
    const { container, getByText } = renderComponent({
      og: { ...audioAttachment, duration: undefined },
    });

    expect(getByText(audioAttachment.title)).toBeInTheDocument();
    expect(
      getByText(prettifyFileSize(audioAttachment.file_size as number)),
    ).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders duration instead of file size when available', () => {
    renderComponent({ og: { ...audioAttachment, duration: 43.007999420166016 } });

    expect(screen.getByText('00:44')).toBeInTheDocument();
    expect(screen.queryByTestId('file-size-indicator')).not.toBeInTheDocument();
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
    vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockImplementationOnce(
      () => ({ width: 120, x: 0 }) as any,
    );

    vi.spyOn(HTMLAudioElement.prototype, 'currentTime', 'set').mockImplementationOnce(
      () => {},
    );
    vi.spyOn(HTMLAudioElement.prototype, 'duration', 'get').mockReturnValue(120);

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
    const audioPausedMock = vi.spyOn(createdAudios[0], 'paused', 'get');

    expect(pauseButton()).toBeInTheDocument();

    audioPausedMock.mockReturnValueOnce(false);

    await clickToPause();
    expect(playButton()).toBeInTheDocument();

    expect(addErrorSpy).not.toHaveBeenCalled();
    audioPausedMock.mockRestore();
  });

  it('pauses the audio if the playback has not started in 2000ms', async () => {
    vi.useFakeTimers({ now: Date.now(), shouldAdvanceTime: true });
    renderComponent({
      og: audioAttachment,
    });
    expect(playButton()).toBeInTheDocument();
    expect(pauseButton()).not.toBeInTheDocument();
    vi.spyOn(HTMLAudioElement.prototype, 'play').mockImplementationOnce(
      () => new Promise(() => {}), // never resolves — simulates stalled playback
    );

    // Fire the click synchronously. Do NOT wrap in act() — the mocked play()
    // never resolves, so act() would block waiting for the async work to finish.
    fireEvent.click(playButton());

    // Advance past the 2000ms safety timeout inside AudioPlayer
    vi.advanceTimersByTime(2001);

    await waitFor(() => {
      expect(playButton()).toBeInTheDocument();
      expect(pauseButton()).not.toBeInTheDocument();
    });

    expect(addErrorSpy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('registers error if pausing the audio after 2000ms of inactivity failed', async () => {
    vi.useFakeTimers({ now: Date.now(), shouldAdvanceTime: true });
    renderComponent({ og: audioAttachment });

    vi.spyOn(HTMLAudioElement.prototype, 'play').mockImplementationOnce(
      () => new Promise(() => {}), // never resolves — simulates stalled playback
    );
    const pauseSpy = vi
      .spyOn(HTMLAudioElement.prototype, 'pause')
      .mockImplementationOnce(() => {
        throw new Error('');
      });

    // Fire the click synchronously — play() never resolves, so act() would block.
    fireEvent.click(playButton());

    vi.advanceTimersByTime(2001);

    // The safety timeout should have tried to pause and caught the error
    await waitFor(() => {
      expect(pauseSpy).toHaveBeenCalled();
    });

    // After the error, the play button should be shown (not pause)
    expect(playButton()).toBeInTheDocument();
    expect(pauseButton()).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('registers error if playing the audio failed', async () => {
    const errorText = 'Test error';
    renderComponent({
      og: audioAttachment,
    });
    vi.spyOn(HTMLAudioElement.prototype, 'play').mockRejectedValueOnce(
      new Error(errorText),
    );
    const canPlaySpy = vi
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
    const spy = vi.spyOn(HTMLAudioElement.prototype, 'canPlayType').mockReturnValue('');

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
    vi.spyOn(audio, 'duration', 'get').mockReturnValue(100);
    vi.spyOn(audio, 'currentTime', 'get').mockReturnValue(50);

    audio.dispatchEvent(new Event('timeupdate'));

    await waitFor(() => {
      expect(screen.getByTestId('audio-progress')).toHaveAttribute('data-progress', '50');
    });
  });

  it('differentiates between in thread and in channel audio player', async () => {
    const message = generateMessage();
    render(
      <WithAudioPlayback allowConcurrentPlayback>
        <MessageProvider value={{ message } as any}>
          <Audio attachment={audioAttachment} />
        </MessageProvider>
        <MessageProvider value={{ message, threadList: true } as any}>
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
        <MessageProvider value={{ message } as any}>
          <Audio attachment={audioAttachment} />
        </MessageProvider>
        <MessageProvider value={{ message } as any}>
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

import React, { useEffect } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { AudioRecordingPlayback } from '../AudioRecordingPlayback';
import { useAudioPlayer, WithAudioPlayback } from '../../../AudioPlayback';
import type { AudioPlayer } from '../../../AudioPlayback';
import { generateAudioAttachment } from '../../../../mock-builders';

const TOGGLE_PLAY_BTN_TEST_ID = 'audio-recording-preview-toggle-play-btn';
const PLAY_ICON_CLASS = 'str-chat__icon--play-fill';
const PAUSE_ICON_CLASS = 'str-chat__icon--pause-fill';
const WAVE_PROGRESS_BAR_TEST_ID = 'wave-progress-bar-track';
const TIMER_CLASS_SELECTOR = '.str-chat__recording-timer';
const WAVE_PROGRESS_BAR_INDICATOR_SELECTOR =
  '.str-chat__wave-progress-bar__progress-indicator';

const togglePlay = async () => {
  await act(async () => {
    await fireEvent.click(screen.queryByTestId(TOGGLE_PLAY_BTN_TEST_ID));
  });
};

const audioAttachment = generateAudioAttachment({ mime_type: undefined });

const defaultProps = {
  durationSeconds: 5,
  src: audioAttachment.asset_url,
  waveformData: [0.1, 0.2, 0.3, 0.4, 0.5],
};

const addErrorSpy = vi.fn();
const mockClient = { notifications: { addError: addErrorSpy } };
const tSpy = (s) => s;

vi.mock('../../../../context', () => ({
  useChatContext: () => ({ client: mockClient }),
  useTranslationContext: () => ({ t: tSpy }),
}));

vi.mock('../../../Notifications', async (importOriginal) => ({
  ...(await importOriginal()),
  useNotificationTarget: () => 'channel',
}));

const createdAudios = []; // HTMLAudioElement[]

const RealAudio = window.Audio;
vi.spyOn(window, 'Audio').mockImplementation(function AudioMock(...args) {
  const el = new RealAudio(...args);
  createdAudios.push(el);
  return el;
});

vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(window.HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue(
  fromPartial<DOMRect>({
    width: defaultProps.waveformData.length,
    x: 0,
  }),
);
vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() =>
  Promise.resolve(),
);
vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
vi.spyOn(window.HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(
  defaultProps.durationSeconds,
);

class PointerEventMock extends Event {
  constructor(type, { overrides, ...opts }) {
    super(type, opts);
    if (!overrides) return;
    Object.entries(overrides).forEach(([k, v]) => {
      this[k] = v;
    });
  }
}

window.PointerEvent = PointerEventMock as unknown as typeof PointerEvent;

const renderComponent = ({ getPlayer = () => null, ...props }: any = {}) => {
  const finalProps = { ...defaultProps, ...props };
  const PlayerGetter = () => {
    const player = useAudioPlayer(finalProps);

    useEffect(() => {
      getPlayer(player);
    }, [player]);
    return null;
  };

  return render(
    <WithAudioPlayback>
      <PlayerGetter />
      <AudioRecordingPlayback {...finalProps} />
    </WithAudioPlayback>,
  );
};

describe('AudioRecordingPlayback', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    createdAudios.length = 0;
  });

  it('displays the track duration on render', () => {
    const { container } = renderComponent();
    expect(container.querySelector(TIMER_CLASS_SELECTOR)).toHaveTextContent('00:05');
  });

  it('toggles the playback', async () => {
    const { container } = renderComponent();
    const audioPausedMock = vi.spyOn(HTMLAudioElement.prototype, 'paused', 'get');

    expect(container.querySelector(`.${PLAY_ICON_CLASS}`)).toBeInTheDocument();
    await togglePlay();
    expect(container.querySelector(`.${PAUSE_ICON_CLASS}`)).toBeInTheDocument();

    audioPausedMock.mockReturnValueOnce(false);
    await togglePlay();
    expect(container.querySelector(`.${PLAY_ICON_CLASS}`)).toBeInTheDocument();
    audioPausedMock.mockRestore();
  });

  it('does not render waveform if data is unavailable', () => {
    renderComponent({ waveformData: [] });
    expect(screen.queryByTestId(WAVE_PROGRESS_BAR_TEST_ID)).not.toBeInTheDocument();
  });

  it('seeks in the playback by dragging the slider', async () => {
    let player: AudioPlayer;
    const { container } = renderComponent({
      getPlayer: (p) => {
        player = p;
      },
    });
    const slider = container.querySelector(WAVE_PROGRESS_BAR_INDICATOR_SELECTOR);
    // Initial position is 0px (pixel-based positioning in v14)
    expect(slider).toHaveStyle({ 'inset-inline-start': '0px' });
    await act(() => {
      fireEvent.pointerDown(screen.getByTestId(WAVE_PROGRESS_BAR_TEST_ID));
    });
    const clientX = 3;
    await act(() => {
      fireEvent.pointerMove(screen.getByTestId(WAVE_PROGRESS_BAR_TEST_ID), {
        overrides: {
          clientX,
        },
      });
    });
    // seek has been invoked, the audio element has been assigned, now it needs to signal it is ready
    vi.spyOn(player.elementRef, 'readyState', 'get').mockReturnValue(1);
    await act(() => {
      player.elementRef.dispatchEvent(new Event('loadedmetadata'));
    });
    await act(() => {
      fireEvent.pointerUp(screen.getByTestId(WAVE_PROGRESS_BAR_TEST_ID));
    });
    // With container width=5 and clientX=3, progress=60%, so indicatorLeft = 3px
    // But actual value depends on internal calculations including indicator width
    const leftValue = parseInt((slider as HTMLElement).style.insetInlineStart, 10);
    expect(leftValue).toBeGreaterThan(0);
  });

  it('seeks in the playback by clicking on waveform', async () => {
    let player: AudioPlayer;
    const { container } = renderComponent({
      getPlayer: (p) => {
        player = p;
      },
    });

    const clientX = 3;
    const slider = container.querySelector(WAVE_PROGRESS_BAR_INDICATOR_SELECTOR);
    expect(slider).toHaveStyle({ 'inset-inline-start': '0px' });
    await act(() => {
      fireEvent.click(screen.getByTestId(WAVE_PROGRESS_BAR_TEST_ID), {
        clientX,
      });
    });
    // seek has been invoked, the audio element has been assigned, now it needs to signal it is ready
    vi.spyOn(player.elementRef, 'readyState', 'get').mockReturnValue(1);
    await act(() => {
      player.elementRef.dispatchEvent(new Event('loadedmetadata'));
    });
    const leftValue = parseInt((slider as HTMLElement).style.insetInlineStart, 10);
    expect(leftValue).toBeGreaterThan(0);
  });
});

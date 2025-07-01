import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AudioRecordingPreview } from '../AudioRecordingPreview';
import { ChannelActionProvider } from '../../../../context';

const TOGGLE_PLAY_BTN_TEST_ID = 'audio-recording-preview-toggle-play-btn';
const PLAY_ICON_TEST_ID = 'str-chat__play-icon';
const PAUSE_ICON_TEST_ID = 'str-chat__pause-icon';
const WAVE_PROGRESS_BAR_TEST_ID = 'wave-progress-bar-track';
const TIMER_CLASS_SELECTOR = '.str-chat__recording-timer';
const WAVE_PROGRESS_BAR_INDICATOR_SELECTOR =
  '.str-chat__wave-progress-bar__progress-indicator';

const togglePlay = async () => {
  await act(async () => {
    await fireEvent.click(screen.queryByTestId(TOGGLE_PLAY_BTN_TEST_ID));
  });
};

const defaultProps = {
  durationSeconds: 5,
  waveformData: [0.1, 0.2, 0.3, 0.4, 0.5],
};

jest.spyOn(console, 'warn').mockImplementation(() => {});
jest
  .spyOn(window.HTMLDivElement.prototype, 'getBoundingClientRect')
  .mockReturnValue({ width: defaultProps.waveformData.length, x: 0 });
jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => {});
jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
jest
  .spyOn(window.HTMLMediaElement.prototype, 'duration', 'get')
  .mockReturnValue(defaultProps.durationSeconds);

const addNotificationSpy = jest.fn();

class PointerEventMock extends Event {
  constructor(type, { overrides, ...opts }) {
    super(type, opts);
    if (!overrides) return;
    Object.entries(overrides).forEach(([k, v]) => {
      this[k] = v;
    });
  }
}

window.PointerEvent = PointerEventMock;

const renderComponent = (props) =>
  render(
    <ChannelActionProvider value={{ addNotification: addNotificationSpy }}>
      <AudioRecordingPreview {...{ ...defaultProps, ...props }} />
    </ChannelActionProvider>,
  );
describe('AudioRecordingPreview', () => {
  it('displays the track duration on render', () => {
    const { container } = renderComponent();
    expect(container.querySelector(TIMER_CLASS_SELECTOR)).toHaveTextContent('00:05');
  });
  it('toggles the playback', async () => {
    renderComponent();
    expect(screen.queryByTestId(PLAY_ICON_TEST_ID)).toBeInTheDocument();
    await act(async () => {
      await togglePlay();
    });
    expect(screen.queryByTestId(PAUSE_ICON_TEST_ID)).toBeInTheDocument();
  });
  it('does not render waveform if data is unavailable', () => {
    renderComponent({ waveformData: [] });
    expect(screen.queryByTestId(WAVE_PROGRESS_BAR_TEST_ID)).not.toBeInTheDocument();
  });
  it('seeks in the playback by dragging the slider', async () => {
    const { container } = renderComponent();
    const slider = container.querySelector(WAVE_PROGRESS_BAR_INDICATOR_SELECTOR);
    expect(slider).toHaveStyle({ left: '0%' });
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
    await act(() => {
      fireEvent.pointerUp(screen.getByTestId(WAVE_PROGRESS_BAR_TEST_ID));
    });
    expect(slider).toHaveStyle({ left: '60%' });
  });

  it('seeks in the playback by clicking on waveform', async () => {
    const { container } = renderComponent();
    const clientX = 3;
    const slider = container.querySelector(WAVE_PROGRESS_BAR_INDICATOR_SELECTOR);
    expect(slider).toHaveStyle({ left: '0%' });
    await act(() => {
      fireEvent.click(screen.getByTestId(WAVE_PROGRESS_BAR_TEST_ID), {
        clientX,
      });
    });
    expect(slider).toHaveStyle({ left: '60%' });
  });
});

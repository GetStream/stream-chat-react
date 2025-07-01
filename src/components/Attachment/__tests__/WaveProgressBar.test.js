import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WaveProgressBar } from '../components';
import { ResizeObserverMock } from '../../../mock-builders/browser';

jest.spyOn(console, 'warn').mockImplementation();
const originalSample = Array.from({ length: 10 }, (_, i) => i);

const BAR_ROOT_TEST_ID = 'wave-progress-bar-track';
const PROGRESS_INDICATOR_TEST_ID = 'wave-progress-bar-progress-indicator';
const AMPLITUDE_BAR_TEST_ID = 'amplitude-bar';
window.ResizeObserver = ResizeObserverMock;

const getBoundingClientRect = jest
  .spyOn(HTMLDivElement.prototype, 'getBoundingClientRect')
  .mockReturnValue({ width: 120 });

describe('WaveProgressBar', () => {
  beforeEach(() => {
    ResizeObserverMock.observers = [];
  });

  it('is not rendered if waveform data is missing', () => {
    render(<WaveProgressBar seek={jest.fn()} waveformData={[]} />);
    expect(screen.queryByTestId(BAR_ROOT_TEST_ID)).not.toBeInTheDocument();
  });

  it('is not rendered if no space available', () => {
    getBoundingClientRect.mockReturnValueOnce({ width: 0 });
    render(
      <WaveProgressBar
        amplitudesCount={5}
        seek={jest.fn()}
        waveformData={originalSample}
      />,
    );
    expect(screen.queryByTestId(BAR_ROOT_TEST_ID)).not.toBeInTheDocument();
  });

  it('renders with default number of bars', () => {
    render(<WaveProgressBar seek={jest.fn()} waveformData={originalSample} />);
    const root = screen.getByTestId(BAR_ROOT_TEST_ID);
    expect(
      root.style.getPropertyValue('--str-chat__voice-recording-amplitude-bar-gap-width'),
    ).toBe('1px');
    const bars = screen.getAllByTestId(AMPLITUDE_BAR_TEST_ID);
    expect(
      bars.every(
        (b) =>
          b.style.getPropertyValue('--str-chat__voice-recording-amplitude-bar-width') ===
          '2px',
      ),
    ).toBeTruthy();
    expect(screen.getAllByTestId(AMPLITUDE_BAR_TEST_ID)).toHaveLength(40);
  });

  it('adjusts the number of bars and gaps based on the custom ratio', () => {
    render(
      <WaveProgressBar
        relativeAmplitudeBarWidth={3}
        relativeAmplitudeGap={5}
        seek={jest.fn()}
        waveformData={originalSample}
      />,
    );
    const root = screen.getByTestId(BAR_ROOT_TEST_ID);
    expect(
      root.style.getPropertyValue('--str-chat__voice-recording-amplitude-bar-gap-width'),
    ).toBe('5px');
    const bars = screen.getAllByTestId(AMPLITUDE_BAR_TEST_ID);
    expect(
      bars.every(
        (b) =>
          b.style.getPropertyValue('--str-chat__voice-recording-amplitude-bar-width') ===
          '3px',
      ),
    ).toBeTruthy();
    expect(bars).toHaveLength(15);
  });

  it('recalculates the number of bars on root resize', async () => {
    render(<WaveProgressBar seek={jest.fn()} waveformData={originalSample} />);
    expect(ResizeObserverMock.observers).toHaveLength(1);
    const activeObserver = ResizeObserver.observers[0];
    expect(activeObserver.active).toBeTruthy();
    await act(() => {
      activeObserver.cb([{ contentRect: { width: 21 } }]);
    });
    const root = screen.getByTestId(BAR_ROOT_TEST_ID);
    expect(
      root.style.getPropertyValue('--str-chat__voice-recording-amplitude-bar-gap-width'),
    ).toBe('1px');
    const bars = screen.getAllByTestId(AMPLITUDE_BAR_TEST_ID);
    expect(
      bars.every(
        (b) =>
          b.style.getPropertyValue('--str-chat__voice-recording-amplitude-bar-width') ===
          '2px',
      ),
    ).toBeTruthy();
    expect(screen.getAllByTestId(AMPLITUDE_BAR_TEST_ID)).toHaveLength(7);
  });

  it('does not recalculate the number of bars on root resize if ResizeObserver is unsupported', () => {
    window.ResizeObserver = undefined;
    render(<WaveProgressBar seek={jest.fn()} waveformData={originalSample} />);
    expect(ResizeObserverMock.observers).toHaveLength(0);
    window.ResizeObserver = ResizeObserverMock;
  });

  it('is rendered with zero progress by default if waveform data is available', () => {
    const { container } = render(
      <WaveProgressBar
        amplitudesCount={5}
        seek={jest.fn()}
        waveformData={originalSample}
      />,
    );
    expect(container).toMatchSnapshot();
    expect(screen.getByTestId(PROGRESS_INDICATOR_TEST_ID)).toBeInTheDocument();
  });

  it('is rendered with highlighted bars with non-zero progress', () => {
    const { container } = render(
      <WaveProgressBar
        amplitudesCount={5}
        progress={20}
        seek={jest.fn()}
        waveformData={originalSample}
      />,
    );
    expect(
      container.querySelectorAll('.str-chat__wave-progress-bar__amplitude-bar--active'),
    ).toHaveLength(1);
    expect(screen.queryByTestId(PROGRESS_INDICATOR_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(PROGRESS_INDICATOR_TEST_ID)).toHaveStyle('left: 20%');
  });
});

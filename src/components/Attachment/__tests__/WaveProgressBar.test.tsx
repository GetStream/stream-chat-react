import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { WaveProgressBar } from '../../AudioPlayback';
import { ResizeObserverMock } from '../../../mock-builders/browser';

vi.spyOn(console, 'warn').mockImplementation(() => {});
const originalSample = Array.from({ length: 10 }, (_, i) => i);

const BAR_ROOT_TEST_ID = 'wave-progress-bar-track';
const PROGRESS_INDICATOR_TEST_ID = 'wave-progress-bar-progress-indicator';
const AMPLITUDE_BAR_TEST_ID = 'amplitude-bar';
(window as any).ResizeObserver = ResizeObserverMock;

const getBoundingClientRect = vi
  .spyOn(HTMLDivElement.prototype, 'getBoundingClientRect')
  .mockReturnValue(fromPartial({ width: 120, x: 0 }));

describe('WaveProgressBar', () => {
  beforeEach(() => {
    ResizeObserverMock.observers = [];
    getBoundingClientRect.mockReturnValue(fromPartial({ width: 120, x: 0 }));
  });

  it('is not rendered if waveform data is missing', () => {
    render(<WaveProgressBar seek={vi.fn()} waveformData={[]} />);
    expect(screen.queryByTestId(BAR_ROOT_TEST_ID)).not.toBeInTheDocument();
  });

  it('is not rendered if no space available', () => {
    getBoundingClientRect.mockReturnValue(fromPartial({ width: 0, x: 0 }));
    render(<WaveProgressBar seek={vi.fn()} waveformData={originalSample} />);
    expect(screen.getByTestId(BAR_ROOT_TEST_ID)).toBeInTheDocument();
    expect(screen.queryAllByTestId(AMPLITUDE_BAR_TEST_ID)).toHaveLength(0);
  });

  it('renders with default number of bars', () => {
    render(<WaveProgressBar seek={vi.fn()} waveformData={originalSample} />);
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
        seek={vi.fn()}
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
    render(<WaveProgressBar seek={vi.fn()} waveformData={originalSample} />);
    expect(ResizeObserverMock.observers).toHaveLength(1);
    const activeObserver = ResizeObserver['observers'][0];
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
    await waitFor(() => {
      expect(screen.getAllByTestId(AMPLITUDE_BAR_TEST_ID)).toHaveLength(7);
    });
  });

  it('does not recalculate the number of bars on root resize if ResizeObserver is unsupported', () => {
    (window as any).ResizeObserver = undefined;
    render(<WaveProgressBar seek={vi.fn()} waveformData={originalSample} />);
    expect(ResizeObserverMock.observers).toHaveLength(0);
    (window as any).ResizeObserver = ResizeObserverMock;
  });

  it('is rendered with zero progress by default if waveform data is available', () => {
    render(<WaveProgressBar seek={vi.fn()} waveformData={originalSample} />);
    expect(screen.getAllByTestId(AMPLITUDE_BAR_TEST_ID)).toHaveLength(40);
    expect(screen.getByTestId(PROGRESS_INDICATOR_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(PROGRESS_INDICATOR_TEST_ID)).toHaveStyle(
      'inset-inline-start: 0px',
    );
  });

  it('is rendered with highlighted bars with non-zero progress', () => {
    const { container } = render(
      <WaveProgressBar progress={20} seek={vi.fn()} waveformData={originalSample} />,
    );
    expect(
      container.querySelectorAll('.str-chat__wave-progress-bar__amplitude-bar--active'),
    ).toHaveLength(8);
    expect(screen.queryByTestId(PROGRESS_INDICATOR_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(PROGRESS_INDICATOR_TEST_ID)).not.toHaveStyle('left: 0px');
  });
});

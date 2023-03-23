import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { downSample, upSample, WaveProgressBar } from '../components';

const AMPLITUDE_BAR_TEST_ID = 'amplitude-bar';
const PROGRESS_INDICATOR_TEST_ID = 'progress-indicator';

const HIGHLIGHTED_BAR_CLASS = 'str-chat__wave-progress-bar__amplitude-bar--active';

describe('WaveProgressBar', () => {
  beforeAll(() => jest.spyOn(console, 'warn').mockImplementation(() => null));
  afterAll(jest.restoreAllMocks);

  it('should not render if empty waveList', () => {
    const { container } = render(<WaveProgressBar progress={0} waveList={[]} />);
    expect(container.firstChild).toMatchInlineSnapshot(`null`);
  });
  it('should render given number of bars', () => {
    const countBars = 2;
    const { getAllByTestId } = render(
      <WaveProgressBar countBars={countBars} progress={0} waveList={[0.5]} />,
    );
    expect(getAllByTestId(AMPLITUDE_BAR_TEST_ID)).toHaveLength(countBars);
  });
  it('should not highlight the bars not played yet', () => {
    const { container } = render(<WaveProgressBar progress={0} waveList={[0.5]} />);
    expect(container.getElementsByClassName(HIGHLIGHTED_BAR_CLASS)).toHaveLength(0);
  });
  it('should highlight the bars already played', () => {
    const { container } = render(<WaveProgressBar progress={50} waveList={[0.3, 0.5]} />);
    expect(container.getElementsByClassName(HIGHLIGHTED_BAR_CLASS)).toHaveLength(20);
  });
  it('should not render the progress indicator if no progress', () => {
    const { queryByTestId } = render(<WaveProgressBar progress={0} waveList={[0.5]} />);
    expect(queryByTestId(PROGRESS_INDICATOR_TEST_ID)).not.toBeInTheDocument();
  });
  it('should not render the progress indicator if played the whole track', () => {
    const { queryByTestId } = render(<WaveProgressBar progress={100} waveList={[0.5]} />);
    expect(queryByTestId(PROGRESS_INDICATOR_TEST_ID)).not.toBeInTheDocument();
  });
  it('should render the progress indicator if 0 < progress < 100', () => {
    const { queryByTestId } = render(<WaveProgressBar progress={1} waveList={[0.5]} />);
    expect(queryByTestId(PROGRESS_INDICATOR_TEST_ID)).toBeInTheDocument();
  });
  it('should reflect the progress by the distance of the indicator from the left side', () => {
    const { queryByTestId } = render(<WaveProgressBar progress={1} waveList={[0.5]} />);
    expect(queryByTestId(PROGRESS_INDICATOR_TEST_ID)).toHaveStyle('left: 1%');
  });
  it('should set correct bar height', () => {
    const waveList = [0.5, 0.3, 0];
    const { queryAllByTestId } = render(
      <WaveProgressBar countBars={3} progress={1} waveList={waveList} />,
    );
    const bars = queryAllByTestId(AMPLITUDE_BAR_TEST_ID);
    bars.forEach((bar, i) => {
      expect(bar).toHaveStyle(
        `--str-cha__wave-progress-bar__amplitude-bar-height: ${waveList[i] * 100}%`,
      );
    });
  });
});

// eslint-disable-next-line prettier/prettier
const INPUT_LIST = [
  0.15,
  0.35,
  0.78,
  0.32,
  0.67,
  0.41,
  0.44,
  0.66,
  0.08,
  0.73,
  0,
  0.76,
  0.17,
  0.9,
  0.89,
  0.21,
  0.69,
  0.78,
  0.13,
  0.81,
  0.13,
  0.36,
  0.8,
  0.85,
  0.78,
  0.6,
  0.25,
  0.03,
  0.15,
  0.53,
  0.67,
  0.63,
  0.73,
  0.53,
  0.19,
  0.77,
  0.27,
  0.85,
  0.76,
  0.34,
  0.11,
  0.3,
  0.95,
  0.55,
  0.16,
  0.84,
  0.19,
  0.39,
  0.26,
  0.21,
];
describe('downSample', () => {
  beforeAll(() => jest.spyOn(console, 'warn').mockImplementation(() => null));
  afterAll(jest.restoreAllMocks);

  it('should return empty list if the original array is smaller than the target array', () => {
    expect(downSample(INPUT_LIST, INPUT_LIST.length + 1)).toHaveLength(0);
  });
  it('should return the original array if target array size is falsy', () => {
    expect(downSample(INPUT_LIST, 0)).toHaveLength(INPUT_LIST.length);
  });
  it('should return the original array if original array size equals the target size', () => {
    expect(JSON.stringify(downSample(INPUT_LIST.slice(0, 10), 10))).toBe(
      '[0.15,0.35,0.78,0.32,0.67,0.41,0.44,0.66,0.08,0.73]',
    );
  });
  it('should reduce the size of the original array to the target size', () => {
    const newList = downSample(INPUT_LIST.slice(0, 15), 10);
    expect(JSON.stringify(newList)).toBe('[0.25,0.78,0.495,0.41,0.55,0.08,0.365,0.76,0.535,0.89]');
  });
});
describe('upSample', () => {
  beforeAll(() => jest.spyOn(console, 'warn').mockImplementation(() => null));
  afterAll(jest.restoreAllMocks);

  it('should return empty list if the original array is longer than the target array', () => {
    expect(upSample(INPUT_LIST, INPUT_LIST.length - 1)).toHaveLength(0);
  });
  it('should return the empty list if the original array is empty', () => {
    expect(upSample([], INPUT_LIST.length + 1)).toHaveLength(0);
  });
  it('should return the original array if original array size equals the target size', () => {
    expect(JSON.stringify(upSample(INPUT_LIST, INPUT_LIST.length))).toBe(
      JSON.stringify(INPUT_LIST),
    );
  });
  it('should extend the size of the original array to the target size', () => {
    expect(JSON.stringify(upSample(INPUT_LIST.slice(0, 10), 15))).toBe(
      '[0.15,0.15,0.35,0.35,0.78,0.78,0.32,0.32,0.67,0.67,0.41,0.44,0.66,0.08,0.73]',
    );
  });
});

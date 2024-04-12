import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WaveProgressBar } from '../components';

jest.spyOn(console, 'warn').mockImplementation();
const originalSample = Array.from({ length: 10 }, (_, i) => i);

const PROGRESS_INDICATOR_TEST_ID = 'wave-progress-bar-progress-indicator';

describe('WaveProgressBar', () => {
  it('is not rendered if waveform data is missing', () => {
    render(<WaveProgressBar seek={jest.fn()} waveformData={[]} />);
    expect(screen.queryByTestId('wave-progress-bar-track')).not.toBeInTheDocument();
  });
  it('is rendered with zero progress by default if waveform data is available', () => {
    const { container } = render(
      <WaveProgressBar amplitudesCount={5} seek={jest.fn()} waveformData={originalSample} />,
    );
    expect(container).toMatchSnapshot();
    expect(screen.queryByTestId(PROGRESS_INDICATOR_TEST_ID)).toBeInTheDocument();
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

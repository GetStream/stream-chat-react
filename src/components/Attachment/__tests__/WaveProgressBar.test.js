import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { downSample, upSample, WaveProgressBar } from '../components';

jest.spyOn(console, 'warn').mockImplementation();
const originalSample = Array.from({ length: 10 }, (_, i) => i);

const PROGRESS_INDICATOR_TEST_ID = 'wave-progress-bar-progress-indicator';
describe('WaveProgressBar', () => {
  describe('component', () => {
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

  describe('amplitude sampling', () => {
    describe('upSample', () => {
      afterEach(jest.restoreAllMocks);
      it('should return original values if target size is smaller than the original sample size', () => {
        expect(upSample(originalSample, 5)).toHaveLength(originalSample.length);
      });

      it('should return original values if the original sample size is empty', () => {
        expect(upSample([], 5)).toHaveLength(0);
      });

      it('should return original values if the original sample size equals the target', () => {
        expect(upSample(originalSample, originalSample.length)).toHaveLength(originalSample.length);
      });

      it('should fill each bucket to reach the target sample size', () => {
        expect(JSON.stringify(upSample(originalSample, 17))).toBe(
          JSON.stringify([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9]),
        );
      });
    });

    describe('downSample', () => {
      it('should return original values if target size is greater than the original sample size', () => {
        expect(downSample(originalSample, 20)).toHaveLength(originalSample.length);
      });

      it('should return original values if the original sample size is empty', () => {
        expect(downSample([], 5)).toHaveLength(0);
      });

      it('should return original values if the original sample size equals the target', () => {
        expect(downSample(originalSample, originalSample.length)).toHaveLength(
          originalSample.length,
        );
      });

      it('should return a mean of original values if the target output size is 1', () => {
        expect(JSON.stringify(downSample([10, 2, 6, 10, 3, 4, 8, 0], 1))).toBe(
          JSON.stringify([5.375]),
        );
      });

      it('should fill each bucket to reach the target sample size', () => {
        expect(
          JSON.stringify(
            downSample(
              [10, 2, 6, 10, 3, 4, 8, 1, 10, 0, 6, 10, 3, 4, 8, 1, 2, 6, 10, 3, 8, 10, 0],
              7,
            ),
          ),
        ).toBe(JSON.stringify([10, 2, 10, 0, 8, 10, 0]));
        expect(JSON.stringify(downSample([10, 2, 6, 10, 3, 4, 8, 0], 7))).toBe(
          JSON.stringify([10, 2, 6, 10, 3, 8, 0]),
        );
        expect(JSON.stringify(downSample([10, 2], 2))).toBe(JSON.stringify([10, 2]));
        expect(JSON.stringify(downSample([10, 2, 10], 2))).toBe(JSON.stringify([10, 10]));
      });
    });
  });
});

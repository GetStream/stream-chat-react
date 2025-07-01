import { downSample, upSample } from '../audioSampling';

jest.spyOn(console, 'warn').mockImplementation();
const originalSample = Array.from({ length: 10 }, (_, i) => i);

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
      expect(upSample(originalSample, originalSample.length)).toHaveLength(
        originalSample.length,
      );
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

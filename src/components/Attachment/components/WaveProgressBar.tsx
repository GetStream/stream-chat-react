import React, { useMemo } from 'react';
import clsx from 'clsx';
import type { ProgressBarProps } from './ProgressBar';
import { divMode } from '../utils';

type WaveProgressBarProps = ProgressBarProps & {
  /** The array of fractional number values between 0 and 1 representing the height of amplitudes */
  waveList: number[];
  /** Allows to specify the number of bars into which the original waveList array should be resampled */
  countBars?: number;
};
export const WaveProgressBar = ({
  countBars = 40,
  onClick,
  progress = 0,
  waveList,
}: WaveProgressBarProps) => {
  const resampledWaveList = useMemo(
    () =>
      waveList.length === countBars
        ? waveList
        : waveList.length > countBars
        ? downSample(waveList, countBars)
        : upSample(waveList, countBars),
    [countBars, waveList],
  );

  if (!waveList.length) return null;

  return (
    <div
      className='str-chat__wave-progress-bar__track'
      data-testid='audio-recording-progress'
      onClick={onClick}
      role='progressbar'
    >
      {resampledWaveList.map((amplitude, i) => (
        <div
          className={clsx('str-chat__wave-progress-bar__amplitude-bar', {
            ['str-chat__wave-progress-bar__amplitude-bar--active']:
              progress > (i / resampledWaveList.length) * 100,
          })}
          data-testid='amplitude-bar'
          key={`amplitude-${i}`}
          style={
            {
              '--str-cha__wave-progress-bar__amplitude-bar-height': amplitude
                ? amplitude * 100 + '%'
                : '0%',
            } as React.CSSProperties
          }
        />
      ))}
      {0 < progress && progress < 100 && (
        <div
          className='str-chat__wave-progress-bar__progress-indicator'
          data-testid='progress-indicator'
          style={{ left: `${progress}%` }}
        />
      )}
    </div>
  );
};

export const downSample = (values: number[], targetSize: number) => {
  if (!targetSize) {
    console.warn('Unknown target size of the down-sampled amplitude array.');
    return values;
  }
  if (targetSize > values.length) {
    console.warn('Requested to down-sample the waveList that is smaller than the target size');
    return [];
  }

  if (targetSize === values.length) return values;

  const bucketSize = values.length / targetSize;
  const lastBucketSize = Math.round(values.length % bucketSize);
  const result = [];
  let countValuesReduced = 0;

  while (countValuesReduced <= values.length - bucketSize) {
    const bucketItems = values.slice(
      Math.round(countValuesReduced),
      Math.round(countValuesReduced + bucketSize),
    );
    result.push(mean(bucketItems));
    countValuesReduced += bucketSize;
  }

  if (lastBucketSize > 0) {
    const bucketItems = values.slice(-lastBucketSize);
    result.push(mean(bucketItems));
  }

  return result;
};

export const upSample = (values: number[], targetSize: number) => {
  if (!values.length) {
    console.log('Cannot extend empty array of amplitudes.');
    return [];
  }

  if (values.length > targetSize) {
    console.warn('Requested to extend the waveList that is longer than the target list size');
    return [];
  }

  if (targetSize === values.length) return values;

  // eslint-disable-next-line prefer-const
  let [bucketSize, remainder] = divMode(targetSize, values.length);
  let result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const extra = remainder && remainder-- ? 1 : 0;
    result = [...result, ...Array(bucketSize + extra).fill(values[i])];
  }
  return result;
};

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

const mean = (values: number[]) => sum(values) / values.length;

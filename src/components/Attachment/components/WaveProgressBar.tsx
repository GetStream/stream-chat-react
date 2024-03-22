import React, {
  MouseEvent,
  MouseEventHandler,
  TouchEvent,
  TouchEventHandler,
  useMemo,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { resampleWaveformData } from '../audioSampling';
import type { SeekFn } from '../hooks/useAudioController';

type WaveProgressBarProps = {
  /** Function that allows to change the track progress */
  seek: SeekFn;
  /** The array of fractional number values between 0 and 1 representing the height of amplitudes */
  waveformData: number[];
  /** Allows to specify the number of bars into which the original waveformData array should be resampled */
  amplitudesCount?: number;
  /** Progress expressed in fractional number value btw 0 and 100. */
  progress?: number;
};

export const WaveProgressBar = ({
  amplitudesCount = 40,
  progress = 0,
  seek,
  waveformData,
}: WaveProgressBarProps) => {
  const [progressIndicator, setProgressIndicator] = useState<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!progressIndicator) return;
    isDragging.current = true;
    progressIndicator.style.cursor = 'grabbing';
  };

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!isDragging.current) return;
    seek({ ...event });
  };

  const handleTouchMove: TouchEventHandler<HTMLDivElement> = (event) => {
    if (!(rootRef.current && isDragging.current)) return;
    event.preventDefault();
    const touch = event.touches[0];
    seek({ clientX: touch.clientX, currentTarget: rootRef.current });
  };

  const handleMouseUp = () => {
    if (!progressIndicator) return;
    isDragging.current = false;
    progressIndicator.style.removeProperty('cursor');
  };

  const resampledWaveformData = useMemo(() => resampleWaveformData(waveformData, amplitudesCount), [
    amplitudesCount,
    waveformData,
  ]);

  if (!waveformData.length) return null;

  return (
    <div
      className='str-chat__wave-progress-bar__track'
      data-testid='wave-progress-bar-track'
      onClick={seek}
      onMouseDown={handleDragStart}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchStart={handleDragStart}
      ref={rootRef}
      role='progressbar'
    >
      {resampledWaveformData.map((amplitude, i) => (
        <div
          className={clsx('str-chat__wave-progress-bar__amplitude-bar', {
            ['str-chat__wave-progress-bar__amplitude-bar--active']:
              progress > (i / resampledWaveformData.length) * 100,
          })}
          data-testid='amplitude-bar'
          key={`amplitude-${i}`}
          style={
            {
              '--str-chat__wave-progress-bar__amplitude-bar-height': amplitude
                ? amplitude * 100 + '%'
                : '0%',
            } as React.CSSProperties
          }
        />
      ))}
      <div
        className='str-chat__wave-progress-bar__progress-indicator'
        data-testid='wave-progress-bar-progress-indicator'
        ref={setProgressIndicator}
        style={{ left: `${progress < 0 ? 0 : progress > 100 ? 100 : progress}%` }}
      />
    </div>
  );
};

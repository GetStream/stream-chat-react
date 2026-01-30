import throttle from 'lodash.throttle';
import type { PointerEventHandler } from 'react';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { resampleWaveformData } from '../../Attachment/audioSampling';
import type { SeekFn } from '../../Attachment/hooks/useAudioController';

type WaveProgressBarProps = {
  /** Function that allows to change the track progress */
  seek: SeekFn;
  /** The array of fractional number values between 0 and 1 representing the height of amplitudes */
  waveformData: number[];
  /** Allows to specify the number of bars into which the original waveformData array should be resampled */
  amplitudesCount?: number;
  /** Progress expressed in fractional number value btw 0 and 100. */
  progress?: number;
  relativeAmplitudeBarWidth?: number;
  relativeAmplitudeGap?: number;
};

export const WaveProgressBar = ({
  amplitudesCount = 40,
  progress = 0,
  relativeAmplitudeBarWidth = 2,
  relativeAmplitudeGap = 1,
  seek,
  waveformData,
}: WaveProgressBarProps) => {
  const isDragging = useRef(false);
  const [trackAxisX, setTrackAxisX] = useState<{
    barCount: number;
    barWidth: number;
    gap: number;
  }>();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [progressIndicator, setProgressIndicator] = useState<HTMLDivElement | null>(null);
  const lastRootWidth = useRef<number>(0);
  const lastIndicatorWidth = useRef<number>(0);

  const handleDragStart: PointerEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (!progressIndicator) return;
    isDragging.current = true;
    progressIndicator.style.cursor = 'grabbing';
  };

  const handleDrag: PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging.current) return;
    // Due to throttling of seek, it is necessary to create a copy (snapshot) of the event.
    // Otherwise, the event would be nullified at the point when the throttled function is executed.
    seek({ ...e });
  };

  const handleDragStop = useCallback(() => {
    if (!progressIndicator) return;
    isDragging.current = false;
    progressIndicator.style.removeProperty('cursor');
  }, [progressIndicator]);

  const calculateIndicatorPosition = () => {
    if (progress === 0 || !lastRootWidth || !progressIndicator) return 0;
    const availableWidth = lastRootWidth.current - lastIndicatorWidth.current;
    return availableWidth * (progress / 100) + 1;
  };

  const getTrackAxisX = useMemo(
    () =>
      throttle((rootWidth: number) => {
        if (rootWidth === lastRootWidth.current) return;
        lastRootWidth.current = rootWidth;
        const possibleAmpCount = Math.floor(
          rootWidth / (relativeAmplitudeGap + relativeAmplitudeBarWidth),
        );
        const tooManyAmplitudesToRender = possibleAmpCount < amplitudesCount;
        const barCount = tooManyAmplitudesToRender ? possibleAmpCount : amplitudesCount;
        const amplitudeBarWidthToGapRatio =
          relativeAmplitudeBarWidth / (relativeAmplitudeBarWidth + relativeAmplitudeGap);
        const barWidth = barCount && (rootWidth / barCount) * amplitudeBarWidthToGapRatio;

        setTrackAxisX({
          barCount,
          barWidth,
          gap: barWidth * (relativeAmplitudeGap / relativeAmplitudeBarWidth),
        });
      }, 1),
    [relativeAmplitudeBarWidth, relativeAmplitudeGap, amplitudesCount],
  );

  const resampledWaveformData = useMemo(
    () => (trackAxisX ? resampleWaveformData(waveformData, trackAxisX.barCount) : []),
    [trackAxisX, waveformData],
  );

  useEffect(() => {
    document.addEventListener('pointerup', handleDragStop);
    return () => {
      document.removeEventListener('pointerup', handleDragStop);
    };
  }, [handleDragStop]);

  useEffect(() => {
    if (!root || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      getTrackAxisX(entry.contentRect.width);
    });
    observer.observe(root);

    return () => {
      observer.disconnect();
    };
  }, [getTrackAxisX, root]);

  useLayoutEffect(() => {
    if (root) {
      const { width: rootWidth } = root.getBoundingClientRect();
      getTrackAxisX(rootWidth);
    }

    if (progressIndicator) {
      lastIndicatorWidth.current = progressIndicator.getBoundingClientRect().width;
    }
  }, [getTrackAxisX, root, progressIndicator]);

  if (!waveformData.length || trackAxisX?.barCount === 0) return null;

  return (
    <div
      className='str-chat__wave-progress-bar__track'
      data-testid='wave-progress-bar-track'
      onClick={seek}
      onPointerDown={handleDragStart}
      onPointerMove={handleDrag}
      onPointerUp={handleDragStop}
      ref={setRoot}
      role='progressbar'
      style={
        {
          '--str-chat__voice-recording-amplitude-bar-gap-width': trackAxisX?.gap + 'px',
        } as React.CSSProperties
      }
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
              '--str-chat__voice-recording-amplitude-bar-width':
                trackAxisX?.barWidth + 'px',
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
        style={{
          left: `${calculateIndicatorPosition()}px`,
        }}
      />
    </div>
  );
};

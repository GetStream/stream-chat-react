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
  /** Progress expressed in fractional number value btw 0 and 100. */
  progress?: number;
  /** Absolute gap width between bars in px (overrides computed gap var). */
  amplitudeBarGapWidthPx?: number;
  relativeAmplitudeBarWidth?: number;
  relativeAmplitudeGap?: number;
};

export const WaveProgressBar = ({
  amplitudeBarGapWidthPx,
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
  const minAmplitudeBarWidthRef = useRef<number | null>(null);
  const lastMinAmplitudeBarWidthUsed = useRef<number | null>(null);

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

  const getAvailableTrackWidth = useCallback((trackRoot: HTMLDivElement | null) => {
    if (!trackRoot) return 0;
    const parent = trackRoot.parentElement;
    if (!parent) return trackRoot.getBoundingClientRect().width;
    const parentWidth = parent.getBoundingClientRect().width;
    const computedStyle = window.getComputedStyle(parent);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const rawColumnGap = computedStyle.columnGap || computedStyle.gap;
    const parsedColumnGap = parseFloat(rawColumnGap);
    const columnGap = Number.isNaN(parsedColumnGap) ? 0 : parsedColumnGap;
    const gapCount = Math.max(0, parent.children.length - 1);
    const totalGapsWidth = columnGap * gapCount;
    const siblingsWidth = Array.from(parent.children).reduce((total, child) => {
      if (child === trackRoot) return total;
      return total + child.getBoundingClientRect().width;
    }, 0);
    return Math.max(
      0,
      parentWidth - paddingLeft - paddingRight - totalGapsWidth - siblingsWidth,
    );
  }, []);

  const getTrackAxisX = useMemo(
    () =>
      throttle((availableWidth: number) => {
        const minAmplitudeBarWidth = minAmplitudeBarWidthRef.current;
        const hasMinWidthChanged =
          minAmplitudeBarWidth !== lastMinAmplitudeBarWidthUsed.current;
        if (availableWidth === lastRootWidth.current && !hasMinWidthChanged) return;
        lastRootWidth.current = availableWidth;
        lastMinAmplitudeBarWidthUsed.current = minAmplitudeBarWidth;
        const possibleAmpCount = Math.floor(
          availableWidth / (relativeAmplitudeGap + relativeAmplitudeBarWidth),
        );
        const amplitudeBarWidthToGapRatio =
          relativeAmplitudeBarWidth / (relativeAmplitudeBarWidth + relativeAmplitudeGap);
        const maxCountByMinWidth =
          typeof minAmplitudeBarWidth === 'number' && minAmplitudeBarWidth > 0
            ? Math.floor(
                (availableWidth * amplitudeBarWidthToGapRatio) / minAmplitudeBarWidth,
              )
            : possibleAmpCount;
        const barCount = Math.max(0, Math.min(possibleAmpCount, maxCountByMinWidth));
        const barWidth =
          barCount && (availableWidth / barCount) * amplitudeBarWidthToGapRatio;

        setTrackAxisX({
          barCount,
          barWidth,
          gap: barWidth * (relativeAmplitudeGap / relativeAmplitudeBarWidth),
        });
      }, 1),
    [relativeAmplitudeBarWidth, relativeAmplitudeGap],
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
      const availableWidth = getAvailableTrackWidth(entry.target as HTMLDivElement);
      getTrackAxisX(availableWidth || entry.contentRect.width);
    });
    observer.observe(root);

    return () => {
      observer.disconnect();
    };
  }, [getTrackAxisX, root, getAvailableTrackWidth]);

  useLayoutEffect(() => {
    if (root) {
      const availableWidth = getAvailableTrackWidth(root);
      getTrackAxisX(availableWidth);
    }

    if (progressIndicator) {
      lastIndicatorWidth.current = progressIndicator.getBoundingClientRect().width;
    }
  }, [getAvailableTrackWidth, getTrackAxisX, root, progressIndicator]);

  useLayoutEffect(() => {
    if (!root || typeof window === 'undefined') return;
    const amplitudeBar = root.querySelector<HTMLElement>(
      '.str-chat__wave-progress-bar__amplitude-bar',
    );
    if (!amplitudeBar) return;
    const computedStyle = window.getComputedStyle(amplitudeBar);
    const parsedMinWidth = parseFloat(computedStyle.minWidth);
    if (!Number.isNaN(parsedMinWidth) && parsedMinWidth > 0) {
      minAmplitudeBarWidthRef.current = parsedMinWidth;
    }
    const availableWidth = getAvailableTrackWidth(root);
    if (availableWidth > 0) {
      getTrackAxisX(availableWidth);
    }
  }, [getAvailableTrackWidth, getTrackAxisX, root, trackAxisX?.barCount]);

  if (!waveformData.length || trackAxisX?.barCount === 0) return null;

  const amplitudeGapWidth = amplitudeBarGapWidthPx ?? trackAxisX?.gap;

  return (
    <div
      className={clsx('str-chat__wave-progress-bar__track', {
        'str-chat__wave-progress-bar__track--playback-initiated': progress > 0,
        // 'str-chat__wave-progress-bar__track--': isPlaying,
      })}
      data-testid='wave-progress-bar-track'
      onClick={seek}
      onPointerDown={handleDragStart}
      onPointerMove={handleDrag}
      onPointerUp={handleDragStop}
      ref={setRoot}
      role='progressbar'
      style={
        {
          '--str-chat__voice-recording-amplitude-bar-gap-width':
            typeof amplitudeGapWidth === 'number' ? `${amplitudeGapWidth}px` : undefined,
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

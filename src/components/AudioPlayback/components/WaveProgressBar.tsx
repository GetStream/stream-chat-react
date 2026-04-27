import throttle from 'lodash.throttle';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { resampleWaveformData } from '../../Attachment/audioSampling';
import type { SeekFn as AudioPlayerSeekFn } from '../AudioPlayer';
import { handleProgressBarKeyboardSeek } from './keyboardSeek';
import { getAudioTrackSliderAriaValueText } from './progressBarA11y';
import { useInteractiveProgressBar } from './useInteractiveProgressBar';
import { useTranslationContext } from '../../../context';

type SeekParams = Parameters<AudioPlayerSeekFn>[0];

type WaveProgressBarProps = {
  /** Function that allows to change the track progress */
  seek: (params: SeekParams) => void;
  /** The array of fractional number values between 0 and 1 representing the height of amplitudes */
  waveformData: number[];
  /** Progress expressed in fractional number value btw 0 and 100. */
  progress?: number;
  /** Total track duration in seconds. */
  durationSeconds?: number;
  /** Current elapsed position in seconds. */
  secondsElapsed?: number;
  /** Absolute gap width between bars in px (overrides computed gap var). */
  amplitudeBarGapWidthPx?: number;
  relativeAmplitudeBarWidth?: number;
  relativeAmplitudeGap?: number;
};

export const WaveProgressBar = ({
  amplitudeBarGapWidthPx,
  durationSeconds,
  progress = 0,
  relativeAmplitudeBarWidth = 2,
  relativeAmplitudeGap = 1,
  secondsElapsed,
  seek,
  waveformData,
}: WaveProgressBarProps) => {
  const { t } = useTranslationContext('WaveProgressBar');
  const [trackAxisX, setTrackAxisX] = useState<{
    barCount: number;
    barWidth: number;
    gap: number;
  }>();
  const lastAvailableTrackWidth = useRef<number>(0);
  const minAmplitudeBarWidthRef = useRef<number | null>(null);
  const lastMinAmplitudeBarWidthUsed = useRef<number | null>(null);
  const {
    availableTrackWidth,
    handleDrag,
    handleDragStart,
    handleDragStop,
    indicatorLeft,
    root,
    setProgressIndicator,
    setRoot,
  } = useInteractiveProgressBar({ progress, seek });
  const normalizedProgress = Math.max(0, Math.min(100, progress));

  const getTrackAxisX = useMemo(
    () =>
      throttle((availableWidth: number) => {
        const minAmplitudeBarWidth = minAmplitudeBarWidthRef.current;
        const hasMinWidthChanged =
          minAmplitudeBarWidth !== lastMinAmplitudeBarWidthUsed.current;
        if (availableWidth === lastAvailableTrackWidth.current && !hasMinWidthChanged) {
          return;
        }
        lastAvailableTrackWidth.current = availableWidth;
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

  useLayoutEffect(() => {
    if (availableTrackWidth > 0) {
      getTrackAxisX(availableTrackWidth);
    }
  }, [availableTrackWidth, getTrackAxisX]);

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
    if (availableTrackWidth > 0) {
      getTrackAxisX(availableTrackWidth);
    }
  }, [availableTrackWidth, getTrackAxisX, root, trackAxisX?.barCount]);

  if (!waveformData.length || trackAxisX?.barCount === 0) return null;

  const amplitudeGapWidth = amplitudeBarGapWidthPx ?? trackAxisX?.gap;
  const ariaValueText = getAudioTrackSliderAriaValueText({
    durationSeconds,
    progress: normalizedProgress,
    secondsElapsed,
    t,
  });

  return (
    <div
      aria-label={t('aria/Seek audio position')}
      aria-orientation='horizontal'
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(normalizedProgress)}
      aria-valuetext={ariaValueText}
      className={clsx('str-chat__wave-progress-bar__track', {
        'str-chat__wave-progress-bar__track--playback-initiated': normalizedProgress > 0,
      })}
      data-testid='wave-progress-bar-track'
      onClick={seek}
      onKeyDown={(event) =>
        handleProgressBarKeyboardSeek({ event, progress: normalizedProgress, seek })
      }
      onPointerDown={handleDragStart}
      onPointerMove={handleDrag}
      onPointerUp={handleDragStop}
      ref={setRoot}
      role='slider'
      style={
        {
          '--str-chat__voice-recording-amplitude-bar-gap-width':
            typeof amplitudeGapWidth === 'number' ? `${amplitudeGapWidth}px` : undefined,
        } as React.CSSProperties
      }
      tabIndex={0}
    >
      {resampledWaveformData.map((amplitude, i) => (
        <div
          aria-hidden='true'
          className={clsx('str-chat__wave-progress-bar__amplitude-bar', {
            ['str-chat__wave-progress-bar__amplitude-bar--active']:
              normalizedProgress > (i / resampledWaveformData.length) * 100,
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
        aria-hidden='true'
        className='str-chat__wave-progress-bar__progress-indicator'
        data-testid='wave-progress-bar-progress-indicator'
        ref={setProgressIndicator}
        style={{
          insetInlineStart: `${indicatorLeft}px`,
        }}
      />
    </div>
  );
};

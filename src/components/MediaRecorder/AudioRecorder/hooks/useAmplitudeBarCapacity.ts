import { useLayoutEffect, useState } from 'react';

/** Bar width assumed until a bar is rendered; the stylesheet's default. */
const DEFAULT_AMPLITUDE_BAR_WIDTH_PX = 2;
/** Bars drawn while the track has no width to measure (not laid out yet). */
const UNMEASURED_AMPLITUDE_BAR_CAPACITY = 200;

/**
 * How many amplitude bars fit `track` side by side, given its gap and the width of a rendered bar.
 * Measured again when the track resizes and once the first bar renders, as the bar width is read
 * from it.
 * @param track - Element laying out the bars in a row.
 * @param hasBars - Whether the track renders any bar yet.
 */
export const useAmplitudeBarCapacity = (track: HTMLElement | null, hasBars: boolean) => {
  const [capacity, setCapacity] = useState(UNMEASURED_AMPLITUDE_BAR_CAPACITY);

  useLayoutEffect(() => {
    if (!track) return;
    const measure = () => {
      const trackWidth = track.clientWidth;
      if (!trackWidth) return;
      const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
      const barWidth =
        track
          .querySelector<HTMLElement>('.str-chat__wave-progress-bar__amplitude-bar')
          ?.getBoundingClientRect().width || DEFAULT_AMPLITUDE_BAR_WIDTH_PX;
      setCapacity(Math.max(1, Math.floor((trackWidth + gap) / (barWidth + gap))));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [hasBars, track]);

  return capacity;
};

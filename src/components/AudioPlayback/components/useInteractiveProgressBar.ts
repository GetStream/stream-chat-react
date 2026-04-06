import type { PointerEventHandler } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SeekFn as AudioPlayerSeekFn } from '../AudioPlayer';

type SeekParams = Parameters<AudioPlayerSeekFn>[0];

type UseInteractiveProgressBarParams = {
  progress?: number;
  seek: (params: SeekParams) => void;
};

const getAvailableTrackWidth = (trackRoot: HTMLDivElement | null) => {
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
};

export const useInteractiveProgressBar = ({
  progress = 0,
  seek,
}: UseInteractiveProgressBarParams) => {
  const isDragging = useRef(false);
  const [availableTrackWidth, setAvailableTrackWidth] = useState(0);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [progressIndicator, setProgressIndicator] = useState<HTMLDivElement | null>(null);
  const lastIndicatorWidth = useRef(0);

  const handleDragStart: PointerEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (!progressIndicator) return;

    isDragging.current = true;
    progressIndicator.style.cursor = 'grabbing';
    root?.classList.add('str-chat__wave-progress-bar__track--dragging');
  };

  const handleDrag: PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging.current) return;
    // Snapshot the event because seek is throttled.
    seek({ ...e });
  };

  const handleDragStop = useCallback(() => {
    if (!progressIndicator) return;

    isDragging.current = false;
    progressIndicator.style.removeProperty('cursor');
    root?.classList.remove('str-chat__wave-progress-bar__track--dragging');
  }, [progressIndicator, root]);

  useEffect(() => {
    document.addEventListener('pointerup', handleDragStop);

    return () => {
      document.removeEventListener('pointerup', handleDragStop);
    };
  }, [handleDragStop]);

  useEffect(() => {
    if (!root || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      const nextAvailableWidth = getAvailableTrackWidth(entry.target as HTMLDivElement);
      setAvailableTrackWidth(nextAvailableWidth || entry.contentRect.width);
    });

    observer.observe(root);

    return () => {
      observer.disconnect();
    };
  }, [root]);

  useLayoutEffect(() => {
    if (root) {
      setAvailableTrackWidth(getAvailableTrackWidth(root));
    }

    if (progressIndicator) {
      lastIndicatorWidth.current = progressIndicator.getBoundingClientRect().width;
    }
  }, [progressIndicator, root]);

  const indicatorLeft =
    progress === 0 || !progressIndicator
      ? 0
      : Math.max(0, availableTrackWidth - lastIndicatorWidth.current) * (progress / 100) +
        1;

  return {
    availableTrackWidth,
    handleDrag,
    handleDragStart,
    handleDragStop,
    indicatorLeft,
    root,
    setProgressIndicator,
    setRoot,
  };
};

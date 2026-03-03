import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { GalleryContext } from './GalleryContext';

import type { GalleryContextValue, GalleryItem } from './GalleryContext';

export type GalleryProps = {
  /** Array of media attachments to display */
  items: GalleryItem[];
  /** Custom UI component to replace the default GalleryUI */
  GalleryUI?: React.ComponentType;
  /** Initial index of the item to display (default: 0) */
  initialIndex?: number;
  /** Callback when the active item changes */
  onIndexChange?: (index: number) => void;
};

export const Gallery = ({
  GalleryUI,
  initialIndex = 0,
  items,
  onIndexChange,
}: GalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const itemCount = items.length;

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < itemCount) {
        setCurrentIndex(index);
      }
    },
    [itemCount],
  );

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < itemCount - 1 ? prev + 1 : prev));
  }, [itemCount]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const hasNext = currentIndex < itemCount - 1;
  const hasPrevious = currentIndex > 0;
  const currentItem = items[currentIndex];

  const contextValue = useMemo<GalleryContextValue>(
    () => ({
      currentIndex,
      currentItem,
      goToIndex,
      goToNext,
      goToPrevious,
      hasNext,
      hasPrevious,
      itemCount,
      items,
    }),
    [
      currentIndex,
      currentItem,
      goToIndex,
      goToNext,
      goToPrevious,
      hasNext,
      hasPrevious,
      itemCount,
      items,
    ],
  );

  return (
    <GalleryContext.Provider value={contextValue}>
      {GalleryUI ? <GalleryUI /> : null}
    </GalleryContext.Provider>
  );
};

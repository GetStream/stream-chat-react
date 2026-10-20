import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { GalleryContext } from './GalleryContext';
import { GalleryUI as DefaultGalleryUI } from './GalleryUI';
import { useComponentContext } from '../../context';

import type { GalleryContextValue, GalleryItem } from './GalleryContext';

export type GalleryProps = {
  /** Whether clicking the empty gallery background requests close. Defaults to true. */
  closeOnBackgroundClick?: boolean;
  items: GalleryItem[];
  /** Replaces the default UI and takes precedence over `ComponentContext.GalleryUI`. */
  GalleryUI?: React.ComponentType;
  /** Index of the item shown first. Defaults to 0. */
  initialIndex?: number;
  /** Called on mount and whenever the active index changes. */
  onIndexChange?: (index: number) => void;
  /** Called when the gallery requests to close. */
  onRequestClose?: () => void;
};

export const Gallery = ({
  closeOnBackgroundClick = true,
  GalleryUI,
  initialIndex = 0,
  items,
  onIndexChange,
  onRequestClose,
}: GalleryProps) => {
  const { GalleryUI: ContextGalleryUI } = useComponentContext();
  const ResolvedGalleryUI = GalleryUI ?? ContextGalleryUI ?? DefaultGalleryUI;
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
      closeOnBackgroundClick,
      currentIndex,
      currentItem,
      goToIndex,
      goToNext,
      goToPrevious,
      hasNext,
      hasPrevious,
      itemCount,
      items,
      onRequestClose,
    }),
    [
      closeOnBackgroundClick,
      currentIndex,
      currentItem,
      goToIndex,
      goToNext,
      goToPrevious,
      hasNext,
      hasPrevious,
      itemCount,
      items,
      onRequestClose,
    ],
  );

  return (
    <GalleryContext.Provider value={contextValue}>
      <ResolvedGalleryUI />
    </GalleryContext.Provider>
  );
};

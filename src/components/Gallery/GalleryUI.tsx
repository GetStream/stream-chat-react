import React, { useCallback, useEffect, useRef, useState } from 'react';

import { BaseImage } from './BaseImage';
import { useGalleryContext } from './GalleryContext';
import { Button, type ButtonProps } from '../Button';
import { IconChevronRight } from '../Icons';
import { useTranslationContext } from '../../context';
import { VideoPlayer } from '../VideoPlayer';
import { VideoThumbnail } from '../VideoPlayer/VideoThumbnail';

import clsx from 'clsx';

const SWIPE_THRESHOLD = 50;
const TRANSITION_DURATION = 300;

export const GalleryUI = () => {
  const { t } = useTranslationContext();
  const {
    currentIndex,
    currentItem,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious,
    itemCount,
  } = useGalleryContext();

  const [showVideo, setShowVideo] = useState(false);

  // Slide transition state
  const isTransitioningRef = useRef(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward' | null>(
    null,
  );

  // Touch tracking refs
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isVerticalSwipeRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset video play state when navigating to a new item
  useEffect(() => {
    setShowVideo(false);
  }, [currentIndex]);

  // Slide animation on index change
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (prevIndexRef.current === currentIndex) return;
    const direction = currentIndex > prevIndexRef.current ? 'forward' : 'backward';
    setSlideDirection(direction);
    setSlideOffset(0);
    setIsDragging(false);
    isTransitioningRef.current = true;

    const timer = setTimeout(() => {
      setSlideDirection(null);
      isTransitioningRef.current = false;
    }, TRANSITION_DURATION);

    prevIndexRef.current = currentIndex;
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Wrapped navigation functions that respect transition lock
  const handleGoToNext = useCallback(() => {
    if (isTransitioningRef.current) return;
    goToNext();
  }, [goToNext]);

  const handleGoToPrevious = useCallback(() => {
    if (isTransitioningRef.current) return;
    goToPrevious();
  }, [goToPrevious]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handleGoToPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleGoToNext();
      }
    },
    [handleGoToNext, handleGoToPrevious],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch event handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (isTransitioningRef.current) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isVerticalSwipeRef.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!touchStartRef.current || isTransitioningRef.current) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Determine swipe direction on first significant movement
      if (!isDragging && !isVerticalSwipeRef.current) {
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
          isVerticalSwipeRef.current = true;
          return;
        }
        if (Math.abs(deltaX) > 10) {
          setIsDragging(true);
        }
      }

      if (isVerticalSwipeRef.current) return;

      // Constrain drag when at boundaries
      if ((!hasNext && deltaX < 0) || (!hasPrevious && deltaX > 0)) {
        setSlideOffset(deltaX * 0.3); // Rubber-band effect
      } else {
        setSlideOffset(deltaX);
      }
    },
    [isDragging, hasNext, hasPrevious],
  );

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || isVerticalSwipeRef.current) {
      touchStartRef.current = null;
      return;
    }

    const offset = slideOffset;
    touchStartRef.current = null;

    if (Math.abs(offset) >= SWIPE_THRESHOLD) {
      if (offset < 0 && hasNext) {
        goToNext();
      } else if (offset > 0 && hasPrevious) {
        goToPrevious();
      } else {
        // Snap back — at boundary
        setSlideOffset(0);
      }
    } else {
      // Snap back — below threshold
      setSlideOffset(0);
    }

    setIsDragging(false);
  }, [slideOffset, hasNext, hasPrevious, goToNext, goToPrevious]);

  const mediaStyle: React.CSSProperties =
    isDragging || (slideOffset !== 0 && slideDirection === null)
      ? { transform: `translateX(${slideOffset}px)` }
      : {};

  return (
    <div className='str-chat__gallery'>
      <div className='str-chat__gallery__main'>
        <NavButton
          aria-label={t('Previous image')}
          className={clsx(
            'str-chat__gallery__nav-button--prev',
            !hasPrevious && 'str-chat__gallery__nav-button--hidden',
          )}
          disabled={!hasPrevious}
          onClick={handleGoToPrevious}
        >
          <IconChevronRight />
        </NavButton>
        <div
          className='str-chat__gallery__slide-container'
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchStart}
          ref={containerRef}
        >
          <div
            className={clsx({
              'str-chat__gallery__media--dragging': isDragging,
              'str-chat__gallery__media--slide-backward':
                !isDragging && slideDirection === 'backward',
              'str-chat__gallery__media--slide-forward':
                !isDragging && slideDirection === 'forward',
            })}
            style={mediaStyle}
          >
            {currentItem.videoUrl && currentItem.videoThumbnailUrl ? (
              <div className='str-chat__gallery__media str-chat__gallery__media--video'>
                {showVideo ? (
                  <VideoPlayer isPlaying videoUrl={currentItem.videoUrl} />
                ) : (
                  <VideoThumbnail
                    alt={currentItem.title ?? ''}
                    onPlay={() => setShowVideo(true)}
                    src={currentItem.videoThumbnailUrl}
                  />
                )}
              </div>
            ) : (
              <div className='str-chat__gallery__media str-chat__gallery__media--image'>
                <BaseImage alt={currentItem.alt} src={currentItem.imageUrl} />
              </div>
            )}
          </div>
        </div>
        <NavButton
          aria-label={t('Next image')}
          className={clsx(
            'str-chat__gallery__nav-button--next',
            !hasNext && 'str-chat__gallery__nav-button--hidden',
          )}
          disabled={!hasNext}
          onClick={handleGoToNext}
        >
          <IconChevronRight />
        </NavButton>
      </div>
      {itemCount > 1 && (
        <div className='str-chat__gallery__position-indicator'>
          {currentIndex + 1} / {itemCount}
        </div>
      )}
    </div>
  );
};

const NavButton = ({ className, ...props }: ButtonProps) => (
  <Button {...props} className={clsx('str-chat__gallery__nav-button', className)} />
);

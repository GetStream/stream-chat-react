import React, { useCallback, useEffect, useState } from 'react';
import { isLocalAttachment, isVideoAttachment, type LocalAttachment } from 'stream-chat';

import { BaseImage } from './BaseImage';
import { useGalleryContext } from './GalleryContext';
import { IconChevronRight } from '../Icons';
import { useTranslationContext } from '../../context';
import { VideoPlayer } from '../VideoPlayer';
import { VideoThumbnail } from '../VideoPlayer/VideoThumbnail';

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

  // Reset video play state when navigating to a new item
  useEffect(() => {
    setShowVideo(false);
  }, [currentIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      }
    },
    [goToNext, goToPrevious],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderMedia = () => {
    if (isVideoAttachment(currentItem)) {
      return (
        <div className='str-chat__gallery__media str-chat__gallery__media--video'>
          {showVideo ? (
            <VideoPlayer isPlaying videoUrl={currentItem.asset_url} />
          ) : (
            <VideoThumbnail
              alt={currentItem.title ?? ''}
              onPlay={() => setShowVideo(true)}
              src={currentItem.thumb_url}
            />
          )}
        </div>
      );
    }

    return (
      <div className='str-chat__gallery__media str-chat__gallery__media--image'>
        <BaseImage
          alt={currentItem.fallback ?? ''}
          src={
            currentItem.image_url ||
            (isLocalAttachment(currentItem)
              ? (currentItem as LocalAttachment).localMetadata?.previewUri
              : '')
          }
        />
      </div>
    );
  };

  return (
    <div className='str-chat__gallery'>
      <div className='str-chat__gallery__main'>
        {hasPrevious && (
          <button
            aria-label={t('Previous image')}
            className='str-chat__gallery__nav-button str-chat__gallery__nav-button--prev'
            onClick={goToPrevious}
            type='button'
          >
            <IconChevronRight />
          </button>
        )}
        {renderMedia()}
        {hasNext && (
          <button
            aria-label={t('Next image')}
            className='str-chat__gallery__nav-button str-chat__gallery__nav-button--next'
            onClick={goToNext}
            type='button'
          >
            <IconChevronRight />
          </button>
        )}
      </div>
      {itemCount > 1 && (
        <div className='str-chat__gallery__position-indicator'>
          {currentIndex + 1} / {itemCount}
        </div>
      )}
    </div>
  );
};

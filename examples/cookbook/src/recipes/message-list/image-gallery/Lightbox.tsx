import { useEffect, useRef } from 'react';
import { useComponentContextIcons, useGalleryContext } from 'stream-chat-react';
import { LightboxCaption } from './LightboxCaption';
import { LightboxMedia } from './LightboxMedia';
import { ThumbnailStrip } from './ThumbnailStrip';
import { useLightboxNavigation } from './useLightboxNavigation';
import './Lightbox.css';

/** The open gallery: who shared it, the current item with Previous and Next, its caption, and a strip of every item. */
export const Lightbox = () => {
  const { IconChevronLeft, IconChevronRight, IconXmark } = useComponentContextIcons();
  const {
    currentIndex,
    currentItem,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious,
    itemCount,
    onRequestClose,
  } = useGalleryContext();
  const swipeHandlers = useLightboxNavigation();
  const closeButton = useRef<HTMLButtonElement>(null);

  // The lightbox opens with the focus on Close, so Enter or Escape closes it at once.
  useEffect(() => closeButton.current?.focus(), []);

  return (
    <div className='cookbook-lightbox'>
      <div className='cookbook-lightbox__header'>
        <span className='cookbook-lightbox__sender'>
          {currentItem.user?.name ?? currentItem.user?.id}
        </span>
        <span className='cookbook-lightbox__position'>
          {currentIndex + 1} / {itemCount}
        </span>
        <button
          aria-label='Close'
          className='cookbook-lightbox__button'
          onClick={onRequestClose}
          ref={closeButton}
          type='button'
        >
          <IconXmark />
        </button>
      </div>
      <div className='cookbook-lightbox__stage'>
        <button
          aria-label='Previous'
          className='cookbook-lightbox__button'
          disabled={!hasPrevious}
          onClick={goToPrevious}
          type='button'
        >
          <IconChevronLeft />
        </button>
        <figure className='cookbook-lightbox__figure' {...swipeHandlers}>
          <LightboxMedia item={currentItem} />
          <LightboxCaption item={currentItem} />
        </figure>
        <button
          aria-label='Next'
          className='cookbook-lightbox__button'
          disabled={!hasNext}
          onClick={goToNext}
          type='button'
        >
          <IconChevronRight />
        </button>
      </div>
      <ThumbnailStrip />
    </div>
  );
};

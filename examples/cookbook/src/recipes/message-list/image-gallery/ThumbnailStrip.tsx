import { useEffect, useRef } from 'react';
import { useComponentContextIcons, useGalleryContext } from 'stream-chat-react';
import './ThumbnailStrip.css';

/** A thumbnail of every item in the gallery; the current one is marked, and a click shows another. */
export const ThumbnailStrip = () => {
  const { IconPlayFill } = useComponentContextIcons();
  const { currentIndex, goToIndex, itemCount, items } = useGalleryContext();
  const currentThumbnail = useRef<HTMLButtonElement>(null);

  // Keeps the current thumbnail in view when the strip is wider than the lightbox.
  useEffect(() => {
    currentThumbnail.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [currentIndex]);

  if (itemCount < 2) return null;

  return (
    <div aria-label='All items' className='cookbook-thumbnail-strip' role='group'>
      {items.map((item, index) => (
        <button
          aria-current={index === currentIndex}
          aria-label={`Show ${item.videoUrl ? 'video' : 'image'} ${index + 1}`}
          className='cookbook-thumbnail-strip__thumbnail'
          key={item.imageUrl ?? item.videoUrl ?? index}
          onClick={() => goToIndex(index)}
          ref={index === currentIndex ? currentThumbnail : undefined}
          type='button'
        >
          <img alt='' src={item.imageUrl ?? item.videoThumbnailUrl} />
          {item.videoUrl && (
            <span className='cookbook-thumbnail-strip__play'>
              <IconPlayFill />
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

import { useContext, useMemo, useState } from 'react';
import { convertTimestampToDate } from 'stream-chat';
import type { ModalGalleryProps } from 'stream-chat-react';
import {
  Gallery,
  GlobalModal,
  MessageContext,
  useComponentContextIcons,
} from 'stream-chat-react';
import { Lightbox } from './Lightbox';
import './ImageGrid.css';

const MAX_TILES = 4;

/**
 * A message's images and videos as a grid of up to four tiles; a click opens the lightbox at that
 * item. A video tile shows the video's thumbnail with a play badge.
 */
export const ImageGrid = ({ items }: ModalGalleryProps) => {
  const { IconPlayFill } = useComponentContextIcons();
  // The SDK also renders the `ModalGallery` component outside a message, where there is no
  // `MessageContext`, so the message may be missing.
  const { message } = useContext(MessageContext) ?? {};
  const [openAt, setOpenAt] = useState<number>();

  // The lightbox renders in a modal, outside MessageContext, so each item carries its message,
  // its sender and when it was shared.
  const galleryItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        createdAt: item.createdAt ?? convertTimestampToDate(message?.created_at),
        message: item.message ?? message,
        user: item.user ?? message?.user ?? undefined,
      })),
    [items, message],
  );
  const tiles = galleryItems.slice(0, MAX_TILES);
  const hiddenCount = galleryItems.length - tiles.length;
  const close = () => setOpenAt(undefined);

  return (
    <>
      <div className='cookbook-image-grid' data-count={tiles.length}>
        {tiles.map((item, index) => (
          <button
            aria-label={`Open ${item.videoUrl ? 'video' : 'image'} ${index + 1} of ${galleryItems.length}`}
            className='cookbook-image-grid__tile'
            key={item.imageUrl ?? item.videoUrl ?? index}
            onClick={() => setOpenAt(index)}
            type='button'
          >
            <img
              alt=''
              className='cookbook-image-grid__image'
              src={item.imageUrl ?? item.videoThumbnailUrl}
            />
            {item.videoUrl && (
              <span className='cookbook-image-grid__play'>
                <IconPlayFill />
              </span>
            )}
            {index === MAX_TILES - 1 && hiddenCount > 0 && (
              <span className='cookbook-image-grid__more'>+{hiddenCount}</span>
            )}
          </button>
        ))}
      </div>
      <GlobalModal
        aria-label='Image gallery'
        className='cookbook-lightbox-modal'
        onClose={close}
        open={openAt !== undefined}
      >
        {openAt !== undefined && (
          <Gallery
            GalleryUI={Lightbox}
            initialIndex={openAt}
            items={galleryItems}
            onRequestClose={close}
          />
        )}
      </GlobalModal>
    </>
  );
};

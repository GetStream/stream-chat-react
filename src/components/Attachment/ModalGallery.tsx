import React, { useCallback, useState } from 'react';
import clsx from 'clsx';

import type { GalleryItem } from '../Gallery';
import { BaseImage, Gallery, GalleryUI } from '../Gallery';
import { GlobalModal } from '../Modal';
import { useComponentContext, useTranslationContext } from '../../context';
import { VideoThumbnail } from '../VideoPlayer/VideoThumbnail';

const MAX_VISIBLE_THUMBNAILS = 4;

export type ModalGalleryProps = {
  /** Array of media attachments to display */
  items: GalleryItem[];
  className?: string;
  modalClassName?: string;
};

export const ModalGallery = ({ className, items, modalClassName }: ModalGalleryProps) => {
  const { t } = useTranslationContext();
  const { Modal = GlobalModal } = useComponentContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
    setModalOpen(true);
  }, []);

  const itemCount = items.length;
  const visibleItems = items.slice(0, MAX_VISIBLE_THUMBNAILS);
  const overflowCount = itemCount - MAX_VISIBLE_THUMBNAILS;

  return (
    <>
      <div
        className={clsx('str-chat__modal-gallery', className, {
          'str-chat__modal-gallery--three-images': itemCount === 3,
          'str-chat__modal-gallery--two-images': itemCount === 2,
        })}
      >
        {visibleItems.map((item, index) => {
          const isLastVisible = index === MAX_VISIBLE_THUMBNAILS - 1;
          const showOverlay = isLastVisible && overflowCount > 0;

          return (
            <button
              aria-label={
                items.length === 1
                  ? t('Open image in gallery')
                  : t('Open gallery at image {{ index }}', {
                      index: index + 1,
                    })
              }
              className='str-chat__modal-gallery__image'
              key={index}
              onClick={() => handleThumbnailClick(index)}
              type='button'
            >
              {item.videoThumbnailUrl ? (
                <VideoThumbnail
                  alt={t('User uploaded content')}
                  src={item.videoThumbnailUrl}
                />
              ) : (
                <BaseImage alt={t('User uploaded content')} src={item.imageUrl} />
              )}
              {showOverlay && (
                <div className='str-chat__modal-gallery__placeholder'>
                  +{overflowCount}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <Modal
        className={clsx('str-chat__gallery-modal', modalClassName)}
        onClose={closeModal}
        open={modalOpen}
      >
        <Gallery GalleryUI={GalleryUI} initialIndex={selectedIndex} items={items} />
      </Modal>
    </>
  );
};

import React, { useState } from 'react';
import clsx from 'clsx';

import { Modal } from '../Modal';
import { ModalGallery as DefaultModalGallery } from './ModalGallery';

import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { Attachment } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type GalleryProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  images:
    | {
        image_url?: string | undefined;
        thumb_url?: string | undefined;
      }[]
    | Attachment<StreamChatGenerics>[];
};

const UnMemoizedGallery = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: GalleryProps<StreamChatGenerics>,
) => {
  const { images } = props;

  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const { ModalGallery = DefaultModalGallery } = useComponentContext('Gallery');
  const { t } = useTranslationContext('Gallery');

  const countImagesDisplayedInPreview = 4;
  const lastImageIndexInPreview = countImagesDisplayedInPreview - 1;

  const toggleModal = (selectedIndex: number) => {
    if (modalOpen) {
      setModalOpen(false);
    } else {
      setIndex(selectedIndex);
      setModalOpen(true);
    }
  };

  const renderImages = images.slice(0, countImagesDisplayedInPreview).map((image, i) =>
    i === lastImageIndexInPreview && images.length > countImagesDisplayedInPreview ? (
      <button
        className='str-chat__gallery-placeholder'
        key={`gallery-image-${i}`}
        onClick={() => toggleModal(i)}
        style={{
          backgroundImage: `url(${images[lastImageIndexInPreview].image_url})`,
        }}
      >
        <p>
          {t<string>('{{ imageCount }} more', {
            imageCount: images.length - countImagesDisplayedInPreview,
          })}
        </p>
      </button>
    ) : (
      <button
        className='str-chat__gallery-image'
        data-testid='gallery-image'
        key={`gallery-image-${i}`}
        onClick={() => toggleModal(i)}
      >
        <img alt='User uploaded content' src={image.image_url || image.thumb_url} />
      </button>
    ),
  );

  const className = clsx('str-chat__gallery', {
    'str-chat__gallery--square': images.length > lastImageIndexInPreview,
    'str-chat__gallery-two-rows': images.length > 2,
  });

  return (
    <div className={className}>
      {renderImages}
      <Modal onClose={() => setModalOpen((modalOpen) => !modalOpen)} open={modalOpen}>
        <ModalGallery images={images} index={index} />
      </Modal>
    </div>
  );
};

/**
 * Displays images in a simple responsive grid with a light box to view the images.
 */
export const Gallery = React.memo(UnMemoizedGallery) as typeof UnMemoizedGallery;

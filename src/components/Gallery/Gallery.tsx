import React, { useMemo, useState } from 'react';

import { ModalComponent as ModalWrapper } from './ModalWrapper';

import { useTranslationContext } from '../../context/TranslationContext';

import type { Attachment } from 'stream-chat';

import type { DefaultAttachmentType } from '../../types/types';

export type GalleryProps<At extends DefaultAttachmentType = DefaultAttachmentType> = {
  images:
    | {
        image_url?: string | undefined;
        thumb_url?: string | undefined;
      }[]
    | Attachment<At>[];
};

const UnMemoizedGallery = <At extends DefaultAttachmentType = DefaultAttachmentType>(
  props: GalleryProps<At>,
) => {
  const { images } = props;

  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const { t } = useTranslationContext('Gallery');

  const toggleModal = (selectedIndex: number) => {
    if (modalOpen) {
      setModalOpen(false);
    } else {
      setIndex(selectedIndex);
      setModalOpen(true);
    }
  };

  const formattedArray = useMemo(
    () =>
      images.map((image) => ({
        source: image.image_url || image.thumb_url || '',
      })),
    [images],
  );

  const renderImages = images.slice(0, 3).map((image, i) => (
    <div
      className='str-chat__gallery-image'
      data-testid='gallery-image'
      key={`gallery-image-${i}`}
      onClick={() => toggleModal(i)}
    >
      <img src={image.image_url || image.thumb_url} />
    </div>
  ));

  return (
    <div className={`str-chat__gallery ${images.length > 3 ? 'str-chat__gallery--square' : ''}`}>
      {renderImages}
      {images.length > 3 && (
        <div
          className='str-chat__gallery-placeholder'
          onClick={() => toggleModal(3)}
          style={{
            backgroundImage: `url(${images[3].image_url})`,
          }}
        >
          <p>
            {t('{{ imageCount }} more', {
              imageCount: images.length - 3,
            })}
          </p>
        </div>
      )}
      <ModalWrapper
        images={formattedArray}
        index={index}
        modalIsOpen={modalOpen}
        toggleModal={() => setModalOpen(!modalOpen)}
      />
    </div>
  );
};

/**
 * Displays images in a simple responsive grid with a light box to view the images.
 */
export const Gallery = React.memo(UnMemoizedGallery) as typeof UnMemoizedGallery;

import type { CSSProperties, MutableRefObject } from 'react';
import React, { useState } from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';
import clsx from 'clsx';

import { BaseImage as DefaultBaseImage } from './BaseImage';
import { Modal as DefaultModal } from '../Modal';
import { ModalGallery as DefaultModalGallery } from './ModalGallery';

import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { Attachment } from 'stream-chat';

export type GalleryProps = {
  images: ((
    | {
        image_url?: string | undefined;
        thumb_url?: string | undefined;
      }
    | Attachment
  ) & { previewUrl?: string; style?: CSSProperties })[];
  innerRefs?: MutableRefObject<(HTMLElement | null)[]>;
};

const UnMemoizedGallery = (props: GalleryProps) => {
  const { images, innerRefs } = props;

  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    BaseImage = DefaultBaseImage,
    Modal = DefaultModal,
    ModalGallery = DefaultModalGallery,
  } = useComponentContext('Gallery');
  const { t } = useTranslationContext('Gallery');

  const imageFallbackTitle = t('User uploaded content');

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
        data-testid='gallery-image-last'
        key={`gallery-image-${i}`}
        onClick={() => toggleModal(i)}
        style={{
          backgroundImage: `url(${
            images[lastImageIndexInPreview].previewUrl ||
            images[lastImageIndexInPreview].image_url ||
            images[lastImageIndexInPreview].thumb_url
          })`,
          ...image.style,
        }}
        {...(innerRefs?.current && {
          ref: (r) => {
            innerRefs.current[i] = r;
          },
        })}
      >
        <p>
          {t('+{{ imageCount }}', {
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
        <BaseImage
          alt={(image as Attachment)?.fallback || imageFallbackTitle}
          src={sanitizeUrl(image.previewUrl || image.image_url || image.thumb_url)}
          style={image.style}
          title={(image as Attachment)?.fallback || imageFallbackTitle}
          {...(innerRefs?.current && {
            ref: (r) => {
              innerRefs.current[i] = r;
            },
          })}
        />
      </button>
    ),
  );

  const className = clsx('str-chat__gallery', {
    'str-chat__gallery--three-images': images.length === 3,
    'str-chat__gallery--two-images': images.length === 2,
  });

  return (
    <div className={className}>
      {renderImages}
      <Modal
        className='str-chat__gallery-modal'
        onClose={() => setModalOpen((modalOpen) => !modalOpen)}
        open={modalOpen}
      >
        <ModalGallery images={images} index={index} />
      </Modal>
    </div>
  );
};

/**
 * Displays images in a simple responsive grid with a light box to view the images.
 */
export const Gallery = React.memo(UnMemoizedGallery) as typeof UnMemoizedGallery;

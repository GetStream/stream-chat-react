import React, { useMemo } from 'react';
import ImageGallery, { ReactImageGalleryItem } from 'react-image-gallery';
import { BaseImage } from './BaseImage';
import { useTranslationContext } from '../../context';

import type { Attachment } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type ModalGalleryProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  /** The images for the Carousel component */
  images: Attachment<StreamChatGenerics>[];
  /** The index for the component */
  index?: number;
};

const onError: React.ReactEventHandler<HTMLImageElement> = (e) => {
  // Prevent having alt attribute on img as the img takes the height of the alt text
  // instead of the CSS / element width & height when the CSS mask (fallback) is applied.
  (e.target as HTMLImageElement).alt = '';
};

const renderItem = ({ original, originalAlt }: ReactImageGalleryItem) => (
  <BaseImage
    alt={originalAlt}
    className='image-gallery-image'
    onError={onError}
    src={original}
  />
);

export const ModalGallery = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ModalGalleryProps<StreamChatGenerics>,
) => {
  const { images, index } = props;
  const { t } = useTranslationContext('ModalGallery');

  const formattedArray = useMemo(
    () =>
      images.map((image) => {
        const imageSrc = image.image_url || image.thumb_url || '';
        return {
          original: imageSrc,
          originalAlt: t('User uploaded content'),
          source: imageSrc,
        };
      }),
    [images, t],
  );

  return (
    <ImageGallery
      items={formattedArray}
      renderItem={renderItem}
      showIndex={true}
      showPlayButton={false}
      showThumbnails={false}
      startIndex={index}
    />
  );
};

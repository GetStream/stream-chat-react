import React, { useMemo } from 'react';
import ImageGallery from 'react-image-gallery';
import { useTranslationContext } from '../../context';

import type { Attachment } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type ModalGalleryProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** The images for the Carousel component */
  images: Attachment<StreamChatGenerics>[];
  /** The index for the component */
  index?: number;
};

export const ModalGallery = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
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
    [images],
  );

  return (
    <ImageGallery
      items={formattedArray}
      showIndex={true}
      showPlayButton={false}
      showThumbnails={false}
      startIndex={index}
    />
  );
};

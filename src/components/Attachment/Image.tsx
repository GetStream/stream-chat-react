import React from 'react';
import { ModalGallery as DefaultModalGallery } from './ModalGallery';
import { useComponentContext } from '../../context';
import type { GalleryItem } from '../Gallery/GalleryContext';

export type ImageProps = GalleryItem & {
  /**
   * When false, the image is shown inline only; tap does not open the fullscreen gallery.
   * @default true
   */
  interactive?: boolean;
};

/**
 * Display image with optional expand into modal gallery (see `interactive`).
 */
export const ImageComponent = ({ interactive = true, ...galleryItem }: ImageProps) => {
  const { ModalGallery = DefaultModalGallery } = useComponentContext();

  return (
    <ModalGallery
      interactive={interactive}
      items={[galleryItem]}
      modalClassName='str-chat__image-modal'
    />
  );
};

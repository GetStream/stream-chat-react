import React from 'react';
import { ModalGallery as DefaultModalGallery } from './ModalGallery';
import { useComponentContext } from '../../context';
import type { GalleryItem } from '../Gallery/GalleryContext';

export type ImageProps = GalleryItem;

/**
 * Display image with tap-to-expand modal gallery.
 */
export const ImageComponent = (galleryItem: ImageProps) => {
  const { ModalGallery = DefaultModalGallery } = useComponentContext();

  return <ModalGallery items={[galleryItem]} modalClassName='str-chat__image-modal' />;
};

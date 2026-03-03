import React from 'react';
import { ModalGallery as DefaultModalGallery } from './ModalGallery';
import { useComponentContext } from '../../context';
import type { GalleryItem } from '../Gallery/GalleryContext';

export type ImageProps = GalleryItem;

/**
 * Display image in with option to expand into modal gallery
 */
export const ImageComponent = (props: ImageProps) => {
  const { ModalGallery = DefaultModalGallery } = useComponentContext();

  return <ModalGallery items={[props]} modalClassName='str-chat__image-modal' />;
};

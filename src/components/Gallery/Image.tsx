import type { CSSProperties, MutableRefObject } from 'react';
import { useCallback } from 'react';
import React, { useState } from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { BaseImage as DefaultBaseImage } from './BaseImage';
import { Modal as DefaultModal } from '../Modal';
import { ModalGallery as DefaultModalGallery } from './ModalGallery';
import { useComponentContext } from '../../context';

import type { Attachment } from 'stream-chat';
import type { Dimensions } from '../../types/types';
import clsx from 'clsx';

export type ImageProps = {
  className?: string;
  dimensions?: Dimensions;
  innerRef?: MutableRefObject<HTMLImageElement | null>;
  previewUrl?: string;
  style?: CSSProperties;
} & (
  | {
      /** The text fallback for the image */
      fallback?: string;
      /** The full size image url */
      image_url?: string;
      /** The thumb url */
      thumb_url?: string;
    }
  | Attachment
);

/**
 * A simple component that displays an image.
 */
export const ImageComponent = (props: ImageProps) => {
  const {
    className,
    dimensions = {},
    fallback,
    image_url,
    innerRef,
    previewUrl,
    style,
    thumb_url,
  } = props;

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const {
    BaseImage = DefaultBaseImage,
    Modal = DefaultModal,
    ModalGallery = DefaultModalGallery,
  } = useComponentContext('ImageComponent');

  const imageSrc = sanitizeUrl(previewUrl || image_url || thumb_url);
  const closeModal = useCallback(() => {
    setModalIsOpen(false);
  }, []);

  const openModal = useCallback(() => {
    setModalIsOpen(true);
  }, []);

  return (
    <>
      <BaseImage
        alt={fallback}
        className={clsx('str-chat__message-attachment--img', className)}
        data-testid='image-test'
        onClick={openModal}
        src={imageSrc}
        style={style}
        tabIndex={0}
        title={fallback}
        {...dimensions}
        {...(innerRef && { ref: innerRef })}
      />
      <Modal className='str-chat__image-modal' onClose={closeModal} open={modalIsOpen}>
        <ModalGallery images={[props]} index={0} />
      </Modal>
    </>
  );
};

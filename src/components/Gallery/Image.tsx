import React, { CSSProperties, MutableRefObject, useState } from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { Modal } from '../Modal';
import { ModalGallery as DefaultModalGallery } from './ModalGallery';
import { useComponentContext } from '../../context';

import type { Attachment } from 'stream-chat';
import type { DefaultStreamChatGenerics, Dimensions } from '../../types/types';

export type ImageProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
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
  | Attachment<StreamChatGenerics>
);

/**
 * A simple component that displays an image.
 */
export const ImageComponent = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ImageProps<StreamChatGenerics>,
) => {
  const { dimensions = {}, fallback, image_url, thumb_url, innerRef, previewUrl, style } = props;

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { ModalGallery = DefaultModalGallery } = useComponentContext('ImageComponent');

  const imageSrc = sanitizeUrl(previewUrl || image_url || thumb_url);

  const toggleModal = () => setModalIsOpen((modalIsOpen) => !modalIsOpen);

  return (
    <>
      <img
        alt={fallback}
        className='str-chat__message-attachment--img'
        data-testid='image-test'
        onClick={toggleModal}
        src={imageSrc}
        style={style}
        tabIndex={0}
        {...dimensions}
        {...(innerRef && { ref: innerRef })}
      />
      <Modal onClose={toggleModal} open={modalIsOpen}>
        <ModalGallery images={[props]} index={0} />
      </Modal>
    </>
  );
};

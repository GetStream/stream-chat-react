import React, { useState } from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { ModalComponent as ModalWrapper } from './ModalWrapper';

export type ImageProps = {
  /** The text fallback for the image */
  fallback?: string;
  /** The full size image url */
  image_url?: string;
  /** The thumb url */
  thumb_url?: string;
};

/**
 * A simple component that displays an image.
 */
export const ImageComponent = (props: ImageProps) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const { fallback, image_url, thumb_url } = props;
  const imageSrc = sanitizeUrl(image_url || thumb_url);
  const formattedArray = [
    { original: imageSrc, originalAlt: 'User uploaded content', source: imageSrc },
  ];

  const toggleModal = () => setModalIsOpen(!modalIsOpen);

  return (
    <>
      <img
        alt={fallback}
        className='str-chat__message-attachment--img'
        data-testid='image-test'
        onClick={toggleModal}
        onKeyPress={toggleModal}
        src={imageSrc}
        tabIndex={0}
      />

      <ModalWrapper
        images={formattedArray}
        index={0}
        modalIsOpen={modalIsOpen}
        toggleModal={toggleModal}
      />
    </>
  );
};

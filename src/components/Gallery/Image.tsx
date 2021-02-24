import React from 'react';

import { ModalComponent as ModalWrapper } from './ModalWrapper';
import { sanitizeUrl } from '@braintree/sanitize-url';

export type ImageProps = {
  /** The text fallback for the image */
  fallback?: string;
  /** The full size image url */
  image_url?: string;
  /** The thumb url */
  thumb_url?: string;
};

export const ImageComponent: React.FC<ImageProps> = (props) => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false);

  const { fallback, image_url, thumb_url } = props;
  const imageSrc = sanitizeUrl(image_url || thumb_url);
  const formattedArray = [{ source: imageSrc }];

  const toggleModal = () => setModalIsOpen(!modalIsOpen);

  return (
    <React.Fragment>
      <img
        alt={fallback}
        className='str-chat__message-attachment--img'
        data-testid='image-test'
        onClick={toggleModal}
        src={imageSrc}
      />

      <ModalWrapper
        images={formattedArray}
        index={0}
        modalIsOpen={modalIsOpen}
        toggleModal={toggleModal}
      />
    </React.Fragment>
  );
};

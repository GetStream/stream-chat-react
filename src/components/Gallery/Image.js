/* @ts-check */
import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';

import ImageModal from './ImageModal';

/**
 * Image - Small wrapper around an image tag, supports thumbnails
 *
 * @example ../../docs/Image.md
 * @type import('types').Image
 */
const Image = ({ image_url, thumb_url, fallback }) => {
  const [modalIsOpen, setModalOpen] = useState(false);
  const formattedArray = [{ src: image_url || thumb_url }];

  const toggleModal = () => {
    if (modalIsOpen) {
      setModalOpen(false);
    } else {
      setModalOpen(true);
    }
  };

  return (
    <Fragment>
      <img
        className="str-chat__message-attachment--img"
        data-testid="image-test"
        onClick={toggleModal}
        src={thumb_url || image_url}
        alt={fallback}
      />
      <ImageModal
        images={formattedArray}
        toggleModal={toggleModal}
        modalIsOpen={modalIsOpen}
      />
    </Fragment>
  );
};

Image.propTypes = {
  /** The full size image url */
  image_url: PropTypes.string,
  /** The thumb url */
  thumb_url: PropTypes.string,
  /** The text fallback for the image */
  fallback: PropTypes.string,
};

export default React.memo(Image);

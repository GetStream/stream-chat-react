// @ts-check
import React from 'react';
import PropTypes from 'prop-types';
import Carousel, { Modal, ModalGateway } from 'react-images';
import ModalImage from './ModalImage';

/**
 * ImageModal - Small modal component
 * @type import('types').ImageModal
 */
const ImageModal = ({ images, toggleModal, index, modalIsOpen }) => (
  <ModalGateway>
    {modalIsOpen ? (
      <Modal onClose={toggleModal}>
        <Carousel
          views={images}
          currentIndex={index}
          components={{
            View: ModalImage,
          }}
        />
      </Modal>
    ) : null}
  </ModalGateway>
);

ImageModal.propTypes = {
  images: PropTypes.array,
  toggleModal: PropTypes.func,
  index: PropTypes.number,
  modalIsOpen: PropTypes.bool,
};

export default ImageModal;

import React from 'react';
import PropTypes from 'prop-types';
import Carousel, { Modal, ModalGateway } from 'react-images';
import ModalImage from './ModalImage';

const ImageModal = ({ images, toggleModal, index, modalIsOpen }) => (
  <ModalGateway>
    {modalIsOpen ? (
      <Modal onClose={toggleModal}>
        <Carousel
          views={images}
          isFullScreen={false}
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
  toggleModal: PropTypes.function,
  index: PropTypes.number,
  modalIsOpen: PropTypes.bool,
};

export default ImageModal;

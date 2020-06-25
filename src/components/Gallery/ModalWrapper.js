// @ts-check
import React from 'react';
import PropTypes from 'prop-types';
import Carousel, { Modal, ModalGateway } from 'react-images';
import ModalImage from './ModalImage';

/**
 * ImageModal - Small modal component
 * @type { React.FC<import('types').ModalWrapperProps>}
 */
const ModalComponent = ({ images, toggleModal, index, modalIsOpen }) => (
  <ModalGateway>
    {modalIsOpen ? (
      // @ts-ignore
      <Modal onClose={toggleModal}>
        <Carousel
          views={images}
          currentIndex={index}
          components={{
            // @ts-ignore
            View: ModalImage,
          }}
        />
      </Modal>
    ) : null}
  </ModalGateway>
);

ModalComponent.propTypes = {
  images: PropTypes.array.isRequired,
  toggleModal: PropTypes.func.isRequired,
  index: PropTypes.number,
  modalIsOpen: PropTypes.bool.isRequired,
};

export default ModalComponent;

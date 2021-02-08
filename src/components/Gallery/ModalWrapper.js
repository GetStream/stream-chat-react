// @ts-check
import React from 'react';
import PropTypes from 'prop-types';
import Carousel, { Modal, ModalGateway } from 'react-images';
import ModalImage from './ModalImage';

/**
 * ImageModal - Small modal component
 * @type { React.FC<import('types').ModalWrapperProps>}
 */
const ModalComponent = ({ images, index, modalIsOpen, toggleModal }) => (
  <ModalGateway>
    {modalIsOpen ? (
      // @ts-expect-error
      <Modal onClose={toggleModal}>
        <Carousel
          components={{
            // @ts-expect-error
            View: ModalImage,
          }}
          currentIndex={index}
          views={images}
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

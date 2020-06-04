// @ts-check
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Modal - Custom Image component used in modal
 * @type import('types').ModalImage
 */
const ModalImage = ({ data }) => (
  <div className="str-chat__modal-image__wrapper" data-testid="modal-image">
    <img src={data.src} className="str-chat__modal-image__image" />
  </div>
);

ModalImage.propTypes = {
  data: PropTypes.object,
};

export default ModalImage;

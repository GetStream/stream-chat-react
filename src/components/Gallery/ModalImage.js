import React from 'react';
import PropTypes from 'prop-types';

const ModalImage = ({ data }) =>
  console.log(data) || (
    <div className="str-chat__modal-image__wrapper">
      <img src={data.src} className="str-chat__modal-image__image" />
    </div>
  );

ModalImage.propTypes = {
  src: PropTypes.string,
};

export default ModalImage;

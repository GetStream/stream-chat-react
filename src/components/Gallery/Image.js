/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';

import ModalWrapper from './ModalWrapper';
import { sanitizeUrl } from '@braintree/sanitize-url';

/**
 * Image - Small wrapper around an image tag, supports thumbnails
 *
 * @example ../../docs/Image.md
 * @extends {React.PureComponent<import('type').ImageProps>}
 */
class ImageComponent extends React.PureComponent {
  static propTypes = {
    /** The full size image url */
    image_url: PropTypes.string,
    /** The thumb url */
    thumb_url: PropTypes.string,
    /** The text fallback for the image */
    fallback: PropTypes.string,
  };
  state = {
    modalIsOpen: false,
    currentIndex: 0,
  };

  toggleModal = () => {
    this.setState((state) => ({
      modalIsOpen: !state.modalIsOpen,
    }));
  };

  render() {
    const { image_url, thumb_url, fallback } = this.props;
    const imageSrc = sanitizeUrl(image_url || thumb_url);
    const formattedArray = [{ src: imageSrc }];
    return (
      <React.Fragment>
        <img
          className="str-chat__message-attachment--img"
          onClick={this.toggleModal}
          src={imageSrc}
          alt={fallback}
          data-testid="image-test"
        />

        <ModalWrapper
          images={formattedArray}
          toggleModal={this.toggleModal}
          index={this.state.currentIndex}
          modalIsOpen={this.state.modalIsOpen}
        />
      </React.Fragment>
    );
  }
}

export default ImageComponent;

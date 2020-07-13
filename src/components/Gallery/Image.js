/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';

import ModalWrapper from './ModalWrapper';

/**
 * Image - Small wrapper around an image tag, supports thumbnails
 *
 * @example ../../docs/Image.md
 * @extends {React.PureComponent<import('type').ImageProps>}
 */
class Image extends React.PureComponent {
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
    const formattedArray = [{ src: image_url || thumb_url }];
    return (
      <React.Fragment>
        <img
          className="str-chat__message-attachment--img"
          onClick={this.toggleModal}
          src={thumb_url || image_url}
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

export default Image;

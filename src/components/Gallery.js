import React from 'react';
import PropTypes from 'prop-types';
import Carousel, { Modal, ModalGateway } from 'react-images';

/**
 * Gallery - displays up to 6 images in a simple responsive grid with a lightbox to view the images.
 * @example ./docs/Gallery.md
 * @extends PureComponent
 */
export class Gallery extends React.PureComponent {
  static propTypes = {
    images: PropTypes.array.isRequired,
  };

  state = {
    modalIsOpen: false,
    currentIndex: 0,
  };

  toggleModal = (index) => {
    this.setState((state) => ({
      modalIsOpen: !state.modalIsOpen,
      currentIndex: index,
    }));
  };

  render() {
    const { images } = this.props;
    const formattedArray = images.map((image) => ({
      src: image.image_url || image.thumb_url,
    }));
    return (
      <div className="str-chat__gallery">
        {images.slice(0, 3).map((image, i) => (
          <div
            className="str-chat__gallery-image"
            key={`gallery-image-${i}`}
            onClick={() => this.toggleModal(i)}
          >
            <img src={image.image_url || image.thumb_url} />
          </div>
        ))}
        {images.length > 3 && (
          <div
            className="str-chat__gallery-placeholder"
            style={{
              backgroundImage: `url(${images[3].image_url})`,
            }}
            onClick={() => this.toggleModal(3)}
          >
            <p>{images.length - 3} more</p>
          </div>
        )}
        {/* <Lightbox
          images={formattedArray}
          isOpen={this.state.lightboxIsOpen}
          onClickPrev={this.gotoPrevLightboxImage}
          onClickNext={this.gotoNextLightboxImage}
          onClose={this.closeLightbox}
          backdropClosesModal
          currentImage={this.state.imageIndex}
        /> */}
        <ModalGateway>
          {this.state.modalIsOpen ? (
            <Modal onClose={this.toggleModal} closeOnBackdropClick={true}>
              <Carousel
                views={formattedArray}
                currentIndex={this.state.currentIndex}
              />
            </Modal>
          ) : null}
        </ModalGateway>
      </div>
    );
  }
}

import React from 'react';
import PropTypes from 'prop-types';
import Carousel, { Modal, ModalGateway } from 'react-images';
import { withTranslationContext } from '../../context';

/**
 * Gallery - displays up to 6 images in a simple responsive grid with a lightbox to view the images.
 * @example ../../docs/Gallery.md
 * @extends PureComponent
 */
class Gallery extends React.PureComponent {
  static propTypes = {
    images: PropTypes.arrayOf(
      PropTypes.shape({
        /** Url of the image */
        image_url: PropTypes.string,
        /** Url of thumbnail of image */
        thumb_url: PropTypes.string,
      }),
    ),
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
    const { images, t } = this.props;
    const formattedArray = images.map((image) => ({
      src: image.image_url || image.thumb_url,
    }));

    const squareClass = images.length > 3 ? 'str-chat__gallery--square' : '';

    return (
      <div className={`str-chat__gallery ${squareClass}`}>
        {images.slice(0, 3).map((image, i) => (
          <div
            data-testid="gallery-image"
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
            <p>
              {t('{{ imageCount }} more', {
                imageCount: images.length - 3,
              })}
            </p>
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

export default withTranslationContext(Gallery);

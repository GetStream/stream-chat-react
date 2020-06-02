import React from 'react';
import PropTypes from 'prop-types';
import { withTranslationContext } from '../../context';
import ImageModal from './ImageModal';

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
        <ImageModal
          images={formattedArray}
          index={this.state.currentIndex}
          toggleModal={this.toggleModal}
          modalIsOpen={this.state.modalIsOpen}
        />
      </div>
    );
  }
}

export default withTranslationContext(Gallery);

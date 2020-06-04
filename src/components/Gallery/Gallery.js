import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { withTranslationContext } from '../../context';
import ImageModal from './ImageModal';

/**
 * Gallery - displays up to 6 images in a simple responsive grid with a lightbox to view the images.
 * @example ../../docs/Gallery.md
 * @extends PureComponent
 */
const Gallery = ({ images, t }) => {
  const [index, setIndex] = useState(0);
  const [modalIsOpen, setModalOpen] = useState(false);

  const toggleModal = (selectedIndex) => {
    if (modalIsOpen) {
      setIndex(0);
      setModalOpen(false);
    } else {
      setIndex(selectedIndex);
      setModalOpen(true);
    }
  };

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
          onClick={() => toggleModal(i)}
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
          onClick={() => toggleModal(3)}
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
        index={index}
        toggleModal={toggleModal}
        modalIsOpen={modalIsOpen}
      />
    </div>
  );
};

Gallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      /** Url of the image */
      image_url: PropTypes.string,
      /** Url of thumbnail of image */
      thumb_url: PropTypes.string,
    }),
  ),
};

export default withTranslationContext(React.memo(Gallery));

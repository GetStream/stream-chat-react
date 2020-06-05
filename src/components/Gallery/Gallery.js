// @ts-check
import React, { useState, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { TranslationContext } from '../../context';
import ImageModal from './ImageModal';

/**
 * Gallery - displays up to 4 images in a simple responsive grid with a lightbox to view the images.
 * @example ../../docs/Gallery.md
 * @type import('types').Gallery
 */
const Gallery = ({ images }) => {
  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const { t } = useContext(TranslationContext);

  /**
   * @param {number} selectedIndex Index of image clicked
   */
  const toggleModal = (selectedIndex) => {
    if (modalOpen) {
      setModalOpen(false);
    } else {
      setIndex(selectedIndex);
      setModalOpen(true);
    }
  };

  // @ts-ignore
  const formattedArray = useMemo(
    () =>
      images.map((image) => ({
        src: image.image_url || image.thumb_url,
      })),
    [images],
  );

  const renderImages =
    // @ts-ignore
    images.slice(0, 3).map((image, i) => (
      <div
        data-testid="gallery-image"
        className="str-chat__gallery-image"
        key={`gallery-image-${i}`}
        onClick={() => toggleModal(i)}
      >
        <img src={image.image_url || image.thumb_url} />
      </div>
    ));

  return (
    <div
      className={`str-chat__gallery ${
        images.length > 3 ? 'str-chat__gallery--square' : ''
      }`}
    >
      {renderImages}
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
        modalIsOpen={modalOpen}
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

export default React.memo(Gallery);

// @ts-check
import React, { useState, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { TranslationContext } from '../../context';
import ModalWrapper from './ModalWrapper';

/**
 * Gallery - displays up to 4 images in a simple responsive grid with a lightbox to view the images.
 * @example ../../docs/Gallery.md
 * @typedef {import('types').GalleryProps} Props
 * @type React.FC<Props>
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

  const formattedArray = useMemo(
    () =>
      images.map((image) => ({
        src: image.image_url || image.thumb_url || '',
        source: image.image_url || image.thumb_url || '',
      })),
    [images],
  );

  const renderImages = images.slice(0, 3).map((image, i) => (
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
      <ModalWrapper
        images={formattedArray}
        index={index}
        // @ts-ignore
        toggleModal={toggleModal}
        modalIsOpen={modalOpen}
      />
    </div>
  );
};

Gallery.propTypes = {
  images: /** @type { PropTypes.Validator<import('types').GalleryProps['images']> } */ (PropTypes.arrayOf(
    PropTypes.object.isRequired,
  ).isRequired),
};

export default React.memo(Gallery);

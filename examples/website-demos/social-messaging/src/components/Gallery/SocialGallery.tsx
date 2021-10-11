import React, { useMemo, useState } from 'react';

import { GalleryProps } from 'stream-chat-react';

// import type { Attachment } from 'stream-chat';

import { SocialModalWrapper } from './SocialModal';

import { SocialAttachmentType } from '../ChatContainer/ChatContainer';

// import type { DefaultAttachmentType } from '../../types/types';

// export type GalleryProps<At extends DefaultAttachmentType = DefaultAttachmentType> = {
//   images:
//     | {
//         image_url?: string | undefined;
//         thumb_url?: string | undefined;
//       }[]
//     | Attachment<At>[];
// };

export const SocialGallery: React.FC<GalleryProps<SocialAttachmentType>> = (props) => {
  const { images } = props;

  //   const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleModal = () => {
    console.log('toggle modal modalOpen IS:', modalOpen);
    if (modalOpen) {
      setModalOpen(false);
    } else {
      //   setIndex(selectedIndex);
      setModalOpen(true);
    }
  };

  const formattedArray = useMemo(
    () =>
      images.map((image) => ({
        source: image.image_url || image.thumb_url || '',
      })),
    [images],
  );

  const renderImages = images.slice(0, 3).map((image, i) => (
    <div
      className='str-chat__gallery-image'
      key={`gallery-image-${i}`}
      onClick={() => toggleModal()}
    >
      <img alt='individual-gallery-element' src={image.image_url || image.thumb_url} />
    </div>
  ));

  return (
    <div className={`str-chat__gallery ${images.length > 3 ? 'str-chat__gallery--square' : ''}`}>
      {renderImages}
      {images.length > 3 && (
        <div
          className='str-chat__gallery-placeholder'
          onClick={() => toggleModal()}
          style={{
            backgroundImage: `url(${images[3].image_url})`,
          }}
        >
          <p>{images.length - 3} more</p>
        </div>
      )}
      <SocialModalWrapper
        images={formattedArray}
        // index={index}
        modalIsOpen={modalOpen}
        toggleModal={() => setModalOpen(!modalOpen)}
      />
    </div>
  );
};

/**
 * Displays images in a simple responsive grid with a light box to view the images.
 */
// export const SocialGallery = React.memo(UnMemoizedGallery) as typeof UnMemoizedGallery;

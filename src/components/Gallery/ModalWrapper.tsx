import React from 'react';

import ImageGallery, { ReactImageGalleryItem } from 'react-image-gallery';

// import { ModalImage } from './ModalImage';
import { Modal } from '../Modal';

/**
 * Small modal component
 */
export type ModalWrapperProps = {
  /** The images for the Carousel component */
  images: ReactImageGalleryItem[];
  /** Boolean for if modal is open*/
  modalIsOpen: boolean;
  /** click event handler for toggling modal */
  toggleModal: () => void | ((event?: React.BaseSyntheticEvent) => void);
  /** The index for the component */
  index?: number;
};

export const ModalComponent: React.FC<ModalWrapperProps> = (props) => {
  const { images, modalIsOpen, toggleModal } = props;
  // index, modalIsOpen,

  if (!Modal) return null;

  return (
    <Modal onClose={toggleModal} open={modalIsOpen}>
      <ImageGallery
        items={images}
        // defaultImage={defaultImage}
        // showBullets={true}
        // showIndex={true}
        // showThumbnails={false}
        // lazyLoad={true}
        // showPlayButton={false}
        // renderCustomControls={someComponent}
      />
    </Modal>
  );
};
